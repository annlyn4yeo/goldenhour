import type { ReactNode } from 'react'

export type SkyPhase =
  | 'dawn'
  | 'blueHour'
  | 'goldenHour'
  | 'solar'
  | 'dusk'
  | 'night'

type AppShellProps = {
  skyPhase: SkyPhase
  children: ReactNode
}

export default function AppShell({ skyPhase, children }: AppShellProps) {
  return (
    <div
      className="app-shell min-h-screen font-ui text-ink-primary"
      data-sky-phase={skyPhase}
    >
      {children}
    </div>
  )
}
