import React from 'react';


export interface Customer {
  id: string;
  avatarInitials: string;
  avatarColor: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dogName: string;
  chipNumber: string;
  balance: number;
  totalTransactions: number;
  level: TrainingLevelEnum;
  created_at: string; // Date string (e.g., '9.2.2025')
  createdBy: string;
  qrCodeData: string; // URL for QR code image
  documents: Document[];
  trainingProgress: TrainingSection[];
  dataSource?: 'mock' | 'db'; // NEU: Zur Kennzeichnung der Datenquelle
}

// New type for the customer editing form
export interface NewCustomerData {
  firstName: string;
  lastName: string;
  email: string; // Will be read-only in the form
  phone: string;
  dogName: string;
  chipNumber: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  type: 'recharge' | 'debit';
  description: string;
  amount: number;
  date: string; // Date string (e.g., '22.12.2025')
  employee: string;
  created_at: string;
}

export enum TrainingLevelEnum {
  EINSTEIGER = 'Einsteiger',
  GRUNDLAGEN = 'Grundlagen',
  FORTGESCHRITTENE = 'Fortgeschrittene',
  MASTERCLASS = 'Masterclass',
  EXPERT = 'Expert', // Added Expert status
}

export interface TrainingSection {
  id: number;
  name: TrainingLevelEnum;
  requiredHours: number;
  completedHours: number;
  status: 'Aktuell' | 'Gesperrt' | 'Abgeschlossen';
}

export interface Document {
  id: string;
  name: string;
  url: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType; // SVG component
  color: string; // Tailwind color class
  description?: string;
}

export interface NavigationItem {
  path: string;
  label: string;
  icon: React.ElementType; // SVG component
}

export interface CustomerTableData {
  id: string;
  avatarInitials: string;
  avatarColor: string;
  name: string;
  dog: string;
  balance: number;
  level: TrainingLevelEnum;
  created_at: string;
  dataSource?: 'mock' | 'db'; // NEU: Zur Kennzeichnung in der Tabelle
}

export interface TransactionConfirmationData {
  customerId: string;
  customerName: string;
  employee: string;
  transactionType: 'Aufladung' | 'Abbuchung';
  amount: number;
  oldBalance: number;
  newBalance: number;
  description?: string; // Optional description for the transaction, especially for debits
}

export enum UserRoleEnum {
  ADMIN = 'Admin',
  MITARBEITER = 'Mitarbeiter',
  KUNDE = 'Kunde', // Added new role for customer self-service access
}

export interface User {
  id: string;
  avatarInitials: string;
  avatarColor: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRoleEnum;
  created_at: string; // Date string (e.g., '11.12.2025')
  password?: string; // Optional password for mock login
  associatedCustomerId?: string; // Optional: for customer role, links to their customer ID
}

export interface UserTableData {
  id: string;
  avatarInitials: string;
  avatarColor: string;
  name: string; // Derived from firstName and lastName for display in table
  firstName: string; // Added for internal use
  lastName: string;  // Added for internal use
  email: string;
  role: UserRoleEnum;
  created_at: string;
}