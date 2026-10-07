# CLI Privacy

This document explains the public `@noxgild/cli` flow in plain language. The canonical legal privacy policy is https://noxgild.com/privacy.

- Installing the npm package does not create a Noxgild account and does not connect a computer.
- Running `noxgild connect` sends the operating system, CPU architecture, and computer name needed to create a short-lived authorization request.
- Account authentication and explicit computer approval happen through Noxgild account infrastructure.
- The CLI polls the short-lived connection request until it is approved, rejected, or expires.
- After approval, Noxgild returns short-lived installer/runtime information for the approved platform.
- The small npm package is separate from the installed Noxgild runtime.
- Command metadata and intentionally returned artifacts may pass through Noxgild infrastructure as required to operate the service.
- Account, device, and privacy controls are described in the product and canonical privacy policy.

Do not rely on this file as a substitute for the canonical policy. See https://noxgild.com/privacy.
