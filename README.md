# Skinlog

A one-minute-a-day skin diary. Log how your skin looks (redness, oiliness, new spots on a 1–5 scale), tick what
happened that day (alcohol, dairy, stress, a new product…), sleep and period. It shows you how the last two months
went and how your skin moves across your cycle, and exports everything as CSV to paste into Claude or a spreadsheet.

Everything is stored on the phone only. No accounts, no server.

## Use it on your phone

Skinlog runs as a web app, installed to your Home Screen. No App Store, no Apple developer
account, nothing to pay.

1. Open **https://YOUR-GITHUB-USERNAME.github.io/skinlog/** in Safari on the iPhone.
2. Tap the **Share** button, then **Add to Home Screen**.
3. Open it from the icon, not from Safari.

From then on it behaves like an app: its own icon, full screen, and it works with no signal —
the whole thing is cached on the phone the first time you open it.

Opening it from the Home Screen rather than a Safari tab matters. It is what makes iOS treat
your data as real app data rather than as a browser cache it can clear.

**Daily reminders do not work on the web.** iOS browsers cannot schedule them, so the reminder
section is hidden. Everything else works.

## Where your data lives

On your phone, in the browser's IndexedDB, and nowhere else. Nothing is uploaded, there is no
server and no account. The site is only code — opening the URL on another device shows an
empty diary.

The app asks iOS to mark that storage as persistent, which it generally grants once the app is
on your Home Screen and used regularly. That protects it from routine clean-ups, but it is not
an absolute guarantee: iOS can still clear it if the phone is critically low on storage, or if
you clear website data by hand.

So: **the working copy is on the phone, the backup file is the archive.** On the Export tab,
**Save a backup file** and keep it in iCloud Drive. The app tracks when you last did this and
nags you on the Export tab after a fortnight, because the gap since your last backup is the
most you can lose. It also refuses to let you overwrite a good backup with a smaller one, which
is the trap if your data ever does get cleared — restore first, back up after.

## Working on it

```bash
npm install
npm test              # the pure logic
npm run build:web     # produces dist-web/
```

`npx expo start` runs it through Expo Go for quick iteration, and the code still builds as a
real iOS app if you ever get an Apple developer account.

Pushing to `main` builds and deploys the web app to GitHub Pages automatically
(`.github/workflows/deploy-web.yml`), running the typecheck and the tests first. Enable it once
under **Settings → Pages → Source: GitHub Actions**.

## The Setup tab

Three things live here.

- **Daily reminder** — one notification a day at a time you choose. Only in a real iOS build; the section is
  hidden in the web app, because browsers on iOS cannot schedule one.
- **Products** — everything you put on your face. Each becomes a chip on the Today screen. Anything added in the
  last three weeks is flagged on the day you tick it, because a new product is the obvious suspect when skin turns.
- **Things that happened** — the yes/no chips: food, stress, anything you suspect. Add and remove them here; new
  ones get their own CSV column automatically.

"Remove" hides something from the daily picker without touching past entries. Removed items can be restored, and
still get a column in the export as long as some logged day still uses them.

## Trends

At the top of the **History** tab, once you have a week of data:

- **Last 60 days** — one mark per day per scale. Green is calm, red is bad, faint marks are days you did not log.
- **Across your cycle** — the same cycle day averaged over every cycle you have logged, which is where a hormonal
  pattern shows up that a plain calendar view hides. Needs two periods behind it before it appears.

## Backups

Your diary lives on this phone and nowhere else. On the **Export** tab:

- **Save a backup file** writes a single `.json` file and opens the share sheet, so you can keep it in Files,
  Drive or your own email. Do this occasionally, and before changing phones.
- **Restore from a backup** reads one back. It replaces everything currently on the phone, and asks first,
  showing how many days the file holds. A file that is not a Skinlog backup is refused rather than half-imported.

The CSV is for analysis; the backup is what brings your data back. It carries your products and factors as well as
your days, because days reference those by id.

## Customise what you track

- **Yes/no chips** and **products**: the Setup tab, in the app.
- **Amount chips (alcohol, cigarettes):** edit `LEVELS` in `src/types.ts`. Each cycles none → some → a lot on tap
  and exports as 0/1/2.
- **Skin scales:** edit `SCALES` in the same file.
- **Colours:** `src/theme.ts`, which carries a light and a dark palette. The app follows whatever your phone is set to.

## Export format

**Copy for analysis** puts a written question above the data, so whoever reads it knows the scales run 1 (best) to
5 (worst) and looks for delayed effects rather than same-day ones. **Save the CSV as a file** gives you the bare
CSV for a spreadsheet.

One row per day:

```
date,redness,oiliness,spots,period,cycle_day,sleep_hours,alcohol,cigarettes,dairy,...,product_cerave_cleanser,notes
2026-09-08,3,4,2,0,14,6.5,1,0,1,...,1,"skin felt tight"
```

- Skin scores are 1 (best) to 5 (worst), blank if skipped.
- `period` is 1 on days you toggled it on. `cycle_day` is derived: day 1 is the first day of your most recent
  period, so you never type it yourself. A new period is taken to have started when no period day has been logged
  for 10 days, so forgetting to log a day mid-period does not restart the count, and a gap in logging between two
  periods does not merge them. Past 60 days the count is left blank rather than exported as a number that is
  almost certainly a period you forgot to log.
- `alcohol` and `cigarettes` are 0 (none), 1 (some) or 2 (a lot).
- Factor and product columns are 1/0. Removed ones keep their column so older rows stay complete.

Tip for analysis: skin usually reacts to food and hormones with a delay of a few days to two weeks, so ask for
correlations with factors lagged by 1, 3, 7 and 14 days, not just the same day. **Copy for analysis** already says
this for you.

## Running the tests

The date maths, the cycle-day derivation, the CSV export, the trends and the backup reader are covered by tests:

```bash
npm test
```

Worth running if you edit `LEVELS` or `SCALES`, or anything under `src/`.
