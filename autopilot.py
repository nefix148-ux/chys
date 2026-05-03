import os
import sys
import json
import time
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple, List

from PIL import Image
from groq import Groq
from playwright.sync_api import sync_playwright

# Moondream — новый API (версия 0.2+)
import moondream as md


# ==================== КОНФИГУРАЦИЯ (Render Environment Variables) ====================

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
MOONDREAM_MODEL_PATH = os.environ.get("MOONDREAM_MODEL_PATH", "./moondream-2b-int8")

GROQ_DAILY_LIMIT = int(os.environ.get("GROQ_DAILY_LIMIT", "14400"))
GROQ_MIN_REMAINING = int(os.environ.get("GROQ_MIN_REMAINING", "100"))
MOONDREAM_MAX_RETRIES = int(os.environ.get("MOONDREAM_MAX_RETRIES", "3"))
GROQ_MAX_RETRIES = int(os.environ.get("GROQ_MAX_RETRIES", "3"))
MAX_ITERATIONS_PER_STAGE = int(os.environ.get("MAX_ITERATIONS_PER_STAGE", "5"))

GAME_HTML_PATH = "game.html"
SCREENSHOT_PATH = "screenshot.png"
STATE_FILE = "pilot_state.json"
LOG_FILE = "pilot_log.txt"

DEFAULT_STAGES = [
    {
        "name": "Базовая сцена",
        "task": "Создай HTML5-страницу с canvas и заголовком игры по центру. Тёмный фон. Больше ничего не нужно.",
        "check": "Виден ли canvas и заголовок? Страница не пустая и не белая?"
    },
    {
        "name": "Игровой объект",
        "task": "Добавь игровой объект: красный квадрат 50x50 пикселей в центре canvas. Он пока не двигается.",
        "check": "Виден ли красный квадрат в центре canvas?"
    },
    {
        "name": "Управление",
        "task": "Добавь управление: стрелки двигают красный квадрат. Границы canvas — стены.",
        "check": "Двигается ли квадрат при нажатии стрелок? Не выходит ли за границы?"
    },
    {
        "name": "Игровая логика",
        "task": "Добавь зелёные круги (цели), которые появляются в случайных местах. При касании квадрата — цель исчезает, счёт +1.",
        "check": "Появляются ли зелёные круги? Исчезают ли при касании? Счётчик обновляется?"
    },
    {
        "name": "Визуал и полировка",
        "task": "Улучши внешний вид: неоновые цвета, счётчик крупно сверху, эффект частиц при сборе цели, плавное движение.",
        "check": "Выглядит ли игра завершённой? Приятный ли визуал? Нет ли съехавших элементов?"
    }
]

DEFAULT_TASK = "Создай простую браузерную игру"


# ==================== ЛОГИРОВАНИЕ ====================

