"use client";
import { useRouter } from "next/navigation";
import { toggleTask } from "@/lib/actions/finance";

export default function TaskCheckbox({ id, done }: { id: string; done: boolean }) {
  const router = useRouter();
  return (
    <input
      type="checkbox"
      className="w-5 h-5"
      defaultChecked={done}
      onChange={async (e) => {
        await toggleTask(id, e.target.checked);
        router.refresh();
      }}
    />
  );
}
