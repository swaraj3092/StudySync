import { motion } from 'motion/react';
import { ChevronRight, FileText, Play, BookOpen, FileIcon } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface SessionCardProps {
  _id: string;
  title: string;
  sourceType: 'youtube' | 'article' | 'pdf';
  subject?: string;
  duration: string;
  notesCount: number;
  favicon?: string;
  onClick?: () => void;
}

const sourceConfig = {
  youtube: { bg: 'bg-red-50 dark:bg-red-950/30', icon: Play, iconColor: 'text-red-600 dark:text-red-400' },
  article: { bg: 'bg-blue-50 dark:bg-blue-950/30', icon: BookOpen, iconColor: 'text-blue-600 dark:text-blue-400' },
  pdf: { bg: 'bg-orange-50 dark:bg-orange-950/30', icon: FileIcon, iconColor: 'text-orange-600 dark:text-orange-400' },
};

export function SessionCard({
  _id,
  title,
  sourceType = 'article',
  subject,
  duration,
  notesCount,
  favicon,
  onClick
}: SessionCardProps) {
  const normalizedType = (sourceType?.toLowerCase() as keyof typeof sourceConfig) || 'article';
  const config = sourceConfig[normalizedType] || sourceConfig.article;
  const SourceIcon = config.icon;

  const onDragStart = (e: React.DragEvent) => {
    const sessionData = {
      id: _id,
      title: title
    };
    e.dataTransfer.setData('application/studysync-session', JSON.stringify(sessionData));
    
    // For dragging to other windows/tabs (Open as PDF)
    const exportUrl = `http://localhost:5000/api/sessions/${_id}/export-pdf`;
    e.dataTransfer.setData('text/uri-list', exportUrl);
    e.dataTransfer.setData('text/plain', `StudySync Session: ${title}\nView PDF: ${exportUrl}`);
    
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <motion.div
      whileHover={{ 
        scale: 1.02, 
        rotateX: -2,
        rotateY: 2,
        y: -5,
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}
      whileTap={{ scale: 0.98 }}
      className="perspective-1000"
    >
      <Card
        draggable
        onDragStart={onDragStart}
        className="group relative p-4 hover:border-primary/60 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all cursor-grab active:cursor-grabbing border-white/5 backdrop-blur-md"
        onClick={onClick}
      >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-l-[12px]" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {favicon ? (
            <img src={favicon} alt="" className="h-8 w-8 rounded" />
          ) : (
            <div className={`h-8 w-8 rounded ${config.bg} flex items-center justify-center`}>
              <SourceIcon className={`h-4 w-4 ${config.iconColor}`} strokeWidth={1.5} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={sourceType}>{sourceType.toUpperCase()}</Badge>
              {subject && <Badge variant="subject" subject={subject}>{subject}</Badge>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <span className="text-sm text-text-secondary font-mono">{duration}</span>
          <div className="flex items-center gap-1 text-text-secondary">
            <FileText className="h-4 w-4" strokeWidth={1.5} />
            <span className="text-sm">{notesCount}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-text-hint" strokeWidth={1.5} />
        </div>
      </div>
    </Card>
  </motion.div>
  );
}
