"use client";

import type { HTMLAttributes } from "react";
import {
  formatINR,
  formatINRExact,
  priceBreakdown,
  PRODUCT,
} from "@/lib/product";

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

const fieldClassName = (error?: string) =>
  `w-full rounded-lg border bg-bg px-3.5 py-3 font-[family-name:var(--font-inter)] text-sm text-white outline-none placeholder:text-white/30 focus:border-neon disabled:cursor-not-allowed disabled:opacity-50 ${
    error ? "border-red-400" : "border-white/15"
  }`;

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
        className={fieldClassName(error)}
      />
      {error ? (
        <p className="mt-1 font-[family-name:var(--font-ibm-plex)] text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
};

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  error,
  placeholder = "Select",
  disabled,
  autoComplete,
}: SelectFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-[family-name:var(--font-ibm-plex)] text-xs uppercase tracking-wider text-text-dim"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldClassName(error)} appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        }}
      >
        <option value="" className="bg-bg text-text-dim">
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option} className="bg-bg text-white">
            {option}
          </option>
        ))}
      </select>
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

/** Product / GST / delivery / total. */
export function PriceBreakdownPanel({
  quantity,
  className = "",
}: {
  quantity: number;
  className?: string;
}) {
  const { basePaise, gstPaise, deliveryPaise, totalPaise } =
    priceBreakdown(quantity);

  return (
    <dl
      className={`space-y-2 font-[family-name:var(--font-ibm-plex)] text-sm ${className}`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-text-dim">Product Price</dt>
        <dd className="tabular-nums text-text-soft">
          {formatINRExact(basePaise)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-text-dim">GST ({PRODUCT.gstRatePercent}%)</dt>
        <dd className="tabular-nums text-text-soft">
          {formatINRExact(gstPaise)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-text-dim">
          Delivery ({formatINR(PRODUCT.deliveryPaisePerUnit)} / unit)
        </dt>
        <dd className="tabular-nums text-text-soft">
          {formatINRExact(deliveryPaise)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-white/10 pt-2">
        <dt className="text-white">Total Price</dt>
        <dd className="tabular-nums font-medium text-neon">
          {formatINRExact(totalPaise)}
        </dd>
      </div>
    </dl>
  );
}
