// Copied above the CSV so the export lands somewhere useful without you having to
// remember how skin actually behaves. The lag guidance is the important part: a
// same-day correlation is usually the wrong thing to look for.
export function analysisPrompt(days: number): string {
  return `Below is my skin diary as CSV, one row per day, ${days} days in total.

How to read it:
- redness, oiliness and spots are 1 (best) to 5 (worst), blank on days I skipped them.
- period is 1 on days I marked. cycle_day is worked out from that: day 1 is the first
  day of my most recent period. It is blank before my first logged period.
- alcohol and cigarettes are 0 (none), 1 (some) or 2 (a lot). sleep_hours is a number.
- Every other column is 1 or 0. Columns starting product_ are what I put on my face.

Skin reacts to food, products and hormones with a delay of a few days up to about two
weeks, so please do not only look at same-day correlations. Check factors lagged by 1, 3,
7 and 14 days as well.

Please tell me:
1. Which factors track most strongly with worse redness, oiliness or spots, and at what lag.
2. Whether anything tracks with cycle_day rather than with anything I did.
3. Which of those are strong enough to act on and which are probably noise, given ${days}
   days of data — please say plainly when there is not enough data yet.
4. What single change would be most worth testing next.

`;
}
