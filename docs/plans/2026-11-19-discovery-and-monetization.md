# ACSV Discovery and Monetization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Launch a useful, discoverable ACSV site on Cloudflare, with measurable adoption, clear maker attribution and a controlled route to advertising revenue, then reuse the process across the Majaku portfolio.

**Architecture:** Pre-render public information and documentation as static HTML, retaining the existing SolidJS editor and portable compiler. Host on Cloudflare under the proposed acsv.majaku.com subdomain, with a Majaku portfolio at the parent site and shared publishing conventions. Keep conversion local initially; introduce backend services only after measured demand.

**Tech Stack:** Existing TypeScript compiler, SolidJS editor, CLI and Vitest; proposed Astro static-site shell with official Solid integration; Cloudflare static hosting; Markdown documentation; Google Search Console and Bing Webmaster Tools; a provider-selected ad integration after readiness and approval.

---

Status: planning only. The user explicitly requested no code or implementation. No execution workflow, installation, deployment, account application or public posting has been started. The template's execution-skill reference applies to a later implementation session, subject to available tools and instructions.

Evidence and primary-source links: [research report](../research/2026-11-19-search-and-monetization.md). Reusable operating process: [project playbook](../playbooks/ad-supported-tools.md).

## Scope and decisions

Confirmed: Cloudflare hosting; current X profile https://x.com/househuman; GitHub https://github.com/made-by-chris; project repository https://github.com/made-by-chris/ACSV-Transpiler. The possible future X handle majaku_chris is not yet the production identity.

Proposed: acsv.majaku.com, with future projects on their own Majaku subdomains. Keep each product's docs on that product host. The parent portfolio introduces the maker and links to working products. Retain the current www canonical for the parent initially unless a deliberate domain-migration decision changes it; use the apex domain for the applicable AdSense site and discovery resources.

The old Majaku site is still live. Repurposing its homepage, deleting routes or changing DNS is future work that needs a concrete migration review. Do not overwrite it merely because the domain was suggested.

The editor stays the main interaction on the ACSV homepage. Add compact navigation and footer links. Substantial tutorials and product explanations get their own pages. Preserve the removal of slogans, eyebrows, AI marketing copy and decorative contrast statements.

The local compiler/editor improvements already exist and are not yet public. This plan does not reopen language design. Fix release blockers and publish a consistent version before adding unrelated features.

## What to build and what to defer

| Item | Decision | Why / trigger |
| --- | --- | --- |
| Static public docs and examples | Launch requirement | People and crawlers need dependable explanations and runnable evidence. |
| About/contact and accurate privacy page | Launch requirement | Identify the maker and describe actual data handling. |
| Canonical metadata, social previews, sitemap and crawler settings | Launch requirement | Make existing useful pages discoverable and correctly identified. |
| GitHub release and license repair | Launch requirement | Resolve misleading license/install claims and public/local divergence. |
| Tested JS package/CLI distribution | Early release priority | Lets developers and coding agents use the same compiler locally. |
| Small docs Markdown mirror and llms.txt | Low-cost addition after the source is organized | Derive it automatically; no independent AI-only copy or ranking claims. |
| JavaScript and Python output-consumer tutorials | Launch/early follow-up | Document what exists. Python compilation is not currently implemented. |
| Godot worked example | Early follow-up | A concrete game-development integration with import/export testing. |
| Local multi-snippet library | Next usability candidate | Add after repeat users find the current single saved draft insufficient. |
| Shareable examples | Start with curated example IDs | Arbitrary source sharing needs an explicit privacy/size design. |
| Free hosted conversion API | Defer | Proceed after several independent users have a concrete integration need and a Worker benchmark/cost review passes. |
| Login/private cloud snippets | Defer | Proceed after repeated cross-device or collaboration requests and a defined retention/support budget. |
| Localization | Defer full rollout | Select one language from requests and search evidence; retain portable syntax. |
| Native Python compiler | Defer | Output consumption covers many needs; a port creates a second compatibility obligation. |
| MCP/WebMCP integration | Experiment later | Only if it simplifies a validated agent workflow; no SEO prerequisite. |
| Automatic large-scale SEO pages | Exclude | Create pages for distinct useful tasks, not keyword permutations. |

Demand triggers in this plan are product-management heuristics, not search-engine requirements. Examples: five independent API requests with specific workflows, or three repeat users blocked by cross-device saving, are reasons to investigate. They do not automatically authorize a backend build.

## Proposed page map

