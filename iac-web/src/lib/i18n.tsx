import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import type { ReactNode } from 'react'

import type { Language, TranslationMap } from './i18n-types'
import { adminContentTranslations } from './i18n-admin-content'
import { adminCoreTranslations } from './i18n-admin-core'
import { authTranslations } from './i18n-auth'
import { billingTranslations } from './i18n-billing'
import { blogTranslations } from './i18n-blog'
import { dashboardTranslations } from './i18n-dashboard'
import { legalPrivacyTranslations } from './i18n-legal-privacy'
import { legalTermsTranslations } from './i18n-legal-terms'
import { reviewTranslations } from './i18n-review'

export type { Language, TranslationEntry, TranslationMap } from './i18n-types'

const LANGUAGE_STORAGE_KEY = 'daiyndyq-language'

let activeLanguage: Language = 'ru'

// Database-saved learning content (hints, explanations) keyed by its Russian
// source text. Kept separate so review route chunks can carry the bulk of the
// translations without bloating the main bundle.
const contentTranslations: TranslationMap = {}

export function registerContentTranslations(map: TranslationMap) {
  Object.assign(contentTranslations, map)
}

/**
 * Non-hook translation for strings rendered outside React components
 * (error payloads, helpers, refs). Falls back to the source string, so
 * English-only exam strings pass through unchanged.
 */
export function tr(source: string): string {
  return (
    contentTranslations[source]?.[activeLanguage] ??
    translations[source]?.[activeLanguage] ??
    source
  )
}

