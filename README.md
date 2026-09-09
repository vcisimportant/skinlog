# Skinlog

A one-minute-a-day skin diary. Log how your skin looks (redness, oiliness, new spots on a 1–5 scale), tick what happened that day (alcohol, dairy, stress, new product…), sleep and period, then export everything as CSV to paste into Claude or a spreadsheet.

Everything is stored on the phone only. No accounts, no server.

## Run it on your phone (fastest)

1. Install [Node.js](https://nodejs.org) (LTS) on your computer.
2. Install the **Expo Go** app on your phone (App Store / Play Store).
3. In this folder:

   ```bash
   npm install
   npx expo install --fix   # aligns package versions with the Expo SDK
   npx expo start
   ```

4. Scan the QR code with Expo Go (Android) or the Camera app (iOS).

Expo Go is enough for daily use; the data persists as long as the app stays installed.

## Build a real installable app

When you want an icon on the home screen without Expo Go:

```bash
npm install -g eas-cli
eas login            # free Expo account
eas build:configure
eas build -p android --profile preview   # gives you an .apk to install directly
eas build -p ios --profile preview       # needs an Apple developer account
```

Change `bundleIdentifier` / `package` in `app.json` to something unique before building.

## Products

Add the products you use on the **Products** tab. Each becomes a chip on the Today screen. "Remove" hides a product from the picker without touching past entries; removed products can be restored, and still get a column in the export.

## Customise what you track

- **Yes/no factors (the chips):** edit the `FACTORS` list in `src/types.ts`. New columns appear in the CSV automatically.
- **Amount chips (alcohol, cigarettes):** edit `LEVELS` in the same file. Each cycles none → some → a lot on tap and exports as 0/1/2.
- **Skin scales:** edit `SCALES` in the same file.
- **Colours:** `src/theme.ts`.

## Export format

One row per day:

```
date,redness,oiliness,spots,period,cycle_day,sleep_hours,alcohol,cigarettes,dairy,...,product_cerave_cleanser,product_niacinamide_serum,notes
2026-09-08,3,4,2,0,14,6.5,1,0,1,...,1,0,"skin felt tight"
```

- Skin scores are 1 (best) to 5 (worst), blank if skipped.
- `period` is 1 on days you toggled it on. `cycle_day` is derived: day 1 is the first day of your most recent period, so you never type it yourself.
- `alcohol` and `cigarettes` are 0 (none), 1 (some) or 2 (a lot).
- Factor and product columns are 1/0. Removed products keep their column so older rows stay complete.

Tip for analysis: skin usually reacts to food and hormones with a delay of a few days to two weeks, so ask for correlations with factors lagged by 1, 3, 7 and 14 days, not just the same day.
