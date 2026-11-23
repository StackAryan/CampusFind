export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-moss">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-ink/55 sm:text-base">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
