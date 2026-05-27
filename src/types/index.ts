export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  position: number;
  createdAt: string;
  deletedAt: string | null;
}

export interface Card {
  id: string;
  columnId: string;
  title: string;
  description: string;
  dueDate: string | null;
  position: number;
  createdAt: string;
  deletedAt: string | null;
  labels: Label[];
}

export interface Label {
  id: string;
  projectId: string;
  name: string;
  color: string;
  createdAt: string;
}

export type Theme = 'dark' | 'light' | 'system';
