import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { useUIStore } from '../../stores/useUIStore';

export function ConfirmDialog() {
  const { confirm, closeConfirm } = useUIStore();

  const handleConfirm = () => {
    confirm?.onConfirm();
    closeConfirm();
  };

  return (
    <Dialog open={!!confirm} onOpenChange={(open) => !open && closeConfirm()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{confirm?.title}</DialogTitle>
          <DialogDescription>{confirm?.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={closeConfirm}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
