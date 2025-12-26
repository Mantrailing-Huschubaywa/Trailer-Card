
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import QRCodeDisplay from '../components/QRCodeDisplay';
import TransactionConfirmationModal from '../components/TransactionConfirmationModal';
import TransactionTypeSelectionModal from '../components/TransactionTypeSelectionModal'; // Import new modal
import {
  ArrowLeftIcon,
  HeartIcon,
  CreditCardIcon,
  MailIcon,
  PhoneIcon,
  AwardIcon,
  UploadIcon,
  UserIcon,
  ChevronDownIcon, // Import ChevronDownIcon
} from '../components/Icons';
import { CURRENT_EMPLOYEE, REFERENCE_DATE } from '../constants'; // Only CURRENT_EMPLOYEE and REFERENCE_DATE remain
import { Customer, TrainingLevelEnum, TransactionConfirmationData, Transaction, User, UserRoleEnum } from '../types';

interface TrainingHourCircleProps {
  filled: boolean;
  className?: string;
}

const TrainingPawIcon: React.FC<TrainingHourCircleProps> = ({ filled, className = '' }) => (
  // Updated to use an <img> tag with the provided URL
  // Increased size by 200% (from h-8 w-8 to h-16 w-16 for div, and h-5 w-5 to h-10 w-10 for img)
  <div
    className={`flex items-center justify-center h-16 w-16 rounded-full border
      ${filled ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-200'}
      ${className}`}
  >
    <img
      src="https://hs-bw.com/wp-content/uploads/2025/12/Suchund-Icon.png"
      alt="Paw Icon"
      className={`h-10 w-10 object-contain ${!filled ? 'grayscale opacity-50' : ''}`} // Apply grayscale and opacity for unfilled
    />
  </div>
);

// New component for the 100-hour milestone badge with visual variations
interface HundredHourMilestoneBadgeProps {
  milestoneNumber: number; // 1 for 100, 2 for 200, etc.
}

