import React from 'react';
import { CRMTask, TaskStatus, TASK_STATUSES } from '../types/crm.ts';
import { KanbanColumn } from './KanbanColumn.tsx';

interface KanbanBoardProps {
  tasks: CRMTask[];
  onSelectTask: (task: CRMTask) => void;
  onEditTask: (task: CRMTask) => void;
  onDeleteTask: (id: string) => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onAddTask: (status?: TaskStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onAddTask,
}) => {
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropTask = (taskId: string, targetStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== targetStatus) {
      onStatusChange(taskId, targetStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
      {TASK_STATUSES.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        return (
          <KanbanColumn
            key={status}
            status={status}
            tasks={columnTasks}
            onSelectTask={onSelectTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onStatusChange={onStatusChange}
            onAddTask={(st) => onAddTask(st)}
            onDragStart={handleDragStart}
            onDropTask={handleDropTask}
          />
        );
      })}
    </div>
  );
};
