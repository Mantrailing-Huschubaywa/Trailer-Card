
import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import { REFERENCE_DATE } from '../constants';
import Avatar from '../components/Avatar';
import { ArrowUpCircleIcon, ArrowDownCircleIcon, UsersIcon, DollarSignIcon, ClipboardIcon, RepeatIcon, AwardIcon } from '../components/Icons';
import { Link } from 'react-router-dom';
import { parseDateString, isSameDay, isSameMonth } from '../utils';
import { Customer, Transaction, User } from '../types';
import DashboardInfoModal from '../components/DashboardInfoModal';
import { Column } from '../components/Table';
import Button from '../components/Button';

interface DashboardProps {
  customers: Customer[];
  transactions: Transaction[];
  currentUser: User | null;
}

interface LeaderboardItem {
    id: string;
    rank: number;
    avatarInitials: string;
    avatarColor: string;
    customerName: string;
    dogName: string;
    totalTrails: number;
}

const Dashboard: React.FC<DashboardProps> = ({ customers, transactions, currentUser }) => {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ title: string; items: any[]; columns: Column<any>[]; emptyStateMessage: string; } | null>(null);

  const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);

  const totalCustomers = customers.length;
  const totalBalance = customers.reduce((sum, customer) => sum + customer.balance, 0);

  const today = REFERENCE_DATE;
  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = parseDateString(t.date);
    return transactionDate && isSameMonth(transactionDate, today);
  });
  const todayTransactions = transactions.filter(t => {
    const transactionDate = parseDateString(t.date);
    return transactionDate && isSameDay(transactionDate, today);
  });

  const handleOpenModal = (title: string, items: any[], columns: Column<any>[], emptyStateMessage: string) => {
    setModalConfig({ title, items, columns, emptyStateMessage });
    setIsInfoModalOpen(true);
  };

  const customerColumns: Column<Customer>[] = useMemo(() => [
    {
      key: 'firstName',
      header: 'Kunde',
      render: (customer) => (
        <div className="flex items-center">
          <Avatar initials={customer.avatarInitials} color={customer.avatarColor} size="md" className="mr-3" />
          <div>
            <p className="font-medium text-gray-900">{customer.firstName} {customer.lastName}</p>
            <p className="text-sm text-gray-500">{customer.dogName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'balance',
      header: 'Guthaben',
      render: (customer) => customer.balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }),
      className: 'text-right font-semibold',
      headerClassName: 'text-right',
    },
  ], []);

  const transactionColumns: Column<Transaction>[] = useMemo(() => [
    {
        key: 'description',
        header: 'Transaktion',
        render: (transaction) => {
            const isRecharge = transaction.type === 'recharge';
            const Icon = isRecharge ? ArrowUpCircleIcon : ArrowDownCircleIcon;
            const iconColor = isRecharge ? 'text-green-500' : 'text-red-500';
            return (
                <div className="flex items-center">
                    <Icon className={`h-8 w-8 mr-3 flex-shrink-0 ${iconColor}`} />
                    <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{transaction.date}</p>
                    </div>
                </div>
            )
        }
    },
    {
        key: 'customerId',
        header: 'Kunde',
        render: (transaction) => {
            const customer = customerMap.get(transaction.customerId);
            return customer ? `${customer.firstName} ${customer.lastName}` : 'Unbekannt';
        },
    },
    {
        key: 'amount',
        header: 'Betrag',
        render: (transaction) => {
            const isRecharge = transaction.type === 'recharge';
            const amountColor = isRecharge ? 'text-green-700' : 'text-red-700';
            const amountSign = isRecharge ? '+' : '-';
            return (
                <span className={`font-semibold ${amountColor}`}>
                    {amountSign}{Math.abs(transaction.amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </span>
            )
        },
        className: 'text-right',
        headerClassName: 'text-right',
    }
  ], [customerMap]);

  const leaderboardData = useMemo(() => {
    return customers
      .map(c => ({
        id: c.id,
        avatarInitials: c.avatarInitials,
        avatarColor: c.avatarColor,
        customerName: `${c.firstName} ${c.lastName}`,
        dogName: c.dogName,
        totalTrails: c.trainingProgress.reduce((sum, section) => sum + section.completedHours, 0),
      }))
      .sort((a, b) => b.totalTrails - a.totalTrails)
      .slice(0, 10) // Get top 10
      .map((c, index) => ({ ...c, rank: index + 1 }));
  }, [customers]);
  
  const leaderboardColumns: Column<LeaderboardItem>[] = useMemo(() => [
    {
      key: 'rank',
      header: '#',
      render: (item) => <span className="font-bold text-lg text-gray-700">{item.rank}</span>,
      className: 'text-center',
      headerClassName: 'text-center',
    },
    {
      key: 'customerName',
      header: 'Kunde',
      render: (item) => (
        <div className="flex items-center">
          <Avatar initials={item.avatarInitials} color={item.avatarColor} size="md" className="mr-3" />
          <div>
            <p className="font-medium text-gray-900">{item.customerName}</p>
            <p className="text-sm text-gray-500">{item.dogName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'totalTrails',
      header: 'Absolvierte Trails',
      render: (item) => <span className="font-bold text-blue-600 text-lg">{item.totalTrails}</span>,
      className: 'text-right',
      headerClassName: 'text-right',
    },
  ], []);

  const dashboardStats = [
    { 
      title: 'Kunden Gesamt', 
      value: totalCustomers, 
      icon: UsersIcon, 
      color: 'bg-green-100 text-green-700',
      onClick: () => handleOpenModal('Alle Kunden', customers.sort((a,b) => a.lastName.localeCompare(b.lastName)), customerColumns, 'Es sind keine Kunden vorhanden.')
    },
    { 
      title: 'Guthaben gesamt', 
      value: totalBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }), 
      icon: DollarSignIcon, 
      color: 'bg-orange-100 text-orange-700',
      onClick: () => handleOpenModal('Guthabenübersicht', customers.sort((a,b) => b.balance - a.balance), customerColumns, 'Es sind keine Kundenguthaben vorhanden.')
    },
    { 
      title: 'Transaktionen Heute', 
      value: todayTransactions.length, 
      icon: ClipboardIcon, 
      color: 'bg-blue-100 text-blue-700',
      onClick: () => handleOpenModal('Heutige Transaktionen', todayTransactions, transactionColumns, 'Heute gab es keine Transaktionen.')
    },
    { 
      title: 'Transaktionen Monat', 
      value: currentMonthTransactions.length, 
      icon: RepeatIcon, 
      color: 'bg-purple-100 text-purple-700',
      onClick: () => handleOpenModal('Transaktionen in diesem Monat', currentMonthTransactions, transactionColumns, 'In diesem Monat gab es keine Transaktionen.')
    },
  ];

  const recentCustomers = [...customers]
    .sort((a, b) => {
      const dateA = parseDateString(a.created_at);
      const dateB = parseDateString(b.created_at);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  const latestTransactions = [...transactions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
    
  const welcomeMessage = currentUser ? `Hallo, ${currentUser.firstName}!` : 'Willkommen!';

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{welcomeMessage}</h1>
          <p className="text-gray-600">Übersicht ihrer Trails-Wertkarten</p>
        </div>
        <Button 
            variant="secondary" 
            icon={AwardIcon}
            onClick={() => handleOpenModal('Top 10 - Bestenliste', leaderboardData, leaderboardColumns, 'Keine Kundendaten für eine Bestenliste vorhanden.')}
        >
            Bestenliste
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardStats.map((stat, index) => (
          <button
            key={index}
            onClick={stat.onClick}
            className="text-left transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
            aria-label={`Details für ${stat.title} anzeigen`}
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
            />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold text-gray-900">Aktuelle Kunden</h2>
          <hr className="w-24 h-px mt-2 mb-4 bg-gray-200 border-0" />
          <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
            {recentCustomers.length === 0 ? (
              <p className="text-gray-500 text-sm">Keine aktuellen Kunden gefunden.</p>
            ) : (
              recentCustomers.map((customer) => (
                <Link to={`/customers/${customer.id}`} key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                  <div className="flex items-center">
                    <Avatar initials={customer.avatarInitials} color={customer.avatarColor} size="md" className="mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{customer.firstName} {customer.lastName}</p>
                      <p className="text-sm text-gray-500">{customer.dogName}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-800">{customer.balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900">Letzte Transaktionen</h2>
          <hr className="w-24 h-px mt-2 mb-4 bg-gray-200 border-0" />
          <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
            {latestTransactions.length === 0 ? (
              <p className="text-gray-500 text-sm">Keine aktuellen Transaktionen gefunden.</p>
            ) : (
              latestTransactions.map((transaction) => {
                const customer = customers.find(c => c.id === transaction.customerId);
                const isRecharge = transaction.type === 'recharge';
                const TransactionIcon = isRecharge ? ArrowUpCircleIcon : ArrowDownCircleIcon;
                const iconColor = isRecharge ? 'text-green-500' : 'text-red-500';
                const amountColor = isRecharge ? 'text-green-700' : 'text-red-700';
                const amountSign = isRecharge ? '+' : '-';

                return (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className={`p-2 rounded-full bg-gray-200 mr-3 ${iconColor}`}>
                        <TransactionIcon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{customer?.firstName} {customer?.lastName}</p>
                        <p className="text-sm text-gray-500">{transaction.date} - {transaction.description}</p>
                      </div>
                    </div>
                    <p className={`font-semibold ${amountColor}`}>
                      {amountSign}{Math.abs(transaction.amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
      
      {modalConfig && (
        <DashboardInfoModal
            isOpen={isInfoModalOpen}
            onClose={() => setIsInfoModalOpen(false)}
            title={modalConfig.title}
            items={modalConfig.items}
            columns={modalConfig.columns}
            emptyStateMessage={modalConfig.emptyStateMessage}
        />
      )}
    </div>
  );
};

export default Dashboard;
