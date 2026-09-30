import React, { useState } from 'react';
import { Plus, CircleDot, PlayCircle, CheckCircle2 } from 'lucide-react';
import { CRMTask, TaskStatus } from '../types/crm.ts';
import { TaskCard } from './TaskCard.tsx';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: CRMTask[];
  onSelectTask: (task: CRMTask) => void;
  onEditTask: (task: CRMTask) => void;
  onDeleteTask: (id: string) => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onAddTask: (status: TaskStatus) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDropTask: (taskId: string, targetStatus: TaskStatus) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  tasks,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onAddTask,
  onDragStart,
  onDropTask,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const columnConfig = {
    'Não iniciado': {
      title: 'Não iniciado',
      icon: CircleDot,
      headerBg: 'bg-slate-100',
      badgeBg: 'bg-slate-200 text-slate-800',
      accentColor: 'border-t-slate-400',
      emptyText: 'Nenhuma tarefa aguardando início',
    },
    'Em Andamento': {
      title: 'Em Andamento',
      icon: PlayCircle,
      headerBg: 'bg-amber-50/80',
      badgeBg: 'bg-amber-200 text-amber-900',
      accentColor: 'border-t-amber-500',
      emptyText: 'Nenhuma tarefa em execução no momento',
    },
    'Finalizado': {
      title: 'Finalizado',
      icon: CheckCircle2,
      headerBg: 'bg-emerald-50/80',
      badgeBg: 'bg-emerald-200 text-emerald-900',
      accentColor: 'border-t-emerald-500',
      emptyText: 'Nenhuma tarefa concluída ainda',
    },
  };

  const config = columnConfig[status];
  const IconComponent = config.icon;

  const totalValue = tasks.reduce((sum, t) => sum + (t.value || 0), 0);
  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(totalValue);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onDropTask(taskId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col flex-1 min-w-[310px] max-w-full bg-slate-50/70 rounded-2xl border-t-4 ${config.accentColor} border-x border-b border-slate-200/80 transition-all duration-150 ${
        isDragOver ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''
      }`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconComponent className="w-4 h-4 text-slate-600" />
          <h2 className="font-bold text-sm text-slate-800">{config.title}</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${config.badgeBg}`}>
            {tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {totalValue > 0 && (
            <span className="text-xs font-semibold text-slate-600">
              {formattedTotal}
            </span>
          )}
          <button
            onClick={() => onAddTask(status)}
            title={`Adicionar tarefa em ${status}`}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="p-3 flex-1 flex flex-col gap-3 overflow-y-auto min-h-[300px] max-h-[calc(100vh-270px)]">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onSelect={onSelectTask}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onStatusChange={onStatusChange}
            onDragStart={onDragStart}
          />
        ))}

        {tasks.length === 0 && (
          <div
            onClick={() => onAddTask(status)}
            className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl text-center cursor-pointer hover:border-slate-300 hover:bg-white/60 transition group min-h-[140px]"
          >
            <p className="text-xs text-slate-400 group-hover:text-slate-600 font-medium mb-2">
              {config.emptyText}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:text-blue-700">
              <Plus className="w-3.5 h-3.5" /> Criar tarefa aqui
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
