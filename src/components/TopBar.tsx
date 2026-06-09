import { skyTextClassesForTone, type SkyTextClasses } from '../hooks/useSkyTheme'

type TopBarProps = {
  locationName: string
  onLocationClick?: () => void
  isLight?: boolean
  textClasses?: SkyTextClasses
}

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}

export default function TopBar({
  locationName,
  onLocationClick,
  isLight = false,
  textClasses,
}: TopBarProps) {
  const ink = textClasses ?? skyTextClassesForTone(isLight ? 'onWarm' : 'inverse')

  return (
    <header
      className={`fixed top-0 z-50 flex h-14 w-full items-center justify-between px-4 backdrop-blur-md md:px-gutter ${
        isLight ? 'bg-black/8' : 'bg-white/15'
      }`}
    >
      <span className={`font-display text-title italic ${ink.text}`}>auric.</span>

      <div className={`flex items-center gap-3 text-body ${ink.text}`}>
        <button
          type="button"
          onClick={onLocationClick}
          className={`rounded-md px-1 transition ${ink.topBarHover}`}
          aria-expanded={onLocationClick ? undefined : false}
        >
          {locationName}
        </button>
        <button
          type="button"
          aria-label="Settings"
          className={`rounded-full p-1 transition ${ink.textMuted} ${ink.textHover} ${ink.topBarHover}`}
        >
          <SettingsIcon />
        </button>
      </div>
    </header>
  )
}
