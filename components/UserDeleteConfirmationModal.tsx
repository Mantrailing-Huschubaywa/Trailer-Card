
import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { TrashIcon, XMarkIcon } from './Icons';

interface UserDeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userNameToDelete: string;
}

const UserDeleteConfirmationModal: React.FC<UserDeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userNameToDelete,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Benutzer löschen bestätigen" className="max-w-sm">
      <div className="p-0 text-center">
        <div className="flex justify-center text-red-500 mb-4">
          <TrashIcon className="h-10 w-10" />
        </div>
        <p className="text-gray-700 mb-4">
          Sind Sie sicher, dass Sie den Benutzer <span className="font-semibold">{userNameToDelete}</span> wirklich löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
      </div>
      <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
        <Button variant="outline" onClick={onClose}>
          Abbrechen
        </Button>
        <Button variant="danger" onClick={onConfirm} icon={TrashIcon}>
          Löschen
        </Button>
      </div>
    </Modal>
  );
};

export default UserDeleteConfirmationModal;
