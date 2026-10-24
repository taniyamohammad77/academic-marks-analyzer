# Security review

Reviewed: 2026-10-24

## Checks performed

- `npm audit --audit-level=moderate`: zero known vulnerabilities reported.
- `npm ls --all`: required dependencies are installed; the listed unmet dependencies are optional.
- Source scan for unsafe HTML injection, dynamic code execution, remote requests, and embedded credentials: no matches in application source.
- `npm run build`: production build succeeds.

## Findings and scope

The app is a browser-only React application. It has no backend, authentication, or remote data requests. Exam records are stored in browser LocalStorage. React renders user-provided strings as text, and no direct HTML injection APIs were found in the app source.

These checks cover dependencies and a source review. They do not constitute a penetration test or a review of hosting configuration, HTTP security headers, or browser behavior with adversarial LocalStorage contents.
