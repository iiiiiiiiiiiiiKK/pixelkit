import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { getEncoderSupport, inspectFile, processImage, type FileRejectReason } from '../engine/client'
import { TaskQueue } from '../engine/queue'
import { createZipBlob, dedupeEntryNames } from '../engine/zip'
import type { EncodableFormat, InputFormat, ToolId } from '../engine/types'
import { DEFAULT_SETTINGS, buildOpsPlan, type OpsPlan, type Settings } from './ops'

/**
 * Session state for the workspace: the image queue, tool settings, the result of
 * each item and an in-memory history. Nothing is persisted to storage — reload
 * means a clean slate, which is the privacy promise of the product.
 */

export const MAX_ITEMS = 60

export type ItemStatus = 'queued' | 'processing' | 'done' | 'error'

export interface ItemOutput {
  blob: Blob
  url: string
  name: string
  size: number
  width: number
  height: number
  mime: string
  /** True when the source file itself is offered because re-encoding grew it. */
  keptOriginal: boolean
}

export interface QueueItem {
  id: string
  file: File
  name: string
  size: number
  format: InputFormat
  width: number
  height: number
  previewUrl: string
  status: ItemStatus
  progress: number
  error?: { code: string; detail?: string }
  output?: ItemOutput
  outputName?: string
  hadTransparency?: boolean
  ms?: number
}

export interface HistoryRecord {
  id: string
  name: string
  tool: ToolId
  outputSize: number | null
  status: 'done' | 'error'
  at: number
}

export interface Rejection {
  name: string
  reason: FileRejectReason | 'too-many'
}

export interface WorkspaceStats {
  total: number
  done: number
  failed: number
  pending: number
  savedBytes: number
  originalBytes: number
  outputBytes: number
}

interface WorkspaceValue {
  items: QueueItem[]
  selectedId: string | null
  select: (id: string | null) => void
  settings: Settings
  updateSettings: <K extends keyof Settings>(tool: K, patch: Partial<Settings[K]>) => void
  resetTool: (tool: keyof Settings) => void
  encoders: EncodableFormat[]
  running: boolean
  rejections: Rejection[]
  dismissRejections: () => void
  addFiles: (files: File[]) => Promise<void>
  removeItem: (id: string) => void
  clearAll: () => void
  run: (tool: ToolId) => Promise<void>
  stop: () => void
  download: (item: QueueItem) => void
  downloadAll: (tool: ToolId) => Promise<void>
  history: HistoryRecord[]
  clearHistory: () => void
  stats: WorkspaceStats
  notice: string | null
  setNotice: (message: string | null) => void
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null)

let idCounter = 0
function nextId(): string {
  idCounter += 1
  return `item-${idCounter}-${Math.random().toString(36).slice(2, 7)}`
}

async function readDimensions(file: File): Promise<{ width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return size
  } catch {
    // Fall back to the <img> path; some browsers refuse exotic containers here.
    return await new Promise((resolve) => {
      const url = URL.createObjectURL(file)
      const image = new Image()
      image.onload = () => {
        resolve({ width: image.naturalWidth, height: image.naturalHeight })
        URL.revokeObjectURL(url)
      }
      image.onerror = () => {
        resolve({ width: 0, height: 0 })
        URL.revokeObjectURL(url)
      }
      image.src = url
    })
  }
}

