import fs from "node:fs";
import { createHash } from "node:crypto";
import { marked } from "marked";
import { compile, serializeJSON } from "../dist/ZROWCompiler.js";
const cssHash = createHash("sha256").update(fs.readFileSync("public/sponsor.css")).digest("hex").slice(0,12);
const dir = "dist/web",
  host = "https://zrow.majaku.com";
const links =
  '<nav><a href="/" aria-label="ZROW editor"><img src="/zrow.svg" alt="" width="32" height="32" style="vertical-align:middle;margin-right:6px">Editor</a> · <a href="/docs/">Docs</a> · <a href="/examples/">Examples</a> · <a href="/api/">API</a> · <a href="/about/">About</a> · <a href="https://x.com/made_by_chris">X</a> · <a href="https://majaku.com" aria-label="Majaku"><img src="/majaku.svg" alt="Majaku frog" width="28" height="28" style="vertical-align:middle"></a></nav>';
const analytics = `<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"7a71b16385b84755b81d8f8c78d6d895"}'></script>`;
const footer = '<footer class="site-footer"><a href="https://github.com/made-by-chris/zrow">GitHub</a><a href="https://x.com/made_by_chris">X</a><a href="https://majaku.com">Majaku</a><a href="/privacy/">Privacy</a></footer>';
const ad = `<aside aria-label="Advertisements" class="ad-placement"><small>Advertisements</small><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-8652850812735199" data-ad-slot="8539247133" data-ad-format="auto" data-full-width-responsive="true"></ins><div class="sponsor-card"><span class="sponsor-label">Advertisement</span><a href="https://paperboy.now" target="_blank" rel="sponsored noopener noreferrer"><strong>paperboy<span>.now</span></strong><span>A printer in your pocket</span><span class="sponsor-arrow" aria-hidden="true">↗</span></a></div></aside><button id="privacy-settings" type="button" hidden>Privacy and cookie settings</button><script>window.googlefc=window.googlefc||{};window.googlefc.callbackQueue=window.googlefc.callbackQueue||[];window.googlefc.callbackQueue.push({CONSENT_API_READY:()=>{const b=document.getElementById('privacy-settings');b.hidden=false;b.onclick=()=>window.googlefc.callbackQueue.push({CONSENT_API_READY:()=>window.googlefc.showRevocationMessage()});}});</script><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8652850812735199" crossorigin="anonymous"></script><script>(window.adsbygoogle=window.adsbygoogle||[]).push({});</script>`;
function html(title, source, path) {
  const descriptions = {
    "/docs/":
      "Install and use ZROW to generate deterministic CSV and typed JSON fixtures in the browser, JavaScript or CLI.",
    "/docs/reference/":
      "ZROW language reference: named defaults, row overrides, sequences, types, CSV quoting, diagnostics and resource limits.",
    "/guides/game-data/":
      "Generate a 100-level game progression table with XP formulas and capped rewards, then export CSV or JSON.",
    "/guides/app-fixtures/":
      "Create predictable user fixtures with named admin and inactive account exceptions, explicit types and validation.",
    "/api/":
      "Convert ZROW to CSV or typed JSON using the public Cloudflare API. Request examples, limits and error responses.",
    "/about/":
      "ZROW is maintained by Christopher Shelley at majaku. Source code, licensing, implementation and contact information.",
    "/privacy/":
      "How ZROW handles local browser drafts, conversion API requests, advertising and traffic measurement.",
  };
  const description =
    descriptions[path] ??
    `${title}: documentation and reproducible examples for ZROW data recipes.`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="icon" type="image/svg+xml" href="/zrow.svg"><meta name="viewport" content="width=device-width"><title>${title} — ZROW</title><meta name="description" content="${description}"><link rel="canonical" href="${host}${path}"><meta property="og:title" content="${title} — ZROW"><meta property="og:url" content="${host}${path}"><meta property="og:type" content="website"><meta property="og:image" content="${host}/social.jpg"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:creator" content="@made_by_chris"><link rel="stylesheet" href="/sponsor.css?v=${cssHash}"><style>body{font:17px/1.65 system-ui;max-width:1000px;margin:36px auto;padding:0 24px;color:#18212c}nav{margin:24px 0}a{color:#175bc0}pre{overflow:auto;background:#f1f4f7;padding:20px}table{border-collapse:collapse;display:block;overflow:auto;max-width:100%}main{min-width:0;overflow-wrap:anywhere}td,th{border:1px solid #ddd;padding:8px}</style></head><body>${links}<main>${marked.parse(source)}</main>${path === "/privacy/" || path === "/about/" || path === "/404.html" ? "" : ad}${footer}${analytics}</body></html>`;
}
const gallery = JSON.parse(fs.readFileSync("content/gallery.json", "utf8"));
const galleryEntry = item => {
  const result = compile({ input: item.source, mode: "zrow" });
  if (result.stats.output_rows !== item.expectedRows) throw Error(`Invalid gallery example: ${item.id}`);
  const body = `${item.description}\n\n\`\`\`zrow\n${item.source}\`\`\`\n\nProduces ${result.stats.output_rows} rows. ${result.tables ? "Named tables as JSON:" : "First rows:"}\n\n\`\`\`${result.tables ? "json" : "csv"}\n${result.tables ? serializeJSON(result) : result.csv.split("\n").slice(0, 5).join("\n")}\n\`\`\`\n\n[Open in editor](/?example=${item.id}).\n\n`;
  return item.kind === 'feature' ? `<details class="example-details"><summary>${item.label}</summary>\n\n${body}</details>\n\n` : `## ${item.label}\n\n${body}`;
};
const galleryMarkdown = "# Examples\n\n## Features\n\n" + gallery.filter(item => item.kind === 'feature').map(galleryEntry).join("") + "## Use cases\n\n" + gallery.filter(item => item.kind !== 'feature').map(galleryEntry).join("");
const escapeHTML = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const integrations = JSON.parse(fs.readFileSync('content/integrations.json','utf8'));
const integrationHash = createHash('sha256').update(fs.readFileSync('public/integrations.js')).digest('hex').slice(0,12);
const integrationHTML = `<section class="integrations" id="integrations" aria-labelledby="integration-heading"><h2 id="integration-heading">Use ZROW</h2><p>Compile in your application, from the command line, or through the API.</p><div class="integration-tabs" role="tablist" aria-label="Integration">${integrations.map((item,i)=>`<button class="integration-tab" type="button" role="tab" id="tab-${item.id}" aria-controls="panel-${item.id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}"><span class="integration-icon" aria-hidden="true">${escapeHTML(item.icon)}</span>${item.label}</button>`).join('')}</div>${integrations.map((item,i)=>`<div class="integration-panel" role="tabpanel" id="panel-${item.id}" aria-labelledby="tab-${item.id}" tabindex="0" ${i===0?'':'hidden'}><div class="integration-panel-heading"><strong>${item.label}</strong><button type="button" data-copy="snippet-${item.id}" aria-label="Copy ${item.label} code">Copy code</button></div>${item.install?`<pre class="install-command"><code>${escapeHTML(item.install)}</code></pre>`:''}<pre><code id="snippet-${item.id}" class="language-${item.language}">${escapeHTML(item.code)}</code></pre></div>`).join('')}<p class="integration-status" role="status" aria-live="polite"></p><script src="/integrations.js?v=${integrationHash}" defer></script></section>`;
const pages = [];
function page(path, title, source) {
  source = source.replace(
    /\]\(([^)]+)\)/g,
    (_, url) =>
      `](${url.startsWith("/") || url.startsWith("http") || url.startsWith("#") ? url : (map[url] ?? "https://github.com/made-by-chris/zrow/blob/main/" + url.replace(/^\.\.\//, ""))})`,
  );
  fs.mkdirSync(dir + path, { recursive: true });
  fs.writeFileSync(dir + path + "index.html", html(title, source, path));
  fs.writeFileSync(dir + path + "index.md", source);
  pages.push(path);
}
const docs = [
  ["/docs/", "Documentation", "README.md"],
  ["/docs/reference/", "Reference", "docs/core.md"],
  ["/docs/portable/", "Portable profile", "docs/portable-profile.md"],
  ["/docs/authoring/", "Authoring guide", "docs/authoring.md"],
  ["/docs/programs/", "Parameters, functions and tables", "docs/programs.md"],
  ["/docs/generators/", "Enums and generators", "docs/generators.md"],
  ["/benchmarks/", "Recipe size measurements", "docs/size-experiment.md"],
  ["/examples/", "Examples", "examples.md"],
];
const map = {
  "docs/programs.md": "/docs/programs/",
  "programs.md": "/docs/programs/",
  "docs/core.md": "/docs/reference/",
  "core.md": "/docs/reference/",
  "docs/authoring.md": "/docs/authoring/",
  "docs/generators.md": "/docs/generators/",
  "generators.md": "/docs/generators/",
  "authoring.md": "/docs/authoring/",
  "docs/portable-profile.md": "/docs/portable/",
  "portable-profile.md": "/docs/portable/",
  "docs/size-experiment.md": "/benchmarks/",
  "size-experiment.md": "/benchmarks/",
  "examples.md": "/examples/",
};
for (const [path, title, file] of docs) {
  let s = (file === "examples.md" ? galleryMarkdown : fs.readFileSync(file, "utf8"))
    .replace(
      /\]\(([^)]+)\)/g,
      (_, u) =>
        `](${map[u] ?? (u.startsWith("http") || u.startsWith("/") || u.startsWith("#") ? u : "https://github.com/made-by-chris/zrow/blob/main/" + u.replace(/^\.\.\//, ""))})`,
    );
  page(path, title, s);
}
page(
  "/guides/app-fixtures/",
  "App fixtures",
  fs.readFileSync("README.md", "utf8").split("## Run locally")[0] +
    "\n[Open the editor](/) and select App fixtures. Use named overrides for administrator and inactive accounts. Export CSV for import tests or JSON for typed fixtures.",
);
page(
  "/about/",
  "About",
  `# About ZROW\n\nZROW is CSV-as-a-programming-language. Generate data with formulas, parameters and related tables, then export each table as CSV or the whole dataset as JSON. Created by [Christopher Shelley](https://x.com/made_by_chris) at [majaku](https://majaku.com).\n\nThe implementation runs in browsers and Node.js. Python can consume its generated output. The editor processes recipes locally.\n\n[Source and issues](https://github.com/made-by-chris/zrow) · [GitHub profile](https://github.com/made-by-chris). MIT license. Version 0.6.0.\n\nReport bugs through GitHub without including private data.`,
);
page(
  "/privacy/",
  "Privacy",
  `# Privacy\n\nThe editor compiles locally and saves the draft in browser storage. Drafts are not synchronized to an account.\n\nThe conversion API processes submitted recipes on Cloudflare. Application code does not store recipes or output. Cloudflare processes network metadata and operational logs. Rate limiting uses IP addresses at Cloudflare. Avoid submitting sensitive information.\n\nDocumentation and guide pages load Google AdSense to fund the project. Google and its partners may process IP addresses, cookies and other identifiers for advertising, fraud prevention and measurement. Google’s consent message lets visitors in applicable regions accept, reject or manage advertising preferences. The editor itself does not load advertising scripts. It displays a house advertisement for Paperboy; documentation uses the same advertisement when no Google ad is filled. [How Google uses data](https://policies.google.com/technologies/partner-sites). Advertising approval is pending, so ad delivery may be unavailable. Cloudflare Web Analytics measures page visits, referrers and page performance. The application does not include recipe text or output in analytics events. [Cloudflare Web Analytics privacy](https://www.cloudflare.com/web-analytics/).\n\n[Contact](https://github.com/made-by-chris/zrow/issues).`,
);
page(
  "/api/",
  "Conversion API",
  `# Conversion API\n\nPOST https://zrow.majaku.com/api/v1/convert with Content-Type: application/json.\n\n\`\`\`json\n{"input":"# ZROW 0.4\\n(cols id:int,name)\\n(id=seq(),name=Player)\\n(rows 3)","mode":"zrow","format":"json"}\n\`\`\`\n\nResponse: version, format, data, rows, columns; named datasets also include table metadata. Optional params supplies a JSON object of declared parameter overrides. CSV from named tables requires table: the exact table name. JSON without table exports all tables as an object; with table it exports that table as an array. JSON data is an array of typed objects; CSV data is a string. Defaults: mode zrow, format csv.\n\nLimits: 64 KiB body, 30 requests/minute per IP, 10,000 rows and 250,000 cells. Optional seed and referenceTime request fields fix the random and clock context; use either request fields or document declarations, not both. No file includes. CORS permits public requests without credentials.\n\nErrors: 400 invalid JSON/input, 413 body limit, 415 content type, 422 compiler diagnostic, 429 rate limit. No uptime guarantee. [Reference](/docs/reference/) · [OpenAPI](/openapi.json).`,
);
page(
  "/guides/python/",
  "Python integration",
  `# Read generated CSV in Python\n\nExport CSV, then read it with the standard library. This consumes output; ZROW compilation runs in JavaScript.\n\n\`\`\`python\nimport csv\nwith open("users.csv", newline="", encoding="utf-8") as source:\n    users = list(csv.DictReader(source))\nprint(users[0])\n\`\`\`\n\nCSV fields are strings. Convert them explicitly, or export typed JSON and use json.load. [Python csv](https://docs.python.org/3/library/csv.html).`,
);
page(
  "/guides/game-data/",
  "Game data",
  `# Generate game progression data\n\n\`\`\`zrow\n# ZROW 0.4\n(cols level:int,xp:int,reward:int)\n(level=seq(),xp=level*level*100,reward=min(level*10,500))\n(rows 100)\n\`\`\`\n\nLevel 1 requires 100 XP and grants 10 reward units. Level 10 requires 10,000 XP and grants 100. Rewards cap at level 50. XP is per-level, not cumulative.\n\n[Open the editor](/), paste the recipe and download CSV or JSON. Commit the recipe with your game and regenerate it when balancing changes. [Reference](/docs/reference/).`,
);
fs.writeFileSync(
  dir + "/robots.txt",
  `User-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nUser-agent: Meta-WebIndexer\nAllow: /\n\nUser-agent: GPTBot\nDisallow: /\n\nUser-agent: Meta-ExternalAgent\nDisallow: /\n\nSitemap: ${host}/sitemap.xml\n`,
);
fs.writeFileSync(
  dir + "/sitemap.xml",
  `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${["/", ...pages].map((p) => `<url><loc>${host}${p}</loc></url>`).join("")}</urlset>`,
);
fs.writeFileSync(
  dir + "/llms.txt",
  "# ZROW\n\nReadable recipes for CSV and typed JSON.\n\n" +
    docs.map(([p, t]) => `- [${t}](${host}${p}index.md)`).join("\n"),
);
fs.writeFileSync(
  dir + "/404.html",
  html("Page not found", "# Page not found\n\n[Open editor](/)", "/404.html"),
);
fs.writeFileSync(
  dir + "/_headers",
  "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n/*/index.md\n  X-Robots-Tag: noindex\n",
);
let s = fs
  .readFileSync(dir + "/index.html", "utf8")
  .replace(
    "<title>ZROW</title>",
    `<title>ZROW — The CSV programming language</title><meta name="description" content="The CSV programming language. Generate data with parameters, functions and related tables. Export CSV and typed JSON."><link rel="canonical" href="${host}/"><meta property="og:title" content="ZROW — The CSV programming language"><meta property="og:type" content="website"><meta property="og:url" content="${host}/"><meta property="og:image" content="${host}/social.jpg"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:creator" content="@made_by_chris"><script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "ZROW", url: host + "/" })}</script>`,
  );
s = s.replace('/sponsor.css"', `/sponsor.css?v=${cssHash}"`);
s = s.replace(
  "</body>",
  `${integrationHTML}${fs.readFileSync("content/language-overview.html", "utf8")}${footer}${analytics}<noscript><p>ZROW generates CSV and JSON from recipes. Enable JavaScript for the editor, or read the documentation.</p></noscript></body>`,
);
fs.writeFileSync(dir + "/index.html", s);
