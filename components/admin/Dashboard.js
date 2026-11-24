"use client";
import { useEffect, useState } from "react";
import { Users, Activity, Timer, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { StatStrip, Badge, Avatar } from "@/components/ui";
import { getRange, shiftMs, shiftPay, fmtClock, fmtDuration, fmtMoney, fmtTime } from "@/lib/utils";

export default function Dashboard({ users }) {
  const [shifts, setShifts] = useState([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    const [f, t] = getRange("week");
    api(`/api/admin/shifts?from=${f.toISOString()}&to=${t.toISOString()}`).then(setShifts).catch(() => {});
  }, [users]);
  useEffect(() => {
    const i = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const now = Date.now();
  const staff = users.filter((u) => u.role === "user" && u.active);
  const working = staff.filter((u) => u.working);
  const byUser = {};
  for (const s of shifts) {
    const id = s.user?._id;
    if (!id) continue;
    byUser[id] ||= { ms: 0, pay: 0 };
    byUser[id].ms += shiftMs(s, now);
    byUser[id].pay += shiftPay(s, now);
  }
  const totalMs = Object.values(byUser).reduce((a, x) => a + x.ms, 0);
  const totalDue = staff.reduce((a, u) => a + (u.dueAmount || 0), 0);

  return (
    <div className="space-y-5">
      <StatStrip
        cols="grid-cols-2 lg:grid-cols-4"
        items={[
          { icon: Users, label: "Employees", value: staff.length },
          { icon: Activity, label: "Working now", value: working.length },
          { icon: Timer, label: "Hours this week", value: fmtDuration(totalMs) },
          { icon: Wallet, label: "Total due", value: fmtMoney(totalDue), sub: "unpaid hours, all time" },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <section className="card overflow-hidden">
          <h2 className="border-b border-line px-4 py-3 font-bold">Working now</h2>
          {working.length === 0 ? (
            <p className="px-4 py-8 text-center text-slate-500">Nobody is clocked in right now.</p>
          ) : (
            <ul className="divide-y divide-line">
              {working.map((u) => (
                <li key={u._id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={u.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{u.name}</p>
                    <p className="text-sm text-slate-500">since {fmtTime(u.workingSince)}</p>
                  </div>
                  <span className="flex items-center gap-2">
                    {now - new Date(u.workingSince).getTime() > 12 * 3600000 && <Badge tone="bad">Forgot to end?</Badge>}
                    <span className="text-lg font-bold text-go">{fmtClock(now - new Date(u.workingSince).getTime())}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card overflow-hidden">
          <h2 className="border-b border-line px-4 py-3 font-bold">This week by employee</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line">
                <tr><th className="th">Employee</th><th className="th">Status</th><th className="th text-right">Hours</th><th className="th text-right">This week</th><th className="th text-right">Due</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {staff.map((u) => (
                  <tr key={u._id}>
                    <td className="td font-semibold">{u.name}</td>
                    <td className="td">{u.working ? <Badge tone="go">Working</Badge> : <Badge tone="off">Off</Badge>}</td>
                    <td className="td text-right">{fmtDuration(byUser[u._id]?.ms || 0)}</td>
                    <td className="td text-right">{fmtMoney(byUser[u._id]?.pay || 0)}</td>
                    <td className="td text-right font-semibold">{u.dueAmount ? <span className="text-stop">{fmtMoney(u.dueAmount)}</span> : <span className="text-go">Settled</span>}</td>
                  </tr>
                ))}
                {staff.length === 0 && <tr><td className="td py-8 text-center text-slate-500" colSpan={5}>Add your first employee in the Employees tab.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
