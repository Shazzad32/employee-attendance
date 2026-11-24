"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui";
import Dial from "@/components/Dial";

export default function Login() {
  const router = useRouter();
  const [f, setF] = useState({ username: "", password: "" });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `Server error (${r.status}) - check the terminal running npm run dev`);
      router.replace(d.role === "admin" ? "/admin" : "/employee");
      router.refresh();
    } catch (e) {
      setErr(e.message || "Login failed");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        <Logo light />
        <div>
          <div className="mb-10 opacity-90">
            <Dial progress={0.62} active>
              <div className="text-center">
                <p className="text-5xl font-extrabold">4:58</p>
                <p className="mt-1 text-sm text-slate-400">hours today</p>
              </div>
            </Dial>
          </div>
          <h1 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight">Clock in. Clock out. Every hour counted.</h1>
          <p className="mt-3 max-w-sm text-slate-400">Hours and pay are worked out for you, so the weekly payout takes minutes.</p>
        </div>
        <p className="text-sm text-slate-500">Works on your phone and your computer.</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h2 className="text-3xl font-extrabold tracking-tight">Log in</h2>
          <p className="mt-1.5 text-slate-500">Use the username and password your admin gave you.</p>

          <div className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="u">Username</label>
              <input id="u" className="input" autoComplete="username" autoCapitalize="none" value={f.username}
                onChange={(e) => setF({ ...f, username: e.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="p">Password</label>
              <div className="relative">
                <input id="p" className="input pr-11" type={show ? "text" : "password"} autoComplete="current-password"
                  value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
                <button type="button" className="icon-btn absolute right-1 top-1/2 -translate-y-1/2" onClick={() => setShow(!show)}
                  aria-label={show ? "Hide password" : "Show password"}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {err && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
            <button className="btn-primary w-full py-3" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Log in
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
