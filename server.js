const express = require('express');
const puppeteer = require('puppeteer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ============================================================
// ГЛАВНАЯ СТРАНИЦА
// ============================================================
app.get('/', (req, res) => {
    const tokenStatus = process.env.MOONDREAM_TOKEN
        ? '✅ Токен Moondream загружен'
        : '❌ ТОКЕН НЕ НАЙДЕН';

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Dung Eons Tester</title>
            <style>
                body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
                input, button { padding: 10px; margin: 5px; font-size: 16px; }
                input { width: 100%; box-sizing: border-box; }
                button { cursor: pointer; background: #4CAF50; color: white; border: none; border-radius: 5px; }
                button:hover { background: #45a049; }
                #result { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px; white-space: pre-wrap; font-family: monospace; }
            </style>
        </head>
        <body>
            <h1>🐉 Dung Eons Tester</h1>
            <p>Статус: ${tokenStatus}</p>
            <h3>Запустить тест</h3>
            <input id="url" placeholder="URL игры" value="https://example.com">
            <input id="question" placeholder="Вопрос для AI" value="Что изображено на скриншоте?">
            <button onclick="runTest()">Запустить тест</button>
            <div id="result">Результат появится здесь...</div>
            <script>
                async function runTest() {
                    const resultDiv = document.getElementById('result');
                    resultDiv.textContent = '⏳ Запускаю тест...';
                    try {
                        const response = await fetch('/test', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                url: document.getElementById('url').value,
                                question: document.getElementById('question').value
                            })
                        });
                        const data = await response.json();
                        resultDiv.textContent = JSON.stringify(data, null, 2);
                    } catch (error) {
                        resultDiv.textContent = '❌ Ошибка: ' + error.message;
                    }
                }
            </script>
        </body>
        </html>
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

    if (!url) return res.status(400).json({ error: 'Нужен url игры' });
    if (!question) return res.status(400).json({ error: 'Нужен вопрос для анализа' });
    if (!process.env.MOONDREAM_TOKEN) return res.status(500).json({ error: 'Токен Moondream не настроен' });

    console.log(`🧪 Запускаю тест: ${url}`);
    console.log(`❓ Вопрос: ${question}`);

    let browser;
    try {
        // Запускаем браузер
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath()
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // Загружаем страницу
        console.log(`🌐 Загружаю: ${url}`);
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        await page.waitForTimeout(3000);

        // Скриншот
        console.log('📸 Делаю скриншот...');
        const screenshot = await page.screenshot({ encoding: 'base64' });
        console.log(`📸 Скриншот: ${(screenshot.length / 1024).toFixed(1)} КБ`);

        // Отправляем в Moondream
        console.log('🤖 Отправляю в Moondream...');
        const moondreamRes = await fetch('https://api.moondream.ai/v1/query', {
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

        const moondreamData = await moondreamRes.json();
        console.log(`🤖 Ответ: ${JSON.stringify(moondreamData)}`);

        await browser.close();

        res.json({
            success: true,
            question: question,
            answer: moondreamData.answer || moondreamData,
            screenshot_kb: (screenshot.length / 1024).toFixed(1),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        try { await browser?.close(); } catch {}

        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============================================================
// ЗАПУСК
// ============================================================
app.listen(PORT, () => {
    console.log(`🐉 Dung Eons Tester запущен на порту ${PORT}`);
    console.log(`🔑 Токен: ${process.env.MOONDREAM_TOKEN ? '✅ загружен' : '❌ ОТСУТСТВУЕТ'}`);
    console.log(`🔗 http://localhost:${PORT}`);
});
