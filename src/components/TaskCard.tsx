import React from 'react';
import { 
  GripVertical, 
  Calendar, 
  DollarSign, 
  User, 
  Building2, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  RotateCcw,
  Edit2, 
  Trash2, 
  Tag 
} from 'lucide-react';
import { CRMTask, TaskStatus } from '../types/crm.ts';

interface TaskCardProps {
  task: CRMTask;
  onSelect: (task: CRMTask) => void;
  onEdit: (task: CRMTask) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  onDragStart,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  const priorityStyles = {
    Baixa: 'bg-blue-50 text-blue-700 border-blue-200/80',
    Média: 'bg-amber-50 text-amber-700 border-amber-200/80',
    Alta: 'bg-orange-50 text-orange-700 border-orange-200/80',
    Urgente: 'bg-rose-50 text-rose-700 border-rose-200/80 font-bold',
  };

  const isOverdue = task.due_date && new Date(task.due_date + 'T23:59:59') < new Date() && task.status !== 'Finalizado';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onSelect(task)}
      className="group relative bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-150 p-4 cursor-pointer select-none"
    >
      {/* Top row: Priority & Quick Actions */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="text-slate-300 group-hover:text-slate-400 -ml-1 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4" />
          </div>
          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border font-semibold ${priorityStyles[task.priority] || priorityStyles.Média}`}>
            {task.priority}
          </span>
        </div>

        {/* Action icons on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(task)}
            title="Editar Tarefa"
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirm('Deseja excluir esta tarefa?')) {
                onDelete(task.id);
              }
            }}
            title="Excluir Tarefa"
            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Title */}
      <h3 className={`text-sm font-semibold text-slate-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors ${task.status === 'Finalizado' ? 'line-through text-slate-400' : ''}`}>
        {task.title}
      </h3>

      {/* Client / Company */}
      {(task.client_name || task.client_company) && (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2.5 truncate">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-700 truncate">
            {task.client_name || task.client_company}
          </span>
          {task.client_name && task.client_company && (
            <span className="text-slate-400 text-[11px] truncate">({task.client_company})</span>
          )}
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[10px] px-1 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Middle: Value & Due Date */}
      <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100 gap-2">
        {task.value > 0 ? (
          <span className="font-bold text-slate-900 flex items-center gap-0.5">
            {formatCurrency(task.value)}
          </span>
        ) : (
          <span className="text-slate-400 text-[11px] italic">Sem valor</span>
        )}

        {task.due_date && (
          <span
            className={`flex items-center gap-1 text-[11px] font-medium ${
              isOverdue
                ? 'text-rose-600 font-semibold'
                : 'text-slate-500'
            }`}
          >
            <Calendar className="w-3 h-3" />
            {new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
            })}
          </span>
        )}
      </div>

      {/* Footer: Assigned Person & Quick Status Transition */}
      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-xs" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5 text-slate-500">
          <User className="w-3 h-3 text-slate-400" />
          <span className="text-[11px] truncate max-w-[90px]">
            {task.assigned_to || 'Geral'}
          </span>
        </div>

        {/* Quick status mover buttons */}
        <div className="flex items-center gap-1">
          {task.status === 'Não iniciado' && (
            <button
              onClick={() => onStatusChange(task.id, 'Em Andamento')}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 flex items-center gap-1 transition"
              title="Avançar para Em Andamento"
            >
              Iniciar <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {task.status === 'Em Andamento' && (
            <>
              <button
                onClick={() => onStatusChange(task.id, 'Não iniciado')}
                className="p-1 rounded text-slate-500 hover:bg-slate-100 transition"
                title="Voltar para Não iniciado"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() => onStatusChange(task.id, 'Finalizado')}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 transition"
                title="Concluir tarefa"
              >
                Concluir <Check className="w-3 h-3" />
              </button>
            </>
          )}

          {task.status === 'Finalizado' && (
            <button
              onClick={() => onStatusChange(task.id, 'Em Andamento')}
              className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center gap-1 transition"
              title="Reabrir tarefa"
            >
              <RotateCcw className="w-3 h-3" /> Reabrir
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
