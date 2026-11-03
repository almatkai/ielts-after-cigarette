# IELTS After Cigarette (IAC) — MCP Automation Server

Этот Model Context Protocol (MCP) сервер позволяет подключать **Antigravity CLI** локально к платформе IELTS After Cigarette для автоматического парсинга, валидации и публикации тестов (Reading, Listening, Writing, Speaking).

---

## 🔑 Шаг 1. Получение API-ключа

1. Войдите в панель администратора: `https://ielts.yrys.academy/app/admin/mcp-keys`
2. Нажмите **"Создать API-ключ"**
3. Задайте имя (например, `Antigravity CLI MacBook`)
4. Скопируйте сгенерированный секретный ключ формата `iac_mcp_...`

> ⚠️ **Важно:** Создавать и отзывать ключи может **только администратор** платформы (`Role: ADMIN`).

---

## ⚙️ Шаг 2. Настройка в Antigravity CLI

Добавьте конфигурацию сервера в ваш файл конфигурации MCP (например, `~/.antigravity/antigravity.json` или в настройках агента):

```json
{
  "mcpServers": {
    "iac": {
      "command": "node",
      "args": [
        "/Users/almat/Desktop/code/ielts/mcp-server/index.mjs"
      ],
      "env": {
        "IAC_API_URL": "https://ielts.yrys.academy/api/v1",
        "IAC_API_KEY": "iac_mcp_your_secret_key_here"
      }
    }
  }
}
```

---

## 🛠️ Доступные MCP Инструменты

- `iac_ping`: Проверка связи с API IAC и валидация ключа.
- `iac_create_reading_material`: Создание структурированного IELTS Reading теста со всеми группами вопросов (Multiple Choice, TFNG, Sentence Completion, Headings и др.) и автоматической публикацией.
- `iac_import_reading_raw_text`: Парсинг сырого текста теста через внутренний движок IAC и сохранение в библиотеку.
- `iac_list_reading_materials`: Просмотр списка материалов в библиотеке.
- `iac_publish_reading_material`: Публикация черновика теста.
- `iac_create_listening_test`: Создание и публикация Listening теста.
- `iac_create_writing_material`: Создание темы и образцового эссе Writing (Task 1 / Task 2).
- `iac_create_speaking_material`: Создание темы и карточки Speaking (Part 1, 2, 3).
- `iac_upload_audio`: Загрузка аудиозаписей (.mp3, .m4a, .wav, .ogg, .webm) для Listening тестов напрямую из локального файла или URL с получением `audioAssetId`.
- `iac_upload_image`: Загрузка графиков, диаграмм, карт и картинок (.png, .jpg, .webp) для Writing Task 1 или вопросов Reading/Listening с получением `visualAssetId`.

---

## 🚀 Как использовать с Antigravity CLI

Когда MCP-сервер подключен к вашему агенту, вы можете просто написать агенту в терминале:

> *"Спарси тест по чтению с https://mini-ielts.com/1234/reading/the-future-of-work и добавь его в нашу систему IAC"*

Агент автоматически:
1. Вызовет навык `ielts-material-parser` и спарсит текст и вопросы по URL.
2. Проверит форматирование, цитаты и объяснения.
3. Вызовет инструмент `iac_create_reading_material` и загрузит тест прямо в библиотеку материалов.
4. Выдаст готовую ссылку на опубликованный материал в админке!