The following paths are relative to the product's canonical host. P0 pages form the first useful release. P1 follows as the content and integrations are verified. These counts are editorial choices, not AdSense quotas.

| Route | Priority | Content and user action |
| --- | --- | --- |
| / | P0 | Editor, functional page title, small factual description, direct links to docs/examples/source. Root remains useful immediately. |
| /docs/ | P0 | Short start path and links to reference, CLI and integrations. |
| /docs/quickstart/ | P0 | One complete recipe, exact output, edit a count and an exception, open in editor. |
| /docs/reference/ | P0 | Language modes, directives, quoting, types, errors and bounds from the existing contract. |
| /guides/app-fixtures/ | P0 | A realistic user fixture with boundary cases and downloadable files. |
| /guides/game-data/ | P0 | XP/cost progression, cap/exception, exact output and a clear explanation of the formula. |
| /about/ | P0 | Purpose, author, implementation, license, source, issue/contact routes and current X link. |
| /privacy/ | P0 | Local drafts/conversion, hosting requests and any analytics/advertising actually enabled; revise before service changes. |
| /changelog/ | P0 | Dated public releases and compatibility changes. |
| /docs/javascript/ | P1 | Tested installation/import and API examples for the released package. Before publication, give truthful build-from-source instructions. |
| /docs/cli/ | P1 | File conversion, mode selection, outputs, limits and failure behavior. |
| /guides/python-csv/ | P1 | Consume exported CSV/JSON in Python; distinguish this from compiling ACSV in Python. |
| /guides/godot-data/ | P1 | Tested Godot data consumption, including packaged-game behavior. |
| /benchmarks/recipe-size/ | P1 | Reproducible current measurements and limitations, including unfavorable examples. |

The parent Majaku site should have a maintained project directory, creator information/contact, relevant privacy/legal information and links to the real project hosts. Do not publish ten “coming soon” project pages as search inventory.

Every tutorial needs a specific job, valid input, expected output, explanation, limits, tested version and an action that opens the example or downloads its files. Keep prose as long as the task requires. A generic FAQ page is not needed merely to add keywords.

## Task 1: Establish release and domain facts

**Files reviewed:** README.md, package.json, existing docs/core.md, docs/portable-profile.md, vercel.json, tests/conformance/vectors.json. **Planned records:** docs/releases/launch-checklist.md and docs/operations/domains.md.

1. Record the chosen product host, parent canonical host, current public release and maker profile URLs.
2. Inventory existing Majaku routes, redirects, backlinks available in Search Console, and historical content before proposing replacements.
3. Check authenticated Search Console ownership, manual actions/security reports and current domain indexing if access is available. Do not infer authority from domain age.
4. Record actual Cloudflare DNS, hosting projects and bot-policy state. Preserve mail/DNS records outside the website migration.
5. Resolve LICENSE against the intended rights and update matching package/README metadata. The existing MIT claim is a release blocker until it is accurate.

**Acceptance:** a domain/identity decision record, no guessed handles, a coherent license declaration and a route-preservation list. No DNS change at this stage.

## Task 2: Add a static website shell while preserving the editor

**Proposed files:** astro.config.mjs, src/layouts/SiteLayout.astro, src/pages/index.astro, src/components/SiteNav.astro, src/components/SiteFooter.astro, src/site.config.ts. **Existing files to integrate:** package.json, package-lock.json, tsconfig.json, vite.config.ts, src/App.tsx, src/ACSVEditor.tsx, src/UtilityBar.tsx, src/App.css, src/index.tsx and index.html. The eventual migration decides which old web entry files are retired.

1. Validate a minimal Astro/Solid integration against the existing component and browser-only APIs. Select compatible dependency versions when implementation begins.
2. Separate static layout/content from the mounted editor. Keep localStorage initialization safe and preserve the acsv.workbench.v1 storage behavior on the same origin.
3. Make public navigation, description and metadata available in initial HTML; JavaScript failure should still leave docs/source links and an accurate message about the editor.
4. Preserve independent library, CLI and web output directories. Web builds must not erase dist library files or CLI outputs.
5. Check desktop/mobile layout, keyboard controls, compile/export modes and draft persistence after navigation and reload.

**Acceptance:** static HTML is meaningful without executing JavaScript; editor behavior matches the current local implementation; no full compiler rewrite; no marketing hero introduced. If Astro integration would unexpectedly threaten the editor, a Vite multipage/static-docs alternative can satisfy the same acceptance criteria without a framework migration.

