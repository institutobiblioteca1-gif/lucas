import { Settings, Info, Database, Layers } from 'lucide-react';
import { PageHeader } from '@/components/Layout';

export function ConfiguracoesPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader title="Configurações" subtitle="Informações e configurações do sistema" />

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">Sobre o Sistema</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            O Sistema de Gerenciamento de Plano de Ensino permite que a Coordenação monte livremente a estrutura acadêmica
            (cursos, turmas, anos letivos, disciplinas e professores) e vincule esses elementos para gerar planos de ensino.
            Cada plano pertence a uma disciplina específica, vinculada a uma turma, em um ano e semestre determinados, com um professor responsável.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">Estrutura do Sistema</h3>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2"><span className="text-slate-400">1.</span> Cadastre os Cursos</div>
            <div className="flex items-center gap-2"><span className="text-slate-400">2.</span> Crie as Turmas dentro de cada curso</div>
            <div className="flex items-center gap-2"><span className="text-slate-400">3.</span> Defina os Anos Letivos de cada turma</div>
            <div className="flex items-center gap-2"><span className="text-slate-400">4.</span> Cadastre as Disciplinas</div>
            <div className="flex items-center gap-2"><span className="text-slate-400">5.</span> Cadastre os Professores</div>
            <div className="flex items-center gap-2"><span className="text-slate-400">6.</span> Vincule Disciplinas e Professores às Turmas</div>
            <div className="flex items-center gap-2"><span className="text-slate-400">7.</span> O Plano de Ensino é criado automaticamente</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">Status dos Planos</h3>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <div><strong>Rascunho:</strong> Plano criado automaticamente, sem conteúdo preenchido.</div>
            <div><strong>Em elaboração:</strong> Professor está preenchendo o plano.</div>
            <div><strong>Enviado:</strong> Professor enviou para revisão da coordenação.</div>
            <div><strong>Em revisão:</strong> Coordenação está revisando o plano.</div>
            <div><strong>Aprovado:</strong> Plano aprovado pela coordenação.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
