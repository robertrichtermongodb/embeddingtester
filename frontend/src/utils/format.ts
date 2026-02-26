export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour12: false });
  } catch {
    return iso;
  }
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
