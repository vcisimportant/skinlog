# Skinlog

A one-minute-a-day skin diary. Log how your skin looks (redness, oiliness, new spots on a 1–5 scale), tick what
happened that day (alcohol, dairy, stress, a new product…), sleep and period. The app reminds you, shows you how
the last two months went and how your skin moves across your cycle, and exports everything as CSV to paste into
Claude or a spreadsheet.

Everything is stored on the phone only. No accounts, no server.

## Run it on your phone (fastest)

1. Install [Node.js](https://nodejs.org) (LTS) on your computer.
2. Install the **Expo Go** app on your phone (App Store / Play Store).
3. In this folder:

   ```bash
   npm install
   npx expo start
   ```

4. Scan the QR code with Expo Go (Android) or the Camera app (iOS).

Everything you log is written to the phone as you type it — there is no save button, and the day you are editing
is stored when you leave it, switch tabs or close the app. The data survives closing the app but not uninstalling
it, so see **Backups** below.

Daily reminders are more reliable in a real build than in Expo Go. If the reminder is the feature you care about,
build the app properly (next section).

## Build a real installable app

When you want an icon on the home screen without Expo Go:

```bash
npm install -g eas-cli
eas login            # free Expo account
eas build:configure
eas build -p ios --profile preview       # needs an Apple developer account
eas build -p android --profile preview   # gives you an .apk to install directly
```

Change `bundleIdentifier` / `package` in `app.json` to something unique before building.

## The Setup tab

Three things live here.

- **Daily reminder** — one notification a day at a time you choose. The first time you switch it on, the phone
  asks permission; if you refuse, the switch turns itself back off rather than pretending to be on.
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
