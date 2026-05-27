import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, GripVertical } from 'lucide-react';
import { Card } from '../../types';
import { useUIStore } from '../../stores/useUIStore';
import { Badge } from '../ui/badge';
import { getContrastColor, isOverdue, formatDueDate } from '../../lib/colors';
import { cn } from '../../lib/utils';

interface Props {
  card: Card;
  isDragging?: boolean;
}

export function KanbanCard({ card, isDragging = false }: Props) {
  const { openCard } = useUIStore();
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging: isSortableDragging } = useSortable({
    id: card.id,
    data: { type: 'card', card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue = isOverdue(card.dueDate);

  return (
    <li
      ref={setNodeRef}
      style={style}
      role="listitem"
      aria-label={`${card.title}${card.dueDate ? `, due ${formatDueDate(card.dueDate)}` : ''}${card.labels.length ? `, labels: ${card.labels.map((l) => l.name).join(', ')}` : ''}`}
      className={cn(
        'group relative bg-card border border-border rounded-lg p-3 shadow-sm cursor-pointer',
        'hover:border-primary/50 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        (isSortableDragging || isDragging) && 'opacity-50 shadow-lg'
      )}
      tabIndex={0}
      onClick={() => openCard(card.id)}
      onKeyDown={(e) => e.key === 'Enter' && openCard(card.id)}
    >
      {/* Drag handle */}
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-0.5 rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Drag to reorder card"
        aria-roledescription="draggable"
        tabIndex={0}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5" aria-hidden />
      </button>

      {/* Labels */}
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2" aria-hidden>
          {card.labels.map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: label.color, color: getContrastColor(label.color) }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-sm text-card-foreground pr-5 leading-snug">{card.title}</p>

      {/* Due date */}
      {card.dueDate && (
        <div className={cn('flex items-center gap-1 mt-2', overdue ? 'text-destructive' : 'text-muted-foreground')}>
          <CalendarDays className="h-3 w-3" aria-hidden />
          <span className="text-xs">{formatDueDate(card.dueDate)}</span>
          {overdue && <Badge variant="destructive" className="text-xs py-0 px-1 h-4">Overdue</Badge>}
        </div>
      )}
    </li>
  );
}
