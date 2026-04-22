-- INV-AUTH-001: canonicalize existing local emails and guard against case-only duplicates.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM auth.users
    GROUP BY lower(btrim(email))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'INV-AUTH-001: case-colliding emails exist in auth.users; resolve manually before migrating';
  END IF;
END
$$;
--> statement-breakpoint
UPDATE auth.users
SET email = lower(btrim(email))
WHERE email <> lower(btrim(email));
