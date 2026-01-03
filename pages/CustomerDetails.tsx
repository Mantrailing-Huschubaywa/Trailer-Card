import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import QRCodeDisplay from '../components/QRCodeDisplay';
import TransactionConfirmationModal from '../components/TransactionConfirmationModal';
import TransactionTypeSelectionModal from '../components/TransactionTypeSelectionModal';
import CustomerFormModal from '../components/CustomerFormModal';
import TransactionHistoryModal from '../components/TransactionHistoryModal';
import {
  ArrowLeftIcon,
  HeartIcon,
  CreditCardIcon,
  MailIcon,
  PhoneIcon,
  AwardIcon,
  UserIcon,
  EditIcon,
  TrailBadgeOnTheWayIcon,
  TrailBadge10Icon,
  TrailBadge50Icon,
  TrailBadge100Icon,
  TrailBadge500Icon,
  WorkshopPatchIcon, // NEUER IMPORT
} from '../components/Icons';
import { REFERENCE_DATE } from '../constants';
import { Customer, TrainingLevelEnum, TransactionConfirmationData, Transaction, User, UserRoleEnum, NewCustomerData, TrainingSection } from '../types';
import { getAvatarColorForLevel, parseDateString } from '../utils';

// --- NEUES MODAL FÜR STARTWERT ---
interface SetInitialTrailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (totalTrails: number) => void;
  currentTrails: number;
}

const SetInitialTrailsModal: React.FC<SetInitialTrailsModalProps> = ({ isOpen, onClose, onSubmit, currentTrails }) => {
  const [trails, setTrails] = useState(currentTrails.toString());
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTrails(currentTrails.toString());
      setError('');
    }
  }, [isOpen, currentTrails]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numTrails = parseInt(trails, 10);
    if (isNaN(numTrails) || numTrails < 0) {
      setError('Bitte geben Sie eine gültige, positive Zahl ein.');
      return;
    }
    onSubmit(numTrails);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Startwert für Trails festlegen" className="max-w-md">
      <form onSubmit={handleSubmit} className="p-0">
        <div className="space-y-4">
          <p className="text-gray-600">
            Geben Sie die Gesamtzahl der Trails ein, die dieser Kunde bereits absolviert hat.
            Der Fortschritt wird entsprechend neu berechnet.
          </p>
          <Input
            id="totalTrails"
            label="Gesamtzahl der absolvierten Trails"
            type="number"
            value={trails}
            onChange={(e) => setTrails(e.target.value)}
            min="0"
            error={error}
            autoFocus
          />
        </div>
        <div className="p-4 border-t border-gray-200 mt-6 flex justify-end space-x-3">
          <Button variant="outline" type="button" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="success" type="submit">
            Speichern und neu berechnen
          </Button>
        </div>
      </form>
    </Modal>
  );
};


/**
 * Zentrale Hilfsfunktion zur Ermittlung des Trainingslevels und der Farbgebung
 * basierend auf der Gesamtzahl der absolvierten Trails.
 * @param totalTrails Die Gesamtzahl der Trails.
 * @returns Ein Objekt mit Level, Farbklassen und der formatierten Level-Anzeige.
 */
