# Development setup

Extract this package in the project root (the folder containing
`package.json`) and merge/replace `src`.

The project must use `src/app`. Move any accidental root-level `app` directory
out of the project before starting Next.js, otherwise it will override the
routes in this package.

PowerShell:

```powershell
Set-Location D:\BachelorBite-GitHub

if (Test-Path .\app) {
    $devBackupPath = "D:\BachelorBite-root-app-backup-dev-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Move-Item -LiteralPath .\app -Destination $devBackupPath
}

if (Test-Path .\.next) {
    Remove-Item -Recurse -Force .\.next
}

npm run dev
```

Open the exact Local URL printed by the dev server, then test:

- `/notice-board`
- `/profile`
- `/chat`
- `/settings` as an admin
- `/contact`

This UI follow-up makes short Notice Board cards follow their content height,
restores spacing around the Profile photo, and gives Chat a full-width square
outer surface/header so no third background color can show around curved
edges. It does not change the v4 Notice Board permission model or rule schema.

The unread badge is per signed-in user and browser. It counts notices from
other members that arrived after the board was last opened, and clears when the
Notice Board is opened.

The package-root `firestore.rules` is the complete merged version of the rules
provided for this update. Review it, then deploy the rules before testing post,
edit, unpin, or delete permissions:

```powershell
firebase deploy --only firestore:rules
```

This rules deploy is separate from a Next.js production build. The local dev
app still talks to Firebase and therefore uses the deployed Firestore rules.
Read `NOTICE-BOARD-FIRESTORE-RULES.md` for the schema mapping and security note.
