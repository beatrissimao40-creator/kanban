export type TaskStatus = 'Não iniciado' | 'Em Andamento' | 'Finalizado';

export type TaskPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

export interface CRMTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_company: string;
  value: number;
  priority: TaskPriority;
  due_date: string;
  assigned_to: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface TaskFilter {
  search: string;
  priority: string;
  assigned_to: string;
  tag: string;
}

export const TASK_STATUSES: TaskStatus[] = [
  'Não iniciado',
  'Em Andamento',
  'Finalizado'
];

export const TASK_PRIORITIES: TaskPriority[] = [
  'Baixa',
  'Média',
  'Alta',
  'Urgente'
];
