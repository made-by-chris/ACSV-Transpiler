interface SavePickerWindow extends Window {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<{
    name: string;
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
}

export async function saveFile(text: string, extension: string, now = new Date()) {
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const suggestedName = `zrow-${date}${extension}`;
  const mime = extension === ".csv" ? "text/csv" : extension === ".json" ? "application/json" : "text/plain";
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const picker = (window as SavePickerWindow).showSaveFilePicker;
  if (picker) {
    const file = await picker.call(window, {
      suggestedName,
      types: [{ description: extension.slice(1).toUpperCase(), accept: { [mime]: [extension] } }],
    });
    const writable = await file.createWritable();
    await writable.write(blob);
    await writable.close();
    return file.name;
  }
  const chosen = window.prompt("Save as", suggestedName);
  if (chosen === null) return;
  let name = chosen.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, "-") || suggestedName;
  if (!name.toLowerCase().endsWith(extension)) name += extension;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return name;
}
