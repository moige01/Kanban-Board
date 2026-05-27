import { useState } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreHorizontal, Plus } from 'lucide-react';
import { Column, Card } from '../../types';
import { useBoardStore } from '../../stores/useBoardStore';
import { useUIStore } from '../../stores/useUIStore';
import { KanbanCard } from './KanbanCard';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';

interface Props {
  column: Column;
  cards: Card[];
}

export function KanbanColumn({ column, cards }: Props) {
  const { updateColumn, deleteColumn, createCard } = useBoardStore();
  const { showConfirm } = useUIStore();

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(column.name);

  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'column', column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cardIds = cards.map((c) => c.id);

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;
    await createCard(column.id, newCardTitle.trim());
    setNewCardTitle('');
    setIsAddingCard(false);
  };

  const handleRename = async () => {
    if (newName.trim() && newName.trim() !== column.name) {
      await updateColumn(column.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleDelete = () => {
    showConfirm({
      title: `Delete column "${column.name}"?`,
      description: `This will permanently delete the column and all ${cards.length} card${cards.length !== 1 ? 's' : ''} it contains.`,
      onConfirm: () => deleteColumn(column.id),
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex flex-col w-72 shrink-0 rounded-xl bg-muted/50 border border-border',
        isDragging && 'opacity-50'
      )}
      aria-label={`Column: ${column.name}, ${cards.length} card${cards.length !== 1 ? 's' : ''}`}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="p-0.5 rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Drag to reorder column"
          aria-roledescription="draggable"
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>

        {isRenaming ? (
          <Input
            className="h-7 text-sm font-medium flex-1"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') { setIsRenaming(false); setNewName(column.name); }
            }}
            autoFocus
          />
        ) : (
          <h2
            className="flex-1 text-sm font-medium text-foreground truncate"
            onDoubleClick={() => setIsRenaming(true)}
          >
            {column.name}
          </h2>
        )}

        <span className="text-xs text-muted-foreground tabular-nums" aria-hidden>
          {cards.length}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" className="h-6 w-6" aria-label={`Options for column ${column.name}`} />}
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setIsRenaming(true); setNewName(column.name); }}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
              Delete column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Card list */}
      <ScrollArea className="flex-1 px-2">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <ul
            role="list"
            aria-label={`Cards in ${column.name}`}
            className="space-y-2 py-1 min-h-[2rem]"
          >
            {cards.map((card) => (
              <KanbanCard key={card.id} card={card} />
            ))}
          </ul>
        </SortableContext>
      </ScrollArea>

      {/* Add card */}
      <div className="px-2 pb-2 pt-1">
        {isAddingCard ? (
          <div className="space-y-2">
            <Input
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Card title…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCard();
                if (e.key === 'Escape') { setIsAddingCard(false); setNewCardTitle(''); }
              }}
              autoFocus
              aria-label="New card title"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddCard} disabled={!newCardTitle.trim()}>
                Add card
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setIsAddingCard(false); setNewCardTitle(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => setIsAddingCard(true)}
          >
            <Plus className="h-4 w-4 mr-1" aria-hidden />
            Add card
          </Button>
        )}
      </div>
    </div>
  );
}
