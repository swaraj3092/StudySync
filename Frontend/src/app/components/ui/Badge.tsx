import { HTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'youtube' | 'article' | 'pdf' | 'subject';
  subject?: string;
}

const subjectColors: Record<string, string> = {
  ML: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  AI: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  DBMS: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  OS: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  DSA: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
  Math: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
  Physics: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
};

export function Badge({ variant = 'default', subject, className, children, ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium';

  const variants = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-success-bg text-success dark:bg-success/20 dark:text-success',
    warning: 'bg-warning-bg text-warning dark:bg-warning/20 dark:text-warning',
    danger: 'bg-danger-bg text-danger dark:bg-danger/20 dark:text-danger',
    info: 'bg-info-bg text-info dark:bg-info/20 dark:text-info',
    youtube: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
    article: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    pdf: 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400',
    subject: subject && subjectColors[subject] ? subjectColors[subject] : 'bg-muted text-muted-foreground',
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
