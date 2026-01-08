
import React, { useMemo, useState } from 'react';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Table, { Column } from '../components/Table';
import Avatar from '../components/Avatar';
import {
  ChevronRightIcon,
  UsersIcon,
  HeartIcon,
  ClipboardIcon,
  RepeatIcon,
} from '../components/Icons';
import { ALPHABET, REFERENCE_DATE } from '../constants';
import {
  Customer,
  CustomerTableData,
  TrainingLevelEnum,
  Transaction,
  User,
  UserRoleEnum,
} from '../types';
import { useNavigate } from 'react-router-dom';
import { parseDateString, isSameMonth } from '../utils';

interface CustomerManagementProps {
  customers: Customer[];
  transactions: Transaction[];
  currentUser: User;
}

// Helper function to get color classes based on training level for the badge
const getLevelColorClass = (level: TrainingLevelEnum) => {
  switch (level) {
    case TrainingLevelEnum.EINSTEIGER:
      return 'bg-fuchsia-100 text-fuchsia-800';
    case TrainingLevelEnum.GRUNDLAGEN:
      return 'bg-lime-100 text-lime-800';
    case TrainingLevelEnum.FORTGESCHRITTENE:
      return 'bg-sky-100 text-sky-800';
    case TrainingLevelEnum.MASTERCLASS:
      return 'bg-amber-100 text-amber-800';
    case TrainingLevelEnum.EXPERT:
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  transactions,
  currentUser,
}) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<string>('Alle');

  const totalCustomers = customers.length;
  const totalBalance = customers.reduce((sum, c) => sum + c.balance, 0);

  const today = REFERENCE_DATE;
  const currentYear = today.getFullYear();

  const totalTrailsThisYear = useMemo(() => {
    return transactions.filter(t => {
      if (t.description !== 'Trails') {
        return false;
      }
      const transactionDate = parseDateString(t.date);
      if (!transactionDate) {
        return false;
      }
      return transactionDate.getFullYear() === currentYear;
    }).length;
  }, [transactions, currentYear]);

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const transactionDate = parseDateString(t.date);
      return transactionDate && isSameMonth(transactionDate, today);
    });
  }, [transactions, today]);

  const monthlyTransactionsCount = currentMonthTransactions.length;

  const activeCustomerIds = useMemo(() => {
    return new Set(currentMonthTransactions.map((t) => t.customerId));
  }, [currentMonthTransactions]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (activeFilter === 'Alle') return true;
      return customer.lastName.startsWith(activeFilter);
    });
  }, [customers, activeFilter]);

  const customerTableData: CustomerTableData[] = useMemo(() => {
    return filteredCustomers.map((customer) => ({
      id: customer.id,
      avatarInitials: customer.avatarInitials,
      avatarColor: customer.avatarColor,
      name: `${customer.firstName} ${customer.lastName}\n${customer.id}`,
      dog: customer.dogName,
      balance: customer.balance,
      level: customer.level,
      totalTrails: customer.trainingProgress.reduce((sum, section) => sum + section.completedHours, 0),
      created_at: customer.created_at,
    }));
  }, [filteredCustomers]);

  const columns: Column<CustomerTableData>[] = [
    {
      key: 'name',
      header: 'Kunde',
      render: (item: CustomerTableData) => (
        <div className="flex items-center min-w-0">
          <Avatar
            initials={item.avatarInitials}
            color={item.avatarColor}
            size="md"
            className="mr-3"
          />
          <div className="min-w-0">
            <div className="flex items-center min-w-0">
              <p className="font-medium text-gray-900 break-words min-w-0">
                {item.name.split('\n')[0]}
              </p>
            </div>
            <p className="text-sm text-gray-500 break-all">{item.name.split('\n')[1]}</p>
          </div>
        </div>
      ),
    },
    { key: 'dog', header: 'Hund', className: 'hidden md:table-cell' },
    {
      key: 'balance',
      header: 'Guthaben',
      render: (item: CustomerTableData) =>
        item.balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }),
    },
    {
      key: 'level',
      header: 'Trails',
      className: 'hidden lg:table-cell',
      render: (item: CustomerTableData) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColorClass(
            item.level
          )}`}
        >
          {item.totalTrails}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Erstellt',
      className: 'hidden lg:table-cell',
      render: (item: CustomerTableData) => new Date(item.created_at).toLocaleDateString('de-DE'),
    },
    {
      key: 'id',
      header: '',
      render: () => <ChevronRightIcon className="h-5 w-5 text-gray-400" />,
      className: 'text-right',
    },
  ];

  const handleRowClick = (customerData: CustomerTableData) => {
    navigate(`/customers/${customerData.id}`);
  };

  const canCreateCustomer =
    currentUser.role === UserRoleEnum.ADMIN || currentUser.role === UserRoleEnum.MITARBEITER;

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kundenverwaltung</h1>
          <p className="text-gray-600">Verwalten Sie alle Ihre Kunden an einem Ort</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
        <StatCard title="Kunden Gesamt" value={totalCustomers} icon={UsersIcon} color="bg-green-100 text-green-700" />
        <StatCard title="Trails Gesamt" value={totalTrailsThisYear} icon={HeartIcon} color="bg-orange-100 text-orange-700" />
        <StatCard
          title="Guthaben"
          value={totalBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          icon={ClipboardIcon}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          title="Transaktionen Monat"
          value={monthlyTransactionsCount}
          icon={RepeatIcon}
          color="bg-purple-100 text-purple-700"
        />
      </div>

      <Card className="mb-6 px-4 py-2">
        <div className="flex flex-wrap justify-center gap-2 w-full">
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

      <Card>
        <h2 className="text-xl font-semibold text-gray-900">
          Kundenliste ({filteredCustomers.length})
        </h2>
        <hr className="w-24 h-px mt-2 mb-4 bg-gray-200 border-0" />

        {/* Mobile: Card List (like Reports); Desktop: Table */}
        <div className="block md:hidden">
          <div className="space-y-3">
            {customerTableData.length === 0 ? (
              <p className="text-gray-500">Keine Kunden gefunden.</p>
            ) : (
              customerTableData.map((c) => {
                const [fullName, customerId] = c.name.split('\n');
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleRowClick(c)}
                    className="w-full text-left"
                  >
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center min-w-0">
                          <Avatar
                            initials={c.avatarInitials}
                            color={c.avatarColor}
                            size="md"
                            className="mr-3"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center min-w-0">
                              <p className="font-medium text-gray-900 break-words min-w-0">{fullName}</p>
                            </div>
                            <p className="text-sm text-gray-500 break-all">{customerId}</p>
                            {c.dog && <p className="text-sm text-gray-600 mt-1">{c.dog}</p>}
                          </div>
                        </div>

                        <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="font-semibold text-gray-900">
                          {c.balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                        </p>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColorClass(
                            c.level
                          )}`}
                        >
                          {c.totalTrails}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        Erstellt am {new Date(c.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="hidden md:block">
          <Table data={customerTableData} columns={columns} onRowClick={handleRowClick} />
        </div>
      </Card>
    </div>
  );
};

export default CustomerManagement;
