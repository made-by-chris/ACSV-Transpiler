interface Props {
  title: string;
  saved: boolean;
  canExport: boolean;
  hasSource: boolean;
  onTitle: (value: string) => void;
  onCopySource: () => void;
  onSaveSource: () => void;
  format: "csv" | "json";
  onFormat: (format: "csv" | "json") => void;
  onCopyData: () => void;
  onDownloadData: () => void;
  onDownloadFormat: (format: "csv" | "json") => void;
}

export default function UtilityBar(props: Props) {
  return (
    <header class="app-header">
      <div class="brand">
        <span class="brand-mark">
          A<span>CSV</span>
        </span>
      </div>
      <div class="document-name">
        <label class="sr-only" for="document-title">
          Document name
        </label>
        <input
          id="document-title"
          value={props.title}
          onInput={(e) => props.onTitle(e.currentTarget.value)}
          placeholder="Untitled"
        />
        <span classList={{ "save-state": true, "save-warning": !props.saved }}>
          {props.saved ? "Saved locally" : "Browser storage unavailable"}
        </span>
      </div>
      <nav class="export-actions" aria-label="Main navigation">
        <a href="/docs/">Docs</a><a href="/about/">About</a><a href="https://majaku.com/account/">Account</a>
        <select aria-label="Download" value="" onChange={(e) => {
          const value = e.currentTarget.value;
          if (value === "source") props.onSaveSource();
          else if (value) props.onDownloadFormat(value as "csv" | "json");
          e.currentTarget.value = "";
        }}>
          <option value="" disabled selected>Download</option>
          <option value="source" disabled={!props.hasSource}>Source</option>
          <option value="csv" disabled={!props.canExport}>CSV</option>
          <option value="json" disabled={!props.canExport}>JSON</option>
        </select>
      </nav>
    </header>
  );
}
