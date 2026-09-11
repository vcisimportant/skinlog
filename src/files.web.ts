// The native module shares a file from disk. In a browser there is no disk to
// share from, so a backup is handed to the share sheet when iOS offers one, and
// falls back to an ordinary download otherwise. Either way it ends up somewhere
// the user chooses — Files, iCloud Drive, mail.
export async function shareText(
  filename: string,
  contents: string,
  mimeType: string,
  _uti: string,
): Promise<void> {
  const file = new File([contents], filename, { type: mimeType });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (e) {
      // Dismissing the share sheet is not a failure worth reporting.
      if ((e as Error)?.name === 'AbortError') return;
    }
  }

  const url = URL.createObjectURL(new Blob([contents], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Returns null when the picker was dismissed.
export function pickTextFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json,text/plain';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
}
