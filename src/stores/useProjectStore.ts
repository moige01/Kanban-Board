import { create } from 'zustand';
import * as api from '../api';
import { Board, Label, Project } from '../types';

interface ProjectStore {
  projects: Project[];
  boards: Record<string, Board[]>;
  labels: Record<string, Label[]>;
  selectedProjectId: string | null;
  selectedBoardId: string | null;
  isLoading: boolean;

  init: () => Promise<void>;
  selectProject: (id: string) => Promise<void>;
  selectBoard: (id: string) => void;
  createProject: (name: string, description: string) => Promise<void>;
  updateProject: (id: string, name: string, description: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  createBoard: (projectId: string, name: string) => Promise<void>;
  updateBoard: (id: string, name: string) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  createLabel: (projectId: string, name: string, color: string) => Promise<void>;
  deleteLabel: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  boards: {},
  labels: {},
  selectedProjectId: null,
  selectedBoardId: null,
  isLoading: false,

  init: async () => {
    set({ isLoading: true });
    const projects = await api.listProjects();
    set({ projects, isLoading: false });
  },

  selectProject: async (id) => {
    set({ selectedProjectId: id, selectedBoardId: null });
    const [boards, labels] = await Promise.all([
      api.listBoards(id),
      api.listLabels(id),
    ]);
    set((s) => ({
      boards: { ...s.boards, [id]: boards },
      labels: { ...s.labels, [id]: labels },
    }));
  },

  selectBoard: (id) => set({ selectedBoardId: id }),

  createProject: async (name, description) => {
    const project = await api.createProject(name, description);
    set((s) => ({ projects: [...s.projects, project] }));
  },

  updateProject: async (id, name, description) => {
    const updated = await api.updateProject(id, name, description);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? updated : p)),
    }));
  },

  deleteProject: async (id) => {
    await api.deleteProject(id);
    set((s) => {
      const projects = s.projects.filter((p) => p.id !== id);
      const boards = { ...s.boards };
      delete boards[id];
      // TODO: also clear labels[id] from state
      return {
        projects,
        boards,
        selectedProjectId: s.selectedProjectId === id ? null : s.selectedProjectId,
        selectedBoardId: s.selectedProjectId === id ? null : s.selectedBoardId,
      };
    });
  },

  createBoard: async (projectId, name) => {
    const board = await api.createBoard({ projectId, name });
    set((s) => ({
      boards: {
        ...s.boards,
        [projectId]: [...(s.boards[projectId] ?? []), board],
      },
    }));
  },

  updateBoard: async (id, name) => {
    const updated = await api.updateBoard(id, name);
    set((s) => {
      const projectId = updated.projectId;
      return {
        boards: {
          ...s.boards,
          [projectId]: (s.boards[projectId] ?? []).map((b) =>
            b.id === id ? updated : b
          ),
        },
      };
    });
  },

  deleteBoard: async (id) => {
    await api.deleteBoard(id);
    set((s) => {
      const newBoards = { ...s.boards };
      for (const pid in newBoards) {
        newBoards[pid] = newBoards[pid].filter((b) => b.id !== id);
      }
      return {
        boards: newBoards,
        selectedBoardId: s.selectedBoardId === id ? null : s.selectedBoardId,
      };
    });
  },

  createLabel: async (projectId, name, color) => {
    const label = await api.createLabel({ projectId, name, color });
    set((s) => ({
      labels: {
        ...s.labels,
        [projectId]: [...(s.labels[projectId] ?? []), label],
      },
    }));
  },

  deleteLabel: async (id) => {
    await api.deleteLabel(id);
    set((s) => {
      // TODO: reading get() inside set() can cause a stale-closure race; derive
      // projectId by searching s.labels instead.
      const { selectedProjectId } = get();
      if (!selectedProjectId) return s;
      return {
        labels: {
          ...s.labels,
          [selectedProjectId]: (s.labels[selectedProjectId] ?? []).filter(
            (l) => l.id !== id
          ),
        },
      };
    });
  },
}));
