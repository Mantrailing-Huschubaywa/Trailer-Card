
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { PlusIcon } from './Icons'; // Reusing PlusIcon for consistency

interface TransactionDetailsInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionType: 'Aufladung' | 'Abbuchung'; // Type already selected from previous modal
  onConfirmDetails: (amount: number, description: string) => void;
}

const TransactionDetailsInputModal: React.FC<TransactionDetailsInputModalProps> = ({
  isOpen,
  onClose,
  transactionType,
  onConfirmDetails,
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [amountError, setAmountError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      // Set default description based on type
      setDescription(transactionType === 'Aufladung' ? 'Aufladung' : 'Trails');
      setAmountError('');
    }
  }, [isOpen, transactionType]);

  const validateAndConfirm = () => {
    let isValid = true;
    const parsedAmount = parseFloat(amount.replace(',', '.')); // Handle comma as decimal separator

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError('Bitte geben Sie einen gültigen Betrag (> 0) ein.');
      isValid = false;
    } else {
      setAmountError('');
    }

    if (isValid) {
      // Pass the parsed amount and description (or default if empty)
      onConfirmDetails(parsedAmount, description.trim() || (transactionType === 'Aufladung' ? 'Aufladung' : 'Trails'));
    }
  };

  const title = transactionType === 'Aufladung' ? 'Details zur Aufladung' : 'Details zur Abbuchung';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
      <div className="p-0 space-y-4">
        <Input
          id="transactionAmount"
          label="Betrag (€)"
          type="text" // Use text to allow comma, then parse
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="z.B. 18.00 oder 18,00"
          error={amountError}
        />
        <Input
          id="transactionDescription"
          label="Beschreibung (optional)"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={transactionType === 'Aufladung' ? 'Aufladung' : 'Trails'}
        />
      </div>
      <div className="p-4 border-t border-gray-200 mt-6 flex justify-end space-x-3">
        <Button variant="outline" onClick={onClose}>
          Abbrechen
        </Button>
        <Button variant="primary" onClick={validateAndConfirm} icon={PlusIcon}>
          Weiter
        </Button>
      </div>
    </Modal>
  );
};

export default TransactionDetailsInputModal;
