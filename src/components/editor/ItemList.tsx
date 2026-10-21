import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmAction } from "@/lib/confirm";
import { cn } from "@/lib/utils";

interface ItemListProps<T extends { id: string }> {
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  addLabel: string;
  /** Short summary shown when an entry is collapsed, e.g. "Accounts Intern, ABC Traders" */
  summary: (item: T, index: number) => string;
  /** Fallback name, e.g. "Job 2" */
  fallbackName: (index: number) => string;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  empty?: ReactNode;
  /** Extra add buttons (e.g. "Add SSC") that receive the same add handler */
  extraActions?: (add: (item: T) => void) => ReactNode;
}

const hasContent = (item: object) =>
  Object.entries(item).some(([key, value]) =>
    key === "id" ? false : Array.isArray(value) ? value.some((v) => String(v).trim()) : typeof value === "string" && value.trim() !== ""
  );

export function ItemList<T extends { id: string }>({ items, onChange, create, addLabel, summary, fallbackName, render, empty, extraActions }: ItemListProps<T>) {
  const { t } = useTranslation();
  // Entries that are still empty start open; filled ones start collapsed on long lists
  const [open, setOpen] = useState<Set<string>>(() => new Set(items.filter((i) => !hasContent(i) || items.length <= 2).map((i) => i.id)));

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const add = (item: T) => {
    onChange([...items, item]);
    setOpen((prev) => new Set(prev).add(item.id));
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const remove = async (index: number) => {
    const item = items[index];
    const name = summary(item, index) || fallbackName(index);
    if (hasContent(item)) {
      const ok = await confirmAction({
        title: t("editor.removeItemTitle"),
        text: t("editor.removeItemText", { name }),
        confirmLabel: t("editor.remove"),
        destructive: true,
      });
      if (!ok) return;
    }
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && empty && <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted">{empty}</p>}
      {items.map((item, index) => {
        const isOpen = open.has(item.id);
        const name = summary(item, index) || fallbackName(index);
        const panelId = `item-${item.id}`;
        return (
          <div key={item.id} className="rounded-lg border bg-background">
            <div className="flex items-center gap-1 px-2 py-1.5">
              <button
                type="button"
                className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded px-1 text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
              >
                <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", !isOpen && "-rotate-90")} aria-hidden />
                <span className="truncate">{name}</span>
              </button>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`${t("editor.moveUp")}: ${name}`}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9" disabled={index === items.length - 1} onClick={() => move(index, 1)} aria-label={`${t("editor.moveDown")}: ${name}`}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-red-600 hover:text-red-700" onClick={() => remove(index)} aria-label={`${t("editor.remove")}: ${name}`}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {isOpen && (
              <div id={panelId} className="space-y-3 border-t px-3 pb-4 pt-3">
                {render(item, (patch) => onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it))), index)}
              </div>
            )}
          </div>
        );
      })}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => add(create())}>
          <Plus className="h-4 w-4" />
          {addLabel}
        </Button>
        {extraActions?.(add)}
      </div>
    </div>
  );
}
