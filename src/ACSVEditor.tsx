import {
  createSignal,
  createMemo,
  createEffect,
  For,
  Show,
  onCleanup,
} from "solid-js";
import {
  compile,
  serializeJSON,
  ACSVError,
  type Compilation,
  type InputMode,
} from "./ACSVTranspiler";
import { examples } from "./exampleACSV";
import UtilityBar from "./UtilityBar";
import { saveFile } from "./saveFile";

interface Draft {
  input: string;
  mode: InputMode;
  title: string;
  format: "csv" | "json";
}
const STORAGE_KEY = "acsv.workbench.v1";
const PREVIEW_ROWS = 100;
function readDraft(): Draft {
  const fallback: Draft = {
    input: examples[0].source,
    mode: "acsv",
    title: examples[0].title,
    format: "csv",
  };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const draft = JSON.parse(stored);
      if (
        typeof draft.input === "string" &&
        typeof draft.title === "string" &&
        ["csv", "acsv"].includes(draft.mode)
      )
        return {
          ...draft,
          format: ["csv", "json"].includes(draft.format) ? draft.format : "csv",
        };
    }
    // Keep drafts from the original editor, including intentionally empty ones.
    return {
      ...fallback,
      input: localStorage.getItem("ACSVEditor_input") ?? fallback.input,
      title: localStorage.getItem("ACSVEditor_title") ?? fallback.title,
    };
  } catch {
    return fallback;
  }
}

