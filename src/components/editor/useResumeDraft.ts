import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import api, { getErrorMessage } from "@/lib/api";
import i18n from "@/i18n";
import { fullSectionOrder, normalizeContent, type CvLang, type SectionId } from "@/lib/resume/model";
import type { Resume, ResumeContent } from "@/types";

export interface CvDoc {
  title: string;
  content: ResumeContent;
  sectionOrder: SectionId[];
  theme: Record<string, string>;
  templateId: string;
  language: CvLang;
}

export type SaveStatus =
  | { kind: "saved" }
  | { kind: "dirty" }
  | { kind: "saving" }
  | { kind: "retrying" }
  | { kind: "offline" }
  | { kind: "rejected"; message: string };

const SAVE_DELAY_MS = 1200;
const RETRY_DELAY_MS = 5000;
const draftKey = (id: string) => `cv-draft:${id}`;

const docFromResume = (resume: Resume): CvDoc => ({
  title: resume.title || i18n.t("editor.untitled"),
  content: normalizeContent(resume.content),
  sectionOrder: fullSectionOrder(resume.sectionOrder),
  theme: Object.fromEntries(Object.entries(resume.theme ?? {}).map(([k, v]) => [k, String(v ?? "")])),
  templateId: resume.templateId || "modern-ats",
  language: resume.language === "bn" ? "bn" : "en",
});

const serialize = (doc: CvDoc) => JSON.stringify(doc);

interface LocalDraft {
  snapshot: string;
  at: number;
}

const readDraft = (id: string): LocalDraft | null => {
  try {
    const raw = localStorage.getItem(draftKey(id));
    return raw ? (JSON.parse(raw) as LocalDraft) : null;
  } catch {
    return null;
  }
};

const writeDraft = (id: string, snapshot: string) => {
  try {
    localStorage.setItem(draftKey(id), JSON.stringify({ snapshot, at: Date.now() } satisfies LocalDraft));
  } catch {
    /* storage full or unavailable: the server copy still works */
  }
};

const clearDraft = (id: string) => {
  try {
    localStorage.removeItem(draftKey(id));
  } catch {
    /* ignore */
  }
};

/**
 * Editor state for one CV with autosave: changes are saved ~1s after the user
 * stops typing and retried while offline. Unsaved changes are copied to
 * localStorage when a save fails or the tab closes, so nothing is lost on a slow connection.
 */
export function useResumeDraft(resume: Resume) {
  const id = resume._id;
  const queryClient = useQueryClient();
  const [doc, setDoc] = useState<CvDoc>(() => docFromResume(resume));
  const [savedSnapshot, setSavedSnapshot] = useState(() => serialize(docFromResume(resume)));
  const [phase, setPhase] = useState<{ kind: "idle" | "saving" | "retrying" | "offline" | "rejected"; message?: string; failed?: string }>({ kind: "idle" });
  const [retryTick, setRetryTick] = useState(0);
  const inFlight = useRef(false);

  // Changes that failed to save or were pending when the tab closed (written only
  // then, and cleared after each successful save); offered only if newer than the server copy
  const [pendingDraft, setPendingDraft] = useState<LocalDraft | null>(() => {
    const draft = readDraft(id);
    return draft && draft.at > Date.parse(resume.updatedAt) ? draft : null;
  });

  const snapshot = useMemo(() => serialize(doc), [doc]);
  const dirty = snapshot !== savedSnapshot;

  const save = useCallback(
    async (snap: string) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setPhase({ kind: "saving" });
      try {
        await api.patch(`/resumes/${id}`, JSON.parse(snap));
        setSavedSnapshot(snap);
        setPhase({ kind: "idle" });
        clearDraft(id);
        queryClient.invalidateQueries({ queryKey: ["resumes"] });
      } catch (error) {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        if (status && status >= 400 && status < 500 && ![401, 408, 429].includes(status)) {
          // The server refused this content (e.g. a premium template); retrying won't help
          setPhase({ kind: "rejected", message: getErrorMessage(error, i18n.t("common.error")), failed: snap });
        } else {
          // Keep a copy on the device until a retry succeeds
          writeDraft(id, snap);
          setPhase({ kind: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "retrying" });
          setTimeout(() => setRetryTick((n) => n + 1), RETRY_DELAY_MS);
        }
      } finally {
        inFlight.current = false;
      }
    },
    [id, queryClient]
  );

  useEffect(() => {
    if (!dirty || pendingDraft) return;
    if (phase.kind === "saving" || (phase.kind === "rejected" && phase.failed === snapshot)) return;
    const timer = setTimeout(() => void save(snapshot), SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [id, snapshot, dirty, savedSnapshot, retryTick, phase.kind, phase.failed, pendingDraft, save]);

  // Retry as soon as the connection comes back
  useEffect(() => {
    const online = () => setRetryTick((n) => n + 1);
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
  }, []);

  // Warn before leaving with unsaved changes, and send them on in-app navigation
  const latest = useRef({ snapshot, dirty });
  useEffect(() => {
    latest.current = { snapshot, dirty };
  }, [snapshot, dirty]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!latest.current.dirty) return;
      writeDraft(id, latest.current.snapshot);
      event.preventDefault();
      event.returnValue = i18n.t("editor.leaveWarning");
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      if (latest.current.dirty) void api.patch(`/resumes/${id}`, JSON.parse(latest.current.snapshot)).catch(() => undefined);
    };
  }, [id]);

  const update = useCallback((recipe: (doc: CvDoc) => CvDoc) => setDoc(recipe), []);
  const setContent = useCallback((recipe: (content: ResumeContent) => ResumeContent) => setDoc((d) => ({ ...d, content: recipe(d.content) })), []);

  const restoreDraft = () => {
    if (!pendingDraft) return;
    try {
      setDoc(JSON.parse(pendingDraft.snapshot) as CvDoc);
    } finally {
      setPendingDraft(null);
    }
  };
  const discardDraft = () => {
    clearDraft(id);
    setPendingDraft(null);
  };

  const status: SaveStatus =
    phase.kind === "saving"
      ? { kind: "saving" }
      : phase.kind === "rejected" && phase.failed === snapshot
        ? { kind: "rejected", message: phase.message ?? "" }
        : phase.kind === "retrying" || phase.kind === "offline"
          ? { kind: phase.kind }
          : dirty
            ? { kind: "dirty" }
            : { kind: "saved" };

  return { doc, update, setContent, status, pendingDraft, restoreDraft, discardDraft, saveNow: () => (dirty ? save(snapshot) : Promise.resolve()) };
}
