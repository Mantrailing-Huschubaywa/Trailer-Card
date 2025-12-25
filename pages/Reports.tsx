import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Button from '../components/Button';
import Select from '../components/Select';
import Avatar from '../components/Avatar';
import { MOCK_REPORT_TYPES, MOCK_TRANSACTION_FILTERS, REFERENCE_DATE } from '../constants';
import { ArrowUpCircleIcon, ArrowDownCircleIcon, DollarSignIcon, ClipboardIcon, UsersIcon } from '../components/Icons';
import { parseDateString, isSameMonth } from '../utils';
import { Customer, Transaction, User, UserRoleEnum } from '../types'; // UserRoleEnum importiert
import { useNavigate } from 'react-router-dom'; // useNavigate importiert

import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReportsProps {
  customers: Customer[];
  transactions: Transaction[];
  users: User[]; // Alle Benutzer, um Mitarbeiternamen zuzuordnen
  currentUser: User | null; // currentUser hinzugefügt für Berechtigungsprüfung
}

// Hilfsfunktion zum Generieren dynamischer Berichtszeiträume
const generateReportPeriods = (reportType: string, referenceDate: Date) => {
  const periods = [];
  const currentMonthName = referenceDate.toLocaleString('de-DE', { month: 'long' });
  const currentYear = referenceDate.getFullYear();

  if (reportType === 'Monatlich') {
    // Aktueller Monat
    periods.push({ value: `${currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)} ${currentYear}`, label: `${currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)} ${currentYear}` });

    // Vorheriger Monat
    const prevMonthDate = new Date(referenceDate);
    prevMonthDate.setMonth(referenceDate.getMonth() - 1);
    const prevMonthName = prevMonthDate.toLocaleString('de-DE', { month: 'long' });
    const prevMonthYear = prevMonthDate.getFullYear();
    periods.push({ value: `${prevMonthName.charAt(0).toUpperCase() + prevMonthName.slice(1)} ${prevMonthYear}`, label: `${prevMonthName.charAt(0).toUpperCase() + prevMonthName.slice(1)} ${prevMonthYear}` });
    
  } else if (reportType === 'Jährlich') {
    // Aktuelles Jahr
    periods.push({ value: String(currentYear), label: String(currentYear) });

    // Vorheriges Jahr
    periods.push({ value: String(currentYear - 1), label: String(currentYear - 1) });
  } else if (reportType === 'Benutzerdefiniert') {
    // Vorerst steht "Gesamt" für einen benutzerdefinierten, alles umfassenden Zeitraum
    periods.push({ value: 'Gesamt', label: 'Gesamt' });
  }
  return periods;
};


