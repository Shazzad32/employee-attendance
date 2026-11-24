"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Printer, Plus, Pencil, Trash2, Loader2, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { Modal, Badge, StatStrip } from "@/components/ui";
import PayModal from "./PayModal";
import {
  getRange, startOfDay, endOfDay, toDateInput, toLocalInput, shiftMs, shiftPay,
  fmtDuration, fmtMoney, fmtTime, fmtDate,
} from "@/lib/utils";
import { Timer, Wallet, CheckCircle2, AlertCircle } from "lucide-react";

const PRESETS = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "lastweek", label: "Last week" },
  { id: "month", label: "This month" },
  { id: "lastmonth", label: "Last month" },
];

export default function Timesheet({ users, reload }) {
  const [preset, setPreset] = useState("week");
  const [from, setFrom] = useState(() => toDateInput(getRange("week")[0]));
  const [to, setTo] = useState(() => toDateInput(getRange("week")[1]));
  const [userId, setUserId] = useState("");
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // {mode:"add"} | {mode:"edit", shift}
  const [form, setForm] = useState({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState(null);
  const staff = users.filter((u) => u.role === "user");
  const now = Date.now();
  const rangeStart = () => startOfDay(new Date(from + "T00:00:00"));
  const rangeEnd = () => endOfDay(new Date(to + "T00:00:00"));

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ from: rangeStart().toISOString(), to: rangeEnd().toISOString() });
    if (userId) q.set("userId", userId);
    try { setShifts(await api("/api/admin/shifts?" + q)); } catch {}
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, userId]);
  useEffect(() => { load(); }, [load]);

  function pick(id) {
    const [a, b] = getRange(id);
    setPreset(id);
    setFrom(toDateInput(a));
    setTo(toDateInput(b));
  }

  const summary = useMemo(() => {
    const m = {};
    for (const s of shifts) {
      const id = s.user?._id;
      if (!id) continue;
      const x = (m[id] ||= { id, name: s.user.name, ms: 0, pay: 0, paid: 0, due: 0, dueMs: 0, dueCount: 0, count: 0 });
      const p = shiftPay(s, now);
      x.count++; x.ms += shiftMs(s, now); x.pay += p;
      if (s.payment) x.paid += p;
      else if (s.endTime) { x.due += p; x.dueMs += shiftMs(s); x.dueCount++; }
    }
    return Object.values(m).sort((a, b) => a.name.localeCompare(b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shifts]);
  const tot = summary.reduce((a, x) => ({ ms: a.ms + x.ms, pay: a.pay + x.pay, paid: a.paid + x.paid, due: a.due + x.due }), { ms: 0, pay: 0, paid: 0, due: 0 });

  const status = (s) => (!s.endTime ? "Running" : s.payment ? "Paid" : "Due");

  function openAdd() {
    setForm({ userId: staff[0]?._id || "", start: toLocalInput(new Date()), end: "", rate: "" });
    setErr(""); setModal({ mode: "add" });
  }
  function openEdit(s) {
    setForm({ start: toLocalInput(s.startTime), end: s.endTime ? toLocalInput(s.endTime) : "", rate: s.rateAtTime });
    setErr(""); setModal({ mode: "edit", shift: s });
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const startTime = new Date(form.start).toISOString();
      const endTime = form.end ? new Date(form.end).toISOString() : null;
      if (modal.mode === "add") await api("/api/admin/shifts", "POST", { userId: form.userId, startTime, endTime, rateAtTime: form.rate });
      else await api(`/api/admin/shifts/${modal.shift._id}`, "PATCH", { startTime, endTime, rateAtTime: form.rate });
      await Promise.all([load(), reload()]);
      setModal(null);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }
  async function remove(s) {
    if (!confirm(`Delete this shift for ${s.user?.name}?`)) return;
    try { await api(`/api/admin/shifts/${s._id}`, "DELETE"); await Promise.all([load(), reload()]); } catch (e) { alert(e.message); }
  }

  function exportCsv() {
    const rows = [["Employee", "Date", "Start", "End", "Hours", "Rate", "Pay", "Status"]];
    [...shifts].reverse().forEach((s) => rows.push([
      s.user?.name, new Date(s.startTime).toLocaleDateString("en-GB"), fmtTime(s.startTime), s.endTime ? fmtTime(s.endTime) : "running",
      (shiftMs(s, now) / 3600000).toFixed(2), s.rateAtTime, Math.round(shiftPay(s, now)), status(s),
    ]));
    rows.push([], ["Summary", "", "", "", "Hours", "", "Earned", "Paid", "Due"]);
    summary.forEach((x) => rows.push([x.name, "", "", "", (x.ms / 3600000).toFixed(2), "", Math.round(x.pay), Math.round(x.paid), Math.round(x.due)]));
    rows.push(["Total", "", "", "", (tot.ms / 3600000).toFixed(2), "", Math.round(tot.pay), Math.round(tot.paid), Math.round(tot.due)]);
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `report_${from}_to_${to}.csv`;
    a.click();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl font-extrabold tracking-tight">Report</h1>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</button>
          <button className="btn-ghost" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</button>
          <button className="btn-primary" onClick={openAdd}><Plus className="h-4 w-4" /> Add entry</button>
        </div>
      </div>

      <div className="card flex flex-wrap items-end gap-3 p-4 print:hidden">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button key={p.id} onClick={() => pick(p.id)} className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${preset === p.id ? "border-ink bg-ink text-white" : "border-[#D5DCE8] bg-white hover:bg-slate-50"}`}>{p.label}</button>
          ))}
        </div>
        <div><label className="label" htmlFor="f">From</label>
          <input id="f" type="date" className="input" value={from} onChange={(e) => { setFrom(e.target.value); setPreset("custom"); }} /></div>
        <div><label className="label" htmlFor="t">To</label>
          <input id="t" type="date" className="input" value={to} onChange={(e) => { setTo(e.target.value); setPreset("custom"); }} /></div>
        <div><label className="label" htmlFor="e">Employee</label>
          <select id="e" className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Everyone</option>
            {staff.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select></div>
      </div>

      <p className="hidden text-lg font-bold print:block">Report: {from} to {to}</p>

      <StatStrip cols="grid-cols-2 lg:grid-cols-4" items={[
        { icon: Timer, label: "Hours worked", value: fmtDuration(tot.ms) },
        { icon: Wallet, label: "Total earned", value: fmtMoney(tot.pay) },
        { icon: CheckCircle2, label: "Paid", value: fmtMoney(tot.paid) },
        { icon: AlertCircle, label: "Due", value: fmtMoney(tot.due) },
      ]} />

      <section className="card overflow-hidden">
        <h2 className="border-b border-line px-4 py-3 font-bold">By employee</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr><th className="th">Employee</th><th className="th text-right">Hours</th><th className="th text-right">Earned</th><th className="th text-right">Paid</th><th className="th text-right">Due</th><th className="th print:hidden"><span className="sr-only">Pay</span></th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {summary.map((x) => (
                <tr key={x.id}>
                  <td className="td font-semibold">{x.name}</td>
                  <td className="td text-right">{fmtDuration(x.ms)}</td>
                  <td className="td text-right">{fmtMoney(x.pay)}</td>
                  <td className="td text-right text-go">{fmtMoney(x.paid)}</td>
                  <td className={`td text-right font-semibold ${x.due > 0 ? "text-stop" : ""}`}>{fmtMoney(x.due)}</td>
                  <td className="td text-right print:hidden">
                    {x.due > 0 ? (
                      <button className="btn-primary px-3 py-1.5" onClick={() => setPay({ userId: x.id, name: x.name, from: rangeStart().toISOString(), to: rangeEnd().toISOString(), ms: x.dueMs, amount: x.due, count: x.dueCount })}>Pay {fmtMoney(x.due)}</button>
                    ) : <Badge tone="go">Settled</Badge>}
                  </td>
                </tr>
              ))}
              {summary.length === 0 && <tr><td className="td py-10 text-center text-slate-500" colSpan={6}>{loading ? "Loading…" : "No hours logged in this period."}</td></tr>}
            </tbody>
            {summary.length > 0 && (
              <tfoot className="border-t-2 border-ink">
                <tr><td className="td font-bold">Total</td><td className="td text-right font-bold">{fmtDuration(tot.ms)}</td><td className="td text-right font-bold">{fmtMoney(tot.pay)}</td><td className="td text-right font-bold">{fmtMoney(tot.paid)}</td><td className="td text-right font-bold">{fmtMoney(tot.due)}</td><td className="print:hidden" /></tr>
              </tfoot>
            )}
          </table>
        </div>
        <p className="border-t border-line px-4 py-3 text-sm text-slate-500 print:hidden">Pay settles every completed, unpaid shift in the selected dates for that employee. Running shifts are paid after they end.</p>
      </section>

      <section className="card overflow-hidden">
        <h2 className="border-b border-line px-4 py-3 font-bold">All shifts</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr><th className="th">Date</th><th className="th">Employee</th><th className="th">In</th><th className="th">Out</th><th className="th text-right">Hours</th><th className="th text-right">Rate</th><th className="th text-right">Pay</th><th className="th">Status</th><th className="th print:hidden"><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shifts.map((s) => (
                <tr key={s._id}>
                  <td className="td">{fmtDate(s.startTime)}</td>
                  <td className="td font-semibold">{s.user?.name}</td>
                  <td className="td">{fmtTime(s.startTime)}</td>
                  <td className="td">{s.endTime ? fmtTime(s.endTime) : <span className="font-semibold text-go">Running</span>}</td>
                  <td className="td text-right">{fmtDuration(shiftMs(s, now))}</td>
                  <td className="td text-right">{fmtMoney(s.rateAtTime)}</td>
                  <td className="td text-right font-semibold">{fmtMoney(shiftPay(s, now))}</td>
                  <td className="td">{!s.endTime ? <Badge tone="off">Running</Badge> : s.payment ? <Badge tone="go">Paid</Badge> : <Badge tone="warn">Due</Badge>}</td>
                  <td className="td print:hidden">
                    <div className="flex justify-end">
                      {s.payment ? <span className="grid h-9 w-9 place-items-center text-slate-400" title="Paid shifts are locked"><Lock className="h-4 w-4" /></span> : (<>
                        <button className="icon-btn" onClick={() => openEdit(s)} aria-label="Edit shift"><Pencil className="h-4 w-4" /></button>
                        <button className="icon-btn hover:!text-red-700" onClick={() => remove(s)} aria-label="Delete shift"><Trash2 className="h-4 w-4" /></button>
                      </>)}
                    </div>
                  </td>
                </tr>
              ))}
              {shifts.length === 0 && <tr><td className="td py-10 text-center text-slate-500" colSpan={9}>{loading ? "Loading…" : "No shifts in this period."}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <PayModal target={pay} onClose={() => setPay(null)} onDone={async () => { setPay(null); await Promise.all([load(), reload()]); }} />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "add" ? "Add entry" : `Edit shift · ${modal?.shift?.user?.name || ""}`}>
        <form onSubmit={save} className="space-y-4">
          {modal?.mode === "add" && (
            <div><label className="label" htmlFor="mu">Employee</label>
              <select id="mu" className="input" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} required>
                {staff.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select></div>
          )}
          <div><label className="label" htmlFor="ms">Clock in</label>
            <input id="ms" type="datetime-local" className="input" value={form.start || ""} onChange={(e) => setForm({ ...form, start: e.target.value })} required /></div>
          <div><label className="label" htmlFor="me">Clock out</label>
            <input id="me" type="datetime-local" className="input" value={form.end || ""} onChange={(e) => setForm({ ...form, end: e.target.value })} required={modal?.mode === "add"} />
            {modal?.mode === "edit" && <p className="mt-1.5 text-sm text-slate-500">Leave empty to keep the shift running.</p>}</div>
          <div><label className="label" htmlFor="mr">Hourly rate</label>
            <input id="mr" type="number" min="0" step="any" inputMode="decimal" className="input" value={form.rate ?? ""} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder={modal?.mode === "add" ? "Employee's current rate" : ""} /></div>
          {err && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Save shift</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
