"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "./icons";

interface DatePickerProps {
  value: string; // ISO yyyy-mm-dd, or "" for unset
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
}

const MONTH_NAMES = [
  "Janvier",
  "Fevrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Aout",
  "Septembre",
  "Octobre",
  "Novembre",
  "Decembre",
];
const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function parseISO(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(iso: string): string {
  const d = parseISO(iso);
  if (!d) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "jj/mm/aaaa",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => parseISO(value) || new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const minDate = min ? parseISO(min) : null;
  const maxDate = max ? parseISO(max) : null;
  const selected = parseISO(value);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  function isDisabled(d: Date) {
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => {
          if (!open) setViewDate(parseISO(value) || new Date());
          setOpen((o) => !o);
        }}
        className="flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-neutral-400"
      >
        <CalendarIcon className="h-3.5 w-3.5 text-neutral-400" />
        {value ? formatDisplay(value) : <span className="text-neutral-400">{placeholder}</span>}
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-64 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-neutral-900/10">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
              aria-label="Mois precedent"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold uppercase tracking-wide">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
              aria-label="Mois suivant"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-neutral-400">
            {DAY_LABELS.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <span key={i} />;
              const iso = toISO(d);
              const disabled = isDisabled(d);
              const isSelected = selected && toISO(selected) === iso;
              return (
                <button
                  type="button"
                  key={i}
                  disabled={disabled}
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors ${
                    isSelected
                      ? "bg-neutral-900 font-bold text-white"
                      : disabled
                        ? "text-neutral-300"
                        : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
