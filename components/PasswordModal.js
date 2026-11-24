"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui";

export default function PasswordModal({ open, onClose }) {
  const [f, setF] = useState({ current: "", next: "" });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  function close() { setF({ current: "", next: "" }); setErr(""); setOk(false); onClose(); }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try { await api("/api/auth/password", "POST", f); setOk(true); } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <Modal open={open} onClose={close} title="Change password">
      {ok ? (
        <div>
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Password updated.</p>
          <div className="mt-4 flex justify-end"><button className="btn-primary" onClick={close}>Done</button></div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label" htmlFor="cp">Current password</label>
            <input id="cp" type="password" className="input" autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} required /></div>
          <div><label className="label" htmlFor="np">New password</label>
            <input id="np" type="password" className="input" autoComplete="new-password" minLength={6} value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} required /></div>
          {err && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={close}>Cancel</button>
            <button className="btn-primary" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Update password</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
