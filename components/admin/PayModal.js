"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui";
import { METHODS, fmtDuration, fmtMoney, fmtDate } from "@/lib/utils";

// target: { userId, name, from, to (ISO), ms, amount, count }
export default function PayModal({ target, onClose, onDone }) {
  const [method, setMethod] = useState("cash");
  const [adj, setAdj] = useState("");
  const [trx, setTrx] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (!target) return null;
  const total = Math.round(target.amount) + (Math.round(Number(adj)) || 0);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/api/admin/payments", "POST", {
        userId: target.userId, from: target.from, to: target.to, method, adjustment: adj, trxId: trx, note,
      });
      await onDone();
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  }

  return (
    <Modal open onClose={onClose} title="Pay employee">
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-lg border border-line bg-paper p-4">
          <p className="font-bold">{target.name}</p>
          <p className="text-sm text-slate-500">
            {fmtDate(target.from)} – {fmtDate(target.to)} · {target.count} {target.count === 1 ? "shift" : "shifts"} · {fmtDuration(target.ms)}
          </p>
          <p className="mt-2 text-sm text-slate-500">Amount due</p>
          <p className="text-3xl font-extrabold tracking-tight">{fmtMoney(target.amount)}</p>
        </div>

        <div>
          <label className="label" htmlFor="adj">Bonus (+) or deduction (−), optional</label>
          <input id="adj" type="number" step="any" inputMode="decimal" className="input" placeholder="0" value={adj} onChange={(e) => setAdj(e.target.value)} />
        </div>

        <fieldset>
          <legend className="label">Paid by</legend>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(METHODS).map(([k, v]) => (
              <button type="button" key={k} onClick={() => setMethod(k)} aria-pressed={method === k}
                className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${method === k ? "border-ink bg-ink text-white" : "border-[#D5DCE8] bg-white hover:bg-slate-50"}`}>
                {v}
              </button>
            ))}
          </div>
        </fieldset>

        {method !== "cash" && (
          <div>
            <label className="label" htmlFor="trx">{METHODS[method]} transaction ID (optional)</label>
            <input id="trx" className="input" autoCapitalize="characters" value={trx} onChange={(e) => setTrx(e.target.value)} />
          </div>
        )}
        <div>
          <label className="label" htmlFor="note">Note (optional)</label>
          <input id="note" className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {err && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <button className="btn-primary w-full py-3" disabled={busy || total < 0}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Confirm payment of {fmtMoney(total)}
        </button>
        <p className="text-center text-sm text-slate-500">These shifts will be marked Paid and locked. You can undo it from the Payments tab.</p>
      </form>
    </Modal>
  );
}