export default function ACSVEditor() {
  const [draft, setDraft] = createSignal(readDraft());
  const [undo, setUndo] = createSignal<Draft>();
  const [view, setView] = createSignal<"table" | "csv" | "json">("table");
  const [notice, setNotice] = createSignal("");
  const [selection, setSelection] = createSignal<{
    row: number;
    column: number;
  }>();
  let editor!: HTMLTextAreaElement;
  let gutter!: HTMLPreElement;
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(noticeTimer));

  const compilation = createMemo<{ result?: Compilation; error?: ACSVError }>(
    () => {
      try {
        return {
          result: compile({ input: draft().input, mode: draft().mode }),
        };
      } catch (error) {
        return {
          error:
            error instanceof ACSVError
              ? error
              : new ACSVError(
                  "E_INTERNAL",
                  error instanceof Error
                    ? error.message
                    : "Unable to compile this document.",
                ),
        };
      }
    },
  );
  const result = () => compilation().result;
  const json = createMemo<{ text: string; error?: ACSVError }>(() => {
    if (!result()) return { text: "" };
    try {
      return { text: serializeJSON(result()!) };
    } catch (error) {
      return { text: "", error: error as ACSVError };
    }
  });
  const error = () =>
    compilation().error ??
    (draft().format === "json" ? json().error : undefined);
  const canExport = () => !!result()?.headers.length && !error();
  const output = () =>
    draft().format === "json" ? json().text : (result()?.csv ?? "");
  function chooseView(next: "table" | "csv" | "json") {
    setView(next);
    if (next !== "table") update({ format: next });
  }
  const preview = () => result()?.rows.slice(0, PREVIEW_ROWS) ?? [];
  const selected = createMemo(() => {
    const cell = selection(),
      data = result();
    if (!cell || !data?.rows[cell.row]) return undefined;
    return {
      ...cell,
      name: data.headers[cell.column],
      origin: data.origins[cell.row][cell.column],
    };
  });
  createEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft()));
    } catch {
      announce("Browser storage unavailable. Download to keep a copy.");
    }
  });

  function announce(message: string) {
    clearTimeout(noticeTimer);
    setNotice(message);
    noticeTimer = setTimeout(() => setNotice(""), 4500);
  }
  function update(next: Partial<Draft>) {
    setDraft((previous) => ({ ...previous, ...next }));
    setSelection(undefined);
  }
  function replace(next: Draft) {
    setUndo({ ...draft() });
    setDraft(next);
    setSelection(undefined);
  }
  function restore() {
    const previous = undo();
    if (previous) {
      setDraft(previous);
      setUndo(undefined);
      setSelection(undefined);
    }
  }
  function goToLine(line: number) {
    const lines = draft().input.split(/\r\n|\r|\n/);
    const start = lines
      .slice(0, line - 1)
      .reduce((n, text) => n + text.length + 1, 0);
    editor.focus();
    editor.setSelectionRange(start, start + (lines[line - 1]?.length ?? 0));
    editor.scrollTop = Math.max(0, (line - 3) * 24);
    gutter.scrollTop = editor.scrollTop;
  }
  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      announce(`${label} copied.`);
    } catch {
      announce(
        "Clipboard unavailable. Select and copy the text in the editor.",
      );
    }
  }
  async function download(text: string, extension: string) {
    try {
      const name = await saveFile(text, extension);
      if (name) announce(`Saved ${name}.`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      announce(error instanceof Error ? `Save failed: ${error.message}` : "Save failed. Try again.");
    }
  }

  function chooseDownload(format: string) {
    if (format === "source") {
      const input = draft().input;
      const source = draft().mode === "csv" || /^#\s*XCSV\b/m.test(input) ? input : `# XCSV 0.1\n${input}`;
      void download(source, draft().mode === "csv" ? ".csv" : ".xcsv");
    } else if (canExport() && (format === "csv" || format === "json")) {
      void download(format === "csv" ? result()!.csv : json().text, `.${format}`);
    }
  }

  return (
    <div class="workbench">
      <UtilityBar />
      <main>
        <aside class="sponsor-card" aria-label="Advertisement">
          <span class="sponsor-label">Advertisement</span>
          <a href="https://paperboy.now" target="_blank" rel="sponsored noopener noreferrer"><strong>paperboy<span>.now</span></strong><span>A printer in your pocket</span><span class="sponsor-arrow" aria-hidden="true">↗</span></a>
        </aside>
        <div class="editor-grid">
          <section class="panel source-panel" aria-labelledby="source-heading">
            <div class="panel-heading">
              <div class="panel-label">
                <h2 id="source-heading">Source</h2>
              </div>
              <div class="source-actions">
                <button onClick={() => void copy(draft().input, "Source")}>
                  Copy source
                </button>
                <Show when={undo()}>
                  <button class="text-button" onClick={restore}>
                    Undo
                  </button>
                </Show>
                <button
                  class="text-button"
                  onClick={() => replace({ ...draft(), input: "" })}
                  disabled={!draft().input}
                >
                  Clear
                </button>
              </div>
            </div>
            <div class="source-settings">
              <label for="input-mode">Input</label>
              <select
                id="input-mode"
                value={draft().mode}
                onChange={(e) =>
                  update({ mode: e.currentTarget.value as InputMode })
                }
              >
                <option value="acsv">XCSV recipe</option>
                <option value="csv">Literal CSV</option>
              </select>
              <select
                aria-label="Load example"
                value=""
                onChange={(e) => {
                  const example = examples.find(
                    (item) => item.id === e.currentTarget.value,
                  );
                  if (example)
                    replace({
                      input: example.source,
                      title: example.title,
                      mode: example.mode,
                      format: draft().format,
                    });
                  e.currentTarget.value = "";
                }}
              >
                <option value="" disabled>
                  Examples
                </option>
                <For each={examples}>
                  {(example) => (
                    <option value={example.id}>{example.label}</option>
                  )}
                </For>
              </select>
            </div>
            <div class="source-area">
              <pre ref={gutter} class="line-numbers" aria-hidden="true">
                {draft()
                  .input.split(/\r\n|\r|\n/)
                  .map((_, i) => i + 1)
                  .join("\n")}
              </pre>
              <textarea
                ref={editor}
                aria-label="Source editor"
                aria-invalid={!!error()}
                aria-describedby={error() ? "diagnostic" : undefined}
                spellcheck={false}
                autocapitalize="off"
                autocomplete="off"
                wrap="off"
                value={draft().input}
                onInput={(e) => update({ input: e.currentTarget.value })}
                onScroll={() => {
                  gutter.scrollTop = editor.scrollTop;
                }}
                placeholder={
                  draft().mode === "acsv"
                    ? "id:int,name\n@set id=seq(),name=Player\n@rows 5"
                    : "id,name\n1,Player"
                }
              />
            </div>
            <div class="source-footer">
              <span>{draft().input.length.toLocaleString()} chars</span>
            </div>
          </section>

          <section class="panel output-panel" aria-labelledby="output-heading">
            <div class="panel-heading">
              <div class="panel-label">
                <h2 id="output-heading">Output</h2>
                <span classList={{ "status-dot": true, invalid: !!error() }} />
              </div>
              <div class="output-actions">
                <select class="download-select" aria-label="Download" value="" onChange={(e) => {
                  const format = e.currentTarget.value;
                  e.currentTarget.value = "";
                  chooseDownload(format);
                }}>
                  <option value="" disabled selected>Download</option>
                  <option value="source" disabled={!draft().input}>Source</option>
                  <option value="csv" disabled={!canExport()}>CSV</option>
                  <option value="json" disabled={!canExport()}>JSON</option>
                </select>
              <div class="segmented" role="group" aria-label="Output view">
                <button
                  disabled={!canExport()}
                  onClick={() => void copy(output(), "Output")}
                >
                  Copy {draft().format.toUpperCase()}
                </button>
                <button
                  aria-pressed={view() === "table"}
                  onClick={() => chooseView("table")}
                >
                  Table
                </button>
                <button
                  aria-pressed={view() === "csv"}
                  onClick={() => chooseView("csv")}
                >
                  CSV
                </button>
                <button
                  aria-pressed={view() === "json"}
                  onClick={() => chooseView("json")}
                >
                  JSON
                </button>
              </div>
              </div>
            </div>
            <div class="output-summary">
              <span>
                <strong>{result()?.rows.length.toLocaleString() ?? "—"}</strong>{" "}
                rows <span class="separator">/</span>{" "}
                <strong>{result()?.headers.length ?? "—"}</strong> columns
              </span>
            </div>
            <Show
              when={!error()}
              fallback={
                <div class="error-state" role="alert" id="diagnostic">
                  <span class="error-symbol" aria-hidden="true">
                    !
                  </span>
                  <h3>Error</h3>
                  <p>{error()?.message}</p>
                  <button onClick={() => goToLine(error()!.line)}>
                    Go to line {error()?.line}, column {error()?.column}{" "}
                    <span aria-hidden="true">↗</span>
                  </button>
                  <small>{error()?.code}</small>
                </div>
              }
            >
              <Show
                when={result()?.headers.length}
                fallback={
                  <div class="empty-state">
                    <h3>No data</h3>
                  </div>
                }
              >
                <Show
                  when={view() === "table"}
                  fallback={
                    <textarea
                      class="csv-output"
                      aria-label={`${view().toUpperCase()} output`}
                      readonly
                      spellcheck={false}
                      wrap="off"
                      value={
                        view() === "json" ? json().text : (result()?.csv ?? "")
                      }
                    />
                  }
                >
                  <div class="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th class="row-number" scope="col">
                            <span class="sr-only">Row</span>#
                          </th>
                          <For each={result()?.headers}>
                            {(header, index) => (
                              <th scope="col">
                                {header || `Column ${index() + 1}`}
                                <Show
                                  when={result()?.columns[index()].explicit}
                                >
                                  <span class="column-type">
                                    {result()?.columns[index()].type}
                                  </span>
                                </Show>
                              </th>
                            )}
                          </For>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={preview()}>
                          {(row, rowIndex) => (
                            <tr>
                              <th class="row-number" scope="row">
                                {rowIndex() + 1}
                              </th>
                              <For each={row}>
                                {(value, columnIndex) => (
                                  <td>
                                    <button
                                      classList={{
                                        "data-cell": true,
                                        selected:
                                          selection()?.row === rowIndex() &&
                                          selection()?.column === columnIndex(),
                                      }}
                                      title="Source"
                                      aria-label={`Row ${rowIndex() + 1}, ${result()?.headers[columnIndex()] || `column ${columnIndex() + 1}`}: ${value || "empty"}`}
                                      onClick={() =>
                                        setSelection({
                                          row: rowIndex(),
                                          column: columnIndex(),
                                        })
                                      }
                                    >
                                      {value || (
                                        <span class="empty-value">empty</span>
                                      )}
                                    </button>
                                  </td>
                                )}
                              </For>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </Show>
              </Show>
            </Show>
            <Show
              when={
                selected() ||
                ((result()?.rows.length ?? 0) > PREVIEW_ROWS &&
                  view() === "table")
              }
            >
              <div class="output-footer">
                <Show
                  when={selected()}
                  fallback={
                    <span>
                      {PREVIEW_ROWS} of {result()?.rows.length.toLocaleString()}{" "}
                      rows shown
                    </span>
                  }
                >
                  {(cell) => (
                    <>
                      <span>
                        Row {cell().row + 1} · <strong>{cell().name}</strong>
                        <span class="origin-kind">{cell().origin.kind}</span>
                      </span>
                      <button
                        class="text-button"
                        onClick={() => goToLine(cell().origin.line)}
                      >
                        Source line {cell().origin.line} ↗
                      </button>
                    </>
                  )}
                </Show>
              </div>
            </Show>
          </section>
        </div>
      </main>
      <div
        class="notice"
        role="status"
        aria-live="polite"
        classList={{ visible: !!notice() }}
      >
        {notice()}
      </div>
    </div>
  );
}
