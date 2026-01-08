
import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Button from '../components/Button';
import Select from '../components/Select';
import Avatar from '../components/Avatar';
import { MOCK_REPORT_TYPES, MOCK_TRANSACTION_FILTERS, REFERENCE_DATE } from '../constants';
import { ArrowUpCircleIcon, ArrowDownCircleIcon, DollarSignIcon, ClipboardIcon, UsersIcon } from '../components/Icons';
import { parseDateString, isSameMonth } from '../utils';
import { Customer, Transaction, User, UserRoleEnum } from '../types';

import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Import jspdf-autotable plugin

interface ReportsProps {
  customers: Customer[];
  transactions: Transaction[];
  users: User[];
}

// Helper function to generate dynamic report periods
const generateReportPeriods = (reportType: string, referenceDate: Date) => {
  const periods = [];
  const currentMonthName = referenceDate.toLocaleString('de-DE', { month: 'long' });
  const currentYear = referenceDate.getFullYear();

  if (reportType === 'Monatlich') {
    // Current month
    periods.push({ value: `${currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)} ${currentYear}`, label: `${currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)} ${currentYear}` });

    // Previous month
    const prevMonthDate = new Date(referenceDate);
    prevMonthDate.setMonth(referenceDate.getMonth() - 1);
    const prevMonthName = prevMonthDate.toLocaleString('de-DE', { month: 'long' });
    const prevMonthYear = prevMonthDate.getFullYear();
    periods.push({ value: `${prevMonthName.charAt(0).toUpperCase() + prevMonthName.slice(1)} ${prevMonthYear}`, label: `${prevMonthName.charAt(0).toUpperCase() + prevMonthName.slice(1)} ${prevMonthYear}` });
    
  } else if (reportType === 'Jährlich') {
    // Current year
    periods.push({ value: String(currentYear), label: String(currentYear) });

    // Previous year
    periods.push({ value: String(currentYear - 1), label: String(currentYear - 1) });
  } else if (reportType === 'Benutzerdefiniert') {
    // For now, "Gesamt" represents a custom, all-encompassing period
    periods.push({ value: 'Gesamt', label: 'Gesamt' });
  }
  return periods;
};


