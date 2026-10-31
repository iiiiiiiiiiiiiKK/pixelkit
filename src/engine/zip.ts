import { zip } from 'fflate'

/**
 * ZIP packaging for batch downloads. Uses fflate (MIT) — no server round trip,
 * everything is assembled in the browser.
 */

export interface ZipEntry {
  name: string
  data: Uint8Array
}

export interface ZipResult {
  blob: Blob
  /** Names actually written to the archive (may be de-duplicated). */
  names: string[]
}

/** De-duplicates entry names the same way the rename tool does. */
export function dedupeEntryNames(names: string[]): string[] {
  const used = new Set<string>()
  return names.map((name) => {
    const dot = name.lastIndexOf('.')
    const stem = dot > 0 ? name.slice(0, dot) : name
    const ext = dot > 0 ? name.slice(dot) : ''
    let candidate = name
    let counter = 1
    while (used.has(candidate.toLowerCase())) {
      candidate = `${stem}-${counter}${ext}`
      counter += 1
    }
    used.add(candidate.toLowerCase())
    return candidate
  })
}

export async function createZipBlob(entries: ZipEntry[]): Promise<ZipResult> {
  const names = dedupeEntryNames(entries.map((entry) => entry.name))
  const files: Record<string, Uint8Array> = {}
  entries.forEach((entry, index) => {
    files[names[index]] = entry.data
  })

  const bytes = await new Promise<Uint8Array>((resolve, reject) => {
    zip(files, { level: 6 }, (error, data) => {
      if (error) reject(error)
      else resolve(data)
    })
  })

  return {
    blob: new Blob([bytes as unknown as BlobPart], { type: 'application/zip' }),
    names,
  }
}
