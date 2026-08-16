# 8-4L Teddy Farm — Goat Management System

A simple, mobile-first goat farm management app for Pakistani Teddy goat breeders.
Built with **Next.js 14 (App Router) + Prisma + PostgreSQL + NextAuth**, deployable
for free on **Vercel + Supabase**.

This is the MVP (Phase 1) described in the project brief:
- Goat registration with auto-generated IDs (TF-001, TM-001…)
- Pedigree / family tree with automatic inbreeding warnings
- Breeding, pregnancy, and kidding tracking (kidding auto-creates kid profiles)
- Health, vaccination (incl. bulk), and weight records
- Reproductive performance stats
- Expenses, sales, and a farm financial summary
- Tasks/reminders and a dashboard with kidding/vaccination alerts
- Basic reports
- Role-based accounts (Owner, Worker, Vet) with per-farm data isolation

---

## 1. Accounts you need to create

1. **GitHub** — to hold the code (github.com — free)
2. **Supabase** — the Postgres database (supabase.com — free tier is enough to start)
3. **Vercel** — hosting for the Next.js app (vercel.com — free tier is enough to start)

You do not need to pay for anything to get this running for a small farm.

---

## 2. Get the code onto GitHub

```bash
cd goat-farm-app
git init
git add .
git commit -m "Initial commit: goat farm MVP"
```

Create a new empty repository on GitHub (no README/license), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/goat-farm-app.git
git branch -M main
git push -u origin main
```

---

## 3. Create the database (Supabase)

1. Go to supabase.com → **New project**.
2. Pick a name (e.g. `teddy-farm`), a strong database password (save it), and a region close to Pakistan (e.g. Singapore).
3. Once the project is ready: **Project Settings → Database → Connection string → URI**.
4. Copy that string. It looks like:
   `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxx.supabase.co:5432/postgres`
5. For serverless hosting (Vercel), use the **connection pooling** string instead
   (Project Settings → Database → Connection pooling → "Transaction" mode, port 6543),
   and append `?pgbouncer=true` if it isn't already there. This becomes your `DATABASE_URL`.

---

## 3.5. Set up file storage (for goat photos and documents)

Photos and document uploads (prescriptions, receipts, lab reports) use Vercel Blob storage.

1. In your Vercel project: **Storage** tab → **Create Database** → **Blob** → connect it to this project.
2. That's it for production — Vercel automatically injects `BLOB_READ_WRITE_TOKEN` into your deployment.
3. For local development: open that same Blob store in the Vercel dashboard → **.env.local** tab → copy the token into your local `.env` file as `BLOB_READ_WRITE_TOKEN`.

If you skip this step, everything else keeps working — only photo/document uploads will fail with a clear error until it's connected.

---

## 4. Environment variables

Copy `.env.example` to `.env` and fill in:

```
DATABASE_URL="<your Supabase pooled connection string>"
NEXTAUTH_SECRET="<random string — generate with: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 5. Run it locally

```bash
npm install
npx prisma db push        # creates all tables in your Supabase database
npm run db:seed           # optional: loads the starter farm + Noor, Heer, Sultan
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

- If you ran the seed script: sign in with **owner@example.com / changeme123**,
  then **change this password immediately** by inviting yourself as a new owner
  and disabling this account, or updating it directly in Supabase's Table Editor
  (Phase 2 will add a proper "change password" screen).
- If you skipped seeding: go to **/setup** to create your own farm and owner
  account from scratch with your real name, email, and password.

---

## 6. Deploy to Vercel

1. Go to vercel.com → **Add New → Project** → import your GitHub repo.
2. In **Environment Variables**, add the same three variables from your `.env`:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` → set this to your real Vercel URL, e.g. `https://goat-farm-app.vercel.app`
     (you can add this after the first deploy once you know the URL, then redeploy)
3. Click **Deploy**.
4. After the first deploy, run the database push once against production
   (from your local machine, with `.env` pointed at the same Supabase URL —
   you already did this in step 5, so nothing further is needed unless you
   change the schema later, in which case run `npx prisma db push` again
   before or after deploying the new code).

Your farm app is now live at your Vercel URL and installable as a PWA
(Chrome/Safari → "Add to Home Screen") on any phone.

---

## 7. Creating the first admin account in production

Visit `https://your-app.vercel.app/setup` once, fill in your farm name,
your name, email, and a password. This creates your Owner account directly
in the production database. After that, share ordinary login credentials
with farm workers by asking a developer to extend the `/setup` flow with
an "invite" screen (the `inviteTeamMember` server action in
`src/lib/actions/setup.ts` already supports this — Phase 2 wires up its UI).

---

## 8. Project structure

```
prisma/
  schema.prisma        # full relational schema (matches spec section 34)
  seed.ts               # starter farm + Noor/Heer/Sultan
src/
  lib/
    prisma.ts            # Prisma client singleton
    auth.ts              # NextAuth config, session helper, role guard
    pedigree.ts           # ancestor lookup + inbreeding warning logic
    ids.ts                 # sequential TF-/TM- ID generator
    utils.ts               # date/money formatting helpers
    actions/               # server actions = your "API" (goats, breeding,
                            # kidding, care, finance, setup)
  components/
    forms/                # small client forms, one per record type
    GoatForm.tsx, BottomNav.tsx, SignOutButton.tsx
  app/
    login/, setup/         # public auth pages
    api/auth/[...nextauth]/route.ts
    (app)/                 # everything behind login
      dashboard/ herd/ breeding/ health/ finance/ tasks/ reports/
```

---

## 9. Business rules already enforced (server-side, spec section 35)

- A female cannot be recorded mating with another female; a male cannot be a mother.
- A goat cannot be its own parent.
- Father must be male, mother must be female (validated on save).
- A kid's date of birth must be after both parents' dates of birth.
- Every mating is checked for close-relative breeding before saving —
  parent×offspring, full/half siblings, grandparent×grandchild, shared
  grandparents — shown as a red warning the user must explicitly override.
- Dead or sold animals are excluded from the breeding-eligible lists.
- Kidding records automatically create and link kid profiles to the
  recorded mother and father.
- Records are never hard-deleted — animals are "retired" via status
  change (Sold / Dead / Culled) so pedigree and history stay intact.
- Farm workers cannot change an animal to a terminal status
  (sold/dead/culled) — only Owner/Vet roles can, per `assertCanDelete`.

---

## 10. What's next (Phase 2, not yet built)

- QR code generation per goat
- Excel (CSV) and PDF report export
- Inventory & feed modules (schema exists — `InventoryItem`, `FeedType`,
  `FeedingRecord` — UI not yet built)
- Offline queueing for true no-signal use (currently requires connectivity)
- Photo/document uploads (schema exists — `GoatPhoto`, `Document` —
  needs a file storage provider, e.g. Supabase Storage or Vercel Blob)
- Team invite UI for Worker/Vet accounts (action exists, screen doesn't)
- "Change password" self-service screen

Send me error messages or screenshots from any step above and I'll debug
directly — I can't run `npm install`/deploy myself from this chat, but I
can read output you paste back and fix the code.
