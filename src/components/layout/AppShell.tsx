import { Sidebar } from './Sidebar';
import { BoardView } from '../kanban/BoardView';
import { ConfirmDialog } from '../dialogs/ConfirmDialog';
import { useProjectStore } from '../../stores/useProjectStore';

export function AppShell() {
  const { selectedBoardId } = useProjectStore();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col" id="main-content">
        {selectedBoardId ? (
          <BoardView />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
            <p className="text-2xl font-semibold text-foreground">Welcome to Kanban</p>
            <p className="text-muted-foreground max-w-sm">
              Create a project and a board from the sidebar to get started.
            </p>
          </div>
        )}
      </main>
      <ConfirmDialog />
    </div>
  );
}