const baseTranslations: TranslationMap = {
  'Блог Yrys Academy': { kk: 'Yrys Academy блогы', en: 'Yrys Academy blog' },
  'Блог Yrys Academy: стратегии и опыт подготовки к IELTS': {
    kk: 'Yrys Academy блогы: IELTS-ке дайындық стратегиялары мен тәжірибесі',
    en: 'Yrys Academy blog: IELTS preparation strategies and experience',
  },
  'Стать автором блога — Yrys Academy': {
    kk: 'Блог авторы болу — Yrys Academy',
    en: 'Become a blog author — Yrys Academy',
  },
  'Статья не найдена — Блог Yrys Academy': {
    kk: 'Мақала табылмады — Yrys Academy блогы',
    en: 'Article not found — Yrys Academy blog',
  },
  'Тема оформления': { kk: 'Безендіру тақырыбы', en: 'Appearance theme' },
  Системная: { kk: 'Жүйелік', en: 'System' },
  Светлая: { kk: 'Ашық', en: 'Light' },
  Тёмная: { kk: 'Күңгірт', en: 'Dark' },
  'Помощник Юки': { kk: 'Юки көмекшісі', en: 'Yuki assistant' },
  'Управление подсказкой помощника в интерфейсе.': {
    kk: 'Интерфейстегі көмекшінің кеңесін басқару.',
    en: 'Manage assistant tips in the interface.',
  },
  'Показывать подсказку Юки': {
    kk: 'Юки кеңесін көрсету',
    en: 'Show Yuki prompt',
  },
  'Отображать подсказку помощника в правом нижнем углу экрана. Если отключить, останется компактная кнопка быстрого перехода в чат.':
    {
      kk: 'Экранның оң жақ төменгі бұрышында көмекшінің кеңесін көрсету. Өшірілсе, чатқа жылдам өтуге арналған шағын батырма қалады.',
      en: 'Display the assistant prompt in the bottom right corner of the screen. If disabled, a compact chat shortcut button remains.',
    },
  'Yrys Academy — к обзору': {
    kk: 'Yrys Academy — шолуға',
    en: 'Yrys Academy — overview',
  },
  'Заданий выполнено': { kk: 'Орындалған тапсырмалар', en: 'Tasks completed' },
  'IELTS test — Yrys Academy': {
    kk: 'IELTS тесті — Yrys Academy',
    en: 'IELTS test — Yrys Academy',
  },
  Язык: { kk: 'Тіл', en: 'Language' },
  Обучение: { kk: 'Оқу', en: 'Study' },
  Обзор: { kk: 'Шолу', en: 'Overview' },
  'План подготовки': { kk: 'Дайындық жоспары', en: 'Study plan' },
  Практика: { kk: 'Практика', en: 'Practice' },
  Ошибки: { kk: 'Қателер', en: 'Mistakes' },
  Прогресс: { kk: 'Прогресс', en: 'Progress' },
  Настройки: { kk: 'Параметрлер', en: 'Settings' },
  Профиль: { kk: 'Профиль', en: 'Profile' },
  'Панель управления': { kk: 'Басқару панелі', en: 'Dashboard' },
  'Рабочее пространство': { kk: 'Жұмыс кеңістігі', en: 'Workspace' },
  'Основная навигация': { kk: 'Негізгі навигация', en: 'Main navigation' },
  'Основная навигация приложения': {
    kk: 'Қолданбаның негізгі навигациясы',
    en: 'Main app navigation',
  },
  'Открыть меню': { kk: 'Мәзірді ашу', en: 'Open menu' },
  'Закрыть меню': { kk: 'Мәзірді жабу', en: 'Close menu' },
  'Открыть уведомления': {
    kk: 'Хабарландыруларды ашу',
    en: 'Open notifications',
  },
  Уведомления: { kk: 'Хабарландырулар', en: 'Notifications' },
  'Пока нет уведомлений': {
    kk: 'Әзірге хабарландыру жоқ',
    en: 'No notifications yet',
  },
  'Новые сообщения и напоминания появятся здесь.': {
    kk: 'Жаңа хабарламалар мен еске салғыштар осында көрсетіледі.',
    en: 'New messages and reminders will appear here.',
  },
  'Открыть профиль': { kk: 'Профильді ашу', en: 'Open profile' },
  'Войти в аккаунт': { kk: 'Аккаунтқа кіру', en: 'Sign in' },
  Аккаунт: { kk: 'Аккаунт', en: 'Account' },
  'Один Full Mock доступен бесплатно. Для других тестов и сохранения прогресса войдите в аккаунт.':
    {
      kk: 'Бір Full Mock тегін қолжетімді. Басқа тесттер үшін және прогресті сақтау үшін аккаунтқа кіріңіз.',
      en: 'One Full Mock is free. Sign in to access other tests and save your progress.',
    },
  Блог: { kk: 'Блог', en: 'Blog' },
  'Мои статьи': { kk: 'Мақалаларым', en: 'My articles' },
  Администрирование: { kk: 'Әкімшілік', en: 'Administration' },
  Выйти: { kk: 'Шығу', en: 'Sign out' },
  'Выйти из аккаунта?': {
    kk: 'Аккаунттан шығу керек пе?',
    en: 'Sign out of your account?',
  },
  'Чтобы продолжить подготовку, потребуется войти в аккаунт снова.': {
    kk: 'Дайындықты жалғастыру үшін аккаунтқа қайта кіру қажет.',
    en: 'You’ll need to sign in again to continue studying.',
  },
  Отмена: { kk: 'Болдырмау', en: 'Cancel' },
  'Выходим…': { kk: 'Шығуда…', en: 'Signing out…' },
  'Выберите язык': { kk: 'Тілді таңдаңыз', en: 'Choose a language' },
  'Настройте профиль и цель': {
    kk: 'Профиль мен мақсатыңызды реттеңіз',
    en: 'Set up your profile and goal',
  },
  'Язык интерфейса': { kk: 'Интерфейс тілі', en: 'Interface language' },
  Интерфейс: { kk: 'Интерфейс', en: 'Interface' },
  'Сохраняется на этом устройстве.': {
    kk: 'Осы құрылғыда сақталады.',
    en: 'Saved on this device.',
  },
  'Выберите язык приложения. Настройка сохранится на этом устройстве.': {
    kk: 'Қолданба тілін таңдаңыз. Таңдауыңыз осы құрылғыда сақталады.',
    en: 'Choose your app language. Your choice is saved on this device.',
  },
  'Укажите целевой балл и дату экзамена — по ним строится ваш план подготовки.':
    {
      kk: 'Мақсатты балл мен емтихан күнін көрсетіңіз — дайындық жоспары соларға сай құрылады.',
      en: 'Set your target score and exam date to build your study plan.',
    },
  'Укажите имя не короче 2 символов': {
    kk: 'Атыңыз кемінде 2 таңбадан тұруы керек',
    en: 'Enter a name with at least 2 characters',
  },
  'Выберите балл от 4.0 до 9.0 с шагом 0.5': {
    kk: '4.0 мен 9.0 аралығынан 0.5 қадаммен балл таңдаңыз',
    en: 'Choose a score from 4.0 to 9.0 in 0.5 increments',
  },
  'Укажите дату экзамена': {
    kk: 'Емтихан күнін көрсетіңіз',
    en: 'Enter your exam date',
  },
  'Дата экзамена не может быть в прошлом': {
    kk: 'Емтихан күні өткен күн болмауы керек',
    en: 'Exam date cannot be in the past',
  },
  'Выберите формат IELTS': {
    kk: 'IELTS форматын таңдаңыз',
    en: 'Choose an IELTS format',
  },
  'Профиль сохранён.': { kk: 'Профиль сақталды.', en: 'Profile saved.' },
  'Цель обновлена.': { kk: 'Мақсат жаңартылды.', en: 'Goal updated.' },
  'Загружаем настройки…': {
    kk: 'Параметрлер жүктелуде…',
    en: 'Loading settings…',
  },
  'Не удалось загрузить профиль': {
    kk: 'Профильді жүктеу мүмкін болмады',
    en: 'Could not load profile',
  },
  'Профиль и цель': { kk: 'Профиль және мақсат', en: 'Profile and goal' },
  'Имя и часовой пояс аккаунта.': {
    kk: 'Аккаунт аты мен уақыт белдеуі.',
    en: 'Your account name and time zone.',
  },
  Имя: { kk: 'Аты', en: 'Name' },
  'Как к вам обращаться': {
    kk: 'Сізге қалай жүгінуге болады',
    en: 'What should we call you?',
  },
  'Часовой пояс': { kk: 'Уақыт белдеуі', en: 'Time zone' },
  'Например, Asia/Almaty': {
    kk: 'Мысалы, Asia/Almaty',
    en: 'For example, Asia/Almaty',
  },
  'Сохраняем…': { kk: 'Сақталуда…', en: 'Saving…' },
  'Сохранить профиль': { kk: 'Профильді сақтау', en: 'Save profile' },
  'Цель подготовки': { kk: 'Дайындық мақсаты', en: 'Study goal' },
  'Целевой балл, формат и дата экзамена.': {
    kk: 'Мақсатты балл, емтихан форматы мен күні.',
    en: 'Your target score, exam format, and date.',
  },
  'Целевой балл': { kk: 'Мақсатты балл', en: 'Target score' },
  'Выберите балл': { kk: 'Баллды таңдаңыз', en: 'Choose a score' },
  'Формат IELTS': { kk: 'IELTS форматы', en: 'IELTS format' },
  'Выберите формат': { kk: 'Форматты таңдаңыз', en: 'Choose a format' },
  'Планируемая дата экзамена': {
    kk: 'Емтиханның жоспарланған күні',
    en: 'Planned exam date',
  },
  'Сохранить цель': { kk: 'Мақсатты сақтау', en: 'Save goal' },
  'Персонаж-помощник': { kk: 'Көмекші кейіпкер', en: 'Study companion' },
  'Управление отображением питомца Юки в интерфейсе.': {
    kk: 'Юки көмекшісінің экранда көрсетілуін басқару.',
    en: 'Choose whether Yuki appears in the app.',
  },
  'Показывать питомца (Юки)': { kk: 'Юкиді көрсету', en: 'Show Yuki' },
  'Отображать анимированного лисёнка в правом нижнем углу экрана. Если отключить, останется компактная кнопка быстрого перехода в чат.':
    {
      kk: 'Экранның төменгі оң жақ бұрышында түлкі бейнеленеді. Өшірсеңіз, чатқа өту батырмасы қалады.',
      en: 'Show the animated fox in the lower-right corner. When hidden, a compact chat button remains.',
    },
  'Выберите секцию для тренировки или пройдите полный пробный экзамен.': {
    kk: 'Жаттығу бөлімін таңдаңыз немесе толық сынақ емтиханын тапсырыңыз.',
    en: 'Choose a section to practise or take a full mock exam.',
  },
  '4 секции · 40 вопросов': {
    kk: '4 бөлім · 40 сұрақ',
    en: '4 sections · 40 questions',
  },
  '3 текста · 40 вопросов': {
    kk: '3 мәтін · 40 сұрақ',
    en: '3 passages · 40 questions',
  },
  'Task 1 (описание графиков/письма) и Task 2 (эссе). Детальный разбор по всем 4 официальным критериям IELTS.':
    {
      kk: 'Task 1 (графикті сипаттау/хат) және Task 2 (эссе). IELTS-тің барлық 4 ресми критерийі бойынша толық талдау.',
      en: 'Task 1 (describe a chart or write a letter) and Task 2 (essay), with detailed feedback against all 4 official IELTS criteria.',
    },
  'Task 1 & Task 2': { kk: 'Task 1 және Task 2', en: 'Task 1 & Task 2' },
  'Интервью (Part 1), карточка монолога (Part 2) и обсуждение (Part 3) с записью аудио и подробной оценкой.':
    {
      kk: 'Сұхбат (Part 1), монолог картасы (Part 2) және талқылау (Part 3): аудио жазбасы мен толық бағалау.',
      en: 'Interview (Part 1), a monologue cue card (Part 2), and discussion (Part 3), with audio recording and detailed feedback.',
    },
  'Part 1, 2, 3': { kk: 'Part 1, 2, 3', en: 'Parts 1, 2, 3' },
  '4 секции + Full Mock': {
    kk: '4 бөлім + Full Mock',
    en: '4 sections + Full Mock',
  },
  'Выберите навык и формат задания': {
    kk: 'Дағды мен тапсырма форматын таңдаңыз',
    en: 'Choose a skill and task format',
  },
  'Перейти к практике': { kk: 'Практикаға өту', en: 'Go to practice' },
  'Разобрать ошибки': { kk: 'Қателерді талдау', en: 'Review mistakes' },
  'Вернуться к сложным заданиям': {
    kk: 'Қиын тапсырмаларға оралу',
    en: 'Revisit difficult tasks',
  },
  'Заполнить профиль': { kk: 'Профильді толтыру', en: 'Complete your profile' },
  'Указать цель и дату экзамена': {
    kk: 'Мақсат пен емтихан күнін көрсету',
    en: 'Set your goal and exam date',
  },
  'Текущий уровень': { kk: 'Ағымдағы деңгей', en: 'Current level' },
  'Дата экзамена': { kk: 'Емтихан күні', en: 'Exam date' },
  'Появится после диагностики': {
    kk: 'Диагностикадан кейін көрсетіледі',
    en: 'Available after your first assessment',
  },
  'Расчётный IELTS Band': {
    kk: 'Есептік IELTS балы',
    en: 'Estimated IELTS band',
  },
  'Укажите цель в диалоге «Настроить цель»': {
    kk: '«Мақсатты реттеу» терезесінде мақсатыңызды көрсетіңіз',
    en: 'Set a goal in the “Set your goal” dialog',
  },
  'Ваша текущая цель': { kk: 'Ағымдағы мақсатыңыз', en: 'Your current goal' },
  'Добавьте дату в диалоге «Настроить цель»': {
    kk: '«Мақсатты реттеу» терезесінде күнді қосыңыз',
    en: 'Add a date in the “Set your goal” dialog',
  },
  'Запланированная дата': { kk: 'Жоспарланған күн', en: 'Planned date' },
  'Загружаем ваш dashboard…': {
    kk: 'Басқару панелі жүктелуде…',
    en: 'Loading your dashboard…',
  },
  'Не удалось загрузить dashboard': {
    kk: 'Басқару панелін жүктеу мүмкін болмады',
    en: 'Could not load the dashboard',
  },
  'Проверьте соединение с сервером и попробуйте ещё раз.': {
    kk: 'Серверге қосылымды тексеріп, қайталап көріңіз.',
    en: 'Check your connection and try again.',
  },
  'Основные показатели': { kk: 'Негізгі көрсеткіштер', en: 'Key metrics' },
  'История прогресса': { kk: 'Прогресс тарихы', en: 'Progress history' },
  'Вся история': { kk: 'Толық тарих', en: 'View all' },
  'Загружаем результаты…': {
    kk: 'Нәтижелер жүктелуде…',
    en: 'Loading results…',
  },
  'Не удалось загрузить. Повторить': {
    kk: 'Жүктеу мүмкін болмады. Қайталау',
    en: 'Could not load. Try again',
  },
  'После первого теста здесь появятся оценки и изменения результата.': {
    kk: 'Бірінші тесттен кейін бағалар мен нәтиже өзгерістері осында көрсетіледі.',
    en: 'Your scores and progress will appear here after your first test.',
  },
  'Рекомендуемый шаг': { kk: 'Ұсынылатын қадам', en: 'Recommended next step' },
  'Перейти к следующему шагу': {
    kk: 'Келесі қадамға өту',
    en: 'Continue to next step',
  },
  'Настроить цель': { kk: 'Мақсатты реттеу', en: 'Set your goal' },
  'Прогресс по навыкам': {
    kk: 'Дағдылар бойынша прогресс',
    en: 'Progress by skill',
  },
  'Общая картина по Listening, Reading, Writing и Speaking.': {
    kk: 'Listening, Reading, Writing және Speaking бөлімдері бойынша жалпы нәтиже.',
    en: 'An overview of your Listening, Reading, Writing, and Speaking skills.',
  },
  'Нет выполненных заданий': {
    kk: 'Орындалған тапсырма жоқ',
    en: 'No completed tasks',
  },
  'Открыть прогресс': { kk: 'Прогресті ашу', en: 'View progress' },
  'План на сегодня': { kk: 'Бүгінгі жоспар', en: 'Today’s plan' },
  'Заданий пока нет': { kk: 'Әзірге тапсырма жоқ', en: 'No tasks yet' },
  'Добавьте первое занятие в план.': {
    kk: 'Жоспарға алғашқы сабақты қосыңыз.',
    en: 'Add your first study session to the plan.',
  },
  'Настроить план': { kk: 'Жоспарды реттеу', en: 'Edit plan' },
  'Быстрые действия': { kk: 'Жылдам әрекеттер', en: 'Quick actions' },
  'План подготовки к IELTS': {
    kk: 'IELTS дайындық жоспары',
    en: 'IELTS study plan',
  },
  'Настройки сохранены.': {
    kk: 'Параметрлер сақталды.',
    en: 'Settings saved.',
  },
  'Траектория цели': { kk: 'Мақсатқа жету жолы', en: 'Goal timeline' },
  'Собираем ваш план подготовки…': {
    kk: 'Дайындық жоспарыңыз жасалуда…',
    en: 'Building your study plan…',
  },
  'Не удалось загрузить план': {
    kk: 'Жоспарды жүктеу мүмкін болмады',
    en: 'Could not load your plan',
  },
  'Целевой балл или дата ещё не заданы': {
    kk: 'Мақсатты балл немесе күн әлі көрсетілмеген',
    en: 'Your target score or exam date is not set yet',
  },
  'Укажите желаемый Overall Band и дату экзамена — алгоритм рассчитает необходимый темп и распределит нагрузку по дням.':
    {
      kk: 'Қалаған Overall Band пен емтихан күнін көрсетіңіз — жүйе қажетті қарқынды есептеп, күндерге бөледі.',
      en: 'Enter your target overall band and exam date. We’ll calculate a suitable pace and spread your study across the days.',
    },
  'Задать цель в профиле': {
    kk: 'Профильде мақсат қою',
    en: 'Set a goal in your profile',
  },
  'Текущий балл': { kk: 'Ағымдағы балл', en: 'Current score' },
  'после тестов': { kk: 'тесттерден кейін', en: 'after your first test' },
  'Расчётный Overall Band': {
    kk: 'Есептік Overall Band',
    en: 'Estimated overall band',
  },
  'Цель достигнута! 🎉': { kk: 'Мақсат орындалды! 🎉', en: 'Goal reached! 🎉' },
  'Желаемый результат': { kk: 'Қалаған нәтиже', en: 'Target result' },
  'Изменить дату →': { kk: 'Күнді өзгерту →', en: 'Change date →' },
  'Рекомендуемый режим занятий:': {
    kk: 'Ұсынылатын оқу қарқыны:',
    en: 'Recommended study pace:',
  },
  'Зона максимального роста': {
    kk: 'Ең көп өсетін дағды',
    en: 'Biggest opportunity for growth',
  },
  'Навык, улучшение которого даст наибольший прирост к общему баллу': {
    kk: 'Жақсартсаңыз, жалпы баллды ең көп көтеретін дағды',
    en: 'The skill where improvement can raise your overall score the most',
  },
  'Приоритет №1': { kk: '№1 басымдық', en: 'Top priority' },
  'Пройдите первый тест для калибровки': {
    kk: 'Деңгейді анықтау үшін алғашқы тестті тапсырыңыз',
    en: 'Take your first test to get an estimate',
  },
  'Пока нет завершённых попыток. Начните с Listening или Reading — алгоритм сразу вычислит текущий балл и выявит самое слабое место.':
    {
      kk: 'Әзірге аяқталған тест жоқ. Listening немесе Reading бөлімінен бастаңыз — жүйе ағымдағы баллды есептеп, ең әлсіз дағдыны анықтайды.',
      en: 'You haven’t completed a test yet. Start with Listening or Reading to estimate your current score and find your weakest skill.',
    },
  'Текущий результат: band': {
    kk: 'Ағымдағы нәтиже: band',
    en: 'Current result: band',
  },
  'цель достигнута, закрепите результат': {
    kk: 'мақсат орындалды, нәтижені бекітіңіз',
    en: 'goal reached—keep practising to maintain it',
  },
  'Начать тренировку': { kk: 'Жаттығуды бастау', en: 'Practise' },
  'Банк ошибок': { kk: 'Қателер жинағы', en: 'Mistake bank' },
  'Регулярный спринт': { kk: 'Тұрақты жаттығу', en: 'Daily practice' },
  'Анализ ошибок': { kk: 'Қателерді талдау', en: 'Review mistakes' },
  'Все ошибки сохраняются в разделе «Ошибки» для повторения.': {
    kk: 'Қайталау үшін барлық қате «Қателер» бөлімінде сақталады.',
    en: 'Your mistakes are saved in the Mistakes section so you can revisit them.',
  },
  'Контрольный замер': { kk: 'Бақылау тесті', en: 'Check your progress' },
  'Раз в неделю проходите полный модуль целиком с таймингом, чтобы отслеживать динамику в «Прогрессе».':
    {
      kk: 'Нәтижені бақылау үшін апта сайын толық бөлімді таймермен орындап, «Прогресс» бөлімін тексеріңіз.',
      en: 'Once a week, complete a full timed module and check Progress to track your improvement.',
    },
  'Укажите дату экзамена для подбора оптимального темпа занятий.': {
    kk: 'Оңтайлы оқу қарқынын есептеу үшін емтихан күнін көрсетіңіз.',
    en: 'Add your exam date to get a recommended study pace.',
  },
  'Финишная прямая! Рекомендуется решать по 2 модуля в день и разобрать все ошибки.':
    {
      kk: 'Емтихан жақын! Күніне 2 бөлім орындап, барлық қатені талдаған жөн.',
      en: 'Your exam is coming up. Aim for two modules a day and review every mistake.',
    },
  'Оптимальный темп: 1 модуль ежедневно + 1 полный пробный тест (Full Mock) в неделю.':
    {
      kk: 'Оңтайлы қарқын: күн сайын 1 бөлім және аптасына 1 толық сынақ (Full Mock).',
      en: 'Recommended pace: one module a day and one full mock test each week.',
    },
  'До цели значительный шаг: уделяйте особое внимание слабому навыку и словарному запасу.':
    {
      kk: 'Мақсатқа әлі біраз бар: әлсіз дағды мен сөздік қорға көбірек көңіл бөліңіз.',
      en: 'You have some ground to cover. Focus on your weakest skill and vocabulary.',
    },
  'Планомерная подготовка: 1 модуль в день и еженедельный разбор накопленных ошибок.':
    {
      kk: 'Жүйелі дайындық: күніне 1 бөлім орындап, жиналған қателерді апта сайын талдаңыз.',
      en: 'Steady preparation: one module a day and a weekly review of your mistakes.',
    },
  Осталось: { kk: 'Қалды', en: 'remaining' },
  'Задайте цель, чтобы откалибровать расчет': {
    kk: 'Есепті баптау үшін мақсатыңызды көрсетіңіз',
    en: 'Set a goal to personalise your estimate',
  },
  'Экзамен сегодня!': { kk: 'Емтихан бүгін!', en: 'Your exam is today!' },
  'Дата экзамена не указана': {
    kk: 'Емтихан күні көрсетілмеген',
    en: 'Exam date not set',
  },
  'Тренируйте предвосхищение ответов и внимательность к окончаниям -s и числительным.':
    {
      kk: 'Жауапты алдын ала болжауды, -s жалғауы мен сандарды мұқият тыңдауды жаттықтырыңыз.',
      en: 'Practise anticipating answers and listening carefully for plural -s endings and numbers.',
    },
  'Фокусируйтесь на сканировании ключевых синонимов и различении False vs Not Given.':
    {
      kk: 'Негізгі сөздердің синонимдерін іздеп, False пен Not Given айырмасын ажыратыңыз.',
      en: 'Practise scanning for key synonyms and distinguishing False from Not Given.',
    },
  'Соблюдайте структуру эссе (4 абзаца) и отрабатывайте академические связки.':
    {
      kk: 'Эссе құрылымын (4 абзац) сақтап, академиялық байланыстырушы сөздерді қолданыңыз.',
      en: 'Follow a four-paragraph essay structure and practise academic linking phrases.',
    },
  'Отвечайте развёрнуто по формуле «Тезис + Пример/Объяснение», избегая пауз.':
    {
      kk: '«Пікір + Мысал/Түсіндірме» үлгісімен толық жауап беріп, ұзақ үзілістерден аулақ болыңыз.',
      en: 'Give developed answers using “point + example/explanation” and avoid long pauses.',
    },
  Аудирование: { kk: 'Тыңдалым', en: 'Listening' },
  Чтение: { kk: 'Оқылым', en: 'Reading' },
  Письмо: { kk: 'Жазылым', en: 'Writing' },
  'Устная речь': { kk: 'Айтылым', en: 'Speaking' },
  'Перейти к материалам': { kk: 'Материалдарға өту', en: 'Browse materials' },
  'Полный пробный экзамен (Full Mock)': {
    kk: 'Толық сынақ емтиханы (Full Mock)',
    en: 'Full mock exam (Full Mock)',
  },
  '4 секции подряд': { kk: '4 бөлім қатарынан', en: 'All 4 sections' },
  'Мы автоматически подберём Listening, Reading, Writing и Speaking из общей библиотеки — сначала непройденные тесты. Четыре секции подряд, общий таймер и итоговый Band Score.':
    {
      kk: 'Listening, Reading, Writing және Speaking бөлімдерін ортақ кітапханадан автоматты түрде таңдаймыз — алдымен орындалмаған тесттер. Төрт бөлім, ортақ таймер және қорытынды Band Score.',
      en: 'We’ll choose Listening, Reading, Writing, and Speaking tests from the library, prioritising ones you haven’t taken. Complete all four sections with one timer and get an overall band score.',
    },
  'Подготовить Full Mock': { kk: 'Full Mock бастау', en: 'Start a Full Mock' },
  'Текущая цель': { kk: 'Ағымдағы мақсат', en: 'Current goal' },
  'Ваш IELTS прогресс': { kk: 'IELTS прогресіңіз', en: 'Your IELTS progress' },
  'Что делать дальше': { kk: 'Келесі қадам', en: 'What to do next' },
  'Что-то пошло не так': { kk: 'Қате пайда болды', en: 'Something went wrong' },
  'Произошла непредвиденная ошибка. Попробуйте повторить действие или вернуться на главную.':
    {
      kk: 'Күтпеген қате пайда болды. Әрекетті қайталап көріңіз немесе басты бетке оралыңыз.',
      en: 'An unexpected error occurred. Try again or return to the home page.',
    },
  Повторить: { kk: 'Қайталау', en: 'Try again' },
  'На главную': { kk: 'Басты бетке', en: 'Go home' },
  'Не удалось выполнить запрос': {
    kk: 'Сұрауды орындау мүмкін болмады',
    en: 'The request could not be completed',
  },
  'Произошла непредвиденная ошибка. Попробуйте ещё раз.': {
    kk: 'Күтпеген қате пайда болды. Қайталап көріңіз.',
    en: 'An unexpected error occurred. Please try again.',
  },
  'Не удалось завершить вход через Google. Попробуйте ещё раз.': {
    kk: 'Google арқылы кіру аяқталмады. Қайталап көріңіз.',
    en: 'Could not complete Google sign-in. Please try again.',
  },
  'Войти или создать аккаунт': {
    kk: 'Кіру немесе аккаунт жасау',
    en: 'Sign in or create an account',
  },
  'Для входа и регистрации используйте Google.': {
    kk: 'Кіру және тіркелу үшін Google қолданыңыз.',
    en: 'Use Google to sign in or create an account.',
  },
  'Завершаем вход через Google…': {
    kk: 'Google арқылы кіру аяқталуда…',
    en: 'Finishing Google sign-in…',
  },
  'Если вы открыли сайт из Telegram или Instagram, используйте меню браузера «Открыть в Safari» или «Открыть в браузере» для входа.':
    {
      kk: 'Сайтты Telegram не Instagram арқылы ашсаңыз, кіру үшін браузер мәзірінен «Safari-де ашу» немесе «Браузерде ашу» тармағын таңдаңыз.',
      en: 'If you opened this site from Telegram or Instagram, use the browser menu to open it in Safari or your browser before signing in.',
    },
  'Не удалось загрузить вход через Google. Проверьте подключение и обновите страницу.':
    {
      kk: 'Google арқылы кіру жүктелмеді. Қосылымды тексеріп, бетті жаңартыңыз.',
      en: 'Could not load Google sign-in. Check your connection and refresh the page.',
    },
  'условиями использования': {
    kk: 'пайдалану шарттарымен',
    en: 'Terms of Use',
  },
  'политикой конфиденциальности': {
    kk: 'құпиялылық саясатымен',
    en: 'Privacy Policy',
  },
  'Таймер запустится только после загрузки': {
    kk: 'Таймер жүктелгеннен кейін ғана іске қосылады',
    en: 'The timer starts once everything has loaded',
  },
  'Загрузка списка тестов': {
    kk: 'Тесттер тізімі жүктелуде',
    en: 'Loading tests',
  },
  'Повторить попытку': { kk: 'Қайталап көру', en: 'Try again' },
  'Сохраняется…': { kk: 'Сақталуда…', en: 'Saving…' },
  'Черновик сохранён': { kk: 'Нобай сақталды', en: 'Draft saved' },
  'Не удалось сохранить': { kk: 'Сақтау мүмкін болмады', en: 'Could not save' },
  'Выберите до': { kk: 'Мына санға дейін таңдаңыз:', en: 'Choose up to' },
  'вариантов:': { kk: 'нұсқа:', en: 'options:' },
  Продолжить: { kk: 'Жалғастыру', en: 'Continue' },
  'Продолжить позже': { kk: 'Кейін жалғастыру', en: 'Continue later' },
  'Отправляем…': { kk: 'Жіберілуде…', en: 'Submitting…' },
  'Завершить тест': { kk: 'Тестті аяқтау', en: 'Finish test' },
  'Завершить тест?': { kk: 'Тестті аяқтайсыз ба?', en: 'Finish this test?' },
  'Ответы будут отправлены на проверку, изменить их после завершения нельзя. Без ответа останется':
    {
      kk: 'Жауаптар тексеруге жіберіледі, аяқтағаннан кейін оларды өзгерту мүмкін емес. Жауапсыз қалады:',
      en: 'Your answers will be submitted and can’t be changed afterwards. Unanswered questions:',
    },
  'вопросов.': { kk: 'сұрақ.', en: 'questions.' },
  Завершить: { kk: 'Аяқтау', en: 'Finish' },
  Баллы: { kk: 'Ұпай', en: 'Score' },
  'Верных ответов': { kk: 'Дұрыс жауаптар', en: 'Correct answers' },
  Верно: { kk: 'Дұрыс', en: 'Correct' },
  Неверно: { kk: 'Қате', en: 'Incorrect' },
  'Ваш ответ': { kk: 'Сіздің жауабыңыз', en: 'Your answer' },
  'Правильный ответ': { kk: 'Дұрыс жауап', en: 'Correct answer' },
  'К материалам Reading': {
    kk: 'Reading материалдарына',
    en: 'Back to Reading',
  },
  'К материалам Listening': {
    kk: 'Listening материалдарына',
    en: 'Back to Listening',
  },
  'К материалам Writing': {
    kk: 'Writing материалдарына',
    en: 'Back to Writing',
  },
  'К материалам Speaking': {
    kk: 'Speaking материалдарына',
    en: 'Back to Speaking',
  },
  'К Full Mock': { kk: 'Full Mock бетіне', en: 'Back to Full Mock' },
  Назад: { kk: 'Артқа', en: 'Back' },
  'Подготовка…': { kk: 'Дайындық…', en: 'Preparing…' },
  'Пройти заново': { kk: 'Қайта тапсыру', en: 'Retake' },
  'К списку тестов': { kk: 'Тесттер тізіміне', en: 'Back to tests' },
  'из 9.0': { kk: '9.0-ден', en: 'out of 9.0' },
  'Критерии IELTS': { kk: 'IELTS критерийлері', en: 'IELTS criteria' },
  критерия: { kk: 'критерий', en: 'criteria' },
  'Пока не определяется нашей системой': {
    kk: 'Жүйеміз әзірше бағаламайды',
    en: 'Not assessed by our system yet',
  },
  'Не определяется': { kk: 'Бағаланбайды', en: 'Not assessed' },
  'Точность и баллы': { kk: 'Дәлдік пен ұпай', en: 'Accuracy and score' },
  точности: { kk: 'дәлдік', en: 'accuracy' },
  из: { kk: '/', en: 'of' },
  правильных: { kk: 'дұрыс', en: 'correct' },
  верно: { kk: 'дұрыс', en: 'correct' },
  ошибка: { kk: 'қате', en: 'mistake' },
  ошибок: { kk: 'қате', en: 'mistakes' },
  'Без ошибок': { kk: 'Қатесіз', en: 'No mistakes' },
  'Время выполнения': { kk: 'Орындау уақыты', en: 'Time taken' },
  Лимит: { kk: 'Шектеу', en: 'Limit' },
  мин: { kk: 'мин', en: 'min' },
  'Лимит исчерпан': { kk: 'Уақыт аяқталды', en: 'Time limit reached' },
  'Средний темп:': { kk: 'Орташа қарқын:', en: 'Average pace:' },
  'б.': { kk: 'ұпай', en: 'pts' },
  'Ошибка (0 б.)': { kk: 'Қате (0 ұпай)', en: 'Incorrect (0 pts)' },
  'Не отвечено (0 б.)': { kk: 'Жауап жоқ (0 ұпай)', en: 'Unanswered (0 pts)' },
  'Разбор и цитата:': {
    kk: 'Талдау және дәйексөз:',
    en: 'Explanation and quote:',
  },
  'Выберите текст для тренировки': {
    kk: 'Жаттығу үшін мәтінді таңдаңыз',
    en: 'Choose a passage to practise',
  },
  'Выберите тест для тренировки': {
    kk: 'Жаттығу үшін тестті таңдаңыз',
    en: 'Choose a test to practise',
  },
  'Выберите Writing-тренировку': {
    kk: 'Writing жаттығуын таңдаңыз',
    en: 'Choose a Writing practice',
  },
  'Выберите Speaking-тренировку': {
    kk: 'Speaking жаттығуын таңдаңыз',
    en: 'Choose a Speaking practice',
  },
  'Не удалось загрузить результаты': {
    kk: 'Нәтижелерді жүктеу мүмкін болмады',
    en: 'Could not load results',
  },
  'Не удалось загрузить материалы': {
    kk: 'Материалдарды жүктеу мүмкін болмады',
    en: 'Could not load materials',
  },
  'Не удалось загрузить тесты': {
    kk: 'Тесттерді жүктеу мүмкін болмады',
    en: 'Could not load tests',
  },
  'Не удалось загрузить Writing-материалы': {
    kk: 'Writing материалдарын жүктеу мүмкін болмады',
    en: 'Could not load Writing materials',
  },
  'Не удалось загрузить Speaking-материалы': {
    kk: 'Speaking материалдарын жүктеу мүмкін болмады',
    en: 'Could not load Speaking materials',
  },
  Сложность: { kk: 'Қиындық деңгейі', en: 'Difficulty' },
  Длительность: { kk: 'Ұзақтығы', en: 'Duration' },
  'Начать Writing': { kk: 'Writing бастау', en: 'Start Writing' },
  'Начать Speaking': { kk: 'Speaking бастау', en: 'Start Speaking' },
  'Практический тест': { kk: 'Практикалық тест', en: 'Practice test' },
  Черновики: { kk: 'Нобайлар', en: 'Drafts' },
  'Входя в систему, вы соглашаетесь с': {
    kk: 'Жүйеге кіру арқылы сіз мына құжаттармен келісесіз:',
    en: 'By signing in, you agree to the',
  },
  и: { kk: 'және', en: 'and' },
  'Готовим материал…': {
    kk: 'Материал дайындалуда…',
    en: 'Preparing your test…',
  },
  'Загружаем текст задания, формируем группы вопросов и настраиваем форму для ответов.':
    {
      kk: 'Тапсырма мәтіні жүктеліп, сұрақтар топтастырылып, жауап беру формасы дайындалуда.',
      en: 'Loading the passage, organising the questions, and preparing your answer sheet.',
    },
  'Не удалось восстановить ответы': {
    kk: 'Жауаптарды қалпына келтіру мүмкін болмады',
    en: 'Could not restore your answers',
  },
  'Готовим чтение…': {
    kk: 'Reading бөлімі дайындалуда…',
    en: 'Preparing Reading…',
  },
  'Загружаем пассажи, формируем группы вопросов и восстанавливаем сохранённые ответы…':
    {
      kk: 'Мәтіндер мен сұрақтар жүктеліп, сақталған жауаптар қалпына келтірілуде…',
      en: 'Loading passages and questions, and restoring your saved answers…',
    },
  'К редактору': { kk: 'Редакторға өту', en: 'Back to editor' },
  'К Reading': { kk: 'Reading бөліміне', en: 'Back to Reading' },
  Раздел: { kk: 'Бөлім', en: 'Passage' },
  'Завершить попытку?': {
    kk: 'Тапсырманы аяқтайсыз ба?',
    en: 'Finish this attempt?',
  },
  'Все вопросы отвечены. Вы уверены, что хотите завершить тест и перейти к результатам?':
    {
      kk: 'Барлық сұраққа жауап берілді. Тестті аяқтап, нәтижелерге өтесіз бе?',
      en: 'You’ve answered every question. Finish the test and view your results?',
    },
  'Продолжить тест': { kk: 'Тестті жалғастыру', en: 'Continue test' },
  'Не удалось сохранить черновик:': {
    kk: 'Нобайды сақтау мүмкін болмады:',
    en: 'Could not save draft:',
  },
  'Не удалось отправить тест:': {
    kk: 'Тестті жіберу мүмкін болмады:',
    en: 'Could not submit test:',
  },
  Текст: { kk: 'Мәтін', en: 'Passage' },
  'Уменьшить шрифт': { kk: 'Қаріпті кішірейту', en: 'Decrease text size' },
  'Стандартный шрифт': { kk: 'Қалыпты қаріп', en: 'Default text size' },
  'Увеличить шрифт': { kk: 'Қаріпті үлкейту', en: 'Increase text size' },
  'Текст раздела ещё не добавлен. Вернитесь в редактор.': {
    kk: 'Бұл бөлімге мәтін әлі қосылмаған. Редакторға оралыңыз.',
    en: 'This passage has no text yet. Return to the editor.',
  },
  Вопросы: { kk: 'Сұрақтар', en: 'Questions' },
  Вопрос: { kk: 'Сұрақ', en: 'Question' },
  'В этом разделе ещё нет вопросов. Добавьте их в редакторе.': {
    kk: 'Бұл бөлімде сұрақ жоқ. Оларды редакторда қосыңыз.',
    en: 'This passage has no questions yet. Add them in the editor.',
  },
  Далее: { kk: 'Келесі', en: 'Next' },
  отвечено: { kk: 'жауап берілді', en: 'answered' },
  отвечен: { kk: 'жауап берілді', en: 'answered' },
  'В разделе:': { kk: 'Бөлімде:', en: 'Passage:' },
  'Всего:': { kk: 'Барлығы:', en: 'Total:' },
  'Введите ваш ответ здесь…': {
    kk: 'Жауабыңызды осында енгізіңіз…',
    en: 'Enter your answer here…',
  },
  'Пробный ответ хранится только на этой странице': {
    kk: 'Сынақ жауабы тек осы бетте сақталады',
    en: 'Practice answers are only saved on this page',
  },
  'Ответ автоматически сохраняется по мере ввода': {
    kk: 'Жауабыңыз терген сайын автоматты түрде сақталады',
    en: 'Your answer is saved automatically as you type',
  },
  'Выполните Task 1 и Task 2 в экзаменационном темпе и получите разбор по четырём критериям IELTS.':
    {
      kk: 'Task 1 және Task 2 тапсырмаларын емтихан уақытында орындап, IELTS-тің төрт критерийі бойынша талдау алыңыз.',
      en: 'Complete Task 1 and Task 2 under exam timing and get feedback against the four IELTS criteria.',
    },
  'Пройдите Parts 1–3 с таймерами, запишите ответы и получите расшифровку с разбором по критериям IELTS.':
    {
      kk: 'Parts 1–3 бөлімдерін таймермен орындап, жауаптарыңызды жазып алыңыз және IELTS критерийлері бойынша талдау алыңыз.',
      en: 'Practise Parts 1–3 with timers, record your answers, and get a transcript with IELTS criteria feedback.',
    },
  'Последняя попытка': { kk: 'Соңғы әрекет', en: 'Latest attempt' },
  'Загружаем…': { kk: 'Жүктелуде…', en: 'Loading…' },
  'На проверке': { kk: 'Тексерілуде', en: 'Being assessed' },
  'Продолжить попытку': { kk: 'Әрекетті жалғастыру', en: 'Continue attempt' },
  'Новая попытка': { kk: 'Жаңа әрекет', en: 'New attempt' },
  'Открыть тест': { kk: 'Тестті ашу', en: 'Open test' },
  'Открыть текст': { kk: 'Мәтінді ашу', en: 'Open passage' },
  Результат: { kk: 'Нәтиже', en: 'Result' },
  'Загружаем прогресс…': { kk: 'Прогресс жүктелуде…', en: 'Loading progress…' },
  'Не удалось загрузить прогресс': {
    kk: 'Прогресті жүктеу мүмкін болмады',
    en: 'Could not load progress',
  },
  'Отслеживайте свою динамику': {
    kk: 'Өзгерістеріңізді бақылаңыз',
    en: 'Track your progress over time',
  },
  'Уровень по навыкам': { kk: 'Дағдылар деңгейі', en: 'Skill levels' },
  'История попыток': { kk: 'Тапсыру тарихы', en: 'Attempt history' },
  'Загружаем историю попыток…': {
    kk: 'Тапсыру тарихы жүктелуде…',
    en: 'Loading attempt history…',
  },
  'Не удалось загрузить историю': {
    kk: 'Тарихты жүктеу мүмкін болмады',
    en: 'Could not load history',
  },
  'Попыток пока нет': { kk: 'Әзірге тапсырма жоқ', en: 'No attempts yet' },
  'Пройдите первый тест в разделе Listening или Reading.': {
    kk: 'Listening немесе Reading бөлімінде алғашқы тестті тапсырыңыз.',
    en: 'Take your first Listening or Reading test to get started.',
  },
  'Загружаем историю…': { kk: 'Тарих жүктелуде…', en: 'Loading history…' },
  'Повторить загрузку истории': {
    kk: 'Тарихты қайта жүктеу',
    en: 'Retry loading history',
  },
  'Показать ещё': { kk: 'Тағы көрсету', en: 'Show more' },
  'на проверке ИИ': { kk: 'AI тексеруінде', en: 'being assessed by AI' },
  'не завершена': { kk: 'аяқталмаған', en: 'incomplete' },
  Проверяется: { kk: 'Тексерілуде', en: 'Under review' },
  Статус: { kk: 'Күйі', en: 'Status' },
  Разбор: { kk: 'Талдау', en: 'Review' },
  'Готовим аудирование…': {
    kk: 'Listening бөлімі дайындалуда…',
    en: 'Preparing Listening…',
  },
  'Загружаем аудиотрек, формируем секции вопросов и проверяем готовность плеера.':
    {
      kk: 'Аудио жүктеліп, сұрақ бөлімдері құрылып, ойнатқыш тексерілуде.',
      en: 'Loading the audio, organising the questions, and checking the player.',
    },
  'Загружаем аудиотрек, формируем секции вопросов и проверяем готовность плеера…':
    {
      kk: 'Аудио жүктеліп, сұрақ бөлімдері құрылып, ойнатқыш тексерілуде…',
      en: 'Loading audio, organising the questions, and checking the player…',
    },
  'К Listening': { kk: 'Listening бөліміне', en: 'Back to Listening' },
  'Оставшееся время': { kk: 'Қалған уақыт', en: 'Time remaining' },
  минут: { kk: 'минут', en: 'minutes' },
  'пробные ответы не сохраняются': {
    kk: 'сынақ жауаптары сақталмайды',
    en: 'practice answers are not saved',
  },
  'ответы сохраняются автоматически': {
    kk: 'жауаптар автоматты түрде сақталады',
    en: 'answers are saved automatically',
  },
  'Аудио полного теста': { kk: 'Толық тест аудиосы', en: 'Full test audio' },
  'В тесте ещё нет частей. Добавьте их в редакторе.': {
    kk: 'Тестте бөлімдер жоқ. Оларды редакторда қосыңыз.',
    en: 'This test has no parts yet. Add them in the editor.',
  },
  'Части Listening': { kk: 'Listening бөлімдері', en: 'Listening parts' },
  'Аудио ещё не прикреплено.': {
    kk: 'Аудио әлі тіркелмеген.',
    en: 'No audio has been added yet.',
  },
  'В этой части ещё нет вопросов. Добавьте их в редакторе.': {
    kk: 'Бұл бөлімде сұрақ жоқ. Оларды редакторда қосыңыз.',
    en: 'This part has no questions yet. Add them in the editor.',
  },
  'Загружаем аудио…': { kk: 'Аудио жүктелуде…', en: 'Loading audio…' },
  'Аудио недоступно': { kk: 'Аудио қолжетімсіз', en: 'Audio unavailable' },
  'Схема задания Listening': {
    kk: 'Listening тапсырмасының сызбасы',
    en: 'Listening question diagram',
  },
  'Изображение недоступно. Проверьте файл в редакторе.': {
    kk: 'Сурет қолжетімсіз. Редактордағы файлды тексеріңіз.',
    en: 'Image unavailable. Check the file in the editor.',
  },
  'Неверная электронная почта или пароль.': {
    kk: 'Электрондық пошта немесе құпиясөз қате.',
    en: 'Incorrect email or password.',
  },
  'Не удалось подтвердить Google-аккаунт. Попробуйте снова.': {
    kk: 'Google аккаунтын растау мүмкін болмады. Қайталап көріңіз.',
    en: 'Could not verify your Google account. Please try again.',
  },
  'Аккаунт не найден. Проверьте данные и попробуйте снова.': {
    kk: 'Аккаунт табылмады. Деректерді тексеріп, қайталап көріңіз.',
    en: 'Account not found. Check your details and try again.',
  },
  'Аккаунт с такой электронной почтой уже существует.': {
    kk: 'Бұл электрондық поштаға тіркелген аккаунт бар.',
    en: 'An account with this email already exists.',
  },
  'Аккаунт с таким номером телефона уже существует.': {
    kk: 'Бұл телефон нөміріне тіркелген аккаунт бар.',
    en: 'An account with this phone number already exists.',
  },
  'Проверьте правильность заполнения полей.': {
    kk: 'Өрістердің дұрыс толтырылғанын тексеріңіз.',
    en: 'Check that all fields are filled in correctly.',
  },
  'Подтверждение номера истекло. Запросите новый код.': {
    kk: 'Нөмірді растау мерзімі аяқталды. Жаңа код сұратыңыз.',
    en: 'Phone verification expired. Request a new code.',
  },
  'Неверный или просроченный код WhatsApp.': {
    kk: 'WhatsApp коды қате немесе мерзімі өткен.',
    en: 'The WhatsApp code is invalid or expired.',
  },
  'Код уже отправлен. Подождите минуту перед повторной отправкой.': {
    kk: 'Код жіберілді. Қайта сұрамас бұрын бір минут күтіңіз.',
    en: 'A code was sent already. Wait a minute before requesting another.',
  },
  'Слишком много попыток. Подождите минуту и попробуйте снова.': {
    kk: 'Әрекет саны тым көп. Бір минут күтіп, қайталап көріңіз.',
    en: 'Too many attempts. Wait a minute and try again.',
  },
  'Сервер недоступен. Проверьте, что backend запущен.': {
    kk: 'Сервер қолжетімсіз. Backend іске қосылғанын тексеріңіз.',
    en: 'Server unavailable. Check that the backend is running.',
  },
  'Сервис временно недоступен. Попробуйте немного позже.': {
    kk: 'Қызмет уақытша қолжетімсіз. Сәлден соң қайталап көріңіз.',
    en: 'Service temporarily unavailable. Please try again later.',
  },
  'Черновик уже изменился. Обновите страницу и повторите действие.': {
    kk: 'Нобай өзгертілді. Бетті жаңартып, әрекетті қайталаңыз.',
    en: 'The draft has changed. Refresh the page and try again.',
  },
  'Заполните ответы для Task 1 и Task 2 перед отправкой.': {
    kk: 'Жібермес бұрын Task 1 және Task 2 тапсырмаларын толтырыңыз.',
    en: 'Complete both Task 1 and Task 2 before submitting.',
  },
  'Запишите или введите расшифровку для каждой из трёх частей Speaking.': {
    kk: 'Speaking бөлімінің үш бөлігі үшін аудио жазыңыз немесе мәтін енгізіңіз.',
    en: 'Record or enter a transcript for all three Speaking parts.',
  },
  'Сервер не смог обработать запрос. Попробуйте позже.': {
    kk: 'Сервер сұрауды өңдей алмады. Кейінірек қайталап көріңіз.',
    en: 'The server could not process the request. Please try again later.',
  },
  'Для выбранного формата экзамена пока нет опубликованных тестов.': {
    kk: 'Таңдалған емтихан форматы үшін әзірше жарияланған тест жоқ.',
    en: 'There are no published tests for the selected exam format yet.',
  },
  'Профиль, цель подготовки и напоминания доступны после входа.': {
    kk: 'Профиль, дайындық мақсаты мен еске салғыштар аккаунтқа кірген соң қолжетімді.',
    en: 'Your profile, study goal, and reminders are available after signing in.',
  },
  'Ошибка 404': { kk: '404 қатесі', en: 'Error 404' },
  'Кажется, эта страница потерялась.': {
    kk: 'Бұл бет табылмады.',
    en: 'This page seems to be lost.',
  },
  'Здесь ничего нет. Вернитесь на главную или продолжите подготовку в личном кабинете.':
    {
      kk: 'Мұнда ештеңе жоқ. Басты бетке оралыңыз немесе жеке кабинетте дайындықты жалғастырыңыз.',
      en: 'There’s nothing here. Go home or continue studying from your dashboard.',
    },
  'Растерянная красная лиса': {
    kk: 'Адасқан қызыл түлкі',
    en: 'A confused red fox',
  },
  'Текст аудио — место ответа': {
    kk: 'Аудио мәтіні — жауап бөлігі',
    en: 'Audio transcript — answer location',
  },
  'Готовим задания Writing…': {
    kk: 'Writing тапсырмалары дайындалуда…',
    en: 'Preparing Writing tasks…',
  },
  'Загружаем темы заданий, требования к объёму слов и подготавливаем редактор эссе.':
    {
      kk: 'Тапсырма тақырыптары мен сөз саны талаптары жүктеліп, эссе редакторы дайындалуда.',
      en: 'Loading task prompts and word-count requirements, and preparing the essay editor.',
    },
  'Готовим письменную часть…': {
    kk: 'Жазылым бөлімі дайындалуда…',
    en: 'Preparing Writing…',
  },
  'Загружаем задания эссе, графические материалы и восстанавливаем черновики…':
    {
      kk: 'Эссе тапсырмалары мен суреттер жүктеліп, нобайлар қалпына келтірілуде…',
      en: 'Loading essay tasks and images, and restoring your drafts…',
    },
  'К Writing': { kk: 'Writing бөліміне', en: 'Back to Writing' },
  'Task 1 — 20 минут, Task 2 — 40 минут. Черновики сохраняются автоматически.':
    {
      kk: 'Task 1 — 20 минут, Task 2 — 40 минут. Нобайлар автоматты түрде сақталады.',
      en: 'Task 1 — 20 minutes, Task 2 — 40 minutes. Drafts are saved automatically.',
    },
  'Не удалось отправить работу:': {
    kk: 'Жұмысты жіберу мүмкін болмады:',
    en: 'Could not submit your work:',
  },
  Задание: { kk: 'Тапсырма', en: 'Task' },
  'Напишите ответ на оба задания. Работа короче рекомендуемого объёма будет оценена ниже.':
    {
      kk: 'Екі тапсырмаға да жауап жазыңыз. Ұсынылған көлемнен қысқа жұмыс төмен бағаланады.',
      en: 'Answer both tasks. Responses below the recommended word count may receive a lower score.',
    },
  'Рекомендуемое время: 20 минут': {
    kk: 'Ұсынылатын уақыт: 20 минут',
    en: 'Suggested time: 20 minutes',
  },
  'Рекомендуемое время: 40 минут': {
    kk: 'Ұсынылатын уақыт: 40 минут',
    en: 'Suggested time: 40 minutes',
  },
  минимум: { kk: 'ең азы', en: 'minimum' },
  letter: { kk: 'хат', en: 'letter' },
  'Напишите свой ответ на английском…': {
    kk: 'Жауабыңызды ағылшын тілінде жазыңыз…',
    en: 'Write your answer in English…',
  },
  'Ответ на': { kk: 'Жауап', en: 'Answer for' },
  'рекомендуемый минимум': {
    kk: 'ұсынылатын ең аз көлем',
    en: 'recommended minimum',
  },
  'Изображение недоступно.': {
    kk: 'Сурет қолжетімсіз.',
    en: 'Image unavailable.',
  },
  'Открыть в полном размере': { kk: 'Толық өлшемде ашу', en: 'Open full size' },
  'Визуальные данные для Writing Task': {
    kk: 'Writing Task үшін көрнекі материал',
    en: 'Visual for Writing Task',
  },
  'Эссе отправлено и проверяется нейросетью': {
    kk: 'Эссе жіберілді, AI тексеріп жатыр',
    en: 'Your essay was submitted and is being assessed by AI',
  },
  'ИИ оценивает раскрытие тем, связность и структуру, словарный запас и грамматическую точность. Обычно проверка занимает от 30 до 90 секунд.':
    {
      kk: 'AI тапсырманы орындауды, мәтіннің байланысы мен құрылымын, сөздік қорды және грамматиканы бағалайды. Тексеру әдетте 30–90 секунд алады.',
      en: 'AI reviews task response, coherence and structure, vocabulary, and grammar. Assessment usually takes 30 to 90 seconds.',
    },
  'Вы можете не ждать на этом экране:': {
    kk: 'Бұл экранда күтудің қажеті жоқ:',
    en: 'You don’t need to wait here:',
  },
  'закройте вкладку или перейдите в другие разделы. Проверка завершится в фоновом режиме, а результат с баллами и разбором сохранится в вашем профиле.':
    {
      kk: 'қойындыны жауып немесе басқа бөлімге өте аласыз. Тексеру фонда аяқталып, балл мен талдау профиліңізде сақталады.',
      en: 'close this tab or move to another section. Assessment will finish in the background, and your score and feedback will be saved to your profile.',
    },
  'К следующей секции Full Mock': {
    kk: 'Full Mock келесі бөліміне',
    en: 'Continue to the next Full Mock section',
  },
  'В личный кабинет': { kk: 'Жеке кабинетке', en: 'Go to dashboard' },
  'К списку Writing': { kk: 'Writing тізіміне', en: 'Back to Writing' },
  'Работа над ошибками': { kk: 'Қателерді талдау', en: 'Review your work' },
  'Не удалось загрузить разбор': {
    kk: 'Талдауды жүктеу мүмкін болмады',
    en: 'Could not load feedback',
  },
  'Не удалось проверить эссе': {
    kk: 'Эссені тексеру мүмкін болмады',
    en: 'Could not assess the essay',
  },
  'Автоматическая проверка завершилась с ошибкой. Начните новую попытку или повторите позже.':
    {
      kk: 'Автоматты тексеру кезінде қате пайда болды. Жаңа әрекетті бастаңыз немесе кейінірек қайталаңыз.',
      en: 'Automatic assessment failed. Start a new attempt or try again later.',
    },
  'Оценка сформирована по 4 критериям IELTS Writing': {
    kk: 'Баға IELTS Writing-тің 4 критерийі бойынша қойылды',
    en: 'Score based on the 4 IELTS Writing criteria',
  },
  эссе: { kk: 'эссе', en: 'essay' },
  'Резюме проверки': { kk: 'Тексеру қорытындысы', en: 'Assessment summary' },
  'Сильные стороны': { kk: 'Күшті тұстары', en: 'Strengths' },
  'Что улучшить': { kk: 'Нені жақсартуға болады', en: 'Areas to improve' },
  'Оценка носит учебный характер; фактический результат IELTS определяет экзаменатор.':
    {
      kk: 'Бұл оқу мақсатындағы баға; IELTS емтиханының нақты нәтижесін емтихан алушы анықтайды.',
      en: 'This score is for practice only; your official IELTS result is determined by an examiner.',
    },
  'Готовим Speaking-тренировку…': {
    kk: 'Speaking жаттығуы дайындалуда…',
    en: 'Preparing Speaking practice…',
  },
  'Формируем карточки заданий Parts 1–3 и инициализируем модуль записи голоса.':
    {
      kk: 'Parts 1–3 тапсырмалары дайындалып, дауыс жазу жүйесі іске қосылуда.',
      en: 'Preparing Parts 1–3 prompts and setting up voice recording.',
    },
  'Готовим устную часть…': {
    kk: 'Speaking бөлімі дайындалуда…',
    en: 'Preparing Speaking…',
  },
  'Загружаем карточки заданий, настраиваем микрофон и проверяем статус сессии…':
    {
      kk: 'Тапсырмалар жүктеліп, микрофон реттеліп, сессия күйі тексерілуде…',
      en: 'Loading prompts, setting up your microphone, and checking the session…',
    },
  'К Speaking': { kk: 'Speaking бөліміне', en: 'Back to Speaking' },
  'Не удалось отправить Speaking:': {
    kk: 'Speaking жауабын жіберу мүмкін болмады:',
    en: 'Could not submit Speaking:',
  },
  'Прогресс частей Speaking': {
    kk: 'Speaking бөлімдерінің прогресі',
    en: 'Speaking part progress',
  },
  'Ответ готов': { kk: 'Жауап дайын', en: 'Response ready' },
  Сейчас: { kk: 'Қазір', en: 'Current' },
  'Не начато': { kk: 'Басталмаған', en: 'Not started' },
  'Время на подготовку': { kk: 'Дайындық уақыты', en: 'Preparation time' },
  'Время на ответ': { kk: 'Жауап беру уақыты', en: 'Response time' },
  'Начать 1 минуту подготовки': {
    kk: '1 минут дайындықты бастау',
    en: 'Start 1-minute preparation',
  },
  'Подготовьте идеи: запись начнётся только после нажатия «Начать ответ».': {
    kk: 'Ойларыңызды дайындаңыз: жазба «Жауапты бастау» батырмасын басқаннан кейін басталады.',
    en: 'Plan your ideas. Recording starts only when you select “Start speaking”.',
  },
  'Записать заново': { kk: 'Қайта жазу', en: 'Record again' },
  'Начать запись': { kk: 'Жазуды бастау', en: 'Start recording' },
  'Остановить и сохранить': { kk: 'Тоқтату және сақтау', en: 'Stop and save' },
  'Сохраняем запись…': { kk: 'Жазба сақталуда…', en: 'Saving recording…' },
  'Запись сохранена.': { kk: 'Жазба сақталды.', en: 'Recording saved.' },
  'Черновая расшифровка (необязательно, но полезна без микрофона)': {
    kk: 'Сөйлеу мәтінінің нобайы (міндетті емес, микрофонсыз пайдалы)',
    en: 'Draft transcript (optional, useful if you don’t have a microphone)',
  },
  'Можно напечатать ответ вручную или наговорить голосом — аудио расшифруется автоматически.':
    {
      kk: 'Жауабыңызды теруге немесе дауыстап айтуға болады — аудио автоматты түрде мәтінге айналады.',
      en: 'Type your answer or say it aloud—your audio will be transcribed automatically.',
    },
  'Наша система пока не может определить произношение (Pronunciation). Оценка будет сформирована по беглости, словарному запасу и грамматической точности.':
    {
      kk: 'Жүйеміз әзірше Pronunciation (айтылым) бағалай алмайды. Баға сөйлеу еркіндігі, сөздік қор және грамматика бойынша қойылады.',
      en: 'Our system can’t assess pronunciation yet. Your score will be based on fluency, vocabulary, and grammatical accuracy.',
    },
  'К следующей части': { kk: 'Келесі бөлімге', en: 'Next part' },
  'Проверяем работу…': {
    kk: 'Жұмыс тексерілуде…',
    en: 'Assessing your response…',
  },
  'Отправить на проверку': {
    kk: 'Тексеруге жіберу',
    en: 'Submit for assessment',
  },
  'Не удалось проверить Speaking': {
    kk: 'Speaking жауабын тексеру мүмкін болмады',
    en: 'Could not assess Speaking',
  },
  'Расшифровываем аудио и проверяем ответы…': {
    kk: 'Аудио мәтінге айналдырылып, жауаптар тексерілуде…',
    en: 'Transcribing audio and assessing your answers…',
  },
  'Наша система пока не может определить Pronunciation (произношение). Оценка сформирована по беглости, словарному запасу и грамматической точности.':
    {
      kk: 'Жүйеміз әзірше Pronunciation (айтылым) бағалай алмайды. Баға сөйлеу еркіндігі, сөздік қор және грамматика бойынша қойылды.',
      en: 'Our system can’t assess pronunciation yet. This score is based on fluency, vocabulary, and grammar.',
    },
  'Учебная оценка по 4 критериям IELTS Speaking': {
    kk: 'IELTS Speaking-тің 4 критерийі бойынша оқу бағасы',
    en: 'Practice score across 4 IELTS Speaking criteria',
  },
  'Учебная оценка по 3 критериям (система пока не может определить произношение)':
    {
      kk: '3 критерий бойынша оқу бағасы (жүйе әзірше айтылымды бағалай алмайды)',
      en: 'Practice score across 3 criteria (pronunciation is not assessed yet)',
    },
  часть: { kk: 'бөлім', en: 'part' },
  'Резюме экзаменатора': {
    kk: 'Емтихан алушының қорытындысы',
    en: 'Examiner summary',
  },
  'Наша система пока не может определить произношение. Оценка рассчитывается по 3 критериям: беглость, вокабуляр и грамматика.':
    {
      kk: 'Жүйеміз әзірше айтылымды бағалай алмайды. Баға 3 критерий бойынша есептеледі: сөйлеу еркіндігі, сөздік қор және грамматика.',
      en: 'Our system can’t assess pronunciation yet. The score uses 3 criteria: fluency, vocabulary, and grammar.',
    },
  'Комментарий не получен.': {
    kk: 'Пікір алынбады.',
    en: 'No comment provided.',
  },
  РАСШИФРОВКА: { kk: 'СӨЙЛЕУ МӘТІНІ', en: 'TRANSCRIPT' },
  'Браузер не поддерживает запись аудио. Введите расшифровку вручную.': {
    kk: 'Браузер аудио жазуды қолдамайды. Сөйлеу мәтінін қолмен енгізіңіз.',
    en: 'Your browser does not support audio recording. Enter a transcript instead.',
  },
  'Запись получилась пустой. Попробуйте ещё раз.': {
    kk: 'Жазба бос. Қайталап көріңіз.',
    en: 'The recording is empty. Please try again.',
  },
  'Доступ к микрофону не разрешён. Разрешите его или введите расшифровку вручную.':
    {
      kk: 'Микрофонға рұқсат берілмеген. Рұқсат беріңіз немесе мәтінді қолмен енгізіңіз.',
      en: 'Microphone access is blocked. Allow access or enter a transcript manually.',
    },
  'Не удалось запустить микрофон. Проверьте устройство и попробуйте снова.': {
    kk: 'Микрофонды іске қосу мүмкін болмады. Құрылғыны тексеріп, қайталап көріңіз.',
    en: 'Could not start the microphone. Check your device and try again.',
  },
  'Личные данные сохранены.': {
    kk: 'Жеке деректер сақталды.',
    en: 'Personal details saved.',
  },
  'Цель обновлена — dashboard уже получил новые данные.': {
    kk: 'Мақсат жаңартылды — басқару панелі жаңарды.',
    en: 'Goal updated—the dashboard has refreshed.',
  },
  'Укажите имя длиной не менее двух символов.': {
    kk: 'Кемінде екі таңбадан тұратын есім енгізіңіз.',
    en: 'Enter a name with at least two characters.',
  },
  'Загружаем профиль…': { kk: 'Профиль жүктелуде…', en: 'Loading profile…' },
  'Фото профиля': { kk: 'Профиль фотосы', en: 'Profile photo' },
  'Загрузите JPG, PNG или WebP. Рекомендуемый размер — от 400 × 400 пикселей.':
    {
      kk: 'JPG, PNG немесе WebP файлын жүктеңіз. Ұсынылатын өлшемі — кемінде 400 × 400 пиксель.',
      en: 'Upload a JPG, PNG, or WebP image. Recommended size: at least 400 × 400 pixels.',
    },
  'Выбрать фото профиля': {
    kk: 'Профиль фотосын таңдау',
    en: 'Choose profile photo',
  },
  'Загрузить фото': { kk: 'Фото жүктеу', en: 'Upload photo' },
  'Личные данные': { kk: 'Жеке деректер', en: 'Personal details' },
  'Основная информация вашего аккаунта.': {
    kk: 'Аккаунтыңыз туралы негізгі ақпарат.',
    en: 'Basic information about your account.',
  },
  Фамилия: { kk: 'Тегі', en: 'Last name' },
  'Введите имя': { kk: 'Атыңызды енгізіңіз', en: 'Enter your name' },
  'Введите фамилию': { kk: 'Тегіңізді енгізіңіз', en: 'Enter your last name' },
  'Электронная почта': { kk: 'Электрондық пошта', en: 'Email' },
  'Введите электронную почту': {
    kk: 'Электрондық поштаңызды енгізіңіз',
    en: 'Enter your email',
  },
  'Изменение email пока не поддерживается backend.': {
    kk: 'Электрондық поштаны өзгерту әзірше қолжетімсіз.',
    en: 'Changing your email is not supported yet.',
  },
  'Сохранить изменения': { kk: 'Өзгерістерді сақтау', en: 'Save changes' },
  'Параметры подготовки': { kk: 'Дайындық параметрлері', en: 'Study settings' },
  'Цель и формат, под которые будет строиться план.': {
    kk: 'Жоспар құрылатын мақсат пен емтихан форматы.',
    en: 'The goal and exam format used to build your plan.',
  },
  'Сохранить параметры': { kk: 'Параметрлерді сақтау', en: 'Save settings' },
  'Выберите полезные напоминания.': {
    kk: 'Қажетті еске салғыштарды таңдаңыз.',
    en: 'Choose the reminders you want to receive.',
  },
  'Напоминания о занятиях': {
    kk: 'Сабақ туралы еске салғыштар',
    en: 'Study reminders',
  },
  'Перед запланированной практикой.': {
    kk: 'Жоспарланған жаттығу алдында.',
    en: 'Before a planned practice session.',
  },
  'Еженедельный отчёт': { kk: 'Апталық есеп', en: 'Weekly report' },
  'Краткая сводка прогресса за неделю.': {
    kk: 'Аптадағы прогрестің қысқаша қорытындысы.',
    en: 'A brief summary of your weekly progress.',
  },
  'Отображение лисёнка Юки на экране.': {
    kk: 'Юки түлкісін экранда көрсету.',
    en: 'Show Yuki the fox in the app.',
  },
  'Если скрыть, останется маленькая кнопка чата.': {
    kk: 'Жасырсаңыз, шағын чат батырмасы қалады.',
    en: 'When hidden, a small chat button remains.',
  },
  'Показывать питомца': { kk: 'Көмекшіні көрсету', en: 'Show companion' },
  Безопасность: { kk: 'Қауіпсіздік', en: 'Security' },
  'Вход в аккаунт доступен только через Google.': {
    kk: 'Аккаунтқа тек Google арқылы кіруге болады.',
    en: 'You can sign in only with Google.',
  },
  'Цель обновлена': { kk: 'Мақсат жаңартылды', en: 'Goal updated' },
  'Dashboard уже пересчитан под новый балл и дату экзамена.': {
    kk: 'Басқару панелі жаңа балл мен емтихан күніне сай жаңартылды.',
    en: 'The dashboard has been updated with your new score and exam date.',
  },
  Готово: { kk: 'Дайын', en: 'Done' },
  'Формат, целевой балл и дата экзамена — под них строится план подготовки.': {
    kk: 'Формат, мақсатты балл мен емтихан күніне сай дайындық жоспары құрылады.',
    en: 'Your study plan is based on your exam format, target score, and exam date.',
  },
  'Загружаем текущую цель…': {
    kk: 'Ағымдағы мақсат жүктелуде…',
    en: 'Loading your current goal…',
  },
  'Не удалось загрузить текущую цель.': {
    kk: 'Ағымдағы мақсатты жүктеу мүмкін болмады.',
    en: 'Could not load your current goal.',
  },
  'Мы автоматически подберём Listening, Reading, Writing и Speaking из общей библиотеки — сначала непройденные тесты. Четыре секции подряд, отдельные таймеры секций и итоговый Band Score.':
    {
      kk: 'Listening, Reading, Writing және Speaking тесттерін кітапханадан автоматты таңдаймыз — алдымен орындалмаған тесттер. Төрт бөлімнің әрқайсысында жеке таймер және қорытынды Band Score бар.',
      en: 'We’ll choose Listening, Reading, Writing, and Speaking tests from the library, prioritising ones you haven’t taken. Complete all four sections with separate timers and get an overall band score.',
    },
  'Один бесплатный Academic Full Mock: четыре секции, отдельные таймеры секций, итоговый Band Score и разбор ответов. Для следующих тестов войдите в аккаунт.':
    {
      kk: 'Бір Academic Full Mock тегін: төрт бөлім, әр бөлімге жеке таймер, қорытынды Band Score және жауаптарды талдау. Басқа тесттер үшін аккаунтқа кіріңіз.',
      en: 'Get one free Academic Full Mock with four sections, separate timers, an overall band score, and answer review. Sign in to take more tests.',
    },
  'Войдите в аккаунт, чтобы продолжить': {
    kk: 'Жалғастыру үшін аккаунтқа кіріңіз',
    en: 'Sign in to continue',
  },
  'Другие тесты, план подготовки и история прогресса доступны в аккаунте. Без регистрации можно пройти один полный пробный IELTS и разобрать результаты.':
    {
      kk: 'Басқа тесттер, дайындық жоспары және прогресс тарихы аккаунтта қолжетімді. Тіркелмей-ақ бір толық IELTS сынақ тестін тапсырып, нәтижелерін талдауға болады.',
      en: 'Your account includes more tests, a study plan, and progress history. You can take one full IELTS mock and review your results without signing up.',
    },
  'К бесплатному Full Mock': {
    kk: 'Тегін Full Mock-қа өту',
    en: 'Try the free Full Mock',
  },
  'Бесплатный Full Mock': { kk: 'Тегін Full Mock', en: 'Free Full Mock' },
  'Полный пробный IELTS': {
    kk: 'Толық IELTS сынақ тесті',
    en: 'Full IELTS mock test',
  },
  'Проверьте свой уровень IELTS — пройдите полный пробный тест.': {
    kk: 'IELTS деңгейіңізді тексеру үшін толық сынақ тестін тапсырыңыз.',
    en: 'Check your IELTS level with a full mock test.',
  },
  'Открыть мой тест и результаты': {
    kk: 'Тестім мен нәтижелерімді ашу',
    en: 'Open my test and results',
  },
  'Гостевой запуск пока недоступен. Войдите в аккаунт для подготовки.': {
    kk: 'Қонақ режиміндегі тест әзірше қолжетімсіз. Дайындық үшін аккаунтқа кіріңіз.',
    en: 'Guest practice is temporarily unavailable. Sign in to continue preparing.',
  },
  'Готовим тест…': { kk: 'Тест дайындалуда…', en: 'Preparing test…' },
  'Начать бесплатный Full Mock': {
    kk: 'Тегін Full Mock бастау',
    en: 'Start a free Full Mock',
  },
  'Нажимая «Начать», вы принимаете': {
    kk: '«Бастау» батырмасын басу арқылы мына құжаттармен келісесіз:',
    en: 'By selecting “Start”, you agree to the',
  },
  'условия использования': { kk: 'Пайдалану шарттары', en: 'Terms of Use' },
  'политика конфиденциальности': {
    kk: 'Құпиялылық саясаты',
    en: 'Privacy Policy',
  },
  ', включая обработку ответов и аудио для AI-проверки. Таймер каждой секции начнётся при её открытии.':
    {
      kk: ', оның ішінде AI тексеруі үшін жауаптар мен аудионы өңдеу. Әр бөлімнің таймері ашылғанда іске қосылады.',
      en: ', including processing your answers and audio for AI assessment. Each section’s timer starts when you open it.',
    },
  'Для других тестов': { kk: 'Басқа тесттер үшін', en: 'For other tests,' },
  'войдите в аккаунт': { kk: 'аккаунтқа кіріңіз', en: 'sign in' },
  'Войдите через Google, чтобы открыть другие тесты и сохранить прогресс.': {
    kk: 'Басқа тесттерге қол жеткізу және прогресті сақтау үшін Google арқылы кіріңіз.',
    en: 'Sign in with Google to access more tests and save your progress.',
  },
  'Загружаем изображение…': { kk: 'Сурет жүктелуде…', en: 'Loading image…' },
  'Пока не определяется': { kk: 'Әзірше бағаланбайды', en: 'Not assessed yet' },
  'Проверяем доступные тесты…': {
    kk: 'Қолжетімді тесттер тексерілуде…',
    en: 'Checking available tests…',
  },
  'Учитываем уже выполненные задания, чтобы подобрать новые.': {
    kk: 'Жаңа тесттер таңдау үшін орындалған тапсырмалар ескеріледі.',
    en: 'We count what you’ve already done to pick something new.',
  },
  'Не удалось подготовить Full Mock': {
    kk: 'Full Mock дайындау мүмкін болмады',
    en: 'Could not prepare the Full Mock',
  },
  'Мы автоматически подберём тесты из общей библиотеки. Сначала — задания, которые вы ещё не выполняли. Выбирать отдельный mock-тест не нужно.':
    {
      kk: 'Тесттерді ортақ кітапханадан автоматты таңдаймыз. Алдымен орындалмаған тапсырмалар. Бөлек mock-тест таңдаудың қажеті жоқ.',
      en: 'We assemble your test set from the shared library automatically, starting with tasks you haven’t done yet. No need to pick individual mock tests.',
    },
  'Четыре секции в одной сессии': {
    kk: 'Бір сессияда төрт бөлім',
    en: 'Four sections in one session',
  },
  'Порядок секций экзамена': {
    kk: 'Емтихан бөлімдерінің реті',
    en: 'Exam section order',
  },
  'минут · отдельные таймеры секций': {
    kk: 'минут · әр бөлімнің жеке таймері',
    en: 'minutes · separate section timers',
  },
  'После сдачи секции вы переходите к следующей. Ответы сохраняются, а после проверки всех четырёх секций появится общий Band Score.':
    {
      kk: 'Бөлімді тапсырған соң келесісіне өтесіз. Жауаптар сақталады; төрт бөлімінің бәрі тексерілген соң жалпы Band Score шығады.',
      en: 'After each section you move to the next one. Answers are saved, and an overall band score appears once all four sections are assessed.',
    },
  'Ваш прогресс по доступным тестам': {
    kk: 'Қолжетімді тесттер бойынша прогресіңіз',
    en: 'Your progress across available tests',
  },
  'Учитываются выполненные тесты и в практике, и в Full Mock. Повторные попытки не увеличивают счётчик.':
    {
      kk: 'Практикада да, Full Mock-та да орындалған тесттер есептеледі. Қайталап тапсыру есепті ұлгайытқан жоқ.',
      en: 'Completed practice and Full Mock tests both count. Retries don’t increase the counter.',
    },
  'выполнено тестов': { kk: 'орындалған тест', en: 'completed tests' },
  выполнено: { kk: 'орындалды', en: 'completed' },
  'Выберите Academic или General в': {
    kk: 'Академиялық немесе General форматты',
    en: 'Choose Academic or General in your',
  },
  профиле: { kk: 'профильде', en: 'profile' },
  ', чтобы мы подобрали подходящие тесты.': {
    kk: 'таңдап, біз сізге сай тесттер жинаймыз.',
    en: 'so we can pick suitable tests.',
  },
  'В следующих mock-тестах будут повторы': {
    kk: 'Келесі mock-тесттерде қайталаулар болады',
    en: 'The next mock tests will repeat some tasks',
  },
  'Вы выполнили все доступные тесты. Full Mock будет собран из ранее выполненных заданий, выбранных случайно.':
    {
      kk: 'Қолжетімді тесттердің бәрін орындадыңыз. Full Mock бұрын орындалған тапсырмалардан кездейсоқ жиналады.',
      en: 'You’ve completed every available test. The Full Mock will be built from random earlier tasks.',
    },
  'Вы выполнили все доступные тесты по секциям:': {
    kk: 'Бөлімдер бойынша қолжетімді тесттердің бәрін орындадыңыз:',
    en: 'You’ve completed every available test for these sections:',
  },
  '. В новых Full Mock эти секции будут выбраны случайно из ранее выполненных тестов. Для остальных секций сначала подберём непройденные задания.':
    {
      kk: '. Жаңа Full Mock-та бұл бөлімдер бұрын орындалған тесттерден кездейсоқ таңдалады. Қалған бөлімдерге алдымен орындалмаған тапсырмалар ұсынылады.',
      en: '. In the new Full Mock these sections will be chosen randomly from your earlier tests. Untouched tasks will be used first for the other sections.',
    },
  'Состав уже начатой сессии не изменится.': {
    kk: 'Басталған сессияның құрамы өзгеріспен қалады.',
    en: 'Your in-progress session keeps the same set of tests.',
  },
  'Для нового Full Mock пока недостаточно полных опубликованных тестов:': {
    kk: 'Жаңа Full Mock үшін жарияланған толық тесттер әзірге жеткіліксіз:',
    en: 'Not enough full published tests are available for a new Full Mock right now:',
  },
  'Текущую сессию можно продолжить.': {
    kk: 'Ағымдағы сессияны жалғастыруға болады.',
    en: 'You can continue your current session.',
  },
  'Пока можно заниматься отдельными секциями в практике.': {
    kk: 'Әзірге практикада бөлек бөлімдермен жаттығуға болады.',
    en: 'For now you can practise individual sections in Practice.',
  },
  'Продолжить текущую сессию': {
    kk: 'Ағымдағы сессияны жалғастыру',
    en: 'Continue the current session',
  },
  'Начать Full Mock? У каждой секции свой таймер. Общая продолжительность:': {
    kk: 'Full Mock бастайсыз ба? Әр бөлімнің жеке таймері бар. Жалпы ұзақтығы:',
    en: 'Start the Full Mock? Each section has its own timer. Total duration:',
  },
  'Начать Full Mock': { kk: 'Full Mock бастау', en: 'Start the Full Mock' },
  'Начать заново? Текущая сессия будет закрыта. Мы подберём новый набор тестов, таймер начнётся заново.':
    {
      kk: 'Қайта бастайсыз ба? Ағымдағы сессия жабылады; жаңа тесттер таңдап, таймер қайта іске қосылады.',
      en: 'Start over? Your current session will be closed. We’ll pick a fresh set of tests and restart the timers.',
    },
  'Начать заново': { kk: 'Қайта бастау', en: 'Start over' },
  'К отдельным секциям': { kk: 'Бөлек бөлімдерге', en: 'Individual sections' },
  'Готовим экзамен…': { kk: 'Емтихан дайындалуда…', en: 'Preparing the exam…' },
  'Открыть последнюю попытку': {
    kk: 'Соңғы әрекетті ашу',
    en: 'Open the latest attempt',
  },
  'Пересдать тест': { kk: 'Тестті қайта тапсыру', en: 'Retake this test' },
  'Пересдать полный тест?': {
    kk: 'Толық тестті қайта тапсыру керек пе?',
    en: 'Retake the full test?',
  },
  'Новая попытка начнётся с чистыми ответами и таймерами. Предыдущий результат сохранится.':
    {
      kk: 'Жаңа әрекет таза жауаптар мен таймерлермен басталады. Алдыңғы нәтиже сақталады.',
      en: 'Your new attempt starts with clean answers and timers. The previous result stays saved.',
    },
  'Незавершённый тест, если он есть, будет закрыт.': {
    kk: 'Аяқталмаған тест болса, жабылады.',
    en: 'Any unfinished test will be closed.',
  },
  'Продолжить без регистрации': {
    kk: 'Тіркелмей жалғастыру',
    en: 'Continue without signing up',
  },
  'Попробовать один Full Mock без регистрации': {
    kk: 'Тіркелмей бір Full Mock байқап көру',
    en: 'Try one Full Mock without signing up',
  },
  '4 секции, 40 вопросов. Диалоги и академические лекции с таймингом и автоматической проверкой ответов.':
    {
      kk: '4 бөлім, 40 сұрақ. Диалогтар мен академиялық дәрістер: таймермен, жауаптар автоматты тексеріледі.',
      en: '4 sections, 40 questions. Dialogues and academic lectures, timed, with automatic scoring.',
    },
  '3 академических текста, 40 вопросов. Задания True/False/Not Given, множественный выбор и заполнение пропусков.':
    {
      kk: '3 академиялық мәтін, 40 сұрақ. True/False/Not Given, бірнеше таңдау және бос орындарды толтыру.',
      en: '3 academic passages, 40 questions. True/False/Not Given, multiple choice, and gap-fill.',
    },
  'Условия использования': { kk: 'Пайдалану шарттары', en: 'Terms of Use' },
  'Распечатать документ': { kk: 'Құжатты басып шығару', en: 'Print document' },
  Печать: { kk: 'Басып шығару', en: 'Print' },
  'Войти в кабинет': { kk: 'Жеке кабинетке кіру', en: 'Sign in' },
  'Назад ко входу': { kk: 'Кіруге оралу', en: 'Back to sign in' },
  Редакция: { kk: 'Редакция', en: 'Version' },
  'Последнее обновление:': { kk: 'Соңғы жаңарту:', en: 'Last updated:' },
  'Юрисдикция:': { kk: 'Юрисдикция:', en: 'Jurisdiction:' },
  'Контакты:': { kk: 'Байланыс:', en: 'Contact:' },
  'Республика Казахстан': {
    kk: 'Қазақстан Республикасы',
    en: 'Republic of Kazakhstan',
  },
  'Содержание документа': { kk: 'Құжаттың мазмұны', en: 'Table of contents' },
  'Возникли вопросы?': { kk: 'Сұрақтарыңыз бар ма?', en: 'Questions?' },
  'По любым вопросам обработки персональных данных пишите на': {
    kk: 'Жеке деректерді өңдеу бойынша кез келген сұрақ бойынша жазыңыз:',
    en: 'For any personal-data questions, write to',
  },
  '© 2026 Yrys Academy. Все права защищены. Астана, Казахстан.': {
    kk: '© 2026 Yrys Academy. Барлық құқықтар қорғалған. Астана, Қазақстан.',
    en: '© 2026 Yrys Academy. All rights reserved. Astana, Kazakhstan.',
  },
  Вход: { kk: 'Кіру', en: 'Sign in' },
  'Выберите дату экзамена': {
    kk: 'Емтихан күнін таңдаңыз',
    en: 'Choose your exam date',
  },
  Сегодня: { kk: 'Бүгін', en: 'Today' },
  'Дата в прошлом': { kk: 'Күн өткенде', en: 'Date is in the past' },
  Очистить: { kk: 'Тазалау', en: 'Clear' },
  'Быстро:': { kk: 'Жылдам:', en: 'Quick:' },
  'Предыдущий месяц': { kk: 'Алдыңғы ай', en: 'Previous month' },
  'Следующий месяц': { kk: 'Келесі ай', en: 'Next month' },
  'Настоящая Политика описывает, как платформа Yrys Academy собирает, использует, шифрует, хранит и защищает ваши персональные данные при использовании образовательного сервиса.':
    {
      kk: 'Осы Саясат Yrys Academy платформасының білім беру қызметін пайдаланған кезде жеке деректеріңізді қалай жинайтынын, пайдаланатынын, шифрлайтынын, сақтайтынын және қорғайтынын сипаттайды.',
      en: 'This Policy explains how the Yrys Academy platform collects, uses, encrypts, stores, and protects your personal data when you use the learning service.',
    },
  'Пользовательское соглашение, регулирующее порядок и правила использования образовательной платформы подготовки к IELTS «Yrys Academy».':
    {
      kk: 'IELTS-ке дайындықтың білім беру платформасы «Yrys Academy»-ні пайдалану тәртібі мен ережелерін реттейтін пайдаланушы келісімшарты.',
      en: 'The user agreement governing use of the Yrys Academy preparation platform.',
    },
  '5 октября 2026 г.': { kk: '2026 ж. 5 қазан', en: '5 October 2026' },
  '1. Общие положения': { kk: '1. Жалпы ережелер', en: '1. General terms' },
  '2. Оператор данных и контакты': {
    kk: '2. Деректерді өңдеуші және байланыс',
    en: '2. Data controller and contacts',
  },
  '3. Собираемые данные': {
    kk: '3. Жиналатын деректер',
    en: '3. Data we collect',
  },
  '4. Цели обработки данных': {
    kk: '4. Деректерді өңдеу мақсаттары',
    en: '4. Purposes of data processing',
  },
  '5. Использование AI и анализ ответов': {
    kk: '5. AI қолдану және жауаптарды талдау',
    en: '5. AI usage and answer analysis',
  },
  '6. Правовые основания': { kk: '6. Құқықтық негіздер', en: '6. Legal bases' },
  '7. Передача третьим лицам': {
    kk: '7. Үшінші тұлғаларға беру',
    en: '7. Sharing with third parties',
  },
  '8. Шифрование и безопасность данных': {
    kk: '8. Деректерді шифрлау және қауіпсіздік',
    en: '8. Encryption and data security',
  },
  '9. Права пользователя': {
    kk: '9. Пайдаланушы құқықтары',
    en: '9. Your rights',
  },
  '10. Файлы cookie и технические логи': {
    kk: '10. Cookie файлдары және технологиялық логтар',
    en: '10. Cookies and technical logs',
  },
  '11. Изменение политики': {
    kk: '11. Саясатты өзгерту',
    en: '11. Changes to this policy',
  },
  '2. Учетная запись и авторизация': {
    kk: '2. Аккаунт және авторизация',
    en: '2. Account and sign-in',
  },
  '3. Правила использования платформы': {
    kk: '3. Платформаны пайдалану ережелері',
    en: '3. Platform rules of use',
  },
  '4. Интеллектуальная собственность и бренд IELTS': {
    kk: '4. Зияткерлік меншік және IELTS бренді',
    en: '4. Intellectual property and the IELTS brand',
  },
  '5. Использование искусственного интеллекта': {
    kk: '5. Жасанды интеллектті қолдану',
    en: '5. Use of artificial intelligence',
  },
  '7. Ограничение ответственности': {
    kk: '7. Жауапкершілікті шектеу',
    en: '7. Limitation of liability',
  },
  '6. Подписки и платные услуги': {
    kk: '6. Жазылымдар және ақылы қызметтер',
    en: '6. Subscriptions and paid services',
  },
  '8. Прекращение действия соглашения': {
    kk: '8. Келісімшартты тоқтату',
    en: '8. Termination of the agreement',
  },
  '9. Применимое право и споры': {
    kk: '9. Қолданылатын құқық және даулар',
    en: '9. Governing law and disputes',
  },
  '10. Контакты': { kk: '10. Байланыс', en: '10. Contacts' },
  'Юридические документы': { kk: 'Құқықтық құжаттар', en: 'Legal documents' },
  'Определите стартовый уровень': {
    kk: 'Бастапқы деңгейіңізді анықтаңыз',
    en: 'Find your starting level',
  },
  'Короткая диагностика поможет подобрать подходящую сложность.': {
    kk: 'Қысқа диагностика сізге сай қиындық деңгейін таңдауға көмектеседі.',
    en: 'A short diagnostic will help us match you with the right difficulty.',
  },
  'Выбрать навык и формат задания': {
    kk: 'Дағды мен тапсырма форматын таңдау',
    en: 'Choose a skill and task format',
  },
  'AI-провайдеры — Yrys Academy': {
    kk: 'AI-провайдерлер — Yrys Academy',
    en: 'AI providers — Yrys Academy',
  },
  'Yrys Academy — подготовка к IELTS онлайн': {
    kk: 'Yrys Academy — IELTS-ке онлайн дайындық',
    en: 'Yrys Academy — online IELTS preparation',
  },
  'Waitlist — администрирование Yrys Academy': {
    kk: 'Waitlist — Yrys Academy әкімшілігі',
    en: 'Waitlist — Yrys Academy admin',
  },
  'Администрирование — Yrys Academy': {
    kk: 'Әкімшілік — Yrys Academy',
    en: 'Administration — Yrys Academy',
  },
  'Аналитика — Yrys Academy': {
    kk: 'Аналитика — Yrys Academy',
    en: 'Analytics — Yrys Academy',
  },
  'Войти — Yrys Academy': {
    kk: 'Кіру — Yrys Academy',
    en: 'Sign in — Yrys Academy',
  },
  'Доступ запрещён — Yrys Academy': {
    kk: 'Кіруге тыйым салынған — Yrys Academy',
    en: 'Access denied — Yrys Academy',
  },
  'Панель управления — Yrys Academy': {
    kk: 'Басқару панелі — Yrys Academy',
    en: 'Dashboard — Yrys Academy',
  },
  'Политика конфиденциальности — Yrys Academy': {
    kk: 'Құпиялылық саясаты — Yrys Academy',
    en: 'Privacy Policy — Yrys Academy',
  },
  'Практика — Yrys Academy': {
    kk: 'Практика — Yrys Academy',
    en: 'Practice — Yrys Academy',
  },
  'Предпросмотр теста — Yrys Academy': {
    kk: 'Тест алдын ала қарау — Yrys Academy',
    en: 'Test preview — Yrys Academy',
  },
  'Профиль — Yrys Academy': {
    kk: 'Профиль — Yrys Academy',
    en: 'Profile — Yrys Academy',
  },
  'Условия использования — Yrys Academy': {
    kk: 'Пайдалану шарттары — Yrys Academy',
    en: 'Terms of Use — Yrys Academy',
  },
}

