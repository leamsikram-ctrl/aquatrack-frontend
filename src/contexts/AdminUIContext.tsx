import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AdminUIContextType {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
}

const STORAGE_KEY = 'aquatrack_admin_sidebar_collapsed';

const getInitialCollapsedState = (): boolean => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'true';
    } catch {
      return false;
    }
  }
  return false;
};

const AdminUIContext = createContext<AdminUIContextType | undefined>(undefined);

export const AdminUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(getInitialCollapsedState);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Sync to localStorage whenever isSidebarCollapsed changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isSidebarCollapsed));
    } catch {
      // Storage access might fail in restricted security environments
    }
  }, [isSidebarCollapsed]);

  // Sync across tabs/windows if localStorage changes externally
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        setIsSidebarCollapsed(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileMenuOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  return (
    <AdminUIContext.Provider
      value={{
        isSidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed: setIsSidebarCollapsed,
        isMobileMenuOpen,
        setMobileMenuOpen: setIsMobileMenuOpen,
        toggleMobileMenu,
      }}
    >
      {children}
    </AdminUIContext.Provider>
  );
};

export const useAdminUI = (): AdminUIContextType => {
  const context = useContext(AdminUIContext);
  if (!context) {
    // Graceful fallback for components rendered outside provider (e.g. isolated unit tests)
    return {
      isSidebarCollapsed: getInitialCollapsedState(),
      toggleSidebar: () => {},
      setSidebarCollapsed: () => {},
      isMobileMenuOpen: false,
      setMobileMenuOpen: () => {},
      toggleMobileMenu: () => {},
    };
  }
  return context;
};

