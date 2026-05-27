import { useState } from 'react';
import { ChevronDown, ChevronRight, FolderKanban, Layout, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useProjectStore } from '../../stores/useProjectStore';
import { useBoardStore } from '../../stores/useBoardStore';
import { useUIStore } from '../../stores/useUIStore';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { ThemeToggle } from '../theme/ThemeToggle';
import { ProjectDialog } from '../dialogs/ProjectDialog';
import { BoardDialog } from '../dialogs/BoardDialog';

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, showConfirm } = useUIStore();
  const { projects, boards, selectedProjectId, selectedBoardId, selectProject, selectBoard, createProject, updateProject, deleteProject, createBoard, updateBoard, deleteBoard } = useProjectStore();
  const { loadBoard } = useBoardStore();

  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [projectDialog, setProjectDialog] = useState<{ open: boolean; projectId?: string } | null>(null);
  const [boardDialog, setBoardDialog] = useState<{ open: boolean; projectId: string; boardId?: string } | null>(null);

  const toggleProject = async (id: string) => {
    const next = new Set(expandedProjects);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      await selectProject(id);
    }
    setExpandedProjects(next);
  };

  const handleSelectBoard = async (projectId: string, boardId: string) => {
    if (selectedProjectId !== projectId) await selectProject(projectId);
    selectBoard(boardId);
    await loadBoard(boardId);
  };

  const handleDeleteProject = (id: string, name: string) => {
    showConfirm({
      title: `Delete project "${name}"?`,
      description: 'This will permanently delete the project and all its boards, columns, and cards.',
      onConfirm: () => deleteProject(id),
    });
  };

  const handleDeleteBoard = (id: string, name: string) => {
    showConfirm({
      title: `Delete board "${name}"?`,
      description: 'This will permanently delete the board and all its columns and cards.',
      onConfirm: () => deleteBoard(id),
    });
  };

  if (sidebarCollapsed) {
    return (
      <aside className="flex flex-col items-center w-12 border-r border-border bg-sidebar py-2 gap-1" aria-label="Sidebar (collapsed)">
        <Tooltip>
          <TooltipTrigger render={<Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Expand sidebar" />}>
            <PanelLeftOpen className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent side="right">Expand sidebar</TooltipContent>
        </Tooltip>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col w-60 border-r border-border bg-sidebar shrink-0" aria-label="Sidebar">
      <div className="flex items-center justify-between px-3 py-2 h-12">
        <span className="font-semibold text-sm text-sidebar-foreground flex items-center gap-2">
          <FolderKanban className="h-4 w-4" aria-hidden />
          Kanban
        </span>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Collapse sidebar">
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1 py-2">
        <nav aria-label="Projects and boards">
          <div className="px-2 mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
              Projects
            </span>
            <Tooltip>
              <TooltipTrigger render={<Button variant="ghost" size="icon" className="h-6 w-6" aria-label="New project" onClick={() => setProjectDialog({ open: true })} />}>
                <Plus className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent>New project</TooltipContent>
            </Tooltip>
          </div>

          {projects.map((project) => {
            const isExpanded = expandedProjects.has(project.id);
            const projectBoards = boards[project.id] ?? [];

            return (
              <div key={project.id}>
                <div
                  className={cn(
                    'group flex items-center gap-1 px-2 py-1 rounded-md mx-1 cursor-pointer hover:bg-sidebar-accent',
                    selectedProjectId === project.id && !selectedBoardId && 'bg-sidebar-accent'
                  )}
                >
                  <button
                    className="flex items-center gap-1.5 flex-1 text-left text-sm text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    onClick={() => toggleProject(project.id)}
                    aria-expanded={isExpanded}
                    aria-label={`${project.name}, ${isExpanded ? 'collapse' : 'expand'}`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                    <span className="truncate">{project.name}</span>
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100" aria-label={`Options for ${project.name}`} />}>
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setBoardDialog({ open: true, projectId: project.id })}>
                        <Plus className="mr-2 h-4 w-4" /> New board
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setProjectDialog({ open: true, projectId: project.id })}>
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteProject(project.id, project.name)}
                      >
                        Delete project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {isExpanded && (
                  <ul className="ml-4" role="list" aria-label={`Boards in ${project.name}`}>
                    {projectBoards.map((board) => (
                      <li key={board.id} className="group flex items-center gap-1 px-2 py-1 rounded-md mx-1">
                        <button
                          className={cn(
                            'flex items-center gap-1.5 flex-1 text-left text-sm rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            selectedBoardId === board.id
                              ? 'text-sidebar-primary font-medium'
                              : 'text-sidebar-foreground hover:text-sidebar-primary'
                          )}
                          onClick={() => handleSelectBoard(project.id, board.id)}
                          aria-current={selectedBoardId === board.id ? 'page' : undefined}
                        >
                          <Layout className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="truncate">{board.name}</span>
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100" aria-label={`Options for ${board.name}`} />}>
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setBoardDialog({ open: true, projectId: project.id, boardId: board.id })}>
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteBoard(board.id, board.name)}
                            >
                              Delete board
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </li>
                    ))}

                    <li>
                      <button
                        className="flex items-center gap-1.5 w-full px-2 py-1 text-sm text-muted-foreground hover:text-sidebar-foreground rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => setBoardDialog({ open: true, projectId: project.id })}
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                        New board
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            );
          })}

          {projects.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              No projects yet. Create one to get started.
            </p>
          )}
        </nav>
      </ScrollArea>

      <Separator />
      <div className="flex items-center justify-end px-2 py-2">
        <ThemeToggle />
      </div>

      {/* Project dialog */}
      {projectDialog?.open && (
        <ProjectDialog
          open
          title={projectDialog.projectId ? 'Rename project' : 'New project'}
          initial={
            projectDialog.projectId
              ? (() => {
                  const p = projects.find((p) => p.id === projectDialog.projectId);
                  return p ? { name: p.name, description: p.description } : undefined;
                })()
              : undefined
          }
          onClose={() => setProjectDialog(null)}
          onSubmit={async (name, description) => {
            if (projectDialog.projectId) {
              await updateProject(projectDialog.projectId, name, description);
            } else {
              await createProject(name, description);
            }
          }}
        />
      )}

      {/* Board dialog */}
      {boardDialog?.open && (
        <BoardDialog
          open
          title={boardDialog.boardId ? 'Rename board' : 'New board'}
          initial={
            boardDialog.boardId
              ? boards[boardDialog.projectId]?.find((b) => b.id === boardDialog.boardId)?.name
              : undefined
          }
          onClose={() => setBoardDialog(null)}
          onSubmit={async (name) => {
            if (boardDialog.boardId) {
              await updateBoard(boardDialog.boardId, name);
            } else {
              await createBoard(boardDialog.projectId, name);
            }
          }}
        />
      )}
    </aside>
  );
}
