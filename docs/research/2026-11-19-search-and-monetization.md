# ACSV discovery and monetization research

Research date: 19 November 2026. Scope: research and planning only. No application code, hosting, advertising, account or public-profile changes are authorized by this document.

Companion documents: [ACSV rollout plan](../plans/2026-11-19-discovery-and-monetization.md) and [reusable project playbook](../playbooks/ad-supported-tools.md).

User decisions received during research: all hosting will be Cloudflare; current X profile is https://x.com/househuman, possibly changing to majaku_chris; the user is considering project subdomains of their existing majaku.com domain. The plan uses acsv.majaku.com provisionally and keeps author links centrally configurable.

## Decisions supported by the research

1. AdSense has no published numerical minimum for pageviews in its eligibility requirements. A small site can apply; approval is a separate quality and policy review.
2. The immediate opportunity is a working, crawlable tool with excellent examples, documentation and a clear owner. Metadata alone will not establish demand or earn recommendations.
3. Keep the editor focused. Put substantial explanations on permanent, linked pages. An About modal cannot serve as the only home of that information.
4. Start with English, local conversion and no required account. A hosted API, private cloud storage and additional languages are separate investments with measurable demand gates.
5. Reuse infrastructure across projects. Each project still needs a distinctive job, evidence of usefulness, accurate documentation and distribution.
6. Treat AI citations, human visits, completed tasks, followers and advertising revenue as different outcomes. Measure them separately.

These are product recommendations, not promises of rankings, approval or revenue. There is no finite checklist that makes a site permanently perfect: competitors, policies and search systems change.

## Current-state audit

Read-only checks against the local checkout, public GitHub API and public HTTP endpoints on the research date:

| Area | Observed state | Implication |
| --- | --- | --- |
| Public site | https://acsv.vercel.app/ returns 200 with an empty root element and JavaScript/CSS assets; title is “ACSV Transpiler - Auto Comma-Separated Values” | Important information is not present in the initial HTML response. Google can render JavaScript, but other readers may not. |
| Public routes | /robots.txt, /sitemap.xml, /ads.txt and /about returned 404 | Add intentional discovery files and real pages. A missing robots.txt is not itself a crawl block; ads.txt is not needed before choosing an ad seller. |
| Public metadata | Root HTML has charset, viewport, favicon and title; no description, canonical, Open Graph or structured data was observed | Sharing previews and page identification need deliberate defaults. |
| Local site | Vite/SolidJS SPA; title currently “ACSV”; no public docs routes or discovery files found | The local UI cleanup and the deployed site are different versions. |
| Core | Browser/Node TypeScript implementation, CLI, CSV/JSON output, documented bounds and conformance examples | Strong basis for reproducible tutorials and a credible technical reference. |
| Existing documentation | README, language contract, portable profile, examples, LLM guide and measured size experiment | Publish maintained material on the website; avoid rewriting it into inconsistent copies. |
| Distribution | README says npm publication has not happened; package version is 0.0.0 | Do not advertise a working npm install until a release has been verified. |
| License | README links to an MIT LICENSE; no LICENSE file was found, and the public GitHub API reports license: null | Resolve the license declaration before promoting reuse. |
| Identity | GitHub profile is Christopher Shelley at github.com/made-by-chris; blog field is system-art.io; X field is empty. User subsequently supplied x.com/househuman | Use the supplied X profile; do not switch to the contemplated new handle until it actually changes. |
| Public repository | Homepage points to acsv.vercel.app; last pushed timestamp returned was 2025-11-01 | The newer local work must be released before launch claims describe it as public. |

No authenticated Search Console, Bing Webmaster Tools, AdSense, Vercel billing or traffic dashboard was inspected. We do not know current traffic, query impressions, ad eligibility, hosting plan or earnings. No keyword-volume estimates or live Lighthouse scores are claimed. The existing 120-test result is from the preceding implementation task, not a new execution during this research.

### Majaku follow-up audit

The user's domain choice enabled additional public checks:

