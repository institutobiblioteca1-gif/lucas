import { useEffect, useState } from 'react';
import { FileText, Search, Eye, ChevronDown, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PlanStatus } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/helpers';
import { PageHeader } from '@/components/Layout';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';

interface PlanRow {
  id: string;
  plan_code: string | null;
  status: PlanStatus;
  discipline_name: string;
  discipline_code: string;
  course_name: string;
  class_name: string;
  year: number;
  semester: number;
  professor_name: string | null;
  updated_at: string;
}

export function PlanosPage({ onReview }: { onReview: (planId: string) => void }) {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => { loadPlans(); }, []);

  async function loadPlans() {
    setLoading(true);
    const { data: plans } = await supabase.from('teaching_plans').select(`
      id, plan_code, status, updated_at, class_year_discipline_id, professor_id,
      class_year_disciplines!inner (
        id, discipline_id, professor_id, class_year_id,
        discipline:disciplines (name, code),
        class_year:class_years (year, semester, class:classes (name, course:courses (name)))
      )
    `);

    if (!plans || plans.length === 0) { setPlans([]); setLoading(false); return; }

    const profIds = [...new Set(plans.map((p: any) => p.professor_id).filter(Boolean))];
    const { data: profs } = await supabase.from('professors').select('id, name').in('id', profIds);
    const profMap = new Map((profs || []).map((p) => [p.id, p.name]));

    const rows: PlanRow[] = plans.map((p: any) => {
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
        professor_name: p.professor_id ? profMap.get(p.professor_id) || '—' : '—',
        updated_at: p.updated_at,
      };
    });

    rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    setPlans(rows);
    setLoading(false);
  }

  const filtered = plans.filter((p) => {
    const matchSearch = !search ||
      p.discipline_name.toLowerCase().includes(search.toLowerCase()) ||
      p.course_name.toLowerCase().includes(search.toLowerCase()) ||
      p.class_name.toLowerCase().includes(search.toLowerCase()) ||
      p.professor_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader title="Planos de Ensino" subtitle="Todos os planos cadastrados no sistema" />

      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por disciplina, curso, turma ou professor..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          />
        </div>
        <div className="relative w-52">
          <button
            type="button"
            onClick={() => setStatusOpen((open) => !open)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            aria-expanded={statusOpen}
            aria-haspopup="listbox"
          >
            <span>{statusFilter ? STATUS_LABELS[statusFilter as PlanStatus] : 'Todos os status'}</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
          </button>
          {statusOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white p-1 shadow-lg" role="listbox">
              <StatusOption label="Todos os status" value="" selected={statusFilter === ''} onSelect={() => { setStatusFilter(''); setStatusOpen(false); }} />
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <StatusOption
                  key={key}
                  label={label}
                  value={key}
                  selected={statusFilter === key}
                  onSelect={() => { setStatusFilter(key); setStatusOpen(false); }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <EmptyState icon={<FileText className="w-7 h-7" />} title="Nenhum plano encontrado" description={plans.length === 0 ? "Nenhum plano de ensino cadastrado ainda." : "Nenhum plano corresponde aos filtros aplicados."} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="px-5 py-3 font-medium">Disciplina</th>
                <th className="px-5 py-3 font-medium">Curso / Turma</th>
                <th className="px-5 py-3 font-medium">Professor</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium w-20">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{p.discipline_code}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{p.discipline_name}</p>
                        <p className="text-xs text-slate-400">{p.plan_code || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-slate-700">{p.course_name}</p>
                    <p className="text-xs text-slate-500">{p.class_name} — {p.year}/{p.semester}º</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-slate-700">{p.professor_name}</span>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => onReview(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" title="Revisar plano">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusOption({ label, value, selected, onSelect }: { label: string; value: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className="w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
    >
      <span>{label}</span>
      {selected && <Check className="w-4 h-4 text-slate-900" />}
    </button>
  );
}