function triggerDownload(url: string, name: string): void {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

function zipName(tool: ToolId): string {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
  return `pixelkit-${tool}-${stamp}.zip`
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QueueItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [encoders, setEncoders] = useState<EncodableFormat[]>(['jpeg', 'png'])
  const [running, setRunning] = useState(false)
  const [rejections, setRejections] = useState<Rejection[]>([])
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [notice, setNotice] = useState<string | null>(null)

  const itemsRef = useRef<QueueItem[]>([])
  const settingsRef = useRef<Settings>(DEFAULT_SETTINGS)
  const encodersRef = useRef<EncodableFormat[]>(['jpeg', 'png'])
  const queueRef = useRef<TaskQueue | null>(null)
  const cancelledRef = useRef(false)

  // Async task bodies need the latest values without re-creating callbacks on
  // every keystroke, so state is mirrored into refs after each commit.
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    encodersRef.current = encoders
  }, [encoders])

  useEffect(() => {
    let alive = true
    getEncoderSupport().then((supported) => {
      if (!alive) return
      const resolved = supported.length > 0 ? supported : (['jpeg', 'png'] as EncodableFormat[])
      setEncoders(resolved)
      // Keep the default convert target valid in browsers without a WebP encoder.
      if (!resolved.includes(settingsRef.current.convert.format)) {
        setSettings((prev) => ({ ...prev, convert: { ...prev.convert, format: resolved[0] } }))
      }
    })
    return () => {
      alive = false
    }
  }, [])

  // Revoke every object URL when the workspace unmounts.
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl)
        if (item.output && item.output.url !== item.previewUrl) URL.revokeObjectURL(item.output.url)
      })
    }
  }, [])

  const patchItem = useCallback((id: string, patch: Partial<QueueItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }, [])

  const pushHistory = useCallback((record: Omit<HistoryRecord, 'id' | 'at'>) => {
    setHistory((prev) => [{ ...record, id: nextId(), at: Date.now() }, ...prev].slice(0, 60))
  }, [])

  const addFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return
      const accepted: QueueItem[] = []
      const rejected: Rejection[] = []
      const room = Math.max(0, MAX_ITEMS - itemsRef.current.length)

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index]
        if (index >= room) {
          rejected.push({ name: file.name, reason: 'too-many' })
          continue
        }
        const inspection = await inspectFile(file)
        if (!inspection.ok) {
          rejected.push({ name: file.name, reason: inspection.reason ?? 'unsupported-format' })
          continue
        }
        const dimensions = await readDimensions(file)
        accepted.push({
          id: nextId(),
          file,
          name: file.name,
          size: file.size,
          format: inspection.format,
          width: dimensions.width,
          height: dimensions.height,
          previewUrl: URL.createObjectURL(file),
          status: 'queued',
          progress: 0,
        })
      }

      setRejections(rejected)
      if (accepted.length === 0) return
      setItems((prev) => [...prev, ...accepted])
      setSelectedId((prev) => prev ?? accepted[0].id)
    },
    [],
  )

  const removeItem = useCallback((id: string) => {
    const target = itemsRef.current.find((item) => item.id === id)
    if (target) {
      URL.revokeObjectURL(target.previewUrl)
      if (target.output && target.output.url !== target.previewUrl) URL.revokeObjectURL(target.output.url)
    }
    setItems((prev) => prev.filter((item) => item.id !== id))
    setSelectedId((prev) => (prev === id ? null : prev))
  }, [])

  const clearAll = useCallback(() => {
    queueRef.current?.stop()
    itemsRef.current.forEach((item) => {
      URL.revokeObjectURL(item.previewUrl)
      if (item.output && item.output.url !== item.previewUrl) URL.revokeObjectURL(item.output.url)
    })
    setItems([])
    setSelectedId(null)
    setRunning(false)
  }, [])

  const stop = useCallback(() => {
    cancelledRef.current = true
    queueRef.current?.stop()
    queueRef.current = null
    setRunning(false)
    setItems((prev) =>
      prev.map((item) => (item.status === 'processing' ? { ...item, status: 'queued', progress: 0 } : item)),
    )
  }, [])

  const run = useCallback(
    async (tool: ToolId) => {
      if (running) return
      const current = itemsRef.current
      if (current.length === 0) return

      const targets =
        tool === 'crop'
          ? current.filter((item) => item.id === selectedId).slice(0, 1)
          : current.some((item) => item.status !== 'done')
            ? current.filter((item) => item.status !== 'done')
            : current
      if (targets.length === 0) return

      // Build every plan up front so the output names can be de-duplicated
      // across the whole batch before any bytes are written.
      const plans: OpsPlan[] = targets.map((item, index) =>
        buildOpsPlan({
          tool,
          sourceFormat: item.format,
          sourceName: item.name,
          width: item.width,
          height: item.height,
          index,
          settings: settingsRef.current,
          encoders: encodersRef.current,
        }),
      )
      const names = dedupeEntryNames(plans.map((plan) => plan.name))

      cancelledRef.current = false
      setRunning(true)
      setNotice(null)

      const queue = new TaskQueue({ concurrency: 1 })
      queueRef.current = queue

      targets.forEach((item, index) => {
        const plan = plans[index]
        const outputName = names[index]
        queue.push(item.id, async () => {
          if (cancelledRef.current) return
          patchItem(item.id, { status: 'processing', progress: 0.05, error: undefined, outputName })
          try {
            if (tool === 'info') {
              patchItem(item.id, {
                status: 'done',
                progress: 1,
                output: undefined,
              })
              pushHistory({ name: item.name, tool, outputSize: null, status: 'done' })
              return
            }

            if (plan.passthrough) {
              // Rename: the bytes stay untouched, only the file name changes.
              patchItem(item.id, {
                status: 'done',
                progress: 1,
                output: {
                  blob: item.file,
                  url: item.previewUrl,
                  name: outputName,
                  size: item.size,
                  width: item.width,
                  height: item.height,
                  mime: item.file.type || 'application/octet-stream',
                  keptOriginal: true,
                },
                ms: 0,
              })
              pushHistory({ name: item.name, tool, outputSize: item.size, status: 'done' })
              return
            }

            const result = await processImage(item.file, plan.ops, (progress) => {
              patchItem(item.id, { progress })
            })
            if (cancelledRef.current) return

            const grew = result.blob.size >= item.size
            const keepOriginal = tool === 'compress' && settingsRef.current.compress.keepSmaller && grew
            const blob = keepOriginal ? item.file : result.blob
            const previous = itemsRef.current.find((entry) => entry.id === item.id)?.output
            let url: string
            if (keepOriginal) {
              url = item.previewUrl
            } else {
              url = URL.createObjectURL(result.blob)
            }
            if (previous && previous.url !== item.previewUrl && previous.url !== url) {
              URL.revokeObjectURL(previous.url)
            }

            patchItem(item.id, {
              status: 'done',
              progress: 1,
              hadTransparency: result.hadTransparency,
              ms: result.ms,
              output: {
                blob,
                url,
                name: keepOriginal ? item.name : outputName,
                size: blob.size,
                width: keepOriginal ? item.width : result.width,
                height: keepOriginal ? item.height : result.height,
                mime: keepOriginal ? item.file.type : result.mime,
                keptOriginal: keepOriginal,
              },
            })
            pushHistory({
              name: item.name,
              tool,
              outputSize: blob.size,
              status: 'done',
            })
          } catch (error) {
            const code = error instanceof Error && 'code' in error ? String(error.code) : 'unknown'
            const detail = error instanceof Error ? error.message : undefined
            patchItem(item.id, { status: 'error', progress: 0, error: { code, detail } })
            pushHistory({ name: item.name, tool, outputSize: null, status: 'error' })
          }
        })
      })

      await queue.whenIdle()
      if (queueRef.current === queue) {
        queueRef.current = null
        setRunning(false)
      }
    },
    [patchItem, pushHistory, running, selectedId],
  )

  const download = useCallback((item: QueueItem) => {
    const output = item.output
    if (!output) return
    triggerDownload(output.url, output.name)
  }, [])

  const downloadAll = useCallback(
    async (tool: ToolId) => {
      const ready = itemsRef.current.filter((item) => item.output)
      if (ready.length === 0) {
        setNotice('zip-empty')
        return
      }
      try {
        const entries = await Promise.all(
          ready.map(async (item) => {
            const output = item.output as ItemOutput
            const buffer = await output.blob.arrayBuffer()
            return { name: output.name, data: new Uint8Array(buffer) }
          }),
        )
        const { blob } = await createZipBlob(entries)
        const url = URL.createObjectURL(blob)
        triggerDownload(url, zipName(tool))
        // Give the browser a moment to start the download before revoking.
        setTimeout(() => URL.revokeObjectURL(url), 20_000)
      } catch {
        setNotice('zip-failed')
      }
    },
    [],
  )

  const updateSettings = useCallback(<K extends keyof Settings>(tool: K, patch: Partial<Settings[K]>) => {
    setSettings((prev) => ({ ...prev, [tool]: { ...prev[tool], ...patch } }))
  }, [])

  const resetTool = useCallback((tool: keyof Settings) => {
    setSettings((prev) => ({ ...prev, [tool]: DEFAULT_SETTINGS[tool] }))
  }, [])

  const stats = useMemo<WorkspaceStats>(() => {
    let originalBytes = 0
    let outputBytes = 0
    let done = 0
    let failed = 0
    let pending = 0
    items.forEach((item) => {
      originalBytes += item.size
      if (item.status === 'done') done += 1
      else if (item.status === 'error') failed += 1
      else pending += 1
      if (item.output) outputBytes += item.output.size
    })
    return {
      total: items.length,
      done,
      failed,
      pending,
      originalBytes,
      outputBytes,
      savedBytes: originalBytes - outputBytes,
    }
  }, [items])

  const value = useMemo<WorkspaceValue>(
    () => ({
      items,
      selectedId,
      select: setSelectedId,
      settings,
      updateSettings,
      resetTool,
      encoders,
      running,
      rejections,
      dismissRejections: () => setRejections([]),
      addFiles,
      removeItem,
      clearAll,
      run,
      stop,
      download,
      downloadAll,
      history,
      clearHistory: () => setHistory([]),
      stats,
      notice,
      setNotice,
    }),
    [
      items,
      selectedId,
      settings,
      updateSettings,
      resetTool,
      encoders,
      running,
      rejections,
      addFiles,
      removeItem,
      clearAll,
      run,
      stop,
      download,
      downloadAll,
      history,
      stats,
      notice,
    ],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace(): WorkspaceValue {
  const value = useContext(WorkspaceContext)
  if (!value) throw new Error('useWorkspace must be used inside <WorkspaceProvider>')
  return value
}
