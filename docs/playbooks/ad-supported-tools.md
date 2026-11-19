# Majaku playbook for useful ad-supported tools

Version 1 — 19 November 2026. Reference project: ACSV. This is an operating recipe to test and improve, not a guarantee of revenue or AI recommendations.

Read the [research and sources](../research/2026-11-19-search-and-monetization.md) and [ACSV rollout plan](../plans/2026-11-19-discovery-and-monetization.md) for the evidence and first implementation. Policy, crawler and price details must be rechecked before later launches.

## The portfolio model

Use Cloudflare hosting throughout. Provisionally, each product has a stable subdomain of majaku.com and its own documentation, deployment and product identity. The parent Majaku site introduces the maker and acts as a useful directory of shipped projects.

Current maker links are [X: househuman](https://x.com/househuman) and [GitHub: made-by-chris](https://github.com/made-by-chris). The possible future handle majaku_chris must not be used until the account changes. Keep identities in one maintained configuration source so a rename does not require hunting across ten repositories. A stable author page on the owned domain can remain the common identity reference.

Share the publishing foundation, visual primitives and maintenance process. Give each project its own useful content. Avoid a large common backend, universal account system or dependency tangle before real users require one.

## 1. Select a job worth building for

Before expanding an idea, write down:

- Who uses it and the concrete task they want to finish.
- What they use today, including scripts, spreadsheets and existing free tools.
- The specific improvement: fewer steps, clearer editing, better validation, local processing or a reusable artifact.
- How often the task recurs and where those users already discuss it.
- What credible example can demonstrate the improvement.
- Whether use occurs in a browser where ads can actually appear, or mainly through packages/APIs.
- Expected fixed costs and a realistic maintenance ceiling.

Inspect current alternatives directly. Treat search phrases as demand hypotheses until supported by actual search data or user research. Do not invent keyword volume, conversion rates or a claim that the market is empty.

For a portfolio dependent on advertising, favor useful repeat browser visits and low operating cost. A project primarily consumed through an API may be a good product with a different revenue model.

## 2. Use a small shared foundation

The reusable foundation should provide:

| Shared element | Per-project information |
| --- | --- |
| Static public-page layout | Product name, canonical host, title/description |
| Minimal navigation/footer | Tool, docs/examples, About, privacy, source, maker |
| Metadata/social preview generation | Real screenshot, capabilities and current release |
| Sitemap/robots generation | Published routes and deliberate crawler preferences |
| Content templates | Original working examples and tested integration guides |
| CI and release checks | Product correctness tests and representative browser tasks |
| Privacy-aware measurement adapter | Definition of a meaningful completed task |
| Optional ad component and disable switch | Approved provider/placement, real publisher configuration |
| Deployment conventions | Host, redirects, preview policy and rollback target |
| Cost/maintenance record | Usage, revenue, spend, support time and review dates |

Keep core interactions usable without an account. Keep ads and analytics out of the critical computation path. Choose static output when the product does not require a server. Validate the delivered HTTP resources instead of assuming successful builds imply correct routing.

## 3. Give each product a complete public explanation

Minimum useful content is a task-based standard, not a page or word quota:

1. A working tool with a clear functional name.
2. A quickstart that a new user can finish.
3. One or two realistic worked examples with reproducible outputs.
4. Reference material covering the supported interface, limits and failures.
5. An About/contact route identifying the real maker and source/license where applicable.
6. Accurate privacy information for the actual data flow.
7. A dated release record and supported installation instructions, if applicable.

Give these real URLs and ordinary links. Keep long tutorials out of toolbars and modals. Optional expandable help can assist an immediate task, but must not be the only place essential public documentation exists.

Make each example an artifact someone can reuse: recipe, file, configuration, test fixture, game table, diagram or short integration. A finished useful artifact creates a reason to visit and share the product beyond reading a definition.

## 4. Make discovery and attribution reliable

Before launch, check:

- Important public text and links exist in initial HTML.
- Each page has an accurate title, canonical and social preview.
- Structured data describes visible facts; no invented reviews or awards.
- All canonical pages are linked and included in a valid sitemap where appropriate.
- Private drafts, previews and arbitrary generated pages are excluded from indexing appropriately; actual privacy depends on access control, not robots.txt.
- Search/AI crawler decisions are reflected in Cloudflare settings and served robots.txt for that host.
- Google Search Console and Bing Webmaster Tools are verified and report the intended hosts.
- User-facing GitHub and X links work without loading third-party social widgets.
- A shared author identity does not overwrite each product's identity.
- Optional Markdown docs and llms.txt are generated from the same source as the website.

For Majaku specifically, repair the existing XML/text fallback behavior and decide the Google-Extended policy. AdSense ordinary-subdomain management belongs at the parent domain, while search and traffic reporting should still be inspectable per product. Shared ownership does not guarantee shared rankings or isolate projects from account-wide ad-policy problems.

## 5. Validate before a public launch

Use a fresh visitor's conditions: mobile, no saved state, keyboard navigation, slow network and an unfamiliar task. Ask a few real prospective users to complete a task without coaching. Record where they hesitate, fail or misunderstand output.

For each project, retain evidence that:

- The main job succeeds, and invalid inputs fail clearly.
- Examples and downloads agree with the shipped version.
- Data handling matches the privacy explanation.
- Public links, license and installation instructions are correct.
- Returning users do not lose their work during an update or hostname migration.
- The public deployment matches the approved build and can be rolled back.

A perfect Lighthouse number cannot replace those checks. Use performance and accessibility audits to find problems, then inspect the real task flow.

## 6. Launch with a reason to care

Prepare a concise demonstration, source/release link and a useful example for the audience. On X, show the task and result and link to the tool. Give the creator a consistent profile/homepage connection. A click to X is measurable; a subsequent follow generally is not attributable without further evidence.

Use communities where the task is relevant. Show HN can fit an immediately usable substantial project. Stack Overflow requires a question-specific solution and affiliation disclosure when mentioning your product. Do not send bulk promotional answers, buy votes, request ad clicks or manufacture endorsements. Relevant organic references are the goal.

Reserve time to reply to questions and fix first-use problems. Publishing ten URLs without distribution and maintenance is not ten completed launches.

## 7. Introduce ads when the product is ready

Use the actual existing publisher account and truthful business details. Check the current rules for the domain/subdomain arrangement. Complete the published site before requesting review. Add accurate privacy/consent handling and real seller information; never ship a placeholder publisher ID.

Start with a restrained placement on suitable public content pages. Reserve its dimensions and keep it visually separate from primary task controls. Measure its effect on loading, layout stability and completion. Do not add a compulsory wait, artificial pagination, fake download buttons or refresh-on-keystroke behavior to manufacture inventory.

For an interactive data editor, review privacy before introducing third-party scripts into the editing environment. Keep telemetry and ad targeting free of source text and output. A network's contextual or no-tracking positioning does not remove the need to verify its actual integration.

Track realized revenue per total pageview and per product. Do not count API calls, conversions, ad impressions and pageviews interchangeably. Reevaluate alternative networks or a direct sponsor when audience size and fit justify it.

## 8. Review the same scorecard every week

| Area | Record | What it helps decide |
| --- | --- | --- |
| Acquisition | Search/referral visits by product and useful landing page | Where distribution and documentation work is paying off |
| Search | Indexed pages, relevant non-branded impressions/clicks | Whether discovery is expanding and matching intent |
| AI visibility | Available Google/Bing reports and a small neutral prompt sample | Which tasks/pages are being surfaced; not a revenue total |
| Activation | Qualified visits that finish the main job | Whether traffic is finding value |
| Repeat use | Aggregate returning use where measurable without intrusive identity tracking | Whether the tool solves a recurring problem |
| Product quality | Error categories, failed tasks and direct feedback | What to improve before adding features |
| Maker growth | Outgoing X/GitHub clicks and observed profile growth, separately | Whether the portfolio helps people find its author |
| Economics | Revenue, realized page RPM, costs and maintenance hours | Whether a product is worth further investment |

Review at 7, 30 and 60 days, allowing for sparse data and search delays. Do not claim a causal gain from small before/after changes. Keep search-mode, language and date consistent in AI sampling and use unbranded prompts for discovery tests.

## 9. Require evidence for additional infrastructure

| Request | First response | Build more when |
| --- | --- | --- |
| “Can I call it programmatically?” | Document a local package or CLI if available | Repeated workflows require a hosted endpoint and its cost/limits are understood |
| “Can I save this?” | Local saved items and import/export | Cross-device access or collaboration is a recurring unmet need |
| “Can I share this?” | Curated examples or explicit share/export | A safe public/private sharing model is specified and demanded |
| “Can I use it in another language?” | Assess requests, queries and translation capacity | A complete localized journey can be maintained and measured |
| “Can agents use it?” | Accurate docs, accessible controls, deterministic interfaces | An API or agent protocol demonstrably removes an integration obstacle |

Keep any new backend versioned, bounded and observable. Choose a spending limit and failure behavior before opening a free API. Do not assume a provider's daily request allowance means every workload fits its CPU limits.

## 10. Decide what earns the next week of work

Improve projects with repeat use, clear user requests, relevant organic discovery and sustainable cost. Keep useful quiet projects inexpensive. Reconsider positioning when visitors arrive but consistently fail to find a reason to use the tool. Pause speculative expansion when it consumes time without evidence.

For each experiment, record the hypothesis, starting measurement, change, review date and decision. Example: “The game tutorial will lead more game developers to successfully export a progression table.” Measure that journey; do not substitute a larger page count or an AI-generated visibility score.

The first two launches should refine this playbook. Freeze shared conventions only after they have survived use in more than one real product. Then ship the remaining projects with the same standards, reserving capacity to improve the ones that attract an audience.
