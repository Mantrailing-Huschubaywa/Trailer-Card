import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { Customer, NewCustomerData } from '../types';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customerData: NewCustomerData) => void;
  customerToEdit: Customer | null;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ isOpen, onClose, onSubmit, customerToEdit }) => {
  // Form state
  const [formData, setFormData] = useState<NewCustomerData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dogName: '',
    chipNumber: '',
  });
  
  // Validation state
  const [errors, setErrors] = useState<Partial<Record<keyof NewCustomerData, string>>>({});

  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        firstName: customerToEdit.firstName,
        lastName: customerToEdit.lastName,
        email: customerToEdit.email,
        phone: customerToEdit.phone,
        dogName: customerToEdit.dogName,
        chipNumber: customerToEdit.chipNumber,
      });
    } else {
      setFormData({ firstName: '', lastName: '', email: '', phone: '', dogName: '', chipNumber: '' });
    }
    setErrors({}); // Clear errors when modal opens or customer changes
  }, [customerToEdit, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof NewCustomerData, string>> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Vorname ist erforderlich.';
    if (!formData.lastName.trim()) newErrors.lastName = 'Nachname ist erforderlich.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stammdaten bearbeiten" className="max-w-lg">
      <form onSubmit={handleSubmit} className="p-0">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="firstName" label="Vorname" value={formData.firstName} onChange={handleInputChange} error={errors.firstName} />
            <Input id="lastName" label="Nachname" value={formData.lastName} onChange={handleInputChange} error={errors.lastName} />
          </div>
          <Input id="email" label="E-Mail (nicht änderbar)" value={formData.email} onChange={() => {}} disabled className="bg-gray-100" />
          <Input id="phone" label="Telefon" value={formData.phone} onChange={handleInputChange} />
          <Input id="dogName" label="Hund" value={formData.dogName} onChange={handleInputChange} />
          <Input id="chipNumber" label="Chipnummer" value={formData.chipNumber} onChange={handleInputChange} />
        </div>
        <div className="p-4 border-t border-gray-200 mt-6 flex justify-end space-x-3">
          <Button variant="outline" type="button" onClick={onClose}>Abbrechen</Button>
          <Button variant="success" type="submit">Änderungen speichern</Button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerFormModal;