export const CURRENCY = "৳";
export const WEEK_START = 6; // first day of the pay week: 0 = Sun ... 6 = Sat

export const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const endOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
export function startOfWeek(d = new Date()) {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() - WEEK_START + 7) % 7));
  return x;
}
export function endOfWeek(d = new Date()) {
  const x = startOfWeek(d);
  x.setDate(x.getDate() + 6);
  return endOfDay(x);
}

export function getRange(key) {
  const now = new Date();
  if (key === "today") return [startOfDay(now), endOfDay(now)];
  if (key === "lastweek") {
    const d = startOfWeek(now);
    d.setDate(d.getDate() - 1);
    return [startOfWeek(d), endOfWeek(d)];
  }
  if (key === "lastmonth")
    return [new Date(now.getFullYear(), now.getMonth() - 1, 1), endOfDay(new Date(now.getFullYear(), now.getMonth(), 0))];
  if (key === "month")
    return [new Date(now.getFullYear(), now.getMonth(), 1), endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0))];
  return [startOfWeek(now), endOfWeek(now)];
}

export const METHODS = { cash: "Cash", bkash: "bKash", nagad: "Nagad" };
export const shiftMs = (s, now = Date.now()) =>
  Math.max(0, (s.endTime ? new Date(s.endTime).getTime() : now) - new Date(s.startTime).getTime());
export const shiftPay = (s, now = Date.now()) => (shiftMs(s, now) / 3600000) * (s.rateAtTime || 0);

export function fmtDuration(ms) {
  const t = Math.floor(ms / 60000);
  return `${Math.floor(t / 60)}h ${String(t % 60).padStart(2, "0")}m`;
}
export function fmtClock(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60].map((n) => String(n).padStart(2, "0")).join(":");
}
export const fmtMoney = (n) => `${CURRENCY}${Math.round(n || 0).toLocaleString("en-US")}`;
export const fmtTime = (d) => new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
export const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
export function toLocalInput(d) {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 16);
}
export const toDateInput = (d) => toLocalInput(d).slice(0, 10);
