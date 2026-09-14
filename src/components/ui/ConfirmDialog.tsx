import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', danger = true }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-4">
        {danger && (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
        )}
        <p className="text-sm text-slate-600 leading-relaxed flex-1">{message}</p>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
