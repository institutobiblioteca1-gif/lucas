import { useEffect, useState } from 'react';
import {
  GraduationCap, BookOpen, BookMarked, Users, FileText,
  CheckCircle2, Send, Eye, Edit3, TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PlanStatus } from '@/lib/types';
import { PageHeader } from '@/components/Layout';
import { StatusBadge } from '@/components/ui/Badge';

interface DashboardData {
  totalCourses: number;
  totalClasses: number;
  totalDisciplines: number;
  totalProfessors: number;
  totalPlans: number;
  statusCounts: Record<PlanStatus, number>;
  recentPlans: Array<{
    id: string;
    plan_code: string | null;
    status: PlanStatus;
    discipline_name: string;
    course_name: string;
    class_name: string;
    year: number;
    professor_name: string | null;
  }>;
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const [courses, classes, disciplines, professors, plans, cydData] = await Promise.all([
      supabase.from('courses').select('id'),
      supabase.from('classes').select('id'),
      supabase.from('disciplines').select('id'),
      supabase.from('professors').select('id'),
      supabase.from('teaching_plans').select('id, status, plan_code, class_year_discipline_id, professor_id'),
      supabase.from('class_year_disciplines').select(`
        id, discipline_id, professor_id, class_year_id,
        discipline:disciplines(name),
        class_year:class_years(id, year, class:classes(id, name, course:courses(name)))
      `),
    ]);

    const statusCounts: Record<PlanStatus, number> = {
      rascunho: 0, em_elaboracao: 0, enviado: 0, em_revisao: 0, aprovado: 0,
    };
    plans.data?.forEach((p) => { statusCounts[p.status as PlanStatus]++; });

    const cydMap = new Map<string, any>();
    cydData.data?.forEach((d: any) => {
      cydMap.set(d.id, d);
    });

    const profIds = new Set<string>();
    plans.data?.forEach((p) => { if (p.professor_id) profIds.add(p.professor_id); });
    const profs = await supabase.from('professors').select('id, name').in('id', [...profIds]);
    const profMap = new Map<string, string>();
    profs.data?.forEach((p) => profMap.set(p.id, p.name));

    const recentPlans = (plans.data || []).slice(-6).reverse().map((p) => {
      const cyd = cydMap.get(p.class_year_discipline_id);
      return {
        id: p.id,
        plan_code: p.plan_code,
        status: p.status as PlanStatus,
        discipline_name: cyd?.discipline?.name || '—',
        course_name: cyd?.class_year?.class?.course?.name || '—',
        class_name: cyd?.class_year?.class?.name || '—',
        year: cyd?.class_year?.year || 0,
        professor_name: p.professor_id ? profMap.get(p.professor_id) || '—' : '—',
      };
    });

    setData({
      totalCourses: courses.data?.length || 0,
      totalClasses: classes.data?.length || 0,
      totalDisciplines: disciplines.data?.length || 0,
      totalProfessors: professors.data?.length || 0,
      totalPlans: plans.data?.length || 0,
      statusCounts,
      recentPlans,
    });
    setLoading(false);
  }

  if (loading) return <div className="p-8"><PageHeader title="Dashboard" subtitle="Visão geral do sistema" /><LoadingSkeleton /></div>;

  if (!data) return null;

  const stats = [
    { label: 'Cursos', value: data.totalCourses, icon: <GraduationCap className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Turmas', value: data.totalClasses, icon: <BookOpen className="w-5 h-5" />, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Disciplinas', value: data.totalDisciplines, icon: <BookMarked className="w-5 h-5" />, color: 'text-amber-600 bg-amber-50' },
    { label: 'Professores', value: data.totalProfessors, icon: <Users className="w-5 h-5" />, color: 'text-purple-600 bg-purple-50' },
    { label: 'Planos de Ensino', value: data.totalPlans, icon: <FileText className="w-5 h-5" />, color: 'text-slate-700 bg-slate-100' },
  ];

  const statusItems = [
    { status: 'aprovado' as PlanStatus, count: data.statusCounts.aprovado, icon: <CheckCircle2 className="w-4 h-4" /> },
    { status: 'enviado' as PlanStatus, count: data.statusCounts.enviado, icon: <Send className="w-4 h-4" /> },
    { status: 'em_revisao' as PlanStatus, count: data.statusCounts.em_revisao, icon: <Eye className="w-4 h-4" /> },
    { status: 'em_elaboracao' as PlanStatus, count: data.statusCounts.em_elaboracao, icon: <Edit3 className="w-4 h-4" /> },
    { status: 'rascunho' as PlanStatus, count: data.statusCounts.rascunho, icon: <Edit3 className="w-4 h-4" /> },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader title="Dashboard" subtitle="Visão geral do sistema de planos de ensino" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Status breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">Status dos Planos</h3>
          </div>
          <div className="space-y-3">
            {statusItems.map((s) => (
              <div key={s.status} className="flex items-center justify-between">
                <StatusBadge status={s.status} />
                <span className="text-lg font-bold text-slate-900">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent plans */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Planos Recentes</h3>
          {data.recentPlans.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Nenhum plano criado ainda.</p>
          ) : (
            <div className="space-y-2">
              {data.recentPlans.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.discipline_name}</p>
                    <p className="text-xs text-slate-500">{p.course_name} · {p.class_name} · {p.year} · {p.professor_name}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
          <div className="w-10 h-10 rounded-lg bg-slate-100 mb-3" />
          <div className="h-6 w-12 bg-slate-100 rounded mb-2" />
          <div className="h-3 w-20 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
}
