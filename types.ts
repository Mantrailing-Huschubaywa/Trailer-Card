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
  createdAt: string; // Date string (e.g., '9.2.2025')
  createdBy: string;
  qrCodeData: string; // URL for QR code image
  documents: Document[];
  trainingProgress: TrainingSection[];
}

export type NewCustomerData = Omit<Customer, 'id' | 'avatarInitials' | 'avatarColor' | 'balance' | 'totalTransactions' | 'level' | 'createdAt' | 'createdBy' | 'qrCodeData' | 'documents' | 'trainingProgress'>;

export interface Transaction {
  id: string;
  customerId: string;
  type: 'recharge' | 'debit';
  description: string;
  amount: number;
  date: string; // Date string (e.g., '22.12.2025')
  employee: string;
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
  createdAt: string;
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
  createdAt: string; // Date string (e.g., '11.12.2025')
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
  createdAt: string;
}