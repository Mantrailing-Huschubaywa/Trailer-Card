
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import QRCodeDisplay from '../components/QRCodeDisplay';
import TransactionConfirmationModal from '../components/TransactionConfirmationModal';
import TransactionTypeSelectionModal from '../components/TransactionTypeSelectionModal';
import TransactionDetailsInputModal from '../components/TransactionDetailsInputModal';
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
} from '../components/Icons';
import Input from '../components/Input';
import { REFERENCE_DATE, TRAINING_LEVEL_DEFINITIONS } from '../constants';
import { Customer, TrainingLevelEnum, TransactionConfirmationData, Transaction, User, UserRoleEnum, DbCustomerProfile, DbTransaction, DbTrainingProgress } from '../types';
import { supabase } from '../supabaseClient';
import { parseDateString } from '../utils';

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
  customers: Customer[]; // Wird zur Ermittlung von Mitarbeiternamen verwendet
  allTransactions: Transaction[]; // Alle Transaktionen für Berichte/Mitarbeiterzuordnung
  onUpdateCustomer: (updatedCustomer: Customer) => void;
  onAddTransaction: (newTransaction: Transaction) => void;
  currentUser: User | null;
  onRefreshData: () => Promise<void>; // Prop zur Auslösung der Datenaktualisierung in App.tsx
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({
  customers,
  allTransactions,
  onUpdateCustomer,
  onAddTransaction,
  currentUser,
  onRefreshData,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showTransactionTypeModal, setShowTransactionTypeModal] = useState(false);
  const [selectedTransactionType, setSelectedTransactionType] = useState<'Aufladung' | 'Abbuchung' | null>(null);
  const [showTransactionDetailsInputModal, setShowTransactionDetailsInputModal] = useState(false);
  const [transactionData, setTransactionData] = useState<TransactionConfirmationData | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status für editierbare Felder
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDogName, setEditDogName] = useState('');
  const [editChipNumber, setEditChipNumber] = useState('');

  // Status zur Verwaltung erweiterter/reduzierter Abschnitte
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});


  const fetchCustomerDetails = async (customerId: string, authUserId: string | null) => {
    setIsLoadingCustomer(true);
    setError(null);
    try {
      // 1. Kundenprofil abrufen
      const { data: customerProfileData, error: customerProfileError } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customerProfileError && customerProfileError.code !== 'PGRST116') { // PGRST116 bedeutet "keine Zeilen gefunden"
        throw customerProfileError;
      }

      let currentCustomerProfile: DbCustomerProfile | null = customerProfileData;

      // Wenn Kunde eingeloggt UND kein Profil existiert, erstelle eines
      if (currentUser?.role === UserRoleEnum.KUNDE && authUserId && !currentCustomerProfile) {
        const { data: newProfileData, error: newProfileError } = await supabase
          .from('customer_profiles')
          .insert({ auth_user_id: authUserId, qr_code_data: `https://example.com/customer/${customerId}` }) // Vereinfachte QR-Code-Daten
          .select()
          .single();

        if (newProfileError) {
          throw newProfileError;
        }
        currentCustomerProfile = newProfileData;
        await onRefreshData(); // Globale Daten nach Profilerstellung aktualisieren
        alert('Ihr Kundenprofil wurde automatisch erstellt. Bitte füllen Sie Ihre Daten aus.');
      } else if (!currentCustomerProfile) {
        // Wenn kein Profil vorhanden ist und kein automatisch erstellter Kundenbenutzer, wurde der Kunde nicht gefunden.
        setError(`Kunde mit ID "${customerId}" nicht gefunden.`);
        setCustomer(null);
        setIsLoadingCustomer(false);
        return;
      }

      // Die E-Mail des Kunden wird jetzt aus dem `Customer`-Objekt in `App.tsx` bezogen
      // und sollte über die `customers`-Liste oder `currentUser` in `props` verfügbar sein.
      const customerEmail = customers.find(c => c.id === customerId)?.email || 'Nicht verfügbar';


      // 3. Transaktionen für diesen Kunden abrufen
      const { data: dbTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_profile_id', customerId);

      if (transactionsError) {
        throw transactionsError;
      }

      const transformedTransactions: Transaction[] = dbTransactions.map(dbTrx => {
        const employee = customers.find(emp => emp.authUserId === dbTrx.created_by_user_id);
        return {
          id: dbTrx.id,
          customerId: dbTrx.customer_profile_id,
          employeeId: dbTrx.created_by_user_id,
          type: dbTrx.type,
          description: dbTrx.description || (dbTrx.type === 'recharge' ? 'Aufladung' : 'Trails'),
          amount: dbTrx.amount,
          date: parseDateString(dbTrx.created_at)?.toLocaleDateString('de-DE') || dbTrx.created_at,
          employee: employee ? `${employee.firstName} ${employee.lastName}` : 'System',
        };
      });

      const currentBalance = transformedTransactions.reduce((sum, trx) => {
        return trx.type === 'recharge' ? sum + trx.amount : sum - trx.amount;
      }, 0);

      // 4. Trainingsfortschritt für diesen Kunden abrufen
      const { data: dbTrainingProgress, error: trainingProgressError } = await supabase
        .from('training_progress')
        .select('*')
        .eq('customer_profile_id', customerId);

      if (trainingProgressError && trainingProgressError.code !== 'PGRST116') {
        throw trainingProgressError;
      }

      let currentTrainingProgress: DbTrainingProgress[] = dbTrainingProgress || [];

      // Wenn keine Trainingsfortschrittseinträge existieren, initiale erstellen
      if (currentTrainingProgress.length === 0) {
        const initialProgressInserts = TRAINING_LEVEL_DEFINITIONS.map(level => ({
          customer_profile_id: customerId,
          level_name: level.name,
          completed_trails: 0,
          status: level.id === 1 ? 'Aktuell' : 'Gesperrt',
        }));
        const { data: newProgressData, error: newProgressError } = await supabase
          .from('training_progress')
          .insert(initialProgressInserts)
          .select();
        
        if (newProgressError) {
          console.error('Fehler beim Initialisieren des Ausbildungsfortschritts:', newProgressError.message);
          setError('Fehler beim Initialisieren des Ausbildungsfortschritts.');
          setIsLoadingCustomer(false);
          return;
        }
        currentTrainingProgress = newProgressData;
      }

      // Trainingsfortschritt für die UI transformieren
      const trainingProgressForUI = TRAINING_LEVEL_DEFINITIONS.map(levelDef => {
        const customerLevelProgress = currentTrainingProgress.find(p => p.level_name === levelDef.name);
        return {
          id: levelDef.id,
          dbId: customerLevelProgress?.id || '', // DB PK speichern
          name: levelDef.name,
          requiredHours: levelDef.requiredHours,
          completedHours: customerLevelProgress?.completed_trails || 0,
          status: customerLevelProgress?.status || (levelDef.id === 1 ? 'Aktuell' : 'Gesperrt'),
        };
      }).sort((a, b) => a.id - b.id); // Richtige Reihenfolge sicherstellen

      const currentOverallLevel = trainingProgressForUI.find(p => p.status === 'Aktuell')?.name || TrainingLevelEnum.EINSTEIGER;

      // Avatar-Initialen und Farbe aus den globalen Kunden-Props oder Ableitung
      const customerFromProps = customers.find(c => c.id === customerId);
      const initials = customerFromProps?.avatarInitials || `${currentCustomerProfile.first_name?.charAt(0) || ''}${currentCustomerProfile.last_name?.charAt(0) || ''}`.toUpperCase().slice(0, 2);
      const avatarColor = customerFromProps?.avatarColor || `bg-${['blue', 'green', 'orange', 'red', 'purple', 'indigo'][Math.floor(Math.random() * 6)]}-500`;

      const finalCustomer: Customer = {
        id: customerId,
        authUserId: currentCustomerProfile.auth_user_id,
        avatarInitials: initials,
        avatarColor: avatarColor,
        firstName: currentCustomerProfile.first_name || '',
        lastName: currentCustomerProfile.last_name || '',
        email: customerEmail, // Verwenden der von App.tsx bereitgestellten E-Mail
        phone: currentCustomerProfile.phone || '',
        dogName: currentCustomerProfile.dog_name || '',
        chipNumber: currentCustomerProfile.chip_number || '',
        qrCodeData: currentCustomerProfile.qr_code_data || '',
        balance: currentBalance,
        totalTransactions: transformedTransactions.length,
        level: currentOverallLevel,
        createdAt: parseDateString(currentCustomerProfile.created_at || new Date().toISOString())?.toLocaleDateString('de-DE') || '-',
        documents: [], // Nicht von DB implementiert
        trainingProgress: trainingProgressForUI,
      };

      setCustomer(finalCustomer);
      // Bearbeitungszustände initialisieren
      setEditFirstName(finalCustomer.firstName);
      setEditLastName(finalCustomer.lastName);
      setEditPhone(finalCustomer.phone);
      setEditDogName(finalCustomer.dogName);
      setEditChipNumber(finalCustomer.chipNumber);

      // Erweiterte Abschnitte initialisieren
      setExpandedSections(prev => {
        const newExpanded = { ...prev };
        trainingProgressForUI.forEach(section => {
          if (newExpanded[section.id] === undefined) {
            newExpanded[section.id] = false;
          }
        });
        return newExpanded;
      });

    } catch (err: any) {
      console.error('Fehler beim Abrufen der Kundendetails:', err.message);
      setError(`Fehler beim Laden der Kundendaten: ${err.message}`);
      setCustomer(null);
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  useEffect(() => {
    if (id) {
      // Für Kundenrollen sicherstellen, dass sie nur ihr eigenes Profil sehen können
      if (currentUser?.role === UserRoleEnum.KUNDE && currentUser.associatedCustomerId !== id) {
        navigate(`/customers/${currentUser.associatedCustomerId}`, { replace: true });
        return;
      }
      fetchCustomerDetails(id, currentUser?.id || null);
    } else {
      setError('Keine Kunden-ID in der URL gefunden.');
      setCustomer(null);
    }
  }, [id, currentUser?.id, currentUser?.role, currentUser?.associatedCustomerId, customers]); // Re-Run, wenn ID oder currentUser oder customers ändert


  if (isLoadingCustomer) {
    return (
      <div className="p-8 text-center text-gray-600">
        Lade Kundendaten...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        {error}
        <Button variant="primary" onClick={() => navigate('/customers')} className="mt-4">
          Zurück zur Kundenliste
        </Button>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center text-gray-600">
        Kunde nicht gefunden oder nicht verfügbar.
        <Button variant="primary" onClick={() => navigate('/customers')} className="mt-4">
          Zurück zur Kundenliste
        </Button>
      </div>
    );
  }

  // Diese Funktion öffnet nun speziell das *Bestätigungs*-Modal
  const handleOpenConfirmationModal = (amount: number, type: 'Aufladung' | 'Abbuchung', description?: string) => {
    if (!customer) return; // Sollte mit den aktuellen Prüfungen nicht passieren

    const oldBalance = customer.balance;
    const newBalance = type === 'Aufladung' ? oldBalance + amount : oldBalance - amount;
    setTransactionData({
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      employee: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'System',
      transactionType: type,
      amount: amount,
      oldBalance: oldBalance,
      newBalance: newBalance,
      description: description, // Beschreibung übergeben
    });
    setShowConfirmationModal(true);
  };

  // Neue Funktion zur Handhabung der Auswahl des Transaktionstyps aus dem TransactionTypeSelectionModal
  const handleSelectTransactionType = (type: 'Aufladung' | 'Abbuchung') => {
    setSelectedTransactionType(type);
    setShowTransactionTypeModal(false); // Das initiale Typauswahl-Modal schließen
    setShowTransactionDetailsInputModal(true); // Das neue Detail-Eingabe-Modal öffnen
  };

  // Neue Funktion zur Handhabung der Bestätigung von Transaktionsdetails aus dem TransactionDetailsInputModal
  const handleConfirmTransactionDetails = (amount: number, description: string) => {
    if (!selectedTransactionType || !customer) return; // Sollte nicht passieren

    // Die vorhandene handleOpenConfirmationModal mit allen gesammelten Daten aufrufen
    handleOpenConfirmationModal(amount, selectedTransactionType, description);
    setShowTransactionDetailsInputModal(false); // Das Detail-Eingabe-Modal schließen
    setSelectedTransactionType(null); // Ausgewählten Typ nach Initiierung der Bestätigung zurücksetzen
  };

  const handleConfirmTransaction = async () => {
    if (!transactionData || !customer || !currentUser) {
      alert('Transaktionsdaten oder Benutzer fehlen.');
      return;
    }

    try {
      // 1. Neue Transaktion einfügen
      const { error: insertTransactionError } = await supabase
        .from('transactions')
        .insert({
          customer_profile_id: customer.id,
          created_by_user_id: currentUser.id,
          type: transactionData.transactionType === 'Aufladung' ? 'recharge' : 'debit',
          description: transactionData.description || (transactionData.transactionType === 'Aufladung' ? 'Aufladung' : 'Trails'),
          amount: transactionData.amount,
          created_at: new Date().toISOString(),
        });

      if (insertTransactionError) {
        throw insertTransactionError;
      }

      // 2. Trainingsfortschritt aktualisieren, wenn es sich um eine 'Trails'-Abbuchung handelt
      const isRecharge = transactionData.transactionType === 'Aufladung';
      // Angepasste Abbuchungsprüfung: Angenommen, transactionData.amount stellt die Anzahl der Trails dar, wenn die Beschreibung 'Trails' ist
      const isTrailDebit = !isRecharge && transactionData.description === 'Trails' && transactionData.amount > 0;

      if (isTrailDebit) {
        const currentTrainingProgress = [...customer.trainingProgress];
        let customerOverallLevel = customer.level;

        const currentLevelIndex = currentTrainingProgress.findIndex(
          (section) => section.status === 'Aktuell'
        );

        if (currentLevelIndex !== -1) {
          const currentSection = { ...currentTrainingProgress[currentLevelIndex] };

          // Für das Expert-Level können die completedHours die requiredHours überschreiten
          if (currentSection.name === TrainingLevelEnum.EXPERT) {
            currentSection.completedHours += transactionData.amount; // Abgebuchte Menge direkt zu den abgeschlossenen Trails für Expert hinzufügen
          } else if (currentSection.completedHours < currentSection.requiredHours) {
            // Abgeschlossene Stunden um den abgebuchten Betrag erhöhen (angenommen, der Betrag ist hier die Anzahl der Trails)
            const trailsDebited = transactionData.amount;
            currentSection.completedHours += trailsDebited; 

            if (currentSection.completedHours >= currentSection.requiredHours) { // Prüfen, ob die Anforderungen erfüllt oder überschritten wurden
              currentSection.status = 'Abgeschlossen';

              const nextLevelIndex = currentLevelIndex + 1;
              if (nextLevelIndex < currentTrainingProgress.length) {
                const nextSection = { ...currentTrainingProgress[nextLevelIndex] };
                nextSection.status = 'Aktuell';
                customerOverallLevel = nextSection.name;
                currentTrainingProgress[nextLevelIndex] = nextSection;
              }
            }
          }

          // DB-Eintrag für den aktuellen Abschnitt aktualisieren
          const { error: updateProgressError } = await supabase
            .from('training_progress')
            .update({
              completed_trails: currentSection.completedHours,
              status: currentSection.status,
              level_name: currentSection.name, // Sicherstellen, dass level_name bei der Aktualisierung korrekt gesetzt ist
            })
            .eq('id', currentSection.dbId);

          if (updateProgressError) {
            throw updateProgressError;
          }

          // Wenn sich das Level geändert hat, sicherstellen, dass customer.level dies widerspiegelt (obwohl nicht in customer_profiles gespeichert)
          // Das `level` im Kundenobjekt wird abgeleitet, aber diese Logik hilft, es in der UI temporär zu aktualisieren.
          if (customerOverallLevel !== customer.level) {
            // Den Status anderer Abschnitte aktualisieren, falls erforderlich (z.B. wenn ein neues Level 'Aktuell' wurde)
            for(const section of currentTrainingProgress) {
              if (section.id !== currentSection.id) {
                await supabase.from('training_progress').update({status: section.status}).eq('id', section.dbId);
              }
            }
          }
        }
      }

      alert('Transaktion erfolgreich gebucht!');
      setShowConfirmationModal(false);
      setTransactionData(null);
      await onRefreshData(); // Vollständige Datenaktualisierung in App.tsx auslösen

    } catch (err: any) {
      console.error('Fehler beim Bestätigen der Transaktion:', err.message);
      alert(`Fehler beim Buchen der Transaktion: ${err.message}`);
    }
  };

  const handleUpdateProfile = async () => {
    if (!customer) return;

    try {
      const { error: updateError } = await supabase
        .from('customer_profiles')
        .update({
          first_name: editFirstName,
          last_name: editLastName,
          phone: editPhone,
          dog_name: editDogName,
          chip_number: editChipNumber,
        })
        .eq('id', customer.id);

      if (updateError) {
        throw updateError;
      }

      alert('Kundenprofil erfolgreich aktualisiert!');
      setIsEditingProfile(false);
      await onRefreshData(); // Globale Daten aktualisieren, um ggf. Kundenliste zu aktualisieren

    } catch (err: any) {
      console.error('Fehler beim Aktualisieren des Kundenprofils:', err.message);
      alert(`Fehler beim Aktualisieren des Profils: ${err.message}`);
    }
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

  // Hilfskomponente für eine konsistente Datenzeile
  const DataRow: React.FC<{ Icon: React.ElementType; label: string; value: string | number; editable?: boolean; editValue?: string; onEditChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ Icon, label, value, editable, editValue, onEditChange }) => (
    <div>
      <div className="flex items-center text-gray-500 mb-1">
        <Icon className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {editable ? (
        <Input
          id={`edit-${label.replace(/\s/g, '')}`}
          type="text"
          value={editValue || ''}
          onChange={onEditChange}
          className="ml-6 mt-1 p-1 text-sm bg-gray-50 border border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      ) : (
        <p className="font-semibold text-gray-900 ml-6">{value}</p>
      )}
    </div>
  );

  const toggleSection = (sectionId: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Hilfsprogramm zur Ermittlung der Farben für die Level-Übersichtskarte basierend auf TrainingLevelEnum
  const getLevelSummaryCardColors = (level: TrainingLevelEnum) => {
    switch (level) {
      case TrainingLevelEnum.EINSTEIGER:
        return { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', icon: 'text-fuchsia-700' };
      case TrainingLevelEnum.GRUNDLAGEN:
        return { bg: 'bg-lime-50', text: 'text-lime-700', icon: 'text-lime-700' };
      case TrainingLevelEnum.FORTGESCHRITTENE:
        return { bg: 'bg-sky-50', text: 'text-sky-700', icon: 'text-sky-700' };
      case TrainingLevelEnum.MASTERCLASS:
        return { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-700' };
      case TrainingLevelEnum.EXPERT:
        return { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-700' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700', icon: 'text-gray-700' };
    }
  };

  const levelSummaryColors = getLevelSummaryCardColors(customer.level);

  // Feststellen, ob der aktuelle Benutzer die Berechtigung hat, Aktionen durchzuführen (Admin oder Mitarbeiter oder eigener Kunde)
  const canPerformActions = currentUser?.role === UserRoleEnum.ADMIN || currentUser?.role === UserRoleEnum.MITARBEITER || (currentUser?.role === UserRoleEnum.KUNDE && currentUser.associatedCustomerId === customer.id);
  const canEditProfile = currentUser?.role === UserRoleEnum.ADMIN || currentUser?.role === UserRoleEnum.MITARBEITER || (currentUser?.role === UserRoleEnum.KUNDE && currentUser.associatedCustomerId === customer.id);
  const canMakeTransactions = currentUser?.role === UserRoleEnum.ADMIN || currentUser?.role === UserRoleEnum.MITARBEITER; // Nur Mitarbeiter/Admin können Transaktionen durchführen

  return (
    <div className="p-6 md:p-8 lg:p-10 min-h-screen">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center">
          {currentUser?.role !== UserRoleEnum.KUNDE && (
            <button onClick={() => navigate('/customers')} className="text-gray-500 hover:text-gray-700 mr-4">
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            {customer.firstName} {customer.lastName}
            <span className="text-gray-500 font-normal text-base ml-2">Kundendetails & Übersicht</span>
          </h1>
        </div>
        {canPerformActions && (
          <div className="flex space-x-3">
            {canEditProfile && (
              isEditingProfile ? (
                <>
                  <Button variant="secondary" onClick={() => setIsEditingProfile(false)}>
                    Abbrechen
                  </Button>
                  <Button variant="primary" onClick={handleUpdateProfile}>
                    Speichern
                  </Button>
                </>
              ) : (
                <Button variant="outline" icon={EditIcon} onClick={() => setIsEditingProfile(true)}>
                  Stammdaten bearbeiten
                </Button>
              )
            )}
            {canMakeTransactions && (
              <Button variant="success" onClick={() => setShowTransactionTypeModal(true)}>
                Transaktionen
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Linke Spalte */}
        <div className="lg:col-span-2 space-y-6">
          {/* Persönliche Daten */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Persönliche Daten</h2>
            <div className="flex items-start">
              <Avatar initials={customer.avatarInitials} color={customer.avatarColor} size="lg" className="mr-6 flex-shrink-0" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 flex-grow">
                <DataRow Icon={UserIcon} label="Vorname" value={customer.firstName} editable={isEditingProfile} editValue={editFirstName} onEditChange={(e) => setEditFirstName(e.target.value)} />
                <DataRow Icon={UserIcon} label="Nachname" value={customer.lastName} editable={isEditingProfile} editValue={editLastName} onEditChange={(e) => setEditLastName(e.target.value)} />
                <DataRow Icon={MailIcon} label="E-Mail" value={customer.email} /> {/* E-Mail ist read-only */}
                <DataRow Icon={PhoneIcon} label="Telefon" value={customer.phone} editable={isEditingProfile} editValue={editPhone} onEditChange={(e) => setEditPhone(e.target.value)} />
                <DataRow Icon={HeartIcon} label="Hund" value={customer.dogName} editable={isEditingProfile} editValue={editDogName} onEditChange={(e) => setEditDogName(e.target.value)} />
                <DataRow Icon={CreditCardIcon} label="Chipnummer" value={customer.chipNumber} editable={isEditingProfile} editValue={editChipNumber} onEditChange={(e) => setEditChipNumber(e.target.value)} />
              </div>
            </div>
          </Card>

          {/* Konto-Übersicht (Zusammenfassungskarten) */}
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
                let headerBgClass = 'bg-gray-50';
                let levelCircleBgClass = 'bg-gray-400';

                switch (section.name) {
                    case TrainingLevelEnum.EINSTEIGER:
                        headerBgClass = 'bg-fuchsia-50';
                        break;
                    case TrainingLevelEnum.GRUNDLAGEN:
                        headerBgClass = 'bg-lime-50';
                        break;
                    case TrainingLevelEnum.FORTGESCHRITTENE:
                        headerBgClass = 'bg-sky-50';
                        break;
                    case TrainingLevelEnum.MASTERCLASS:
                        headerBgClass = 'bg-amber-50';
                        break;
                    case TrainingLevelEnum.EXPERT:
                        headerBgClass = 'bg-indigo-50';
                        break;
                    default:
                        headerBgClass = 'bg-gray-50';
                        break;
                }

                switch (section.name) {
                  case TrainingLevelEnum.EINSTEIGER:
                      levelCircleBgClass = 'bg-fuchsia-500';
                      break;
                  case TrainingLevelEnum.GRUNDLAGEN:
                      levelCircleBgClass = 'bg-lime-500';
                      break;
                  case TrainingLevelEnum.FORTGESCHRITTENE:
                      levelCircleBgClass = 'bg-sky-500';
                      break;
                  case TrainingLevelEnum.MASTERCLASS:
                      levelCircleBgClass = 'bg-amber-500';
                      break;
                  case TrainingLevelEnum.EXPERT:
                      levelCircleBgClass = 'bg-indigo-500';
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
                                {/* Vollständige 100-Stunden-Meilenstein-Abzeichen rendern */}
                                {Array.from({ length: fullMilestones }).map((_, i) => (
                                  <HundredHourMilestoneBadge key={`milestone-${i}`} milestoneNumber={i + 1} />
                                ))}

                                {/* Einzelne Pfoten-Icons für verbleibende Stunden rendern */}
                                {Array.from({ length: remainingHours }).map((_, i) => (
                                  <TrainingPawIcon key={`paw-${i}`} filled={true} />
                                ))}
                                {/* Keine leeren Pfoten-Icons für den Expert-Status, da es eine kontinuierliche Progression ist */}
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

        {/* Rechte Spalte */}
        <div className="lg:col-span-1 space-y-6">
          {/* Konto-Übersicht (Detailliert) */}
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
              <div className="flex justify-between">
                <span>Kunden-ID</span>
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

      {/* Neues Modal zur Eingabe von Transaktionsdetails nach der Typauswahl */}
      {selectedTransactionType && (
        <TransactionDetailsInputModal
          isOpen={showTransactionDetailsInputModal}
          onClose={() => {
            setShowTransactionDetailsInputModal(false);
            setSelectedTransactionType(null); // Ausgewählten Typ zurücksetzen, wenn Modal ohne Bestätigung geschlossen wird
          }}
          transactionType={selectedTransactionType}
          onConfirmDetails={handleConfirmTransactionDetails}
        />
      )}
    </div>
  );
};

export default CustomerDetails;