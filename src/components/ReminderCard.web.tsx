import { Settings } from '../storage';

type Props = {
  settings: Settings;
  onChange: (settings: Settings) => void;
};

// iOS browsers cannot schedule a repeating daily notification, and the native
// time picker has no web build at all, so the whole card is absent on web rather
// than present and broken.
export function ReminderCard(_props: Props) {
  return null;
}