**Migration note:** localStorage is scoped to origin. Drafts on acsv.vercel.app cannot automatically transfer to acsv.majaku.com. Provide an export/import route or transition instructions before redirecting returning users. Do not silently discard old drafts.

## Task 3: Publish maintained docs and examples

**Proposed files:** src/content/docs/quickstart.md, src/content/docs/reference.md, src/content/guides/app-fixtures.md, src/content/guides/game-data.md, src/pages/docs/index.astro and content route templates. **Existing inputs:** docs/core.md, docs/portable-profile.md, examples.md, src/exampleACSV.ts, tests/documentation/ and tests/conformance/.

1. Select one canonical source for each document; either render existing docs directly or move them once and update links. Do not maintain two divergent language references.
2. Turn the app and game examples into complete tutorials with input/output downloads generated by the actual compiler.
3. Add “Open example” links using public example identifiers. Preserve the user's current draft or offer explicit replacement/undo behavior.
4. Include compatibility and size limits where they affect the task. Distinguish reference language behavior from planned features.
5. Run the existing documentation/conformance checks and add meaningful checks for each new executable example.

**Acceptance:** all published examples compile against the released compiler; their downloads match the tutorial; the preview limit is not confused with the export limit; error examples actually produce the stated diagnostic.

## Task 4: Add identity, metadata and sharing

**Proposed files:** src/site.config.ts, src/layouts/SiteLayout.astro, src/content/about.md, src/content/privacy.md, public/social/acsv.png, public/favicon.svg. **Existing files:** README.md and package.json metadata.

1. Centralize canonical origin, product name, maker name, GitHub repository/profile and https://x.com/househuman. Keep the planned handle change as an unpublished note.
2. Give each page a factual title and description. Suggested homepage title: “ACSV — CSV and JSON fixture generator”.
3. Generate canonical, social and structured metadata consistently. Model the maker, product and code repository with appropriate relationships. Preserve real release versions.
4. Add About/contact and accurate privacy content. Do not claim all network activity is absent if analytics or ads are installed; conversion can remain local while those services make requests.
5. Validate public sharing previews and link destinations. Use a curated example in preview artwork, never private drafts. Do not add tracking-heavy social embeds merely to show a profile link.

**Acceptance:** no fake ratings, unsupported functionality or placeholder links; author link works; GitHub source and personal profile are distinct; all metadata matches visible content. Do not block launch on software-app rich-result eligibility if genuine reviews do not exist.

## Task 5: Make discovery files and crawler access deliberate

**Proposed files:** sitemap generation configuration, public/robots.txt, generated llms.txt and documentation Markdown routes. **External configuration:** Cloudflare bot access, verification records and webmaster properties.

1. Generate a sitemap containing only canonical public pages that return the expected HTML. Use actual content modification dates.
2. Generate consistent Markdown documentation and the optional llms.txt index from the same maintained material.
3. Apply the crawler decision matrix in the research report. Explicitly examine the existing Google-Extended exclusion and the user's choice about its combined training/grounding uses.
4. Check responses on apex, www and each project host. Root robots rules do not automatically govern subdomains, while zone-level firewall rules may affect multiple hosts.
5. Verify Google Search Console with a domain property for majaku.com and add focused URL-prefix reporting where helpful; verify Bing and submit the relevant sitemaps. Use IndexNow for actual published changes where appropriate.

**Acceptance:** production responses, not just source files, allow intended crawlers; no blanket AI block undermines the chosen policy; no login/challenge prevents public docs retrieval; unknown routes return real 404s. sitemap.xml returns XML and robots.txt/ads.txt return text rather than the app fallback. Markdown variants identify their corresponding HTML page where appropriate and do not become competing indexed copies.

## Task 6: Deploy the reviewed release on Cloudflare

**Proposed files:** wrangler.jsonc or the selected Cloudflare static-deployment configuration, public/_headers, public/_redirects where supported, and .github/workflows/verify.yml. Keep the old Vercel setup available until the migration is verified.

1. Choose one Cloudflare static hosting workflow for the portfolio. Prefer static-asset delivery with no request-time function for ordinary pages.
2. Create a preview containing the complete website and verify routing, build outputs and resource loading. Keep preview hosts out of search results.
3. Check realistic mobile performance and a large supported recipe. Measure main-thread responsiveness; consider a Web Worker only if the existing compiler blocks the editor noticeably.
4. Prepare production domain and old-host redirects while accounting for old browser drafts. Use permanent redirects for equivalent public pages, not an indiscriminate redirect of every old path to the homepage.
5. Review the concrete release and migration, then deploy when authorized. Confirm all critical paths from the public host and retain a rollback target.

