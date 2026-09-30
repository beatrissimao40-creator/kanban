import React from 'react';
import { 
  Kanban, 
  CircleDot, 
  PlayCircle, 
  CheckCircle2, 
  DollarSign, 
  TrendingUp 
} from 'lucide-react';
import { CRMTask } from '../types/crm.ts';

interface MetricsBarProps {
  tasks: CRMTask[];
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ tasks }) => {
  const total = tasks.length;
  const naoIniciadas = tasks.filter((t) => t.status === 'Não iniciado');
  const emAndamento = tasks.filter((t) => t.status === 'Em Andamento');
  const finalizadas = tasks.filter((t) => t.status === 'Finalizado');

  const totalValue = tasks.reduce((sum, t) => sum + (t.value || 0), 0);
  const finalizadoValue = finalizadas.reduce((sum, t) => sum + (t.value || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const completionRate = total > 0 ? Math.round((finalizadas.length / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {/* Total Tarefas */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
            Total de Tarefas
          </span>
          <span className="text-xl font-bold text-slate-900 mt-0.5 block">
            {total}
          </span>
        </div>
        <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
          <Kanban className="w-4 h-4" />
        </div>
      </div>

      {/* Não Iniciado */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
            Não iniciado
          </span>
          <span className="text-xl font-bold text-slate-800 mt-0.5 block">
            {naoIniciadas.length}
          </span>
        </div>
        <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
          <CircleDot className="w-4 h-4" />
        </div>
      </div>

      {/* Em Andamento */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 block">
            Em Andamento
          </span>
          <span className="text-xl font-bold text-amber-700 mt-0.5 block">
            {emAndamento.length}
          </span>
        </div>
        <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
          <PlayCircle className="w-4 h-4" />
        </div>
      </div>

      {/* Finalizado */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
              Finalizado
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">
              {completionRate}%
            </span>
          </div>
          <span className="text-xl font-bold text-emerald-700 mt-0.5 block">
            {finalizadas.length}
          </span>
        </div>
        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      </div>

      {/* Valor do Pipeline */}
      <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block">
            Valor em Negociação
          </span>
          <span className="text-xl font-bold text-slate-900 mt-0.5 block">
            {formatCurrency(totalValue)}
          </span>
        </div>
        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <DollarSign className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
