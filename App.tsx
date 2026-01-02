
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CustomerManagement from './pages/CustomerManagement';
import CustomerDetails from './pages/CustomerDetails';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import LoginPage from './pages/LoginPage';
import { Customer, Transaction, TrainingLevelEnum, User, UserRoleEnum } from './types';
import { REFERENCE_DATE } from './constants';
import { USE_MOCK_DATA } from './config';
import { getSupabaseClient } from './supabaseClient';

// Helper function to safely parse customer data from Supabase
const parseCustomerData = (c: any): Customer => {
  let trainingProgress = c.trainingProgress;
  // Supabase returns JSONB columns as strings, so we need to parse them.
  if (typeof trainingProgress === 'string') {
    try {
      trainingProgress = JSON.parse(trainingProgress);
    } catch (e) {
      console.error("Fehler beim Parsen von trainingProgress für Kunde:", c.id, e);
      trainingProgress = []; // Fallback auf ein leeres Array bei einem Fehler
    }
  }
  return { ...c, trainingProgress, dataSource: 'db' };
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
      <img src="https://hs-bw.com/wp-content/uploads/2026/01/Mantrailing.png" alt="App Logo" className="h-10 w-10 mr-2 rounded-[10px]" />
      <span className="text-xl font-bold">Mantrailing Card</span>
    </div>
    {/* Placeholder to balance the flexbox layout */}
    <div className="w-10"></div>
  </header>
);


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]); // For UserManagement page (staff)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const supabase = getSupabaseClient();

  const toggleMobileSidebar = () => setIsMobileSidebarOpen(prev => !prev);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase, navigate]);

  // Effect 2: Fetches data when the session changes. This separates data logic from auth logic.
  useEffect(() => {
    if (!supabase) return;

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
        avatarColor: 'bg-gray-500',
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
            avatarColor: 'bg-gray-500',
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
      fetchInitialData(session);
    } else {
      // Clear all data on logout
      setCurrentUser(null);
      setCustomers([]);
      setTransactions([]);
      setUsers([]);
      setIsLoading(false);
      navigate('/login');
    }
  }, [session, supabase, navigate]);
  
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

    // STEP 1: Define all customer data first.
    // New, shorter customer ID generation
    const idPrefix = (email.split('@')[0] || 'KUNDE').substring(0, 4).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const associatedCustomerId = `${idPrefix}-${randomSuffix}`;
    
    const firstName = email.split('@')[0] || 'Neuer';
    const lastName = '(Kunde)';
    const initials = (firstName.substring(0, 2) || '??').toUpperCase();
    const avatarColors = ['bg-red-500', 'bg-orange-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-green-500', 'bg-teal-500', 'bg-fuchsia-500', 'bg-lime-500'];

    const newCustomer = {
      id: associatedCustomerId,
      avatarInitials: initials,
      avatarColor: avatarColors[Math.floor(Math.random() * avatarColors.length)],
      firstName, lastName, email, phone: '', dogName: '', chipNumber: '',
      balance: 0, totalTransactions: 0, level: TrainingLevelEnum.EINSTEIGER,
      // 'created_at' is removed. The database will set this automatically.
      createdBy: 'Registrierung', // This is crucial for the RLS policy
      qrCodeData: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://example.com/customer/${associatedCustomerId}`,
      documents: [],
      trainingProgress: [
        { id: 1, name: TrainingLevelEnum.EINSTEIGER, requiredHours: 6, completedHours: 0, status: 'Aktuell' },
        { id: 2, name: TrainingLevelEnum.GRUNDLAGEN, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
        { id: 3, name: TrainingLevelEnum.FORTGESCHRITTENE, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
        { id: 4, name: TrainingLevelEnum.MASTERCLASS, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
        { id: 5, name: TrainingLevelEnum.EXPERT, requiredHours: 100, completedHours: 0, status: 'Gesperrt' },
      ],
    };

    // STEP 2: Create the customer record BEFORE creating the user.
    const { error: customerInsertError } = await supabase.from('customers').insert([{
      ...newCustomer,
      trainingProgress: JSON.stringify(newCustomer.trainingProgress)
    }]);

    if (customerInsertError) {
      console.error("Customer Insert Error (Step 1):", customerInsertError);
      return `Fehler beim Erstellen des Kundenprofils: ${customerInsertError.message}`;
    }

    // STEP 3: Now that the customer exists, create the auth user.
    // The trigger will now find the customer and the foreign key constraint will be satisfied.
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName,
          role: UserRoleEnum.KUNDE,
          associatedCustomerId // Pass the now-existing customer ID
        }
      }
    });

    if (signUpError) {
      console.error("Sign-Up Error (Step 2):", signUpError);
      // In a production app, you might want to delete the orphaned customer record created in step 2.
      // This requires admin privileges and is complex to handle from the client.
      return `Registrierungsfehler: ${signUpError.message}. Bitte kontaktieren Sie den Support.`;
    }

    // onAuthStateChange will handle the login and data refresh.
    return null;
  };


  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    if (!supabase) return;
  
    // --- Step 1: Update the 'customers' table ---
    const { dataSource, ...customerToUpdate } = updatedCustomer;
    const { error: customerUpdateError } = await supabase.from('customers').update({
      ...customerToUpdate,
      trainingProgress: JSON.stringify(customerToUpdate.trainingProgress)
    }).eq('id', updatedCustomer.id);
  
    if (customerUpdateError) {
      alert(`Fehler beim Speichern der Kundendaten: ${customerUpdateError.message}`);
      return; // Stop if the primary update fails
    }
  
    // --- Step 2: Update local state for customers ---
    setCustomers(prev => prev.map(c => (c.id === updatedCustomer.id ? updatedCustomer : c)));
  
    // --- Step 3: Find and update the associated user profile to ensure data consistency ---
    try {
      const { data: profileData, error: profileFindError } = await supabase
        .from('profiles')
        .select('id') // We only need the user's UUID for the update
        .eq('associatedCustomerId', updatedCustomer.id)
        .single();
  
      // If a profile exists for this customer, update it.
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
          // --- Step 4: Update local state for users/profile if the DB update was successful ---
          const newAvatarInitials = `${(updatedCustomer.firstName || '?').charAt(0)}${(updatedCustomer.lastName || '?').charAt(0)}`.toUpperCase();
  
          // Update the main users list (for admins)
          setUsers(prevUsers => prevUsers.map(u => 
            u.id === userId 
              ? { ...u, firstName: updatedCustomer.firstName, lastName: updatedCustomer.lastName, avatarInitials: newAvatarInitials } 
              : u
          ));
  
          // Update the currently logged-in user's state if they were the one being edited
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
      // 'PGRST116' means 'Exact one row not found', which is expected if a customer has no login.
      // We only log other, unexpected errors.
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
        // To properly update state, we need a complete transaction object, including created_at
        // For simplicity, we'll refetch data or just add what we have.
        // A full solution would get the created transaction back from the DB.
        const completeTransaction = { ...newTransaction, created_at: new Date().toISOString() };
        setTransactions(prev => [...prev, completeTransaction]);
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
      {session && currentUser ? (
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
                  <Route path="/" element={<Dashboard customers={customers} transactions={transactions} />} />
                  <Route path="/customers" element={<CustomerManagement customers={customers} transactions={transactions} currentUser={currentUser} />} />
                  <Route path="/customers/:id" element={<CustomerDetails customers={customers} transactions={transactions} onUpdateCustomer={handleUpdateCustomer} onAddTransaction={handleAddTransaction} currentUser={currentUser} />} />
                  <Route path="/reports" element={<Reports customers={customers} transactions={transactions} />} />
                  <Route path="/users" element={<UserManagement users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />} />
                  <Route path="*" element={<Navigate replace to="/" />} />
                </>
              ) : currentUser.role === UserRoleEnum.MITARBEITER ? (
                <>
                  <Route path="/" element={<Dashboard customers={customers} transactions={transactions} />} />
                  <Route path="/customers" element={<CustomerManagement customers={customers} transactions={transactions} currentUser={currentUser} />} />
                  <Route path="/customers/:id" element={<CustomerDetails customers={customers} transactions={transactions} onUpdateCustomer={handleUpdateCustomer} onAddTransaction={handleAddTransaction} currentUser={currentUser} />} />
                  <Route path="*" element={<Navigate replace to="/" />} />
                </>
              ) : currentUser.role === UserRoleEnum.KUNDE && currentUser.associatedCustomerId ? (
                <>
                  <Route path="/customers/:id" element={<CustomerDetails customers={customers} transactions={transactions} onUpdateCustomer={handleUpdateCustomer} onAddTransaction={handleAddTransaction} currentUser={currentUser} />} />
                  <Route path="*" element={<Navigate replace to={`/customers/${currentUser.associatedCustomerId}`} />} />
                </>
              ) : (
                <Route path="*" element={<Navigate replace to="/login" />} />
              )}
            </Routes>
          </main>
        </>
      ) : (
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} onRegister={handleRegister} />} />
          <Route path="*" element={<Navigate replace to="/login" />} />
        </Routes>
      )}
    </div>
  );
};

export default App;
