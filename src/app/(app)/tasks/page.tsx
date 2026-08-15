import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import { fmtDate } from "@/lib/utils";
import TaskForm from "@/components/forms/TaskForm";
import TaskCheckbox from "@/components/forms/TaskCheckbox";

export default async function TasksPage() {
  const { farmId } = await requireFarmSession();
  const [tasks, goats] = await Promise.all([
    prisma.task.findMany({ where: { farmId }, orderBy: [{ done: "asc" }, { dueDate: "asc" }] }),
    prisma.goat.findMany({ where: { farmId, status: { notIn: ["DEAD", "SOLD"] } } }),
  ]);

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <div className="font-bold text-sm mb-2" style={{ color: "var(--olive-dark)" }}>+ Add Task / Reminder</div>
        <TaskForm goats={goats.map((g) => ({ id: g.id, name: g.name }))} />
      </div>
      {tasks.map((t) => (
        <div key={t.id} className="card p-3 flex items-center gap-3">
          <TaskCheckbox id={t.id} done={t.done} />
          <div className="flex-1">
            <div className="font-semibold text-sm" style={{ color: t.done ? "#9C917B" : "var(--ink)", textDecoration: t.done ? "line-through" : "none" }}>{t.title}</div>
            <div className="text-xs text-gray-400">{t.category} · Due {fmtDate(t.dueDate)}</div>
          </div>
        </div>
      ))}
      {tasks.length === 0 && <div className="text-center text-gray-400 py-10">No tasks yet.</div>}
    </div>
  );
}
