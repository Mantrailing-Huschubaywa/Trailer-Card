import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Button from '../components/Button';
import Select from '../components/Select';
import Avatar from '../components/Avatar';
import { MOCK_REPORT_TYPES, MOCK_TRANSACTION_FILTERS, REFERENCE_DATE } from '../constants';
import { ArrowUpCircleIcon, ArrowDownCircleIcon, DollarSignIcon, ClipboardIcon, UsersIcon } from '../components/Icons';
import { parseDateString, isSameMonth } from '../utils';
import { Customer, Transaction, User, UserRoleEnum } from '../types';
import { useNavigate } from 'react-router-dom';

import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReportsProps {
  customers: Customer[];
  transactions: Transaction[];
  users: User[];
  currentUser: User | null;
}

const Reports: React.FC<ReportsProps> = ({ customers, transactions, users, currentUser }) => {
  const navigate = useNavigate();

  // 🔒 Client-side Schutz: nur Admin darf Reports sehen
  useEffect(() => {
    if (currentUser && currentUser.role !== UserRoleEnum.ADMIN) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const [selectedReportType, setSelectedReportType] = useState(MOCK_REPORT_TYPES[0]);
  const [selectedTransactionFilter, setSelectedTransactionFilter] = useState(MOCK_TRANSACTION_FILTERS[0]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  const filteredTransactions = transactions.filter(transaction => {
    const matchesType =
      selectedTransactionFilter.value === 'all' ||
      transaction.type === selectedTransactionFilter.value;

    const matchesEmployee =
      selectedEmployee === 'all' || transaction.employeeId === selectedEmployee;

    return matchesType && matchesEmployee;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'recharge')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const uniqueCustomers = new Set(filteredTransactions.map(t => t.customerId)).size;

  const topCustomers = customers
    .map(customer => {
      const customerTransactions = filteredTransactions.filter(t => t.customerId === customer.id);
      const totalAmount = customerTransactions.reduce((sum, t) => sum + t.amount, 0);

      return {
        ...customer,
        transactionCount: customerTransactions.length,
        totalAmount,
      };
    })
    .filter(c => c.transactionCount > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  const handleExportPdf = async () => {
    const doc = new jsPDF();
    doc.text('Bericht', 14, 20);

    const tableData = filteredTransactions.map(t => [
      t.date,
      t.description,
      t.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }),
      t.employeeName,
    ]);

    (doc as any).autoTable({
      startY: 30,
      head: [['Datum', 'Beschreibung', 'Betrag', 'Mitarbeiter']],
      body: tableData,
    });

    doc.save('bericht.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Berichte</h1>
        <Button onClick={handleExportPdf} icon={<ClipboardIcon />}>
          PDF exportieren
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Einnahmen"
          value={totalIncome.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          icon={<ArrowUpCircleIcon />}
        />
        <StatCard
          title="Ausgaben"
          value={totalExpenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          icon={<ArrowDownCircleIcon />}
        />
        <StatCard
          title="Kunden"
          value={uniqueCustomers.toString()}
          icon={<UsersIcon />}
        />
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Select
            label="Transaktionstyp"
            options={MOCK_TRANSACTION_FILTERS}
            value={selectedTransactionFilter}
            onChange={setSelectedTransactionFilter}
          />
          <Select
            label="Mitarbeiter"
            options={[
              { label: 'Alle', value: 'all' },
              ...users.map(user => ({
                label: user.firstName,
                value: user.id,
              })),
            ]}
            value={selectedEmployee}
            onChange={setSelectedEmployee}
          />
        </div>
      </Card>

      {/* Top Kunden im Zeitraum */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Kunden im Zeitraum</h2>
        <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
          {topCustomers.length === 0 ? (
            <p className="text-gray-500">
              Keine Top-Kunden für den ausgewählten Zeitraum und Mitarbeiter gefunden.
            </p>
          ) : (
            topCustomers.map((customer, index) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <span className="text-lg font-bold text-gray-700 mr-3">
                    {index + 1}.
                  </span>
                  <Avatar
                    initials={customer.avatarInitials}
                    color={customer.avatarColor}
                    size="md"
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {customer.customerName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {customer.dogName} &bull; {customer.transactionCount} Transaktion
                      {customer.transactionCount !== 1 ? 'en' : ''}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-gray-800">
                  {customer.totalAmount.toLocaleString('de-DE', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default Reports;
