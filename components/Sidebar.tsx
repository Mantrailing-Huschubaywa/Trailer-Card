import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../constants';
import { LogoutIcon } from './Icons'; // Import LogoutIcon
import Avatar from './Avatar'; // Import Avatar component
import { User, UserRoleEnum } from '../types'; // Import User type and UserRoleEnum

interface SidebarProps {
  appName: string;
  currentUser: User | null;
  onLogout: () => void;
  isOpen: boolean;    // Controlled from parent
  onClose: () => void;  // Controlled from parent
}

const Sidebar: React.FC<SidebarProps> = ({ appName, currentUser, onLogout, isOpen, onClose }) => {

  // Filter navigation items based on currentUser role
  const filteredNavigationItems = NAVIGATION_ITEMS.filter(item => {
    if (!currentUser) return false; // Should not happen if sidebar is rendered, but good for type safety

    if (currentUser.role === UserRoleEnum.ADMIN) {
      return true; // Admin sees all
    }
    if (currentUser.role === UserRoleEnum.MITARBEITER) {
      // Mitarbeiter sees Dashboard and Customers
      return item.path === '/' || item.path === '/customers';
    }
    // Kunde role should not see any navigation items in the sidebar
    return false;
  });

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-[#00A1D6] text-white flex flex-col z-40 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-6 flex flex-col items-center text-center flex-shrink-0">
          <img src="https://hs-bw.com/wp-content/uploads/2026/01/Mantrailing.png" alt="App Logo" className="h-16 w-16 mb-2 rounded-[10px]" />
          <span className="text-2xl font-bold text-white">{appName}</span>
        </div>

        <nav className="flex-grow p-4 space-y-2">
          {filteredNavigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 group
                 ${isActive ? 'bg-blue-500 text-white shadow-md' : 'text-white hover:bg-white/10'}`
              }
              onClick={onClose} // Close sidebar on navigation for mobile
            >
              <item.icon className="h-6 w-6 text-white group-hover:text-white" />
              <span className="text-lg">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Current User Info and Logout */}
        {currentUser && (
          <div className="p-4 border-t border-white/20 flex-shrink-0">
            <div className="flex items-center mb-4">
              <Avatar initials={currentUser.avatarInitials} color={currentUser.avatarColor} size="md" className="mr-3" />
              <div>
                <p className="font-semibold text-white">{currentUser.firstName}</p>
                <p className="text-sm text-gray-200">{currentUser.role}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-3 p-3 w-full rounded-lg text-white hover:bg-white/10 transition-colors duration-200"
            >
              <LogoutIcon className="h-6 w-6 text-white" />
              <span className="text-lg">Abmelden</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;