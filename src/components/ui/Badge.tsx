import type { PlanStatus } from '@/lib/types';
import { STATUS_LABELS, STATUS_COLORS, STATUS_DOTS } from '@/lib/helpers';

export function StatusBadge({ status }: { status: PlanStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${STATUS_COLORS[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Badge({ children, color = 'slate' }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md ${colors[color] || colors.slate}`}>
      {children}
    </span>
  );
}
