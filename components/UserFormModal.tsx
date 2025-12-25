import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import { User, UserRoleEnum } from '../types';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: { firstName: string; lastName: string; email: string; role: UserRoleEnum; password?: string }) => void;
  userToEdit: User | null;
  currentUserRole: UserRoleEnum; // Aktuelle Benutzerrolle übergeben, um die Rollenauswahl einzuschränken
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSubmit, userToEdit, currentUserRole }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Status für Passwort
  const [role, setRole] = useState<UserRoleEnum>(UserRoleEnum.KUNDE); // Standard auf Kunde setzen
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState(''); // Status für Passwortfehler

  useEffect(() => {
    if (userToEdit) {
      setFirstName(userToEdit.firstName);
      setLastName(userToEdit.lastName);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
      setPassword(''); // Passwortfeld beim Bearbeiten aus Sicherheitsgründen leeren
    } else {
      // Formular für neuen Benutzer zurücksetzen
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setRole(UserRoleEnum.KUNDE); // Standard auf Kunde setzen für neue Benutzer über dieses Formular
    }
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPasswordError(''); // Passwortfehler leeren
  }, [userToEdit, isOpen]); // Zurücksetzen, wenn Modal geöffnet wird oder userToEdit sich ändert

  const validateForm = () => {
    let isValid = true;
    // Vorname und Nachname sind nur für Kunden erforderlich
    if (!firstName.trim() && role === UserRoleEnum.KUNDE) {
      setFirstNameError('Vorname ist erforderlich.');
      isValid = false;
    } else {
      setFirstNameError('');
    }

    if (!lastName.trim() && role === UserRoleEnum.KUNDE) {
      setLastNameError('Nachname ist erforderlich.');
      isValid = false;
    } else {
      setLastNameError('');
    }

    if (!email.trim()) {
      setEmailError('E-Mail ist erforderlich.');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) { // Grundlegende E-Mail-Formatvalidierung
      setEmailError('Ungültiges E-Mail-Format.');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Passwort ist nur für neue Kunden-Registrierung oder optionales Ändern relevant.
    // Für Admin/Mitarbeiter wird ein Invite-Link verwendet.
    if ((!userToEdit && role === UserRoleEnum.KUNDE) || (userToEdit && userToEdit.role === UserRoleEnum.KUNDE && password.trim())) {
      if (password.length < 6) {
        setPasswordError('Passwort muss mindestens 6 Zeichen lang sein.');
        isValid = false;
      } else {
        setPasswordError('');
      }
    } else {
      setPasswordError(''); // Kein Passwortfehler für Admin/Mitarbeiter oder wenn kein Passwort eingegeben wird
    }

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({ firstName, lastName, email, role, password: password.trim() || undefined });
    }
  };

  const title = userToEdit ? 'Benutzer bearbeiten' : 'Neuen Benutzer einladen / Kundenprofil erstellen';

  // Rollenoptionen basierend auf der Rolle des aktuellen Benutzers filtern
  const roleOptions = [
    { value: UserRoleEnum.ADMIN, label: 'Admin' },
    { value: UserRoleEnum.MITARBEITER, label: 'Mitarbeiter' },
    { value: UserRoleEnum.KUNDE, label: 'Kunde' },
  ].filter(option => {
    // Nur Admins können Admin-Rollen zuweisen oder bearbeiten
    if (currentUserRole !== UserRoleEnum.ADMIN && option.value === UserRoleEnum.ADMIN) {
      return false;
    }
    return true;
  });

  const showNameFields = role === UserRoleEnum.KUNDE || (userToEdit?.role === UserRoleEnum.KUNDE && !userToEdit.firstName && !userToEdit.lastName);
  const showPasswordField = (!userToEdit && role === UserRoleEnum.KUNDE) || (userToEdit && userToEdit.role === UserRoleEnum.KUNDE);


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
      <form onSubmit={handleSubmit} className="p-0">
        <div className="space-y-4">
          <Input
            id="userEmail"
            label="E-Mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="max.mustermann@example.com"
            error={emailError}
            // E-Mail ist für neue Benutzer (Einladung) bearbeitbar.
            // Für die Bearbeitung vorhandener Admin/Mitarbeiter-E-Mails ist sie deaktiviert,
            // da E-Mail-Änderungen für diese Rollen einen separaten Invite-Flow erfordern würden.
            disabled={!!userToEdit && (userToEdit.role === UserRoleEnum.ADMIN || userToEdit.role === UserRoleEnum.MITARBEITER)}
          />
          {showNameFields && (
            <>
              <Input
                id="userFirstName"
                label="Vorname"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Max"
                error={firstNameError}
              />
              <Input
                id="userLastName"
                label="Nachname"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Mustermann"
                error={lastNameError}
              />
            </>
          )}

          {showPasswordField ? (
            <Input
              id="userPassword"
              label="Passwort (nur für neue Kunden-Registrierung oder optional ändern)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              error={passwordError}
            />
          ) : (
            <p className="text-sm text-gray-500">
              Für Admin/Mitarbeiter wird ein Einladungslink per E-Mail gesendet, um das Passwort zu setzen.
            </p>
          )}

          <Select
            id="userRole"
            label="Rolle"
            options={roleOptions}
            value={role}
            onChange={(e) => setRole(e.target.value as UserRoleEnum)}
            disabled={currentUserRole !== UserRoleEnum.ADMIN} // Nur Admins dürfen Rollen ändern
          />
        </div>
        <div className="p-4 border-t border-gray-200 mt-6 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} type="button">
            Abbrechen
          </Button>
          <Button variant="success" type="submit">
            Speichern
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;