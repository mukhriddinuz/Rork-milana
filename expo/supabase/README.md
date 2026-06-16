# Supabase setup & security

`schema.sql` is the canonical database definition. It is consistent with
the client code (snake_case columns), keeps credentials in Supabase Auth
(no plaintext passwords) and enforces authorization in the database with
Row Level Security — not only in the app.

## Apply the schema

```bash
# Local dev
supabase db reset

# Or against a hosted project
psql "$DATABASE_URL" -f supabase/schema.sql
```

The script is idempotent: tables/policies/functions are created or
replaced, and existing policies are dropped first so it can be re-run.

## Roles & access model

Every authenticated user gets a row in `profiles` automatically (trigger
`on_auth_user_created`). The `profiles.role` column drives authorization:

| role         | can do                                                        |
|--------------|---------------------------------------------------------------|
| `client`     | read published products, manage own cart/favorites/orders     |
| `accountant` | + read all profiles, manage products, orders, audit log       |
| `admin`      | + manage categories, delete profiles, full control            |

RLS helper functions (`is_admin()`, `is_staff()`, `is_vip()`) are
`SECURITY DEFINER` to avoid recursive policy evaluation.

### Promote a user to admin

The schema auto-promotes the founder email on apply. To grant admin to
anyone else:

```sql
update public.profiles p set role = 'admin'
from auth.users u
where u.id = p.id and lower(u.email) = lower('person@example.com');
```

The in-app `EXPO_PUBLIC_ADMIN_EMAILS` allowlist only controls whether the
admin UI is *shown*. Real enforcement is the `role` column above, so an
attacker hitting the API directly still cannot write without the role.

## Environment variables

See `.env.example`. Client keys are prefixed `EXPO_PUBLIC_`; the stylist
secret (`RORK_TOOLKIT_SECRET_KEY`) is server-only and must never carry
that prefix.

## Known follow-up

Accountant-created clients are directory entries without a login. Issuing
real credentials for them requires a Supabase Edge Function using the
service-role key to call `auth.admin.createUser` — intentionally kept out
of the client bundle.