def log(msg: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")


# ==================== СОСТОЯНИЕ ====================

class PilotState:
    def __init__(self, state_file: str):
        self.state_file = state_file
        self.data = self._load()
    
    def _load(self) -> dict:
        if Path(self.state_file).exists():
            with open(self.state_file, "r") as f:
                return json.load(f)
        return {
            "groq_requests_used": 0,
            "groq_errors_in_row": 0,
            "moondream_errors_in_row": 0,
            "moondream_healthy": True,
            "current_stage": 0,
            "stage_iterations": 0,
            "total_iterations": 0,
            "status": "idle",
            "stop_reason": "",
            "last_reset_date": datetime.now().strftime("%Y-%m-%d"),
            "game_hash": "",
            "no_change_count": 0,
            "stages_completed": []
        }
    
    def save(self):
        with open(self.state_file, "w") as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)
    
    def reset_daily(self):
        today = datetime.now().strftime("%Y-%m-%d")
        if self.data["last_reset_date"] != today:
            log("🔄 Новый день — сброс счётчиков")
            self.data["groq_requests_used"] = 0
            self.data["groq_errors_in_row"] = 0
            self.data["moondream_errors_in_row"] = 0
            self.data["last_reset_date"] = today
            self.data["status"] = "idle"
            self.data["stop_reason"] = ""
            self.save()
    
    def groq_can_request(self) -> Tuple[bool, str]:
        remaining = GROQ_DAILY_LIMIT - self.data["groq_requests_used"]
        if remaining <= 0:
            return False, "Groq: дневной лимит 0"
        if remaining < GROQ_MIN_REMAINING:
            return False, f"Groq: осталось {remaining} < {GROQ_MIN_REMAINING}"
        if self.data["groq_errors_in_row"] >= GROQ_MAX_RETRIES:
            return False, f"Groq: {self.data['groq_errors_in_row']} ошибок подряд"
        return True, "ok"
    
    def groq_done(self, success: bool):
        if success:
            self.data["groq_requests_used"] += 1
            self.data["groq_errors_in_row"] = 0
        else:
            self.data["groq_errors_in_row"] += 1
        self.save()
    
    def groq_remaining(self) -> int:
        return max(0, GROQ_DAILY_LIMIT - self.data["groq_requests_used"])
    
    def moondream_can_request(self) -> Tuple[bool, str]:
        if not self.data["moondream_healthy"]:
            return False, "Moondream: помечена нездоровой"
        if self.data["moondream_errors_in_row"] >= MOONDREAM_MAX_RETRIES:
            return False, f"Moondream: {self.data['moondream_errors_in_row']} ошибок подряд"
        return True, "ok"
    
    def moondream_done(self, success: bool):
        if success:
            self.data["moondream_errors_in_row"] = 0
        else:
            self.data["moondream_errors_in_row"] += 1
            if self.data["moondream_errors_in_row"] >= MOONDREAM_MAX_RETRIES:
                self.data["moondream_healthy"] = False
        self.save()
    
    def stage_done(self, stage_name: str):
        self.data["current_stage"] += 1
        self.data["stage_iterations"] = 0
        self.data["stages_completed"].append(stage_name)
        self.data["no_change_count"] = 0
        self.save()
    
    def iteration_done(self):
        self.data["stage_iterations"] += 1
        self.data["total_iterations"] += 1
        self.save()
    
    def can_continue_stage(self) -> Tuple[bool, str]:
        if self.data["status"] == "stopped":
            return False, f"Стоп: {self.data['stop_reason']}"
        if self.data["stage_iterations"] >= MAX_ITERATIONS_PER_STAGE:
            return False, f"Лимит итераций этапа ({MAX_ITERATIONS_PER_STAGE})"
        can_g, reason_g = self.groq_can_request()
        if not can_g:
            self.stop(reason_g)
            return False, reason_g
        can_m, reason_m = self.moondream_can_request()
        if not can_m:
            self.stop(reason_m)
            return False, reason_m
        return True, "ok"
    
    def stop(self, reason: str):
        self.data["status"] = "stopped"
        self.data["stop_reason"] = reason
        self.save()
        log(f"🛑 СТОП: {reason}")
    
    def update_hash(self, code: str) -> bool:
        new_hash = hashlib.md5(code.encode()).hexdigest()
        changed = self.data["game_hash"] != new_hash
        self.data["game_hash"] = new_hash
        self.save()
        return changed


# ==================== МОДЕЛИ ====================

def init_groq() -> Optional[Groq]:
    if not GROQ_API_KEY:
        log("❌ GROQ_API_KEY не задан в Environment Variables")
        return None
    try:
        client = Groq(api_key=GROQ_API_KEY)
        log("✅ Groq готов")
        return client
    except Exception as e:
        log(f"❌ Groq ошибка: {e}")
        return None


def init_moondream():
    """
    Инициализация Moondream.
    Пробуем новый API (moondream 0.2+):
      model = md.vl(model=...)
    Если не работает — пробуем старый:
      model = md.VL(model=...)
    """
    try:
        # Новый API (moondream >= 0.2.0)
        model = md.vl(model=MOONDREAM_MODEL_PATH)
        log("✅ Moondream готов (новый API: md.vl)")
        return model
    except AttributeError:
        try:
            # Старый API
            model = md.VL(model=MOONDREAM_MODEL_PATH)
            log("✅ Moondream готов (старый API: md.VL)")
            return model
        except Exception as e:
            log(f"❌ Moondream ошибка (старый API): {e}")
            return None
    except Exception as e:
        log(f"❌ Moondream ошибка: {e}")
        return None


# ==================== ДЕЙСТВИЯ ====================

