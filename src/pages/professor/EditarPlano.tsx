import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Eye, Send, FileText, User, Calendar, BookOpen, GraduationCap, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
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

const SECTIONS = [
  { key: 'ementa', label: 'Ementa', placeholder: 'Descreva a ementa da disciplina...' },
  { key: 'competencias', label: 'Competências', placeholder: 'Liste as competências esperadas...' },
  { key: 'conteudo', label: 'Conteúdo Programático', placeholder: 'Descreva o conteúdo programático...' },
  { key: 'bibliografia_basica', label: 'Bibliografia Básica', placeholder: 'Liste a bibliografia básica...' },
  { key: 'bibliografia_complementar', label: 'Bibliografia Complementar', placeholder: 'Liste a bibliografia complementar...' },
  { key: 'bibliografia_aprofundamento', label: 'Bibliografia de Aprofundamento', placeholder: 'Liste a bibliografia de aprofundamento...' },
] as const;

export function EditarPlanoPage({ planId, onBack, onView }: { planId: string; onBack: () => void; onView: () => void }) {
  const [data, setData] = useState<FullPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [sendModal, setSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

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
    setFormData({
      ementa: plan.ementa || '',
      competencias: plan.competencias || '',
      conteudo: plan.conteudo || '',
      bibliografia_basica: plan.bibliografia_basica || '',
      bibliografia_complementar: plan.bibliografia_complementar || '',
      bibliografia_aprofundamento: plan.bibliografia_aprofundamento || '',
    });
    setLoading(false);
  }

  async function save(showFeedback = true) {
    setSaving(true);
    const newStatus = data?.plan.status === 'rascunho' ? 'em_elaboracao' : data?.plan.status;
    await supabase.from('teaching_plans').update({
      ...formData,
      status: newStatus,
    }).eq('id', planId);
    setSaving(false);
    if (showFeedback) {
      setSavedAt(new Date().toLocaleTimeString('pt-BR'));
      setTimeout(() => setSavedAt(null), 3000);
    }
    loadPlan();
  }

  async function sendForReview() {
    setSending(true);
    await supabase.from('teaching_plans').update({ ...formData, status: 'enviado' }).eq('id', planId);
    setSending(false);
    setSendModal(false);
    onBack();
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setImportText(text);
    };
    reader.onerror = () => setImportError('Erro ao ler o arquivo. Tente colar o conteúdo manualmente.');
    reader.readAsText(file);
  }

  function parseImportedText() {
    if (!importText.trim()) { setImportError('Cole ou carregue o conteúdo do plano primeiro.'); return; }
    const lower = importText.toLowerCase();
    const findSection = (keywords: string[]): string => {
      for (const kw of keywords) {
        const idx = lower.indexOf(kw);
        if (idx !== -1) {
          let end = importText.length;
          for (const otherKw of ['ementa', 'compet', 'conteúdo', 'conteudo', 'bibliografia básica', 'bibliografia complementar', 'bibliografia de aprofundamento', 'bibliografia basica']) {
            if (otherKw !== kw) {
              const otherIdx = lower.indexOf(otherKw, idx + kw.length);
              if (otherIdx !== -1 && otherIdx < end) end = otherIdx;
            }
          }
          return importText.substring(idx + kw.length, end).trim();
        }
      }
      return '';
    };

    const parsed = {
      ementa: findSection(['ementa']),
      competencias: findSection(['competências', 'competencias', 'competência', 'competencia']),
      conteudo: findSection(['conteúdo programático', 'conteudo programatico', 'conteúdo', 'conteudo', 'programa']),
      bibliografia_basica: findSection(['bibliografia básica', 'bibliografia basica']),
      bibliografia_complementar: findSection(['bibliografia complementar']),
      bibliografia_aprofundamento: findSection(['bibliografia de aprofundamento', 'bibliografia de aprofund', 'aprofundamento']),
    };

    setFormData((prev) => ({
      ...prev,
      ementa: parsed.ementa || prev.ementa,
      competencias: parsed.competencias || prev.competencias,
      conteudo: parsed.conteudo || prev.conteudo,
      bibliografia_basica: parsed.bibliografia_basica || prev.bibliografia_basica,
      bibliografia_complementar: parsed.bibliografia_complementar || prev.bibliografia_complementar,
      bibliografia_aprofundamento: parsed.bibliografia_aprofundamento || prev.bibliografia_aprofundamento,
    }));
    setImportModal(false);
    setImportText('');
  }

  if (loading) return <div className="p-8"><p className="text-slate-500">Carregando plano...</p></div>;
  if (!data) return <div className="p-8"><p className="text-slate-500">Plano não encontrado.</p></div>;

  const canEdit = data.plan.status === 'rascunho' || data.plan.status === 'em_elaboracao';

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para meus planos
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{data.discipline.name}</h2>
              <p className="text-xs text-slate-500">{data.plan.plan_code || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={data.plan.status} />
            {savedAt && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Salvo às {savedAt}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <InfoItem icon={<GraduationCap className="w-4 h-4" />} label="Curso" value={data.course.name} />
          <InfoItem icon={<BookOpen className="w-4 h-4" />} label="Turma" value={`${data.classEntity.name} — ${data.classYear.year}/${data.classYear.semester}º`} />
          <InfoItem icon={<User className="w-4 h-4" />} label="Professor" value={data.professor?.name || '—'} />
          <InfoItem icon={<Calendar className="w-4 h-4" />} label="Carga Horária" value={`${data.discipline.workload_hours}h`} />
        </div>

        {data.plan.status === 'enviado' && data.plan.review_notes && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-medium text-blue-900 mb-1">Observações da Coordenação:</p>
            <p className="text-sm text-blue-700">{data.plan.review_notes}</p>
          </div>
        )}
        {data.plan.status === 'em_elaboracao' && data.plan.review_notes && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-xs font-medium text-orange-900 mb-1">Correções solicitadas pela Coordenação:</p>
            <p className="text-sm text-orange-700">{data.plan.review_notes}</p>
          </div>
        )}
      </div>

      {/* Review notes from coordenação when sent back */}
      {!canEdit && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Este plano foi enviado para a coordenação e não pode mais ser editado. Aguarde a revisão.
          </p>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {SECTIONS.map((s) => (
          <div key={s.key} className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">{s.label}</h3>
            <Textarea
              value={formData[s.key]}
              onChange={(e) => setFormData({ ...formData, [s.key]: e.target.value })}
              placeholder={s.placeholder}
              rows={6}
              disabled={!canEdit}
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mt-6">
        {canEdit && (
          <>
            <Button onClick={() => save()} disabled={saving}>
              <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="outline" onClick={() => setImportModal(true)}>
              <Upload className="w-4 h-4" /> Importar de arquivo
            </Button>
            <Button variant="outline" onClick={() => { save(false); onView(); }}>
              <Eye className="w-4 h-4" /> Pré-visualizar
            </Button>
            <div className="flex-1" />
            <Button variant="secondary" onClick={() => setSendModal(true)}>
              <Send className="w-4 h-4" /> Enviar para Coordenação
            </Button>
          </>
        )}
      </div>

      {/* Send modal */}
      <Modal open={sendModal} onClose={() => setSendModal(false)} title="Enviar Plano para Coordenação" size="sm">
        <p className="text-sm text-slate-600 mb-4">
          Ao enviar o plano, ele não poderá mais ser editado até que a coordenação aprove ou solicite correções.
          Tem certeza que deseja enviar?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setSendModal(false)}>Cancelar</Button>
          <Button variant="secondary" onClick={sendForReview} disabled={sending}>{sending ? 'Enviando...' : 'Enviar'}</Button>
        </div>
      </Modal>

      {/* Import modal */}
      <Modal open={importModal} onClose={() => setImportModal(false)} title="Importar de Arquivo (PDF/Word)">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Carregue um arquivo PDF ou Word do plano de ensino. O sistema tentará identificar as seções automaticamente.
            Você também pode colar o conteúdo diretamente abaixo.
          </p>
          <div>
            <label className="block">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors cursor-pointer">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Clique para selecionar um arquivo</p>
                <p className="text-xs text-slate-400 mt-1">PDF, DOCX, TXT</p>
                <input type="file" accept=".pdf,.docx,.txt,.doc" onChange={handleFileUpload} className="hidden" />
              </div>
            </label>
          </div>
          <div>
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Ou cole o conteúdo do plano aqui..."
              rows={8}
            />
          </div>
          {importError && <p className="text-xs text-red-600">{importError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setImportModal(false)}>Cancelar</Button>
            <Button onClick={parseImportedText} disabled={!importText.trim()}>Importar conteúdo</Button>
          </div>
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
