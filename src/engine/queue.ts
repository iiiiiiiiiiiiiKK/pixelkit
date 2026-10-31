/**
 * A tiny bounded-concurrency task queue.
 *
 * Images are processed one at a time by default: a phone decoding six 12 MP
 * photos at once will freeze or run out of memory. The queue keeps the UI
 * responsive, exposes progress, and can be stopped when the user clears the list.
 */

export interface TaskQueueOptions {
  concurrency?: number
  onChange?: () => void
}

interface PendingTask {
  key: string
  task: () => Promise<void>
}

export class TaskQueue {
  private readonly concurrency: number
  private readonly onChange?: () => void
  private pending: PendingTask[] = []
  private running = 0
  private stopped = false
  private idleWaiters: (() => void)[] = []

  constructor(options: TaskQueueOptions = {}) {
    this.concurrency = Math.max(1, options.concurrency ?? 1)
    this.onChange = options.onChange
  }

  get pendingCount(): number {
    return this.pending.length
  }

  get runningCount(): number {
    return this.running
  }

  get isBusy(): boolean {
    return this.running > 0 || this.pending.length > 0
  }

  push(key: string, task: () => Promise<void>): void {
    if (this.stopped) return
    this.pending.push({ key, task })
    this.emit()
    this.pump()
  }

  /** Stops starting new tasks and drops everything still queued. */
  stop(): void {
    this.stopped = true
    this.pending = []
    this.emit()
    this.settleIfIdle()
  }

  /** Allows new work after a stop(). Running tasks are unaffected. */
  resume(): void {
    this.stopped = false
    this.emit()
  }

  remove(key: string): void {
    this.pending = this.pending.filter((item) => item.key !== key)
    this.emit()
    this.settleIfIdle()
  }

  /** Resolves once nothing is queued or running. */
  whenIdle(): Promise<void> {
    if (!this.isBusy) return Promise.resolve()
    return new Promise<void>((resolve) => {
      this.idleWaiters.push(resolve)
    })
  }

  private pump(): void {
    while (!this.stopped && this.running < this.concurrency && this.pending.length > 0) {
      const next = this.pending.shift()
      if (!next) break
      this.running += 1
      this.emit()
      next
        .task()
        .catch(() => {
          /* task bodies handle their own errors */
        })
        .finally(() => {
          this.running -= 1
          this.emit()
          this.settleIfIdle()
          this.pump()
        })
    }
    this.settleIfIdle()
  }

  private settleIfIdle(): void {
    if (this.isBusy) return
    const waiters = this.idleWaiters
    this.idleWaiters = []
    waiters.forEach((resolve) => resolve())
  }

  private emit(): void {
    this.onChange?.()
  }
}
