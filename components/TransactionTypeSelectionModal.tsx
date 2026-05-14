import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { ArrowUpCircleIcon, ArrowDownCircleIcon, PawPrintIcon, ClipboardIcon } from './Icons';
import { Dog } from '../types';

interface TransactionTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'Mantrailing' | 'customRecharge' | 'customDebit', selectedDog?: Dog) => void;
  customerBalance: number;
  dogs?: Dog[];
}

const TransactionTypeSelectionModal: React.FC<TransactionTypeSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
  customerBalance,
  dogs = [],
}) => {
  const TRAIL_COST = 18;
  const isTrailDisabled = customerBalance < TRAIL_COST;
  const isDebitDisabled = customerBalance <= 0;
  
  const [showDogSelection, setShowDogSelection] = useState(false);

  // Reset state when modal is closed/opened
  React.useEffect(() => {
    if (!isOpen) setShowDogSelection(false);
  }, [isOpen]);

  const handleSelect = (type: 'Mantrailing' | 'customRecharge' | 'customDebit', dog?: Dog) => {
    if (type === 'Mantrailing' && dogs.length > 1 && !dog) {
      setShowDogSelection(true);
      return;
    }
    // For single dog or if dog is already selected
    const dogToPass = dog || (dogs.length > 0 ? dogs[0] : undefined);
    onSelectType(type, dogToPass);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={showDogSelection ? "Hund auswählen" : "Transaktion auswählen"} className="max-w-sm">
      <div className="p-4 space-y-4 text-center">
        {showDogSelection ? (
          <>
            <p className="text-gray-700">Für welchen Hund wird der Trail gebucht?</p>
            <div className="flex flex-col space-y-3">
              {dogs.map((dog) => (
                <Button
                  key={dog.id}
                  variant="primary"
                  icon={PawPrintIcon}
                  onClick={() => handleSelect('Mantrailing', dog)}
                  className="w-full"
                >
                  {dog.name} {dog.chipNumber ? `(${dog.chipNumber})` : ''}
                </Button>
              ))}
              <Button variant="outline" onClick={() => setShowDogSelection(false)} className="mt-4">
                Zurück
              </Button>
            </div>
          </>
        ) : (
          <>
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
                variant="danger"
                icon={ClipboardIcon}
                onClick={() => handleSelect('customDebit')}
                disabled={isDebitDisabled}
                className="w-full"
              >
                Abbuchung (Individueller Betrag)
              </Button>
            </div>

            {isDebitDisabled ? (
              <p className="text-sm text-red-600 mt-2">
                Kein Guthaben für Abbuchungen vorhanden.
              </p>
            ) : isTrailDisabled ? (
              <p className="text-sm text-red-600 mt-2">
                Guthaben reicht für Mantrailing-Abbuchung nicht aus.
              </p>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
};

export default TransactionTypeSelectionModal;
