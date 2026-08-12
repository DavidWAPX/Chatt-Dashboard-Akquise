import { cn } from "@/lib/cn";

interface EmptyStateProps {
  /** Always phrased as a signpost, never as an apology — §6.7. */
  children: string;
  className?: string;
}

export function EmptyState({ children, className }: EmptyStateProps) {
  return (
    <p
      className={cn(
        "px-4 py-16 text-center text-[15px] italic text-text-3 break-anywhere",
        className,
      )}
    >
      {children}
    </p>
  );
}