const Reports: React.FC<ReportsProps> = ({ customers, transactions, users }) => {
  const [reportType, setReportType] = useState('Monatlich');
  const [employee, setEmployee] = useState('Alle Mitarbeiter');
  const [transactionFilter, setTransactionFilter] = useState('Alle Transaktionen'); // New state for transaction type filter

  const initialPeriods = generateReportPeriods('Monatlich', REFERENCE_DATE);
  const [timePeriod, setTimePeriod] = useState(initialPeriods.length > 0 ? initialPeriods[0].value : 'Gesamt');
  const [availableTimePeriods, setAvailableTimePeriods] = useState(initialPeriods);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Effect to update availableTimePeriods and reset timePeriod when reportType changes
  useEffect(() => {
    const newPeriods = generateReportPeriods(reportType, REFERENCE_DATE);
    setAvailableTimePeriods(newPeriods);
    if (newPeriods.length > 0) {
      setTimePeriod(newPeriods[0].value); // Set to the first option by default
    } else {
      setTimePeriod('Gesamt'); // Fallback
    }
  }, [reportType]);

  // Dynamically generate employee options from the users prop
  const employeeOptions = useMemo(() => {
    const staff = users
      .filter(u => u.role === UserRoleEnum.ADMIN || u.role === UserRoleEnum.MITARBEITER)
      .map(u => ({
        value: `${u.firstName} ${u.lastName}`,
        label: `${u.firstName} ${u.lastName}`,
      }));
    return [{ value: 'Alle Mitarbeiter', label: 'Alle Mitarbeiter' }, ...staff];
  }, [users]);


  // Helper for parsing current filter period
  const getFilterPeriodDate = () => {
    if (timePeriod === 'Gesamt') return null;

    // Check if it's a year (e.g., "2025")
    if (!isNaN(parseInt(timePeriod, 10)) && timePeriod.length === 4) {
      return new Date(parseInt(timePeriod, 10), 0, 1); // January 1st of the year
    }
    
    // Assume "Month YYYY" format for detailed filtering
    const [monthName, year] = timePeriod.split(' ');
    const monthMap: { [key: string]: number } = {
      'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 'Mai': 4, 'Juni': 5,
      'Juli': 6, 'August': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
    };
    const monthIndex = monthMap[monthName];
    if (monthIndex !== undefined && year) {
      return new Date(parseInt(year, 10), monthIndex, 1);
    }
    return null;
  };

  const selectedFilterPeriod = getFilterPeriodDate();

  // Filter transactions based on selected criteria
  const filteredTransactions = transactions
    .filter(t => {
      const transactionDate = parseDateString(t.date);
      if (!transactionDate) return false;

      // Filter by period
      let matchesPeriod = true;
      if (timePeriod === 'Gesamt') {
        matchesPeriod = true;
      } else if (reportType === 'Monatlich' && selectedFilterPeriod) {
        matchesPeriod = isSameMonth(transactionDate, selectedFilterPeriod);
      } else if (reportType === 'Jährlich' && selectedFilterPeriod) {
        matchesPeriod = transactionDate.getFullYear() === selectedFilterPeriod.getFullYear();
      }


      // Filter by employee
      const matchesEmployee = employee === 'Alle Mitarbeiter' || t.employee === employee;

      // Filter by transaction type
      let matchesTransactionType = true;
      if (transactionFilter === 'Einnahmen (Aufladungen)') {
        matchesTransactionType = t.type === 'recharge';
      } else if (transactionFilter === 'Ausgaben (Abbuchungen)') {
        matchesTransactionType = t.type === 'debit';
      }

      return matchesPeriod && matchesEmployee && matchesTransactionType;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Dynamic calculations for Report Stats
  const monthlyRecharges = filteredTransactions
    .filter(t => t.type === 'recharge')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const monthlyDebits = filteredTransactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalMonthlyTransactions = filteredTransactions.length;

  const activeCustomerIdsInPeriod = new Set(
    filteredTransactions.map(t => t.customerId)
  );
  const activeCustomersInPeriodCount = customers.filter(c => activeCustomerIdsInPeriod.has(c.id)).length;


  const getTopCustomers = () => {
    const customerTransactions: { [key: string]: { count: number; totalAmount: number } } = {};
    filteredTransactions.forEach(t => {
      if (!customerTransactions[t.customerId]) {
        customerTransactions[t.customerId] = { count: 0, totalAmount: 0 };
      }
      customerTransactions[t.customerId].count++;
      customerTransactions[t.customerId].totalAmount += Math.abs(t.amount);
    });

    return Object.entries(customerTransactions)
      .sort(([, a], [, b]) => b.totalAmount - a.totalAmount)
      .slice(0, 3)
      .map(([customerId, data]) => {
        const customer = customers.find(c => c.id === customerId);
        return {
          customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unbekannt',
          dogName: customer?.dogName || '',
          transactionCount: data.count,
          totalAmount: data.totalAmount,
          avatarInitials: customer?.avatarInitials || '?',
          avatarColor: customer?.avatarColor || 'bg-gray-400',
          id: customerId,
        };
      });
  };

  const topCustomers = getTopCustomers();

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Report Title
      doc.setFontSize(22);
      doc.text(`Mantrailing Card App - ${reportType} Bericht`, 105, yPos, { align: 'center' });
      yPos += 10;
      doc.line(20, yPos, 190, yPos); // Horizontal line
      yPos += 10;

      // Filter Details
      doc.setFontSize(12);
      doc.text(`Berichtstyp: ${reportType}`, 20, yPos);
      yPos += 7;
      doc.text(`Zeitraum: ${timePeriod}`, 20, yPos);
      yPos += 7;
      doc.text(`Mitarbeiter: ${employee}`, 20, yPos);
      yPos += 7;
      doc.text(`Transaktionstyp: ${transactionFilter}`, 20, yPos); // Add transaction filter to PDF
      yPos += 7;
      doc.text(`Erstellt am: ${REFERENCE_DATE.toLocaleDateString('de-DE')}`, 20, yPos);
      yPos += 15;

      // Summary Stats
      doc.setFontSize(16);
      doc.text('Übersicht', 20, yPos);
      yPos += 7;
      doc.setFontSize(12);
      doc.text(`Gesamtaufladungen: ${monthlyRecharges.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`, 20, yPos);
      yPos += 7;
      doc.text(`Abbuchungen: ${monthlyDebits.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`, 20, yPos);
      yPos += 7;
      doc.text(`Anzahl Transaktionen: ${totalMonthlyTransactions}`, 20, yPos);
      yPos += 7;
      doc.text(`Aktive Kunden: ${activeCustomersInPeriodCount}`, 20, yPos);
      yPos += 15;

      // Transactions Table
      doc.setFontSize(16);
      doc.text(`${transactionFilter} im Zeitraum`, 20, yPos); // Dynamic title based on filter
      yPos += 5;

      const transactionsHeaders = [['Datum', 'Beschreibung', 'Kunde', 'Mitarbeiter', 'Typ', 'Betrag']];
      const transactionsData = filteredTransactions.map(t => {
        const customer = customers.find(c => c.id === t.customerId);
        const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Unbekannt';
        const isRecharge = t.type === 'recharge';
        const amountSign = isRecharge ? '+' : '-';
        const formattedAmount = `${amountSign}${Math.abs(t.amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`;
        return [t.date, t.description, customerName, t.employee, t.type === 'recharge' ? 'Aufladung' : 'Abbuchung', formattedAmount];
      });

      (doc as any).autoTable({
        startY: yPos,
        head: transactionsHeaders,
        body: transactionsData,
        theme: 'striped',
        headStyles: { fillColor: [0, 161, 214] }, // Blue color for header
        margin: { top: 10, right: 20, bottom: 10, left: 20 },
        didParseCell: function (data: any) {
          if (data.section === 'body' && data.column.index === 5) { // Amount column
            const amountStr = data.cell.text[0];
            if (amountStr && amountStr.startsWith('+')) {
              data.cell.styles.textColor = [34, 139, 34]; // Green for recharge
            } else if (amountStr && amountStr.startsWith('-')) {
              data.cell.styles.textColor = [220, 20, 60]; // Red for debit
            }
          }
        },
      });

      const fileName = `Bericht_${reportType.replace(' ', '_')}_${timePeriod.replace(' ', '_')}_${employee.replace(' ', '_')}_${transactionFilter.replace(' ', '_')}.pdf`;
      doc.save(fileName);
      alert('PDF Export erfolgreich!');
    } catch (error) {
      console.error("Fehler beim Erstellen der PDF:", error);
      alert('Fehler beim PDF Export. Bitte versuchen Sie es erneut.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Berichte & Statistiken</h1>
      <p className="text-gray-600 mb-8">Analysieren und exportieren Sie Ihre Geschäftsdaten</p>

      {/* Filters and Export Button */}
      <Card className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <Select
            id="reportType"
            label="Berichtstyp"
            options={MOCK_REPORT_TYPES.map(type => ({ value: type, label: type }))}
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            disabled={isGeneratingPdf}
          />
          <Select
            id="timePeriod"
            label="Zeitraum"
            options={availableTimePeriods}
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            disabled={isGeneratingPdf}
          />
          <Select
            id="employee"
            label="Mitarbeiter"
            options={employeeOptions}
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            disabled={isGeneratingPdf}
          />
          <Select
            id="transactionFilter"
            label="Transaktionstyp"
            options={MOCK_TRANSACTION_FILTERS.map(filter => ({ value: filter, label: filter }))}
            value={transactionFilter}
            onChange={(e) => setTransactionFilter(e.target.value)}
            disabled={isGeneratingPdf}
          />
          {/* Button moved to the last position in the grid to appear bottom-right */}
          <Button 
            variant="success" 
            className="w-full sm:col-span-1 lg:col-start-4 lg:col-span-1 lg:w-auto"
            onClick={handleExportPdf}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? 'PDF wird generiert...' : 'Als PDF exportieren'}
          </Button>
        </div>
      </Card>

      {/* Stats Cards for Reports */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Gesamtaufladungen"
          value={monthlyRecharges.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          icon={UsersIcon}
          color="bg-green-100 text-green-700"
        />
        <StatCard
          title="Abbuchungen"
          value={monthlyDebits.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          icon={DollarSignIcon}
          color="bg-orange-100 text-orange-700"
        />
        <StatCard
          title="Transaktionen"
          value={totalMonthlyTransactions}
          icon={ClipboardIcon}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          title="Aktive Kunden"
          value={activeCustomersInPeriodCount}
          icon={UsersIcon}
          color="bg-purple-100 text-purple-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaktionen im Zeitraum */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900">{transactionFilter} im Zeitraum ({filteredTransactions.length})</h2>
          <hr className="w-24 h-px mt-2 mb-4 bg-gray-200 border-0" />
          <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
            {filteredTransactions.length === 0 ? (
              <p className="text-gray-500">Keine Transaktionen für den ausgewählten Zeitraum, Mitarbeiter und Transaktionstyp gefunden.</p>
            ) : (
              filteredTransactions.map((transaction) => {
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
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.date} von {transaction.employee}
                          {customer && ` für ${customer.firstName} ${customer.lastName}`}
                        </p>
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

        {/* Top Kunden im Zeitraum */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900">Top Kunden im Zeitraum</h2>
          <hr className="w-24 h-px mt-2 mb-4 bg-gray-200 border-0" />
          <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
            {topCustomers.length === 0 ? (
              <p className="text-gray-500">Keine Top-Kunden für den ausgewählten Zeitraum und Mitarbeiter gefunden.</p>
            ) : (
              topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-gray-700 mr-3">{index + 1}.</span>
                    <Avatar initials={customer.avatarInitials} color={customer.avatarColor} size="md" className="mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{customer.customerName}</p>
                      <p className="text-sm text-gray-500">
                        {customer.dogName} &bull; {customer.transactionCount} Transaktion{customer.transactionCount !== 1 ? 'en' : ''}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-800">
                    {customer.totalAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
