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
import { BuyNowModal } from "@/components/BuyNowModal";

type BuyNowContextValue = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
};

const BuyNowContext = createContext<BuyNowContextValue | null>(null);

export function BuyNowProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  const value = useMemo(
    () => ({ open, close, isOpen }),
    [open, close, isOpen],
  );

  return (
    <BuyNowContext.Provider value={value}>
      {children}
      <BuyNowModal open={isOpen} onClose={close} />
    </BuyNowContext.Provider>
  );
}

export function useBuyNow() {
  const context = useContext(BuyNowContext);
  if (!context) {
    throw new Error("useBuyNow must be used within BuyNowProvider");
  }
  return context;
}
