import React from 'react';


export interface DbCustomerProfile {
  id: string; // PK
  auth_user_id: string | null; // FK to auth.users.id
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  dog_name: string | null;
  chip_number: string | null;
  qr_code_data: string | null;
  // Assuming a created_at field is present or handled by Supabase default.
  // If not, this can be derived from auth.users.created_at or omitted.
  created_at?: string;
}

export interface DbProfile {
  user_id: string; // PK, FK to auth.users.id
  role: UserRoleEnum;
}

export interface DbTransaction {
  id: string; // PK
  customer_profile_id: string; // FK to customer_profiles.id
  created_by_user_id: string | null; // FK to auth.users.id
  type: 'recharge' | 'debit';
  description: string | null;
  amount: number;
  created_at: string;
}

export interface DbTrainingProgress {
  id: string; // PK
  customer_profile_id: string; // FK to customer_profiles.id
  level_name: TrainingLevelEnum;
  completed_trails: number;
  status: 'Aktuell' | 'Gesperrt' | 'Abgeschlossen';
}

export interface Customer {
  id: string; // customer_profile.id
  authUserId: string | null; // customer_profile.auth_user_id
  avatarInitials: string;
  avatarColor: string;
  firstName: string; // customer_profile.first_name
  lastName: string; // customer_profile.last_name
  email: string; // from auth.users or customer_profile (if denormalized)
  phone: string; // customer_profile.phone
  dogName: string; // customer_profile.dog_name
  chipNumber: string; // customer_profile.chip_number
  balance: number; // Calculated from transactions
  totalTransactions: number; // Calculated from transactions
  level: TrainingLevelEnum; // Derived from trainingProgress
  createdAt: string; // customer_profile.created_at (formatted)
  qrCodeData: string; // customer_profile.qr_code_data
  documents: Document[]; // Still mock/placeholder, not from DB
  trainingProgress: TrainingSection[]; // Derived from DbTrainingProgress
}

export interface Transaction {
  id: string; // transactions.id
  customerId: string; // transactions.customer_profile_id
  employeeId: string | null; // transactions.created_by_user_id
  type: 'recharge' | 'debit';
  description: string; // transactions.description
  amount: number;
  date: string; // transactions.created_at (formatted)
  employee: string; // Derived from employeeId and user data
}

export enum TrainingLevelEnum {
  EINSTEIGER = 'Einsteiger',
  GRUNDLAGEN = 'Grundlagen',
  FORTGESCHRITTENE = 'Fortgeschrittene',
  MASTERCLASS = 'Masterclass',
  EXPERT = 'Expert',
}

export interface TrainingSection {
  id: number; // Logical order ID (1, 2, 3, etc.)
  dbId: string; // training_progress.id (actual PK in DB)
  name: TrainingLevelEnum;
  requiredHours: number;
  completedHours: number; // training_progress.completed_trails
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
  ADMIN = 'admin', // Matches SQL enum
  MITARBEITER = 'staff', // Matches SQL enum
  KUNDE = 'customer', // Matches SQL enum
}

// Schnittstelle für die Antwort von der Backend-API für alle Benutzer
export interface FullUserResponse {
  id: string;
  email: string;
  role: UserRoleEnum; // Verwenden Sie UserRoleEnum
  created_at: string;
  customer_profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export interface User {
  id: string; // auth.users.id
  avatarInitials: string;
  avatarColor: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRoleEnum; // public.profiles.role
  createdAt: string; // auth.users.created_at (formatted)
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