import { describe, expect, it } from 'vitest'
import { unzipSync } from 'fflate'
import { createZipBlob, dedupeEntryNames } from '../../src/engine/zip'

describe('dedupeEntryNames', () => {
  it('appends counters to repeated names', () => {
    expect(dedupeEntryNames(['a.png', 'a.png', 'a.png'])).toEqual(['a.png', 'a-1.png', 'a-2.png'])
  })

  it('leaves a unique list untouched', () => {
    const names = ['x.jpg', 'y.jpg', 'z.jpg']
    expect(dedupeEntryNames(names)).toEqual(names)
  })

  it('is case-insensitive', () => {
    expect(dedupeEntryNames(['A.PNG', 'a.png'])).toEqual(['A.PNG', 'a-1.png'])
  })
})

describe('createZipBlob', () => {
  it('produces a readable archive containing every file', async () => {
    const encoder = new TextEncoder()
    const { blob, names } = await createZipBlob([
      { name: 'one.txt', data: encoder.encode('first') },
      { name: 'two.txt', data: encoder.encode('second') },
      { name: 'one.txt', data: encoder.encode('duplicate') },
    ])

    expect(blob.type).toBe('application/zip')
    expect(names).toEqual(['one.txt', 'two.txt', 'one-1.txt'])

    const archive = unzipSync(new Uint8Array(await blob.arrayBuffer()))
    expect(Object.keys(archive).sort()).toEqual(['one-1.txt', 'one.txt', 'two.txt'])
    expect(new TextDecoder().decode(archive['one-1.txt'])).toBe('duplicate')
    expect(new TextDecoder().decode(archive['two.txt'])).toBe('second')
  })

  it('handles an archive of binary payloads', async () => {
    const data = new Uint8Array([0, 1, 2, 255, 254, 128])
    const { blob } = await createZipBlob([{ name: 'bin.dat', data }])
    const archive = unzipSync(new Uint8Array(await blob.arrayBuffer()))
    expect(archive['bin.dat']).toEqual(data)
  })
})
