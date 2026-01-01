import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { Transaction } from '../types';
import { ArrowUpCircleIcon, ArrowDownCircleIcon } from './Icons';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  customerName: string;
}

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  transactions,
  customerName,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Transaktionshistorie für ${customerName}`} className="max-w-2xl">
      <div className="p-0">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Für diesen Kunden sind noch keine Transaktionen vorhanden.</p>
          ) : (
            transactions.map((transaction) => {
              const isRecharge = transaction.type === 'recharge';
              const Icon = isRecharge ? ArrowUpCircleIcon : ArrowDownCircleIcon;
              const iconColor = isRecharge ? 'text-green-500' : 'text-red-500';
              const amountColor = isRecharge ? 'text-green-700' : 'text-red-700';
              const amountSign = isRecharge ? '+' : '-';

              return (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Icon className={`h-8 w-8 mr-3 flex-shrink-0 ${iconColor}`} />
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{transaction.date} &bull; {transaction.employee}</p>
                    </div>
                  </div>
                  <p className={`font-semibold text-lg whitespace-nowrap ${amountColor}`}>
                    {amountSign}{Math.abs(transaction.amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
              );
            })
          )}
        </div>
        <div className="p-4 border-t border-gray-200 mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TransactionHistoryModal;
