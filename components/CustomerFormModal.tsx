import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { Customer, NewCustomerData, Dog } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

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
    dogs: [],
  });
  
  // Validation state
  const [errors, setErrors] = useState<Partial<Record<keyof NewCustomerData, string>>>({});

  useEffect(() => {
    if (customerToEdit) {
      let initialDogs = customerToEdit.dogs || [];
      if (initialDogs.length === 0) {
        initialDogs = [{ 
          id: '1', 
          name: '', 
          chipNumber: '',
          level: 'Einsteiger' as any,
          trainingProgress: [
            { id: 1, name: 'Einsteiger' as any, requiredHours: 12, completedHours: 0, status: 'Aktuell' },
            { id: 2, name: 'Grundlagen' as any, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
            { id: 3, name: 'Fortgeschrittene' as any, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
            { id: 4, name: 'Masterclass' as any, requiredHours: 13, completedHours: 0, status: 'Gesperrt' },
            { id: 5, name: 'Expert' as any, requiredHours: 100, completedHours: 0, status: 'Gesperrt' },
          ]
        }];
      }
      setFormData({
        firstName: customerToEdit.firstName,
        lastName: customerToEdit.lastName,
        email: customerToEdit.email,
        phone: customerToEdit.phone,
        dogs: initialDogs,
      });
    } else {
      setFormData({ firstName: '', lastName: '', email: '', phone: '', dogs: [{ 
        id: '1', 
        name: '', 
        chipNumber: '',
        level: 'Einsteiger' as any,
        trainingProgress: [
          { id: 1, name: 'Einsteiger' as any, requiredHours: 12, completedHours: 0, status: 'Aktuell' },
          { id: 2, name: 'Grundlagen' as any, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
          { id: 3, name: 'Fortgeschrittene' as any, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
          { id: 4, name: 'Masterclass' as any, requiredHours: 13, completedHours: 0, status: 'Gesperrt' },
          { id: 5, name: 'Expert' as any, requiredHours: 100, completedHours: 0, status: 'Gesperrt' },
        ]
      }] });
    }
    setErrors({}); // Clear errors when modal opens or customer changes
  }, [customerToEdit, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleDogChange = (id: string, field: 'name' | 'chipNumber', value: string) => {
    setFormData(prev => ({
      ...prev,
      dogs: (prev.dogs || []).map(dog => dog.id === id ? { ...dog, [field]: value } : dog)
    }));
  };

  const addDog = () => {
    setFormData(prev => ({
      ...prev,
      dogs: [...(prev.dogs || []), { 
        id: Math.random().toString(36).substr(2, 9), 
        name: '', 
        chipNumber: '',
        level: 'Einsteiger' as any,
        trainingProgress: [
          { id: 1, name: 'Einsteiger' as any, requiredHours: 12, completedHours: 0, status: 'Aktuell' },
          { id: 2, name: 'Grundlagen' as any, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
          { id: 3, name: 'Fortgeschrittene' as any, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
          { id: 4, name: 'Masterclass' as any, requiredHours: 13, completedHours: 0, status: 'Gesperrt' },
          { id: 5, name: 'Expert' as any, requiredHours: 100, completedHours: 0, status: 'Gesperrt' },
        ]
      }]
    }));
  };

  const removeDog = (id: string) => {
    setFormData(prev => {
      const newDogs = (prev.dogs || []).filter(dog => dog.id !== id);
      if (newDogs.length === 0) newDogs.push({ 
        id: '1', 
        name: '', 
        chipNumber: '',
        level: 'Einsteiger' as any,
        trainingProgress: [
          { id: 1, name: 'Einsteiger' as any, requiredHours: 12, completedHours: 0, status: 'Aktuell' },
          { id: 2, name: 'Grundlagen' as any, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
          { id: 3, name: 'Fortgeschrittene' as any, requiredHours: 12, completedHours: 0, status: 'Gesperrt' },
          { id: 4, name: 'Masterclass' as any, requiredHours: 13, completedHours: 0, status: 'Gesperrt' },
          { id: 5, name: 'Expert' as any, requiredHours: 100, completedHours: 0, status: 'Gesperrt' },
        ]
      }); // Always keep at least one
      return { ...prev, dogs: newDogs };
    });
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
      const finalData = { ...formData };
      onSubmit(finalData);
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
          
          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-900">Hunde</h3>
            </div>
            <div className="space-y-3">
              {(formData.dogs || []).map((dog, index) => (
                <div key={dog.id} className="p-3 border border-gray-200 rounded-md bg-gray-50 relative">
                  <div className="absolute top-2 right-2">
                     <button type="button" onClick={() => removeDog(dog.id)} className="text-red-500 hover:text-red-700 mt-1" title="Hund entfernen">
                        <TrashIcon className="h-4 w-4" />
                     </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <Input 
                      id={`dog-name-${dog.id}`} 
                      label="Name des Hundes" 
                      value={dog.name} 
                      onChange={(e) => handleDogChange(dog.id, 'name', e.target.value)} 
                    />
                    <Input 
                      id={`dog-chip-${dog.id}`} 
                      label="Chipnummer" 
                      value={dog.chipNumber} 
                      onChange={(e) => handleDogChange(dog.id, 'chipNumber', e.target.value)} 
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={addDog} className="mt-2 text-blue-600 hover:text-blue-800" icon={PlusIcon}>
              Weiteren Hund hinzufügen
            </Button>
          </div>
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