// Track revisions so an old save cannot acknowledge newer edits.
export class DraftBuffer<T> {
  private revision = 0
  private pending = new Map<string, { answer: T; revision: number }>()

  set(questionId: string, answer: T) {
    this.pending.set(questionId, { answer, revision: ++this.revision })
  }

  snapshot() {
    return Array.from(this.pending, ([questionId, value]) => ({
      questionId,
      ...value,
    }))
  }

  acknowledge(items: ReturnType<DraftBuffer<T>['snapshot']>) {
    for (const item of items) {
      if (this.pending.get(item.questionId)?.revision === item.revision) {
        this.pending.delete(item.questionId)
      }
    }
  }

  get size() {
    return this.pending.size
  }
}
