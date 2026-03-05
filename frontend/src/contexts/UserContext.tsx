import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { getUsers, authenticateUser } from '../api/api';

interface UserContextValue {
  currentUser: User | null;
  users: User[];
  loadingUsers: boolean;
  selectUser: (user: User) => void;
  clearUser: () => void;
  refreshUsers: () => Promise<void>;
  authenticateAndSelect: (id: number, pin?: string) => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

const STORAGE_KEY = 'ac_tracker_user';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const refreshUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await getUsers();
      setUsers(data);
      // Refresh current user data if logged in
      if (currentUser) {
        const updated = data.find((u) => u.id === currentUser.id);
        if (updated) {
          setCurrentUser(updated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
      }
    } catch {
      // Use cached users if available
    } finally {
      setLoadingUsers(false);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectUser = useCallback((user: User) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }, []);

  const clearUser = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const authenticateAndSelect = useCallback(async (id: number, pin?: string) => {
    const user = await authenticateUser(id, pin);
    selectUser(user);
  }, [selectUser]);

  return (
    <UserContext.Provider value={{ currentUser, users, loadingUsers, selectUser, clearUser, refreshUsers, authenticateAndSelect }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
