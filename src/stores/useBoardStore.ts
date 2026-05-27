import { create } from 'zustand';
import * as api from '../api';
import { Card, Column } from '../types';

interface BoardStore {
  columns: Column[];
  cards: Record<string, Card[]>;
  isLoading: boolean;

  loadBoard: (boardId: string) => Promise<void>;
  createColumn: (boardId: string, name: string) => Promise<void>;
  updateColumn: (id: string, name: string) => Promise<void>;
  deleteColumn: (id: string) => Promise<void>;
  setColumns: (columns: Column[]) => void;

  createCard: (columnId: string, title: string) => Promise<void>;
  updateCard: (id: string, columnId: string, updates: Partial<Pick<Card, 'title' | 'description' | 'dueDate'>>) => Promise<void>;
  deleteCard: (id: string, columnId: string) => Promise<void>;
  setCardsForColumn: (columnId: string, cards: Card[]) => void;
  moveCardOptimistic: (cardId: string, fromColumnId: string, toColumnId: string, newCards: Record<string, Card[]>) => void;
  setCardLabels: (cardId: string, columnId: string, labelIds: string[]) => Promise<void>;
  reloadCard: (cardId: string, columnId: string) => Promise<void>;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  columns: [],
  cards: {},
  isLoading: false,

  loadBoard: async (boardId) => {
    set({ isLoading: true, columns: [], cards: {} });
    const columns = await api.listColumns(boardId);
    const cardEntries = await Promise.all(
      columns.map(async (col) => {
        const cards = await api.listCards(col.id);
        return [col.id, cards] as [string, Card[]];
      })
    );
    set({ columns, cards: Object.fromEntries(cardEntries), isLoading: false });
  },

  createColumn: async (boardId, name) => {
    const column = await api.createColumn({ boardId, name });
    set((s) => ({ columns: [...s.columns, column], cards: { ...s.cards, [column.id]: [] } }));
  },

  updateColumn: async (id, name) => {
    const updated = await api.updateColumn(id, name);
    set((s) => ({ columns: s.columns.map((c) => (c.id === id ? updated : c)) }));
  },

  deleteColumn: async (id) => {
    await api.deleteColumn(id);
    set((s) => {
      const cards = { ...s.cards };
      delete cards[id];
      return { columns: s.columns.filter((c) => c.id !== id), cards };
    });
  },

  setColumns: (columns) => set({ columns }),

  createCard: async (columnId, title) => {
    const card = await api.createCard({ columnId, title, description: '' });
    set((s) => ({
      cards: { ...s.cards, [columnId]: [...(s.cards[columnId] ?? []), card] },
    }));
  },

  updateCard: async (id, columnId, updates) => {
    const updated = await api.updateCard(id, updates);
    set((s) => ({
      cards: {
        ...s.cards,
        // TODO: columnId is caller-supplied; if the card was moved between stores
        // updates, this lookup will target the wrong column. Find the card by id
        // across all columns instead.
        [columnId]: (s.cards[columnId] ?? []).map((c) => (c.id === id ? updated : c)),
      },
    }));
  },

  deleteCard: async (id, columnId) => {
    await api.deleteCard(id);
    set((s) => ({
      cards: {
        ...s.cards,
        [columnId]: (s.cards[columnId] ?? []).filter((c) => c.id !== id),
      },
    }));
  },

  setCardsForColumn: (columnId, cards) =>
    set((s) => ({ cards: { ...s.cards, [columnId]: cards } })),

  moveCardOptimistic: (_, __, ___, newCards) =>
    // TODO: on drag-end, if api.moveCard fails, roll back to the pre-drag snapshot.
    // Currently a failed persist leaves the UI out of sync with the DB.
    set({ cards: newCards }),

  setCardLabels: async (cardId, columnId, labelIds) => {
    await api.setCardLabels(cardId, labelIds);
    await get().reloadCard(cardId, columnId);
  },

  reloadCard: async (cardId, columnId) => {
    // TODO: fetches all cards in the column just to refresh one. Add a get_card
    // command on the Rust side and update only the single card here.
    const allCards = await api.listCards(columnId);
    set((s) => ({ cards: { ...s.cards, [columnId]: allCards } }));
    void cardId;
  },
}));
