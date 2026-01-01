import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import UserFormModal from '../components/UserFormModal';
import UserDeleteConfirmationModal from '../components/UserDeleteConfirmationModal';
import { EditIcon, TrashIcon, UserPlusIcon } from '../components/Icons';
import { User, UserRoleEnum } from '../types';
import { REFERENCE_DATE } from '../constants';

interface UserManagementProps {
  users: User[];
  onAddUser: (newUser: User) => void;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteUser: (userId: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [showUserFormModal, setShowUserFormModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);

  const handleOpenAddUserModal = () => {
    setUserToEdit(null);
    setShowUserFormModal(true);
  };

  const handleOpenEditUserModal = (user: User) => {
    setUserToEdit(user);
    setShowUserFormModal(true);
  };

  const handleCloseUserFormModal = () => {
    setShowUserFormModal(false);
    setUserToEdit(null);
  };

  const handleSubmitUserForm = (userData: { firstName: string; lastName: string; email: string; role: UserRoleEnum; password?: string }) => {
    if (userToEdit) {
      const updatedUser: User = {
        ...userToEdit,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role, // Role will be 'Mitarbeiter' from the form
        ...(userData.password ? { password: userData.password } : {}),
      };
      onUpdateUser(updatedUser);
    } else {
      const newUserId = `user-${users.length + 1}-${Date.now()}`;
      const initials = `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase().slice(0, 2);
      const avatarColors = ['bg-red-500', 'bg-orange-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-green-500', 'bg-teal-500', 'bg-fuchsia-500', 'bg-lime-500'];
      const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

      const newUser: User = {
        id: newUserId,
        avatarInitials: initials,
        avatarColor: randomColor,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role, // This will be hardcoded to Mitarbeiter by the modal
        password: userData.password,
        createdAt: REFERENCE_DATE.toLocaleDateString('de-DE'),
      };
      
      onAddUser(newUser);
    }
    handleCloseUserFormModal();
  };

  const handleOpenDeleteConfirmation = (userId: string) => {
    setUserToDeleteId(userId);
    setShowDeleteConfirmationModal(true);
  };

  const handleConfirmDelete = () => {
    if (userToDeleteId) {
      onDeleteUser(userToDeleteId);
    }
    setShowDeleteConfirmationModal(false);
    setUserToDeleteId(null);
  };

  const handleCloseDeleteConfirmation = () => {
    setShowDeleteConfirmationModal(false);
    setUserToDeleteId(null);
  };

  const getRoleColorClass = (role: UserRoleEnum) => {
    switch (role) {
      case UserRoleEnum.ADMIN:
        return 'bg-red-100 text-red-800';
      case UserRoleEnum.MITARBEITER:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter users to show only Admins and Mitarbeiter
  const staffUsers = users.filter(user => user.role === UserRoleEnum.ADMIN || user.role === UserRoleEnum.MITARBEITER);

  const userToDelete = users.find(u => u.id === userToDeleteId);

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mitarbeiterverwaltung</h1>
          <p className="text-gray-600">Verwalten Sie alle Mitarbeiter und Administratoren</p>
        </div>
        <Button variant="success" icon={UserPlusIcon} onClick={handleOpenAddUserModal}>
          Neuer Mitarbeiter
        </Button>
      </div>

      <Card className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Mitarbeiter & Administratoren ({staffUsers.length})
        </h2>
        <div className="divide-y divide-gray-200">
          {staffUsers.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">Keine Mitarbeiter gefunden.</p>
          ) : (
            staffUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between py-3">
                <div className="flex items-center">
                  <Avatar initials={user.avatarInitials} color={user.avatarColor} size="md" className="mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColorClass(user.role)}`}>
                        {user.role}
                    </span>
                    <button
                        onClick={() => handleOpenEditUserModal(user)}
                        className="text-gray-500 hover:text-blue-600"
                        aria-label={`Benutzer ${user.firstName} ${user.lastName} bearbeiten`}
                    >
                        <EditIcon className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => handleOpenDeleteConfirmation(user.id)}
                        className="text-gray-500 hover:text-red-600"
                        aria-label={`Benutzer ${user.firstName} ${user.lastName} löschen`}
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <UserFormModal
        isOpen={showUserFormModal}
        onClose={handleCloseUserFormModal}
        onSubmit={handleSubmitUserForm}
        userToEdit={userToEdit}
      />

      <UserDeleteConfirmationModal
        isOpen={showDeleteConfirmationModal}
        onClose={handleCloseDeleteConfirmation}
        onConfirm={handleConfirmDelete}
        userNameToDelete={userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName}`.trim() : ''}
      />
    </div>
  );
};

export default UserManagement;
