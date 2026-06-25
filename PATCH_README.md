# Trainer App patch: Website Edit, exercise animations, calendar day pop-up fix

Apply these files over the existing GitHub-connected Trainer App repository.

Important:
- Do not overwrite your working `package-lock.json` if you already fixed it with `npm install`.
- After copying the files, run `npm run build` locally.
- Commit and push the changed source files.

Changes included:
- Added `/admin/website-edit`, a visual website-edit/control-panel section inspired by the Vulcaniq edit workspace.
- Added admin sidebar link for Website Edit.
- Added visual preview + inspector for branding, content blocks, dashboard widgets, customer nav, feature flags, and policy settings.
- Fixed the customer availability calendar so every day opens the full-screen day detail modal, including days with no availability.
- Improved exercise editor with multilingual fields, coaching details, and realistic media support.
- Added Supabase Storage upload support for exercise MP4/WebM/GIF/image files using the existing `exercise-media` bucket.
- Improved customer exercise detail page to display the exercise animation/video/GIF.
- Included redirect-loop-safe route guards.
- Added all new i18n keys for English, Spanish, and Italian.

Required Supabase setup:
- Ensure `supabase/storage.sql` has been applied so the public `exercise-media` bucket exists.
- Existing App Builder tables and policies are used; no new table migration is required.

After applying:

```powershell
npm run build
git add src PATCH_README.md
git commit -m "Add website edit and exercise animations"
git push
```
