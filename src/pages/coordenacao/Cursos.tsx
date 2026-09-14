import { useEffect, useState } from 'react';
import { GraduationCap, Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Course } from '@/lib/types';
import { PageHeader } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function CursosPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [classCounts, setClassCounts] = useState<Record<string, number>>({});

  useEffect(() => { loadCourses(); }, []);

  async function loadCourses() {
    setLoading(true);
    const { data } = await supabase.from('courses').select('*').order('name');
    setCourses(data || []);
    if (data && data.length > 0) {
      const counts: Record<string, number> = {};
      for (const c of data) {
        const { count } = await supabase.from('classes').select('id', { count: 'exact', head: true }).eq('course_id', c.id);
        counts[c.id] = count || 0;
      }
      setClassCounts(counts);
    }
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ name: '', code: '', description: '' });
    setModalOpen(true);
  }

  function openEdit(c: Course) {
    setEditing(c);
    setForm({ name: c.name, code: c.code, description: c.description });
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim() || !form.code.trim()) return;
    setSaving(true);
    if (editing) {
      await supabase.from('courses').update(form).eq('id', editing.id);
    } else {
      await supabase.from('courses').insert(form);
    }
    setSaving(false);
    setModalOpen(false);
    loadCourses();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await supabase.from('courses').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    loadCourses();
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Cursos"
        subtitle="Cadastre e gerencie os cursos da instituição"
        action={<Button onClick={openNew}><Plus className="w-4 h-4" /> Novo Curso</Button>}
      />

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <EmptyState
            icon={<GraduationCap className="w-7 h-7" />}
            title="Nenhum curso cadastrado"
            description="Comece cadastrando o primeiro curso da instituição."
            action={<Button onClick={openNew}><Plus className="w-4 h-4" /> Novo Curso</Button>}
          />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900">{c.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Código: {c.code}</p>
              {c.description && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{c.description}</p>}
              <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500">{classCounts[c.id] || 0} turma(s)</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Curso' : 'Novo Curso'}>
        <div className="space-y-4">
          <Input label="Nome do curso *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Teologia" />
          <Input label="Código *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Ex: TEO" />
          <Input label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição opcional" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.name.trim() || !form.code.trim()}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Excluir curso"
        message={`Tem certeza que deseja excluir o curso "${deleteTarget?.name}"? Todas as turmas, vinculações e planos de ensino associados também serão removidos.`}
        confirmLabel="Excluir"
      />
    </div>
  );
}
