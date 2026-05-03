const express = require('express');
const puppeteer = require('puppeteer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для JSON
app.use(express.json());

// ============================================================
// ГЛАВНАЯ СТРАНИЦА
// ============================================================
app.get('/', (req, res) => {
    const tokenStatus = process.env.MOONDREAM_TOKEN 
        ? '✅ Токен Moondream загружен' 
        : '❌ ТОКЕН НЕ НАЙДЕН';
    
    res.send(`
        <h1>🐉 Dung Eons Tester</h1>
        <p>Статус: ${tokenStatus}</p>
        <p>Эндпоинты:</p>
        <ul>
            <li><code>GET /</code> — эта страница</li>
            <li><code>GET /health</code> — здоровье сервера</li>
            <li><code>POST /test</code> — запустить тест (отправь JSON с url и question)</li>
        </ul>
    `);
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        token: process.env.MOONDREAM_TOKEN ? 'present' : 'missing',
        timestamp: new Date().toISOString()
    });
});

// ============================================================
// ЗАПУСТИТЬ ТЕСТ
// ============================================================
app.post('/test', async (req, res) => {
    const { url, question } = req.body;
    
    // Проверяем что прислали
    if (!url) {
        return res.status(400).json({ error: 'Нужен url игры' });
    }
    if (!question) {
        return res.status(400).json({ error: 'Нужен вопрос для анализа скриншота' });
    }
    if (!process.env.MOONDREAM_TOKEN) {
        return res.status(500).json({ error: 'Токен Moondream не настроен' });
    }
    
    console.log(`🧪 Запускаю тест: ${url}`);
    console.log(`❓ Вопрос: ${question}`);
    
    try {
        // === Шаг 1: Открываем браузер ===
        console.log('📱 Запускаю браузер...');
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // === Шаг 2: Загружаем игру ===
        console.log(`🌐 Загружаю: ${url}`);
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Ждём загрузки
        await page.waitForTimeout(3000);
        
        // === Шаг 3: Делаем скриншот ===
        console.log('📸 Делаю скриншот...');
        const screenshot = await page.screenshot({ 
            encoding: 'base64',
            fullPage: false 
        });
        
        console.log(`📸 Скриншот: ${(screenshot.length / 1024).toFixed(1)} КБ`);
        
        // === Шаг 4: Отправляем в Moondream ===
        console.log('🤖 Отправляю в Moondream...');
        
        const moondreamResponse = await fetch('https://api.moondream.ai/v1/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Moondream-Auth': process.env.MOONDREAM_TOKEN
            },
            body: JSON.stringify({
                image_url: `data:image/png;base64,${screenshot}`,
                question: question
            })
        });
        
        const moondreamResult = await moondreamResponse.json();
        console.log(`🤖 Ответ Moondream: ${JSON.stringify(moondreamResult)}`);
        
        // === Шаг 5: Закрываем браузер ===
        await browser.close();
        console.log('✅ Тест завершён');
        
        // === Шаг 6: Возвращаем результат ===
        res.json({
            success: true,
            question: question,
            answer: moondreamResult.answer || moondreamResult,
            screenshot_size_kb: (screenshot.length / 1024).toFixed(1),
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        
        // Закрываем браузер если он ещё открыт
        try { await browser?.close(); } catch {}
        
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============================================================
// ЗАПУСК СЕРВЕРА
// ============================================================
app.listen(PORT, () => {
    console.log('');
    console.log('🐉 Dung Eons Tester запущен');
    console.log(`🔗 http://localhost:${PORT}`);
    console.log(`🔑 Токен Moondream: ${process.env.MOONDREAM_TOKEN ? '✅ загружен' : '❌ ОТСУТСТВУЕТ'}`);
    console.log('');
});
