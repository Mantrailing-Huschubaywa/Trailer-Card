
import { Customer, Transaction, TrainingLevelEnum, TrainingSection, NavigationItem } from './types';
import { HomeIcon, UsersIcon, ClipboardIcon, SettingsIcon, DollarSignIcon, RepeatIcon } from './components/Icons';

// Mock Customers are now managed in App.tsx state.

// Mock Transactions are now managed in App.tsx state.

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { path: '/', label: 'Übersicht', icon: HomeIcon },
  { path: '/customers', label: 'Kunden', icon: UsersIcon },
  { path: '/reports', label: 'Berichte', icon: ClipboardIcon },
  { path: '/users', label: 'Benutzer', icon: SettingsIcon },
];

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const MOCK_REPORT_TYPES = ['Monatlich', 'Jährlich', 'Benutzerdefiniert'];
// MOCK_REPORT_PERIODS and MOCK_REPORT_EMPLOYEES are now generated dynamically in the Reports component.
export const MOCK_TRANSACTION_FILTERS = ['Alle Transaktionen', 'Einnahmen (Aufladungen)', 'Ausgaben (Abbuchungen)'];

// Get the current date to be used as the reference 'today' throughout the app.
// This ensures all calculations and new entries use the actual current date.
export const REFERENCE_DATE = new Date();
