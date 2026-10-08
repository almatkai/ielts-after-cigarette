// Russian and Kazakh Cyrillic transliteration for readable post addresses.
const cyrillicToLatin: Record<string, string> = {
  а: 'a',
  ә: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  ғ: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  і: 'i',
  к: 'k',
  қ: 'q',
  л: 'l',
  м: 'm',
  н: 'n',
  ң: 'n',
  о: 'o',
  ө: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ұ: 'u',
  ү: 'u',
  ф: 'f',
  х: 'h',
  һ: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

const maxSlugLength = 80

export function slugify(
  value: string,
  { keepTrailingHyphen = false }: { keepTrailingHyphen?: boolean } = {},
) {
  const latin = Array.from(value.toLowerCase(), (char) =>
    char in cyrillicToLatin ? cyrillicToLatin[char] : char,
  ).join('')
  const slug = latin
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .slice(0, maxSlugLength)
  // While typing, a trailing hyphen is the start of the next word.
  return keepTrailingHyphen
    ? slug.replace(/-{2,}/g, '-')
    : slug.replace(/-+$/, '')
}
