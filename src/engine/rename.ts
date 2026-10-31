/**
 * Batch renaming rules. Pure functions, no DOM, fully unit tested.
 *
 * The rename tool never re-encodes pixels: it only changes the file name of the
 * original bytes (or of the processed bytes when used after another tool).
 */

export interface RenameSettings {
  /** `template` builds prefix + number + suffix, `keep` keeps the original stem. */
  mode: 'template' | 'keep'
  prefix: string
  suffix: string
  /** First number used by `template` mode. */
  start: number
  /** Zero padded width of the number, 1 – 6. */
  digits: number
}

export const DEFAULT_RENAME: RenameSettings = {
  mode: 'template',
  prefix: 'pixelkit-',
  suffix: '',
  start: 1,
  digits: 3,
}

// Control characters are stripped on purpose: they are illegal in file names on
// Windows and can be used to smuggle extension separators past naive checks.
// eslint-disable-next-line no-control-regex
const ILLEGAL = /[<>:"/\\|?*\u0000-\u001f]/g

/** Removes characters that are illegal or dangerous in file systems. */
export function sanitizeFileName(raw: string): string {
  let name = raw.replace(ILLEGAL, '').replace(/\s+/g, ' ').trim()
  name = name.replace(/^\.+/, '').replace(/[. ]+$/, '')
  if (name.length > 120) name = name.slice(0, 120).trim()
  return name
}

/** File name without its final extension. `a.b.png` -> `a.b`. */
export function baseName(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  if (dot <= 0) return fileName
  return fileName.slice(0, dot)
}

/** Strips any existing extension from a user supplied prefix/suffix fragment. */
export function stripExtension(raw: string): string {
  return raw.replace(/\.[A-Za-z0-9]{1,5}$/, '')
}

export function clampRenameSettings(settings: RenameSettings): RenameSettings {
  const start = Number.isFinite(settings.start) ? Math.min(Math.max(Math.round(settings.start), 0), 99_999) : 1
  const digits = Number.isFinite(settings.digits) ? Math.min(Math.max(Math.round(settings.digits), 1), 6) : 3
  return { ...settings, start, digits }
}

/** One output name for a single item. Collisions are handled by buildOutputNames. */
export function buildOutputName(
  settings: RenameSettings,
  index: number,
  originalName: string,
  extension: string,
): string {
  const safe = clampRenameSettings(settings)
  const ext = extension.replace(/^\./, '')

  // "Keep original name" means exactly that: the stem is untouched, so the
  // prefix/suffix fields (which only exist in template mode) play no part.
  if (safe.mode === 'keep') {
    const stem = sanitizeFileName(baseName(originalName)) || 'image'
    return `${stem}.${ext}`
  }

  const prefix = stripExtension(sanitizeFileName(safe.prefix))
  const suffix = stripExtension(sanitizeFileName(safe.suffix))
  const numbering = String(safe.start + index).padStart(safe.digits, '0')
  const combined = sanitizeFileName(`${prefix}${numbering}${suffix}`) || `image-${index + 1}`
  return `${combined}.${ext}`
}

/**
 * Builds the full list of output names for a batch, resolving duplicates with
 * `-1`, `-2`, … suffixes (case-insensitive, like macOS and Windows).
 */
export function buildOutputNames(
  originals: { name: string }[],
  settings: RenameSettings,
  extension: string,
): string[] {
  const used = new Set<string>()
  return originals.map((item, index) => {
    const base = buildOutputName(settings, index, item.name, extension)
    const dot = base.lastIndexOf('.')
    const stem = base.slice(0, dot)
    const ext = base.slice(dot)
    let candidate = base
    let counter = 1
    while (used.has(candidate.toLowerCase())) {
      candidate = `${stem}-${counter}${ext}`
      counter += 1
    }
    used.add(candidate.toLowerCase())
    return candidate
  })
}
