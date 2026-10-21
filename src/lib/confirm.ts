import { create } from "zustand";

export interface ConfirmOptions {
  title: string;
  text?: string;
  confirmLabel?: string;
  destructive?: boolean;
}

interface ConfirmState {
  request: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null;
  open: (options: ConfirmOptions) => Promise<boolean>;
  settle: (ok: boolean) => void;
}

/** State behind <ConfirmHost /> (components/ui/dialog.tsx). */
export const useConfirmStore = create<ConfirmState>((set, get) => ({
  request: null,
  open: (options) =>
    new Promise<boolean>((resolve) => {
      get().request?.resolve(false);
      set({ request: { ...options, resolve } });
    }),
  settle: (ok) => {
    get().request?.resolve(ok);
    set({ request: null });
  },
}));

/** Asks the user to confirm; resolves true only if they press the confirm button. */
export const confirmAction = (options: ConfirmOptions) => useConfirmStore.getState().open(options);
