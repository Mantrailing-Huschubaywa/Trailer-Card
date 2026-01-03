
import React from 'react';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import { REFERENCE_DATE } from '../constants'; // Only REFERENCE_DATE remains in constants
import Avatar from '../components/Avatar';
import { ArrowUpCircleIcon, ArrowDownCircleIcon, UsersIcon, DollarSignIcon, ClipboardIcon, RepeatIcon } from '../components/Icons';
import { Link } from 'react-router-dom';
import { parseDateString, isSameDay, isSameMonth } from '../utils';
import { Customer, Transaction, User } from '../types'; // Import User type

interface DashboardProps {
  customers: Customer[];
  transactions: Transaction[];
  currentUser: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ customers, transactions, currentUser }) => {
  // Dynamic calculations for Dashboard Stats
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

  const dashboardStats = [
    { title: 'Kunden Gesamt', value: totalCustomers, icon: UsersIcon, color: 'bg-green-100 text-green-700' },
    { title: 'Guthaben gesamt', value: totalBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }), icon: DollarSignIcon, color: 'bg-orange-100 text-orange-700' },
    { title: 'Transaktionen Heute', value: todayTransactions.length, icon: ClipboardIcon, color: 'bg-blue-100 text-blue-700' },
    { title: 'Transaktionen Monat', value: currentMonthTransactions.length, icon: RepeatIcon, color: 'bg-purple-100 text-purple-700' },
  ];

  // Aktuelle Kunden (based on created_at, max 5, scrollable)
  const recentCustomers = [...customers]
    .sort((a, b) => {
      const dateA = parseDateString(a.created_at);
      const dateB = parseDateString(b.created_at);
      if (!dateA || !dateB) return 0; // Handle invalid dates
      return dateB.getTime() - dateA.getTime(); // Sort descending
    })
    .slice(0, 5); // Take top 5

  // Letzte Transaktionen (max 5, scrollable)
  const latestTransactions = [...transactions]
    .sort((a, b) => {
      const dateA = parseDateString(a.date);
      const dateB = parseDateString(b.date);
      if (!dateA || !dateB) return 0; // Handle invalid dates
      return dateB.getTime() - dateA.getTime(); // Sort descending
    })
    .slice(0, 5); // Take top 5
    
  const welcomeMessage = currentUser ? `Hallo, ${currentUser.firstName}!` : 'Willkommen!';

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{welcomeMessage}</h1>
      <p className="text-gray-600 mb-8">Übersicht ihrer Trails-Wertkarten</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardStats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aktuelle Kunden */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Aktuelle Kunden</h2>
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

        {/* Letzte Transaktionen */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Letzte Transaktionen</h2>
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
    </div>
  );
};

export default Dashboard;
