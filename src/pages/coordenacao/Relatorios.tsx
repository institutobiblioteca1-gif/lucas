import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, FileText, CheckCircle2, Send, Eye, Edit3, GraduationCap, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PlanStatus } from '@/lib/types';
import { PageHeader } from '@/components/Layout';
import { Select } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';

interface ReportData {
  byCourse: Array<{ course_name: string; total: number; counts: Record<PlanStatus, number> }>;
  byYear: Array<{ year: number; total: number; counts: Record<PlanStatus, number> }>;
  byProfessor: Array<{ professor_name: string; total: number; counts: Record<PlanStatus, number> }>;
}

export function RelatoriosPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReport(); }, []);

  async function loadReport() {
    setLoading(true);
    const { data: plans } = await supabase.from('teaching_plans').select(`
      id, status, professor_id,
      class_year_disciplines!inner (
        discipline:disciplines (name),
        class_year:class_years (year, class:classes (name, course:courses (name)))
      )
    `);

    if (!plans || plans.length === 0) { setData({ byCourse: [], byYear: [], byProfessor: [] }); setLoading(false); return; }

    const profIds = [...new Set(plans.map((p: any) => p.professor_id).filter(Boolean))];
    const { data: profs } = await supabase.from('professors').select('id, name').in('id', profIds);
    const profMap = new Map((profs || []).map((p) => [p.id, p.name]));

    const empty: Record<PlanStatus, number> = { rascunho: 0, em_elaboracao: 0, enviado: 0, em_revisao: 0, aprovado: 0 };

    const courseMap = new Map<string, { total: number; counts: Record<PlanStatus, number> }>();
    const yearMap = new Map<number, { total: number; counts: Record<PlanStatus, number> }>();
    const profReportMap = new Map<string, { total: number; counts: Record<PlanStatus, number> }>();

    plans.forEach((p: any) => {
      const status = p.status as PlanStatus;
      const courseName = p.class_year_disciplines.class_year.class.course.name;
      const year = p.class_year_disciplines.class_year.year;
      const profName = p.professor_id ? profMap.get(p.professor_id) || '—' : '—';

      if (!courseMap.has(courseName)) courseMap.set(courseName, { total: 0, counts: { ...empty } });
      const c = courseMap.get(courseName)!;
      c.total++; c.counts[status]++;

      if (!yearMap.has(year)) yearMap.set(year, { total: 0, counts: { ...empty } });
      const y = yearMap.get(year)!;
      y.total++; y.counts[status]++;

      if (!profReportMap.has(profName)) profReportMap.set(profName, { total: 0, counts: { ...empty } });
      const pr = profReportMap.get(profName)!;
      pr.total++; pr.counts[status]++;
    });

    setData({
      byCourse: [...courseMap.entries()].map(([course_name, v]) => ({ course_name, total: v.total, counts: v.counts })),
      byYear: [...yearMap.entries()].map(([year, v]) => ({ year, total: v.total, counts: v.counts })).sort((a, b) => b.year - a.year),
      byProfessor: [...profReportMap.entries()].map(([professor_name, v]) => ({ professor_name, total: v.total, counts: v.counts })).sort((a, b) => b.total - a.total),
    });
    setLoading(false);
  }

  if (loading) return <div className="p-8"><PageHeader title="Relatórios" subtitle="Análise estatística dos planos de ensino" /><div className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" /></div>;
  if (!data) return null;

  const statuses: PlanStatus[] = ['aprovado', 'enviado', 'em_revisao', 'em_elaboracao', 'rascunho'];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader title="Relatórios" subtitle="Análise estatística dos planos de ensino" />

      {data.byCourse.length === 0 && data.byYear.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Nenhum dado disponível para relatório.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* By course */}
          <ReportTable title="Por Curso" icon={<GraduationCap className="w-4 h-4" />} rows={data.byCourse.map((c) => ({ label: c.course_name, ...c }))} statuses={statuses} />

          {/* By year */}
          <ReportTable title="Por Ano Letivo" icon={<TrendingUp className="w-4 h-4" />} rows={data.byYear.map((y) => ({ label: String(y.year), ...y }))} statuses={statuses} />

          {/* By professor */}
          <ReportTable title="Por Professor" icon={<FileText className="w-4 h-4" />} rows={data.byProfessor.map((p) => ({ label: p.professor_name, ...p }))} statuses={statuses} />
        </div>
      )}
    </div>
  );
}

function ReportTable({ title, icon, rows, statuses }: {
  title: string;
  icon: React.ReactNode;
  rows: Array<{ label: string; total: number; counts: Record<PlanStatus, number> }>;
  statuses: PlanStatus[];
}) {
  if (rows.length === 0) return null;
  const maxTotal = Math.max(...rows.map((r) => r.total), 1);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        {icon}
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wider">
            <th className="px-5 py-2.5 font-medium">Nome</th>
            <th className="px-5 py-2.5 font-medium text-center">Total</th>
            {statuses.map((s) => <th key={s} className="px-3 py-2.5 font-medium text-center"><span className="text-[10px]">{s.replace(/_/g, ' ')}</span></th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.label} className="hover:bg-slate-50/50">
              <td className="px-5 py-3">
                <p className="text-sm font-medium text-slate-900">{r.label}</p>
                <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-300 rounded-full" style={{ width: `${(r.total / maxTotal) * 100}%` }} />
                </div>
              </td>
              <td className="px-5 py-3 text-center"><span className="text-sm font-bold text-slate-900">{r.total}</span></td>
              {statuses.map((s) => <td key={s} className="px-3 py-3 text-center"><span className="text-sm text-slate-600">{r.counts[s] || 0}</span></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