const getTrainingInfoByTrails = (totalTrails: number) => {
  let level: TrainingLevelEnum;
  let cardClasses: { bg: string; text: string; icon: string; };

  if (totalTrails <= 12) {
    level = TrainingLevelEnum.EINSTEIGER;
    cardClasses = { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', icon: 'text-fuchsia-700' };
  } else if (totalTrails <= 24) {
    level = TrainingLevelEnum.GRUNDLAGEN;
    cardClasses = { bg: 'bg-lime-50', text: 'text-lime-700', icon: 'text-lime-700' };
  } else if (totalTrails <= 36) {
    level = TrainingLevelEnum.FORTGESCHRITTENE;
    cardClasses = { bg: 'bg-sky-50', text: 'text-sky-700', icon: 'text-sky-700' };
  } else if (totalTrails <= 49) {
    level = TrainingLevelEnum.MASTERCLASS;
    cardClasses = { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-700' };
  } else { // 50+
    level = TrainingLevelEnum.EXPERT;
    cardClasses = { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-700' };
  }

  const levelDisplay = `${Math.floor(totalTrails / 10) * 10}+`;
  
  return { level, cardClasses, totalTrails, levelDisplay };
};

// Neue Komponente zur Anzeige der Trail-Meilenstein-Abzeichen ("Trophäensammlung")
const TrailBadges: React.FC<{ totalTrails: number }> = ({ totalTrails }) => {
  // For new customers with less than 10 trails, show the "On the Way" badge.
  if (totalTrails < 10) {
    return (
      <div className="flex justify-center items-center py-4 min-h-[140px]">
        <TrailBadgeOnTheWayIcon
          className="h-32 w-32 [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.25))]"
        />
      </div>
    );
  }

  const badgeGroups = [];
  let remainingTrails = totalTrails;

  // --- Render 500s badges ---
  const num500 = Math.floor(remainingTrails / 500);
  if (num500 > 0) {
    const currentGroup = [];
    for (let i = 0; i < num500; i++) {
      currentGroup.push(
        <div key={`500-${i}`} className="relative first:ml-0 -ml-14">
          <TrailBadge500Icon
            className="h-44 w-44 [filter:drop-shadow(0_5px_4px_rgba(0,0,0,0.25))]"
          />
        </div>
      );
    }
    badgeGroups.push(<div key="group-500" className="flex items-center">{currentGroup}</div>);
    remainingTrails %= 500;
  }

  // --- Render 100s badges ---
  const num100 = Math.floor(remainingTrails / 100);
  if (num100 > 0) {
    const currentGroup = [];
    for (let i = 0; i < num100; i++) {
      currentGroup.push(
        <div key={`100-${i}`} className="relative first:ml-0 -ml-12">
          <TrailBadge100Icon
            className="h-40 w-40 [filter:drop-shadow(0_4px_3px_rgba(0,0,0,0.25))]"
          />
        </div>
      );
    }
    badgeGroups.push(<div key="group-100" className="flex items-center">{currentGroup}</div>);
    remainingTrails %= 100;
  }

  // --- Render 50s badges ---
  const num50 = Math.floor(remainingTrails / 50);
  if (num50 > 0) {
    const currentGroup = [];
    for (let i = 0; i < num50; i++) {
      currentGroup.push(
        <div key={`50-${i}`} className="relative first:ml-0 -ml-12">
          <TrailBadge50Icon
            className="h-36 w-36 [filter:drop-shadow(0_3px_2px_rgba(0,0,0,0.25))]"
          />
        </div>
      );
    }
    badgeGroups.push(<div key="group-50" className="flex items-center">{currentGroup}</div>);
    remainingTrails %= 50;
  }
  
  // --- Render 10s badges ---
  const num10 = Math.floor(remainingTrails / 10);
  if (num10 > 0) {
    const currentGroup = [];
    for (let i = 0; i < num10; i++) {
       currentGroup.push(
        <div key={`10-${i}`} className="relative first:ml-0 -ml-11">
          <TrailBadge10Icon
            className="h-32 w-32 [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.25))]"
          />
        </div>
      );
    }
    badgeGroups.push(<div key="group-10" className="flex items-center">{currentGroup}</div>);
  }

  return (
    <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-4 py-4 min-h-[140px]">
      {badgeGroups}
    </div>
  );
};

// NEUE KOMPONENTE: Anzeige der Workshop-Abzeichen
const WorkshopPatches: React.FC<{ totalWorkshops: number }> = ({ totalWorkshops }) => {
  if (totalWorkshops === 0) {
    return (
      <div className="flex justify-center items-center py-4 min-h-[140px]">
        <p className="text-gray-500 italic text-sm text-center">Keine Workshops absolviert</p>
      </div>
    );
  }

  const patches = [];
  // Zeigt bis zu 3 Patches überlappend an, um den Platz nicht zu sprengen
  const displayCount = Math.min(totalWorkshops, 3); 
  for (let i = 0; i < displayCount; i++) {
    patches.push(
      <div key={`workshop-${i}`} className="relative first:ml-0 -ml-12">
        <WorkshopPatchIcon
          className="h-32 w-32 [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.25))]"
        />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center flex-wrap py-4 min-h-[140px]">
      <div className="flex items-center">{patches}</div>
    </div>
  );
};


interface CustomerDetailsProps {
  customers: Customer[];
  transactions: Transaction[];
  onUpdateCustomer: (updatedCustomer: Customer) => void;
  onAddTransaction: (newTransaction: Omit<Transaction, 'created_at'>) => void;
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
  const [isTransactionHistoryModalOpen, setIsTransactionHistoryModalOpen] = useState(false);
  const [transactionData, setTransactionData] = useState<TransactionConfirmationData | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSetInitialTrailsModalOpen, setIsSetInitialTrailsModalOpen] = useState(false); // Neuer State

  useEffect(() => {
    setIsLoadingCustomer(true);
    if (id) {
      const foundCustomer = customers.find((c) => c.id === id);
      setCustomer(foundCustomer || null);
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
  
  // Filter and sort transactions for the current customer
  const customerTransactions = transactions
    .filter(t => t.customerId === id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
      employee: `${currentUser.firstName} ${currentUser.lastName}`,
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
    // WICHTIG: Diese Logik wird nur ausgeführt, wenn es sich um eine "Trails"-Abbuchung handelt.
    // Eine "Workshop"-Abbuchung wird diesen Block überspringen und nur das Guthaben anpassen.
    if (!isRecharge && transactionData.description === 'Trails' && transactionData.amount === 18) {
      const currentTrainingProgress: TrainingSection[] = JSON.parse(JSON.stringify(customer.trainingProgress));
      
      let trailAdded = false;
      const currentLevelIndex = currentTrainingProgress.findIndex(s => s.status === 'Aktuell');

      if (currentLevelIndex !== -1) {
          const currentSection = currentTrainingProgress[currentLevelIndex];
          if (currentSection.name === TrainingLevelEnum.EXPERT) {
              currentSection.completedHours += 1;
              trailAdded = true;
          } else if (currentSection.completedHours < currentSection.requiredHours) {
              currentSection.completedHours += 1;
              trailAdded = true;
              if (currentSection.completedHours === currentSection.requiredHours) {
                  currentSection.status = 'Abgeschlossen';
                  const nextLevelIndex = currentLevelIndex + 1;
                  if (nextLevelIndex < currentTrainingProgress.length) {
                      currentTrainingProgress[nextLevelIndex].status = 'Aktuell';
                  }
              }
          }
      }

      if (!trailAdded && currentTrainingProgress.length > 0) {
          currentTrainingProgress[0].completedHours += 1;
      }
      
      finalUpdatedCustomer.trainingProgress = currentTrainingProgress;
      
      const newTotalTrails = currentTrainingProgress.reduce((sum, section) => sum + section.completedHours, 0);
      const newTrainingInfo = getTrainingInfoByTrails(newTotalTrails);
      finalUpdatedCustomer.level = newTrainingInfo.level;
      finalUpdatedCustomer.avatarColor = getAvatarColorForLevel(newTrainingInfo.level);
    }

    onUpdateCustomer(finalUpdatedCustomer);

    const newTransaction: Omit<Transaction, 'created_at'> = {
      id: `trx-${transactions.length + 1}-${Date.now()}`,
      customerId: customer.id,
      type: transactionData.transactionType === 'Aufladung' ? 'recharge' : 'debit',
      description: transactionData.description || (transactionData.transactionType === 'Aufladung' ? 'Aufladung' : 'Unbekannt'),
      amount: transactionData.amount,
      date: REFERENCE_DATE.toLocaleDateString('de-DE'),
      employee: `${currentUser.firstName} ${currentUser.lastName}`,
    };
    onAddTransaction(newTransaction);
    setShowConfirmationModal(false);
    setTransactionData(null);
  };
  
  const handleSelectTransactionType = (type: 'Aufladung' | 'Trails' | 'Workshop') => {
    setShowTransactionTypeModal(false);
    if (!customer) return;

    let amount = 0;
    let description = '';
    let transactionType: 'Aufladung' | 'Abbuchung' = 'Abbuchung';

    switch (type) {
      case 'Aufladung':
        amount = 215;
        description = 'Guthabenaufladung';
        transactionType = 'Aufladung';
        break;
      case 'Trails':
        amount = 18;
        description = 'Trails';
        transactionType = 'Abbuchung';
        break;
      case 'Workshop':
        amount = 36;
        description = 'Workshop';
        transactionType = 'Abbuchung';
        break;
    }

    handleOpenConfirmationModal(amount, transactionType, description);
  };
  
  const handleUpdateStammdaten = (data: NewCustomerData) => {
    if (!customer) return;
    const updatedCustomer = { ...customer, ...data };
    onUpdateCustomer(updatedCustomer);
    setIsEditModalOpen(false);
  };

  const handleSetInitialTrails = (newTotalTrails: number) => {
    if (!customer) return;

    const levelsConfig = [
        { name: TrainingLevelEnum.EINSTEIGER, required: 12 },
        { name: TrainingLevelEnum.GRUNDLAGEN, required: 12 },
        { name: TrainingLevelEnum.FORTGESCHRITTENE, required: 12 },
        { name: TrainingLevelEnum.MASTERCLASS, required: 13 },
        { name: TrainingLevelEnum.EXPERT, required: Number.MAX_SAFE_INTEGER }, // FIX: No upper limit for experts
    ];

    let remainingTrails = newTotalTrails;
    let newTrainingProgress: TrainingSection[] = [];
    let hasFoundCurrent = false;

    for (let i = 0; i < levelsConfig.length; i++) {
        const levelConf = levelsConfig[i];
        const completed = Math.min(remainingTrails, levelConf.required);
        remainingTrails -= completed;

        let status: 'Gesperrt' | 'Aktuell' | 'Abgeschlossen' = 'Gesperrt';
        if (completed > 0 && !hasFoundCurrent) {
            if (completed < levelConf.required || levelConf.name === TrainingLevelEnum.EXPERT) {
                status = 'Aktuell';
                hasFoundCurrent = true;
            } else {
                status = 'Abgeschlossen';
            }
        }
        
        if (!hasFoundCurrent && i > 0 && newTrainingProgress[i-1]?.status === 'Abgeschlossen') {
            status = 'Aktuell';
            hasFoundCurrent = true;
        }

        newTrainingProgress.push({
            id: i + 1,
            name: levelConf.name,
            requiredHours: levelConf.required,
            completedHours: completed,
            status,
        });
    }
    
    if (!hasFoundCurrent && newTotalTrails >= 0 && newTrainingProgress.length > 0) {
        newTrainingProgress[0].status = 'Aktuell';
    }

    const newTrainingInfo = getTrainingInfoByTrails(newTotalTrails);
    
    const finalUpdatedCustomer: Customer = {
        ...customer,
        trainingProgress: newTrainingProgress,
        level: newTrainingInfo.level,
        avatarColor: getAvatarColorForLevel(newTrainingInfo.level),
        totalTransactions: customer.totalTransactions + 1,
    };
    
    onUpdateCustomer(finalUpdatedCustomer);

    const newTransaction: Omit<Transaction, 'created_at'> = {
        id: `trx-${transactions.length + 1}-${Date.now()}`,
        customerId: customer.id,
        type: 'debit',
        description: `Bestandsübernahme: ${newTotalTrails} Trails`,
        amount: 0,
        date: REFERENCE_DATE.toLocaleDateString('de-DE'),
        employee: `${currentUser.firstName} ${currentUser.lastName}`,
    };
    onAddTransaction(newTransaction);
    
    setIsSetInitialTrailsModalOpen(false);
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

  const totalTrails = customer.trainingProgress.reduce((sum, section) => sum + section.completedHours, 0);
  const totalWorkshops = customerTransactions.filter(t => t.description === 'Workshop').length;
  const trainingInfo = getTrainingInfoByTrails(totalTrails);

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
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
          {canPerformActions && (
            <>
              <Button variant="outline" onClick={() => setIsSetInitialTrailsModalOpen(true)}>Startwert festlegen</Button>
              <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>Stammdaten</Button>
              <Button variant="success" onClick={() => setShowTransactionTypeModal(true)}>Transaktionen</Button>
            </>
          )}
          {isCustomerViewing && (
            <Button variant="primary" icon={EditIcon} onClick={() => setIsEditModalOpen(true)}>Meine Daten bearbeiten</Button>
          )}
        </div>
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
                <DataRow Icon={PhoneIcon} label="Telefon" value={customer.phone} />
                <DataRow Icon={HeartIcon} label="Hund" value={customer.dogName} />
                <DataRow Icon={CreditCardIcon} label="Chipnummer" value={customer.chipNumber} />
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Übersicht</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg flex flex-col justify-center items-center text-center">
                <p className="text-sm text-gray-600 mb-1">Aktuelles Guthaben</p>
                <p className="text-2xl font-bold text-green-700">{customer.balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
              </div>
              <button
                onClick={() => setIsTransactionHistoryModalOpen(true)}
                className="bg-blue-50 p-4 rounded-lg flex flex-col justify-center items-center text-center w-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <p className="text-sm text-gray-600 mb-1">Transaktionen gesamt</p>
                <p className="text-2xl font-bold text-blue-700">{customer.totalTransactions}</p>
              </button>
              <div className={`${trainingInfo.cardClasses.bg} p-4 rounded-lg flex flex-col justify-center items-center text-center`}>
                <p className="text-sm text-gray-600 mb-1">Fortschritt</p>
                <div className="flex items-center mt-2">
                  <AwardIcon className={`h-10 w-10 mr-2 ${trainingInfo.cardClasses.icon}`} />
                  <p className={`text-2xl font-bold ${trainingInfo.cardClasses.text}`}>{trainingInfo.levelDisplay}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Meine Erfolge</h2>
            <div className="flex space-x-4">
              {/* Trails Container (2/3) */}
              <div className="w-2/3 bg-slate-100 p-6 rounded-lg flex flex-col items-center justify-center text-center">
                  <TrailBadges totalTrails={trainingInfo.totalTrails} />
                  <p className="text-5xl font-bold text-slate-800">{trainingInfo.totalTrails}</p>
                  <p className="text-lg font-medium mt-1 text-slate-600">Absolvierte Trails</p>
              </div>
              {/* Workshops Container (1/3) */}
              <div className="w-1/3 bg-slate-100 p-6 rounded-lg flex flex-col items-center justify-center text-center">
                  <WorkshopPatches totalWorkshops={totalWorkshops} />
                  <p className="text-5xl font-bold text-slate-800">{totalWorkshops}</p>
                  <p className="text-lg font-medium mt-1 text-slate-600">Absolvierte Workshops</p>
              </div>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Konto</h2>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between"><span>Erstellt am</span><span className="font-bold">{new Date(customer.created_at).toLocaleDateString('de-DE')}</span></div>
              <div className="flex justify-between"><span>Kunden-ID</span><span className="font-bold">{customer.id}</span></div>
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
        customerBalance={customer.balance}
      />
      <CustomerFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateStammdaten}
        customerToEdit={customer}
      />
      <TransactionHistoryModal
        isOpen={isTransactionHistoryModalOpen}
        onClose={() => setIsTransactionHistoryModalOpen(false)}
        transactions={customerTransactions}
        customerName={`${customer.firstName} ${customer.lastName}`}
      />
      <SetInitialTrailsModal
        isOpen={isSetInitialTrailsModalOpen}
        onClose={() => setIsSetInitialTrailsModalOpen(false)}
        onSubmit={handleSetInitialTrails}
        currentTrails={totalTrails}
      />
    </div>
  );
};

export default CustomerDetails;