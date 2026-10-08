// Recognition timestamps are approximate. Include context so replay does not
// cut off the answer, and use these same bounds for the displayed range.
export function getReviewAudioRange(
  start?: number,
  end?: number,
  duration?: number,
): { start: number; end: number } | undefined {
  if (
    typeof start !== 'number' ||
    typeof end !== 'number' ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end <= start
  )
    return undefined

  const replayStart = Math.max(0, Math.floor(start - 4))
  const replayEnd = Math.ceil(end + 1)
  const boundedEnd =
    typeof duration === 'number' && Number.isFinite(duration)
      ? Math.min(replayEnd, duration)
      : replayEnd
  if (boundedEnd <= replayStart) return undefined
  return { start: replayStart, end: boundedEnd }
}
