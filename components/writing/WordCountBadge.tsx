"use client";

import { useState } from "react";
import { updateWordGoal } from "@/lib/actions/documents";
import { cn } from "@/lib/utils/cn";

export function WordCountBadge({
  documentId,
  wordCount,
  initialGoal,
}: {
  documentId: string;
  wordCount: number;
  initialGoal: number | null;
}) {
  const [goal, setGoal] = useState(initialGoal);
  const [editingGoal, setEditingGoal] = useState(false);

  async function saveGoal(value: string) {
    const parsed = value.trim() === "" ? null : Number(value);
    const nextGoal = parsed !== null && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    setGoal(nextGoal);
    setEditingGoal(false);
    await updateWordGoal(documentId, nextGoal);
  }

  const reachedGoal = goal !== null && wordCount >= goal;

  return (
    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
      <span className={cn(reachedGoal && "font-medium text-green-600 dark:text-green-400")}>
        {wordCount} {wordCount === 1 ? "palavra" : "palavras"}
      </span>
      {editingGoal ? (
        <input
          type="number"
          min={1}
          autoFocus
          defaultValue={goal ?? ""}
          onBlur={(e) => saveGoal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveGoal((e.target as HTMLInputElement).value)}
          className="w-20 rounded border border-zinc-300 px-1 py-0.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      ) : (
        <button type="button" onClick={() => setEditingGoal(true)} className="underline">
          {goal ? `meta: ${goal}` : "definir meta"}
        </button>
      )}
    </div>
  );
}
