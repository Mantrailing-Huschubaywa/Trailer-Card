
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CustomerManagement from './pages/CustomerManagement';
import CustomerDetails from './pages/CustomerDetails';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import LoginPage from './pages/LoginPage';
import { Customer, Transaction, TrainingLevelEnum, User, UserRoleEnum, TrainingSection } from './types';
import { REFERENCE_DATE } from './constants';
import { USE_MOCK_DATA } from './config';
import { getSupabaseClient } from './supabaseClient';
import { getAvatarColorForLevel } from './utils';
import Button from './components/Button';
import { PlusIcon, CheckCircleIcon } from './components/Icons';

// Helper function to safely parse customer data from Supabase
const parseCustomerData = (c: any): Customer => {
  let trainingProgress: TrainingSection[] = c.trainingProgress;
  // Supabase returns JSONB columns as strings, so we need to parse them.
  if (typeof trainingProgress === 'string') {
    try {
      trainingProgress = JSON.parse(trainingProgress);
    } catch (e) {
      console.error("Fehler beim Parsen von trainingProgress für Kunde:", c.id, e);
      trainingProgress = []; // Fallback auf ein leeres Array bei einem Fehler
    }
  }

  // Korrigieren Sie Level und Avatar-Farbe basierend auf den aktuellen Trails bei jedem Laden
  const totalTrails = trainingProgress.reduce((sum, section) => sum + section.completedHours, 0);
  
  let level: TrainingLevelEnum;
  if (totalTrails <= 12) {
    level = TrainingLevelEnum.EINSTEIGER;
  } else if (totalTrails <= 24) {
    level = TrainingLevelEnum.GRUNDLAGEN;
  } else if (totalTrails <= 36) {
    level = TrainingLevelEnum.FORTGESCHRITTENE;
  } else if (totalTrails <= 49) {
    level = TrainingLevelEnum.MASTERCLASS;
  } else {
    level = TrainingLevelEnum.EXPERT;
  }
  
  return { 
    ...c, 
    trainingProgress, 
    level, // Stellen Sie sicher, dass das Level auch aktuell ist
    avatarColor: getAvatarColorForLevel(level), // Legen Sie die korrekte Avatar-Farbe fest
  };
};

