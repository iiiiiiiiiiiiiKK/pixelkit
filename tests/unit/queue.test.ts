import { describe, expect, it } from 'vitest'
import { TaskQueue } from '../../src/engine/queue'

function defer() {
  let resolve: () => void = () => {}
  const promise = new Promise<void>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('TaskQueue', () => {
  it('runs tasks one at a time when concurrency is 1', async () => {
    const queue = new TaskQueue({ concurrency: 1 })
    const events: string[] = []
    let running = 0
    let maxRunning = 0

    for (const id of ['a', 'b', 'c']) {
      queue.push(id, async () => {
        running += 1
        maxRunning = Math.max(maxRunning, running)
        events.push(`start:${id}`)
        await Promise.resolve()
        events.push(`end:${id}`)
        running -= 1
      })
    }

    await queue.whenIdle()
    expect(maxRunning).toBe(1)
    expect(events).toEqual(['start:a', 'end:a', 'start:b', 'end:b', 'start:c', 'end:c'])
  })

  it('respects a higher concurrency limit', async () => {
    const gates = [defer(), defer(), defer()]
    const queue = new TaskQueue({ concurrency: 2 })
    let started = 0

    gates.forEach((gate, index) => {
      queue.push(`t${index}`, async () => {
        started += 1
        await gate.promise
      })
    })

    await Promise.resolve()
    await Promise.resolve()
    expect(started).toBe(2)

    gates[0].resolve()
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(started).toBe(3)

    gates[1].resolve()
    gates[2].resolve()
    await queue.whenIdle()
    expect(queue.isBusy).toBe(false)
  })

  it('stop() drops queued work but lets the running task finish', async () => {
    const queue = new TaskQueue({ concurrency: 1 })
    const ran: string[] = []
    const gate = defer()

    queue.push('first', async () => {
      await gate.promise
      ran.push('first')
    })
    queue.push('second', async () => {
      ran.push('second')
    })

    queue.stop()
    gate.resolve()
    await queue.whenIdle()

    expect(ran).toEqual(['first'])
    expect(queue.pendingCount).toBe(0)
  })

  it('ignores new work after stop until resume()', async () => {
    const queue = new TaskQueue({ concurrency: 1 })
    const ran: string[] = []
    queue.stop()
    queue.push('ignored', async () => {
      ran.push('ignored')
    })
    expect(ran).toEqual([])

    queue.resume()
    queue.push('accepted', async () => {
      ran.push('accepted')
    })
    await queue.whenIdle()
    expect(ran).toEqual(['accepted'])
  })

  it('remove() cancels a queued task by key', async () => {
    const queue = new TaskQueue({ concurrency: 1 })
    const ran: string[] = []
    const gate = defer()

    queue.push('a', async () => {
      await gate.promise
      ran.push('a')
    })
    queue.push('b', async () => {
      ran.push('b')
    })
    queue.remove('b')
    gate.resolve()
    await queue.whenIdle()

    expect(ran).toEqual(['a'])
  })

  it('keeps pumping after a task throws', async () => {
    const queue = new TaskQueue({ concurrency: 1 })
    const ran: string[] = []
    queue.push('boom', async () => {
      throw new Error('nope')
    })
    queue.push('next', async () => {
      ran.push('next')
    })
    await queue.whenIdle()
    expect(ran).toEqual(['next'])
  })

  it('resolves whenIdle immediately when nothing is queued', async () => {
    const queue = new TaskQueue()
    await expect(queue.whenIdle()).resolves.toBeUndefined()
  })

  it('notifies listeners on changes', async () => {
    let changes = 0
    const queue = new TaskQueue({ concurrency: 1, onChange: () => (changes += 1) })
    queue.push('a', async () => {})
    await queue.whenIdle()
    expect(changes).toBeGreaterThanOrEqual(2)
  })
})
