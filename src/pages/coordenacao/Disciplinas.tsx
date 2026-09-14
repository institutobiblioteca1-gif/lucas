import { useEffect, useState } from 'react';
import { BookMarked, Plus, Pencil, Trash2, Search, Clock, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Discipline } from '@/lib/types';
import { PageHeader } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function DisciplinasPage() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Discipline | null>(null);
  const [form, setForm] = useState({ code: '', name: '', workload_hours: 0, credits: 0, description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Discipline | null>(null);

  useEffect(() => { loadDisciplines(); }, []);

  async function loadDisciplines() {
    setLoading(true);
    const { data } = await supabase.from('disciplines').select('*').order('name');
    setDisciplines(data || []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ code: '', name: '', workload_hours: 60, credits: 4, description: '' });
    setModalOpen(true);
  }

  function openEdit(d: Discipline) {
    setEditing(d);
    setForm({ code: d.code, name: d.name, workload_hours: d.workload_hours, credits: d.credits, description: d.description });
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim() || !form.code.trim()) return;
    setSaving(true);
    if (editing) {
      await supabase.from('disciplines').update(form).eq('id', editing.id);
    } else {
      await supabase.from('disciplines').insert(form);
    }
    setSaving(false);
    setModalOpen(false);
    loadDisciplines();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await supabase.from('disciplines').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    loadDisciplines();
  }

  const filtered = disciplines.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Disciplinas"
        subtitle="Cadastre as disciplinas disponíveis para vinculação às turmas"
        action={<Button onClick={openNew}><Plus className="w-4 h-4" /> Nova Disciplina</Button>}
      />

      {disciplines.length > 0 && (
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou código..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          />
        </div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
        </div>
      ) : disciplines.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <EmptyState icon={<BookMarked className="w-7 h-7" />} title="Nenhuma disciplina cadastrada" description="Cadastre as disciplinas que poderão ser vinculadas às turmas." action={<Button onClick={openNew}><Plus className="w-4 h-4" /> Nova Disciplina</Button>} />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-5 group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <BookMarked className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteTarget(d)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{d.code}</span>
              </div>
              <h3 className="font-semibold text-slate-900">{d.name}</h3>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600">{d.workload_hours}h</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600">{d.credits} créditos</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Disciplina' : 'Nova Disciplina'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Código *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Ex: TEO001" />
            <Input label="Créditos" type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: parseInt(e.target.value) || 0 })} />
          </div>
          <Input label="Nome *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Patrologia I" />
          <Input label="Carga horária (h)" type="number" value={form.workload_hours} onChange={(e) => setForm({ ...form, workload_hours: parseInt(e.target.value) || 0 })} />
          <Input label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição opcional" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.name.trim() || !form.code.trim()}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete}
        title="Excluir disciplina" message={`Excluir a disciplina "${deleteTarget?.name}"? Se estiver vinculada a alguma turma, a vinculação e os planos associados serão removidos.`} confirmLabel="Excluir" />
    </div>
  );
}
