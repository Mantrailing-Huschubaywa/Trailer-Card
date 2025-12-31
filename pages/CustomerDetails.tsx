import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Input from '../components/Input';
import QRCodeDisplay from '../components/QRCodeDisplay';
import TransactionConfirmationModal from '../components/TransactionConfirmationModal';
import TransactionTypeSelectionModal from '../components/TransactionTypeSelectionModal';
import {
  ArrowLeftIcon,
  HeartIcon,
  CreditCardIcon,
  MailIcon,
  PhoneIcon,
  AwardIcon,
  UploadIcon,
  UserIcon,
  ChevronDownIcon,
  EditIcon,
  SaveIcon,
} from '../components/Icons';
import { CURRENT_EMPLOYEE, REFERENCE_DATE } from '../constants';
import { Customer, TrainingLevelEnum, TransactionConfirmationData, Transaction, User, UserRoleEnum } from '../types';

interface TrainingHourCircleProps {
  filled: boolean;
  className?: string;
}

const TrainingPawIcon: React.FC<TrainingHourCircleProps> = ({ filled, className = '' }) => (
  <div
    className={`flex items-center justify-center h-16 w-16 rounded-full border
      ${filled ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-200'}
      ${className}`}
  >
    <img
      src="https://hs-bw.com/wp-content/uploads/2025/12/Suchund-Icon.png"
      alt="Paw Icon"
      className={`h-10 w-10 object-contain ${!filled ? 'grayscale opacity-50' : ''}`}
    />
  </div>
);

interface HundredHourMilestoneBadgeProps {
  milestoneNumber: number;
}

const HundredHourMilestoneBadge: React.FC<HundredHourMilestoneBadgeProps> = ({ milestoneNumber }) => {
  const baseClasses = "flex flex-col items-center justify-center h-32 w-32 p-2 rounded-lg text-center shadow-md";
  let specificClasses = "";
  let textColor = "text-amber-800";

  switch (milestoneNumber) {
    case 1:
      specificClasses = "bg-amber-100 border border-amber-300";
      break;
    case 2:
      specificClasses = "bg-orange-100 border border-orange-300 shadow-lg";
      textColor = "text-orange-800";
      break;
    case 3:
      specificClasses = "bg-red-100 border border-red-300 shadow-xl";
      textColor = "text-red-800";
      break;
    case 4:
      specificClasses = "bg-purple-100 border border-purple-300 shadow-2xl";
      textColor = "text-purple-800";
      break;
    case 5:
      specificClasses = "bg-blue-100 border border-blue-300 shadow-2xl";
      textColor = "text-blue-800";
      break;
    default:
      specificClasses = "bg-gray-100 border border-gray-300";
      textColor = "text-gray-800";
      break;
  }

  return (
    <div className={`${baseClasses} ${specificClasses}`}>
      <img
        src="https://hs-bw.com/wp-content/uploads/2025/12/Suchund-Icon.png"
        alt={`${milestoneNumber * 100} Trails gemeistert`}
        className="h-20 w-20 object-contain filter drop-shadow-sm"
      />
      <p className={`text-sm font-bold ${textColor} mt-1`}>{milestoneNumber * 100} Trails gemeistert!</p>
    </div>
  );
};

interface CustomerDetailsProps {
  customers: Customer[];
  transactions: Transaction[];
  onUpdateCustomer: (updatedCustomer: Customer) => void;
  onAddTransaction: (newTransaction: Transaction) => void;
  currentUser: User;
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({
  customers,
  transactions,
  onUpdateCustomer,
  onAddTransaction,
  currentUser,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showTransactionTypeModal, setShowTransactionTypeModal] = useState(false);
  const [transactionData, setTransactionData] = useState<TransactionConfirmationData | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableData, setEditableData] = useState({
    phone: '',
    dogName: '',
    chipNumber: '',
  });

  useEffect(() => {
    setIsLoadingCustomer(true);
    if (id) {
      const foundCustomer = customers.find((c) => c.id === id);
      setCustomer(foundCustomer || null);

      if (foundCustomer) {
        setEditableData({
          phone: foundCustomer.phone,
          dogName: foundCustomer.dogName,
          chipNumber: foundCustomer.chipNumber,
        });
      }
    } else {
      setCustomer(null);
    }
    setIsLoadingCustomer(false);
  }, [id, customers]);

