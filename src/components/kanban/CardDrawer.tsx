import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { useUIStore } from '../../stores/useUIStore';
import { useBoardStore } from '../../stores/useBoardStore';
import { useProjectStore } from '../../stores/useProjectStore';
import { getContrastColor } from '../../lib/colors';
import { cn } from '../../lib/utils';

export function CardDrawer() {
  const { openCardId, closeCard, showConfirm } = useUIStore();
  const { columns, cards, updateCard, deleteCard, setCardLabels } = useBoardStore();
  const { selectedProjectId, labels } = useProjectStore();

  const card = openCardId
    ? Object.values(cards).flat().find((c) => c.id === openCardId)
    : null;
  const columnId = card
    ? Object.entries(cards).find(([, cs]) => cs.some((c) => c.id === card.id))?.[0]
    : null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description);
      setDueDate(card.dueDate ? card.dueDate.split('T')[0] : '');
      setTab('edit');
    }
  }, [card?.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!openCardId) return;
      if (e.key === 'Escape') closeCard();
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSave(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openCardId, title, description, dueDate]);

  const handleSave = async (close = false) => {
    if (!card || !columnId) return;
    // TODO: skip the API call when nothing actually changed (compare title,
    // description, dueDate against the original card values).
    setSaving(true);
    await updateCard(card.id, columnId, {
      title: title.trim() || card.title,
      description,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    });
    setSaving(false);
    if (close) closeCard();
  };

  const handleDelete = () => {
    if (!card || !columnId) return;
    showConfirm({
      title: `Delete "${card.title}"?`,
      description: 'This will permanently delete the card.',
      onConfirm: async () => {
        closeCard();
        await deleteCard(card.id, columnId);
      },
    });
  };

  const toggleLabel = async (labelId: string) => {
    if (!card || !columnId) return;
    const current = card.labels.map((l) => l.id);
    const next = current.includes(labelId)
      ? current.filter((id) => id !== labelId)
      : [...current, labelId];
    await setCardLabels(card.id, columnId, next);
  };

  const projectLabels = selectedProjectId ? (labels[selectedProjectId] ?? []) : [];

  return (
    <Sheet open={!!openCardId} onOpenChange={(open) => !open && closeCard()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col gap-0 p-0"
        aria-label="Card detail"
      >
        {card && (
          <>
            <SheetHeader className="px-6 pt-6 pb-4">
              <div className="flex items-start gap-2">
                <SheetTitle className="flex-1 sr-only">Edit card</SheetTitle>
                <Input
                  ref={titleRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-base font-semibold border-none shadow-none px-0 focus-visible:ring-0 flex-1 bg-transparent"
                  aria-label="Card title"
                  onBlur={handleSave}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {columns.find((c) => c.id === columnId)?.name ?? ''}
              </p>
            </SheetHeader>

            <Separator />

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <div
                    className="flex border border-border rounded-md overflow-hidden text-xs"
                    role="tablist"
                    aria-label="Description editor mode"
                  >
                    <button
                      role="tab"
                      aria-selected={tab === 'edit'}
                      className={cn(
                        'px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                        tab === 'edit' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                      )}
                      onClick={() => setTab('edit')}
                    >
                      Edit
                    </button>
                    <button
                      role="tab"
                      aria-selected={tab === 'preview'}
                      className={cn(
                        'px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                        tab === 'preview' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                      )}
                      onClick={() => setTab('preview')}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {tab === 'edit' ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description using Markdown…"
                    rows={8}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
                    aria-label="Card description (Markdown)"
                  />
                ) : (
                  <div
                    className="min-h-[8rem] rounded-md border border-border bg-muted/30 px-3 py-2 text-sm prose prose-sm dark:prose-invert max-w-none"
                    aria-label="Description preview"
                  >
                    {description ? (
                      <ReactMarkdown>{description}</ReactMarkdown>
                    ) : (
                      <span className="text-muted-foreground italic">Nothing to preview</span>
                    )}
                  </div>
                )}
              </div>

              {/* Due date */}
              <div className="space-y-2">
                <Label htmlFor="due-date" className="flex items-center gap-1.5 text-sm font-medium">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  Due date
                </Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-48"
                  aria-label="Due date"
                />
                {dueDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground"
                    onClick={() => setDueDate('')}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Labels */}
              {projectLabels.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Labels</Label>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Select labels">
                    {projectLabels.map((label) => {
                      const selected = card.labels.some((l) => l.id === label.id);
                      return (
                        <button
                          key={label.id}
                          onClick={() => toggleLabel(label.id)}
                          aria-pressed={selected}
                          aria-label={`${label.name} label, ${selected ? 'selected' : 'not selected'}`}
                          className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            !selected && 'opacity-40 hover:opacity-70'
                          )}
                          style={{ backgroundColor: label.color, color: getContrastColor(label.color) }}
                        >
                          {label.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="px-6 py-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                aria-label="Delete card"
              >
                <Trash2 className="h-4 w-4 mr-1.5" aria-hidden />
                Delete card
              </Button>

              <Button size="sm" className="cursor-pointer" onClick={() => handleSave(true)} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
                <kbd className="ml-2 text-xs opacity-60">⌘↵</kbd>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