def screenshot(state: PilotState) -> bool:
    log("📸 Скриншот...")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 720})
            page.goto(f"file://{os.path.abspath(GAME_HTML_PATH)}")
            page.wait_for_timeout(3000)
            page.screenshot(path=SCREENSHOT_PATH, full_page=False)
            browser.close()
        log("✅ OK")
        return True
    except Exception as e:
        log(f"❌ {e}")
        Image.new("RGB", (1280, 720), (255, 0, 0)).save(SCREENSHOT_PATH)
        return False


def moondream_check(moon, check_question: str, state: PilotState) -> Optional[str]:
    can, reason = state.moondream_can_request()
    if not can:
        log(f"⏸️ Moondream: {reason}")
        return None
    
    log("🔍 Moondream проверяет этап...")
    try:
        image = Image.open(SCREENSHOT_PATH)
        prompt = f"""Ты — строгий QA-тестер HTML5-игры.
Вопрос по текущему этапу: {check_question}

Ответь на русском:
1. Что ты видишь на скриншоте?
2. Выполнена ли задача этапа?
3. Конкретные проблемы (если есть).
4. Если всё идеально — скажи "STAGE_OK"."""
        
        result = moon.query(image, prompt)["answer"]
        state.moondream_done(True)
        log(f"📋 {result[:300]}")
        return result
    except Exception as e:
        log(f"❌ {e}")
        state.moondream_done(False)
        return None


def groq_work(groq: Groq, code: str, task: str, is_new_stage: bool, state: PilotState) -> Optional[str]:
    can, reason = state.groq_can_request()
    if not can:
        log(f"⏸️ Groq: {reason}")
        return None
    
    if is_new_stage:
        system = "Ты эксперт HTML5-игр. Пиши ПОЛНЫЙ HTML с CSS и JS внутри. Никаких markdown. Только код от <!DOCTYPE html> до </html>."
        user = f"Текущий код игры:\n```html\n{code}\n```\n\nНОВАЯ ЗАДАЧА ЭТАПА:\n{task}\n\nДобавь это к существующему коду. Выдай ПОЛНЫЙ HTML-файл."
        log(f"🎲 Groq: новый этап — {task[:100]}...")
    else:
        system = "Ты чинишь баги в HTML5-играх. Выдаёшь ПОЛНЫЙ исправленный HTML. Без markdown. Только код."
        user = f"Код игры:\n```html\n{code[:6000]}\n```\n\nБаг-репорт от QA:\n{task}\n\nИсправь ВСЁ. Выдай ПОЛНЫЙ HTML."
        log("🔧 Groq: чинит...")
    
    try:
        resp = groq.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=0.3,
            max_tokens=8000
        )
        code = resp.choices[0].message.content.strip()
        if code.startswith("```html"):
            code = code[7:]
        if code.endswith("```"):
            code = code[:-3]
        state.groq_done(True)
        log(f"✅ {len(code)} символов")
        return code.strip()
    except Exception as e:
        log(f"❌ {e}")
        state.groq_done(False)
        return None


def groq_review(groq: Groq, code: str, state: PilotState) -> Optional[str]:
    can, reason = state.groq_can_request()
    if not can:
        return None
    try:
        resp = groq.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[{"role": "system", "content": "Оцени готовую HTML5-игру. Обзор на русском: плюсы, минусы, оценка 1-10."},
                      {"role": "user", "content": f"Код: {code[:4000]}\nОбзор:"}],
            temperature=0.5,
            max_tokens=1000
        )
        state.groq_done(True)
        return resp.choices[0].message.content
    except:
        state.groq_done(False)
        return None


# ==================== ГЛАВНЫЙ ЦИКЛ ====================

