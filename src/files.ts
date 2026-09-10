import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Writes a real file and opens the share sheet, so the result can be saved to
// Files or Drive instead of being pasted somewhere as a wall of text.
export async function shareText(
  filename: string,
  contents: string,
  mimeType: string,
  uti: string,
): Promise<void> {
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(contents);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(file.uri, { mimeType, UTI: uti, dialogTitle: filename });
}

// Returns null when the picker was dismissed. Deliberately unfiltered: a backup
// arriving back from Drive or email does not reliably keep its JSON mime type.
export async function pickTextFile(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return null;
  return new File(res.assets[0].uri).text();
}
