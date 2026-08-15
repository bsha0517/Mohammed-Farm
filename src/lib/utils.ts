export const daysBetween = (a: Date | string, b: Date | string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

export const addDays = (d: Date | string, n: number) => {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
};

export const fmtDate = (d?: Date | string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const ageString = (dob: Date | string) => {
  const days = daysBetween(dob, new Date());
  if (days < 0) return "—";
  if (days < 60) return `${days} days`;
  const months = Math.floor(days / 30.4);
  if (months < 24) return `${months} mo`;
  return `${Math.floor(months / 12)} yr ${months % 12} mo`;
};

export const money = (n?: number | null) => `Rs ${Number(n || 0).toLocaleString("en-PK")}`;

export const todayISO = () => new Date().toISOString().slice(0, 10);
