"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Play, Square, Sun, CalendarDays, Wallet, Banknote, KeyRound } from "lucide-react";
import { api } from "@/lib/api";
import { Logo, StatStrip, Spinner, Badge } from "@/components/ui";
import PasswordModal from "@/components/PasswordModal";
import Dial from "@/components/Dial";
import { getRange, shiftMs, shiftPay, startOfDay, fmtClock, fmtDuration, fmtMoney, fmtTime, fmtDate, METHODS } from "@/lib/utils";

export default function EmployeePage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [offset, setOffset] = useState(0); // server time - device time
  const [, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pw, setPw] = useState(false);

  const load = useCallback(async () => {
    const [from, to] = getRange("week");
    const d = await api(`/api/shifts?from=${from.toISOString()}&to=${to.toISOString()}`);
    setOffset(d.serverNow - Date.now());
    setData(d);
  }, []);

  useEffect(() => { load().catch((e) => setError(e.message)); }, [load]);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  async function clock(action) {
    setBusy(true);
    setError("");
    try {
      await api("/api/shifts/clock", "POST", { action });
      await load();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  async function logout() {
    await api("/api/auth/logout", "POST");
    router.replace("/login");
  }

  if (!data) return error ? <p className="p-6 text-red-700">{error}</p> : <Spinner />;

  const now = Date.now() + offset;
  const { shifts, active, user } = data;
  const todayStart = startOfDay(new Date(now)).getTime();
  const sum = (list, fn) => list.reduce((a, s) => a + fn(s, now), 0);
  const todayMs = sum(shifts.filter((s) => new Date(s.startTime).getTime() >= todayStart), shiftMs);
  const weekMs = sum(shifts, shiftMs);
  const weekPay = sum(shifts, shiftPay);
  const running = active ? now - new Date(active.startTime).getTime() : 0;

  return (
    <div className="mx-auto max-w-xl px-4 pb-10">
      <header className="flex items-center justify-between py-4">
        <Logo />
        <div className="flex items-center gap-1">
          <button className="icon-btn" onClick={() => setPw(true)} aria-label="Change password"><KeyRound className="h-4 w-4" /></button>
          <button className="btn-ghost px-3 py-2" onClick={logout}>
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </header>

      <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Hello, {user.name.split(" ")[0]}</h1>
      <p className="mt-1 text-slate-500">
        {new Date(now).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · Rate {fmtMoney(user.hourlyRate)} per hour
      </p>

      <section className="card mt-5 px-4 py-8 text-center">
        <Dial progress={running / (8 * 3600000)} active={!!active}>
          <button
            onClick={() => clock(active ? "end" : "start")}
            disabled={busy}
            aria-label={active ? "End work" : "Start work"}
            className={`flex h-[196px] w-[196px] flex-col items-center justify-center gap-2 rounded-full text-white shadow-lg transition-transform active:scale-95 disabled:opacity-60 ${
              active ? "bg-stop" : "bg-ink"
            }`}
          >
            {active ? <Square className="h-9 w-9" fill="currentColor" /> : <Play className="h-9 w-9" fill="currentColor" />}
            <span className="text-xl font-extrabold">{active ? "End work" : "Start work"}</span>
          </button>
        </Dial>

        <div className="mt-6 min-h-[64px]">
          {active ? (
            <>
              <p className="text-4xl font-extrabold tracking-tight text-go">{fmtClock(running)}</p>
              <p className="mt-1 text-sm text-slate-500">Started at {fmtTime(active.startTime)}</p>
            </>
          ) : (
            <p className="text-slate-500">Tap the button when you start working.</p>
          )}
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      </section>

      <div className="mt-4">
        <StatStrip
          cols="grid-cols-2"
          items={[
            { icon: Sun, label: "Today", value: fmtDuration(todayMs) },
            { icon: CalendarDays, label: "This week", value: fmtDuration(weekMs) },
            { icon: Wallet, label: "Earned", value: fmtMoney(weekPay), sub: "this week" },
            { icon: Banknote, label: "Due to you", value: fmtMoney(data.dueAmount), sub: data.dueMs ? `${fmtDuration(data.dueMs)} unpaid` : "all paid up" },
          ]}
        />
      </div>

      <section className="card mt-4 overflow-hidden">
        <h2 className="border-b border-line px-4 py-3 font-bold">This week</h2>
        {shifts.length === 0 ? (
          <p className="px-4 py-8 text-center text-slate-500">No work logged yet this week.</p>
        ) : (
          <ul className="divide-y divide-line">
            {shifts.map((s) => (
              <li key={s._id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-semibold">{fmtDate(s.startTime)}</p>
                  <p className="text-sm text-slate-500">
                    {fmtTime(s.startTime)} – {s.endTime ? fmtTime(s.endTime) : "running"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{fmtDuration(shiftMs(s, now))}</p>
                  <p className="text-sm text-slate-500">{fmtMoney(shiftPay(s, now))}</p>
                  <div className="mt-1">{!s.endTime ? <Badge tone="off">Running</Badge> : s.payment ? <Badge tone="go">Paid</Badge> : <Badge tone="warn">Due</Badge>}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.payments.length > 0 && (
        <section className="card mt-4 overflow-hidden">
          <h2 className="border-b border-line px-4 py-3 font-bold">Payment history</h2>
          <ul className="divide-y divide-line">
            {data.payments.map((p) => (
              <li key={p._id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-semibold">{fmtMoney(p.total)}</p>
                  <p className="text-sm text-slate-500">{fmtDate(p.paidAt)} · {METHODS[p.method]}{p.trxId ? ` · ${p.trxId}` : ""}</p>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p>{fmtDuration(p.ms)}</p>
                  <p>{fmtDate(p.from)} – {fmtDate(p.to)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <PasswordModal open={pw} onClose={() => setPw(false)} />
    </div>
  );
}
