import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CustomerManagement from './pages/CustomerManagement';
import CustomerDetails from './pages/CustomerDetails';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import LoginPage from './pages/LoginPage';
import { Customer, Transaction, TrainingLevelEnum, User, UserRoleEnum, DbCustomerProfile, DbTransaction, DbTrainingProgress, FullUserResponse } from './types';
import { REFERENCE_DATE, TRAINING_LEVEL_DEFINITIONS } from './constants'; // ADMIN_STAFF_USER_DETAILS entfernt
import { supabase } from './supabaseClient';
import { parseDateString } from './utils';
import { getAllAppUsers, inviteUser, updateAppUser, deleteAppUser } from './api'; // Import der neuen API-Funktionen

const App: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Enthält Admin-, Mitarbeiter- und Kundenbenutzer
  const [session, setSession] = useState<any>(null); // Supabase Session Objekt
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Aktueller eingeloggter Benutzer mit App-spezifischen Details
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const navigate = useNavigate();

  // Hilfsfunktion zur deterministischen Ableitung von Namen und Avataren aus der E-Mail
  const deriveUserDetailsFromEmail = (email: string, role: UserRoleEnum) => {
    const parts = email.split('@')[0].split('.');
    let firstName = '';
    let lastName = '';

    if (parts.length > 0) {
      firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      if (parts.length > 1) {
        lastName = parts.slice(1).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
      }
    }

    const initials = `${firstName.charAt(0) || '?'}${lastName.charAt(0) || ''}`.toUpperCase().slice(0, 2);
    // Zufällige, aber konsistente Farbauswahl basierend auf dem ersten Initial
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500', 'bg-purple-500', 'bg-indigo-500', 'bg-pink-500', 'bg-yellow-500', 'bg-teal-500'];
    const colorIndex = initials.charCodeAt(0) % colors.length;
    const avatarColor = colors[colorIndex];

    return { firstName, lastName, avatarInitials: initials, avatarColor };
  };

  const fetchAllData = async () => {
    setIsLoadingInitialData(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      if (!currentSession) {
        setCustomers([]);
        setTransactions([]);
        setUsers([]);
        setCurrentUser(null);
        return; // Keine Session, nichts zu laden
      }

      const authUserId = currentSession.user.id;

      // 1. Alle Benutzer (Auth-Details + Profile + Kundenprofile) über die Backend-API abrufen
      const allApiUsers: FullUserResponse[] = await getAllAppUsers();

      // Transformiere FullUserResponse[] in User[]
      const transformedUsers: User[] = allApiUsers.map((apiUser: FullUserResponse) => {
        let firstName = '';
        let lastName = '';
        let avatarInitials = '';
        let avatarColor = '';
        let associatedCustomerId: string | undefined = undefined;

        if (apiUser.role === UserRoleEnum.KUNDE && apiUser.customer_profile) {
          firstName = apiUser.customer_profile.first_name || '';
          lastName = apiUser.customer_profile.last_name || '';
          associatedCustomerId = apiUser.customer_profile.id;
        } else {
          // Für Admin/Mitarbeiter und Kunden ohne customer_profile: Namen aus E-Mail ableiten
          const derived = deriveUserDetailsFromEmail(apiUser.email, apiUser.role);
          firstName = derived.firstName;
          lastName = derived.lastName;
        }
        const derivedAvatar = deriveUserDetailsFromEmail(apiUser.email, apiUser.role);
        avatarInitials = derivedAvatar.avatarInitials;
        avatarColor = derivedAvatar.avatarColor;


        return {
          id: apiUser.id,
          email: apiUser.email,
          role: apiUser.role,
          createdAt: parseDateString(apiUser.created_at)?.toLocaleDateString('de-DE') || apiUser.created_at,
          firstName,
          lastName,
          avatarInitials,
          avatarColor,
          associatedCustomerId,
        };
      });
      setUsers(transformedUsers);

      const currentLoggedInUser = transformedUsers.find(u => u.id === authUserId);
      setCurrentUser(currentLoggedInUser || null);

      if (!currentLoggedInUser) {
        console.warn('Eingeloggter Benutzer nicht in den transformierten Benutzerdaten gefunden.');
        return;
      }

      // Prüfe auf customer_profiles für den eingeloggten Kunden, falls es eine Kundenrolle ist
      if (currentLoggedInUser.role === UserRoleEnum.KUNDE && !currentLoggedInUser.associatedCustomerId) {
        const { data: existingCustomerProfile, error: customerProfileFetchError } = await supabase
          .from('customer_profiles')
          .select('id')
          .eq('auth_user_id', authUserId)
          .single();

        if (customerProfileFetchError && customerProfileFetchError.code !== 'PGRST116') { // PGRST116 bedeutet "keine Zeilen gefunden"
          throw customerProfileFetchError;
        }

        if (!existingCustomerProfile) {
          // Automatisches Erstellen eines customer_profile, falls es für einen eingeloggten Kunden nicht existiert
          const { data: newCustomerProfile, error: createProfileError } = await supabase
            .from('customer_profiles')
            .insert({
              auth_user_id: authUserId,
              first_name: currentLoggedInUser.firstName || 'Neuer',
              last_name: currentLoggedInUser.lastName || 'Kunde',
              qr_code_data: `https://example.com/customer/${authUserId}`, // Platzhalter QR
            })
            .select('id')
            .single();

          if (createProfileError) {
            throw createProfileError;
          }
          currentLoggedInUser.associatedCustomerId = newCustomerProfile.id; // Aktuellen Benutzer mit neuer Kunden-ID aktualisieren
          setCurrentUser({ ...currentLoggedInUser }); // State aktualisieren, um neue associatedCustomerId widerzuspiegeln
        } else {
          currentLoggedInUser.associatedCustomerId = existingCustomerProfile.id;
          setCurrentUser({ ...currentLoggedInUser });
        }
      }

      // 2. Kundenprofile abrufen (alle, da Admin/Mitarbeiter Zugriff auf alle haben)
      const { data: dbCustomerProfiles, error: customerProfilesError } = await supabase
        .from('customer_profiles')
        .select('*');

      if (customerProfilesError) throw customerProfilesError;

      // 3. Alle Transaktionen abrufen
      const { data: dbTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*');

      if (transactionsError) throw transactionsError;

      // 4. Alle Trainingsfortschritte abrufen
      const { data: dbTrainingProgress, error: trainingProgressError } = await supabase
        .from('training_progress')
        .select('*');

      if (trainingProgressError) throw trainingProgressError;

      // Transformation der DB-Daten in die App-internen Customer, Transaction, TrainingSection Typen
      const transformedCustomers: Customer[] = dbCustomerProfiles.map((dbCustomer: DbCustomerProfile) => {
        const customerTransactions = dbTransactions.filter(t => t.customer_profile_id === dbCustomer.id);
        const balance = customerTransactions.reduce((sum, t) => t.type === 'recharge' ? sum + t.amount : sum - t.amount, 0);
        const totalTransactions = customerTransactions.length;

        const customerTrainingProgress = dbTrainingProgress.filter(tp => tp.customer_profile_id === dbCustomer.id);

        const trainingProgressForUI = TRAINING_LEVEL_DEFINITIONS.map(levelDef => {
          const progressEntry = customerTrainingProgress.find(p => p.level_name === levelDef.name);
          return {
            id: levelDef.id,
            dbId: progressEntry?.id || '',
            name: levelDef.name,
            requiredHours: levelDef.requiredHours,
            completedHours: progressEntry?.completed_trails || 0,
            status: progressEntry?.status || (levelDef.id === 1 ? 'Aktuell' : 'Gesperrt'),
          };
        }).sort((a, b) => a.id - b.id);

        const currentLevel = trainingProgressForUI.find(p => p.status === 'Aktuell')?.name || TrainingLevelEnum.EINSTEIGER;

        // Finde den zugehörigen Auth-Benutzer, um die E-Mail zu erhalten
        const customerAuthUser = transformedUsers.find(u => u.id === dbCustomer.auth_user_id);
        const derived = deriveUserDetailsFromEmail(customerAuthUser?.email || '', UserRoleEnum.KUNDE);

        return {
          id: dbCustomer.id,
          authUserId: dbCustomer.auth_user_id,
          avatarInitials: derived.avatarInitials,
          avatarColor: derived.avatarColor,
          firstName: dbCustomer.first_name || '',
          lastName: dbCustomer.last_name || '',
          email: customerAuthUser?.email || 'N/A', // E-Mail vom Auth-Benutzer abrufen
          phone: dbCustomer.phone || '',
          dogName: dbCustomer.dog_name || '',
          chipNumber: dbCustomer.chip_number || '',
          qrCodeData: dbCustomer.qr_code_data || '',
          balance,
          totalTransactions,
          level: currentLevel,
          createdAt: parseDateString(dbCustomer.created_at || new Date().toISOString())?.toLocaleDateString('de-DE') || '',
          documents: [], // Platzhalter
          trainingProgress: trainingProgressForUI,
        };
      });
      setCustomers(transformedCustomers);

      const transformedTransactions: Transaction[] = dbTransactions.map((dbTrx: DbTransaction) => {
        const employeeUser = transformedUsers.find(u => u.id === dbTrx.created_by_user_id);
        const employeeName = employeeUser ? `${employeeUser.firstName} ${employeeUser.lastName}` : 'System';
        return {
          id: dbTrx.id,
          customerId: dbTrx.customer_profile_id,
          employeeId: dbTrx.created_by_user_id,
          type: dbTrx.type,
          description: dbTrx.description || (dbTrx.type === 'recharge' ? 'Aufladung' : 'Trails'),
          amount: dbTrx.amount,
          date: parseDateString(dbTrx.created_at)?.toLocaleDateString('de-DE') || dbTrx.created_at,
          employee: employeeName,
        };
      });
      setTransactions(transformedTransactions);

    } catch (error: any) {
      console.error('Fehler beim Laden der Initialdaten:', error.message);
      alert(`Fehler beim Laden der Daten: ${error.message}`);
    } finally {
      setIsLoadingInitialData(false);
    }
  };


  useEffect(() => {
    // Initialer Abruf
    fetchAllData();

    // Listener für Auth-Änderungen einrichten
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Alle Daten bei Auth-Statusänderung (Login/Logout) neu abrufen
      fetchAllData();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // Leeres Abhängigkeits-Array bedeutet, dass dies einmal beim Mounten ausgeführt wird


  // Effekt für initiale Weiterleitung basierend auf Login-Status und Benutzerrolle
  useEffect(() => {
    if (isLoadingInitialData) return; // Warten, bis Initialdaten geladen sind

    if (!session) {
      if (window.location.hash !== '#/login') {
        navigate('/login', { replace: true });
      }
    } else if (currentUser) { // Wenn eingeloggt und currentUser verfügbar ist
      if (currentUser.role === UserRoleEnum.KUNDE && currentUser.associatedCustomerId) {
        const expectedPath = `/customers/${currentUser.associatedCustomerId}`;
        if (!window.location.hash.startsWith(`#${expectedPath}`)) {
          navigate(expectedPath, { replace: true });
        }
      } else if (window.location.hash === '#/login' || window.location.hash === '#/') {
        // Nicht-Kunden-Benutzer von Login oder Root zum Dashboard weiterleiten
        navigate('/', { replace: true });
      }
    }
  }, [session, currentUser, isLoadingInitialData, navigate]);


  const handleLogin = async (email: string, passwordInput: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: passwordInput,
    });
    if (error) {
      console.error('Login-Fehler:', error.message);
      return false;
    }
    // Session-Änderung wird vom onAuthStateChange-Listener behandelt, der fetchAllData und die Weiterleitung auslöst
    return true;
  };

  const handleRegister = async (email: string, passwordInput: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: passwordInput,
    });
    if (error) {
      console.error('Registrierungsfehler:', error.message);
      return false;
    }
    // Nach der Registrierung wird der Benutzer in der Regel automatisch eingeloggt.
    // Der onAuthStateChange-Listener wird dies erkennen und Daten neu abrufen/weiterleiten.
    return true;
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Abmeldefehler:', error.message);
      alert('Fehler beim Abmelden.');
    } else {
      alert('Sie wurden abgemeldet.');
      // onAuthStateChange-Listener behandelt das Leeren des States und die Weiterleitung
    }
  };

  // Diese werden weitergegeben, lösen aber hauptsächlich eine vollständige Datenaktualisierung von App.tsx aus
  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    // Dies löst jetzt nur eine Aktualisierung aus, die eigentliche DB-Aktualisierung erfolgt in CustomerDetails
    console.log('handleUpdateCustomer hat Aktualisierung ausgelöst:', updatedCustomer.id);
    fetchAllData();
  };

  const handleAddTransaction = (newTransaction: Transaction) => {
    // Dies löst jetzt nur eine Aktualisierung aus, die eigentliche DB-Einfügung erfolgt in CustomerDetails
    console.log('handleAddTransaction hat Aktualisierung ausgelöst:', newTransaction.id);
    fetchAllData();
  };

  // Benutzerverwaltungsfunktionen (für Admin/Mitarbeiter zur Verwaltung anderer Benutzer)
  const handleAddUser = async (newUserData: { firstName: string; lastName: string; email: string; role: UserRoleEnum; password?: string }) => {
    try {
      if (newUserData.role === UserRoleEnum.KUNDE) {
        // Für die Rolle 'Kunde' wird die Registrierung über LoginPage gehandhabt.
        // Wenn ein Admin hier ein Kundenprofil hinzufügen möchte, das zu einem vorhandenen auth.user gehört,
        // müsste der auth_user_id des Kunden bekannt sein.
        // Für diesen Flow gehen wir davon aus, dass neue Kunden sich selbst registrieren.
        // Dies hier ist eher ein Platzhalter, falls ein Admin ein "blankes" Kundenprofil erstellen möchte
        // und es später mit einem Auth-Benutzer verknüpft wird.
        const { data: customerProfileData, error: customerProfileError } = await supabase
          .from('customer_profiles')
          .insert({
            first_name: newUserData.firstName,
            last_name: newUserData.lastName,
            // auth_user_id bleibt null, bis ein registrierter Kunde damit verknüpft wird,
            // oder es wird manuell von einem Admin verknüpft.
            qr_code_data: `https://example.com/customer/${newUserData.email}`, // Platzhalter QR
          })
          .select()
          .single();

        if (customerProfileError) throw customerProfileError;
        alert(`Kundenprofil für ${newUserData.firstName} ${newUserData.lastName} erstellt. Es ist noch kein Supabase Auth-Benutzer damit verknüpft.`);
      } else {
        // Für Admin/Mitarbeiter-Rollen wird die Einladung über die serverseitige API gehandhabt.
        const response = await inviteUser(newUserData.email, newUserData.role);
        alert(`Einladung an ${response.userEmail} (${newUserData.role}) gesendet. Link zum Passwort setzen: ${response.resetPasswordUrl || 'Nicht verfügbar'}`);
      }
      fetchAllData(); // Alle Daten aktualisieren
    } catch (error: any) {
      console.error('Fehler beim Hinzufügen des Benutzers/Kundenprofils:', error.message);
      alert(`Fehler beim Hinzufügen des Benutzers: ${error.message}`);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const updates: { email?: string; role?: UserRoleEnum; firstName?: string; lastName?: string; associatedCustomerId?: string } = {
        role: updatedUser.role,
      };

      // Wenn der Benutzer ein Kunde ist, aktualisiere die customer_profiles-Details
      if (updatedUser.role === UserRoleEnum.KUNDE && updatedUser.associatedCustomerId) {
        updates.firstName = updatedUser.firstName;
        updates.lastName = updatedUser.lastName;
        updates.associatedCustomerId = updatedUser.associatedCustomerId; // Für die Backend-Funktion
        // E-Mail für Kunden wird direkt über das Kundenprofil aktualisiert, nicht über auth.users
        const { error: customerProfileUpdateError } = await supabase
          .from('customer_profiles')
          .update({
            first_name: updatedUser.firstName,
            last_name: updatedUser.lastName,
            // email ist nicht im customer_profiles Schema, also wird es hier nicht aktualisiert
          })
          .eq('id', updatedUser.associatedCustomerId);

        if (customerProfileUpdateError) throw customerProfileUpdateError;
      } else if (updatedUser.email !== users.find(u => u.id === updatedUser.id)?.email) {
        // Wenn es kein Kunde ist und die E-Mail geändert wurde, aktualisiere die Auth-E-Mail über Backend
        updates.email = updatedUser.email;
      }

      await updateAppUser(updatedUser.id, updates);

      alert('Benutzer erfolgreich aktualisiert.');
      fetchAllData(); // Alle Daten aktualisieren
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren des Benutzers:', error.message);
      alert(`Fehler beim Aktualisieren des Benutzers: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const userToDelete = users.find(u => u.id === userId);
      if (!userToDelete) throw new Error('Benutzer nicht gefunden.');

      if (userToDelete.id === currentUser?.id) {
        alert('Sie können sich nicht selbst löschen. Bitte melden Sie sich ab und lassen Sie den Account ggf. von einem anderen Administrator löschen.');
        return;
      }

      await deleteAppUser(userId); // Backend-API zum Löschen aufrufen
      alert('Benutzer erfolgreich gelöscht (inkl. zugehöriger Profile und Auth.user).');
      fetchAllData(); // Alle Daten aktualisieren

    } catch (error: any) {
      console.error('Fehler beim Löschen des Benutzers:', error.message);
      alert(`Fehler beim Löschen des Benutzers: ${error.message}`);
    }
  };


  if (isLoadingInitialData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl text-gray-700">Lade Anwendungsdaten...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {session && currentUser ? (
        <>
          <Sidebar appName="Mantrailing Card" currentUser={currentUser} onLogout={handleLogout} />
          <main className="flex-1 md:ml-64 p-0">
            <Routes>
              {currentUser.role === UserRoleEnum.ADMIN ? (
                // Admin hat vollen Zugriff
                <>
                  <Route path="/" element={<Dashboard customers={customers} transactions={transactions} currentUser={currentUser} />} />
                  <Route path="/customers" element={<CustomerManagement customers={customers} transactions={transactions} currentUser={currentUser} />} />
                  <Route
                    path="/customers/:id"
                    element={<CustomerDetails customers={customers} allTransactions={transactions} onUpdateCustomer={handleUpdateCustomer} onAddTransaction={handleAddTransaction} currentUser={currentUser} onRefreshData={fetchAllData} />}
                  />
                  <Route path="/reports" element={<Reports customers={customers} transactions={transactions} users={users} currentUser={currentUser} />} />
                  <Route path="/users" element={<UserManagement users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} currentUser={currentUser} />} />
                  <Route path="*" element={<Dashboard customers={customers} transactions={transactions} currentUser={currentUser} />} />
                </>
              ) : currentUser.role === UserRoleEnum.MITARBEITER ? (
                // Mitarbeiter hat eingeschränkten Zugriff
                <>
                  <Route path="/" element={<Dashboard customers={customers} transactions={transactions} currentUser={currentUser} />} />
                  <Route path="/customers" element={<CustomerManagement customers={customers} transactions={transactions} currentUser={currentUser} />} />
                  <Route
                    path="/customers/:id"
                    element={<CustomerDetails customers={customers} allTransactions={transactions} onUpdateCustomer={handleUpdateCustomer} onAddTransaction={handleAddTransaction} currentUser={currentUser} onRefreshData={fetchAllData} />}
                  />
                  {/* Mitarbeiter dürfen nicht auf /reports oder /users zugreifen */}
                  <Route path="/reports" element={<Navigate replace to="/" />} />
                  <Route path="/users" element={<Navigate replace to="/" />} />
                  <Route path="*" element={<Dashboard customers={customers} transactions={transactions} currentUser={currentUser} />} />
                </>
              ) : currentUser.role === UserRoleEnum.KUNDE && currentUser.associatedCustomerId ? (
                // Kunde hat Zugriff nur auf die eigene Kundenkarte
                <>
                  <Route
                    path="/customers/:id"
                    element={<CustomerDetails customers={customers} allTransactions={transactions} onUpdateCustomer={handleUpdateCustomer} onAddTransaction={handleAddTransaction} currentUser={currentUser} onRefreshData={fetchAllData} />}
                  />
                  <Route path="/" element={<Navigate replace to={`/customers/${currentUser.associatedCustomerId}`} />} />
                  <Route path="*" element={<Navigate replace to={`/customers/${currentUser.associatedCustomerId}`} />} />
                </>
              ) : (
                // Fallback für jeden anderen unerwarteten eingeloggten Zustand (sollte idealerweise nicht passieren)
                <Route path="*" element={<Dashboard customers={customers} transactions={transactions} currentUser={currentUser} />} />
              )}
            </Routes>
          </main>
        </>
      ) : (
        // Nicht eingeloggt
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} onRegister={handleRegister} />} />
          <Route path="*" element={<LoginPage onLogin={handleLogin} onRegister={handleRegister} />} />
        </Routes>
      )}
    </div>
  );
};

export default App;