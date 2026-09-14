import type { PlanStatus } from './types';

export const STATUS_LABELS: Record<PlanStatus, string> = {
  rascunho: 'Rascunho',
  em_elaboracao: 'Em elaboração',
  enviado: 'Enviado',
  em_revisao: 'Em revisão',
  aprovado: 'Aprovado',
};

export const STATUS_COLORS: Record<PlanStatus, string> = {
  rascunho: 'bg-gray-100 text-gray-700 border-gray-200',
  em_elaboracao: 'bg-amber-50 text-amber-700 border-amber-200',
  enviado: 'bg-blue-50 text-blue-700 border-blue-200',
  em_revisao: 'bg-orange-50 text-orange-700 border-orange-200',
  aprovado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const STATUS_DOTS: Record<PlanStatus, string> = {
  rascunho: 'bg-gray-400',
  em_elaboracao: 'bg-amber-500',
  enviado: 'bg-blue-500',
  em_revisao: 'bg-orange-500',
  aprovado: 'bg-emerald-500',
};

export function generatePlanCode(
  courseCode: string,
  year: number,
  className: string,
  disciplineCode: string,
): string {
  const classPart = className.replace(/\s+/g, '').substring(0, 3).toUpperCase();
  const discPart = disciplineCode.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
  return `${courseCode.toUpperCase()}-${year}-${classPart}-${discPart}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
