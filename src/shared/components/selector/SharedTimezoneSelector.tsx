import { useEffect, useMemo, useRef, useState } from "react";
import { setTimezone } from "@/store/slices/preferenceSlice";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { useI18n } from "@/app/providers/i18n/useI18n";

function getTimezones(): string[] {
  const fn = Intl.supportedValuesOf?.bind(Intl);
  return typeof fn === "function" ? (fn("timeZone") as string[]) : [];
}

export function SharedTimezoneSelector() {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const selected = useAppSelector((state) => state.preferences.timezone);

  const timezones = useMemo(() => getTimezones(), []);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return timezones;
    return timezones.filter((tz) => tz.toLowerCase().includes(q));
  }, [timezones, query]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const openDropdown = () => {
    setQuery("");
    setOpen(true);
    queueMicrotask(() => inputRef.current?.focus());
  };

  const selectTimezone = (tz: string) => {
    dispatch(setTimezone(tz));
    setOpen(false);
    setQuery(tz);
  };

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1">
      <label className="text-sm font-medium">
        {t("common.timezone.label")}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          value={open ? query : selected || query}
          onChange={(e) => {
            if (!open) setOpen(true);
            setQuery(e.target.value);
          }}
          onFocus={() => {
            if (!open) openDropdown();
          }}
          onClick={() => {
            if (!open) openDropdown();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={t("common.timezone.placeholder")}
          className="w-full rounded border bg-white px-3 py-2 dark:bg-gray-800"
          role="combobox"
          aria-expanded={open}
          aria-controls="tz-listbox"
          aria-autocomplete="list"
        />

        {open && (
          <div
            id="tz-listbox"
            role="listbox"
            className="
              absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-lg border
              bg-white shadow-lg dark:bg-gray-900
            "
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                {t("common.timezone.noMatches")}
              </div>
            ) : (
              <ul className="py-1">
                {filtered.map((tz) => {
                  const isSelected = tz === selected;
                  return (
                    <li key={tz} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onClick={() => selectTimezone(tz)}
                        className={`
                          flex w-full items-center justify-between px-3 py-2 text-left text-sm
                          hover:bg-gray-100 dark:hover:bg-gray-800
                          ${isSelected ? "font-semibold" : "font-normal"}
                        `}
                      >
                        <span className="truncate">{tz}</span>
                        {isSelected && (
                          <span className="text-xs text-gray-500">
                            {t("common.timezone.selected")}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