const HundredHourMilestoneBadge: React.FC<HundredHourMilestoneBadgeProps> = ({ milestoneNumber }) => {
  const baseClasses = "flex flex-col items-center justify-center h-32 w-32 p-2 rounded-lg text-center shadow-md";
  let specificClasses = "";
  let textColor = "text-amber-800";

  switch (milestoneNumber) {
    case 1: // 100 Trails
      specificClasses = "bg-amber-100 border border-amber-300";
      break;
    case 2: // 200 Trails
      specificClasses = "bg-orange-100 border border-orange-300 shadow-lg";
      textColor = "text-orange-800";
      break;
    case 3: // 300 Trails
      specificClasses = "bg-red-100 border border-red-300 shadow-xl";
      textColor = "text-red-800";
      break;
    case 4: // 400 Trails
      specificClasses = "bg-purple-100 border border-purple-300 shadow-2xl";
      textColor = "text-purple-800";
      break;
    case 5: // 500 Trails
      specificClasses = "bg-blue-100 border border-blue-300 shadow-2xl";
      textColor = "text-blue-800";
      break;
    default: // For milestones beyond 500 or unknown
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
  currentUser: User; // Added currentUser prop
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({
  customers,
  transactions,
  onUpdateCustomer,
  onAddTransaction,
  currentUser, // Destructure currentUser
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // Renamed for clarity
  const [showTransactionTypeModal, setShowTransactionTypeModal] = useState(false); // New state for selection modal
  const [transactionData, setTransactionData] = useState<TransactionConfirmationData | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null); // Local state for customer
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true); // Loading state for customer

  // State to manage expanded/collapsed sections
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  // Effect to find and set the customer when `id` or `customers` prop changes
  useEffect(() => {
    setIsLoadingCustomer(true); // Always set loading to true when dependencies change
    console.log(`CustomerDetails useEffect: ID from URL: ${id}, Customers prop length: ${customers.length}`);
    
    if (id) {
      const foundCustomer = customers.find((c) => c.id === id);
      console.log(`CustomerDetails useEffect: Found customer:`, foundCustomer);
      setCustomer(foundCustomer || null);
      setIsLoadingCustomer(false); // Done loading for this cycle

      // Also update initial expanded sections if customer is found
      if (foundCustomer) {
        setExpandedSections(prev => {
          const newExpanded = { ...prev };
          foundCustomer.trainingProgress.forEach(section => {
            if (newExpanded[section.id] === undefined) {
              newExpanded[section.id] = false; // Initialize if not set
            }
          });
          return newExpanded;
        });
      }
    } else {
      setCustomer(null);
      setIsLoadingCustomer(false); // No ID, so no customer to load
    }
  }, [id, customers]); // Re-run when ID or customers list changes

  // Handle cases where ID is missing from URL or customer not found
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
    return (
      <div className="p-8 text-center text-gray-600">
        Lade Kundendaten...
      </div>
    );
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

  // This function now specifically opens the *confirmation* modal
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
      description: description, // Pass the description
    });
    setShowConfirmationModal(true);
  };

  const handleConfirmTransaction = () => {
    if (!transactionData || !customer) return;

    let finalUpdatedCustomer: Customer = { ...customer };

    // Update customer's balance and totalTransactions first
    finalUpdatedCustomer = {
      ...finalUpdatedCustomer,
      balance: transactionData.newBalance,
      totalTransactions: customer.totalTransactions + 1,
    };

    // Check if the transaction is a 'Trails' debit
    const isRecharge = transactionData.transactionType === 'Aufladung';
    if (!isRecharge && transactionData.description === 'Trails' && transactionData.amount === 18) {
      const currentTrainingProgress = [...customer.trainingProgress]; // Create a mutable copy of the array
      let customerOverallLevel = finalUpdatedCustomer.level;

      const currentLevelIndex = currentTrainingProgress.findIndex(
        (section) => section.status === 'Aktuell'
      );

      if (currentLevelIndex !== -1) {
        const currentSection = { ...currentTrainingProgress[currentLevelIndex] }; // Deep copy the section object

        // For Expert level, completedHours can go beyond requiredHours, up to 500 for milestones
        if (currentSection.name === TrainingLevelEnum.EXPERT) {
          // Max out at 500 for now, or allow indefinite. User requested milestones up to 500.
          if (currentSection.completedHours < 500) { // Assuming 500 is the max for tracking milestones
            currentSection.completedHours += 1;
            currentTrainingProgress[currentLevelIndex] = currentSection; // Update section in copy
          }
        } else if (currentSection.completedHours < currentSection.requiredHours) {
          currentSection.completedHours += 1; // Increment completed hours

          // Check for level completion and advancement
          if (currentSection.completedHours === currentSection.requiredHours) {
            currentSection.status = 'Abgeschlossen'; // Mark current as completed

            const nextLevelIndex = currentLevelIndex + 1;
            if (nextLevelIndex < currentTrainingProgress.length) {
              const nextSection = { ...currentTrainingProgress[nextLevelIndex] }; // Deep copy
              nextSection.status = 'Aktuell'; // Activate next level
              customerOverallLevel = nextSection.name; // Update overall customer level
              currentTrainingProgress[nextLevelIndex] = nextSection; // Update next section in copy
            }
          }
          currentTrainingProgress[currentLevelIndex] = currentSection; // Update current section in copy
        }

        // Apply updated training progress and overall level to the final customer object
        finalUpdatedCustomer = {
          ...finalUpdatedCustomer,
          trainingProgress: currentTrainingProgress,
          level: customerOverallLevel,
        };
      }
    }

    // Propagate all updates to global state
    onUpdateCustomer(finalUpdatedCustomer);

    // Create and add new transaction
    const newTransaction: Transaction = {
      id: `trx-${transactions.length + 1}-${Date.now()}`, // Simple unique ID
      customerId: customer.id,
      type: transactionData.transactionType === 'Aufladung' ? 'recharge' : 'debit',
      description: transactionData.description || (transactionData.transactionType === 'Aufladung' ? 'Aufladung' : 'Trails'),
      amount: transactionData.amount,
      date: REFERENCE_DATE.toLocaleDateString('de-DE'), // Use REFERENCE_DATE for consistency
      employee: CURRENT_EMPLOYEE,
    };
    onAddTransaction(newTransaction); // Propagate new transaction to global state

    console.log('Transaction confirmed:', transactionData);
    setShowConfirmationModal(false);
    setTransactionData(null);
  };

  // New handler for selecting transaction type from the selection modal
  const handleSelectTransactionType = (type: 'Aufladung' | 'Abbuchung') => {
    setShowTransactionTypeModal(false); // Close the selection modal

    let defaultAmount = 0;
    let description = '';
    if (type === 'Aufladung') {
      defaultAmount = 215; // Example default amount for recharge
      description = 'Guthabenaufladung';
    } else { // Abbuchung
      defaultAmount = 18; // Example default amount for debit
      description = 'Trails';
    }
    handleOpenConfirmationModal(defaultAmount, type, description); // Open the confirmation modal
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'Aktuell':
        return 'bg-green-100 text-green-800';
      case 'Gesperrt':
        return 'bg-red-100 text-red-800';
      case 'Abgeschlossen':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper component for a consistent data row
  const DataRow: React.FC<{ Icon: React.ElementType; label: string; value: string | number }> = ({ Icon, label, value }) => (
    <div>
      <div className="flex items-center text-gray-500 mb-1">
        <Icon className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="font-semibold text-gray-900 ml-6">{value}</p> {/* Adjusted margin for alignment */}
    </div>
  );

  const toggleSection = (sectionId: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Helper to get colors for the Level summary card based on TrainingLevelEnum
  const getLevelSummaryCardColors = (level: TrainingLevelEnum) => {
    switch (level) {
      case TrainingLevelEnum.EINSTEIGER:
        return { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', icon: 'text-fuchsia-700' }; // Orchid
      case TrainingLevelEnum.GRUNDLAGEN:
        return { bg: 'bg-lime-50', text: 'text-lime-700', icon: 'text-lime-700' };    // Lime Green
      case TrainingLevelEnum.FORTGESCHRITTENE:
        return { bg: 'bg-sky-50', text: 'text-sky-700', icon: 'text-sky-700' };     // Sky Blue
      case TrainingLevelEnum.MASTERCLASS:
        return { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-700' };   // Peru
      case TrainingLevelEnum.EXPERT:
        return { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-700' };  // Indigo
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700', icon: 'text-gray-700' };
    }
  };

  const levelSummaryColors = getLevelSummaryCardColors(customer.level);

  // Determine if the current user has permission to perform actions (Admin or Mitarbeiter)
  const canPerformActions = currentUser.role === UserRoleEnum.ADMIN || currentUser.role === UserRoleEnum.MITARBEITER;

  return (
    <div className="p-6 md:p-8 lg:p-10 min-h-screen">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center">
          {currentUser.role !== UserRoleEnum.KUNDE && ( // Only show back button if not a customer
            <button onClick={() => navigate('/customers')} className="text-gray-500 hover:text-gray-700 mr-4">
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            {customer.firstName} {customer.lastName}
            <span className="text-gray-500 font-normal text-base ml-2">Kundendetails & Übersicht</span>
          </h1>
        </div>
        {canPerformActions && ( // Conditionally render action buttons
          <div className="flex space-x-3">
            <Button variant="outline">Stammdaten</Button>
            <Button variant="success" onClick={() => setShowTransactionTypeModal(true)}>
              Transaktionen
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Persönliche Daten */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Persönliche Daten</h2>
            <div className="flex items-start"> {/* Use flex to align avatar and data grid */}
              <Avatar initials={customer.avatarInitials} color={customer.avatarColor} size="lg" className="mr-6 flex-shrink-0" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 flex-grow"> {/* Two-column grid for data */}
                <DataRow Icon={UserIcon} label="Vorname" value={customer.firstName} />
                <DataRow Icon={UserIcon} label="Nachname" value={customer.lastName} />
                <DataRow Icon={MailIcon} label="E-Mail" value={customer.email} />
                <DataRow Icon={PhoneIcon} label="Telefon" value={customer.phone} />
                <DataRow Icon={HeartIcon} label="Hund" value={customer.dogName} />
                <DataRow Icon={CreditCardIcon} label="Chipnummer" value={customer.chipNumber} />
              </div>
            </div>
          </Card>

          {/* Konto-Übersicht (Summary Cards) */}
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

          {/* Ausbildungsfortschritt */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ausbildungsfortschritt</h2>
            <div className="space-y-6">
              {customer.trainingProgress.map((section) => {
                let headerBgClass = 'bg-gray-50'; // Default fallback
                let levelCircleBgClass = 'bg-gray-400';

                // Determine header background color based on level name (User's specified colors)
                switch (section.name) {
                    case TrainingLevelEnum.EINSTEIGER:
                        headerBgClass = 'bg-fuchsia-50'; // Orchid
                        break;
                    case TrainingLevelEnum.GRUNDLAGEN:
                        headerBgClass = 'bg-lime-50';    // Lime Green
                        break;
                    case TrainingLevelEnum.FORTGESCHRITTENE:
                        headerBgClass = 'bg-sky-50';     // Sky Blue
                        break;
                    case TrainingLevelEnum.MASTERCLASS:
                        headerBgClass = 'bg-amber-50';   // Peru
                        break;
                    case TrainingLevelEnum.EXPERT:
                        headerBgClass = 'bg-indigo-50';  // Indigo
                        break;
                    default:
                        headerBgClass = 'bg-gray-50';
                        break;
                }

                // Determine inner circle color for the level number (based on ID and User's specified colors)
                switch (section.name) {
                  case TrainingLevelEnum.EINSTEIGER:
                      levelCircleBgClass = 'bg-fuchsia-500'; // Orchid
                      break;
                  case TrainingLevelEnum.GRUNDLAGEN:
                      levelCircleBgClass = 'bg-lime-500';    // Lime Green
                      break;
                  case TrainingLevelEnum.FORTGESCHRITTENE:
                      levelCircleBgClass = 'bg-sky-500';     // Sky Blue
                      break;
                  case TrainingLevelEnum.MASTERCLASS:
                      levelCircleBgClass = 'bg-amber-500';   // Peru
                      break;
                  case TrainingLevelEnum.EXPERT:
                      levelCircleBgClass = 'bg-indigo-500';  // Indigo
                      break;
                  default:
                      levelCircleBgClass = 'bg-gray-500';
                      break;
              }


                const isExpanded = expandedSections[section.id];

                return (
                  <div key={section.id} className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    {/* Header Container */}
                    <button
                      className={`p-4 flex items-center justify-between w-full text-left ${headerBgClass}`}
                      onClick={() => toggleSection(section.id)}
                      aria-expanded={isExpanded}
                      aria-controls={`section-content-${section.id}`}
                    >
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <span className={`flex items-center justify-center h-8 w-8 rounded-full text-white font-bold text-base mr-3 ${levelCircleBgClass}`}>
                          {section.id}
                        </span>
                        {section.name}
                      </h3>
                      <div className="flex items-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(section.status)} mr-2`}>
                          {section.status}
                        </span>
                        <ChevronDownIcon className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {/* Patches Container */}
                    <div id={`section-content-${section.id}`} className={`${isExpanded ? 'block' : 'hidden'} p-4 bg-white border-t border-gray-200`}>
                      {section.name === TrainingLevelEnum.EXPERT ? (
                        (() => {
                          const currentHours = section.completedHours;
                          const fullMilestones = Math.floor(currentHours / 100);
                          const remainingHours = currentHours % 100;

                          return (
                            <>
                              <p className="text-sm text-gray-600 mb-3">
                                Fortschritt: {currentHours} Trails absolviert im Expert-Status
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {/* Render full 100-hour milestone badges */}
                                {Array.from({ length: fullMilestones }).map((_, i) => (
                                  <HundredHourMilestoneBadge key={`milestone-${i}`} milestoneNumber={i + 1} />
                                ))}

                                {/* Render individual paw icons for remaining hours */}
                                {Array.from({ length: remainingHours }).map((_, i) => (
                                  <TrainingPawIcon key={`paw-${i}`} filled={true} />
                                ))}
                                {/* No empty paw icons for Expert status, as it's continuous progression */}
                              </div>
                            </>
                          );
                        })()
                      ) : (
                        <>
                          <p className="text-sm text-gray-600 mb-3">
                            Fortschritt: {section.completedHours} / {section.requiredHours} Trails
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {Array.from({ length: section.completedHours }).map((_, i) => (
                              <TrainingPawIcon key={i} filled={true} />
                            ))}
                            {Array.from({ length: section.requiredHours - section.completedHours }).map((_, i) => (
                              <TrainingPawIcon key={`empty-${i}`} filled={false} />
                            ))}
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

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Konto-Übersicht (Detailed) */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Konto-Übersicht</h2>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between">
                <span>Guthaben</span>
                <span className="font-semibold">{customer.balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
              </div>
              <div className="flex justify-between">
                <span>Transaktionen</span>
                <span className="font-semibold">{customer.totalTransactions}</span>
              </div>
              <div className="flex justify-between">
                <span>Erstellt am</span>
                <span className="font-semibold">{customer.createdAt}</span>
              </div>
              {/* Removed 'Erstellt von' row */}
              <div className="flex justify-between">
                <span>Kunden-ID</span> {/* Added new row for Customer ID */}
                <span className="font-semibold">{customer.id}</span>
              </div>
            </div>
          </Card>

          {/* QR-Code */}
          <Card className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">QR-Code</h2>
            <QRCodeDisplay dataUrl={customer.qrCodeData} className="mb-3" />
            <p className="text-sm text-gray-600">
              Scannen, um diese Kundenkarte schnell aufzurufen.
            </p>
          </Card>
        </div>
      </div>

      <TransactionConfirmationModal
        isOpen={showConfirmationModal} // Use the new state
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
