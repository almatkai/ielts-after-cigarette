export type Language = 'ru' | 'kk' | 'en'

/** One source string translated into the non-Russian languages. */
export type TranslationEntry = Partial<Record<Language, string>>

/** A dictionary fragment: Russian source string → translations. */
export type TranslationMap = Partial<Record<string, TranslationEntry>>
