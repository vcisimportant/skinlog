type Confirm = {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
};

// react-native-web ships Alert as an empty function, so every confirmation built
// on it silently did nothing on web — including restoring a backup. These use the
// browser's own dialogs instead.
export async function confirm({ title, message }: Confirm): Promise<boolean> {
  return window.confirm(`${title}\n\n${message}`);
}

export function notify(title: string, message?: string): void {
  window.alert(message ? `${title}\n\n${message}` : title);
}
