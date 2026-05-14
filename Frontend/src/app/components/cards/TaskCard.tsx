interface TaskCardProps {
  title: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
  completed?: boolean;
  onToggle?: () => void;
}

const priorityConfig = {
  high: {
    dot: 'bg-danger',
    hover: 'hover:bg-red-50/50 dark:hover:bg-red-950/20'
  },
  medium: {
    dot: 'bg-warning',
    hover: 'hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
  },
  low: {
    dot: 'bg-success',
    hover: 'hover:bg-green-50/50 dark:hover:bg-green-950/20'
  },
};

const dueDateColors = (date: string) => {
  if (date === 'Today') return 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400';
  if (date === 'Tomorrow') return 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400';
  return 'bg-muted text-muted-foreground';
};

export function TaskCard({ title, dueDate, priority = 'medium', completed, onToggle }: TaskCardProps) {
  const normalizedPriority = (priority?.toLowerCase() as keyof typeof priorityConfig) || 'medium';
  const config = priorityConfig[normalizedPriority] || priorityConfig.medium;

  return (
    <div className={`flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg transition-colors ${config.hover}`}>
      <button
        onClick={onToggle}
        className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
          completed
            ? 'bg-[#00C4A1] border-[#00C4A1]'
            : 'border-border hover:border-primary'
        }`}
      >
        {completed && (
          <svg
            className="h-2.5 w-2.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${config.dot}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${completed ? 'line-through text-muted-foreground opacity-60' : 'text-foreground'}`}>
          {title}
        </p>
      </div>
      {dueDate && (
        <span className={`text-xs px-2 py-0.5 rounded-md font-medium flex-shrink-0 ${dueDateColors(dueDate)}`}>
          {dueDate}
        </span>
      )}
    </div>
  );
}
