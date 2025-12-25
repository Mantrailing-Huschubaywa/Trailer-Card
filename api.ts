// api.ts
// Dies ist die Client-Seite, die mit Ihren (extern zu implementierenden) Supabase Edge Functions
// oder einer anderen Backend-API kommunizieren würde, um Admin-Operationen durchzuführen.

import { supabase } from './supabaseClient'; // Für das Abrufen der aktuellen Session und des Access Tokens
import { UserRoleEnum, FullUserResponse } from './types'; // Import UserRoleEnum and FullUserResponse

const SUPABASE_URL = process.env.SUPABASE_URL; // Beispiel für die Basis-URL Ihrer Supabase-Instanz

interface InviteUserResponse {
  message: string;
  userEmail?: string;
  resetPasswordUrl?: string; // Supabase invite/reset link
}

async function getAuthHeaders() {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Nicht authentifiziert. Bitte melden Sie sich an.');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.data.session.access_token}`,
  };
}

/**
 * Ruft alle Anwendungsbenutzer über eine serverseitige API ab.
 * Diese API-Route sollte supabase.auth.admin.listUsers() verwenden und Profile verknüpfen.
 * @returns Promise<FullUserResponse[]>
 */
export async function getAllAppUsers(): Promise<FullUserResponse[]> {
  try {
    const headers = await getAuthHeaders();
    // Annahme: Sie haben eine Edge Function 'list-app-users' bereitgestellt
    const response = await fetch(`${SUPABASE_URL}/functions/v1/list-app-users`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Fehler beim Abrufen aller Benutzer: ${response.statusText}`);
    }

    const data: FullUserResponse[] = await response.json();
    return data;
  } catch (error: any) {
    console.error('Fehler in getAllAppUsers:', error.message);
    throw error;
  }
}


/**
 * Lädt einen neuen Admin- oder Mitarbeiter-Benutzer über eine serverseitige API ein.
 * Diese API-Route sollte supabase.auth.admin.inviteUserByEmail() verwenden und die Rolle setzen.
 * @param email Die E-Mail-Adresse des einzuladenden Benutzers.
 * @param role Die Rolle des Benutzers ('admin' oder 'staff').
 * @returns Promise<InviteUserResponse>
 */
export async function inviteUser(email: string, role: UserRoleEnum): Promise<InviteUserResponse> {
  if (role !== UserRoleEnum.ADMIN && role !== UserRoleEnum.MITARBEITER) {
    throw new Error('Nur Admin- oder Mitarbeiter-Rollen können eingeladen werden.');
  }
  try {
    const headers = await getAuthHeaders();
    // Annahme: Sie haben eine Edge Function 'invite-user' bereitgestellt
    const response = await fetch(`${SUPABASE_URL}/functions/v1/invite-user`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ email, role }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Fehler beim Einladen des Benutzers: ${response.statusText}`);
    }

    const data: InviteUserResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error('Fehler in inviteUser:', error.message);
    throw error;
  }
}

/**
 * Aktualisiert einen vorhandenen Benutzer über eine serverseitige API.
 * Diese API-Route sollte supabase.auth.admin.updateUserById() und profiles.update() verwenden.
 * @param userId Die ID des zu aktualisierenden Benutzers.
 * @param updates Die zu aktualisierenden Felder (z.B. { email: 'new@example.com', role: 'admin' }).
 * @returns Promise<void>
 */
export async function updateAppUser(userId: string, updates: { email?: string; role?: UserRoleEnum; firstName?: string; lastName?: string; associatedCustomerId?: string }): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    // Annahme: Sie haben eine Edge Function 'update-user' bereitgestellt
    const response = await fetch(`${SUPABASE_URL}/functions/v1/update-user`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ userId, updates }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Fehler beim Aktualisieren des Benutzers: ${response.statusText}`);
    }
  } catch (error: any) {
    console.error('Fehler in updateAppUser:', error.message);
    throw error;
  }
}


/**
 * Löscht einen Benutzer über eine serverseitige API.
 * Diese API-Route sollte supabase.auth.admin.deleteUser() und zugehörige Profil-Einträge löschen.
 * @param userId Die ID des zu löschenden Benutzers.
 * @returns Promise<void>
 */
export async function deleteAppUser(userId: string): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    // Annahme: Sie haben eine Edge Function 'delete-app-user' bereitgestellt
    const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-app-user`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Fehler beim Löschen des Benutzers: ${response.statusText}`);
    }
  } catch (error: any) {
    console.error('Fehler in deleteAppUser:', error.message);
    throw error;
  }
}
