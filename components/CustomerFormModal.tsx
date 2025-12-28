import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { NewCustomerData, Customer } from '../types';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customerData: NewCustomerData) => void;
  customerToEdit?: Customer | null;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ isOpen, onClose, onSubmit, customerToEdit }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dogName: '',
    chipNumber: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof NewCustomerData, string>>>({});

  const isEditMode = !!customerToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setFormData({
          firstName: customerToEdit.firstName,
          lastName: customerToEdit.lastName,
          email: customerToEdit.email,
          phone: customerToEdit.phone,
          dogName: customerToEdit.dogName,
          chipNumber: customerToEdit.chipNumber,
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          dogName: '',
          chipNumber: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, customerToEdit, isEditMode]);

  const validate = () => {
    const newErrors: Partial<Record<keyof NewCustomerData, string>> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Vorname ist erforderlich.';
    if (!formData.lastName.trim()) newErrors.lastName = 'Nachname ist erforderlich.';
    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ungültiges E-Mail-Format.';
    }
    if (!formData.dogName.trim()) newErrors.dogName = 'Name des Hundes ist erforderlich.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const modalTitle = isEditMode ? 'Kundendaten bearbeiten' : 'Neuen Kunden erstellen';
  const submitButtonText = isEditMode ? 'Änderungen speichern' : 'Kunden anlegen';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              id="firstName"
              label="Vorname"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
              required
            />
            <Input
              id="lastName"
              label="Nachname"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
              required
            />
        </div>
        <Input
          id="email"
          label="E-Mail"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
        <Input
          id="phone"
          label="Telefon (Optional)"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Input
            id="dogName"
            label="Name des Hundes"
            value={formData.dogName}
            onChange={handleChange}
            error={errors.dogName}
            required
          />
          <Input
            id="chipNumber"
            label="Chipnummer (Optional)"
            value={formData.chipNumber}
            onChange={handleChange}
          />
        </div>
        <div className="pt-6 flex justify-end space-x-3 border-t border-gray-200 mt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" variant="success">
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerFormModal;