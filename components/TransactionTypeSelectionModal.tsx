import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { ArrowUpCircleIcon, ArrowDownCircleIcon, ClipboardIcon } from './Icons';

interface TransactionTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'Mantrailing' | 'customRecharge' | 'customSeminarDebit') => void;
  customerBalance: number;
}

const TransactionTypeSelectionModal: React.FC<TransactionTypeSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
  customerBalance,
}) => {
  const TRAIL_COST = 18;
  const isTrailDisabled = customerBalance < TRAIL_COST;
  const isSeminarDisabled = customerBalance <= 0;

  const handleSelect = (type: 'Mantrailing' | 'customRecharge' | 'customSeminarDebit') => {
    onSelectType(type);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transaktion auswählen" className="max-w-sm">
      <div className="p-4 space-y-4 text-center">
        <p className="text-gray-700">Wählen Sie die gewünschte Buchungsart aus.</p>
        
        <div className="flex flex-col space-y-3">
          <Button
            variant="success"
            icon={ArrowUpCircleIcon}
            onClick={() => handleSelect('customRecharge')}
            className="w-full"
          >
            Aufladung (Individueller Betrag)
          </Button>

          <Button
            variant="danger"
            icon={ArrowDownCircleIcon}
            onClick={() => handleSelect('Mantrailing')}
            disabled={isTrailDisabled}
            className="w-full"
          >
            Abbuchung Mantrailing (18,00 €)
          </Button>

          <Button
            variant="info"
            icon={ClipboardIcon}
            onClick={() => handleSelect('customSeminarDebit')}
            className="w-full"
            disabled={isSeminarDisabled}
          >
            Seminar/Event (Individueller Betrag)
          </Button>
        </div>

        {isSeminarDisabled ? (
          <p className="text-sm text-red-600 mt-2">
            Kein Guthaben für Abbuchungen vorhanden.
          </p>
        ) : isTrailDisabled ? (
          <p className="text-sm text-red-600 mt-2">
            Guthaben reicht für Mantrailing-Abbuchung nicht aus.
          </p>
        ) : null}
      </div>
    </Modal>
  );
};

export default TransactionTypeSelectionModal;
