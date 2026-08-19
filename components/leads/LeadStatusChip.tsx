/**
 * Status badge in the same shape the other dashboards use: one calm dark
 * pill with a hairline border, not a colour-coded traffic light. With 25
 * free-text statuses in the sheet, colour would be guesswork anyway.
 */
export function LeadStatusChip({ status }: { status: string }) {
  const label = status.trim();

  if (label === "") {
    return <span className="text-[13px] text-text-3">—</span>;
  }

  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-[6px] border border-border-default bg-surface-2 px-3.5 py-1.5 text-[13px] text-text-1">
      {label}
    </span>
  );
}
