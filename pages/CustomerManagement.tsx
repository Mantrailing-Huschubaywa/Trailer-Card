import React, { useState } from 'react';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Table, { Column } from '../components/Table';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import { PlusIcon, ChevronRightIcon, UsersIcon, HeartIcon, ClipboardIcon, RepeatIcon, UserPlusIcon } from '../components/Icons';
import { ALPHABET, REFERENCE_DATE } from '../constants';
import { Customer, CustomerTableData, TrainingLevelEnum, Transaction, User, UserRoleEnum } from '../types';
import { useNavigate } from 'react-router-dom';
import { parseDateString, isSameMonth } from '../utils';

interface CustomerManagementProps {
  customers: Customer[];
  transactions: Transaction[];
  currentUser: User | null; // Added currentUser prop
}

// Helper function to get color classes based on training level for the badge
const getLevelColorClass = (level: TrainingLevelEnum) => {
  switch (level) {
    case TrainingLevelEnum.EINSTEIGER:
      return 'bg-fuchsia-100 text-fuchsia-800'; // Orchid
    case TrainingLevelEnum.GRUNDLAGEN:
      return 'bg-lime-100 text-lime-800'; // Lime Green
    case TrainingLevelEnum.FORTGESCHRITTENE:
      return 'bg-sky-100 text-sky-800'; // Sky Blue
    case TrainingLevelEnum.MASTERCLASS:
      return 'bg-amber-100 text-amber-800'; // Peru
    case TrainingLevelEnum.EXPERT:
      return 'bg-indigo-100 text-indigo-800'; // Indigo
    default:
      return 'bg-gray-100 text-gray-800'; // Default
  }
};

// Helper function to get color classes based on training level for the avatar circle
const getAvatarColorForLevel = (level: TrainingLevelEnum) => {
  switch (level) {
    case TrainingLevelEnum.EINSTEIGER:
      return 'bg-fuchsia-500'; // Orchid (500-level for stronger color on avatar)
    case TrainingLevelEnum.GRUNDLAGEN:
      return 'bg-lime-500'; // Lime Green
    case TrainingLevelEnum.FORTGESCHRITTENE:
      return 'bg-sky-500'; // Sky Blue
    case TrainingLevelEnum.MASTERCLASS:
      return 'bg-amber-500'; // Peru
    case TrainingLevelEnum.EXPERT:
      return 'bg-indigo-500'; // Indigo
    default:
      return 'bg-gray-400'; // Default (a neutral grey)
  }
};


const CustomerManagement: React.FC<CustomerManagementProps> = ({ customers, transactions, currentUser }) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<string>('Alle');

  // Dynamic calculations for Customer Management Stats
  const totalCustomers = customers.length;
  const totalBalance = customers.reduce((sum, c) => sum + c.balance, 0);

  const today = REFERENCE_DATE;
  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = parseDateString(t.date);
    return transactionDate && isSameMonth(transactionDate, today);
  });
  const monthlyTransactionsCount = currentMonthTransactions.length;

  // Determine active customers (those with transactions in the current month)
  const activeCustomerIds = new Set(
    currentMonthTransactions.map(t => t.customerId)
  );
  const activeCustomersCount = customers.filter(c => activeCustomerIds.has(c.id)).length;


  const filteredCustomers = customers.filter((customer) => {
    if (activeFilter === 'Alle') {
      return true;
    }
    return customer.lastName.startsWith(activeFilter);
  });

  const customerTableData: CustomerTableData[] = filteredCustomers.map((customer) => ({
    id: customer.id,
    avatarInitials: customer.avatarInitials,
    avatarColor: customer.avatarColor, // This will be dynamically overridden in render
    name: `${customer.firstName} ${customer.lastName}\n${customer.id}`,
    dog: customer.dogName,
    balance: customer.balance,
    level: customer.level,
    createdAt: customer.createdAt,
  }));

  const columns: Column<CustomerTableData>[] = [
    {
      key: 'name',
      header: 'Kunde',
      render: (item: CustomerTableData) => (
        <div className="flex items-center">
          <Avatar
            initials={item.avatarInitials}
            color={getAvatarColorForLevel(item.level)} // Use level-specific color for avatar
            size="md"
            className="mr-3"
          />
          <div>
            <p className="font-medium text-gray-900">{item.name.split('\n')[0]}</p>
            <p className="text-sm text-gray-500">{item.name.split('\n')[1]}</p>
          </div>
        </div>
      ),
    },
    { key: 'dog', header: 'Hund' },
    {
      key: 'balance',
      header: 'Guthaben',
      render: (item: CustomerTableData) => item.balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }),
    },
    {
      key: 'level',
      header: 'Level',
      render: (item: CustomerTableData) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColorClass(item.level)}`}>
          {item.level}
        </span>
      ),
    },
    { key: 'createdAt', header: 'Erstellt' },
    {
      key: 'id',
      header: '',
      render: (item: CustomerTableData) => (
        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
      ),
      className: 'text-right',
    },
  ];

  const handleRowClick = (customerData: CustomerTableData) => {
    navigate(`/customers/${customerData.id}`);
  };

  const canCreateCustomer = currentUser?.role === UserRoleEnum.ADMIN || currentUser?.role === UserRoleEnum.MITARBEITER;

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kundenverwaltung</h1>
          <p className="text-gray-600">Verwalten Sie alle Ihre Kunden an einem Ort</p>
        </div>
        {canCreateCustomer && (
          <Button variant="success" icon={UserPlusIcon} disabled> {/* Disabled for now, as creation is through UserManagement or registration */}
            Neuer Kunde
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
        <StatCard
          title="Kunden Gesamt"
          value={totalCustomers}
          icon={UsersIcon}
          color="bg-green-100 text-green-700"
        />
        <StatCard
          title="Aktiv"
          value={activeCustomersCount} // Dynamically calculated
          icon={HeartIcon}
          color="bg-orange-100 text-orange-700"
        />
        <StatCard
          title="Guthaben"
          value={totalBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} // Dynamically calculated
          icon={ClipboardIcon}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          title="Transaktionen Monat"
          value={monthlyTransactionsCount} // Dynamically calculated
          icon={RepeatIcon}
          color="bg-purple-100 text-purple-700"
        />
      </div>

      {/* Alphabet Filter */}
      <Card className="mb-6 px-4 py-2">
        <div className="flex flex-wrap justify-between gap-2">
          <button
            onClick={() => setActiveFilter('Alle')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${activeFilter === 'Alle' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Alle
          </button>
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              onClick={() => setActiveFilter(letter)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${activeFilter === letter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {letter}
            </button>
          ))}
        </div>
      </Card>

      {/* Customer List Table */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Kundenliste ({filteredCustomers.length})</h2>
        <Table data={customerTableData} columns={columns} onRowClick={handleRowClick} />
      </Card>
    </div>
  );
};

export default CustomerManagement;