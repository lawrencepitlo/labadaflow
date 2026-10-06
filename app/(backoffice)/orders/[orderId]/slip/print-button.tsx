'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-block rounded-md border px-4 py-2 text-sm hover:bg-muted"
    >
      Print
    </button>
  )
}
