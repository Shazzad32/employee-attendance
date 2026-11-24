"use client";
import { useCallback, useEffect, useState } from "react";
import { Printer, Receipt as ReceiptIcon, Undo2, Wallet, Banknote, Smartphone } from "lucide-react";
import { api } from "@/lib/api";
import { Modal, StatStrip, Badge } from "@/components/ui";
import { METHODS, fmtDate, fmtDuration, fmtMoney } from "@/lib/utils";

function printReceipt() {
  document.body.classList.add("print-receipt");
  window.addEventListener("afterprint", () => document.body.classList.remove("print-receipt"), { once: true });
  window.print();
}

export default function Payments({ users, reload }) {
  const [list, setList] = useState([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState(null);
  const staff = users.filter((u) => u.role === "user");

  const load = useCallback(async () => {
    setLoading(true);
    try { setList(await api("/api/admin/payments" + (userId ? `?userId=${userId}` : ""))); } catch {}
    setLoading(false);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  async function undo(p) {
    if (!confirm(`Undo the ${fmtMoney(p.total)} payment to ${p.user?.name}? Its shifts will go back to Due.`)) return;
    try { await api(`/api/admin/payments/${p._id}`, "DELETE"); await Promise.all([load(), reload()]); } catch (e) { alert(e.message); }
  }

  const by = (m) => list.filter((p) => p.method === m).reduce((a, p) => a + p.total, 0);
  const r = receipt;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Payments</h1>
        <select className="input w-auto" aria-label="Employee" value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="">Everyone</option>
          {staff.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
        </select>
      </div>

      <StatStrip cols="grid-cols-2 lg:grid-cols-4" items={[
        { icon: Wallet, label: "Total paid", value: fmtMoney(list.reduce((a, p) => a + p.total, 0)), sub: `${list.length} payments` },
        { icon: Banknote, label: "Cash", value: fmtMoney(by("cash")) },
        { icon: Smartphone, label: "bKash", value: fmtMoney(by("bkash")) },
        { icon: Smartphone, label: "Nagad", value: fmtMoney(by("nagad")) },
      ]} />

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr><th className="th">Paid on</th><th className="th">Employee</th><th className="th">Period</th><th className="th text-right">Hours</th><th className="th">Method</th><th className="th text-right">Total</th><th className="th"><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((p) => (
                <tr key={p._id}>
                  <td className="td">{fmtDate(p.paidAt)}</td>
                  <td className="td font-semibold">{p.user?.name}</td>
                  <td className="td">{fmtDate(p.from)} – {fmtDate(p.to)}</td>
                  <td className="td text-right">{fmtDuration(p.ms)}</td>
                  <td className="td"><Badge tone="off">{METHODS[p.method]}</Badge>{p.trxId && <span className="ml-2 text-slate-500">{p.trxId}</span>}</td>
                  <td className="td text-right font-semibold">{fmtMoney(p.total)}</td>
                  <td className="td"><div className="flex justify-end">
                    <button className="icon-btn" onClick={() => setReceipt(p)} aria-label="View receipt"><ReceiptIcon className="h-4 w-4" /></button>
                    <button className="icon-btn hover:!text-red-700" onClick={() => undo(p)} aria-label="Undo payment"><Undo2 className="h-4 w-4" /></button>
                  </div></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td className="td py-10 text-center text-slate-500" colSpan={7}>{loading ? "Loading…" : "No payments yet. Pay an employee from the Report tab."}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={!!r} onClose={() => setReceipt(null)} title="Payment receipt">
        {r && (
          <div>
            <div className="receipt space-y-3 text-sm">
              <div className="flex items-baseline justify-between border-b border-line pb-3">
                <p className="text-lg font-extrabold">TimeTrack</p>
                <p className="text-slate-500">No. {String(r._id).slice(-6).toUpperCase()}</p>
              </div>
              {[
                ["Employee", r.user?.name],
                ["Paid on", new Date(r.paidAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })],
                ["Period", `${fmtDate(r.from)} – ${fmtDate(r.to)}`],
                ["Shifts", `${r.shiftCount} · ${fmtDuration(r.ms)}`],
                ["Earned", fmtMoney(r.amount)],
                ...(r.adjustment ? [[r.adjustment > 0 ? "Bonus" : "Deduction", fmtMoney(r.adjustment)]] : []),
                ["Paid by", METHODS[r.method] + (r.trxId ? ` (${r.trxId})` : "")],
                ...(r.note ? [["Note", r.note]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4"><span className="text-slate-500">{k}</span><span className="text-right font-semibold">{v}</span></div>
              ))}
              <div className="flex items-baseline justify-between border-t-2 border-ink pt-3">
                <span className="font-bold">Total paid</span><span className="text-2xl font-extrabold">{fmtMoney(r.total)}</span>
              </div>
            </div>
            <button className="btn-primary mt-5 w-full" onClick={printReceipt}><Printer className="h-4 w-4" /> Print receipt</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