const Reports: React.FC<ReportsProps> = ({ customers, transactions, users, currentUser }) => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('Monatlich');
  const [employee, setEmployee] = useState('Alle Mitarbeiter');
  const [transactionFilter, setTransactionFilter] = useState('Alle Transaktionen');

  const initialPeriods = generateReportPeriods('Monatlich', REFERENCE_DATE);
  const [timePeriod, setTimePeriod] = useState(initialPeriods.length > 0 ? initialPeriods[0].value : 'Gesamt');
  const [availableTimePeriods, setAvailableTimePeriods] = useState(initialPeriods);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Berechtigungsprüfung: Nur Admin darf Berichte sehen
  useEffect(() => {
    if (currentUser && currentUser.role !== UserRoleEnum.ADMIN) {
      alert('Sie haben keine Berechtigung, diese Seite anzuzeigen.');
      navigate('/'); // Zum Dashboard umleiten
    }
  }, [currentUser, navigate]);

  // Mitarbeiter für Berichte aus den tatsächlichen Benutzern ableiten, die Transaktionen durchgeführt haben
  const uniqueEmployeeIds = new Set(transactions.map(t => t.employeeId).filter(Boolean));
  const reportEmployees = [
    { value: 'Alle Mitarbeiter', label: 'Alle Mitarbeiter' },
    ...Array.from(uniqueEmployeeIds).map(empId => {
      const employeeUser = users.find(u => u.id === empId);
      return {
        value: empId!,
        label: employeeUser ? `${employeeUser.firstName} ${employeeUser.lastName}` : `Unbekannter Mitarbeiter (${empId})`,
      };
    }),
  ];


  // Effekt zum Aktualisieren von availableTimePeriods und Zurücksetzen von timePeriod, wenn sich reportType ändert
  useEffect(() => {
    const newPeriods = generateReportPeriods(reportType, REFERENCE_DATE);
    setAvailableTimePeriods(newPeriods);
    if (newPeriods.length > 0) {
      setTimePeriod(newPeriods[0].value); // Standardmäßig auf die erste Option setzen
    } else {
      setTimePeriod('Gesamt'); // Fallback
    }
  }, [reportType]);


  // Hilfsfunktion zum Parsen des aktuellen Filterzeitraums
  const getFilterPeriodDate = () => {
    if (timePeriod === 'Gesamt') return null;

    // Prüfen, ob es sich um ein Jahr handelt (z.B. "2025")
    if (!isNaN(parseInt(timePeriod, 10)) && timePeriod.length === 4) {
      return new Date(parseInt(timePeriod, 10), 0, 1); // 1. Januar des Jahres
    }
    
    // Angenommenes Format "Monat JJJJ" für detaillierteres Filtern
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

  // Transaktionen basierend auf ausgewählten Kriterien filtern
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = parseDateString(t.date);
    if (!transactionDate) return false;

    // Nach Zeitraum filtern
    let matchesPeriod = true;
    if (timePeriod === 'Gesamt') {
      matchesPeriod = true;
    } else if (reportType === 'Monatlich' && selectedFilterPeriod) {
      matchesPeriod = isSameMonth(transactionDate, selectedFilterPeriod);
    } else if (reportType === 'Jährlich' && selectedFilterPeriod) {
      matchesPeriod = transactionDate.getFullYear() === selectedFilterPeriod.getFullYear();
    }


    // Nach Mitarbeiter filtern (mittels employeeId)
    const matchesEmployee = employee === 'Alle Mitarbeiter' || t.employeeId === employee;

    // Nach Transaktionstyp filtern
    let matchesTransactionType = true;
    if (transactionFilter === 'Einnahmen (Aufladungen)') {
      matchesTransactionType = t.type === 'recharge';
    } else if (transactionFilter === 'Ausgaben (Abbuchungen)') {
      matchesTransactionType = t.type === 'debit';
    }

    return matchesPeriod && matchesEmployee && matchesTransactionType;
  });

  // Dynamische Berechnungen für Berichtsstatistiken
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

      // Berichttitel
      doc.setFontSize(22);
      doc.text(`Mantrailing Card App - ${reportType} Bericht`, 105, yPos, { align: 'center' });
      yPos += 10;
      doc.line(20, yPos, 190, yPos); // Horizontale Linie
      yPos += 10;

      // Filterdetails
      doc.setFontSize(12);
      doc.text(`Berichtstyp: ${reportType}`, 20, yPos);
      yPos += 7;
      doc.text(`Zeitraum: ${timePeriod}`, 20, yPos);
      yPos += 7;
      doc.text(`Mitarbeiter: ${employee === 'Alle Mitarbeiter' ? 'Alle Mitarbeiter' : users.find(u => u.id === employee)?.firstName + ' ' + users.find(u => u.id === employee)?.lastName || employee}`, 20, yPos);
      yPos += 7;
      doc.text(`Transaktionstyp: ${transactionFilter}`, 20, yPos);
      yPos += 7;
      doc.text(`Erstellt am: ${REFERENCE_DATE.toLocaleDateString('de-DE')}`, 20, yPos);
      yPos += 15;

      // Zusammenfassende Statistiken
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

      // Transaktionstabelle
      doc.setFontSize(16);
      doc.text(`${transactionFilter} im Zeitraum`, 20, yPos);
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
        headStyles: { fillColor: [0, 161, 214] },
        margin: { top: 10, right: 20, bottom: 10, left: 20 },
        didParseCell: function (data: any) {
          if (data.section === 'body' && data.column.index === 5) {
            const amountStr = data.cell.text[0];
            if (amountStr && amountStr.startsWith('+')) {
              data.cell.styles.textColor = [34, 139, 34];
            } else if (amountStr && amountStr.startsWith('-')) {
              data.cell.styles.textColor = [220, 20, 60];
            }
          }
        },
      });

      yPos = (doc as any).autoTable.previous.finalY + 15;

      // Top Kunden Tabelle
      doc.setFontSize(16);
      doc.text('Top Kunden im Zeitraum', 20, yPos);
      yPos += 5;

      const topCustomersHeaders = [['Rang', 'Kunde', 'Hund', 'Transaktionen', 'Gesamtbetrag']];
      const topCustomersData = topCustomers.map((c, index) => [
        index + 1,
        c.customerName,
        c.dogName,
        c.transactionCount,
        c.totalAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }),
      ]);

      (doc as any).autoTable({
        startY: yPos,
        head: topCustomersHeaders,
        body: topCustomersData,
        theme: 'striped',
        headStyles: { fillColor: [0, 161, 214] },
        margin: { top: 10, right: 20, bottom: 10, left: 20 },
      });

      const fileName = `Bericht_${reportType.replace(' ', '_')}_${timePeriod.replace(' ', '_')}_${employee.replace('Alle Mitarbeiter', 'Alle').replace(' ', '_')}_${transactionFilter.replace(' ', '_')}.pdf`;
      doc.save(fileName);
      alert('PDF-Export erfolgreich!');
    } catch (error) {
      console.error("Fehler beim Erstellen der PDF:", error);
      alert('Fehler beim PDF-Export. Bitte versuchen Sie es erneut.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Wenn der Benutzer kein Admin ist, rendern Sie nichts oder eine Lade-/Fehlermeldung
  if (currentUser && currentUser.role !== UserRoleEnum.ADMIN) {
    return (
      <div className="p-8 text-center text-red-600">
        Sie haben keine Berechtigung, diese Seite anzuzeigen. Sie werden zum Dashboard umgeleitet.
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Berichte & Statistiken</h1>
      <p className="text-gray-600 mb-8">Analysieren und exportieren Sie Ihre Geschäftsdaten</p>

      {/* Filter und Export-Button */}
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
            options={reportEmployees}
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
          {/* Button in die letzte Position im Raster verschoben, um unten rechts zu erscheinen */}
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

      {/* Statistik-Karten für Berichte */}
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{transactionFilter} im Zeitraum ({filteredTransactions.length})</h2>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Kunden im Zeitraum</h2>
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
                      <p className="text-sm text-gray-500}>
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