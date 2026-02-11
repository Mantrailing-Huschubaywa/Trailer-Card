import React from 'react';
import Modal from './Modal';
import Table, { Column } from './Table';
import Button from './Button';

interface DashboardInfoModalProps<T extends { id: string | number }> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: T[];
  columns: Column<T>[];
  emptyStateMessage?: string;
}

const DashboardInfoModal = <T extends { id: string | number }>({
  isOpen,
  onClose,
  title,
  items,
  columns,
  emptyStateMessage = "Keine Daten verfügbar."
}: DashboardInfoModalProps<T>) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-3xl">
      <div className="p-0">
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          {items.length > 0 ? (
            <Table data={items} columns={columns} />
          ) : (
            <p className="text-gray-500 text-center py-8">{emptyStateMessage}</p>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DashboardInfoModal;