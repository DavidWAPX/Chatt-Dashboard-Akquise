import type { ReactNode } from "react";
import { EmptyState } from "./EmptyState";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  head: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  /** Becomes the card headline below 900px instead of a "Label: value" line. */
  isTitle?: boolean;
  /** Pinned to the card's top-right below 900px. */
  isActions?: boolean;
  /** Extra classes for the cell. */
  cellClassName?: string;
  /** Column width for the ≥900px table, e.g. "18%" or "120px". */
  width?: string;
}

interface TableProps<T> {
  columns: ReadonlyArray<Column<T>>;
  rows: readonly T[];
  rowKey: (row: T) => string;
  /** Signpost text shown when there are no rows. */
  empty: string;
  caption: string;
  /**
   * Wraps the table in a bordered, rounded frame with its own header band —
   * the look the other dashboards use. Without it the table sits bare on the
   * page.
   */
  framed?: boolean;
}

/**
 * Table — §6.7. Above 900px a real table; below it every row becomes its own
 * card. It never scrolls sideways.
 */
export function Table<T>({
  columns,
  rows,
  rowKey,
  empty,
  caption,
  framed = false,
}: TableProps<T>) {
  // An empty table still shows its head, so the columns stay readable and the
  // layout does not pop into existence with the first row.
  const isEmpty = rows.length === 0;

  const titleColumn = columns.find((column) => column.isTitle);
  const actionsColumn = columns.find((column) => column.isActions);
  const detailColumns = columns.filter(
    (column) => !column.isTitle && !column.isActions,
  );

  return (
    <>
      {/* ≥ 900px */}
      <div
        className={cn(
          "hidden tbl:block",
          framed && "overflow-hidden rounded-[12px] border border-border-default",
        )}
      >
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">{caption}</caption>
        {/* Fixed widths stop one long cell from squeezing its neighbours. */}
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={column.width ? { width: column.width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr className={cn("border-b border-border-default", framed && "bg-surface-1")}>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  "font-display text-[11px] font-semibold uppercase tracking-[0.09em] text-gold",
                  framed ? "px-5 py-4 align-middle" : "pb-[14px] pr-4 align-bottom last:pr-0",
                  column.align === "right" ? "text-right" : "text-left",
                )}
              >
                {column.head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isEmpty && (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState>{empty}</EmptyState>
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-border-soft transition-colors duration-[var(--dur)] ease-[var(--ease-ref)] last:border-b-0 hover:bg-row-hover"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "align-middle",
                    framed ? "h-[64px] px-5 py-4" : "h-[72px] py-3 pr-4 last:pr-0",
                    column.align === "right" ? "text-right tnum" : "text-left",
                    column.cellClassName,
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* < 900px — one card per row */}
      {isEmpty && (
        <div className="tbl:hidden">
          <EmptyState>{empty}</EmptyState>
        </div>
      )}
      <ul className="flex flex-col gap-3 tbl:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            className="rounded-[12px] bg-surface-2 p-4"
          >
            {(titleColumn || actionsColumn) && (
              <div className="mb-3 flex items-start justify-between gap-3">
                {titleColumn && (
                  <div className="min-w-0 break-anywhere">{titleColumn.cell(row)}</div>
                )}
                {actionsColumn && (
                  <div className="shrink-0">{actionsColumn.cell(row)}</div>
                )}
              </div>
            )}
            <dl className="flex flex-col gap-2">
              {detailColumns.map((column) => (
                <div
                  key={column.key}
                  className="flex items-baseline justify-between gap-4"
                >
                  <dt className="shrink-0 font-display text-[11px] uppercase tracking-[0.09em] text-gold">
                    {column.head}
                  </dt>
                  <dd
                    className={cn(
                      "min-w-0 text-right break-anywhere",
                      column.align === "right" && "tnum",
                    )}
                  >
                    {column.cell(row)}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
