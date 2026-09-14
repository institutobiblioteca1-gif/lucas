import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, RotateCcw, FileText, User, Calendar, BookOpen, GraduationCap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { TeachingPlan, Discipline, ClassYear, ClassEntity, Course, Professor } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface FullPlanData {
  plan: TeachingPlan;
  discipline: Discipline;
  classYear: ClassYear;
  classEntity: ClassEntity;
  course: Course;
  professor: Professor | null;
}

export function RevisarPlanoPage({ planId, onBack }: { planId: string; onBack: () => void }) {
  const [data, setData] = useState<FullPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPlan(); }, [planId]);

  async function loadPlan() {
    setLoading(true);
    const { data: plan } = await supabase.from('teaching_plans').select('*').eq('id', planId).single();
    if (!plan) { setLoading(false); return; }

    const { data: cyd } = await supabase.from('class_year_disciplines').select('*').eq('id', plan.class_year_discipline_id).single();
    if (!cyd) { setLoading(false); return; }

    const [disc, prof, cy] = await Promise.all([
      supabase.from('disciplines').select('*').eq('id', cyd.discipline_id).single(),
      cyd.professor_id ? supabase.from('professors').select('*').eq('id', cyd.professor_id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from('class_years').select('*').eq('id', cyd.class_year_id).single(),
    ]);
    if (!cy.data) { setLoading(false); return; }

    const cls = await supabase.from('classes').select('*').eq('id', cy.data.class_id).single();
    const course = await supabase.from('courses').select('*').eq('id', cls.data.course_id).single();

    setData({
      plan: plan as TeachingPlan,
      discipline: disc.data as Discipline,
      classYear: cy.data as ClassYear,
      classEntity: cls.data as ClassEntity,
      course: course.data as Course,
      professor: prof.data as Professor | null,
    });
    setReviewNotes(plan.review_notes || '');
    setLoading(false);
  }

  async function approvePlan() {
    setSaving(true);
    await supabase.from('teaching_plans').update({ status: 'aprovado', review_notes: reviewNotes }).eq('id', planId);
    setSaving(false);
    setApproveModal(false);
    onBack();
  }

  async function rejectPlan() {
    setSaving(true);
    await supabase.from('teaching_plans').update({ status: 'em_elaboracao', review_notes: reviewNotes }).eq('id', planId);
    setSaving(false);
    setRejectModal(false);
    onBack();
  }

  if (loading) return <div className="p-8"><p className="text-slate-500">Carregando plano...</p></div>;
  if (!data) return <div className="p-8"><p className="text-slate-500">Plano não encontrado.</p></div>;

  const sections = [
    { key: 'ementa', label: 'Ementa' },
    { key: 'competencias', label: 'Competências' },
    { key: 'conteudo', label: 'Conteúdo Programático' },
    { key: 'bibliografia_basica', label: 'Bibliografia Básica' },
    { key: 'bibliografia_complementar', label: 'Bibliografia Complementar' },
    { key: 'bibliografia_aprofundamento', label: 'Bibliografia de Aprofundamento' },
  ] as const;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para planos
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{data.discipline.name}</h2>
                <p className="text-xs text-slate-500">{data.plan.plan_code || '—'}</p>
              </div>
            </div>
          </div>
          <StatusBadge status={data.plan.status} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <InfoItem icon={<GraduationCap className="w-4 h-4" />} label="Curso" value={data.course.name} />
          <InfoItem icon={<BookOpen className="w-4 h-4" />} label="Turma" value={`${data.classEntity.name} — ${data.classYear.year}/${data.classYear.semester}º`} />
          <InfoItem icon={<User className="w-4 h-4" />} label="Professor" value={data.professor?.name || '—'} />
          <InfoItem icon={<Calendar className="w-4 h-4" />} label="Carga Horária" value={`${data.discipline.workload_hours}h`} />
        </div>
      </div>

      {/* Plan sections */}
      <div className="space-y-4 mb-6">
        {sections.map((s) => (
          <div key={s.key} className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">{s.label}</h3>
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {(data.plan as any)[s.key] || <span className="text-slate-400 italic">Não preenchido</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Review notes */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Observações da Coordenação</h3>
        <Textarea
          value={reviewNotes}
          onChange={(e) => setReviewNotes(e.target.value)}
          placeholder="Adicione observações para o professor..."
          rows={4}
        />
      </div>

      {/* Actions */}
      {(data.plan.status === 'enviado' || data.plan.status === 'em_revisao') && (
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setRejectModal(true)} className="flex-1">
            <RotateCcw className="w-4 h-4" /> Solicitar correções
          </Button>
          <Button variant="secondary" onClick={() => setApproveModal(true)} className="flex-1">
            <CheckCircle2 className="w-4 h-4" /> Aprovar plano
          </Button>
        </div>
      )}

      {/* Modals */}
      <Modal open={approveModal} onClose={() => setApproveModal(false)} title="Aprovar Plano de Ensino" size="sm">
        <p className="text-sm text-slate-600 mb-4">Tem certeza que deseja aprovar este plano de ensino? O professor será notificado de que o plano foi aprovado.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setApproveModal(false)}>Cancelar</Button>
          <Button variant="secondary" onClick={approvePlan} disabled={saving}>{saving ? 'Aprovando...' : 'Aprovar'}</Button>
        </div>
      </Modal>

      <Modal open={rejectModal} onClose={() => setRejectModal(false)} title="Solicitar Correções" size="sm">
        <p className="text-sm text-slate-600 mb-4">O plano será devolvido ao professor para correção. As observações acima serão enviadas junto.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setRejectModal(false)}>Cancelar</Button>
          <Button variant="danger" onClick={rejectPlan} disabled={saving}>{saving ? 'Enviando...' : 'Enviar correções'}</Button>
        </div>
      </Modal>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-slate-400 mb-1">{icon}<span className="text-xs">{label}</span></div>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
