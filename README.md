# Dung Eons Tester

Автоматический тестировщик для игры Dung Eons & AI.
Делает скриншоты игры и анализирует их через Moondream API.

## Установка

1. Клонируй репозиторий
2. `npm install`
3. Создай файл `.env` с токеном Moondream
4. `node server.js`

## Использование

Отправь POST-запрос на `/test`:

```json
{
  "url": "https://твоя-игра.com",
  "question": "Есть ли красный куб на сцене?"
}
