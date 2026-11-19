export default function UtilityBar() {
  return (
    <header class="app-header">
      <div class="brand">
        <a class="brand-mark" href="/" aria-label="ZROW home"><img src="/zrow.svg" alt="" width="29" height="35" />ZROW</a>
      </div>
      <div class="creator">made by <a href="https://x.com/househuman" target="_blank" rel="noopener noreferrer">Christopher Shelley</a><a class="majaku-link" href="https://majaku.com" aria-label="Majaku"><img src="/majaku.svg" alt="" width="28" height="28" /></a></div>
      <nav class="export-actions" aria-label="Main navigation">
        <a href="/docs/">Docs</a>
        <a href="/examples/">Examples</a>
        <a href="/about/">About</a>
        <a class="account-link" href="https://majaku.com/account/" aria-label="Account" title="Account"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></svg></a>
        <a class="github-link" href="https://github.com/made-by-chris/zrow" aria-label="ZROW on GitHub"><img src="/github.svg" alt="" width="18" height="18" />GitHub</a>
      </nav>
    </header>
  );
}
