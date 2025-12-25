import { TrainingLevelEnum, NavigationItem, User } from './types';
import { HomeIcon, UsersIcon, ClipboardIcon, SettingsIcon, DollarSignIcon, RepeatIcon } from './components/Icons';

// Training level definitions including required hours and logical ID
export const TRAINING_LEVEL_DEFINITIONS = [
  { id: 1, name: TrainingLevelEnum.EINSTEIGER, requiredHours: 6 },
  { id: 2, name: TrainingLevelEnum.GRUNDLAGEN, requiredHours: 12 },
  { id: 3, name: TrainingLevelEnum.FORTGESCHRITTENE, requiredHours: 12 },
  { id: 4, name: TrainingLevelEnum.MASTERCLASS, requiredHours: 12 },
  { id: 5, name: TrainingLevelEnum.EXPERT, requiredHours: 100 }, // Expert has 100, but can go beyond
];

// ADMIN_STAFF_USER_DETAILS werden entfernt, da Namen/Initialen nun aus der E-Mail abgeleitet werden.
// Dies ist in App.tsx und pages/UserManagement.tsx implementiert.

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { path: '/', label: 'Übersicht', icon: HomeIcon },
  { path: '/customers', label: 'Kunden', icon: UsersIcon },
  { path: '/reports', label: 'Berichte', icon: ClipboardIcon },
  { path: '/users', label: 'Benutzer', icon: SettingsIcon },
];

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const MOCK_REPORT_TYPES = ['Monatlich', 'Jährlich', 'Benutzerdefiniert'];
export const MOCK_TRANSACTION_FILTERS = ['Alle Transaktionen', 'Einnahmen (Aufladungen)', 'Ausgaben (Abbuchungen)'];

// Define a fixed reference date for consistent calculations across the app
// This date acts as 'today' for mock data analysis.
export const REFERENCE_DATE = new Date('2025-12-22T12:00:00'); // December 22, 2025