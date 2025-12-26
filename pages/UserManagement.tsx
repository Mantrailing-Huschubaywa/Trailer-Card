
import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import UserFormModal from '../components/UserFormModal';
import UserDeleteConfirmationModal from '../components/UserDeleteConfirmationModal';
import { EditIcon, TrashIcon, UserPlusIcon, ChevronDownIcon } from '../components/Icons';
import { User, UserTableData, UserRoleEnum } from '../types';
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

  // State to manage expanded/collapsed sections for each role
  const [expandedRoles, setExpandedRoles] = useState<Record<UserRoleEnum, boolean>>({
    [UserRoleEnum.ADMIN]: true, // Admins expanded by default
    [UserRoleEnum.MITARBEITER]: false,
    [UserRoleEnum.KUNDE]: false,
  });

  const toggleRoleSection = (role: UserRoleEnum) => {
    setExpandedRoles(prev => ({
      ...prev,
      [role]: !prev[role],
    }));
  };

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
        role: userData.role,
        ...(userData.password ? { password: userData.password } : {}),
      };
      onUpdateUser(updatedUser);
    } else {
      const newUserId = `user-${users.length + 1}-${Date.now()}`;
      const initials = `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase().slice(0, 2);
      const avatarColors = ['bg-red-500', 'bg-orange-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-green-500', 'bg-teal-500', 'bg-fuchsia-500', 'bg-lime-500'];
      const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

      let newUser: User = {
        id: newUserId,
        avatarInitials: initials,
        avatarColor: randomColor,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        password: userData.password,
        createdAt: REFERENCE_DATE.toLocaleDateString('de-DE'),
      };

      // If the new user is a 'Kunde', generate and associate a customer ID here
      if (userData.role === UserRoleEnum.KUNDE) {
        // We use the new user's ID to generate a customer ID, ensuring a link
        const associatedCustomerId = `cust-${newUserId}`; 
        newUser = { ...newUser, associatedCustomerId: associatedCustomerId };
      }
      
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
      case UserRoleEnum.KUNDE:
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter users by role
  const adminUsers = users.filter(user => user.role === UserRoleEnum.ADMIN);
  const mitarbeiterUsers = users.filter(user => user.role === UserRoleEnum.MITARBEITER);
  const kundeUsers = users.filter(user => user.role === UserRoleEnum.KUNDE);

  // Reusable component for displaying a list of users for a specific role
  interface UserRoleSectionProps {
    title: string;
    role: UserRoleEnum;
    users: User[];
    isExpanded: boolean;
    onToggle: (role: UserRoleEnum) => void;
    onOpenEditUserModal: (user: User) => void;
    onOpenDeleteConfirmation: (userId: string) => void;
  }

  const UserRoleSection: React.FC<UserRoleSectionProps> = ({
    title,
    role,
    users,
    isExpanded,
    onToggle,
    onOpenEditUserModal,
    onOpenDeleteConfirmation,
  }) => {
    const displayUsers = users.slice(0, 5); // Show first 5 users
    const hasMoreUsers = users.length > 5;

    return (
      <Card padding="none" className="overflow-hidden">
        <button
          className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
          onClick={() => onToggle(role)}
          aria-expanded={isExpanded}
          aria-controls={`user-list-${role}`}
        >
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            {title}
            <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColorClass(role)}`}>
              {users.length}
            </span>
          </h2>
          <ChevronDownIcon className={`h-6 w-6 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {isExpanded && (
          <div id={`user-list-${role}`} className={`p-4 border-t border-gray-200 ${hasMoreUsers ? 'max-h-96 overflow-y-auto custom-scrollbar' : ''}`}>
            {users.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">Keine Benutzer in dieser Rolle gefunden.</p>
            ) : (
              <div className="divide-y divide-gray-200">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center">
                      <Avatar initials={user.avatarInitials} color={user.avatarColor} size="md" className="mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenEditUserModal(user); }}
                        className="text-gray-500 hover:text-blue-600"
                        aria-label={`Benutzer ${user.firstName} ${user.lastName} bearbeiten`}
                      >
                        <EditIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenDeleteConfirmation(user.id); }}
                        className="text-gray-500 hover:text-red-600"
                        aria-label={`Benutzer ${user.firstName} ${user.lastName} löschen`}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };


  const userToDelete = users.find(u => u.id === userToDeleteId);

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Benutzerverwaltung</h1>
          <p className="text-gray-600">Verwalten Sie alle Systembenutzer an einem Ort</p>
        </div>
        <Button variant="success" icon={UserPlusIcon} onClick={handleOpenAddUserModal}>
          Neuer Benutzer
        </Button>
      </div>

      <div className="mt-8 space-y-6">
        <UserRoleSection
          title="Administratoren"
          role={UserRoleEnum.ADMIN}
          users={adminUsers}
          isExpanded={expandedRoles[UserRoleEnum.ADMIN]}
          onToggle={toggleRoleSection}
          onOpenEditUserModal={handleOpenEditUserModal}
          onOpenDeleteConfirmation={handleOpenDeleteConfirmation}
        />
        <UserRoleSection
          title="Mitarbeiter"
          role={UserRoleEnum.MITARBEITER}
          users={mitarbeiterUsers}
          isExpanded={expandedRoles[UserRoleEnum.MITARBEITER]}
          onToggle={toggleRoleSection}
          onOpenEditUserModal={handleOpenEditUserModal}
          onOpenDeleteConfirmation={handleOpenDeleteConfirmation}
        />
        <UserRoleSection
          title="Kunden"
          role={UserRoleEnum.KUNDE}
          users={kundeUsers}
          isExpanded={expandedRoles[UserRoleEnum.KUNDE]}
          onToggle={toggleRoleSection}
          onOpenEditUserModal={handleOpenEditUserModal}
          onOpenDeleteConfirmation={handleOpenDeleteConfirmation}
        />
      </div>


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
