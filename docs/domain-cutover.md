# Domain cutover: toberg.tv → GitHub Pages

Status: approved, cutover in progress. This runbook is the durable record of the DNS
baseline, target configuration, sequence, verification, and rollback.

## Current progress (2026-11-09)

- GitHub Pages custom domain is set to `toberg.tv`.
- The workflow rebuild confirmed `actions/configure-pages` reports `base_path=''`; the
  artifact uses root URLs (`/assets/...`, `/pile/`). The URL guard step passes.
- `https://toberg-tv.github.io/toberg-site/` now 301s to `http://toberg.tv/` (still Adobe
  until DNS changes).
- **Waiting on:** GoDaddy DNS changes — replace the apex A record with the four GitHub IPs
  (optional AAAA records), update the `www` CNAME to `toberg-tv.github.io`, and preserve
  MX/TXT. Then verify DNS, wait for the Let's Encrypt certificate, and enable Enforce HTTPS.
- Recommended: verify `toberg.tv` in GitHub profile Pages settings via the
  `_github-pages-challenge-Toberg-tv` TXT record.
- After HTTPS: post-cutover QA; then canonical tags + `sitemap.xml` + robots sitemap line.

## Decisions

- Canonical host: **apex `toberg.tv`** (matches the old Adobe setup; `www` redirects to apex).
- DNS/registrar: **GoDaddy** (`ns29.domaincontrol.com`, `ns30.domaincontrol.com`).
- GitHub Pages custom domain: `toberg.tv`.
- Publishing source: GitHub Actions (`.github/workflows/pages.yml`), so no `CNAME` file is
  needed and any existing `CNAME` file is ignored.
- Email is Google Workspace: **do not change MX or TXT records**.

## DNS baseline (before cutover)

Recorded 2026-11-09.

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| A | `@` (toberg.tv) | `104.156.81.119` (Fastly/Adobe) | 600 |
| CNAME | `www` | `toberg.tv` | 1800 |
| MX | `@` | `1 aspmx.l.google.com` | 3600 |
| MX | `@` | `5 alt1.aspmx.l.google.com` | 3600 |
| MX | `@` | `5 alt2.aspmx.l.google.com` | 3600 |
| MX | `@` | `10 alt3.aspmx.l.google.com` | 3600 |
| MX | `@` | `10 alt4.aspmx.l.google.com` | 3600 |
| TXT | `@` | `v=spf1 include:dc-aa8e722993._spfm.toberg.tv ~all` | 3600 |
| TXT | `@` | `google-site-verification=vHD6E43Lq_ENQVCK3vL1pk_MKMdClONVZ2zd4ml3zM4` | 3600 |
| TXT | `dc-aa8e722993._spfm` | `v=spf1 include:_spf.google.com ~all` | — |

Other findings:

- No CAA record (Let's Encrypt is not restricted).
- No DNSSEC / DS record.
- No wildcard DNS and no other A/CNAME subdomains found.
- The old site is live: `www` redirects to `https://toberg.tv/`; HTML references
  `cdn.myportfolio.com` (Adobe Portfolio).

## Target DNS (after cutover)

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA (optional) | `@` | `2606:50c0:8000::153` |
| AAAA (optional) | `@` | `2606:50c0:8001::153` |
| AAAA (optional) | `@` | `2606:50c0:8002::153` |
| AAAA (optional) | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `toberg-tv.github.io` |

Keep unchanged: all MX records, both SPF TXT records, the Google verification TXT, and the
GitHub challenge TXT.

## Sequence

1. **Back up** the GoDaddy DNS zone (export/screenshot).
2. **Verify the domain on GitHub** (profile Settings → Pages → Add a domain → `toberg.tv`).
   Add the displayed TXT record `_github-pages-challenge-Toberg-tv.toberg.tv` at GoDaddy,
   wait for DNS, then click Verify. Keep the record.
3. **Set the custom domain** in the repo: Settings → Pages → Custom domain `toberg.tv`.
4. **Rebuild for root paths**: run the Pages workflow and confirm
   `actions/configure-pages` reports an empty `base_path`, so the build uses `/assets/...`
   and `/pile/` instead of `/toberg-site/...`. If it does not, temporarily set
   `PATH_PREFIX: /` in `.github/workflows/pages.yml`.
5. **Change GoDaddy DNS**: replace the apex A record; add the optional AAAA records;
   change the `www` CNAME. Do not touch MX/TXT.
6. **Wait for propagation** (minutes to 24h) and verify with the commands below.
7. **Wait for the Let's Encrypt certificate** (up to 24h), then enable **Enforce HTTPS**
   if it is not already on.
8. **QA** both hosts, redirects, assets, embeds, 404, mobile nav, and email.
9. **Update** `AGENTS.md`, `README.md`, and this runbook's status.

## Verification

```powershell
# Apex should return the four GitHub Pages IPs
Resolve-DnsName toberg.tv -Type A

# www should be a CNAME to toberg-tv.github.io
Resolve-DnsName www.toberg.tv -Type CNAME

# HTTP/HTTPS and redirects
curl.exe -sSI https://toberg.tv
curl.exe -sSI https://www.toberg.tv
```

```powershell
# DNS-over-HTTPS fallback
curl.exe -sS "https://dns.google/resolve?name=toberg.tv&type=A"
curl.exe -sS "https://dns.google/resolve?name=www.toberg.tv&type=CNAME"
```

Expected:

- `https://toberg.tv/` returns the new site over HTTPS.
- `https://www.toberg.tv/` redirects to `https://toberg.tv/`.
- `http://` redirects to `https://`.
- MX/TXT answers still match the baseline.
- The old `github.io/toberg-site/` URL redirects to the custom domain.

## Rollback

- Restore apex A `104.156.81.119`.
- Restore `www` CNAME → `toberg.tv`.
- Remove the custom domain from GitHub Pages if needed to release the domain.
- Re-check Adobe Portfolio's custom-domain setting and wait for TTL/propagation.
- Keep the Adobe Portfolio account active until the new site has been stable for a while.

## Notes / risks

- Certificate issuance can take up to 24 hours; HTTP may work before HTTPS.
- Rebuild for root paths **before** DNS changes to avoid `/toberg-site/` asset 404s.
- Do not cancel Adobe Portfolio until the new site is stable and backed up.
- Keep the GitHub challenge TXT record to prevent domain takeover.
