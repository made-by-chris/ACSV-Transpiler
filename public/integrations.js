const root = document.querySelector("#integrations");
if (root) {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  function activate(tab, focus = false) {
    root.querySelector('[role="status"]').textContent = "";
    for (const item of tabs) {
      const selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute("aria-controls")).hidden =
        !selected;
    }
    if (focus) tab.focus();
  }
  for (const tab of tabs) {
    tab.addEventListener("click", () => activate(tab));
    tab.addEventListener("keydown", (event) => {
      const index = tabs.indexOf(tab);
      const next =
        event.key === "ArrowRight"
          ? (index + 1) % tabs.length
          : event.key === "ArrowLeft"
            ? (index + tabs.length - 1) % tabs.length
            : event.key === "Home"
              ? 0
              : event.key === "End"
                ? tabs.length - 1
                : -1;
      if (next < 0) return;
      event.preventDefault();
      activate(tabs[next], true);
    });
  }
  for (const button of root.querySelectorAll("[data-copy]")) {
    button.addEventListener("click", async () => {
      const status = root.querySelector('[role="status"]');
      try {
        await navigator.clipboard.writeText(
          document.getElementById(button.dataset.copy).textContent,
        );
        status.textContent = "Code copied.";
      } catch {
        status.textContent = "Select and copy the code.";
      }
    });
  }
}
