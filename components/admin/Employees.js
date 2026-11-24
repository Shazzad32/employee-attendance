"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Modal, Badge, Avatar } from "@/components/ui";
import { fmtMoney } from "@/lib/utils";

const EMPTY = { name: "", username: "", password: "", hourlyRate: "", role: "user", active: true };

export default function Employees({ users, me, reload }) {
  const [modal, setModal] = useState(null); // null | {mode:"add"} | {mode:"edit", user}
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  function openAdd() { setForm(EMPTY); setErr(""); setModal({ mode: "add" }); }
  function openEdit(u) {
    setForm({ name: u.name, username: u.username, password: "", hourlyRate: u.hourlyRate, role: u.role, active: u.active });
    setErr("");
    setModal({ mode: "edit", user: u });
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      if (modal.mode === "add") await api("/api/admin/users", "POST", form);
      else {
        const body = { name: form.name, username: form.username, hourlyRate: form.hourlyRate, active: form.active };
        if (form.password) body.password = form.password;
        await api(`/api/admin/users/${modal.user._id}`, "PATCH", body);
      }
      await reload();
      setModal(null);
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  }

  async function remove(u) {
    if (!confirm(`Delete ${u.name}? All of their logged hours will be deleted too.`)) return;
    try { await api(`/api/admin/users/${u._id}`, "DELETE"); await reload(); } catch (e) { alert(e.message); }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Employees</h1>
        <button className="btn-primary" onClick={openAdd}><Plus className="h-4 w-4" /> Add employee</button>
      </div>

      <div className="card overflow-hidden">
        <ul className="divide-y divide-line">
          {users.map((u) => (
            <li key={u._id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <Avatar name={u.name} />
              <div className="min-w-0 flex-1 basis-40">
                <p className="truncate font-semibold">{u.name} {u.role === "admin" && <span className="ml-1 rounded bg-ink px-1.5 py-0.5 text-xs font-semibold text-white">Admin</span>}</p>
                <p className="text-sm text-slate-500">@{u.username}</p>
              </div>
              <p className="w-28 text-sm"><span className="font-semibold">{fmtMoney(u.hourlyRate)}</span> <span className="text-slate-500">/ hour</span></p>
              {u.role === "user" && (
                <p className="w-28 text-sm">{u.dueAmount > 0 ? <span className="font-semibold text-stop">Due {fmtMoney(u.dueAmount)}</span> : <span className="text-slate-500">No dues</span>}</p>
              )}
              <div className="w-24">
                {!u.active ? <Badge tone="bad">Inactive</Badge> : u.working ? <Badge tone="go">Working</Badge> : <Badge tone="off">Off</Badge>}
              </div>
              <div className="flex">
                <button className="icon-btn" onClick={() => openEdit(u)} aria-label={`Edit ${u.name}`}><Pencil className="h-4 w-4" /></button>
                {u._id !== me?.id && (
                  <button className="icon-btn hover:!text-red-700" onClick={() => remove(u)} aria-label={`Delete ${u.name}`}><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "add" ? "Add employee" : "Edit employee"}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label" htmlFor="n">Full name</label>
            <input id="n" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label" htmlFor="un">Username</label>
            <input id="un" className="input" autoCapitalize="none" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div>
            <label className="label" htmlFor="pw">{modal?.mode === "add" ? "Password" : "New password (leave blank to keep)"}</label>
            <input id="pw" className="input" type="text" autoComplete="off" minLength={6} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required={modal?.mode === "add"} />
          </div>
          <div>
            <label className="label" htmlFor="hr">Hourly rate</label>
            <input id="hr" className="input" type="number" min="0" step="any" inputMode="decimal" value={form.hourlyRate}
              onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} required />
            {modal?.mode === "edit" && <p className="mt-1.5 text-sm text-slate-500">A new rate applies to shifts started from now on. Past shifts keep their old rate.</p>}
          </div>
          {modal?.mode === "add" && (
            <div>
              <label className="label" htmlFor="rl">Role</label>
              <select id="rl" className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="user">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          {modal?.mode === "edit" && modal.user._id !== me?.id && (
            <label className="flex items-center gap-2.5 text-sm font-medium">
              <input type="checkbox" className="h-4 w-4 accent-[#0E1726]" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Active (inactive employees can't log in)
            </label>
          )}
          {err && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Save employee</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
