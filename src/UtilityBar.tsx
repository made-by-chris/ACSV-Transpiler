export default function UtilityBar() {
  return (
    <header class="app-header">
      <div class="brand">
        <a class="brand-mark" href="/" aria-label="ZROW home"><img src="/zrow.svg" alt="" width="29" height="35" />ZROW</a>
      </div>
      <div class="creator">made by <a href="https://x.com/househuman" target="_blank" rel="noopener noreferrer">Christopher Shelley</a></div>
      <nav class="export-actions" aria-label="Main navigation">
        <a href="/docs/">Docs</a>
        <a href="/examples/">Examples</a>
        <a href="/about/">About</a>
        <a href="https://majaku.com/account/">Account</a>
        <a class="github-link" href="https://github.com/made-by-chris/ACSV-Transpiler" aria-label="ZROW on GitHub"><img src="/github.svg" alt="" width="18" height="18" />GitHub</a>
        <a class="majaku-link" href="https://majaku.com" aria-label="Majaku"><img src="/majaku.svg" alt="Majaku frog" width="32" height="32" /></a>
      </nav>
    </header>
  );
}
