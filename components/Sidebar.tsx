import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../constants';
import { LogoutIcon } from './Icons'; // Import LogoutIcon
import Avatar from './Avatar'; // Import Avatar component
import { User, UserRoleEnum } from '../types'; // Import User type and UserRoleEnum

interface SidebarProps {
  appName: string;
  currentUser: User | null; // Added currentUser prop
  onLogout: () => void; // Added onLogout prop
}

const Sidebar: React.FC<SidebarProps> = ({ appName, currentUser, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false); // Für mobilen Sidebar-Toggle

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Navigationspunkte basierend auf der currentUser-Rolle filtern
  const filteredNavigationItems = NAVIGATION_ITEMS.filter(item => {
    if (!currentUser) return false; // Sollte nicht passieren, wenn Sidebar gerendert wird, aber gut für die Typsicherheit

    if (currentUser.role === UserRoleEnum.ADMIN) {
      return true; // Admin sieht alles
    }
    if (currentUser.role === UserRoleEnum.MITARBEITER) {
      // Mitarbeiter sieht Übersicht und Kunden, aber NICHT Berichte und Benutzer
      // item.path === '/reports' wird jetzt in App.tsx über <Navigate> behandelt,
      // aber der Menüpunkt sollte hier auch ausgeblendet werden.
      return item.path === '/' || item.path === '/customers';
    }
    // Kundenrolle sollte keine Navigationspunkte in der Sidebar sehen
    return false;
  });

  return (
    <>
      {/* Mobiler Menü-Button */}
      <button
        onClick={toggleSidebar}
        className="fixed bottom-4 left-4 z-40 p-3 bg-blue-600 text-white rounded-full shadow-lg md:hidden"
        aria-label="Navigation umschalten"
      >
        <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Backdrop für Mobilgeräte */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-[#00A1D6] text-white flex flex-col z-40 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-6 text-2xl font-bold flex-shrink-0">
          {appName}
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
              onClick={() => setIsOpen(false)} // Sidebar bei Navigation für Mobilgeräte schließen
            >
              <item.icon className="h-6 w-6 text-white group-hover:text-white" />
              <span className="text-lg">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Aktuelle Benutzerinformationen und Abmeldung */}
        {currentUser && (
          <div className="p-4 border-t border-white/20 flex-shrink-0">
            <div className="flex items-center mb-4">
              <Avatar initials={currentUser.avatarInitials} color={currentUser.avatarColor} size="md" className="mr-3" />
              <div>
                <p className="font-semibold text-white">{currentUser.firstName} {currentUser.lastName}</p>
                <p className="text-sm text-gray-200">{currentUser.role === UserRoleEnum.ADMIN ? 'Admin' : currentUser.role === UserRoleEnum.MITARBEITER ? 'Mitarbeiter' : 'Kunde'}</p>
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