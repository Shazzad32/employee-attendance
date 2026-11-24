"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, Users, ClipboardList, Banknote, KeyRound } from "lucide-react";
import { api } from "@/lib/api";
import { Logo } from "@/components/ui";
import Dashboard from "@/components/admin/Dashboard";
import Employees from "@/components/admin/Employees";
import Timesheet from "@/components/admin/Timesheet";
import Payments from "@/components/admin/Payments";
import PasswordModal from "@/components/PasswordModal";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "employees", label: "Employees", icon: Users },
  { id: "timesheet", label: "Report", icon: ClipboardList },
  { id: "payments", label: "Payments", icon: Banknote },
];

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);
  const [pw, setPw] = useState(false);

  const reload = useCallback(async () => {
    try { setUsers(await api("/api/admin/users")); } catch {}
  }, []);

  useEffect(() => {
    reload();
    api("/api/auth/me").then(setMe).catch(() => {});
    const i = setInterval(reload, 30000);
    return () => clearInterval(i);
  }, [reload]);

  async function logout() {
    await api("/api/auth/logout", "POST");
    router.replace("/login");
  }

  return (
    <div className="min-h-[100dvh]">
      <header className="border-b border-line bg-white print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:block">{me?.name}</span>
            <button className="icon-btn" onClick={() => setPw(true)} aria-label="Change password"><KeyRound className="h-4 w-4" /></button>
            <button className="btn-ghost px-3 py-2" onClick={logout}>
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4" aria-label="Admin sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                tab === t.id ? "border-ink text-ink" : "border-transparent text-slate-500 hover:text-ink"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === "dashboard" && <Dashboard users={users} />}
        {tab === "employees" && <Employees users={users} me={me} reload={reload} />}
        {tab === "timesheet" && <Timesheet users={users} reload={reload} />}
        {tab === "payments" && <Payments users={users} reload={reload} />}
      </main>
      <PasswordModal open={pw} onClose={() => setPw(false)} />
    </div>
  );
}
