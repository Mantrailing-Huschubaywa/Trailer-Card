
import { Customer, Transaction, TrainingLevelEnum, TrainingSection, NavigationItem } from './types';
import { HomeIcon, UsersIcon, ClipboardIcon, SettingsIcon, DollarSignIcon, RepeatIcon } from './components/Icons';

// Mock Customers are now managed in App.tsx state.

// Mock Transactions are now managed in App.tsx state.

export const CURRENT_EMPLOYEE = "Christian Christian";

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { path: '/', label: 'Übersicht', icon: HomeIcon },
  { path: '/customers', label: 'Kunden', icon: UsersIcon },
  { path: '/reports', label: 'Berichte', icon: ClipboardIcon },
  { path: '/users', label: 'Benutzer', icon: SettingsIcon },
];

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const MOCK_REPORT_TYPES = ['Monatlich', 'Jährlich', 'Benutzerdefiniert'];
export const MOCK_REPORT_PERIODS = ['Dezember 2025', 'November 2025', 'Gesamt']; // Note: 'Dezember 2025' aligns with REFERENCE_DATE's month
export const MOCK_REPORT_EMPLOYEES = ['Alle Mitarbeiter', 'Christian Christian', 'Sandra Sandra', 'Sophie Sophie'];
export const MOCK_TRANSACTION_FILTERS = ['Alle Transaktionen', 'Einnahmen (Aufladungen)', 'Ausgaben (Abbuchungen)'];

// Define a fixed reference date for consistent calculations across the app
// This date acts as 'today' for mock data analysis.
export const REFERENCE_DATE = new Date('2025-12-22T12:00:00'); // December 22, 2025