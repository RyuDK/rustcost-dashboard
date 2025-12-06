import { setTimezone } from "@/store/slices/preferenceSlice";
import { useAppDispatch, useAppSelector } from "@/store/hook";

export function TimezoneSelector() {
  const dispatch = useAppDispatch();
  const timezone = useAppSelector((state) => state.preferences.timezone);

  const timezones = Intl.supportedValuesOf("timeZone");

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">Timezone</label>
      <select
        value={timezone}
        onChange={(e) => dispatch(setTimezone(e.target.value))}
        className="border rounded px-3 py-2 bg-white dark:bg-gray-800"
      >
        {timezones.map((tz) => (
          <option key={tz} value={tz}>
            {tz}
          </option>
        ))}
      </select>
    </div>
  );
}