// Mobile Header Component
const MobileHeader: React.FC<{ onToggleSidebar: () => void }> = ({ onToggleSidebar }) => (
  <header className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between p-3 bg-[#00A1D6] text-white shadow-md h-16">
    <button onClick={onToggleSidebar} className="p-2" aria-label="Menü öffnen">
      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
    <div className="flex items-center">
      <img src="https://hs-bw.com/wp-content/uploads/2026/02/Trailer-Card-App-icon.png" alt="App Logo" className="h-10 w-10 mr-2 rounded-[10px]" />
      <span className="text-xl font-bold">Mantrailing Card</span>
    </div>
    {/* Placeholder to balance the flexbox layout */}
    <div className="w-10"></div>
  </header>
);

// Install Prompt Banner Component
const InstallPrompt: React.FC<{ onInstall: () => void; onDismiss: () => void; }> = ({ onInstall, onDismiss }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 shadow-lg z-50 flex items-center justify-between animate-fade-in-up">
    <div className="flex items-center">
      <img src="https://hs-bw.com/wp-content/uploads/2026/02/Trailer-Card-App-icon.png" alt="App Logo" className="h-10 w-10 mr-4 rounded-[10px]" />
      <div>
        <h4 className="font-bold">App installieren</h4>
        <p className="text-sm text-gray-300">Für schnellen Zugriff auf Ihrem Gerät hinzufügen.</p>
      </div>
    </div>
    <div className="flex space-x-2">
      <Button onClick={onDismiss} variant="ghost" size="sm" className="text-gray-300 hover:bg-gray-700">Später</Button>
      <Button onClick={onInstall} variant="primary" size="sm" icon={PlusIcon}>Installieren</Button>
    </div>
  </div>
);


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]); // For UserManagement page (staff)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation(); // Get current location for deep linking
  const supabase = getSupabaseClient();

  const toggleMobileSidebar = () => setIsMobileSidebarOpen(prev => !prev);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  // Effect for PWA installation prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Prevent the default browser prompt
      setInstallPromptEvent(e); // Store the event
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Clean up the event listener
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (installPromptEvent) {
      installPromptEvent.prompt(); // Show the installation prompt
      installPromptEvent.userChoice.then((choiceResult: { outcome: 'accepted' | 'dismissed' }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Benutzer hat die Installation akzeptiert');
        } else {
          console.log('Benutzer hat die Installation abgelehnt');
        }
        setInstallPromptEvent(null); // The prompt can only be used once
      });
    }
  };

  const handleDismissInstall = () => {
    setInstallPromptEvent(null);
  };

  // Effect 1: Manages the session from Supabase auth. This is the single source of truth for auth state.
  useEffect(() => {
    if (!supabase || USE_MOCK_DATA) {
      setIsLoading(false);
      navigate('/login');
      return;
    }
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsUpdatingPassword(true);
      } else if (event === 'USER_UPDATED' || event === 'SIGNED_IN') {
        setIsUpdatingPassword(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, navigate]);

  // Effect 2: Fetches data when the session changes and handles post-login navigation.
  useEffect(() => {
    if (!supabase) return;

    if (isUpdatingPassword) {
      setIsLoading(false);
      return;
    }

    const fetchInitialData = async (currentSession: Session) => {
      setIsLoading(true);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentSession.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }
      
      const loggedInUser: User = {
        id: profileData.id,
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email,
        role: profileData.role as UserRoleEnum,
        associatedCustomerId: profileData.associatedCustomerId,
        avatarInitials: `${(profileData.firstName || '?').charAt(0)}${(profileData.lastName || '?').charAt(0)}`.toUpperCase(),
        avatarColor: 'bg-orange-500',
        created_at: new Date(profileData.created_at || Date.now()).toLocaleDateString('de-DE'),
      };
      setCurrentUser(loggedInUser);

      if (loggedInUser.role !== UserRoleEnum.KUNDE) {
        const { data: customersData, error: customersError } = await supabase.from('customers').select('*');
        if (customersError) console.error("Error fetching customers:", customersError.message);

        const { data: transactionsData, error: transactionsError } = await supabase.from('transactions').select('*');
        if (transactionsError) console.error("Error fetching transactions:", transactionsError.message);

        setCustomers(customersData?.map(parseCustomerData) || []);
        setTransactions(transactionsData || []);

        if (loggedInUser.role === UserRoleEnum.ADMIN) {
          const { data: staffData, error: staffError } = await supabase.from('profiles').select('*').in('role', ['Admin', 'Mitarbeiter']);
           if (staffError) console.error("Error fetching staff:", staffError.message);
          setUsers(staffData?.map(p => ({
            id: p.id,
            firstName: p.firstName || '', lastName: p.lastName || '', email: p.email, role: p.role,
            associatedCustomerId: p.associatedCustomerId,
            avatarInitials: `${(p.firstName || '?').charAt(0)}${(p.lastName || '?').charAt(0)}`.toUpperCase(),
            avatarColor: 'bg-orange-500',
            created_at: new Date(p.created_at || Date.now()).toLocaleDateString('de-DE'),
          })) || []);
        }
      } else if (loggedInUser.associatedCustomerId) {
        const { data: customerData } = await supabase.from('customers').select('*').eq('id', loggedInUser.associatedCustomerId).single();
        const { data: customerTransactions } = await supabase.from('transactions').select('*').eq('customerId', loggedInUser.associatedCustomerId);
        setCustomers(customerData ? [parseCustomerData(customerData)] : []);
        setTransactions(customerTransactions || []);
      }
      setIsLoading(false);
    };

    if (session) {
      fetchInitialData(session).then(() => {
        // After data is fetched, handle redirect from login for deep linking.
        if (location.pathname === '/login') {
            const fromLocation = location.state?.from;
            const redirectTo = fromLocation ? (fromLocation.pathname + fromLocation.hash + fromLocation.search) : '/';
            navigate(redirectTo, { replace: true });
        }
      });
    } else {
      // Clear all data on logout
      setCurrentUser(null);
      setCustomers([]);
      setTransactions([]);
      setUsers([]);
      setIsLoading(false);
    }
  }, [session, supabase, isUpdatingPassword]);
  
  // Effect 3: Handles navigation for logged-in customers.
  useEffect(() => {
    if (!isLoading && session && currentUser) {
        if (currentUser.role === UserRoleEnum.KUNDE && currentUser.associatedCustomerId) {
            const expectedPath = `/customers/${currentUser.associatedCustomerId}`;
            if (window.location.hash !== `#${expectedPath}`) {
                navigate(expectedPath, { replace: true });
            }
        }
    }
  }, [isLoading, session, currentUser, navigate]);

  const handleLogin = async (email: string, passwordInput: string): Promise<string | null> => {
    if (!supabase) return "Supabase Client nicht initialisiert.";
    const { error } = await supabase.auth.signInWithPassword({ email, password: passwordInput });
    if (error) {
        console.error("Login Error:", error);
        return error.message;
    }
    return null;
  };

  const handleRegister = async (email: string, password: string): Promise<string | null> => {
    if (!supabase) return "Supabase Client nicht initialisiert.";

    // STEP 1: Define customer data
    const idPrefix = (email.split('@')[0] || 'KUNDE').substring(0, 4).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const associatedCustomerId = `${idPrefix}-${randomSuffix}`;
    const firstName = email.split('@')[0] || 'Neuer';
    const lastName = '(Kunde)';
    const initials = (firstName.substring(0, 2) || '??').toUpperCase();
    
    const targetUrl = `https://trailer-card.vercel.app/#/customers/${associatedCustomerId}`;
    const encodedTargetUrl = encodeURIComponent(targetUrl);
    
    const newCustomerData = {
      id: associatedCustomerId,
      avatarInitials: initials,
      avatarColor: getAvatarColorForLevel(TrainingLevelEnum.EINSTEIGER),
      firstName, lastName, email, phone: '', dogName: '', chipNumber: '',
      balance: 0, totalTransactions: 0, level: TrainingLevelEnum.EINSTEIGER,
      createdBy: 'Registrierung',
      qrCodeData: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodedTargetUrl}`,
      documents: [],
      trainingProgress: JSON.stringify([
        { id: 1, name: TrainingLevelEnum.EINSTEIGER, requiredHours: 12, completedHours: 0, status: 'Aktuell' },
        { id: 2, name: TrainingLevelEnum.GRUNDLAGEN, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
        { id: 3, name: TrainingLevelEnum.FORTGESCHRITTENE, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
        { id: 4, name: TrainingLevelEnum.MASTERCLASS, requiredHours: 13, completedHours: 0, status: 'Gesperrt' },
        { id: 5, name: TrainingLevelEnum.EXPERT, requiredHours: 100, completedHours: 0, status: 'Gesperrt' },
      ]),
    };

   // STEP 2: Create customer record
const { error: customerInsertError } = await supabase.from('customers').insert([newCustomerData]);
if (customerInsertError) {
  console.error("Customer Insert Error:", customerInsertError);

  // Doppelregistrierung hübsch abfangen
  if (customerInsertError.code === '23505' || customerInsertError.message?.includes('customers_email_unique')) {
    return 'Diese E-Mail-Adresse ist bereits registriert. Bitte melden Sie sich mit dieser E-Mail an.';
  }

  return `Fehler beim Erstellen des Kundenprofils: ${customerInsertError.message}`;
}


    // STEP 3: Create auth user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { firstName, lastName, role: UserRoleEnum.KUNDE, associatedCustomerId }
      }
    });

    // STEP 4: Robust error handling
    if (signUpError || !signUpData.user) {
      console.error("Sign-Up Error:", signUpError || 'Kein Benutzerobjekt zurückgegeben.');
      const { error: deleteError } = await supabase.from('customers').delete().eq('id', associatedCustomerId);
      if (deleteError) {
        console.error("CRITICAL: Fehler beim Löschen des verwaisten Kunden:", deleteError);
        return `Registrierung fehlgeschlagen und verwaister Kunde konnte nicht entfernt werden. Bitte kontaktieren Sie den Support. Fehler: ${signUpError?.message || 'Unbekannt'}`;
      }
      return `Registrierungsfehler: ${signUpError?.message || 'Benutzer konnte nicht erstellt werden.'}.`;
    }

    // Success
    return null;
  };


  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    if (!supabase) return;
  
    const { ...customerToUpdate } = updatedCustomer;
    const { error: customerUpdateError } = await supabase.from('customers').update({
      ...customerToUpdate,
      trainingProgress: JSON.stringify(customerToUpdate.trainingProgress)
    }).eq('id', updatedCustomer.id);
  
    if (customerUpdateError) {
      alert(`Fehler beim Speichern der Kundendaten: ${customerUpdateError.message}`);
      return;
    }
  
    setCustomers(prev => prev.map(c => (c.id === updatedCustomer.id ? updatedCustomer : c)));
  
    try {
      const { data: profileData, error: profileFindError } = await supabase
        .from('profiles')
        .select('id')
        .eq('associatedCustomerId', updatedCustomer.id)
        .single();
  
      if (profileData && !profileFindError) {
        const userId = profileData.id;
        
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            firstName: updatedCustomer.firstName,
            lastName: updatedCustomer.lastName,
          })
          .eq('id', userId);
  
        if (profileUpdateError) {
          alert(`Kundendaten wurden gespeichert, aber das zugehörige Benutzerprofil konnte nicht aktualisiert werden: ${profileUpdateError.message}`);
        } else {
          const newAvatarInitials = `${(updatedCustomer.firstName || '?').charAt(0)}${(updatedCustomer.lastName || '?').charAt(0)}`.toUpperCase();
  
          setUsers(prevUsers => prevUsers.map(u => 
            u.id === userId 
              ? { ...u, firstName: updatedCustomer.firstName, lastName: updatedCustomer.lastName, avatarInitials: newAvatarInitials } 
              : u
          ));
  
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(prev => prev ? {
              ...prev, 
              firstName: updatedCustomer.firstName, 
              lastName: updatedCustomer.lastName,
              avatarInitials: newAvatarInitials,
            } : null);
          }
        }
      } 
      else if (profileFindError && profileFindError.code !== 'PGRST116') {
          console.warn(`Fehler bei der Suche nach dem Benutzerprofil für Kunde ${updatedCustomer.id}: ${profileFindError.message}`);
      }
  
    } catch (e) {
      console.error("Ein unerwarteter Fehler ist beim Aktualisieren des Profils aufgetreten.", e);
    }
  };

  const handleAddTransaction = async (newTransaction: Omit<Transaction, 'created_at'>) => {
    if (!supabase) return;
    const { error } = await supabase.from('transactions').insert([newTransaction]);
    if (error) {
        alert(`Fehler beim Buchen der Transaktion: ${error.message}`);
    } else {
        const completeTransaction = { ...newTransaction, created_at: new Date().toISOString() };
        setTransactions(prev => [...prev, completeTransaction]);
    }
  };
  
  const handleDeleteTransactionsByIds = async (transactionIds: string[]) => {
    if (!supabase || transactionIds.length === 0) return;
    const { error } = await supabase.from('transactions').delete().in('id', transactionIds);
    if (error) {
      alert(`Fehler beim Löschen von Transaktionen: ${error.message}`);
    } else {
      setTransactions(prev => prev.filter(t => !transactionIds.includes(t.id)));
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').update({
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
    }).eq('id', updatedUser.id);
    if (error) {
      alert(`Fehler beim Aktualisieren des Benutzers: ${error.message}`);
    } else {
      setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
      if (currentUser && currentUser.id === updatedUser.id) {
        setCurrentUser(prev => prev ? {...prev, ...updatedUser} : null);
      }
    }
  };

  const handleAddUser = (newUser: User) => alert("Neue Mitarbeiter müssen direkt im Supabase Dashboard unter 'Authentication' angelegt und deren Rolle im 'Table Editor' unter 'profiles' zugewiesen werden.");
  const handleDeleteUser = (userId: string) => alert("Das Löschen von Mitarbeitern muss aus Sicherheitsgründen direkt im Supabase Dashboard erfolgen.");

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700">Mantrailing Card wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {session && currentUser && !isUpdatingPassword ? (
        <>
          <MobileHeader onToggleSidebar={toggleMobileSidebar} />
          <Sidebar
            appName="Mantrailing Card"
            currentUser={currentUser}
            onLogout={handleLogout}
            isOpen={isMobileSidebarOpen}
            onClose={closeMobileSidebar}
          />
          <main className="flex-1 md:ml-64 p-0 pt-16 md:pt-0">
            <Routes>
              {currentUser.role === UserRoleEnum.ADMIN ? (
                <>
                  <Route path="/" element={<Dashboard customers={customers} transactions={transactions} currentUser={currentUser} />} />
                  <Route path="/customers" element={<CustomerManagement customers={customers} transactions={transactions} currentUser={currentUser} />} />
                  <Route path="/customers/:id" element={<CustomerDetails customers={customers} transactions={transactions} onUpdateCustomer={handleUpdateCustomer} onAddTransaction={handleAddTransaction} onDeleteTransactionsByIds={handleDeleteTransactionsByIds} currentUser={currentUser} />} />
                  <Route path="/reports" element={<Reports customers={customers} transactions={transactions} users={users} />} />
                  <Route path="/users" element={<UserManagement users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />} />
                  <Route path="*" element={<Navigate replace to="/" />} />
                </>
              ) : currentUser.role === UserRoleEnum.MITARBEITER ? (
                <>
                  <Route path="/" element={<Dashboard customers={customers} transactions={transactions} currentUser={currentUser} />} />
                  <Route path="/customers" element={<CustomerManagement customers={customers} transactions={transactions} currentUser={currentUser} />} />
                  <Route path="/customers/:id" element={<CustomerDetails customers={customers} transactions={transactions} onUpdateCustomer={handleUpdateCustomer} onAddTransaction={handleAddTransaction} onDeleteTransactionsByIds={handleDeleteTransactionsByIds} currentUser={currentUser} />} />
                  <Route path="*" element={<Navigate replace to="/" />} />
                </>
              ) : currentUser.role === UserRoleEnum.KUNDE && currentUser.associatedCustomerId ? (
                <>
                  <Route path="/customers/:id" element={<CustomerDetails customers={customers} transactions={transactions} onUpdateCustomer={handleUpdateCustomer} onAddTransaction={handleAddTransaction} onDeleteTransactionsByIds={handleDeleteTransactionsByIds} currentUser={currentUser} />} />
                  <Route path="*" element={<Navigate replace to={`/customers/${currentUser.associatedCustomerId}`} />} />
                </>
              ) : (
                <Route path="*" element={<Navigate replace to="/login" />} />
              )}
            </Routes>
          </main>
          {installPromptEvent && (
             <InstallPrompt onInstall={handleInstallClick} onDismiss={handleDismissInstall} />
          )}
        </>
      ) : (
        <Routes>
          <Route path="/login" element={<LoginPage supabase={supabase} onLogin={handleLogin} onRegister={handleRegister} isUpdatingPassword={isUpdatingPassword} />} />
          <Route path="*" element={<Navigate replace to="/login" state={{ from: location }} />} />
        </Routes>
      )}
    </div>
  );
};

export default App;