**Acceptance:** the public compiler and documentation describe the same release; no old broken app is the principal launch destination; Cloudflare custom domain/TLS works; the host serves genuine errors and discovery files; preview-to-production configuration is understood.

## Task 7: Complete developer distribution

**Proposed files:** LICENSE, CHANGELOG.md, package.json release metadata, docs for JS/CLI and release automation only if needed. **Existing consumers:** dummy-consumer/node-test.mjs, dummy-consumer/cli-test.mjs and dummy-consumer/public/index.html.

1. Verify library/CLI exports from a packed release artifact in a clean consumer, including browser compatibility and the explicit Node adapter.
2. Document a supported installation and invocation path; do not invent a package name, namespace ownership or published version.
3. Publish a reviewed release/package in a later authorized action and update docs to the actual version.
4. Set the repository's canonical homepage, description, topics and social preview. Keep the personal GitHub profile and current X identity consistent.
5. Add tested Python output-consumption and Godot tutorials as P1 work; avoid implying native implementations or official partnerships.

**Acceptance:** a new user can reproduce one app fixture and one game table from the public release. The source, license and version are discoverable. Package downloads are adoption metrics, not advertising pageviews.

## Task 8: Instrument outcomes with minimal data

**Proposed files:** docs/operations/measurement.md and a small analytics adapter only after the provider/data choice. **Privacy source:** the published privacy page.

1. Choose a minimal measurement setup compatible with the desired privacy and consent behavior. Record what it collects before adding it.
2. Define aggregate events: example opened, first valid custom compile, export completed, docs-to-editor transition, GitHub click and X click. Avoid sending one event per keystroke.
3. Exclude source, output, filenames, raw error text and arbitrary query parameters from telemetry. Do not count self-testing, bots or failed actions as successful use.
4. Record landing source, public example identifier, export format and coarse error code only where useful and allowed.
5. Establish a weekly scorecard with search impressions/clicks, referral-to-export conversion, return use, outgoing profile clicks, revenue and costs.

**Acceptance:** event behavior can be inspected and contains no draft data; success events represent real completed actions; direct X clicks are not falsely reported as new followers. Avoid building a cross-device identity system merely to estimate retention.

## Task 9: Prepare monetization as a measured rollout

**Proposed files:** a provider-specific ad component, public/ads.txt with the actual publisher entry, privacy/consent configuration and docs/operations/ads.md. Parent-domain advertising configuration belongs to the Majaku deployment, not an invented local repository path.

1. Inspect the existing publisher account state and confirm ownership/payment identity. Submit majaku.com as the ordinary registrable domain; do not create a separate personal AdSense account or ordinary site entry for each subdomain.
2. Finish the parent portfolio and its links to complete products before requesting review. Confirm parent-domain ads.txt is plain text and correct for the actual publisher.
3. Request review once the published site is ready. This plan does not send an application or accept provider terms.
4. After approval, introduce one reserved-space manual unit on eligible editorial pages, with consent and disclosures configured for the actual ad mode. Keep it away from interactive download/copy controls. Exclude private views, error screens and uncatalogued user output.
5. Compare performance and task completion before/after. Consider a distinct editor placement only after reviewing its policy suitability, privacy implications and layout. Keep a simple way to disable ads across the portfolio.

**Acceptance:** approval and seller identity are verified; no production placeholder IDs; consent rejection is tested; ad loading does not shift primary controls; automated tests do not click live ads. Track each project's revenue separately despite the shared domain/account.

Provider reevaluation can happen when actual traffic meets Carbon/EthicalAds criteria. Their exclusivity and placement rules must be checked for the intended portfolio/subdomain arrangement before acceptance. Do not assume aggregate views across all subdomains satisfy a network's admission criteria.

## Task 10: Launch with demonstrations and feedback

**Proposed files:** docs/releases/launch-materials.md and a maintained feedback log. No posts are sent by this planning task.

1. Run five short user sessions covering initial use, one exception, export, error recovery and returning to a saved draft. Include at least one app developer and one game developer.
2. Fix observed blockers and record whether each person completed the task without verbal coaching. Use the result diagnostically, not as a scientific readability claim.
3. Prepare a short demonstration and distinct app/game examples for X and relevant communities. The author should be available to discuss design choices and limitations.
4. Use Show HN when the tool is publicly usable. Use Stack Overflow only to answer relevant existing questions with a complete solution and explicit affiliation; no announcement disguised as a question.
5. Update the next week's priorities from actual failures, questions and repeat use.

