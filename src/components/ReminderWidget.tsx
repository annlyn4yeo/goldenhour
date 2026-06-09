export default function ReminderWidget() {
  return (
    <article className="rounded-2xl border-[0.5px] border-surface-border bg-surface-card px-6 py-8 md:px-8">
      <h2 className="font-display text-[20px] text-ink-primary lg:text-[24px]">
        set a reminder
      </h2>
      <p className="mt-2 text-body text-ink-secondary">
        Get notified before golden hour starts.
      </p>
      <button
        type="button"
        className="mt-6 rounded-full border-[0.5px] border-surface-border bg-surface-muted px-5 py-2.5 text-body font-medium text-ink-primary transition hover:bg-surface-base"
      >
        Coming soon
      </button>
    </article>
  )
}
