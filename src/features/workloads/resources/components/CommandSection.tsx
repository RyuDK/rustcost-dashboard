type CommandGroup = {
  title: string;
  commands: string[];
};

type CommandSectionProps = {
  heading: string;
  groups: CommandGroup[];
};

export const CommandSection = ({ heading, groups }: CommandSectionProps) => (
  <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
        {heading}
      </h3>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Command Palette
      </span>
    </div>
    <div className="grid gap-3 md:grid-cols-2">
      {groups.map((group) => (
        <div
          key={group.title}
          className="space-y-2 rounded-lg border border-slate-100 p-3 text-xs dark:border-slate-800"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {group.title}
          </p>
          <div className="space-y-1">
            {group.commands.map((cmd, idx) => (
              <code
                key={`${group.title}-${idx}`}
                className="block rounded bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {cmd}
              </code>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);
