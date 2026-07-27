import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
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
  const [password, setPassword] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setFirstName(userToEdit.firstName);
      setLastName(userToEdit.lastName);
      setEmail(userToEdit.email);
      setPassword(''); // Clear password field when editing for security
    } else {
      // Reset form for new user
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
    }
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPasswordError('');
  }, [userToEdit, isOpen]);

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
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Ungültiges E-Mail-Format.');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!userToEdit && !password.trim()) {
      setPasswordError('Passwort ist erforderlich.');
      isValid = false;
    } else if (password.trim() && password.length < 6) {
      setPasswordError('Passwort muss mindestens 6 Zeichen lang sein.');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Role is hardcoded to MITARBEITER as this form is now only for employees.
      // If editing, the role is preserved from the userToEdit object by the parent.
      const submittedRole = userToEdit ? userToEdit.role : UserRoleEnum.MITARBEITER;
      onSubmit({ 
        firstName, 
        lastName, 
        email, 
        role: submittedRole, 
        password: password.trim() || undefined 
      });
    }
  };

  const title = userToEdit ? 'Mitarbeiter bearbeiten' : 'Neuen Mitarbeiter erstellen';

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
          <Input
            id="userPassword"
            label={userToEdit ? "Neues Passwort (optional)" : "Passwort"}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={userToEdit ? "Passwort ändern" : "Passwort festlegen"}
            error={passwordError}
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
