-- ============================================================================
-- process_transactions_batch
-- ----------------------------------------------------------------------------
-- Macht für Kunden mit MEHREREN Hunden das Gleiche wie process_transaction,
-- nur für mehrere Buchungen auf einmal: Wird z.B. beim "Bestandsübernahme"-
-- Dialog für 2 oder 3 Hunde gleichzeitig ein Startwert gesetzt, entsteht pro
-- Hund eine eigene Buchung (Trail-Zähler) - und der Kunde selbst wird nur
-- EIN Mal aktualisiert (Trainingsfortschritt aller Hunde zusammen).
--
-- Diese Funktion sorgt dafür, dass die Kunden-Aktualisierung UND alle
-- Hunde-Buchungen zusammen als eine einzige, unteilbare Datenbank-Transaktion
-- ausgeführt werden. Bricht mittendrin etwas ab (z.B. Internet weg), wird
-- GAR NICHTS gespeichert, statt dass z.B. Hund 1 schon gebucht ist und
-- Hund 2 nicht - so bleiben pro Hund gezählte Trails garantiert korrekt und
-- unabhängig voneinander.
--
-- Ausführen: Einmalig im Supabase SQL-Editor (Dashboard -> SQL Editor ->
-- New query -> diesen Inhalt einfügen -> Run). Kann gefahrlos mehrfach
-- ausgeführt werden (CREATE OR REPLACE).
-- ============================================================================

create or replace function process_transactions_batch(
  p_customer_id text,
  p_new_balance numeric,
  p_new_total_transactions integer,
  p_dogs jsonb,
  p_transactions jsonb  -- JSON-Array mit einem Objekt pro Buchung/Hund
)
returns void
language plpgsql
as $$
declare
  t jsonb;
begin
  update customers
  set
    balance = p_new_balance,
    "totalTransactions" = p_new_total_transactions,
    dogs = coalesce(p_dogs, dogs)
  where id = p_customer_id;

  if not found then
    raise exception 'Kunde mit ID % wurde nicht gefunden - es wurde NICHTS gespeichert.', p_customer_id;
  end if;

  for t in select * from jsonb_array_elements(p_transactions)
  loop
    insert into transactions (id, "customerId", "dogId", type, description, amount, date, employee)
    values (
      t->>'id',
      p_customer_id,
      t->>'dogId',
      t->>'type',
      t->>'description',
      (t->>'amount')::numeric,
      t->>'date',
      t->>'employee'
    );
  end loop;
end;
$$;

grant execute on function process_transactions_batch(
  text, numeric, integer, jsonb, jsonb
) to authenticated;
