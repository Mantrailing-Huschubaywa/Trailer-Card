
import React, { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState<'paypal' | 'bank'>('paypal');
  const [isIbanCopied, setIsIbanCopied] = useState(false);
  const [isPurposeCopied, setIsPurposeCopied] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('paypal');
      setIsIbanCopied(false);
      setIsPurposeCopied(false);
    }
  }, [isOpen]);

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
      console.error('Fehler beim Kopieren der Kundennummer/Verwendungszweck: ', err);
      alert('Kopieren fehlgeschlagen. Bitte manuell kopieren.');
    });
  };

  const InfoRow: React.FC<{ label: string; value: string; onCopy?: () => void; isCopied?: boolean; isLink?: string }> = 
    ({ label, value, onCopy, isCopied: copied, isLink }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center">
      <dt className="text-base font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between text-base text-gray-900 sm:mt-0 sm:col-span-2">
        {isLink ? (
          <a href={isLink} target="_blank" rel="noopener noreferrer" className="font-mono text-blue-600 hover:underline break-all whitespace-normal">
            {value}
          </a>
        ) : (
          <span className={`font-mono ${label === 'Empfänger' ? 'whitespace-pre-line' : 'whitespace-nowrap'}`}>{value}</span>
        )}
        {onCopy && (
          <div className="mt-2 sm:mt-0 sm:ml-2 flex-shrink-0">
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
    <Modal isOpen={isOpen} onClose={onClose} title="Guthaben aufladen" className="max-w-xl">
      <div className="p-0">
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 w-full">
          <button
            className={`flex-1 py-3 px-4 text-center border-b-2 font-medium text-sm focus:outline-none transition-colors ${activeTab === 'paypal' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('paypal')}
          >
            PayPal
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center border-b-2 font-medium text-sm focus:outline-none transition-colors ${activeTab === 'bank' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('bank')}
          >
            Banküberweisung
          </button>
        </div>

        {/* PayPal Tab Content */}
        {activeTab === 'paypal' && (
          <div className="animate-fade-in">
            <p className="text-base text-gray-600 mb-4">
              Klicke auf den PayPal-Link, um Guthaben auf deine Karte aufzuladen. Bitte gib deine <strong>Kundennummer als Mitteilung</strong> an, damit wir die Zahlung schnell zuordnen können!
            </p>
            <div className="border-t border-b border-gray-200 divide-y divide-gray-200">
              <InfoRow label="PayPal Link" value="paypal.me/hundeschulebaywa" isLink="https://www.paypal.com/paypalme/hundeschulebaywa" />
              <InfoRow label="Kundennummer (Mitteilung)" value={purpose} onCopy={handlePurposeCopy} isCopied={isPurposeCopied} />
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
                  <p className="mt-1 text-base text-amber-700">Vergiss nicht, deine <strong>Kundennummer</strong> in das Mitteilungsfeld bei PayPal einzutragen.</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <a 
                href="https://www.paypal.com/paypalme/hundeschulebaywa" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#0070ba] hover:bg-[#003087] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0070ba] transition-colors"
              >
                Zu PayPal wechseln
              </a>
            </div>
          </div>
        )}

        {/* Banküberweisung Tab Content */}
        {activeTab === 'bank' && (
          <div className="animate-fade-in">
            <p className="text-base text-gray-600 mb-4">
              Bitte überweise einen Betrag deiner Wahl auf die unten stehende Bankverbindung, um deine Karte aufzuladen.
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
        )}

      </div>
      <div className="p-4 border-t border-gray-200 mt-6 flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Schließen
        </Button>
      </div>
    </Modal>
  );
};

export default BankDetailsModal;
