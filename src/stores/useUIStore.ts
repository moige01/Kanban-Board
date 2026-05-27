import { create } from 'zustand';

interface ConfirmOptions {
  title: string;
  description: string;
  onConfirm: () => void;
}

interface UIStore {
  sidebarCollapsed: boolean;
  openCardId: string | null;
  confirm: ConfirmOptions | null;

  toggleSidebar: () => void;
  openCard: (id: string) => void;
  closeCard: () => void;
  showConfirm: (opts: ConfirmOptions) => void;
  closeConfirm: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  openCardId: null,
  confirm: null,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openCard: (id) => set({ openCardId: id }),
  closeCard: () => set({ openCardId: null }),
  showConfirm: (opts) => set({ confirm: opts }),
  closeConfirm: () => set({ confirm: null }),
}));
