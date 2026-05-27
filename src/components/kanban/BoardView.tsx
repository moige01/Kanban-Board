import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Card, Column } from '../../types';
import { useBoardStore } from '../../stores/useBoardStore';
import { useProjectStore } from '../../stores/useProjectStore';
import * as api from '../../api';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { CardDrawer } from './CardDrawer';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

function calcPosition(items: { id: string; position: number }[], overId: string, activeId: string): number {
  const filtered = items.filter((i) => i.id !== activeId).sort((a, b) => a.position - b.position);
  const idx = filtered.findIndex((i) => i.id === overId);
  if (idx === -1) return filtered.length > 0 ? filtered[filtered.length - 1].position + 1 : 1.0;
  if (idx === 0) return filtered[0].position / 2;
  if (idx >= filtered.length - 1) return filtered[filtered.length - 1].position + 1;
  return (filtered[idx - 1].position + filtered[idx].position) / 2;
}

export function BoardView() {
  const { selectedBoardId, selectedProjectId, boards } = useProjectStore();
  const { columns, cards, setColumns, moveCardOptimistic, createColumn } = useBoardStore();

  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  const board = selectedProjectId && selectedBoardId
    ? boards[selectedProjectId]?.find((b) => b.id === selectedBoardId)
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columnIds = columns.map((c) => c.id);

  const handleDragStart = (event: DragStartEvent) => {
    const { type, card, column } = event.active.data.current ?? {};
    if (type === 'card') setActiveCard(card);
    if (type === 'column') setActiveColumn(column);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type;
    if (activeType !== 'card') return;

    const activeCard = active.data.current?.card as Card;
    const overType = over.data.current?.type;

    const fromColumnId = activeCard.columnId;
    const toColumnId = overType === 'column'
      ? (over.data.current?.column as Column).id
      : (over.data.current?.card as Card)?.columnId ?? over.id as string;

    if (fromColumnId === toColumnId) return;

    const fromCards = [...(cards[fromColumnId] ?? [])];
    const toCards = [...(cards[toColumnId] ?? [])];
    const cardIdx = fromCards.findIndex((c) => c.id === activeCard.id);
    if (cardIdx === -1) return;

    const [movedCard] = fromCards.splice(cardIdx, 1);
    const overIdx = toCards.findIndex((c) => c.id === over.id);
    const insertIdx = overIdx === -1 ? toCards.length : overIdx;
    toCards.splice(insertIdx, 0, { ...movedCard, columnId: toColumnId });

    moveCardOptimistic(activeCard.id, fromColumnId, toColumnId, {
      ...cards,
      [fromColumnId]: fromCards,
      [toColumnId]: toCards,
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    setActiveColumn(null);
    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type;

    if (activeType === 'column') {
      const oldIdx = columns.findIndex((c) => c.id === active.id);
      const newIdx = columns.findIndex((c) => c.id === over.id);
      if (oldIdx === newIdx) return;
      const reordered = arrayMove(columns, oldIdx, newIdx);
      setColumns(reordered);
      const newPos = calcPosition(columns, over.id as string, active.id as string);
      await api.moveColumn(active.id as string, newPos);
      return;
    }

    if (activeType === 'card') {
      const card = active.data.current?.card as Card;
      const overType = over.data.current?.type;
      const toColumnId = overType === 'column'
        ? (over.data.current?.column as Column).id
        : (over.data.current?.card as Card)?.columnId ?? card.columnId;

      const toCards = cards[toColumnId] ?? [];
      const newPos = overType === 'column'
        ? (toCards.length > 0 ? toCards[toCards.length - 1].position + 1 : 1.0)
        : calcPosition(toCards, over.id as string, card.id);

      await api.moveCard(card.id, toColumnId, newPos);
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim() || !selectedBoardId) return;
    await createColumn(selectedBoardId, newColumnName.trim());
    setNewColumnName('');
    setIsAddingColumn(false);
  };

  if (!board) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Select a board from the sidebar to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Board header */}
      <header className="px-6 py-4 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold text-foreground">{board.name}</h1>
      </header>

      {/* Board canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          accessibility={{
            announcements: {
              onDragStart: ({ active: a }) => `Picked up ${a.data.current?.type} "${a.data.current?.card?.title ?? a.data.current?.column?.name}".`,
              onDragOver: ({ over }) => over ? `Moving over "${over.data.current?.card?.title ?? over.data.current?.column?.name}".` : '',
              onDragEnd: ({ active: a, over }) => over ? `Dropped "${a.data.current?.card?.title ?? a.data.current?.column?.name}".` : `Cancelled.`,
              onDragCancel: () => 'Drag cancelled.',
            },
          }}
        >
          <div className="flex gap-4 h-full items-start" role="list" aria-label="Kanban columns">
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  cards={(cards[column.id] ?? []).sort((a, b) => a.position - b.position)}
                />
              ))}
            </SortableContext>

            {/* Add column */}
            <div className="shrink-0">
              {isAddingColumn ? (
                <div className="w-72 space-y-2 bg-muted/50 border border-border rounded-xl p-3">
                  <Input
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="Column name…"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddColumn();
                      if (e.key === 'Escape') { setIsAddingColumn(false); setNewColumnName(''); }
                    }}
                    autoFocus
                    aria-label="New column name"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddColumn} disabled={!newColumnName.trim()}>
                      Add column
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setIsAddingColumn(false); setNewColumnName(''); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-72 justify-start text-muted-foreground border-dashed"
                  onClick={() => setIsAddingColumn(true)}
                >
                  <Plus className="h-4 w-4 mr-2" aria-hidden />
                  Add column
                </Button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeCard && (
              <div className="rotate-2 shadow-xl">
                <KanbanCard card={activeCard} isDragging />
              </div>
            )}
            {activeColumn && (
              <div className="opacity-90 shadow-xl">
                <KanbanColumn column={activeColumn} cards={cards[activeColumn.id] ?? []} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <CardDrawer />
    </div>
  );
}
