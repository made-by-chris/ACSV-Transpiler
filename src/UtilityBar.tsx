import { createSignal } from "solid-js";

export default function UtilityBar() {
  const title_from_local_storage =
    localStorage.getItem("ACSVEditor_title") ||
    "acsv-document-" + new Date().toLocaleString().replaceAll("/", "-").replaceAll(" ", "-").replaceAll(":", "-").replaceAll(",", "") + ".csv";
  // to deal with the above Property 'replaceAll' does not exist on type 'string'. Do you need to change your target library? Try changing the 'lib' compiler option to 'es2021' or later.
  // we need to change tsconfig.json to "target": "es2021" to fix this issue

  const [title, setTitle] = createSignal(title_from_local_storage);
  const [copyButtonText, setCopyButtonText] = createSignal("Copy");
  const [downloadButtonText, setDownloadButtonText] = createSignal("Download");
  const [deleteButtonText, setDeleteButtonText] = createSignal("Delete");

  const handleTitleChange = (e: Event) => {
    // to deal with e.target is possibly null, we need to cast it to HTMLInputElement lik this
    setTitle((e.target as HTMLInputElement).value);
    localStorage.setItem("ACSVEditor_title", (e.target as HTMLInputElement).value);
  };

  const handleCopyButtonClick = () => {
    const copyText = document.getElementById("acsv-editor-output") as HTMLTextAreaElement;
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    setCopyButtonText("Copied!");
    setTimeout(() => {
      setCopyButtonText("Copy");
    }, 1000);
  };

  const handleDownloadButtonClick = () => {
    const downloadText = document.getElementById("acsv-editor-output") as HTMLTextAreaElement;
    const a = document.createElement("a");
    const file = new Blob([downloadText.value], { type: "text/csv" });
    a.href = URL.createObjectURL(file);
    a.download = title();
    a.click();
    setDownloadButtonText("Downloaded!");
    setTimeout(() => {
      setDownloadButtonText("Download");
    }, 1000);
  };

  const handleTrashButtonClick = () => {
    if (!confirm("Are you sure you want to clear the editor?")) return;
    localStorage.clear();
    setDeleteButtonText("Deleted!");
    window.location.reload();
  };

  return (
    <div class="flex flex-row justify-between items-center h-12 w-full bg-gray-200">
      <input type="text" placeholder="Untitled" class="w-1/2 h-full p-4" value={title()} onInput={(e) => handleTitleChange(e)}></input>
      <div class="flex flex-row justify-between items-center h-full w-1/2">
        <button class="h-full w-1/3 bg-gray-400 hover:bg-gray-500" onClick={handleCopyButtonClick}>
          {copyButtonText()}
        </button>
        <button class="h-full w-1/3 bg-gray-400 hover:bg-gray-500" onClick={handleDownloadButtonClick}>
          {downloadButtonText()}
        </button>
        <button class="h-full w-1/3 bg-gray-400 hover:bg-gray-500" onClick={handleTrashButtonClick}>
          {deleteButtonText()}
        </button>
      </div>
    </div>
  );
}
