import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { ClientProfile, ClientStatus } from '@/types';

function generateUsername(firstName: string): string {
  return firstName.trim().toLowerCase();
}

export const [ClientsProvider, useClients] = createContextHook(() => {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const initialized = useRef(false);

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem('milana_clients');
      return stored ? (JSON.parse(stored) as ClientProfile[]) : [];
    },
  });

  useEffect(() => {
    if (clientsQuery.data && !initialized.current) {
      setClients(clientsQuery.data);
      initialized.current = true;
    }
  }, [clientsQuery.data]);

  const syncMutation = useMutation({
    mutationFn: async (updated: ClientProfile[]) => {
      await AsyncStorage.setItem('milana_clients', JSON.stringify(updated));
      return updated;
    },
  });

  const registerClient = useCallback(
    (data: {
      firstName: string;
      lastName: string;
      location: string;
      phone: string;
      password: string;
      messengerLink?: string;
    }): ClientProfile => {
      const username = generateUsername(data.firstName);
      const newClient: ClientProfile = {
        id: `client_${Date.now()}`,
        firstName: data.firstName,
        lastName: data.lastName,
        location: data.location,
        phone: data.phone,
        messengerLink: data.messengerLink,
        username,
        password: data.password,
        clientStatus: 'standard',
        createdAt: new Date().toISOString(),
        createdBy: 'self',
      };
      const updated = [newClient, ...clients];
      setClients(updated);
      syncMutation.mutate(updated);
      console.log('[Clients] Registered client:', newClient.id, newClient.username);
      return newClient;
    },
    [clients, syncMutation],
  );

  const addClientByAccountant = useCallback(
    (data: {
      firstName: string;
      lastName: string;
      location: string;
      phone: string;
      password: string;
      messengerLink?: string;
      clientStatus?: ClientStatus;
    }): ClientProfile => {
      const username = generateUsername(data.firstName);
      const newClient: ClientProfile = {
        id: `client_${Date.now()}`,
        firstName: data.firstName,
        lastName: data.lastName,
        location: data.location,
        phone: data.phone,
        messengerLink: data.messengerLink,
        username,
        password: data.password,
        clientStatus: data.clientStatus ?? 'standard',
        createdAt: new Date().toISOString(),
        createdBy: 'accountant',
      };
      const updated = [newClient, ...clients];
      setClients(updated);
      syncMutation.mutate(updated);
      console.log('[Clients] Accountant added client:', newClient.id);
      return newClient;
    },
    [clients, syncMutation],
  );

  const getClientById = useCallback(
    (id: string): ClientProfile | undefined => {
      return clients.find((c) => c.id === id);
    },
    [clients],
  );

  const findClientByCredentials = useCallback(
    (username: string, password: string): ClientProfile | undefined => {
      const normalizedInput = username.trim().toLowerCase();
      return clients.find(
        (c) => c.username.toLowerCase() === normalizedInput && c.password === password,
      );
    },
    [clients],
  );

  const updateClientStatus = useCallback(
    (id: string, status: ClientStatus) => {
      const updated = clients.map((c) =>
        c.id === id ? { ...c, clientStatus: status } : c,
      );
      setClients(updated);
      syncMutation.mutate(updated);
      console.log('[Clients] Updated client status:', id, status);
    },
    [clients, syncMutation],
  );

  const updateClientProfile = useCallback(
    (id: string, data: { firstName?: string; lastName?: string; location?: string; messengerLink?: string }) => {
      const updated = clients.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
          ...(data.location !== undefined && { location: data.location }),
          ...(data.messengerLink !== undefined && { messengerLink: data.messengerLink }),
        };
      });
      setClients(updated);
      syncMutation.mutate(updated);
      console.log('[Clients] Updated client profile:', id);
    },
    [clients, syncMutation],
  );

  const changeClientPassword = useCallback(
    (id: string, oldPassword: string, newPassword: string): boolean => {
      const client = clients.find((c) => c.id === id);
      if (!client || client.password !== oldPassword) {
        console.log('[Clients] Password change failed - wrong old password for:', id);
        return false;
      }
      const updated = clients.map((c) =>
        c.id === id ? { ...c, password: newPassword } : c,
      );
      setClients(updated);
      syncMutation.mutate(updated);
      console.log('[Clients] Password changed for client:', id);
      return true;
    },
    [clients, syncMutation],
  );

  const resetClientPassword = useCallback(
    (id: string, newPassword: string) => {
      const updated = clients.map((c) =>
        c.id === id ? { ...c, password: newPassword } : c,
      );
      setClients(updated);
      syncMutation.mutate(updated);
      console.log('[Clients] Password reset by accountant for client:', id);
    },
    [clients, syncMutation],
  );

  const deleteClient = useCallback(
    (id: string) => {
      const updated = clients.filter((c) => c.id !== id);
      setClients(updated);
      syncMutation.mutate(updated);
      console.log('[Clients] Deleted client:', id);
    },
    [clients, syncMutation],
  );

  const clientCount = useMemo(() => clients.length, [clients]);

  return {
    clients,
    registerClient,
    addClientByAccountant,
    getClientById,
    findClientByCredentials,
    updateClientProfile,
    changeClientPassword,
    resetClientPassword,
    deleteClient,
    updateClientStatus,
    clientCount,
    isLoading: clientsQuery.isLoading,
  };
});
