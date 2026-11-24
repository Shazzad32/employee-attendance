"use client";
import { Clock, X } from "lucide-react";

export function Logo({ light }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${light ? "bg-white" : "bg-ink"}`}>
        <Clock className={`h-5 w-5 ${light ? "text-ink" : "text-white"}`} strokeWidth={2.25} />
      </div>
      <span className={`text-lg font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}>TimeTrack</span>
    </div>
  );
}

// One bordered strip with hairline dividers; pass the grid column class from the caller.
export function StatStrip({ items, cols }) {
  return (
    <div className={`card grid ${cols} gap-px overflow-hidden bg-line`}>
      {items.map((it) => (
        <div key={it.label} className="bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <it.icon className="h-4 w-4" /> {it.label}
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{it.value}</p>
          {it.sub && <p className="mt-1 text-sm text-slate-500">{it.sub}</p>}
        </div>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center sm:p-4"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Badge({ tone, children }) {
  const tones = {
    go: "bg-emerald-50 text-emerald-700 border-emerald-200",
    off: "bg-slate-100 text-slate-600 border-slate-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    bad: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone === "go" ? "bg-go" : tone === "bad" ? "bg-red-500" : tone === "warn" ? "bg-amber-500" : "bg-slate-400"}`} />
      {children}
    </span>
  );
}

export function Avatar({ name }) {
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 text-sm font-bold text-brand">{initials}</div>;
}

export function Spinner() {
  return <div className="grid min-h-[40dvh] place-items-center text-slate-400">Loading…</div>;
}
