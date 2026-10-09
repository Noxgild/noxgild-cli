<p align="center">
  <a href="https://noxgild.com">
    <img src="https://noxgild.com/brand/noxgild-logo-horizontal.png" alt="Noxgild" width="240" />
  </a>
</p>

<h1 align="center">Give the AI you already use a real computer.</h1>

<p align="center">
  Connect ChatGPT, Claude, Cursor, Codex, Kiro, and other MCP-compatible AI tools to an authorized Windows, macOS, or Linux computer through Noxgild.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@noxgild/cli"><img alt="npm version" src="https://img.shields.io/npm/v/@noxgild/cli.svg" /></a>

  <img alt="Windows, macOS, Linux" src="https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-informational" />
  <a href="LICENSE"><img alt="Apache-2.0 license" src="https://img.shields.io/badge/license-Apache--2.0-blue" /></a>
</p>

<p align="center">
  <a href="https://noxgild.com">Website</a> ·
  <a href="https://noxgild.com/docs">Docs</a> ·
  <a href="https://noxgild.com/security">Security</a> ·
  <a href="https://noxgild.com/integrations">Integrations</a>
</p>

Noxgild provides controlled **Machine**, **Browser**, and **Desktop** execution on computers you authorize, plus a separate hosted **Cloud Browser** when local browser execution is not the right environment.

```bash
npx @noxgild/cli@latest connect
```

A browser window opens so you can sign in to Noxgild and explicitly approve that computer. No computer is connected merely because the npm package was installed.

> Installing `@noxgild/cli` does not connect a computer or install the local runtime by itself. Connection begins only when you deliberately run `noxgild connect` (or the `npx` command above).

## What Noxgild is

Noxgild is the controlled execution layer between an AI client and a computer you authorize. The AI can stay in the client you already use while Noxgild supplies the computer surfaces needed to finish real work.

- **Machine** — files, shell commands, processes, system state, and persistent work.
- **Browser** — use the browser environment on an authorized computer.
- **Desktop** — operate supported native graphical applications on Windows, macOS, and Linux.
- **Cloud Browser** — use a separate Noxgild-hosted browser when the task should not depend on your workstation browser.

Cloud Browser is a separate hosted product surface. The CLI does **not** install Cloud Browser on your computer.

## Quick start

### Requirements

- Windows, macOS, or Linux
- x64 or arm64
- Node.js 22 or later
- Internet access to Noxgild
- A Noxgild account

### Connect a computer

```bash
npx @noxgild/cli@latest connect
```

The CLI detects your operating system, CPU architecture, and computer name, then opens the Noxgild account page for approval.

### Verify the connection

After the connection completes:

```bash
noxgild doctor
```

Then open [app.noxgild.com](https://app.noxgild.com) to confirm the computer is listed and online.

## What happens when `connect` runs

1. The CLI detects the operating system and CPU architecture.
2. It creates a short-lived connection session with Noxgild.
3. It opens [app.noxgild.com](https://app.noxgild.com) for account authentication and explicit computer approval.
4. After approval, Noxgild returns a short-lived installation grant for the matching platform runtime.
5. The installer downloads the runtime and verifies its SHA-256 checksum before installation.
6. The runtime creates its device identity locally, registers the authorized computer, and connects it to your account.
7. The computer appears in the Noxgild account area and can be used by compatible authorized AI clients.

The command you copy does not contain cloud credentials, a long-lived pairing secret, or a device private key.

## Your Computer vs. Cloud Browser

### Your Computer

Use your authorized Windows, macOS, or Linux computer when work depends on the environment that already exists there: local files, terminal tools, installed applications, or a signed-in local browser.

### Cloud Browser

Use Cloud Browser when browser work should run in a separate hosted environment instead of your local browser. Cloud Browser has its own session lifecycle, viewer, human-control handoff, and usage accounting.

Learn more: [Cloud Browser](https://noxgild.com/product/cloud-browser)

## Supported AI clients

Noxgild is designed to work with compatible assistants, IDEs, and agents, including:

- [ChatGPT](https://noxgild.com/integrations/chatgpt)
- [Claude](https://noxgild.com/integrations/claude)
- [Claude Code](https://noxgild.com/integrations/claude-code)
- [Cursor](https://noxgild.com/integrations/cursor)
- [Codex](https://noxgild.com/integrations/codex)
- [VS Code + GitHub Copilot](https://noxgild.com/integrations/vscode-github-copilot)
- [Kiro](https://noxgild.com/integrations/kiro)
- [Gemini CLI](https://noxgild.com/integrations/gemini-cli)
- [JetBrains](https://noxgild.com/integrations/jetbrains)
- [Cline](https://noxgild.com/integrations/cline)
- [Zed](https://noxgild.com/integrations/zed)
- [Devin / Windsurf](https://noxgild.com/integrations/devin-windsurf)
- [Amazon Q Developer](https://noxgild.com/integrations/amazon-q)

See the current integration directory at [noxgild.com/integrations](https://noxgild.com/integrations).

## Security model

Noxgild is privileged computer-control software. Its security model is based on explicit authorization and bounded execution rather than pretending arbitrary local execution is sandboxed.

Key controls include:

- explicit device authorization,
- locally created device identity,
- curated capability schemas,
- risk classification and policy checks,
- exact-command approval for consequential actions,
- human gates for CAPTCHA, OTP/2FA, passkeys, secure-desktop prompts, and equivalent protected challenges,
- durable command state,
- and an explicit `UNKNOWN` state when a side effect may have occurred but cannot safely be proven.

Browser and remote content is treated as untrusted. Noxgild does not treat page content as authority to silently escalate into Machine or Desktop actions.

Read the full model: [Noxgild Security](https://noxgild.com/security)

## Data and privacy

The small npm package is only the bootstrap CLI. Installing it does not create an account or connect a computer.

When you run `connect`, the CLI sends the platform, architecture, and computer name needed to create a short-lived authorization session. Authentication and approval happen through Noxgild account infrastructure. After approval, the CLI receives short-lived installation information for the appropriate runtime.

Command metadata and intentionally returned artifacts may pass through Noxgild infrastructure as required to provide the service.

Read the canonical policy: [Noxgild Privacy Policy](https://noxgild.com/privacy)

## CLI reference

### Connect

```bash
noxgild connect
```

`remote` is retained as an alias for `connect`.

### Doctor

```bash
noxgild doctor
```

Checks the installed runtime and reports actionable connection/runtime health.

### Version

```bash
noxgild --version
```

### Help

```bash
noxgild --help
```

## Troubleshooting

If the browser does not open automatically, the CLI prints the approval URL so you can open it manually.

If a connection request expires, run the same connect command again to create a new short-lived request.

For runtime or connectivity problems:

- [CLI troubleshooting](https://noxgild.com/docs/troubleshooting/cli)
- [Computer offline](https://noxgild.com/docs/troubleshooting/computer-offline)
- [Documentation](https://noxgild.com/docs)
- [Support](https://noxgild.com/support)

## Responsible disclosure

Please do not disclose an unpatched vulnerability in a public issue. Use the security reporting instructions at [noxgild.com/security](https://noxgild.com/security) or the repository's private vulnerability reporting flow once enabled.

## License

The public `@noxgild/cli` bootstrap source is licensed under the [Apache License 2.0](LICENSE).

That license applies to this public bootstrap CLI only. The Noxgild hosted service, backend, local runtime infrastructure, Cloud Browser infrastructure, and other proprietary Noxgild systems are separate from this package and are not made open source by the CLI license.
