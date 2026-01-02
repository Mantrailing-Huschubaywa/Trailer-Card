// config.ts

/**
 * Globaler Schalter zur Steuerung der Datenquelle.
 * true: Die App verwendet die lokalen Mock-Daten (wie bisher).
 * false: Die App versucht, Daten von Supabase abzurufen.
 * 
 * Dies ermöglicht eine sichere Entwicklung der Datenbankanbindung,
 * während die App voll funktionsfähig bleibt.
 */
export const USE_MOCK_DATA = false;