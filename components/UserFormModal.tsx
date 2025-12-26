
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
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSubmit, userToEdit }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // New state for password
  const [role, setRole] = useState<UserRoleEnum>(UserRoleEnum.MITARBEITER);
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState(''); // New state for password error

  useEffect(() => {
    if (userToEdit) {
      setFirstName(userToEdit.firstName);
      setLastName(userToEdit.lastName);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
      setPassword(''); // Clear password field when editing for security, user can set new one
    } else {
      // Reset form for new user
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword(''); // Clear password field for new user
      setRole(UserRoleEnum.MITARBEITER);
    }
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPasswordError(''); // Clear password error
  }, [userToEdit, isOpen]); // Reset when modal opens or userToEdit changes

  const validateForm = () => {
    let isValid = true;
    if (!firstName.trim()) {
      setFirstNameError('Vorname ist erforderlich.');
      isValid = false;
    } else {
      setFirstNameError('');
    }

    if (!lastName.trim()) {
      setLastNameError('Nachname ist erforderlich.');
      isValid = false;
    } else {
      setLastNameError('');
    }

    if (!email.trim()) {
      setEmailError('E-Mail ist erforderlich.');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) { // Basic email format validation
      setEmailError('Ungültiges E-Mail-Format.');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!userToEdit && !password.trim()) { // Password is required only for new users
      setPasswordError('Passwort ist erforderlich.');
      isValid = false;
    } else if (userToEdit && password.trim() && password.length < 6) { // If editing and password is provided, validate length
      setPasswordError('Passwort muss mindestens 6 Zeichen lang sein.');
      isValid = false;
    }
    else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({ firstName, lastName, email, role, password: password.trim() || undefined }); // Pass password if not empty
    }
  };

  const title = userToEdit ? 'Benutzer bearbeiten' : 'Neuen Benutzer erstellen';

  const roleOptions = [
    { value: UserRoleEnum.ADMIN, label: 'Admin' },
    { value: UserRoleEnum.MITARBEITER, label: 'Mitarbeiter' },
    { value: UserRoleEnum.KUNDE, label: 'Kunde' }, // Added Kunde role
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
      <form onSubmit={handleSubmit} className="p-0">
        <div className="space-y-4">
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
          <Input
            id="userEmail"
            label="E-Mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="max.mustermann@example.com"
            error={emailError}
          />
          <Input // New password input field
            id="userPassword"
            label={userToEdit ? "Neues Passwort (optional)" : "Passwort"}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={userToEdit ? "Passwort ändern" : "Passwort festlegen"}
            error={passwordError}
          />
          <Select
            id="userRole"
            label="Rolle"
            options={roleOptions}
            value={role}
            onChange={(e) => setRole(e.target.value as UserRoleEnum)}
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
