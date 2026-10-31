import type { SVGProps } from 'react'

/**
 * A hand-tuned 24px stroke icon set. Bundled inline on purpose: PixelKit ships
 * no icon CDN and no third-party font, which keeps the privacy claim honest.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Base({ size = 20, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export function LogoMark({ size = 28, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect x="1.2" y="1.2" width="29.6" height="29.6" rx="9" fill="currentColor" />
      <path
        d="M10.4 22.4V9.6h6.1a4.1 4.1 0 0 1 0 8.2h-6.1"
        stroke="var(--color-surface)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20.4" cy="21.2" r="1.6" fill="var(--color-surface)" />
    </svg>
  )
}

export const CompressIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4" />
    <path d="M9 12h6M12 9v6" />
  </Base>
)

export const ConvertIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 8h13l-3.2-3.2M20 16H7l3.2 3.2" />
  </Base>
)

export const ResizeIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="3" y="3" width="12" height="12" rx="2.5" />
    <path d="M9 21h12V9" />
    <path d="M15 15h6v6h-6z" opacity="0" />
    <path d="M15.5 15.5 21 21" />
  </Base>
)

export const CropIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M6.5 3v14.5H21" />
    <path d="M3 6.5h14.5V21" />
  </Base>
)

export const RenameIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 7h9M4 12h6M4 17h7" />
    <path d="M14.5 17.5 19 13l2.5 2.5L17 20h-2.5z" />
  </Base>
)

export const InfoIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.6v.6" />
  </Base>
)

export const SunIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.6v2M12 19.4v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.6 12h2M19.4 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </Base>
)

export const MoonIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M20 14.4A8.4 8.4 0 0 1 9.6 4a8.4 8.4 0 1 0 10.4 10.4z" />
  </Base>
)

export const GlobeIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3.4 9.5h17.2M3.4 14.5h17.2" />
    <path d="M12 3c2.4 2.5 3.6 5.6 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.6-3.6-9S9.6 5.5 12 3z" />
  </Base>
)

export const UploadIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 16V4.5M7.5 9 12 4.5 16.5 9" />
    <path d="M4 15v3.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V15" />
  </Base>
)

export const DownloadIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 4v11.5M7.5 11 12 15.5 16.5 11" />
    <path d="M4 16v2.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V16" />
  </Base>
)

export const CheckIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="m4.5 12.5 4.5 4.5 10-10.5" />
  </Base>
)

export const AlertIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 4.5 21 19.5H3z" />
    <path d="M12 10v4M12 16.6v.4" />
  </Base>
)

export const CloseIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Base>
)

export const PlusIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 5v14M5 12h14" />
  </Base>
)

export const TrashIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4.5 7h15M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />
    <path d="M6.5 7l.9 11.4A1.7 1.7 0 0 0 9.1 20h5.8a1.7 1.7 0 0 0 1.7-1.6L17.5 7" />
  </Base>
)

export const ArrowRightIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4.5 12h14M13 6.5 18.5 12 13 17.5" />
  </Base>
)

export const ArrowLeftIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M19.5 12h-14M11 6.5 5.5 12 11 17.5" />
  </Base>
)

export const ShieldIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 3 5 5.8v5.4c0 4.3 2.8 7.9 7 9.8 4.2-1.9 7-5.5 7-9.8V5.8z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </Base>
)

export const ImageIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <circle cx="8.6" cy="9.8" r="1.5" />
    <path d="m3.6 17.4 5-4.6 4.2 3.8 3-2.6 4.6 4" />
  </Base>
)

export const SpinnerIcon = ({ size = 18, ...props }: IconProps) => (
  <Base size={size} className="spin" {...props}>
    <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" strokeWidth={2.2} />
  </Base>
)

export const ExternalIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M8 6h10v10" />
    <path d="M18 6 6.5 17.5" />
  </Base>
)

export const LayersIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="m12 3.5 8.5 4.6L12 12.7 3.5 8.1z" />
    <path d="m4.4 12.6 7.6 4.1 7.6-4.1M4.4 16.9l7.6 4.1 7.6-4.1" />
  </Base>
)

export const GithubIcon = ({ size = 18, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path d="M12 1.8a10.2 10.2 0 0 0-3.2 19.9c.5.1.7-.2.7-.5v-1.9c-2.9.6-3.5-1.3-3.5-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.4-1.1.7-1.3-2.3-.3-4.7-1.2-4.7-5.1 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.5 9.5 0 0 1 5 0c2-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.8-4.7 5.1.4.3.7 1 .7 2v3c0 .3.2.6.7.5A10.2 10.2 0 0 0 12 1.8z" />
  </svg>
)

/** The X (Twitter) glyph, used for the author link in the header. */
export const XIcon = ({ size = 16, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path d="M17.53 3h3.2l-6.99 7.99L22 21h-6.3l-4.93-6.44L5.1 21H1.9l7.47-8.54L2 3h6.45l4.45 5.88zm-1.12 16.08h1.77L7.68 4.82H5.78z" />
  </svg>
)
