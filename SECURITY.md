# Security

## Threat model (summary)

- **Abuse of AI endpoints**: Chat is rate-limited best by infrastructure (Cloud Run max instances, IAM). Application layer uses JSON body limits (`1mb`) and structured tools instead of unconstrained browsing.
- **Credential theft**: JWTs and API keys must never appear in client bundles except Maps key delivered intentionally for Maps JS (restrict by HTTP referrer in Google Cloud Console).
- **PII in logs**: Do not log raw chat content, passwords, or tokens. Analytics endpoint logs only anonymised event names when enabled.
- **Cross-site risks**: `Content-Security-Policy`, `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff` are set on all responses from the Express app.

## API key hygiene

1. Create keys in Google Cloud Console with **API restrictions** (Gemini, Maps, Translation, Natural Language only as needed).
2. For Maps JavaScript, restrict by **HTTP referrer** to your Cloud Run domain and localhost for development.
3. Prefer **Secret Manager** + Cloud Run secret references over plaintext env in triggers.
4. Rotate `JWT_SECRET` if leaked; never ship the default dev secret to production.

## Dependency scanning

Run `npm audit` regularly in CI; upgrade transitive risks when practical.

## Reporting

Open a private security advisory with the repository maintainer for undisclosed vulnerabilities.
