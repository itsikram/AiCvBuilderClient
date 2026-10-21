import { create } from "zustand";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  add: (message: string, type?: ToastType) => void;
  remove: (id: string) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    // Keep at most 3 on screen; errors stay a little longer
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), type === "error" ? 6000 : 4000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };

export function Toaster() {
  const { t } = useTranslation();
  const { toasts, remove } = useToast();
  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-20 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:items-end"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type];
        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg",
              toast.type === "success" && "border-green-200 bg-green-50 text-green-900",
              toast.type === "error" && "border-red-200 bg-red-50 text-red-900",
              toast.type === "info" && "border-border bg-card text-foreground"
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1 text-sm">{toast.message}</span>
            <button onClick={() => remove(toast.id)} className="rounded opacity-70 hover:opacity-100 focus-visible:outline-2" aria-label={t("common.close")}>
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
