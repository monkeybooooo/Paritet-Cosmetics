/**
 * Скрипт для удаления фона с изображений товаров
 *
 * Использует API remove.bg для автоматического удаления фона
 *
 * Установка:
 * npm install axios form-data
 *
 * Использование:
 * 1. Получите бесплатный API ключ на https://www.remove.bg/api
 * 2. Установите переменную окружения: export REMOVEBG_API_KEY="ваш_ключ"
 * 3. Запустите: node scripts/remove-background.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_KEY = process.env.REMOVEBG_API_KEY;
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');
const OUTPUT_DIR = path.join(__dirname, '../public/uploads-no-bg');

if (!API_KEY) {
    console.error('❌ Ошибка: Не указан API ключ');
    console.log('\nПолучите бесплатный API ключ на https://www.remove.bg/api');
    console.log('Затем запустите: export REMOVEBG_API_KEY="ваш_ключ"');
    process.exit(1);
}

// Создаем папку для обработанных изображений
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function removeBackground(inputPath, outputPath) {
    const formData = new FormData();
    formData.append('image_file', fs.createReadStream(inputPath));
    formData.append('size', 'auto');

    try {
        const response = await axios({
            method: 'post',
            url: 'https://api.remove.bg/v1.0/removebg',
            data: formData,
            responseType: 'arraybuffer',
            headers: {
                ...formData.getHeaders(),
                'X-Api-Key': API_KEY,
            },
            encoding: null
        });

        fs.writeFileSync(outputPath, response.data);
        return true;
    } catch (error) {
        if (error.response) {
            console.error(`Ошибка API: ${error.response.status} - ${error.response.statusText}`);
        } else {
            console.error(`Ошибка: ${error.message}`);
        }
        return false;
    }
}

async function processImages() {
    const files = fs.readdirSync(UPLOADS_DIR).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.png', '.jpg', '.jpeg'].includes(ext);
    });

    console.log(`📦 Найдено ${files.length} изображений для обработки\n`);

    let processed = 0;
    let failed = 0;

    for (const file of files) {
        const inputPath = path.join(UPLOADS_DIR, file);
        const outputPath = path.join(OUTPUT_DIR, file.replace(/\.(jpg|jpeg)$/i, '.png'));

        // Пропускаем thumbnail и другие версии
        if (file.includes('thumbnail_') || file.includes('small_') ||
            file.includes('medium_') || file.includes('large_')) {
            continue;
        }

        console.log(`⏳ Обработка: ${file}`);
        const success = await removeBackground(inputPath, outputPath);

        if (success) {
            console.log(`✅ Готово: ${file}\n`);
            processed++;
        } else {
            console.log(`❌ Ошибка: ${file}\n`);
            failed++;
        }

        // Задержка между запросами (free plan: 50 изображений/месяц, 1 запрос/сек)
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    console.log('\n=== Результаты ===');
    console.log(`✅ Обработано: ${processed}`);
    console.log(`❌ Ошибок: ${failed}`);
    console.log(`\n📁 Результаты сохранены в: ${OUTPUT_DIR}`);
    console.log('\nСледующие шаги:');
    console.log('1. Проверьте изображения в папке uploads-no-bg');
    console.log('2. Если все ок, скопируйте их обратно в uploads:');
    console.log('   cp public/uploads-no-bg/* public/uploads/');
}

processImages().catch(console.error);
