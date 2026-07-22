export const navigation = [
  { label: 'Методика', href: '#method' },
  { label: 'Практика', href: '#practice' },
  { label: 'Прогресс', href: '#progress' },
] as const

export const heroContent = {
  eyebrow: 'Сфокусированная подготовка к IELTS',
  titleStart: 'Понятный путь к вашему целевому баллу',
  titleAccent: 'IELTS',
  description:
    'Тренируйте все четыре навыка, находите слабые места и всегда понимайте, над чем работать дальше.',
  primaryAction: 'Начать подготовку',
  secondaryAction: 'Посмотреть методику',
} as const

export const skillData = [
  {
    id: 'listening',
    label: 'Аудирование',
    description:
      'Тренируйте понимание речи в условиях, приближённых к экзамену.',
  },
  {
    id: 'reading',
    label: 'Чтение',
    description:
      'Учитесь быстро находить нужную информацию и различать похожие формулировки.',
  },
  {
    id: 'writing',
    label: 'Письмо',
    description:
      'Работайте над структурой, аргументацией, связностью и точностью языка.',
  },
  {
    id: 'speaking',
    label: 'Устная речь',
    description:
      'Практикуйте ответы по таймеру и отслеживайте продолжительность своей речи.',
  },
] as const

export type SkillId = (typeof skillData)[number]['id']

export const methodSteps = [
  {
    number: '01',
    title: 'Диагностика',
    description:
      'Определите текущий уровень и навыки, которые сильнее всего ограничивают результат.',
  },
  {
    number: '02',
    title: 'Практика',
    description:
      'Работайте над конкретными задачами вместо бессистемного повторения полных тестов.',
  },
  {
    number: '03',
    title: 'Разбор',
    description:
      'Находите закономерности в ошибках и выбирайте следующий полезный шаг.',
  },
] as const

export const skillProgress = [
  { label: 'Аудирование', value: 72, score: '6,5' },
  { label: 'Чтение', value: 66, score: '6,0' },
  { label: 'Письмо', value: 58, score: '5,5' },
  { label: 'Устная речь', value: 69, score: '6,0' },
] as const

export const footerColumns = [
  {
    title: 'Продукт',
    items: [
      { label: 'Методика', href: '#method' },
      { label: 'Практика', href: '#practice' },
      { label: 'Прогресс', href: '#progress' },
    ],
  },
  {
    title: 'Материалы',
    items: [
      { label: 'О формате IELTS' },
      { label: 'Полезные материалы' },
      { label: 'Частые вопросы' },
    ],
  },
  {
    title: 'Документы',
    items: [
      { label: 'Политика конфиденциальности' },
      { label: 'Условия использования' },
    ],
  },
] as const
