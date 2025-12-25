import { supabase } from './supabaseClient';
import { UserRoleEnum, FullUserResponse } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

interface InviteUserResponse {
  message: string;
  userEmail?: string;
  resetPasswordUrl?: string;
}

async function getAuthHeaders() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error('Nicht authentifiziert. Bitte melden Sie sich an.');

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.session.access_token}`,
  };
}

async function readErrorMessage(response: Response) {
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    return json.message || json.error || text;
  } catch {
    return text;
  }
}

export async function getAllAppUsers(): Promise<FullUserResponse[]> {
  if (!SUPABASE_URL) throw new Error('VITE_SUPABASE_URL fehlt.');
  const headers = await getAuthHeaders();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/list-app-users`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as FullUserResponse[];
}

export async function inviteUser(email: string, role: UserRoleEnum): Promise<InviteUserResponse> {
  if (!SUPABASE_URL) throw new Error('VITE_SUPABASE_URL fehlt.');
  if (role !== UserRoleEnum.ADMIN && role !== UserRoleEnum.MITARBEITER) {
    throw new Error('Nur Admin- oder Mitarbeiter-Rollen können eingeladen werden.');
  }

  const headers = await getAuthHeaders();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/invite-user`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, role }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as InviteUserResponse;
}

export async function updateAppUser(
  userId: string,
  updates: { email?: string; role?: UserRoleEnum; firstName?: string; lastName?: string; associatedCustomerId?: string }
): Promise<void> {
  if (!SUPABASE_URL) throw new Error('VITE_SUPABASE_URL fehlt.');
  const headers = await getAuthHeaders();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/update-user`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId, updates }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}

export async function deleteAppUser(userId: string): Promise<void> {
  if (!SUPABASE_URL) throw new Error('VITE_SUPABASE_URL fehlt.');
  const headers = await getAuthHeaders();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-app-user`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}
