import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CustomerManagement from './pages/CustomerManagement';
import CustomerDetails from './pages/CustomerDetails';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement'; // Import the new UserManagement page
import LoginPage from './pages/LoginPage'; // Import the new LoginPage
import { Customer, Transaction, TrainingLevelEnum, User, UserRoleEnum } from './types'; // Import types
import { REFERENCE_DATE } from './constants'; // Import constants needed for initial state
import { supabase } from './supabaseClient';

// Initial Mock Data (moved from constants.ts)
const INITIAL_MOCK_CUSTOMERS: Customer[] = [
  // --- Existing customers (adjusted for consistency) ---
  {
    id: 'cust-anna',
    avatarInitials: 'AS',
    avatarColor: 'bg-green-500',
    firstName: 'Anna-Maria',
    lastName: 'Schoss',
    email: 'anna.schoss@email.de',
    phone: '+49 123 456789',
    dogName: 'Banu',
    chipNumber: '987000012345678',
    balance: 229.00,
    totalTransactions: 1,
    level: TrainingLevelEnum.EINSTEIGER,
    createdAt: '9.2.2025',
    createdBy: 'Christian Christian',
    qrCodeData: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://example.com/customer/cust-anna',
    documents: [],
    trainingProgress: [
      { id: 1, name: TrainingLevelEnum.EINSTEIGER, requiredHours: 6, completedHours: 0, status: 'Aktuell' },
      { id: 2, name: TrainingLevelEnum.GRUNDLAGEN, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
      { id: 3, name: TrainingLevelEnum.FORTGESCHRITTENE, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
      { id: 4, name: TrainingLevelEnum.MASTERCLASS, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
      { id: 5, name: TrainingLevelEnum.EXPERT, requiredHours: 100, completedHours: 0, status: 'Gesperrt' },
    ],
  },
  {
    id: 'cust-2',
    avatarInitials: 'SS',
    avatarColor: 'bg-orange-500',
    firstName: 'Sabine',
    lastName: 'Sonne',
    email: 'sabine.sonne@email.de',
    phone: '+49 111 222333',
    dogName: 'Luna',
    chipNumber: '987000012345680',
    balance: 25.00,
    totalTransactions: 1,
    level: TrainingLevelEnum.GRUNDLAGEN, // Sabine is already in Grundlagen
    createdAt: '1.12.2023',
    createdBy: 'Christian Christian',
    qrCodeData: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://example.com/customer/cust-2',
    documents: [],
    trainingProgress: [
      { id: 1, name: TrainingLevelEnum.EINSTEIGER, requiredHours: 6, completedHours: 6, status: 'Abgeschlossen' },
      { id: 2, name: TrainingLevelEnum.GRUNDLAGEN, requiredHours: 12, completedHours: 0, status: 'Aktuell' },
      { id: 3, name: TrainingLevelEnum.FORTGESCHRITTENE, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
      { id: 4, name: TrainingLevelEnum.MASTERCLASS, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
      { id: 5, name: TrainingLevelEnum.EXPERT, requiredHours: 100, completedHours: 0, status: 'Gesperrt' },
    ],
  },
  {
    id: 'cust-3',
    avatarInitials: 'TT',
    avatarColor: 'bg-red-500',
    firstName: 'Tom',
    lastName: 'Test',
    email: 'tom.test@email.de',
    phone: '+49 444 555666',
    dogName: 'Rocky',
    chipNumber: '987000012345681',
    balance: 300.00,
    totalTransactions: 1,
    level: TrainingLevelEnum.EINSTEIGER,
    createdAt: '10.1.2024',
    createdBy: 'Christian Christian',
    qrCodeData: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://example.com/customer/cust-3',
    documents: [],
    trainingProgress: [
      { id: 1, name: TrainingLevelEnum.EINSTEIGER, requiredHours: 6, completedHours: 0, status: 'Aktuell' },
      { id: 2, name: TrainingLevelEnum.GRUNDLAGEN, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
      { id: 3, name: TrainingLevelEnum.FORTGESCHRITTENE, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
      { id: 4, name: TrainingLevelEnum.MASTERCLASS, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
      { id: 5, name: TrainingLevelEnum.EXPERT, requiredHours: 100, completedHours: 0, status: 'Gesperrt' },
    ],
  },

  // --- New Test Customers for Level Advancement ---

  {
    id: 'cust-einsteiger-test',
    avatarInitials: 'EL',
    avatarColor: 'bg-fuchsia-500', // Orchid-like color
    firstName: 'Einsteiger',
    lastName: 'Lehrling',
    email: 'einsteiger@pfotencard.de',
    phone: '+49 101 202303',
    dogName: 'Newbie',
    chipNumber: '987000010101010',
    balance: 18.00,
    totalTransactions: 1,
    level: TrainingLevelEnum.EINSTEIGER,
    createdAt: '01.12.2025',
    createdBy: 'Christian Christian',
    qrCodeData: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://example.com/customer/cust-einsteiger-test',
    documents: [],
    trainingProgress: [
      { id: 1, name: TrainingLevelEnum.EINSTEIGER, requiredHours: 6, completedHours: 5, status: 'Aktuell' }, // 5/6 hours
      { id: 2, name: TrainingLevelEnum.GRUNDLAGEN, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
      { id: 3, name: TrainingLevelEnum.FORTGESCHRITTENE, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
      { id: 4, name: TrainingLevelEnum.MASTERCLASS, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
      { id: 5, name: TrainingLevelEnum.EXPERT, requiredHours: 100, completedHours: 0, status: 'Gesperrt' },
    ],
  },
  {
    id: 'cust-grundlagen-test',
    avatarInitials: 'GV',
    avatarColor: 'bg-lime-500', // Lime Green color
    firstName: 'Grundlagen',
    lastName: 'Vertiefung',
    email: 'grundlagen@pfotencard.de',
    phone: '+49 102 303404',
    dogName: 'Buddy',
    chipNumber: '987000010202020',
    balance: 18.00,
    totalTransactions: 1,
    level: TrainingLevelEnum.GRUNDLAGEN,
    createdAt: '05.11.2025',
    createdBy: 'Christian Christian',
    qrCodeData: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://example.com/customer/cust-grundlagen-test',
    documents: [],
    trainingProgress: [
      { id: 1, name: TrainingLevelEnum.EINSTEIGER, requiredHours: 6, completedHours: 6, status: 'Abgeschlossen' },
      { id: 2, name: TrainingLevelEnum.GRUNDLAGEN, requiredHours: 12, completedHours: 11, status: 'Aktuell' }, // 11/12 hours
      { id: 3, name: TrainingLevelEnum.FORTGESCHRITTENE, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
      { id: 4, name: TrainingLevelEnum.MASTERCLASS, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
      { id: 5, name: TrainingLevelEnum.EXPERT, requiredHours: 100, completedHours: 0, status: 'Gesperrt' },
    ],
  },
  {
    id: 'cust-fortgeschrittene-test',
    avatarInitials: 'FS',
    avatarColor: 'bg-sky-500', // Sky Blue color
    firstName: 'Fortgeschrittene',
    lastName: 'Studentin',
    email: 'fortgeschrittene@pfotencard.de',
    phone: '+49 103 404505',
    dogName: 'Clever',
    chipNumber: '987000010303030',
    balance: 18.00,
    totalTransactions: 1,
    level: TrainingLevelEnum.FORTGESCHRITTENE,
    createdAt: '10.10.2025',
    createdBy: 'Sandra Sandra',
    qrCodeData: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://example.com/customer/cust-fortgeschrittene-test',
    documents: [],
    trainingProgress: [
      { id: 1, name: TrainingLevelEnum.EINSTEIGER, requiredHours: 6, completedHours: 6, status: 'Abgeschlossen' },
      { id: 2, name: TrainingLevelEnum.GRUNDLAGEN, requiredHours: 12, completedHours: 12, status: 'Abgeschlossen' },
      { id: 3, name: TrainingLevelEnum.FORTGESCHRITTENE, requiredHours: 12, completedHours: 11, status: 'Aktuell' }, // 11/12 hours
      { id: 4, name: TrainingLevelEnum.MASTERCLASS, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
      { id: 5, name: TrainingLevelEnum.EXPERT, requiredHours: 100, completedHours: 0, status: 'Gesperrt' },
    ],
  },
  {
    id: 'cust-masterclass-test',
    avatarInitials: 'MT',
    avatarColor: 'bg-amber-500', // Peru-like color
    firstName: 'Masterclass',
    lastName: 'Teilnehmer',
    email: 'masterclass@pfotencard.de',
    phone: '+49 104 505606',
    dogName: 'Champion',
    chipNumber: '987000010404040',
    balance: 18.00,
    totalTransactions: 1,
    level: TrainingLevelEnum.MASTERCLASS,
    createdAt: '15.09.2025',
    createdBy: 'Sophie Sophie',
    qrCodeData: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://example.com/customer/cust-masterclass-test',
    documents: [],
    trainingProgress: [
      { id: 1, name: TrainingLevelEnum.EINSTEIGER, requiredHours: 6, completedHours: 6, status: 'Abgeschlossen' },
      { id: 2, name: TrainingLevelEnum.GRUNDLAGEN, requiredHours: 12, completedHours: 12, status: 'Abgeschlossen' },
      { id: 3, name: TrainingLevelEnum.FORTGESCHRITTENE, requiredHours: 12, completedHours: 12, status: 'Abgeschlossen' },
      { id: 4, name: TrainingLevelEnum.MASTERCLASS, requiredHours: 12, completedHours: 11, status: 'Aktuell' }, // 11/12 hours
      { id: 5, name: TrainingLevelEnum.EXPERT, requiredHours: 100, completedHours: 0, status: 'Gesperrt' },
    ],
  },
  {
    id: 'cust-expert-milestone-test',
    avatarInitials: 'EX',
    avatarColor: 'bg-indigo-500', // Lila color
    firstName: 'Expert',
    lastName: 'Meister',
    email: 'expert.meister@pfotencard.de',
    phone: '+49 105 606707',
    dogName: 'Guru',
    chipNumber: '987000010505050',
    balance: 18.00,
    totalTransactions: 1,
    level: TrainingLevelEnum.EXPERT,
    createdAt: '20.08.2025',
    createdBy: 'Christian Christian',
    qrCodeData: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://example.com/customer/cust-expert-milestone-test',
    documents: [],
    trainingProgress: [
      { id: 1, name: TrainingLevelEnum.EINSTEIGER, requiredHours: 6, completedHours: 6, status: 'Abgeschlossen' },
      { id: 2, name: TrainingLevelEnum.GRUNDLAGEN, requiredHours: 12, completedHours: 12, status: 'Abgeschlossen' },
      { id: 3, name: TrainingLevelEnum.FORTGESCHRITTENE, requiredHours: 12, completedHours: 12, status: 'Abgeschlossen' },
      { id: 4, name: TrainingLevelEnum.MASTERCLASS, requiredHours: 12, completedHours: 12, status: 'Abgeschlossen' },
      { id: 5, name: TrainingLevelEnum.EXPERT, requiredHours: 100, completedHours: 99, status: 'Aktuell' }, // 99/100 hours
    ],
  },
  {
    id: 'cust-expert-post-milestone-test',
    avatarInitials: 'EZ',
    avatarColor: 'bg-gray-500', // Neutral color
    firstName: 'Expert',
    lastName: 'Zwischenstand',
    email: 'expert.zwischenstand@pfotencard.de',
    phone: '+49 106 707808',
    dogName: 'Progressor',
    chipNumber: '987000010606060',
    balance: 18.00,
    totalTransactions: 1,
    level: TrainingLevelEnum.EXPERT,
    createdAt: '25.07.2025',
    createdBy: 'Christian Christian',
    qrCodeData: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://example.com/customer/cust-expert-post-milestone-test',
    documents: [],
    trainingProgress: [
      { id: 1, name: TrainingLevelEnum.EINSTEIGER, requiredHours: 6, completedHours: 6, status: 'Abgeschlossen' },
      { id: 2, name: TrainingLevelEnum.GRUNDLAGEN, requiredHours: 12, completedHours: 12, status: 'Abgeschlossen' },
      { id: 3, name: TrainingLevelEnum.FORTGESCHRITTENE, requiredHours: 12, completedHours: 12, status: 'Abgeschlossen' },
      { id: 4, name: TrainingLevelEnum.MASTERCLASS, requiredHours: 12, completedHours: 12, status: 'Abgeschlossen' },
      { id: 5, name: TrainingLevelEnum.EXPERT, requiredHours: 100, completedHours: 101, status: 'Aktuell' }, // 101 hours
    ],
  },
];

const INITIAL_MOCK_TRANSACTIONS: Transaction[] = [
  // --- Existing transactions (adjusted for new mock customers) ---
  {
    id: 'trx-anna-1',
    customerId: 'cust-anna',
    type: 'recharge',
    description: 'Aufladung 215€',
    amount: 215.00,
    date: '09.02.2025',
    employee: 'Christian Christian',
  },
  {
    id: 'trx-anna-2',
    customerId: 'cust-anna',
    type: 'debit',
    description: 'Trails',
    amount: 30.00, // This transaction is not a 'Trails' for progress
    date: '15.02.2025',
    employee: 'Christian Christian',
  },
  {
    id: 'trx-sabine-1',
    customerId: 'cust-2',
    type: 'recharge',
    description: 'Aufladung Mai',
    amount: 50.00,
    date: '10.05.2025',
    employee: 'Christian Christian',
  },
  {
    id: 'trx-tom-1',
    customerId: 'cust-3',
    type: 'recharge',
    description: 'Bonusguthaben',
    amount: 50.00,
    date: '20.12.2025',
    employee: 'Christian Christian',
  },

  // --- Transactions for New Test Customers ---
  {
    id: 'trx-einsteiger-test-1',
    customerId: 'cust-einsteiger-test',
    type: 'debit',
    description: 'Trails',
    amount: 18.00,
    date: '01.12.2025',
    employee: 'Christian Christian',
  },
  // Add more transactions for Grundlagen, Fortgeschrittene, Masterclass to reach their current progress
  // For brevity, these are assumed to exist up to their current completedHours.
  // The crucial part is that they are one hour away from completion.
];

const BASE_MOCK_USERS: User[] = [
  {
    id: 'user-admin',
    avatarInitials: 'AD',
    avatarColor: 'bg-red-500',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@pfotencard.de',
    password: 'adminpassword',
    role: UserRoleEnum.ADMIN,
    createdAt: '11.12.2025',
  },
  {
    id: 'user-christian',
    avatarInitials: 'CC',
    avatarColor: 'bg-orange-500',
    firstName: 'Christian',
    lastName: 'Christian',
    email: 'christian@pfotencard.de',
    password: 'password123',
    role: UserRoleEnum.ADMIN,
    createdAt: '11.12.2025',
  },
  {
    id: 'user-petra',
    avatarInitials: 'PM',
    avatarColor: 'bg-orange-400',
    firstName: 'Petra',
    lastName: 'Müller',
    email: 'petra@pfotencard.de',
    password: 'password123',
    role: UserRoleEnum.MITARBEITER,
    createdAt: '13.12.2025',
  },
  {
    id: 'user-sandra',
    avatarInitials: 'SS',
    avatarColor: 'bg-purple-500',
    firstName: 'Sandra',
    lastName: 'Schmidt',
    email: 'sandra@pfotencard.de',
    password: 'password123',
    role: UserRoleEnum.MITARBEITER,
    createdAt: '13.12.2025',
  },
  {
    id: 'user-sophie',
    avatarInitials: 'SM',
    avatarColor: 'bg-indigo-500',
    firstName: 'Sophie',
    lastName: 'Meier',
    email: 'sophie@pfotencard.de',
    password: 'password123',
    role: UserRoleEnum.MITARBEITER,
    createdAt: '13.12.2025',
  },
  {
    id: 'user-susi',
    avatarInitials: 'SH',
    avatarColor: 'bg-blue-500',
    firstName: 'Susi',
    lastName: 'Huber',
    email: 'susi@pfotencard.de',
    password: 'password123',
    role: UserRoleEnum.MITARBEITER,
    createdAt: '13.12.2025',
  },
  // Removed static 'user-anna-kunde' as it will be generated dynamically if not present for cust-anna
];

// Function to generate customer users based on existing customers
const generateCustomerUsers = (customers: Customer[], existingUsers: User[]): User[] => {
  const customerUsers: User[] = [...existingUsers];
  const avatarColors = ['bg-red-500', 'bg-orange-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-green-500', 'bg-teal-500', 'bg-fuchsia-500', 'bg-lime-500'];

  customers.forEach(customer => {
    // Check if a customer user already exists for this customerId
    const existingCustomerUser = existingUsers.find(
      u => u.role === UserRoleEnum.KUNDE && u.associatedCustomerId === customer.id
    );

    if (!existingCustomerUser) {
      // Create a new user for this customer
      const newUserId = `user-kunde-${customer.id}`;
      const initials = `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`.toUpperCase().slice(0, 2);
      const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

      customerUsers.push({
        id: newUserId,
        avatarInitials: initials,
        avatarColor: randomColor,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        password: 'kunde123', // Standard password for mock customer users
        role: UserRoleEnum.KUNDE,
        createdAt: REFERENCE_DATE.toLocaleDateString('de-DE'),
        associatedCustomerId: customer.id,
      });
    }
  });
  return customerUsers;
};


const App: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_MOCK_CUSTOMERS);
  // Initialize users by first taking base users, then generating customer users
  const [users, setUsers] = useState<User[]>(() =>
    generateCustomerUsers(INITIAL_MOCK_CUSTOMERS, BASE_MOCK_USERS)
  );
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_MOCK_TRANSACTIONS);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Login-Status (Supabase)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Supabase Session initialisieren und aktuellen Benutzer laden
  useEffect(() => {
    let isMounted = true;

    const mapDbRoleToEnum = (role: string): UserRoleEnum => {
      if (role === 'admin') return UserRoleEnum.ADMIN;
      if (role === 'mitarbeiter') return UserRoleEnum.MITARBEITER;
      return UserRoleEnum.KUNDE;
    };

    const loadUser = async (userId: string) => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id,email,role,first_name,last_name,created_at')
        .eq('id', userId)
        .single();

      if (profileError || !profile) return null;

      const roleEnum = mapDbRoleToEnum(profile.role);

      let associatedCustomerId: string | undefined = undefined;
      if (roleEnum === UserRoleEnum.KUNDE) {
        const { data: cRow } = await supabase
          .from('customers')
          .select('id')
          .eq('owner_user_id', userId)
          .limit(1)
          .maybeSingle();
        if (cRow?.id) associatedCustomerId = cRow.id;
      }

      const firstName = profile.first_name || (profile.email ? profile.email.split('@')[0] : '');
      const lastName = profile.last_name || '';
      const initials =
        ((firstName.substring(0, 1) || '') + (lastName.substring(0, 1) || firstName.substring(1, 2) || ''))
          .toUpperCase()
          .substring(0, 2) || '??';

      const user: User = {
        id: profile.id,
        firstName,
        lastName,
        email: profile.email,
        role: roleEnum,
        avatarInitials: initials,
        avatarColor: 'bg-green-500',
        createdAt: profile.created_at ? new Date(profile.created_at).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE'),
        associatedCustomerId
      };

      return user;
    };

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!isMounted) return;

      if (!session?.user?.id) {
        setIsLoggedIn(false);
        setCurrentUser(null);
        return;
      }

      const user = await loadUser(session.user.id);
      if (!isMounted) return;

      if (user) {
        setIsLoggedIn(true);
        setCurrentUser(user);
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      if (!session?.user?.id) {
        setIsLoggedIn(false);
        setCurrentUser(null);
        return;
      }

      const user = await loadUser(session.user.id);
      if (!isMounted) return;

      if (user) {
        setIsLoggedIn(true);
        setCurrentUser(user);
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

// Effect for initial redirection based on login status and user role
  useEffect(() => {
    if (!isLoggedIn) {
      if (window.location.hash !== '#/login') {
        navigate('/login', { replace: true });
      }
    } else if (currentUser) { // If logged in and currentUser is available
      if (currentUser.role === UserRoleEnum.KUNDE && currentUser.associatedCustomerId) {
        const expectedPath = `/customers/${currentUser.associatedCustomerId}`;
        // Check if the current hash path is *not* the expected customer path
        if (!window.location.hash.startsWith(`#${expectedPath}`)) {
          navigate(expectedPath, { replace: true }); // Use replace to prevent back button issues
        }
      } else if (window.location.hash === '#/login') {
        navigate('/', { replace: true });
      }
    }
  }, [isLoggedIn, navigate, currentUser]);

  const handleLogin = async (email: string, passwordInput: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: passwordInput
    });

    if (error) {
      return false;
    }

    return true;
  };



  const handleRegister = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      return false;
    }

    // Falls E-Mail-Bestätigung in Supabase aktiv ist, entsteht ggf. noch keine Session.
    return true;
  };



  const handleUpdateCustomer

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prevCustomers =>
      prevCustomers.map(c => (c.id === updatedCustomer.id ? updatedCustomer : c))
    );
  };

  const handleAddTransaction = (newTransaction: Transaction) => {
    setTransactions(prevTransactions => [...prevTransactions, newTransaction]);
  };

  // User management functions
  const handleAddUser = (newUser: User) => {
    // If the new user is a 'Kunde' AND has an associatedCustomerId (set in UserManagement.tsx),
    // create a new customer for them in the customers state FIRST.
    if (newUser.role === UserRoleEnum.KUNDE && newUser.associatedCustomerId) {
      const avatarColors = ['bg-red-500', 'bg-orange-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-green-500', 'bg-teal-500', 'bg-fuchsia-500', 'bg-lime-500'];
      const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

      const newCustomer: Customer = {
        id: newUser.associatedCustomerId, // Use the associatedCustomerId from the user
        avatarInitials: newUser.avatarInitials, // Use user's initials
        avatarColor: newUser.avatarColor || randomColor, // Use user's color or random
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: '', // Default value
        dogName: 'Unbekannt', // Default value
        chipNumber: '', // Default value
        balance: 0.00,
        totalTransactions: 0,
        level: TrainingLevelEnum.EINSTEIGER, // Default level
        createdAt: newUser.createdAt,
        createdBy: currentUser?.firstName || 'System', // Use current user or System
        qrCodeData: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://example.com/customer/${newUser.associatedCustomerId}`,
        documents: [],
        trainingProgress: [
          { id: 1, name: TrainingLevelEnum.EINSTEIGER, requiredHours: 6, completedHours: 0, status: 'Aktuell' },
          { id: 2, name: TrainingLevelEnum.GRUNDLAGEN, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
          { id: 3, name: TrainingLevelEnum.FORTGESCHRITTENE, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
          { id: 4, name: TrainingLevelEnum.MASTERCLASS, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
          { id: 5, name: TrainingLevelEnum.EXPERT, requiredHours: 100, completedHours: 0, status: 'Gesperrt' },
        ],
      };
      setCustomers(prevCustomers => {
        const updatedCustomers = [...prevCustomers, newCustomer];
        console.log('handleAddUser: New customer added. Current customers state:', updatedCustomers);
        return updatedCustomers;
      });
    }
    // THEN update the users state
    setUsers(prevUsers => [...prevUsers, newUser]); 
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prevUsers => {
      // If the updated user is a 'Kunde' and has an associatedCustomerId,
      // also update the corresponding customer's details
      if (updatedUser.role === UserRoleEnum.KUNDE && updatedUser.associatedCustomerId) {
        setCustomers(prevCustomers =>
          prevCustomers.map(customer => {
            if (customer.id === updatedUser.associatedCustomerId) {
              return {
                ...customer,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                // Add any other fields that should sync from User to Customer
                avatarInitials: updatedUser.avatarInitials,
                avatarColor: updatedUser.avatarColor,
              };
            }
            return customer;
          })
        );
      }
      return prevUsers.map(u => (u.id === updatedUser.id ? updatedUser : u));
    });
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prevUsers => {
      const userToDelete = prevUsers.find(u => u.id === userId);
      // If the deleted user is a 'Kunde' with an associatedCustomerId, also delete the customer
      if (userToDelete && userToDelete.role === UserRoleEnum.KUNDE && userToDelete.associatedCustomerId) {
        setCustomers(prevCustomers =>
          prevCustomers.filter(c => c.id !== userToDelete.associatedCustomerId)
        );
      }
      return prevUsers.filter(u => u.id !== userId);
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setCurrentUser(null);
    alert('Sie wurden abgemeldet.');
    navigate('/login', { replace: true });
  };



  return (

  return (
    <div className="flex min-h-screen bg-gray-100">
      {isLoggedIn && currentUser ? (
        <>
          <Sidebar appName="Mantrailing Card" currentUser={currentUser} onLogout={handleLogout} />
          <main className="flex-1 md:ml-64 p-0">
            <Routes>
              {currentUser.role === UserRoleEnum.ADMIN ? (
                // Admin has full access
                <>
                  <Route path="/" element={<Dashboard customers={customers} transactions={transactions} />} />
                  <Route path="/customers" element={<CustomerManagement customers={customers} transactions={transactions} currentUser={currentUser} />} />
                  <Route
                    path="/customers/:id"
                    element={<CustomerDetails customers={customers} transactions={transactions} onUpdateCustomer={handleUpdateCustomer} onAddTransaction={handleAddTransaction} currentUser={currentUser} />}
                  />
                  <Route path="/reports" element={<Reports customers={customers} transactions={transactions} />} />
                  <Route path="/users" element={<UserManagement users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />} />
                  <Route path="*" element={<Dashboard customers={customers} transactions={transactions} />} /> {/* Fallback for Admin */}
                </>
              ) : currentUser.role === UserRoleEnum.MITARBEITER ? (
                // Mitarbeiter has restricted access
                <>
                  <Route path="/" element={<Dashboard customers={customers} transactions={transactions} />} />
                  <Route path="/customers" element={<CustomerManagement customers={customers} transactions={transactions} currentUser={currentUser} />} />
                  <Route
                    path="/customers/:id"
                    element={<CustomerDetails customers={customers} transactions={transactions} onUpdateCustomer={handleUpdateCustomer} onAddTransaction={handleAddTransaction} currentUser={currentUser} />}
                  />
                  {/* Redirect any restricted path or unknown path for Mitarbeiter to dashboard */}
                  <Route path="/reports" element={<Dashboard customers={customers} transactions={transactions} />} />
                  <Route path="/users" element={<Dashboard customers={customers} transactions={transactions} />} />
                  <Route path="*" element={<Dashboard customers={customers} transactions={transactions} />} /> {/* Fallback for Mitarbeiter */}
                </>
              ) : currentUser.role === UserRoleEnum.KUNDE && currentUser.associatedCustomerId ? (
                // Kunde has access only to their own customer details, enforced by internal component logic and redirects
                <>
                  {/* Dynamic route for *any* customer ID. The CustomerDetails component will authorize. */}
                  <Route
                    path="/customers/:id"
                    element={<CustomerDetails customers={customers} transactions={transactions} onUpdateCustomer={handleUpdateCustomer} onAddTransaction={handleAddTransaction} currentUser={currentUser} />}
                  />
                  {/* Redirect root path to their own specific customer page */}
                  <Route path="/" element={<Navigate replace to={`/customers/${currentUser.associatedCustomerId}`} />} />
                  {/* Catch-all for any other path not explicitly handled, redirects to their own customer page */}
                  <Route path="*" element={<Navigate replace to={`/customers/${currentUser.associatedCustomerId}`} />} />
                </>
              ) : (
                // Fallback for any other unexpected logged-in state (e.g., customer role without associated ID, though type system should prevent this state for a logged-in user)
                <Route path="*" element={<Dashboard customers={customers} transactions={transactions} />} />
              )}
            </Routes>
          </main>
        </>
      ) : (
        // Not logged in
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} onRegister={handleRegister} />} />
          <Route path="*" element={<LoginPage onLogin={handleLogin} onRegister={handleRegister} />} />
        </Routes>
      )}
    </div>
  );
};

export default App;