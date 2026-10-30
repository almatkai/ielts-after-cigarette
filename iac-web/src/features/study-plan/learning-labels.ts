import type { Learning } from './learning-api'
import { taskTitle } from './task-performance'

// Match the published micro-skill vocabulary; IDs remain internal provenance.
const skillTitles: Partial<Record<string, string>> = {
  'ms-l-numspelling': 'Числа и написание',
  'ms-l-distractor': 'Дистракторы и самоисправления',
  'ms-l-signpost': 'Маркеры структуры лекции',
  'ms-l-paraphrase': 'Распознавание перефразирования',
  'ms-l-attitude': 'Позиция говорящего',
  'ms-r-tfng': 'Доказательства True / False / Not Given',
  'ms-r-ynng': 'Позиция автора',
  'ms-r-headings': 'Главная мысль абзаца',
  'ms-r-paraphrase': 'Перефразирование и детали',
  'ms-r-flowchart': 'Процессы и причинные связи',
  'ms-w1-overview': 'Обзор Task 1',
  'ms-w1-datagroup': 'Группировка данных Task 1',
  'ms-w1-precision': 'Числовые сравнения Task 1',
  'ms-w2-position': 'Позиция Task 2',
  'ms-w2-argument': 'Развитие аргумента Task 2',
  'ms-w-grammar': 'Грамматика Writing',
  'ms-w-lexis': 'Лексика Writing',
  'ms-w-coherence': 'Связность Writing',
  'ms-w-task-response': 'Выполнение задания Writing (общая рекомендация)',
  'ms-s-part2-turn': 'Развёрнутый ответ Part 2',
  'ms-s-part3-abstract': 'Абстрактное рассуждение Part 3',
  'ms-s-discourse': 'Связность и самокоррекция',
  'ms-s-hypothetical': 'Гипотетические конструкции',
  'ms-s-response-development': 'Рекомендации Speaking (непроверенные)',
}
export function learningSkillTitle(data: Learning, id: string) {
  const title = data.skills.find((skill) => skill.id === id)?.title
  if (title && /[А-Яа-яЁё]/.test(title)) return title
  return skillTitles[id] ?? title ?? 'Учебный навык'
}
export function sourceQuestionLabel(data: Learning, type: string) {
  if (type.startsWith('ms-'))
    return skillTitles[type] ? learningSkillTitle(data, type) : 'Вопрос'
  const task = data.taskPerformance.find((item) => item.questionType === type)
  if (task?.title.trim()) return taskTitle(task)
  const labels: Record<string, string> = {
    true_false_not_given: 'True / False / Not Given',
    yes_no_not_given: 'Yes / No / Not Given',
    multiple_choice: 'Multiple choice',
    matching_information: 'Matching information',
    matching_headings: 'Matching headings',
    matching_features: 'Matching features',
    matching_sentence_endings: 'Matching sentence endings',
    sentence_completion: 'Sentence completion',
    summary_completion: 'Summary completion',
    note_completion: 'Note completion',
    table_completion: 'Table completion',
    form_completion: 'Form completion',
    flow_chart_completion: 'Flow chart completion',
    diagram_label_completion: 'Diagram label completion',
    short_answer: 'Short answer',
    task_response: 'Выполнение задания',
  }
  return labels[type.toLowerCase()] ?? 'Вопрос'
}

// Historical source snapshots can end with serialized evidence. Keep this UI
// projection separate from the immutable source and its answer/feedback.
export function sourceStimulusText(text: string) {
  const tail = text.match(
    /(?:^|\s)(\{\s*["']?(?:quote|evidence)["']?\s*:[\s\S]*\})\s*$/,
  )
  if (!tail) return text
  const readable = text.slice(0, tail.index).trimEnd()
  if (readable) return readable
  try {
    const evidence: unknown = JSON.parse(tail[1])
    if (
      evidence &&
      typeof evidence === 'object' &&
      'quote' in evidence &&
      typeof evidence.quote === 'string'
    )
      return evidence.quote
  } catch {
    // Non-JSON evidence metadata has no readable material to display.
  }
  return ''
}
