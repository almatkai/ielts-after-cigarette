// Render the server's readable table without injecting source HTML or SVG.
export function LearningStimulus({ text }: { text: string }) {
  if (!text) return null
  const lines = text.split('\n')
  const start = lines.findIndex((line) => line.includes('|'))
  const headers = start >= 0 ? lines[start].split('|').map((v) => v.trim()) : []
  const rows: string[][] = []
  let end = start + 1
  if (headers.length >= 2 && headers.length <= 12 && headers.every(Boolean)) {
    while (end < lines.length && lines[end].includes('|')) {
      const cells = lines[end].split('|').map((v) => v.trim())
      if (
        cells.length !== headers.length ||
        !cells.some((cell) => /\d/.test(cell))
      )
        break
      rows.push(cells)
      end++
    }
  }
  if (rows.length < 2)
    return (
      <p
        className="whitespace-pre-wrap break-words leading-7"
        data-testid="learning-stimulus"
      >
        {text}
      </p>
    )

  const title = lines.slice(0, start).join('\n').trim()
  const after = lines.slice(end).join('\n').trim()
  return (
    <figure
      className="grid min-w-0 max-w-full gap-3"
      data-testid="learning-stimulus"
    >
      {title ? (
        <figcaption className="whitespace-pre-wrap font-medium leading-7">
          {title}
        </figcaption>
      ) : null}
      <p className="text-xs leading-5 text-[#69696d] sm:hidden">
        Таблицу можно прокрутить вбок. Заголовки указывают годы и единицы
        измерения.
      </p>
      <div
        role="region"
        aria-label="Данные задания"
        tabIndex={0}
        className="min-w-0 max-w-full overflow-x-auto rounded-[10px] border border-[#e7e7e4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b82f6]"
      >
        <table className="w-full border-collapse text-left text-sm leading-6">
          <caption className="sr-only">
            {title || 'Числовые данные задания'}
          </caption>
          <thead>
            <tr className="bg-[#fafaf8]">
              {headers.map((header, i) => (
                <th
                  scope="col"
                  key={i}
                  className="min-w-24 border-b border-[#e7e7e4] px-3 py-3 font-semibold"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-[#ededeb] last:border-b-0">
                <th scope="row" className="px-3 py-3 font-medium">
                  {row[0]}
                </th>
                {row.slice(1).map((cell, j) => (
                  <td key={j} className="px-3 py-3 tabular-nums">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {after ? <p className="whitespace-pre-wrap leading-7">{after}</p> : null}
    </figure>
  )
}
