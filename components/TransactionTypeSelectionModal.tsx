
import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { ArrowUpCircleIcon, ArrowDownCircleIcon, ClipboardIcon } from './Icons'; // Reusing existing icons

interface TransactionTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'Aufladung' | 'Trails' | 'Workshop') => void;
  customerBalance: number;
}

const TransactionTypeSelectionModal: React.FC<TransactionTypeSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
  customerBalance,
}) => {
  const TRAIL_COST = 18;
  const WORKSHOP_COST = 36;
  const isTrailDisabled = customerBalance < TRAIL_COST;
  const isWorkshopDisabled = customerBalance < WORKSHOP_COST;

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
              onSelectType('Trails');
              onClose();
            }}
            disabled={isTrailDisabled}
            title={isTrailDisabled ? `Nicht genügend Guthaben. Benötigt: ${TRAIL_COST.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}` : ''}
          >
            Trails
          </Button>
          <Button
            variant="info" // A light blue color for workshops
            icon={ClipboardIcon}
            onClick={() => {
              onSelectType('Workshop');
              onClose();
            }}
            disabled={isWorkshopDisabled}
            title={isWorkshopDisabled ? `Nicht genügend Guthaben. Benötigt: ${WORKSHOP_COST.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}` : ''}
          >
            Workshop
          </Button>
        </div>
        {(isTrailDisabled || isWorkshopDisabled) && (
            <p className="text-sm text-red-600 mt-4">
                Einige Optionen sind wegen zu geringem Guthaben nicht verfügbar.
            </p>
        )}
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
