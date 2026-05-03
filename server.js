const express = require('express');
const puppeteer = require('puppeteer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Healthcheck (обязательно для Render)
app.get('/', (req, res) => {
    res.send('Dung Eons Tester работает ✅');
});

// Запуск теста
app.get('/test', async (req, res) => {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // важно для Render
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Здесь загружаешь свою игру
        await page.goto('https://твой-сайт-с-игрой.com');
        
        // Делаешь скриншот
        const screenshot = await page.screenshot({ encoding: 'base64' });
        
        // Отправляешь в Moondream
        const moondreamResponse = await fetch('https://api.moondream.ai/v1/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Moondream-Auth': process.env.MOONDREAM_TOKEN
            },
            body: JSON.stringify({
                image_url: `data:image/png;base64,${screenshot}`,
                question: 'Есть ли красный куб на сцене?'
            })
        });
        
        const result = await moondreamResponse.json();
        
        await browser.close();
        
        res.json({
            success: true,
            moondream_answer: result.answer,
            screenshot_size: screenshot.length
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Тестер запущен на порту ${PORT}`);
});
