import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useConfirmStore } from "@/lib/confirm";
import { Button } from "./button";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Wider content, e.g. side-by-side comparisons */
  size?: "sm" | "md" | "lg";
  /** Prevents closing by Escape/outside click while work is in progress */
  busy?: boolean;
}

/**
 * Accessible modal (focus trap, Escape, labelled by its title). On phones it
 * opens as a bottom sheet that can scroll; on larger screens it is centred.
 */
export function Dialog({ open, onOpenChange, title, description, children, footer, size = "md", busy }: DialogProps) {
  const { t } = useTranslation();
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => (!busy || next) && onOpenChange(next)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl border bg-card text-foreground shadow-2xl outline-none",
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
            size === "sm" && "sm:max-w-md",
            size === "md" && "sm:max-w-xl",
            size === "lg" && "sm:max-w-3xl"
          )}
          onInteractOutside={(e) => busy && e.preventDefault()}
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-lg font-semibold leading-snug">{title}</DialogPrimitive.Title>
              {description && <DialogPrimitive.Description className="mt-1 text-sm text-muted">{description}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" className="-mr-2 -mt-1 shrink-0" disabled={busy} aria-label={t("common.close")}>
                <X className="h-5 w-5" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          {children && <div className="overflow-y-auto px-5 py-4">{children}</div>}
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-3">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ---------------------------------------------------------------------------
// Confirmation dialog for confirmAction() (lib/confirm.ts)
// ---------------------------------------------------------------------------

/** Mounted once (App.tsx) to render confirm() requests. */
export function ConfirmHost() {
  const { t } = useTranslation();
  const { request, settle } = useConfirmStore();
  return (
    <Dialog
      open={Boolean(request)}
      onOpenChange={(open) => !open && settle(false)}
      title={request?.title ?? ""}
      description={request?.text}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => settle(false)}>
            {t("confirm.cancel")}
          </Button>
          <Button variant={request?.destructive ? "destructive" : "default"} onClick={() => settle(true)} autoFocus>
            {request?.confirmLabel ?? t("confirm.ok")}
          </Button>
        </>
      }
    />
  );
}
