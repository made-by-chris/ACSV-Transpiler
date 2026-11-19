# Launch status — 19 November 2026

## Deployed

- Editor, static docs, examples and API: https://acsv.majaku.com
- Company homepage: https://www.majaku.com
- Central account UI: https://www.majaku.com/account/
- Conversion API: POST /api/v1/convert; public OpenAPI at /openapi.json.
- API rate limit: 30/minute per IP through Cloudflare; 64 KiB streamed-body bound; bounded compiler; 100 ms CPU cap. Cloudflare rate limits are applied at the edge and are not an exact global per-user quota.
- Operational conversion events record format and row/column counts, never recipe text or output.
- Cloudflare Web Analytics site is configured for acsv.majaku.com; its beacon measures traffic/performance. It does not receive recipe text from application events.
- Google Search Console ownership verified; sitemap processed successfully with 13 URLs at submission. IndexNow submission accepted with HTTP 202.
- Cloudflare AI Search and Agent policies allow access. Managed robots synchronization is off; served host-specific files control preferences. Normal WAF/DDoS protections remain enabled.

## Advertising

Existing AdSense account reactivated. majaku.com ownership verified through metadata. Review requested; Google reports Getting ready. Approval and actual fill are pending Google.

One manual responsive unit, ACSV documentation (8539247133), is integrated on editorial documentation/guide pages. Auto ads remain off for majaku.com. The editor does not load AdSense.

The published European consent message includes Consent, Do not consent and Manage options. Consent-message optimization is disabled. Verify real message delivery and ad behavior after Google activates the site; the provider says propagation may take up to an hour. Advertising preference revocation is exposed when Google's API is ready.

The actual publisher's ads.txt is served at majaku.com/ads.txt. Privacy text describes the installed services. Additional jurisdiction/account configuration should be revisited when Google activates the inventory and actual audience data exists.

## Accounts

The central service reuses AuraLink's cryptographic primitives with a separate Majaku D1 database. Host-only Secure/HttpOnly cookies, explicit credentialed CORS origins, password hashing, rate limits, bounded bodies and session expiry are implemented.

Production smoke checks passed for registration, trusted ACSV-origin identity lookup, incorrect-password rejection, login/logout, recovery-code rotation and rejection of the previous code, session revocation and deletion of the disposable test account. Recovery codes are shown once; email addresses remain unverified.

The service is a central browser account foundation. It does not create delegated app-backend sessions or save ACSV drafts in the cloud. Future app backends must verify identity through an appropriate server flow, rather than trusting client-supplied user IDs. Adding another trusted origin requires an explicit allowlist change.

## Distribution and remaining external steps

GitHub contains the license, CI workflow, changelog, contribution guidance, source and tests. Repository description/homepage/topics point to the released product. Package contents and a clean consumer installation were tested; the CLI also runs from the packed artifact.

The npm CLI is not authenticated (whoami returned 401), so no npm-registry publication is claimed. A versioned package can be downloaded from GitHub Releases.

Google approval, search indexing and traffic growth are external outcomes. This document records setup and evidence, not a guarantee of inclusion or revenue. Localization, native Python compilation and cloud draft storage have not been implemented.
