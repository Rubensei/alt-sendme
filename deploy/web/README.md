# Web deploy notes (Vercel)

Web deploy runs on release tags (`v*.*.*`) via `.github/workflows/deploy-web.yml`.

## One-time setup

1. Create/import the Vercel project for this repo.
2. In Vercel project settings, set:
   - Framework Preset: `Other`
   - Root Directory: `.`
   - Build Command: empty
   - Install Command: empty
3. Add GitHub Actions secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
4. From repo root, run:

```bash
npx vercel link
```

## Release deploy

```bash
git tag v0.4.3
git push origin v0.4.3
```

## Manual deploy

Run from repo root only:

```bash
pnpm deploy:web:vercel
```

If Vercel CLI ever links to the wrong project, re-run:

```bash
npx vercel link
```
