import { useEffect, useState } from 'react'
import type { ToolId } from './engine/types'

/**
 * Hash based routing. GitHub Pages serves static files only, so a path based
 * router would 404 on refresh; hashes work everywhere with zero configuration.
 */

export type Route =
  | { name: 'home' }
  | { name: 'tool'; tool: ToolId }
  | { name: 'guide' }
  | { name: 'privacy' }

export const TOOL_IDS: ToolId[] = ['compress', 'convert', 'resize', 'crop', 'rename', 'info']

export function isToolId(value: string): value is ToolId {
  return (TOOL_IDS as string[]).includes(value)
}

export function parseRoute(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '').replace(/\/$/, '')
  if (clean === '' || clean === 'home') return { name: 'home' }
  if (clean === 'guide') return { name: 'guide' }
  if (clean === 'privacy') return { name: 'privacy' }
  if (clean.startsWith('tool/')) {
    const tool = clean.slice('tool/'.length)
    if (isToolId(tool)) return { name: 'tool', tool }
    return { name: 'home' }
  }
  return { name: 'home' }
}

export function routeHash(route: Route): string {
  switch (route.name) {
    case 'tool':
      return `#/tool/${route.tool}`
    case 'guide':
      return '#/guide'
    case 'privacy':
      return '#/privacy'
    default:
      return '#/'
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    parseRoute(typeof window === 'undefined' ? '' : window.location.hash),
  )

  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}

export function navigate(route: Route): void {
  const next = routeHash(route)
  if (window.location.hash === next) {
    window.scrollTo({ top: 0 })
    return
  }
  window.location.hash = next
}
