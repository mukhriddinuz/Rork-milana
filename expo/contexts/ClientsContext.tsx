import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { ClientProfile, ClientStatus } from '@/types';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

/**
 * Client directory, backed by the Supabase `profiles` table.
 *
 * Self-registered customers get a profile automatically (DB trigger on
 * auth signup). Staff can also create directory entries and adjust VIP
 * status. Credentials are owned by Supabase Auth — never stored here.
 */

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  location: string | null;
  phone: string | null;
  messenger_link: string | null;
  username: string | null;
  client_status: ClientStatus;
  created_by: 'self' | 'accountant';
  created_at: string;
};

const CLIENTS_KEY = ['clients'] as const;

function generateUsername(firstName: string): string {
  return firstName.trim().toLowerCase();
}

function mapRow(row: ProfileRow): ClientProfile {
  return {
    id: row.id,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    location: row.location ?? '',
    phone: row.phone ?? '',
    messengerLink: row.messenger_link ?? undefined,
    username: row.username ?? '',
    clientStatus: row.client_status ?? 'standard',
    createdAt: row.created_at,
    createdBy: row.created_by ?? 'self',
  };
}

export const [ClientsProvider, useClients] = createContextHook(() => {
  const queryClient = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: CLIENTS_KEY,
    queryFn: async (): Promise<ClientProfile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        logger.error('[Clients] Fetch failed:', error.message);
        throw error;
      }
      return (data ?? []).map((r) => mapRow(r as ProfileRow));
    },
  });

  const clients = useMemo(() => clientsQuery.data ?? [], [clientsQuery.data]);

  const setCache = useCallback(
    (updater: (prev: ClientProfile[]) => ClientProfile[]) => {
      queryClient.setQueryData<ClientProfile[]>(CLIENTS_KEY, (prev) => updater(prev ?? []));
    },
    [queryClient],
  );

  const insertMutation = useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const { data, error } = await supabase.from('profiles').insert(row).select('*').single();
      if (error) throw error;
      return mapRow(data as ProfileRow);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });

  const createClient = useCallback(
    (
      data: {
        firstName: string;
        lastName: string;
        location: string;
        phone: string;
        password?: string;
        messengerLink?: string;
        clientStatus?: ClientStatus;
      },
      createdBy: 'self' | 'accountant',
    ): ClientProfile => {
      const username = generateUsername(data.firstName);
      const optimistic: ClientProfile = {
        id: `tmp_${Date.now()}`,
        firstName: data.firstName,
        lastName: data.lastName,
        location: data.location,
        phone: data.phone,
        messengerLink: data.messengerLink,
        username,
        password: data.password,
        clientStatus: data.clientStatus ?? 'standard',
        createdAt: new Date().toISOString(),
        createdBy,
      };
      setCache((prev) => [optimistic, ...prev]);
      insertMutation.mutate(
        {
          first_name: data.firstName,
          last_name: data.lastName,
          location: data.location,
          phone: data.phone,
          messenger_link: data.messengerLink ?? null,
          username,
          client_status: data.clientStatus ?? 'standard',
          created_by: createdBy,
        },
        {
          onSuccess: (saved) => {
            // Keep the just-entered password transiently for the hand-off UI.
            setCache((prev) => [
              { ...saved, password: data.password },
              ...prev.filter((c) => c.id !== optimistic.id),
            ]);
          },
          onError: (err) => {
            logger.error('[Clients] Create failed:', err);
            setCache((prev) => prev.filter((c) => c.id !== optimistic.id));
          },
        },
      );
      return optimistic;
    },
    [insertMutation, setCache],
  );

  const registerClient = useCallback(
    (data: {
      firstName: string;
      lastName: string;
      location: string;
      phone: string;
      password: string;
      messengerLink?: string;
    }) => createClient(data, 'self'),
    [createClient],
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
    }) => createClient(data, 'accountant'),
    [createClient],
  );

  const getClientById = useCallback(
    (id: string): ClientProfile | undefined => clients.find((c) => c.id === id),
    [clients],
  );

  const updateClientStatus = useCallback(
    (id: string, status: ClientStatus) => {
      setCache((prev) => prev.map((c) => (c.id === id ? { ...c, clientStatus: status } : c)));
      (async () => {
        const { error } = await supabase
          .from('profiles')
          .update({ client_status: status })
          .eq('id', id);
        if (error) logger.error('[Clients] Update status failed:', error.message);
      })();
    },
    [setCache],
  );

  const updateClientProfile = useCallback(
    (
      id: string,
      data: { firstName?: string; lastName?: string; location?: string; messengerLink?: string },
    ) => {
      setCache((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                ...(data.firstName !== undefined && { firstName: data.firstName }),
                ...(data.lastName !== undefined && { lastName: data.lastName }),
                ...(data.location !== undefined && { location: data.location }),
                ...(data.messengerLink !== undefined && { messengerLink: data.messengerLink }),
              }
            : c,
        ),
      );
      const row: Record<string, unknown> = {};
      if (data.firstName !== undefined) row.first_name = data.firstName;
      if (data.lastName !== undefined) row.last_name = data.lastName;
      if (data.location !== undefined) row.location = data.location;
      if (data.messengerLink !== undefined) row.messenger_link = data.messengerLink;
      (async () => {
        const { error } = await supabase.from('profiles').update(row).eq('id', id);
        if (error) logger.error('[Clients] Update profile failed:', error.message);
      })();
    },
    [setCache],
  );

  const deleteClient = useCallback(
    (id: string) => {
      setCache((prev) => prev.filter((c) => c.id !== id));
      (async () => {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) logger.error('[Clients] Delete failed:', error.message);
      })();
    },
    [setCache],
  );

  // Password resets for other accounts require the service role and must
  // run in a trusted environment (Supabase edge function), not the client.
  const resetClientPassword = useCallback((id: string, _newPassword: string) => {
    logger.warn(
      '[Clients] resetClientPassword requires a server-side admin function; ignored on client for',
      id,
    );
  }, []);

  const clientCount = useMemo(() => clients.length, [clients]);

  return {
    clients,
    registerClient,
    addClientByAccountant,
    getClientById,
    updateClientProfile,
    resetClientPassword,
    deleteClient,
    updateClientStatus,
    clientCount,
    isLoading: clientsQuery.isLoading,
  };
});
