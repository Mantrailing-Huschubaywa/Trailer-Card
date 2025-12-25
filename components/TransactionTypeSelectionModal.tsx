
import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { ArrowUpCircleIcon, ArrowDownCircleIcon } from './Icons'; // Reusing existing icons

interface TransactionTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'Aufladung' | 'Abbuchung') => void;
}

const TransactionTypeSelectionModal: React.FC<TransactionTypeSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transaktion auswählen" className="max-w-sm">
      <div className="p-4 space-y-4 text-center">
        <p className="text-gray-700">Bitte wählen Sie den Typ der Transaktion aus.</p>
        <div className="flex flex-col space-y-3">
          <Button
            variant="success"
            icon={ArrowUpCircleIcon}
            onClick={() => {
              onSelectType('Aufladung');
              onClose();
            }}
          >
            Aufladung
          </Button>
          <Button
            variant="danger"
            icon={ArrowDownCircleIcon}
            onClick={() => {
              onSelectType('Abbuchung');
              onClose();
            }}
          >
            Abbuchung
          </Button>
        </div>
      </div>
      <div className="p-4 border-t border-gray-200 flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Abbrechen
        </Button>
      </div>
    </Modal>
  );
};

export default TransactionTypeSelectionModal;
