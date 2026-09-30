import React from 'react';
import { 
  X, 
  Edit3, 
  Trash2, 
  User, 
  Building2, 
  Mail, 
  Phone, 
  DollarSign, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { CRMTask, TaskStatus, TASK_STATUSES } from '../types/crm.ts';

interface TaskDetailModalProps {
  task: CRMTask | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: CRMTask) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  if (!isOpen || !task) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  const cleanPhone = task.client_phone.replace(/\D/g, '');
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone.length <= 11 ? '55' + cleanPhone : cleanPhone}` : null;

  const priorityColors = {
    Baixa: 'bg-blue-50 text-blue-700 border-blue-200',
    Média: 'bg-amber-50 text-amber-700 border-amber-200',
    Alta: 'bg-orange-50 text-orange-700 border-orange-200',
    Urgente: 'bg-red-50 text-red-700 border-red-200',
  };

  const statusColors = {
    'Não iniciado': 'bg-slate-100 text-slate-700 border-slate-200',
    'Em Andamento': 'bg-amber-100 text-amber-800 border-amber-300',
    'Finalizado': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div className="space-y-1.5 flex-1 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[task.status]}`}>
                {task.status}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${priorityColors[task.priority] || priorityColors.Média}`}>
                Prioridade: {task.priority}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Status Quick Switcher */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider block mb-2">
              Mudar Status da Tarefa
            </span>
            <div className="grid grid-cols-3 gap-2">
              {TASK_STATUSES.map((st) => (
                <button
                  key={st}
                  onClick={() => onStatusChange(task.id, st)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition border text-center ${
                    task.status === st
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics (Value, Due Date, Assigned) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Valor da Oportunidade
              </span>
              <p className="text-base font-bold text-slate-900">
                {formatCurrency(task.value)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Data de Vencimento
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não definido'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Responsável
              </span>
              <p className="text-sm font-semibold text-slate-800 truncate">
                {task.assigned_to || 'Não atribuído'}
              </p>
            </div>
          </div>

          {/* Client Details */}
          {(task.client_name || task.client_company || task.client_email || task.client_phone) && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Contato &amp; Empresa
              </h3>
              <div className="p-4 rounded-xl border border-slate-200 space-y-2.5 bg-white">
                {task.client_name && (
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{task.client_name}</span>
                  </div>
                )}
                {task.client_company && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>{task.client_company}</span>
                  </div>
                )}
                {task.client_email && (
                  <div className="flex items-center justify-between text-slate-700">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{task.client_email}</span>
                    </div>
                    <a
                      href={`mailto:${task.client_email}`}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      Enviar e-mail
                    </a>
                  </div>
                )}
                {task.client_phone && (
                  <div className="flex items-center justify-between text-slate-700">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{task.client_phone}</span>
                    </div>
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium hover:underline flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chamar no WhatsApp
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {task.description && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Descrição &amp; Anotações
              </h3>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 whitespace-pre-wrap leading-relaxed text-sm">
                {task.description}
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Criado em: {new Date(task.created_at).toLocaleString('pt-BR')}</span>
            <span>Atualizado: {new Date(task.updated_at).toLocaleString('pt-BR')}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('Tem certeza de que deseja excluir esta tarefa?')) {
                onDelete(task.id);
                onClose();
              }
            }}
            className="px-3.5 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir Tarefa
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editar Dados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
