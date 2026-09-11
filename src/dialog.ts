import { Alert } from 'react-native';

type Confirm = {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
};

// Resolves false when dismissed, so a cancelled confirmation is never mistaken
// for a yes.
export function confirm({ title, message, confirmLabel, destructive }: Confirm): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function notify(title: string, message?: string): void {
  Alert.alert(title, message);
}