  // Authorization Effect: Redirect if a customer tries to access another customer's page
  useEffect(() => {
    if (currentUser.role === UserRoleEnum.KUNDE && currentUser.associatedCustomerId && id !== currentUser.associatedCustomerId) {
        navigate(`/customers/${currentUser.associatedCustomerId}`, { replace: true });
    }
  }, [currentUser, id, navigate]);

  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (customer) {
      setExpandedSections(prev => {
        const newExpanded = { ...prev };
        customer.trainingProgress.forEach(section => {
          if (newExpanded[section.id] === undefined) {
            newExpanded[section.id] = false;
          }
        });
        return newExpanded;
      });
    }
  }, [customer]);

  if (!id) {
    return (
      <div className="p-8 text-center text-red-600">
        Keine Kunden-ID in der URL gefunden.
        <Button variant="primary" onClick={() => navigate('/customers')} className="mt-4">
          Zurück zur Kundenliste
        </Button>
      </div>
    );
  }

  if (isLoadingCustomer) {
    return <div className="p-8 text-center text-gray-600">Lade Kundendaten...</div>;
  }

  if (!customer) {
    return (
      <div className="p-8 text-center text-gray-600">
        Kunde mit ID "{id}" nicht gefunden.
        <Button variant="primary" onClick={() => navigate('/customers')} className="mt-4">
          Zurück zur Kundenliste
        </Button>
      </div>
    );
  }

  const handleOpenConfirmationModal = (amount: number, type: 'Aufladung' | 'Abbuchung', description?: string) => {
    const oldBalance = customer.balance;
    const newBalance = type === 'Aufladung' ? oldBalance + amount : oldBalance - amount;
    setTransactionData({
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      employee: CURRENT_EMPLOYEE,
      transactionType: type,
      amount: amount,
      oldBalance: oldBalance,
      newBalance: newBalance,
      description: description,
    });
    setShowConfirmationModal(true);
  };

  const handleConfirmTransaction = () => {
    if (!transactionData || !customer) return;

    let finalUpdatedCustomer: Customer = { ...customer };
    finalUpdatedCustomer.balance = transactionData.newBalance;
    finalUpdatedCustomer.totalTransactions = customer.totalTransactions + 1;

    const isRecharge = transactionData.transactionType === 'Aufladung';
    if (!isRecharge && transactionData.description === 'Trails' && transactionData.amount === 18) {
      const currentTrainingProgress = [...customer.trainingProgress];
      let customerOverallLevel = finalUpdatedCustomer.level;
      const currentLevelIndex = currentTrainingProgress.findIndex(s => s.status === 'Aktuell');

      if (currentLevelIndex !== -1) {
        const currentSection = { ...currentTrainingProgress[currentLevelIndex] };
        if (currentSection.name === TrainingLevelEnum.EXPERT) {
          if (currentSection.completedHours < 500) {
            currentSection.completedHours += 1;
            currentTrainingProgress[currentLevelIndex] = currentSection;
          }
        } else if (currentSection.completedHours < currentSection.requiredHours) {
          currentSection.completedHours += 1;
          if (currentSection.completedHours === currentSection.requiredHours) {
            currentSection.status = 'Abgeschlossen';
            const nextLevelIndex = currentLevelIndex + 1;
            if (nextLevelIndex < currentTrainingProgress.length) {
              const nextSection = { ...currentTrainingProgress[nextLevelIndex] };
              nextSection.status = 'Aktuell';
              customerOverallLevel = nextSection.name;
              currentTrainingProgress[nextLevelIndex] = nextSection;
            }
          }
          currentTrainingProgress[currentLevelIndex] = currentSection;
        }
        finalUpdatedCustomer.trainingProgress = currentTrainingProgress;
        finalUpdatedCustomer.level = customerOverallLevel;
      }
    }

    onUpdateCustomer(finalUpdatedCustomer);

    const newTransaction: Transaction = {
      id: `trx-${transactions.length + 1}-${Date.now()}`,
      customerId: customer.id,
      type: transactionData.transactionType === 'Aufladung' ? 'recharge' : 'debit',
      description: transactionData.description || (transactionData.transactionType === 'Aufladung' ? 'Aufladung' : 'Trails'),
      amount: transactionData.amount,
      date: REFERENCE_DATE.toLocaleDateString('de-DE'),
      employee: CURRENT_EMPLOYEE,
    };
    onAddTransaction(newTransaction);
    setShowConfirmationModal(false);
    setTransactionData(null);
  };
  
  const handleSelectTransactionType = (type: 'Aufladung' | 'Abbuchung') => {
    setShowTransactionTypeModal(false);
    let defaultAmount = type === 'Aufladung' ? 215 : 18;
    let description = type === 'Aufladung' ? 'Guthabenaufladung' : 'Trails';
    handleOpenConfirmationModal(defaultAmount, type, description);
  };
  
  const handleToggleEditMode = () => {
    if (!isEditMode) {
      setEditableData({
        phone: customer.phone,
        dogName: customer.dogName,
        chipNumber: customer.chipNumber,
      });
    }
    setIsEditMode(!isEditMode);
  };
  
  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSaveChanges = () => {
    const updatedCustomer = {
      ...customer,
      phone: editableData.phone,
      dogName: editableData.dogName,
      chipNumber: editableData.chipNumber,
    };
    onUpdateCustomer(updatedCustomer);
    setIsEditMode(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setEditableData(prev => ({ ...prev, [id]: value }));
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'Aktuell': return 'bg-green-100 text-green-800';
      case 'Gesperrt': return 'bg-red-100 text-red-800';
      case 'Abgeschlossen': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const DataRow: React.FC<{ Icon: React.ElementType; label: string; value: string | number }> = ({ Icon, label, value }) => (
    <div>
      <div className="flex items-center text-gray-500 mb-1">
        <Icon className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="font-semibold text-gray-900 ml-6">{value}</p>
    </div>
  );

  const toggleSection = (sectionId: number) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const getLevelSummaryCardColors = (level: TrainingLevelEnum) => {
    switch (level) {
      case TrainingLevelEnum.EINSTEIGER: return { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', icon: 'text-fuchsia-700' };
      case TrainingLevelEnum.GRUNDLAGEN: return { bg: 'bg-lime-50', text: 'text-lime-700', icon: 'text-lime-700' };
      case TrainingLevelEnum.FORTGESCHRITTENE: return { bg: 'bg-sky-50', text: 'text-sky-700', icon: 'text-sky-700' };
      case TrainingLevelEnum.MASTERCLASS: return { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-700' };
      case TrainingLevelEnum.EXPERT: return { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-700' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-700', icon: 'text-gray-700' };
    }
  };

  const levelSummaryColors = getLevelSummaryCardColors(customer.level);
  const canPerformActions = currentUser.role === UserRoleEnum.ADMIN || currentUser.role === UserRoleEnum.MITARBEITER;
  const isCustomerViewing = currentUser.role === UserRoleEnum.KUNDE;

  return (
    <div className="p-6 md:p-8 lg:p-10 min-h-screen">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center">
          {!isCustomerViewing && (
            <button onClick={() => navigate('/customers')} className="text-gray-500 hover:text-gray-700 mr-4">
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            {customer.firstName} {customer.lastName}
            <span className="text-gray-500 font-normal text-base ml-2">
              {isCustomerViewing ? "Meine Übersicht" : "Kundendetails & Übersicht"}
            </span>
          </h1>
        </div>
        
        {isEditMode ? (
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleCancelEdit}>Abbrechen</Button>
            <Button variant="success" icon={SaveIcon} onClick={handleSaveChanges}>Speichern</Button>
          </div>
        ) : (
          <div className="flex space-x-3">
            {canPerformActions && (
              <>
                <Button variant="outline">Stammdaten</Button>
                <Button variant="success" onClick={() => setShowTransactionTypeModal(true)}>Transaktionen</Button>
              </>
            )}
            {isCustomerViewing && (
              <Button variant="primary" icon={EditIcon} onClick={handleToggleEditMode}>Meine Daten bearbeiten</Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Persönliche Daten</h2>
            <div className="flex items-start">
              <Avatar initials={customer.avatarInitials} color={customer.avatarColor} size="lg" className="mr-6 flex-shrink-0" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 flex-grow">
                <DataRow Icon={UserIcon} label="Vorname" value={customer.firstName} />
                <DataRow Icon={UserIcon} label="Nachname" value={customer.lastName} />
                <DataRow Icon={MailIcon} label="E-Mail" value={customer.email} />
                {isEditMode ? (
                  <Input id="phone" label="Telefon" value={editableData.phone} onChange={handleInputChange} />
                ) : (
                  <DataRow Icon={PhoneIcon} label="Telefon" value={customer.phone} />
                )}
                {isEditMode ? (
                  <Input id="dogName" label="Hund" value={editableData.dogName} onChange={handleInputChange} />
                ) : (
                  <DataRow Icon={HeartIcon} label="Hund" value={customer.dogName} />
                )}
                {isEditMode ? (
                  <Input id="chipNumber" label="Chipnummer" value={editableData.chipNumber} onChange={handleInputChange} />
                ) : (
                  <DataRow Icon={CreditCardIcon} label="Chipnummer" value={customer.chipNumber} />
                )}
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Konto-Übersicht</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg flex flex-col justify-center items-center text-center">
                <p className="text-sm text-gray-600 mb-1">Aktuelles Guthaben</p>
                <p className="text-2xl font-bold text-green-700">{customer.balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg flex flex-col justify-center items-center text-center">
                <p className="text-sm text-gray-600 mb-1">Transaktionen gesamt</p>
                <p className="text-2xl font-bold text-blue-700">{customer.totalTransactions}</p>
              </div>
              <div className={`${levelSummaryColors.bg} p-4 rounded-lg flex flex-col justify-center items-center text-center`}>
                <p className="text-sm text-gray-600 mb-1">Level</p>
                <div className="flex items-center mt-2">
                  <AwardIcon className={`h-10 w-10 mr-2 ${levelSummaryColors.icon}`} />
                  <p className={`text-2xl font-bold ${levelSummaryColors.text}`}>{customer.level}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ausbildungsfortschritt</h2>
            <div className="space-y-6">
              {customer.trainingProgress.map((section) => {
                let headerBgClass = 'bg-gray-50';
                let levelCircleBgClass = 'bg-gray-400';

                switch (section.name) {
                  case TrainingLevelEnum.EINSTEIGER: headerBgClass = 'bg-fuchsia-50'; break;
                  case TrainingLevelEnum.GRUNDLAGEN: headerBgClass = 'bg-lime-50'; break;
                  case TrainingLevelEnum.FORTGESCHRITTENE: headerBgClass = 'bg-sky-50'; break;
                  case TrainingLevelEnum.MASTERCLASS: headerBgClass = 'bg-amber-50'; break;
                  case TrainingLevelEnum.EXPERT: headerBgClass = 'bg-indigo-50'; break;
                }
                switch (section.name) {
                  case TrainingLevelEnum.EINSTEIGER: levelCircleBgClass = 'bg-fuchsia-500'; break;
                  case TrainingLevelEnum.GRUNDLAGEN: levelCircleBgClass = 'bg-lime-500'; break;
                  case TrainingLevelEnum.FORTGESCHRITTENE: levelCircleBgClass = 'bg-sky-500'; break;
                  case TrainingLevelEnum.MASTERCLASS: levelCircleBgClass = 'bg-amber-500'; break;
                  case TrainingLevelEnum.EXPERT: levelCircleBgClass = 'bg-indigo-500'; break;
                }

                const isExpanded = expandedSections[section.id];
                return (
                  <div key={section.id} className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <button
                      className={`p-4 flex items-center justify-between w-full text-left ${headerBgClass}`}
                      onClick={() => toggleSection(section.id)}
                      aria-expanded={isExpanded}
                      aria-controls={`section-content-${section.id}`}
                    >
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <span className={`flex items-center justify-center h-8 w-8 rounded-full text-white font-bold text-base mr-3 ${levelCircleBgClass}`}>{section.id}</span>
                        {section.name}
                      </h3>
                      <div className="flex items-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(section.status)} mr-2`}>{section.status}</span>
                        <ChevronDownIcon className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    <div id={`section-content-${section.id}`} className={`${isExpanded ? 'block' : 'hidden'} p-4 bg-white border-t border-gray-200`}>
                      {section.name === TrainingLevelEnum.EXPERT ? (
                        (() => {
                          const currentHours = section.completedHours;
                          const fullMilestones = Math.floor(currentHours / 100);
                          const remainingHours = currentHours % 100;
                          return (
                            <>
                              <p className="text-sm text-gray-600 mb-3">Fortschritt: {currentHours} Trails absolviert im Expert-Status</p>
                              <div className="flex flex-wrap gap-2">
                                {Array.from({ length: fullMilestones }).map((_, i) => (<HundredHourMilestoneBadge key={`milestone-${i}`} milestoneNumber={i + 1} />))}
                                {Array.from({ length: remainingHours }).map((_, i) => (<TrainingPawIcon key={`paw-${i}`} filled={true} />))}
                              </div>
                            </>
                          );
                        })()
                      ) : (
                        <>
                          <p className="text-sm text-gray-600 mb-3">Fortschritt: {section.completedHours} / {section.requiredHours} Trails</p>
                          <div className="flex flex-wrap gap-2">
                            {Array.from({ length: section.completedHours }).map((_, i) => (<TrainingPawIcon key={i} filled={true} />))}
                            {Array.from({ length: section.requiredHours - section.completedHours }).map((_, i) => (<TrainingPawIcon key={`empty-${i}`} filled={false} />))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Konto-Übersicht</h2>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between"><span>Guthaben</span><span className="font-semibold">{customer.balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span></div>
              <div className="flex justify-between"><span>Transaktionen</span><span className="font-semibold">{customer.totalTransactions}</span></div>
              <div className="flex justify-between"><span>Erstellt am</span><span className="font-semibold">{customer.createdAt}</span></div>
              <div className="flex justify-between"><span>Kunden-ID</span><span className="font-semibold">{customer.id}</span></div>
            </div>
          </Card>
          <Card className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">QR-Code</h2>
            <QRCodeDisplay dataUrl={customer.qrCodeData} className="mb-3" />
            <p className="text-sm text-gray-600">Scannen, um diese Kundenkarte schnell aufzurufen.</p>
          </Card>
        </div>
      </div>
      <TransactionConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleConfirmTransaction}
        data={transactionData}
      />
      <TransactionTypeSelectionModal
        isOpen={showTransactionTypeModal}
        onClose={() => setShowTransactionTypeModal(false)}
        onSelectType={handleSelectTransactionType}
      />
    </div>
  );
};

export default CustomerDetails;