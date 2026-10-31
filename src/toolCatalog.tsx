import type { ComponentType, SVGProps } from 'react'
import type { ToolId } from './engine/types'
import {
  CompressIcon,
  ConvertIcon,
  CropIcon,
  InfoIcon,
  RenameIcon,
  ResizeIcon,
} from './components/Icons'

export interface ToolMeta {
  id: ToolId
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>
  nameKey: string
  descKey: string
}

/** Single source of truth for the tool list used by the home page and workspace. */
export const TOOLS: ToolMeta[] = [
  { id: 'compress', icon: CompressIcon, nameKey: 'tool.compress', descKey: 'tool.compress.desc' },
  { id: 'convert', icon: ConvertIcon, nameKey: 'tool.convert', descKey: 'tool.convert.desc' },
  { id: 'resize', icon: ResizeIcon, nameKey: 'tool.resize', descKey: 'tool.resize.desc' },
  { id: 'crop', icon: CropIcon, nameKey: 'tool.crop', descKey: 'tool.crop.desc' },
  { id: 'rename', icon: RenameIcon, nameKey: 'tool.rename', descKey: 'tool.rename.desc' },
  { id: 'info', icon: InfoIcon, nameKey: 'tool.info', descKey: 'tool.info.desc' },
]

export function toolMeta(id: ToolId): ToolMeta {
  return TOOLS.find((tool) => tool.id === id) ?? TOOLS[0]
}