def main():
    log("=" * 60)
    log("🚀 DUNG EONS & AI — АВТОПИЛОТ (поэтапная разработка)")
    log(f"   Groq лимит: {GROQ_DAILY_LIMIT} | мин.остаток: {GROQ_MIN_REMAINING}")
    log(f"   Макс. итераций на этап: {MAX_ITERATIONS_PER_STAGE}")
    log("=" * 60)
    
    state = PilotState(STATE_FILE)
    state.reset_daily()
    
    if state.data["status"] == "stopped":
        log(f"⚠️ Процесс остановлен: {state.data['stop_reason']}")
        log("Удали pilot_state.json чтобы сбросить.")
        return
    
    groq = init_groq()
    moon = init_moondream()
    if not groq:
        state.stop("Groq не доступен")
        return
    if not moon:
        state.stop("Moondream не доступен")
        return
    
    state.data["status"] = "running"
    state.save()
    
    stages_raw = os.environ.get("GAME_STAGES", "")
    if stages_raw:
        try:
            stages = json.loads(stages_raw)
        except:
            log("⚠️ GAME_STAGES невалидный JSON, использую DEFAULT_STAGES")
            stages = DEFAULT_STAGES
    else:
        stages = DEFAULT_STAGES
    
    task_description = os.environ.get("GAME_TASK", DEFAULT_TASK)
    log(f"📝 Игра: {task_description}")
    log(f"📋 Этапов: {len(stages)}")
    
    current_code = ""
    if Path(GAME_HTML_PATH).exists():
        with open(GAME_HTML_PATH, "r", encoding="utf-8") as f:
            current_code = f.read()
        log(f"📂 game.html загружен ({len(current_code)} символов)")
    
    if state.data["stages_completed"]:
        log(f"✅ Пройдено: {', '.join(state.data['stages_completed'])}")
    
    for stage_idx in range(state.data["current_stage"], len(stages)):
        stage = stages[stage_idx]
        log(f"\n{'='*50}")
        log(f"📦 ЭТАП {stage_idx+1}/{len(stages)}: {stage['name']}")
        log(f"   Задача: {stage['task'][:100]}...")
        log(f"{'='*50}")
        
        state.data["stage_iterations"] = 0
        state.save()
        
        no_bug_streak = 0
        
        while True:
            can, reason = state.can_continue_stage()
            if not can:
                log(f"⏸️ {reason}")
                break
            
            it = state.data["stage_iterations"] + 1
            log(f"\n--- Итерация этапа {it}/{MAX_ITERATIONS_PER_STAGE} ---")
            log(f"   Groq осталось: {state.groq_remaining()}")
            log(f"   Ошибки Groq/Moondream: {state.data['groq_errors_in_row']}/{state.data['moondream_errors_in_row']}")
            
            if not current_code:
                current_code = groq_work(groq, "", stage["task"], True, state)
                if not current_code:
                    time.sleep(30)
                    continue
                with open(GAME_HTML_PATH, "w", encoding="utf-8") as f:
                    f.write(current_code)
                log("💾 Сохранено")
                continue
            
            screenshot(state)
            
            report = moondream_check(moon, stage["check"], state)
            if report is None:
                time.sleep(30)
                continue
            
            if "STAGE_OK" in report.upper():
                no_bug_streak += 1
                log(f"✅ STAGE_OK (подряд: {no_bug_streak})")
                if no_bug_streak >= 2:
                    log(f"🎉 ЭТАП '{stage['name']}' ЗАВЕРШЁН")
                    state.stage_done(stage["name"])
                    break
                else:
                    state.iteration_done()
                    continue
            else:
                no_bug_streak = 0
            
            new_code = groq_work(groq, current_code, report, False, state)
            if not new_code:
                time.sleep(30)
                continue
            
            changed = state.update_hash(new_code)
            if not changed:
                state.data["no_change_count"] += 1
                if state.data["no_change_count"] >= 3:
                    log("🛑 Зацикливание — код не меняется")
                    state.stop("Зацикливание")
                    break
            else:
                state.data["no_change_count"] = 0
            
            current_code = new_code
            with open(GAME_HTML_PATH, "w", encoding="utf-8") as f:
                f.write(current_code)
            log("💾 Сохранено")
            
            state.iteration_done()
            time.sleep(2)
        
        if state.data["status"] == "stopped":
            break
    
    with open(GAME_HTML_PATH, "w", encoding="utf-8") as f:
        f.write(current_code)
    
    log(f"\n{'='*60}")
    log("🏁 ГОТОВО")
    log(f"   Этапов: {len(state.data['stages_completed'])}/{len(stages)}")
    log(f"   Итераций всего: {state.data['total_iterations']}")
    log(f"   Запросов Groq: {state.data['groq_requests_used']}")
    log(f"   Статус: {state.data['status']}")
    log(f"   Причина: {state.data['stop_reason'] or 'Завершено'}")
    log(f"{'='*60}")
    
    review = groq_review(groq, current_code, state)
    if review:
        log(f"\n📊 ОБЗОР:\n{review}")
    
    log(f"\n✅ game.html готов. Открой в браузере.")


if __name__ == "__main__":
    main()
