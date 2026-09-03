"use client";

import type { HTMLAttributes } from "react";

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  placeholder?: string;
};

export function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-[family-name:var(--font-ibm-plex)] text-xs uppercase tracking-wider text-text-dim"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border bg-bg px-3.5 py-3 font-[family-name:var(--font-inter)] text-sm text-white outline-none placeholder:text-white/30 focus:border-neon ${
          error ? "border-red-400" : "border-white/15"
        }`}
      />
      {error ? (
        <p className="mt-1 font-[family-name:var(--font-ibm-plex)] text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type NavRowProps = {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
};

export function NavRow({
  onBack,
  onNext,
  nextLabel = "Continue",
}: NavRowProps) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-11 items-center px-4 font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim transition-colors hover:text-white"
      >
        Back
      </button>
      <button
        type="button"
        onClick={onNext}
        className="inline-flex h-12 items-center bg-neon px-6 font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-bg transition-opacity hover:opacity-90"
      >
        {nextLabel}
      </button>
    </div>
  );
}