**Acceptance:** the launch destination works without signup; examples are reproducible; source is accessible; public claims match the release; acquisition links identify campaigns without including private input.

## Verification and release gates

- Existing compiler checks: npm test and npm run test:acsv; require all expected tests to pass. Investigate changes to the previous 120-test baseline rather than assuming today's count will remain fixed.
- Build: npm run build, plus the chosen static-site build/type checks after migration. Confirm library, CLI and website artifacts coexist.
- Public output checks: every intended route is linked, responds correctly, has suitable title/canonical and exposes its important text before JavaScript executes. No sitemap entry is a redirect, private page, draft or error.
- Browser checks: initial compile, app/game examples, typed JSON, invalid input, copy/download, reload, back navigation, keyboard access, narrow-screen layout and local-draft behavior.
- Release checks: one fresh install/packed artifact consumer, one CLI conversion, exact CSV edge cases and executed tutorial samples.
- Performance checks: measure before and after ads, using realistic mobile conditions and field data as it accumulates. Target good Core Web Vitals; do not claim a guaranteed search rank from a lab score.
- Privacy checks: actual network/event payload inspection; docs match what happens; no private input in share previews or analytics.
- Search checks: URL Inspection and actual crawler responses; structured data matches visible facts; robots and Cloudflare rules agree. A spoofed browser user-agent alone does not prove verified-bot access.
- Advertising checks: real approval, correct ads.txt, consent flow, no accidental-click layout and no self-generated paid impressions.

## Eight-week rollout

This is a capacity plan, not a promise that all ten projects will earn money in eight weeks. Search discovery and ad review can extend beyond the build schedule.

| Window | ACSV and shared foundation | Portfolio output |
| --- | --- | --- |
| Week 1 | Resolve release/domain facts; static shell; core docs/examples; public-ready preview | Project 1, ACSV, becomes the reference implementation |
| Week 2 | Production migration, instrumentation, usability feedback, package/release and launch | Project 2 uses a copied minimal foundation; revise the template from friction |
| Weeks 3–4 | Improve the highest-friction workflows; request ad review if ready; finish valuable integrations | Up to projects 3–6, with dedicated distribution and feedback time |
| Weeks 5–6 | Review search queries, referral conversion and costs; test one justified growth experiment | Projects 7–8; prioritize winners for improvement |
| Weeks 7–8 | Reassess ads, localization/API/account demand and maintenance load | Projects 9–10 only if the quality gates still pass |

Reserve roughly a quarter of available time for distribution, documentation maintenance and user fixes. Reduce launch count if necessary to keep products usable. Do not spend weeks polishing an abstract shared platform before the second project exposes what is actually reusable.

## Optional experiments and stopping rules

**SEO content:** prioritize pages that answer demonstrated questions. If a page gets impressions but few clicks, review intent/title; if it gets visits but few successful uses, review the tool/tutorial. Do not diagnose a low-traffic page solely from one week's data.

**AI discovery:** maintain a small fixed set of unbranded task questions, such as “How can I generate a repeatable user fixture with an admin exception?” and “What can I use to generate and edit a game XP table?” Record assistant, date, search mode, citations and correctness. Use fresh sessions and neutral prompts; brand-seeded prompts cannot measure discovery. Treat small samples as directional, and compare actual referrals before celebrating mentions.

**API:** require concrete integration requests, a measured Worker performance/cost envelope and clear limits. If most use can be handled by the JS package, improve that first. API traffic needs its own monetization plan if it becomes material.

**Accounts:** investigate after repeated cross-device needs. Keep the basic editor free of a login gate; compare retention benefits against storage/support/security cost.

**Localization:** pilot one language after meaningful evidence of unmet demand and access to fluent review. Translate complete priority journeys, then measure qualified usage and maintenance burden.

**Advertising:** retain placements that produce worthwhile revenue without material usability/performance loss. At low traffic, a before/after difference is descriptive, not a statistically established causal result.

**Portfolio allocation:** after enough use to evaluate, put more effort into projects with repeat users, organic query growth and low support cost. A quiet project can remain a cheap useful static tool; it does not need a new backend to look more substantial.

## Remaining inputs for implementation

Final product hostname and Majaku homepage migration scope; Cloudflare and webmaster access; existing publisher-account state; accurate operator/contact details; training-permission preference; final released package identity. These can be settled at their corresponding tasks. They do not require further speculative features or prevent completion of this plan.
