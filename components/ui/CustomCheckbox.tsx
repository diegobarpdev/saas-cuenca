'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  accentColor?: 'emerald' | 'amber' | 'sky' | 'purple';
  disabled?: boolean;
  className?: string;
}

export function CustomCheckbox({
  checked,
  onChange,
  label,
  description,
  accentColor = 'emerald',
  disabled = false,
  className = '',
}: CustomCheckboxProps) {
  const activeBgMap = {
    emerald: 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-emerald-500/30',
    amber: 'bg-amber-500 border-amber-400 text-slate-950 shadow-amber-500/30',
    sky: 'bg-sky-500 border-sky-400 text-slate-950 shadow-sky-500/30',
    purple: 'bg-purple-500 border-purple-400 text-white shadow-purple-500/30',
  };

  const hoverBorderMap = {
    emerald: 'hover:border-emerald-500/50',
    amber: 'hover:border-amber-500/50',
    sky: 'hover:border-sky-500/50',
    purple: 'hover:border-purple-500/50',
  };

  return (
    <label
      className={`inline-flex items-start gap-3 cursor-pointer select-none group ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div className="relative flex items-center pt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`w-5 h-5 rounded-lg border transition-all duration-200 flex items-center justify-center shadow-md active:scale-90 ${
            checked
              ? `${activeBgMap[accentColor]} shadow-lg`
              : `bg-slate-950/90 border-slate-800 ${hoverBorderMap[accentColor]} text-transparent`
          }`}
        >
          <Check
            className={`w-3.5 h-3.5 stroke-[3] transition-transform duration-200 ${
              checked ? 'scale-100' : 'scale-0'
            }`}
          />
        </div>
      </div>

      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <span
              className={`block text-xs font-display font-medium transition-colors ${
                checked ? 'text-white' : 'text-slate-300 group-hover:text-white'
              }`}
            >
              {label}
            </span>
          )}
          {description && (
            <span className="block text-[11px] text-slate-400 font-normal mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}