// Domain dictionaries live in separate modules so parallel work doesn't collide.
const translations: TranslationMap = {
  ...baseTranslations,
  ...adminContentTranslations,
  ...adminCoreTranslations,
  ...authTranslations,
  ...billingTranslations,
  ...blogTranslations,
  ...dashboardTranslations,
  ...legalPrivacyTranslations,
  ...legalTermsTranslations,
  ...reviewTranslations,
}

/** Route head functions can still hold a title from the previous device locale. */
export function localizePageTitle(title: string, language: Language): string {
  const entry = Object.entries(translations).find(
    ([source, values]) =>
      source === title || values?.kk === title || values?.en === title,
  )
  if (entry)
    return language === 'ru' ? entry[0] : (entry[1]?.[language] ?? entry[0])
  // Preserve authored article titles; only the branded suffix is interface copy.
  const blog =
    translations['Блог Yrys Academy']?.[language] ?? 'Блог Yrys Academy'
  const paginated = title.match(/^Блог Yrys Academy — страница (\d+)$/)
  if (paginated)
    return language === 'en'
      ? `${blog} — page ${paginated[1]}`
      : language === 'kk'
        ? `${blog} — ${paginated[1]}-бет`
        : title
  return title.replace(/ — Блог Yrys Academy$/, ` — ${blog}`)
}

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (source: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function isLanguage(value: string | null): value is Language {
  return value === 'ru' || value === 'kk' || value === 'en'
}

/** Device language outside React (API query params, .ts modules). */
export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'ru'
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return isLanguage(stored) ? stored : 'ru'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru')

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (isLanguage(storedLanguage)) setLanguageState(storedLanguage)
  }, [])

  useEffect(() => {
    activeLanguage = language
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((nextLanguage: Language) => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage)
    setLanguageState(nextLanguage)
  }, [])

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (source) => translations[source]?.[language] ?? source,
    }),
    [language, setLanguage],
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context)
    throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
