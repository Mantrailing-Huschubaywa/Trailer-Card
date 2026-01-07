import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Customer } from '../types';
import { ClipboardCopyIcon, CheckIcon } from './Icons';

interface BankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const BankDetailsModal: React.FC<BankDetailsModalProps> = ({ isOpen, onClose, customer }) => {
  const [isIbanCopied, setIsIbanCopied] = useState(false);
  const [isPurposeCopied, setIsPurposeCopied] = useState(false);
  const RECHARGE_AMOUNT = 216; // Definierter Aufladebetrag

  const bankDetails = {
    recipient: 'Hundeschule Bayerischer Wald\nChristian Josef Huber',
    iban: 'DE06 1001 1001 2085 1453 65',
    bic: 'NTSBDEB1XXX',
    bank: 'N26 Bank',
  };

  const handleIbanCopy = () => {
    navigator.clipboard.writeText(bankDetails.iban).then(() => {
      setIsIbanCopied(true);
      setTimeout(() => setIsIbanCopied(false), 2000); // Reset after 2 seconds
    }, (err) => {
      console.error('Fehler beim Kopieren der IBAN: ', err);
      alert('Kopieren fehlgeschlagen. Bitte manuell kopieren.');
    });
  };
  
  if (!customer) return null;

  const purpose = customer.id;

  const handlePurposeCopy = () => {
    navigator.clipboard.writeText(purpose).then(() => {
      setIsPurposeCopied(true);
      setTimeout(() => setIsPurposeCopied(false), 2000); // Reset after 2 seconds
    }, (err) => {
      console.error('Fehler beim Kopieren des Verwendungszwecks: ', err);
      alert('Kopieren fehlgeschlagen. Bitte manuell kopieren.');
    });
  };


  const InfoRow: React.FC<{ label: string; value: string; onCopy?: () => void; isCopied?: boolean }> = 
    ({ label, value, onCopy, isCopied: copied }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center">
      <dt className="text-base font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between text-base text-gray-900 sm:mt-0 sm:col-span-2">
        <span className={`font-mono ${label === 'Empfänger' ? 'whitespace-pre-line' : 'whitespace-nowrap'}`}>{value}</span>
        {onCopy && (
          <div className="mt-2 sm:mt-0">
            <button
              type="button"
              onClick={onCopy}
              className="rounded-md bg-white font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-5 w-5 text-green-500 mr-1" />
                  Kopiert
                </>
              ) : (
                <>
                   <ClipboardCopyIcon className="h-5 w-5 mr-1" />
                   Kopieren
                </>
              )}
            </button>
          </div>
        )}
      </dd>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bankverbindung für Guthabenaufladung" className="max-w-xl">
      <div className="p-0">
        <p className="text-base text-gray-600 mb-4">
          Bitte überweise den Betrag von{' '}
          <strong className="text-lg font-bold text-blue-600">
            {RECHARGE_AMOUNT.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </strong>
          {' '}an die unten stehende Bankverbindung, um deine Karte aufzuladen.
        </p>
        <div className="border-t border-b border-gray-200 divide-y divide-gray-200">
          <InfoRow label="Empfänger" value={bankDetails.recipient} />
          <InfoRow label="IBAN" value={bankDetails.iban} onCopy={handleIbanCopy} isCopied={isIbanCopied} />
          <InfoRow label="BIC" value={bankDetails.bic} />
          <InfoRow label="Bank" value={bankDetails.bank} />
          <InfoRow label="Verwendungszweck" value={purpose} onCopy={handlePurposeCopy} isCopied={isPurposeCopied} />
        </div>
        <div className="mt-4 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.852-1.21 3.488 0l6.237 11.826A2 2 0 0116.222 18H3.778a2 2 0 01-1.76-3.075L8.257 3.099zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-base font-bold text-amber-800">Wichtiger Hinweis!</p>
              <p className="mt-1 text-base text-amber-700">Bitte benutze den oben angegebenen Verwendungszweck (deine Kundennummer), um eine schnelle Zuordnung deiner Zahlung zu gewährleisten.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-gray-200 mt-6 flex justify-end">
        <Button variant="primary" onClick={onClose}>
          Schließen
        </Button>
      </div>
    </Modal>
  );
};

export default BankDetailsModal;