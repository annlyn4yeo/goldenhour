import type { ReactNode } from 'react'
import type { SkyPhase } from '../hooks/useSunData'

type AppShellProps = {
  skyPhase: SkyPhase
  children: ReactNode
}

export default function AppShell({ skyPhase, children }: AppShellProps) {
  return (
    <div
      className="app-shell min-h-screen font-ui"
      data-sky-phase={skyPhase}
    >
      {children}
    </div>
  )
}
