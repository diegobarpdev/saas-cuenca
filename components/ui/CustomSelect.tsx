'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  accentColor?: 'emerald' | 'purple' | 'amber';
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecciona una opción',
  className = '',
  accentColor = 'amber',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const borderGlowMap = {
    amber: 'focus:border-amber-500 border-slate-800 hover:border-amber-500/40',
    purple: 'focus:border-purple-500 border-slate-800 hover:border-purple-500/40',
    emerald: 'focus:border-emerald-500 border-slate-800 hover:border-emerald-500/40',
  };

  const activeOptionMap = {
    amber: 'bg-amber-500/15 text-amber-300 font-bold',
    purple: 'bg-purple-500/15 text-purple-300 font-bold',
    emerald: 'bg-emerald-500/15 text-emerald-300 font-bold',
  };

  return (
    <div ref={containerRef} className={`relative w-full font-sans ${className}`}>
      {/* Botón Trigger Personalizado */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-2xl bg-slate-950/90 text-left text-xs md:text-sm text-white flex items-center justify-between gap-2 border transition-all duration-200 shadow-md ${
          borderGlowMap[accentColor]
        } ${isOpen ? 'border-amber-500 ring-2 ring-amber-500/20' : ''}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : <span className="text-slate-500">{placeholder}</span>}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {/* Menú Desplegable Flotante Personalizado */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 p-1.5 rounded-2xl bg-[#0B0F19]/95 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-1 max-h-60 overflow-y-auto scrollbar-none animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                  isSelected
                    ? activeOptionMap[accentColor]
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
                }`}
              >
                <div>
                  <span className="block font-display">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="block text-[10px] text-slate-500 font-mono-tech mt-0.5">{opt.sublabel}</span>
                  )}
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
