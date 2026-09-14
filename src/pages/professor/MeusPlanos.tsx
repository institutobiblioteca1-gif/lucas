import { useEffect, useState } from 'react';
import { ClipboardList, Search, FileText, Eye, Edit3, Calendar, BookOpen, GraduationCap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PlanStatus } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/helpers';
import { PageHeader } from '@/components/Layout';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';

interface MyPlanRow {
  id: string;
  plan_code: string | null;
  status: PlanStatus;
  discipline_name: string;
  discipline_code: string;
  course_name: string;
  class_name: string;
  year: number;
  semester: number;
  updated_at: string;
}

export function MeusPlanosPage({ professorId, onEdit, onView }: {
  professorId: string;
  onEdit: (planId: string) => void;
  onView: (planId: string) => void;
}) {
  const [plans, setPlans] = useState<MyPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  useEffect(() => { loadPlans(); }, [professorId]);

  async function loadPlans() {
    setLoading(true);
    const { data: plans } = await supabase.from('teaching_plans').select(`
      id, plan_code, status, updated_at, class_year_discipline_id,
      class_year_disciplines!inner (
        discipline:disciplines (name, code),
        class_year:class_years (year, semester, class:classes (name, course:courses (name)))
      )
    `).eq('professor_id', professorId);

    if (!plans || plans.length === 0) { setPlans([]); setLoading(false); return; }

    const rows: MyPlanRow[] = plans.map((p: any) => {
      const cyd = p.class_year_disciplines;
      return {
        id: p.id,
        plan_code: p.plan_code,
        status: p.status as PlanStatus,
        discipline_name: cyd.discipline?.name || '—',
        discipline_code: cyd.discipline?.code || '—',
        course_name: cyd.class_year?.class?.course?.name || '—',
        class_name: cyd.class_year?.class?.name || '—',
        year: cyd.class_year?.year || 0,
        semester: cyd.class_year?.semester || 0,
        updated_at: p.updated_at,
      };
    });

    rows.sort((a, b) => b.year - a.year || a.class_name.localeCompare(b.class_name) || a.discipline_name.localeCompare(b.discipline_name));
    setPlans(rows);
    setLoading(false);
  }

  const years = [...new Set(plans.map((p) => p.year))].sort((a, b) => b - a);

  const filtered = plans.filter((p) => {
    const matchSearch = !search ||
      p.discipline_name.toLowerCase().includes(search.toLowerCase()) ||
      p.course_name.toLowerCase().includes(search.toLowerCase()) ||
      p.class_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    const matchYear = !yearFilter || String(p.year) === yearFilter;
    return matchSearch && matchStatus && matchYear;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader title="Meus Planos" subtitle="Planos de ensino vinculados a você" />

      {plans.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por disciplina, curso ou turma..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            />
          </div>
          <div className="w-40">
            <Select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
              <option value="">Todos os anos</option>
              {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
            </Select>
          </div>
          <div className="w-44">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Todos os status</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <EmptyState
            icon={<ClipboardList className="w-7 h-7" />}
            title={plans.length === 0 ? "Nenhum plano atribuído a você" : "Nenhum plano encontrado"}
            description={plans.length === 0 ? "Quando a coordenação vincular disciplinas a você, os planos aparecerão aqui." : "Nenhum plano corresponde aos filtros aplicados."}
          />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-slate-600" />
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{p.discipline_code}</span>
              </div>
              <h3 className="font-semibold text-slate-900">{p.discipline_name}</h3>
              <div className="space-y-1 mt-2 text-xs text-slate-500">
                <div className="flex items-center gap-1.5"><GraduationCap className="w-3 h-3" /> {p.course_name}</div>
                <div className="flex items-center gap-1.5"><BookOpen className="w-3 h-3" /> {p.class_name}</div>
                <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {p.year}/{p.semester}º semestre</div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                <ButtonSmall onClick={() => onView(p.id)} icon={<Eye className="w-3.5 h-3.5" />} label="Visualizar" />
                {(p.status === 'rascunho' || p.status === 'em_elaboracao') && (
                  <ButtonSmall onClick={() => onEdit(p.id)} icon={<Edit3 className="w-3.5 h-3.5" />} label="Editar" primary />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ButtonSmall({ onClick, icon, label, primary }: { onClick: () => void; icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
        primary ? 'bg-slate-900 text-white hover:bg-slate-800' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon} {label}
    </button>
  );
}
