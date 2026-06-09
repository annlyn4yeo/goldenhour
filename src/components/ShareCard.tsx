export default function ShareCard() {
  return (
    <div className="flex justify-center">
      <button
        type="button"
        className="rounded-full border-[0.5px] border-surface-border bg-surface-card px-8 py-3 font-display text-[20px] text-ink-primary transition hover:bg-surface-muted lg:text-[24px]"
      >
        share today&apos;s light
      </button>
    </div>
  )
}
