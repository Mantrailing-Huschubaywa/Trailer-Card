-- ============================================================================
-- process_transaction
-- ----------------------------------------------------------------------------
-- Bucht eine Transaktion und aktualisiert den zugehörigen Kunden (Saldo,
-- Anzahl Transaktionen, Hunde/Trainingsfortschritt) in EINER einzigen
-- Datenbank-Transaktion.
--
-- Warum das nötig ist:
-- Die App hat den Kunden-Datensatz (UPDATE customers) und die Transaktion
-- (INSERT INTO transactions) bisher als zwei unabhängige, unabgesicherte
-- Anfragen an Supabase geschickt. Bricht die Verbindung mittendrin ab
-- (Handynetz, WLAN-Aussetzer, Tab geschlossen, ...), kann genau eine der
-- beiden Operationen durchgehen und die andere nicht - der Saldo passt dann
-- nicht mehr zur Buchungshistorie.
--
-- Diese Funktion führt beide Schritte als eine einzige, unteilbare
-- Postgres-Transaktion aus: Entweder werden BEIDE Änderungen übernommen,
-- oder (bei einem Fehler) KEINE davon. Ein "halb gebuchter" Zustand kann
-- dadurch nicht mehr entstehen.
--
-- Ausführen: Einmalig im Supabase SQL-Editor (Dashboard -> SQL Editor ->
-- New query -> diesen Inhalt einfügen -> Run). Kann gefahrlos mehrfach
-- ausgeführt werden (CREATE OR REPLACE).
-- ============================================================================

create or replace function process_transaction(
  p_customer_id text,
  p_new_balance numeric,
  p_new_total_transactions integer,
  p_dogs jsonb,
  p_transaction_id text,
  p_dog_id text,
  p_type text,
  p_description text,
  p_amount numeric,
  p_date text,
  p_employee text
)
returns void
language plpgsql
as $$
begin
  -- Läuft mit den Rechten des aufrufenden Benutzers (SECURITY INVOKER, der
  -- Standard) - es gelten also weiterhin dieselben RLS-Policies wie bisher.
  -- Die Funktion ändert also nicht, WER etwas darf, nur DASS beide Schritte
  -- garantiert zusammen passieren.

  update customers
  set
    balance = p_new_balance,
    "totalTransactions" = p_new_total_transactions,
    dogs = coalesce(p_dogs, dogs)
  where id = p_customer_id;

  if not found then
    raise exception 'Kunde mit ID % wurde nicht gefunden - Transaktion wurde NICHT gebucht.', p_customer_id;
  end if;

  insert into transactions (id, "customerId", "dogId", type, description, amount, date, employee)
  values (p_transaction_id, p_customer_id, p_dog_id, p_type, p_description, p_amount, p_date, p_employee);
end;
$$;

-- Erlaubt authentifizierten Nutzern, die Funktion aufzurufen (feingranulare
-- Rechte -Admin/Mitarbeiter vs. Kunde- werden weiterhin durch die
-- bestehenden RLS-Policies auf "customers" und "transactions" durchgesetzt,
-- da die Funktion mit SECURITY INVOKER läuft).
grant execute on function process_transaction(
  text, numeric, integer, jsonb, text, text, text, text, numeric, text, text
) to authenticated;
