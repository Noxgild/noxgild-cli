# Security Policy

Noxgild is computer-control software, so security reports are handled conservatively.

## Supported versions

Security fixes are provided for the current published `@noxgild/cli` release. When a security update is published, users should upgrade to the latest version.

## In scope

This repository covers the public Noxgild bootstrap CLI, its public build and release workflow, and vulnerabilities caused by the CLI's own source or packaging.

The private Noxgild service, backend, hosted Cloud Browser infrastructure, and local runtime are not published in this repository. Reports about those systems are still welcome through the private reporting channels below.

## Report privately

**Do not open a public GitHub issue for an undisclosed vulnerability.**

Preferred reporting methods:

1. GitHub private vulnerability reporting: **Security → Report a vulnerability**.
2. If private reporting is unavailable, use the current contact listed at https://noxgild.com/.well-known/security.txt.

Include, when safely possible:

- affected CLI version,
- operating system and architecture,
- reproduction steps,
- expected and observed behavior,
- security impact,
- and a proof of concept that does not expose unrelated user data.

## Coordinated disclosure

Please give Noxgild a reasonable opportunity to investigate and remediate a vulnerability before public disclosure. We will work to acknowledge credible reports, reproduce the issue, communicate material updates, and publish a security update or advisory when appropriate.

Security updates may be communicated through GitHub Security Advisories, repository releases, npm releases, and the Noxgild website.

Full security documentation: https://noxgild.com/security
Security contact discovery: https://noxgild.com/.well-known/security.txt
