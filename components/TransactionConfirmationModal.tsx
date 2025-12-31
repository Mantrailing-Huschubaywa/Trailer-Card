
import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { CheckCircleIcon, XMarkIcon, UserIcon } from './Icons';
import { TransactionConfirmationData } from '../types';

interface TransactionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: TransactionConfirmationData | null;
}

const TransactionConfirmationModal: React.FC<TransactionConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  data,
}) => {
  if (!data) return null;

  const isRecharge = data.transactionType === 'Aufladung';
  const displayAmount = Math.abs(data.amount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const oldBalanceFormatted = data.oldBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  const newBalanceFormatted = data.newBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl">
      <div className="p-0">
        <div className="bg-green-100 p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-green-800">Transaktion bestätigen</h3>
          </div>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 focus:outline-none rounded-md" // Adjusted for screenshot
            onClick={onClose}
          >
            <span className="sr-only">Close modal</span>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-gray-700">Bitte bestätigen Sie die Transaktion für <span className="font-semibold">{data.customerName}</span>.</p>

          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg flex items-center">
            <UserIcon className="h-5 w-5 mr-2" /> {/* Changed to UserIcon */}
            <span>Mitarbeiter: <span className="font-medium">{data.employee}</span></span>
          </div>

          {isRecharge ? (
            <div className="space-y-3">
              <div className="bg-green-50 p-3 rounded-lg flex justify-between items-center text-green-800">
                <span>{data.transactionType} <span className="font-medium">{displayAmount} €</span></span>
                <span className="font-semibold">+{displayAmount} €</span>
              </div>
              <div className="bg-green-50 p-3 rounded-lg flex justify-between items-center text-lg font-bold text-green-800">
                <span>Gesamt gutgeschrieben</span>
                <span>+{displayAmount} €</span>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="flex justify-between items-center text-red-800">
                <span className="font-medium">{data.transactionType}</span>
                <span className="font-semibold">-{displayAmount} €</span>
              </div>
              <p className="text-sm text-red-700 mt-1">Beschreibung: {data.description || 'Trails'}</p>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center text-sm">
            <div>
              <p className="text-gray-500">Alter Saldo</p>
              <p className="font-bold text-gray-900 text-2xl">{oldBalanceFormatted}</p> {/* Increased font size */}
            </div>
            <div className="text-gray-500 text-2xl mx-4 font-light">&rarr;</div> {/* Increased font size */}
            <div>
              <p className="text-gray-500">Neuer Saldo</p>
              <p className="font-bold text-blue-600 text-2xl">{newBalanceFormatted}</p> {/* Increased font size */}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="success" onClick={onConfirm} icon={CheckCircleIcon}>
            Bestätigen und Buchen
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TransactionConfirmationModal;
