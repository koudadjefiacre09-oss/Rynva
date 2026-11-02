"use client";

import { cn } from "@/lib/utils";
import { PRESET_LABELS, RETOUCH_PRESETS, type RetouchPreset, type RetouchSettings } from "@/lib/ai/retouch/settings";

type SliderKey = "smoothing" | "blemishes" | "darkCircles" | "shine" | "sharpness" | "denoise";

const SLIDERS: { key: SliderKey; label: string; hint: string }[] = [
  { key: "smoothing", label: "Lissage de la peau", hint: "Atténue les irrégularités, garde les pores et les rides marquées." },
  { key: "blemishes", label: "Suppression des imperfections", hint: "Boutons, rougeurs. Grains de beauté et taches de rousseur conservés." },
  { key: "darkCircles", label: "Correction des cernes", hint: "Rapproche le dessous des yeux du teint des joues." },
  { key: "shine", label: "Réduction des brillances", hint: "Matifie les reflets brillants de la peau." },
  { key: "sharpness", label: "Amélioration de la netteté", hint: "Yeux, sourcils et lèvres uniquement." },
  { key: "denoise", label: "Réduction du bruit", hint: "Sur la peau uniquement." },
];

export function presetOf(settings: RetouchSettings): RetouchPreset | "custom" {
  for (const preset of Object.keys(RETOUCH_PRESETS) as RetouchPreset[]) {
    const p = RETOUCH_PRESETS[preset];
    if (SLIDERS.every(({ key }) => p[key] === settings[key]) && p.photoCorrections === settings.photoCorrections) {
      return preset;
    }
  }
  return "custom";
}

function Slider({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between gap-3 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        <span className="tabular-nums text-zinc-400">{value}</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-auto accent-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:accent-white"
      />
      {hint && <span className="text-[11px] leading-snug text-zinc-400 dark:text-zinc-500">{hint}</span>}
    </label>
  );
}

export function PresetSwitch({
  value,
  onSelect,
  disabled,
}: {
  value: RetouchPreset | "custom";
  onSelect: (preset: RetouchPreset) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1 rounded-2xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-800/50">
      {(Object.keys(PRESET_LABELS) as RetouchPreset[]).map((preset) => (
        <button
          key={preset}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(preset)}
          aria-pressed={value === preset}
          className={cn(
            "flex-1 rounded-xl px-2 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed",
            value === preset
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
          )}
        >
          {PRESET_LABELS[preset]}
        </button>
      ))}
    </div>
  );
}

export function RetouchControls({
  settings,
  onChange,
  disabled,
}: {
  settings: RetouchSettings;
  onChange: (next: RetouchSettings) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {SLIDERS.map(({ key, label, hint }) => (
        <Slider
          key={key}
          label={label}
          hint={hint}
          value={settings[key]}
          disabled={disabled}
          onChange={(value) => onChange({ ...settings, [key]: value })}
        />
      ))}

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
        <input
          type="checkbox"
          checked={settings.photoCorrections}
          disabled={disabled}
          onChange={(e) => onChange({ ...settings, photoCorrections: e.target.checked })}
          className="mt-0.5 h-4 w-4 shrink-0 accent-zinc-900 dark:accent-white"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Corrections photo</span>
          <span className="text-[11px] leading-snug text-zinc-400 dark:text-zinc-500">
            Exposition, balance des blancs, contraste, ombres et hautes lumières, sur toute la photo (vêtements
            compris). Désactivé par défaut.
          </span>
        </span>
      </label>
    </div>
  );
}

export { Slider };
