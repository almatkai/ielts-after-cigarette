import type { TranslationMap } from './i18n-types'

export const dashboardTranslations: TranslationMap = {
  // Exam date picker
  '+1 мес.': { kk: '+1 ай', en: '+1 mo' },
  '+2 мес.': { kk: '+2 ай', en: '+2 mo' },
  '+3 мес.': { kk: '+3 ай', en: '+3 mo' },
  '+6 мес.': { kk: '+6 ай', en: '+6 mo' },

  // AI assistant quick prompts
  'Критерии Writing Task 2': {
    kk: 'Writing Task 2 критерийлері',
    en: 'Writing Task 2 criteria',
  },
  'Разница True / False / Not Given': {
    kk: 'True / False / Not Given айырмашылығы',
    en: 'Difference between True / False / Not Given',
  },
  'Как готовить Speaking Part 2?': {
    kk: 'Speaking Part 2-ге қалай дайындалуға болады?',
    en: 'How to prepare for Speaking Part 2?',
  },
  'Тайм-менеджмент в Reading': {
    kk: 'Reading-тағы уақытты басқару',
    en: 'Time management in Reading',
  },
  'Расчёт Band Score': {
    kk: 'Band Score есептеу',
    en: 'Calculating Band Score',
  },
  'Структура Writing Task 1': {
    kk: 'Writing Task 1 құрылымы',
    en: 'Writing Task 1 structure',
  },
  'Советы для Listening Part 4': {
    kk: 'Listening Part 4 бойынша кеңестер',
    en: 'Tips for Listening Part 4',
  },
  'Как избежать ошибок в spelling?': {
    kk: 'Spelling қателерінен қалай сақтануға болады?',
    en: 'How to avoid spelling mistakes?',
  },

  // AI assistant chat (Yuki speaks informally on purpose)
  'Привет! Меня зовут Юки 🦊 — я твой наставник по IELTS. Могу подсказать структуру эссе, разобрать критерии Band Descriptors, объяснить логику вопросов в Reading и дать советы по таймингу. Что тебя интересует?':
    {
      kk: 'Сәлем! Менің атым Юки 🦊 — мен сенің IELTS тәлімгеріңмін. Эссе құрылымын ұсына аламын, Band Descriptors критерийлерін талдап беремін, Reading-тағы сұрақтардың логикасын түсіндіремін және уақытты дұрыс бөлу бойынша кеңес бере аламын. Сені не қызықтырады?',
      en: 'Hi! My name is Yuki 🦊 — I’m your IELTS mentor. I can suggest an essay structure, break down the Band Descriptors criteria, explain the logic behind Reading questions, and share timing tips. What would you like to know?',
    },
  сейчас: { kk: 'қазір', en: 'now' },
  'Соединение с чатом прервалось. Проверь подключение и попробуй ещё раз.': {
    kk: 'Чат байланысы үзілді. Интернет байланысын тексеріп, қайта байқап көр.',
    en: 'The chat connection dropped. Check your connection and try again.',
  },
  'Потяните для изменения размера (дважды кликните для переключения)': {
    kk: 'Өлшемін өзгерту үшін сүйреңіз (ауыстыру үшін екі рет басыңыз)',
    en: 'Drag to resize (double-click to toggle)',
  },
  'Изменить размер окна': {
    kk: 'Терезе өлшемін өзгерту',
    en: 'Resize window',
  },
  'Потяните для изменения высоты': {
    kk: 'Биіктігін өзгерту үшін сүйреңіз',
    en: 'Drag to change height',
  },
  'Потяните для изменения ширины': {
    kk: 'Енін өзгерту үшін сүйреңіз',
    en: 'Drag to change width',
  },
  'Дважды кликните, чтобы увеличить или уменьшить окно': {
    kk: 'Терезені үлкейту немесе кішірейту үшін екі рет басыңыз',
    en: 'Double-click to expand or collapse the window',
  },
  Юки: { kk: 'Юки', en: 'Yuki' },
  'Онлайн наставник': { kk: 'Онлайн тәлімгер', en: 'Online mentor' },
  'Очистить диалог': { kk: 'Диалогты тазалау', en: 'Clear conversation' },
  'Закрыть чат': { kk: 'Чатты жабу', en: 'Close chat' },
  'Юки думает...': { kk: 'Юки ойлануда...', en: 'Yuki is thinking...' },
  'Прокрутить темы влево': {
    kk: 'Тақырыптарды солға жылжыту',
    en: 'Scroll topics left',
  },
  'Прокрутить темы вправо': {
    kk: 'Тақырыптарды оңға жылжыту',
    en: 'Scroll topics right',
  },
  'Спроси Юки о подготовке к IELTS...': {
    kk: 'Юкиден IELTS дайындығы туралы сұра...',
    en: 'Ask Yuki about IELTS preparation...',
  },
  Отправить: { kk: 'Жіберу', en: 'Send' },

  // AI assistant floating widget
  'Загружаем чат Юки…': {
    kk: 'Юки чаты жүктелуде…',
    en: 'Loading Yuki’s chat…',
  },
  'Открыть чат с Юки': {
    kk: 'Юкимен чат ашу',
    en: 'Open chat with Yuki',
  },
  'Скрыть подсказку': { kk: 'Кеңесті жасыру', en: 'Hide hint' },
  'Привет! Меня зовут': { kk: 'Сәлем! Менің атым', en: 'Hi! My name is' },
  '— я твой наставник по IELTS.': {
    kk: '— мен сенің IELTS тәлімгеріңмін.',
    en: '— I’m your IELTS mentor.',
  },
  'Открыть чат': { kk: 'Чат ашу', en: 'Open chat' },
  'Скрыть питомца': { kk: 'Түлкіні жасыру', en: 'Hide the fox' },
  'Открыть чат с Юки (включить питомца можно в Настройках)': {
    kk: 'Юкимен чат ашу (түлкіні Баптаулардан қосуға болады)',
    en: 'Open chat with Yuki (you can turn the fox back on in Settings)',
  },

  // Root/misc routes
  'Открываем IELTS…': { kk: 'IELTS ашылуда…', en: 'Opening IELTS…' },
  'Недостаточно прав': {
    kk: 'Құқықтар жеткіліксіз',
    en: 'Insufficient permissions',
  },
  'Этот раздел доступен редакторам и администраторам платформы.': {
    kk: 'Бұл бөлім платформаның редакторлары мен әкімшілеріне қолжетімді.',
    en: 'This section is available to the platform’s editors and administrators.',
  },
  'Вернуться в кабинет': { kk: 'Кабинетке оралу', en: 'Back to dashboard' },
}