- https://majaku.com/ redirects to https://www.majaku.com/ and serves the old site with the title “majaku - We hire bootcamp graduates to build real products.” It is still live, even though the user describes the project as defunct. Preserve useful existing routes/content or provide appropriate replacements before repurposing it.
- /sitemap.xml and /ads.txt currently return the site's HTML with status 200, not the requested XML/text resources. This is a fallback-routing problem to fix in the future portfolio setup.
- Both apex and www robots.txt responses contain a Cloudflare Managed Content block. It allows general crawling and specifically disallows Google-Extended, GPTBot and meta-externalagent, among others. OAI-SearchBot and Meta-WebIndexer are not explicitly disallowed in the observed text. Do not claim that all AI search is blocked.
- The Google-Extended exclusion conflicts with the goal of eligibility for Gemini Apps grounding under Google's documented control. Review the combined training/grounding tradeoff before changing it.
- acsv.majaku.com did not resolve in the HTTP check. This is a proposed deployment address, not an existing service.

These are observations of publicly delivered resources, not authenticated confirmation of dashboard settings. robots.txt applies per host; the apex response does not prove what a future subdomain will serve. Shared Cloudflare zone policies still need checking on every new host.

### Subdomains and AdSense

Project subdomains are a reasonable organizational choice: separate deployments and product identities with one owned parent domain. Google can display separate site names for subdomains; it does not support separate site names for subdirectories. That feature is not a promise of ranking advantage or automatic sharing of authority. [Site-name guidance](https://developers.google.com/search/docs/appearance/site-names)

For ordinary subdomains such as acsv.majaku.com, AdSense manages the registrable domain as the site: plan to submit majaku.com, not ten independent subdomain entries. Google removed separate ordinary-subdomain management in 2023. All monetized pages still need to comply; this is not an approval workaround. Make the parent portfolio and linked products coherent and complete, with the correct parent-domain ads.txt setup and per-project reporting. [Subdomain management](https://support.google.com/adsense/answer/12170421?hl=en), [site verification/review](https://support.google.com/adsense/answer/12131223)

## What AdSense actually needs

Google's [eligibility page](https://support.google.com/adsense/answer/9724?hl=en) lists original content, policy compliance, control of the site's HTML and an adult account holder; it does not state a numerical traffic minimum. This is different from a guarantee that a new or low-traffic site will be accepted. Its [site-readiness guidance](https://support.google.com/adsense/answer/7299563?hl=en) emphasizes useful original content and clear navigation. Neither document establishes a universal quota such as 30 articles or 1,000 words per page.

ACSV should apply when its public release, examples, docs, navigation and disclosures are finished. Useful technical content makes the product understandable and gives the reviewer something substantial to evaluate. An About page and contact route are sensible trust features; they are not magic approval tokens.

Google prohibits ads on screens without publisher content, with low-value content, under construction or used merely for alerts/navigation. Automatically generated content without review is another concern. For ACSV, curated tutorials are safer initial inventory than arbitrary user-generated output pages. A functioning utility is not automatically disqualified; approval of this particular editor cannot be predicted. See [inventory-value policy](https://support.google.com/publisherpolicies/answer/11112688?hl=en).

The practical account and deployment sequence is:

1. Use the correct existing publisher account, if one exists. Google generally permits one account per publisher, with additional sites under that account and a specific separate-organization exception. Do not create one personal account per project. [Account policy](https://support.google.com/adsense/answer/9729?hl=en)
2. Provide truthful account, payment and required verification information; connect the site and request review. Google says reviews usually take a few days and can take 2–4 weeks. Each new site needs the appropriate site review. [Setup](https://support.google.com/adsense/answer/7402256)
3. Publish an accurate privacy policy covering advertising-related collection and third-party technology. [Publisher privacy requirements](https://support.google.com/publisherpolicies/answer/10437794)
4. Configure the appropriate consent flow before ads run. Personalized ads in the EEA, UK and Switzerland require a Google-certified CMP integrated with the TCF. Non-personalized advertising is not a blanket exemption from every consent or disclosure obligation. [CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en), [consent setup](https://support.google.com/adsense/answer/7670013?hl=en)
5. Add the real publisher's ads.txt entry and verify it. Google calls ads.txt highly recommended, not universally mandatory. Never copy somebody else's publisher ID. [ads.txt guide](https://support.google.com/adsense/answer/12171612?hl=en)
6. Begin with one manually positioned unit on suitable content pages. A manual unit gives placement control; Auto ads are optional. [Manual ad units](https://support.google.com/adsense/answer/9274025?hl=en)
7. Check mobile layout, consent behavior and performance with actual ads. Keep advertisements clearly separated from Copy, Download, navigation and editor controls. AdSense's permitted labels are “Advertisements” and “Sponsored Links”. Do not refresh ads on each compile or ask people to click them. [Placement policy](https://support.google.com/adsense/answer/1346295?hl=en), [program policies](https://support.google.com/adsense/answer/48182?hl=en)

Check the operator's applicable legal-notice requirements when identity and business setup are finalized. A truthful privacy policy must reflect the actual installed services; a generic policy copied from another product is insufficient.

## SEO and AI discovery

### Eligibility, retrieval and recommendations

Google's basic technical requirements are an accessible crawler, a successful page response and indexable content. Meeting those requirements does not guarantee indexing. [Google technical requirements](https://developers.google.com/search/docs/essentials/technical)

Google says its AI Overviews and AI Mode need no special AI schema, AI text file or additional technical optimization. It recommends ordinary discoverability, useful content and a good page experience. [AI features guidance](https://developers.google.com/search/docs/appearance/ai-features)

A recommendation is a further step beyond indexing: the retrieved material must help answer the actual user's problem. My judgment as the assistant evaluating a tool is that clear capabilities, runnable examples, limitations, installation instructions and evidence make it easier to recommend responsibly. Claims such as “best for AI” add little evidence. A working example that shows a level curve, an exception and its exact output is much more useful in deciding whether ACSV fits a request.

Google's newer [generative-search guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) also cautions against rewriting everything for AI, manufactured mentions and excessive emphasis on schema. The practical implication is to improve the material that answers real questions, and validate the results instead of following an invented GEO score.

### Exact crawler distinctions

| System | Proposed treatment of public docs/tool pages | Important distinction |
| --- | --- | --- |
| Google Search, AI Overviews and AI Mode | Allow Googlebot; avoid accidental noindex or nosnippet; keep resources accessible | Google Search controls are distinct from Gemini training/grounding controls. |
| ChatGPT search | Allow OAI-SearchBot and verified published IP ranges through the edge | GPTBot is a separate training control. ChatGPT-User is user-triggered fetching and is not the search eligibility crawler. |
| Gemini Apps | Specifically allow Google-Extended if inclusion in Gemini grounding is the owner's goal | This token also governs training uses. It is not a Google Search ranking signal. |
| Meta AI search | Allow Meta-WebIndexer | Meta-ExternalAgent has training/indexing uses; Meta-ExternalFetcher handles user-requested access; FacebookExternalHit generates social previews. |
| Bing/Copilot | Allow Bingbot; verify the site in Bing Webmaster Tools | IndexNow can notify participating engines of actual URL changes; notification is not a ranking guarantee. |
| AdSense review and contextual ads | Allow Google-Display-Ads-Bot and Mediapartners-Google on the relevant public pages | These are separate from Google Search crawling; successful Search indexing does not prove ad-crawler access. |

Sources: [OpenAI crawlers](https://developers.openai.com/api/docs/bots), [Google crawler controls](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers), [Google's training-control announcement](https://developers.google.com/search/blog/2026/10/ai-training-control), [Meta crawlers](https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers), [Bing guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a), [IndexNow protocol](https://www.indexnow.org/documentation).

AdSense also documents its separate crawler and verification bot, including access through robots and firewalls. Add those to production verification when monetization is enabled. [AdSense crawlers](https://support.google.com/adsense/answer/99376?hl=en), [crawler troubleshooting](https://support.google.com/adsense/answer/2381908?hl=en)

Training access is an explicit publishing preference, not a prerequisite we should silently enable for every provider. None of these allowances guarantees citations. robots.txt also does not protect private snippets; access control would be required for private server data.

Cloudflare can add crawler restrictions at the edge and modify robots.txt through its bot-preference settings. Inspect the delivered response and bot controls, not just the repository file. A setting that blocks AI crawlers on pages with ads can directly conflict with the discovery objective. [Cloudflare bot policies](https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/), [managed robots.txt](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/)

### Metadata: a small, accurate set

Recommended per public page: a descriptive title, useful description, canonical URL, language declaration for accessibility, appropriate indexing policy, Open Graph preview and a checked social image. Add accurate structured data where it represents visible content. Generate these from one content record to prevent disagreements.

Google ignores meta keywords. Do not produce a pile of keyword, geographic, “AI priority” or invented authority tags. [Supported metadata](https://developers.google.com/search/docs/crawling-indexing/special-tags)

Open Graph's core properties describe the title, type, image and URL of a shared page. Use a real product screenshot or diagram; never include a user's private draft in a generated preview. X attribution and card fields should use the verified handle and be tested on the actual sharing surface. The legacy X developer card links redirected to general documentation during this research, so field-level X behavior should be rechecked during implementation. [Open Graph specification](https://ogp.me/)

Structured data is useful for expressing what the site actually contains. Candidate entities are WebSite, WebApplication/SoftwareApplication, SoftwareSourceCode and Person; connect the real author to their own profiles. A product repository belongs in a codeRepository relationship, while the author's GitHub/X profiles identify the person. Do not equate every external URL through sameAs. Google's software-app rich result has additional requirements, including a genuine review or rating; never fabricate ratings just to pass a validator. Generic schema validity is different from Google rich-result eligibility. [Structured-data introduction](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data), [software-app requirements](https://developers.google.com/search/docs/appearance/structured-data/software-app)

### HTML, docs and machine-readable versions

Pre-render public documentation and page metadata into HTML. Google can execute JavaScript, but its own guidance still recommends pre-rendering or server rendering and notes that not every bot executes JavaScript. The compiler can remain a browser application. [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)

Build a sitemap from published canonical routes, with truthful modification dates. It aids discovery and does not guarantee inclusion. Keep genuine navigation links even with a sitemap. [Sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)

Expose concise Markdown versions of maintained documentation and a small llms.txt index if cheap to generate from the same source. This is useful documentation delivery for coding agents. The current llms.txt document is a proposal, not a universal indexing requirement or demonstrated ranking switch. Do not make a duplicate, embellished AI-only account of the product. [llms.txt proposal](https://llmstxt.org/)

Use semantic controls, labels, visible states and stable layouts so both keyboard users and browser agents can operate the editor. A WebMCP experiment is optional later; it is not a launch prerequisite. [Agent-friendly website guidance](https://web.dev/articles/ai-agent-site-ux)

## Useful content and realistic positioning

Broad test-data queries already have substantial alternatives. Mockaroo offers realistic data generation across several export formats, while Faker supplies a mature programmable fake-data library. ACSV should earn its place through concise, editable, deterministic recipes and named exceptions. This is a positioning recommendation, not a finding that competitors lack repeatability. [Mockaroo](https://www.mockaroo.com/), [Faker](https://fakerjs.dev/guide/)

Priority examples:

| User job | Concrete tutorial | Evidence to include |
| --- | --- | --- |
| App fixtures | Twenty regular users plus admin, disabled and empty-value cases | Input recipe, complete downloadable CSV/JSON, types, assertions and how to edit one exception |
| Game balancing | A 100-level XP/cost table with a cap and a boss-level override | Formula, table/chart, bounds and a tested consumer |
| Import testing | Quoted commas, doubled quotes, multiline fields and leading-zero identifiers | Exact bytes, parser behavior and intentional invalid cases |
| Python/data analysis | Load generated output with Python csv or pandas | Real reader settings and an explanation that this consumes output; no claim of a Python ACSV compiler |
| CI/reproducibility | Regenerate fixtures through the JS library/CLI and catch invalid recipes | Pinned release, deterministic examples, exit behavior and full reproduction instructions |

Python's standard csv module and Godot's FileAccess are actual output-consumer options. Check the tested version and import behavior when writing tutorials, including Godot's export-resource handling. [Python csv](https://docs.python.org/3/library/csv.html), [Godot FileAccess](https://docs.godotengine.org/en/stable/classes/class_fileaccess.html)

Publish the existing size experiment with its limitations: hand-authored examples, tokenizer/version, full guide overhead, data regularity and a counterexample where CSV is shorter. It is not evidence of better LLM accuracy or universal compression. Stronger future research would compare complete tasks across plain CSV, JSON, ACSV and scripts, measuring retries, correct output and total cost. Human usability should be tested with editing tasks, not inferred from token counts.

The original GEO paper reports improvements within its experimental setup, and a newer QI-GEO preprint also evaluates specific benchmarks. Neither establishes a guaranteed technique for ranking ACSV in today's commercial assistants. Use this research as a reason to test useful coverage and answer quality, not as a forecast of a percentage traffic lift. [GEO, KDD 2024](https://arxiv.org/abs/2311.09735), [QI-GEO preprint](https://arxiv.org/abs/2609.27845)

## About, identity and distribution

Give About a normal URL, reachable through navigation/footer links. Include what ACSV does, where processing occurs, maintained implementation/version, license, author, GitHub source, issue tracker and contact method. Add the verified X link without an embedded timeline or follow-gating the tool. A short optional introduction below the editor is fine; extensive instructions belong in docs. No slogans, eyebrows or decorative comparisons are needed.

Link to the project repository for source and to the personal GitHub/X profiles for the maker. Set the repository homepage, concise description, relevant topics and social preview. Publish a versioned release and tested package before documenting an install command. Repository topics help users discover projects. The missing license must be resolved. [GitHub topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics), [repository licensing](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)

Use a genuine maker portfolio to introduce the projects. Link between tools when a visitor's next task makes the connection useful. Do not build ten near-identical sites or manufacture links and mentions merely to manipulate rankings; Google's scaled-content and link-spam policies are relevant. [Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies)

Stack Overflow requires answers to the specific question and disclosure of affiliation when mentioning your own product. It should not be treated as a product-announcement feed. Show HN is better suited to a working tool people can immediately try, and explicitly favors low signup friction. Community-specific launches should follow their own current rules. [Stack Overflow promotion rules](https://stackoverflow.com/help/promotion), [Show HN guidelines](https://news.ycombinator.com/showhn.html)

Proposed launch materials: one short real demonstration, one app-fixture walkthrough, one game-data walkthrough, a source release and a concise description of the implementation's limits. Track which destinations lead to successful use. Do not buy links, stars, reviews, votes or artificial ad traffic.

## Localization

Start with one maintained English experience. Prepare content identifiers and an architecture that can support translations later. Choose the first additional language from audience requests and search data; a country report alone does not identify language preference. German is plausible given the maker's location, but no traffic evidence currently supports selecting it over another language.

When justified, translate complete useful routes, navigation and diagnostics; use separate stable language URLs, reciprocal hreflang and self-canonicals. Give users a visible language switch. Avoid forced IP/browser-language redirects. Keep ACSV grammar, numeric rules and date semantics portable; translating documentation is not the same as adding CSV dialects or localizing the language syntax. Google recommends separate language URLs and appropriate hreflang. [Multilingual-site guidance](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)

## Hosting, API and accounts

The user has now selected Cloudflare for all hosting. Vercel's Hobby commercial-use restriction is relevant only to the old deployment during migration: its fair-use guidance explicitly includes advertisements as commercial use. We have not inspected the user's actual Vercel plan; do not enable ads on the old host without resolving that. [Vercel fair use](https://vercel.com/docs/limits/fair-use-guidelines), [Vercel terms](https://vercel.com/legal/terms)

For a repeatable low-cost portfolio, prebuilt HTML and browser-side tools fit static hosting well. Cloudflare documents free, unlimited static asset requests; Worker execution has separate limits. Avoid routing all static pages through a function unnecessarily. Hosting configuration and provider terms must be checked at deployment. [Static-asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)

A later conversion API can use the portable compiler on Workers. The free allowance currently has 100,000 requests/day and 10 ms CPU per invocation; shared account usage matters. The paid Workers base is $5/month with included usage and possible overages. The compiler's worst-case input must be benchmarked on that runtime before promising that conversion is free. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)

An API would need versioned semantics, explicit limits, predictable errors, abuse controls, output bounds, a retention policy and cost controls. CORS does not stop server-to-server abuse. Do not expose filesystem includes through a public API. An OpenAPI description can help integrations once an endpoint exists; it is not an automatic ChatGPT listing. API requests do not load a webpage advertisement, so API adoption and ad revenue need separate business cases.

Accounts introduce storage, authorization, account recovery, deletion and support obligations. Start by improving local snippet management, import/export and explicit sharing. Local storage is not encrypted private cloud storage and can be lost. Server sync should be optional and driven by repeated demand for cross-device use. Never put private snippets in public docs, analytics, search sitemaps or ad targeting.

An implementation option is Astro's static pages with the existing Solid editor retained as an interactive component. Astro supports Solid integration and pre-renders routes by default. This avoids rewriting the compiler or needing a server for documentation. It is a proposed architecture, not work performed in this task. [Astro Solid integration](https://docs.astro.build/en/guides/integrations-guide/solid-js/), [rendering model](https://docs.astro.build/en/guides/on-demand-rendering/)

## Economics and measurement

Ten projects multiply distribution and maintenance work as well as opportunity. Keep fixed costs low and improve the projects that show repeat use. A browser tool might be open for an hour while producing only one pageview; keystrokes, compiles and API requests are not additional advertising pageviews.

Illustrative scenarios only, using hypothetical realized page RPM (publisher revenue per 1,000 total pageviews). These are not AdSense rate estimates:

| Monthly views per project | Ten-project views | $1 page RPM | $3 page RPM | $8 page RPM |
| ---: | ---: | ---: | ---: | ---: |
| 1,000 | 10,000 | $10 | $30 | $80 |
| 10,000 | 100,000 | $100 | $300 | $800 |
| 50,000 | 500,000 | $500 | $1,500 | $4,000 |

Subtract hosting, domains, services and maintenance. At a hypothetical $3 page RPM, $100/month from one site requires roughly 33,334 monthly pageviews. Actual rates, fill, geography and eligibility will vary. Ad-impression CPM and page RPM have different denominators and should not be interchanged.

EthicalAds currently seeks developer sites with 50,000+ monthly pageviews. Carbon starts at 10,000 and requires its Cover format for new sites. These are later options to evaluate against observed traffic and layout constraints. A direct sponsor provides more visual control but requires finding a buyer. [EthicalAds](https://www.ethicalads.io/publishers/), [Carbon](https://www.carbonads.net/join)

AI visibility does not guarantee visits. Pew's observational study of March 2025 browsing from 900 US adults found traditional-result clicks on 8% of visits with a Google AI summary versus 15% without one. That dated, query-dependent observation is not a causal prediction for ACSV or all assistants. It does support measuring actual referrals rather than treating citations as revenue. [Pew study](https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/)

Recommended measurement:

- Google Search Console: crawl/index state, non-branded impressions, clicks, landing pages and countries. Its current Generative AI performance report adds AI-feature impressions when enough data exists; older guidance that all AI visibility is inseparable from the normal Web report is incomplete as of this research date. [AI report](https://support.google.com/webmasters/answer/16984139)
- Bing Webmaster Tools: search performance and the AI Performance report's cited pages and grounding queries. These are sampled visibility indicators, not a complete accounting of model recommendations. [Bing AI Performance](https://www.bing.com/webmasters/help/ai-performance-9f8e7d6c)
- Site analytics: landing source, example usage, successful export, docs-to-editor journeys, return use and outgoing GitHub/X clicks. Use aggregate events without source text, output, filenames or sensitive URL parameters.
- ChatGPT referrals: OpenAI documents utm_source=chatgpt.com on referral links. Preserve campaign attribution while keeping the canonical URL clean. [Publisher FAQ](https://help.openai.com/en/articles/12627856)
- Advertising: realized page RPM, ad fill/viewability, revenue by page, consent effects and before/after completion rates.
- Real-user performance: target LCP within 2.5 seconds, INP below 200 ms and CLS below 0.1, using field data where available. A Lighthouse score alone is not a business or ranking result. [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)

## Unresolved decisions

- Final confirmation of the proposed acsv.majaku.com deployment address and the scope of repurposing the existing Majaku root site.
- Cloudflare deployment access, AdSense account state and traffic baseline.
- Operator/contact details needed for accurate site disclosures.
- Preferred training permissions, especially Google's combined Gemini grounding/training control.
- Which integration and language users actually request after launch.

These do not block writing the plan. They must be resolved before the corresponding production changes, applications or claims.
