import { invoke } from '@tauri-apps/api/core';
import { Board, Card, Column, Label, Project, Theme } from '../types';

// TODO: Modularize API functions by resource (projects.ts, boards.ts, etc.)
// TODO: Bette payload typing and validation

export const listProjects = () =>
  invoke<Project[]>('list_projects');

export const createProject = (name: string, description: string) =>
  invoke<Project>('create_project', { payload: { name, description } });

export const updateProject = (id: string, name?: string, description?: string) =>
  invoke<Project>('update_project', { id, payload: { name, description } });

export const deleteProject = (id: string) =>
  invoke<void>('delete_project', { id });

export const listBoards = (projectId: string) =>
  invoke<Board[]>('list_boards', { projectId });

export const createBoard = (payload: { projectId: string; name: string }) =>
  invoke<Board>('create_board', { payload });

export const updateBoard = (id: string, name: string) =>
  invoke<Board>('update_board', { id, name });

export const deleteBoard = (id: string) =>
  invoke<void>('delete_board', { id });

export const listColumns = (boardId: string) =>
  invoke<Column[]>('list_columns', { boardId });

export const createColumn = (payload: { boardId: string; name: string }) =>
  invoke<Column>('create_column', { payload });

export const updateColumn = (id: string, name: string) =>
  invoke<Column>('update_column', { id, name });

export const moveColumn = (id: string, position: number) =>
  invoke<void>('move_column', { id, position });

export const deleteColumn = (id: string) =>
  invoke<void>('delete_column', { id });

export const listCards = (columnId: string) =>
  invoke<Card[]>('list_cards', { columnId });

export const createCard = (payload: { columnId: string; title: string; description: string; dueDate?: string | null }) =>
  invoke<Card>('create_card', { payload });

export const updateCard = (id: string, payload: { title?: string; description?: string; dueDate?: string | null | undefined }) =>
  invoke<Card>('update_card', { id, payload });

export const moveCard = (id: string, columnId: string, position: number) =>
  invoke<void>('move_card', { id, columnId, position });

export const deleteCard = (id: string) =>
  invoke<void>('delete_card', { id });

export const setCardLabels = (cardId: string, labelIds: string[]) =>
  invoke<void>('set_card_labels', { cardId, labelIds });

export const listLabels = (projectId: string) =>
  invoke<Label[]>('list_labels', { projectId });

export const createLabel = (payload: { projectId: string; name: string; color: string }) =>
  invoke<Label>('create_label', { payload });

export const updateLabel = (id: string, payload: { name?: string; color?: string }) =>
  invoke<Label>('update_label', { id, payload });

export const deleteLabel = (id: string) =>
  invoke<void>('delete_label', { id });

// Settings
export const getSetting = (key: string) =>
  invoke<string | null>('get_setting', { key });

export const setSetting = (key: string, value: string) =>
  invoke<void>('set_setting', { key, value });

export const getTheme = async (): Promise<Theme> => {
  const value = await getSetting('theme');
  return (value as Theme) ?? 'dark';
};

export const saveTheme = (theme: Theme) =>
  setSetting('theme', theme);
