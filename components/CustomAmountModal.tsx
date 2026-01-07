import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';

interface CustomAmountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, description: string) => void;
  transactionType: 'Aufladung' | 'Abbuchung';
  defaultDescription?: string;
  customerBalance: number;
}

const CustomAmountModal: React.FC<CustomAmountModalProps> = ({ isOpen, onClose, onSubmit, transactionType, defaultDescription = '', customerBalance }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState(defaultDescription);
  const [errors, setErrors] = useState<{ amount?: string; description?: string }>({});

  const quickAmounts = [18, 50, 75, 100, 150, 200, 250];

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDescription(defaultDescription || '');
      setErrors({});
    }
  }, [isOpen, defaultDescription]);

  const validate = () => {
    const newErrors: { amount?: string; description?: string } = {};
    const numericAmount = parseFloat(amount.replace(',', '.'));

    if (!amount) {
      newErrors.amount = 'Betrag ist erforderlich.';
    } else if (isNaN(numericAmount) || numericAmount <= 0) {
      newErrors.amount = 'Bitte geben Sie einen gültigen, positiven Betrag ein.';
    } else if (transactionType === 'Abbuchung' && numericAmount > customerBalance) {
      newErrors.amount = `Betrag übersteigt Guthaben (${customerBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}).`;
    }

    if (transactionType === 'Abbuchung' && !description.trim()) {
      newErrors.description = 'Beschreibung ist für Abbuchungen erforderlich.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(parseFloat(amount.replace(',', '.')), description);
    }
  };

  const title = transactionType === 'Aufladung' ? 'Individuelle Aufladung' : 'Individuelle Abbuchung';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
      <form onSubmit={handleSubmit} className="p-0">
        <div className="space-y-4">
          {transactionType === 'Aufladung' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Schnellauswahl</label>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-[#098178] rounded-md hover:bg-[#076c64] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#098178] transition-colors"
                  >
                    {quickAmount} €
                  </button>
                ))}
              </div>
            </div>
          )}
          <Input
            id="customAmount"
            label="Betrag in €"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="z.B. 50.00"
            error={errors.amount}
            step="0.01"
            min="0.01"
            autoFocus
          />
          <Input
            id="customDescription"
            label={`Beschreibung ${transactionType === 'Abbuchung' ? '' : '(optional)'}`}
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="z.B. Seminar, Event, Korrektur..."
            error={errors.description}
          />
        </div>
        <div className="p-4 border-t border-gray-200 mt-6 flex justify-end space-x-3">
          <Button variant="outline" type="button" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="success" type="submit">
            Weiter zur Bestätigung
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomAmountModal;
