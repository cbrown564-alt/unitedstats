"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { correctionPayloadFromPrefill, type CorrectionPayload, type CorrectionPrefill } from "@/lib/corrections";
import { CorrectionClaimForm } from "@/components/corrections/CorrectionClaimForm";
import { BottomSheet, BottomSheetBody, BottomSheetHeader } from "@/components/mobile/BottomSheet";

type MatchCorrectionContextValue = {
  pickMode: boolean;
  startPickMode: () => void;
  cancelPickMode: () => void;
  hasField: (fieldPath: string) => boolean;
  openDrawer: (fieldPath: string) => void;
};

const MatchCorrectionContext = createContext<MatchCorrectionContextValue | null>(null);

export function useMatchCorrection() {
  return useContext(MatchCorrectionContext);
}

/** One quiet entry point — same weight as the player plate footer. */
export function MatchCorrectionTrustBand({ trustNote }: { trustNote: string }) {
  const ctx = useMatchCorrection();
  if (!ctx) return null;

  return (
    <div className="correction-trust-band">
      <p className="min-w-0 flex-1 text-[11px] leading-4 text-ink-faint">{trustNote}</p>
      {!ctx.pickMode && (
        <button
          type="button"
          onClick={ctx.startPickMode}
          className="shrink-0 text-[11px] font-semibold text-devil-bright hover:underline focus-ring"
        >
          Spot an error? →
        </button>
      )}
    </div>
  );
}

export function MatchCorrectionProvider({
  matchId,
  prefillByPath,
  children,
}: {
  matchId: string;
  prefillByPath: Record<string, CorrectionPrefill>;
  children: ReactNode;
}) {
  const [pickMode, setPickMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [payload, setPayload] = useState<CorrectionPayload | null>(null);
  const titleId = useId();

  const hasField = useCallback((fieldPath: string) => fieldPath in prefillByPath, [prefillByPath]);

  const openDrawer = useCallback(
    (fieldPath: string) => {
      const prefill = prefillByPath[fieldPath];
      if (!prefill) return;
      setPayload(correctionPayloadFromPrefill(prefill));
      setDrawerOpen(true);
    },
    [prefillByPath],
  );

  const cancelPickMode = useCallback(() => {
    setPickMode(false);
    setDrawerOpen(false);
    setPayload(null);
  }, []);

  const startPickMode = useCallback(() => setPickMode(true), []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setPayload(null);
  }, []);

  useEffect(() => {
    if (!pickMode && !drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (drawerOpen) closeDrawer();
      else cancelPickMode();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickMode, drawerOpen, closeDrawer, cancelPickMode]);

  useEffect(() => {
    document.body.classList.toggle("match-correction-pick-mode", pickMode);
    return () => document.body.classList.remove("match-correction-pick-mode");
  }, [pickMode]);

  const value = useMemo(
    () => ({ pickMode, startPickMode, cancelPickMode, hasField, openDrawer }),
    [pickMode, startPickMode, cancelPickMode, hasField, openDrawer],
  );

  return (
    <MatchCorrectionContext.Provider value={value}>
      {children}

      {pickMode && (
        <div className="correction-pick-banner" role="status">
          <span>
            <strong className="text-ink">Pick mode.</strong> Click the value that looks wrong.
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <Link
              href={`/corrections?match=${matchId}`}
              className="text-xs font-semibold text-devil-bright hover:underline focus-ring"
            >
              Or pick from list →
            </Link>
            <button type="button" onClick={cancelPickMode} className="correction-pick-cancel focus-ring">
              Cancel
            </button>
          </span>
        </div>
      )}

      <div className="lg:hidden">
        <BottomSheet open={drawerOpen} onClose={closeDrawer} ariaLabel="Suggest a correction" titleId={titleId} fitContent>
          <BottomSheetHeader>
            <h2 id={titleId} className="display text-lg">
              Suggest a correction
            </h2>
          </BottomSheetHeader>
          <BottomSheetBody>
            {payload && (
              <CorrectionClaimForm payload={payload} setPayload={setPayload} onBack={closeDrawer} compact />
            )}
          </BottomSheetBody>
        </BottomSheet>
      </div>

      {drawerOpen && (
        <div className="correction-drawer-root hidden lg:block" aria-hidden={false}>
          <button type="button" aria-label="Close" className="correction-drawer-backdrop" onClick={closeDrawer} />
          <aside className="correction-drawer-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <button type="button" className="correction-drawer-close focus-ring" onClick={closeDrawer} aria-label="Close">
              ×
            </button>
            <h2 id={titleId} className="display pr-8 text-lg">
              Suggest a correction
            </h2>
            <div className="correction-drawer-body">
              {payload && (
                <CorrectionClaimForm payload={payload} setPayload={setPayload} onBack={closeDrawer} compact />
              )}
            </div>
          </aside>
        </div>
      )}
    </MatchCorrectionContext.Provider>
  );
}

/** Wrap a displayed value; in pick mode it becomes a click target. */
export function Pickable({
  fieldPath,
  children,
  className = "",
  disabled = false,
}: {
  fieldPath: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const ctx = useMatchCorrection();
  const pickable = !!ctx?.pickMode && !disabled && ctx.hasField(fieldPath);

  if (!pickable) {
    return className ? <div className={className}>{children}</div> : <>{children}</>;
  }

  return (
    <button
      type="button"
      onClick={() => ctx.openDrawer(fieldPath)}
      className={`correction-pickable focus-ring ${className}`.trim()}
    >
      {children}
      <span className="correction-pick-hint" aria-hidden>
        Click to correct
      </span>
    </button>
  );
}
