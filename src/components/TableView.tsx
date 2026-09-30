import React from 'react';
import { 
  Building2, 
  User, 
  Calendar, 
  DollarSign, 
  Edit2, 
  Trash2, 
  ExternalLink 
} from 'lucide-react';
import { CRMTask, TaskStatus, TASK_STATUSES } from '../types/crm.ts';

interface TableViewProps {
  tasks: CRMTask[];
  onSelectTask: (task: CRMTask) => void;
  onEditTask: (task: CRMTask) => void;
  onDeleteTask: (id: string) => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  tasks,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  const priorityBadge = {
    Baixa: 'bg-blue-50 text-blue-700 border-blue-200',
    Média: 'bg-amber-50 text-amber-700 border-amber-200',
    Alta: 'bg-orange-50 text-orange-700 border-orange-200',
    Urgente: 'bg-red-50 text-red-700 border-red-200 font-bold',
  };

  const statusBadge = {
    'Não iniciado': 'bg-slate-100 text-slate-700 border-slate-300',
    'Em Andamento': 'bg-amber-100 text-amber-800 border-amber-300',
    'Finalizado': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <p className="text-slate-500 text-sm">Nenhuma tarefa encontrada para exibir na tabela.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3.5 px-4">Tarefa / Oportunidade</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Cliente / Empresa</th>
              <th className="py-3.5 px-4">Valor</th>
              <th className="py-3.5 px-4">Prioridade</th>
              <th className="py-3.5 px-4">Vencimento</th>
              <th className="py-3.5 px-4">Responsável</th>
              <th className="py-3.5 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {tasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="hover:bg-slate-50/80 transition cursor-pointer"
              >
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900 hover:text-blue-600 transition">
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                      {task.description}
                    </div>
                  )}
                </td>
                <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={task.status}
                    onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold focus:outline-none ${statusBadge[task.status]}`}
                  >
                    {TASK_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-medium text-slate-800">
                    {task.client_name || '-'}
                  </div>
                  {task.client_company && (
                    <div className="text-[11px] text-slate-400">
                      {task.client_company}
                    </div>
                  )}
                </td>
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  {task.value > 0 ? formatCurrency(task.value) : '-'}
                </td>
                <td className="py-3.5 px-4">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] border font-medium ${priorityBadge[task.priority] || priorityBadge.Média}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  {task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  {task.assigned_to || '-'}
                </td>
                <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEditTask(task)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Tem certeza de que deseja excluir?')) {
                          onDeleteTask(task.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
