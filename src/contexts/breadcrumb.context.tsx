"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface BreadcrumbContextValue {
  tailLabel: string | undefined;
  setTailLabel: (label: string | undefined) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [tailLabel, setTailLabelState] = useState<string | undefined>();

  const setTailLabel = useCallback((label: string | undefined) => {
    setTailLabelState(label);
  }, []);

  const value = useMemo(
    () => ({ tailLabel, setTailLabel }),
    [tailLabel, setTailLabel]
  );

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

/** Detail pages call this to set the last breadcrumb label (e.g. invoice number). */
export function useBreadcrumbTail(label: string | undefined) {
  const ctx = useContext(BreadcrumbContext);

  useEffect(() => {
    if (!ctx) return;
    ctx.setTailLabel(label);
    return () => ctx.setTailLabel(undefined);
  }, [label, ctx]);
}

export function useBreadcrumbContext() {
  return useContext(BreadcrumbContext);
}
