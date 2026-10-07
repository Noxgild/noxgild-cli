# Contributing

Thanks for helping improve the public Noxgild CLI.

During the initial public-mirror phase:

- bug reports are welcome,
- documentation corrections are welcome,
- feature requests are welcome,
- security reports must use private security channels,
- and large code changes should be discussed in an issue before implementation.

The private Noxgild service, backend, runtime infrastructure, and internal development repositories are not part of this public repository.

By submitting a contribution, you certify that you have the right to submit it and license it under the license that applies to this repository.

## Development

Use Node.js 22 or later.

```bash
npm ci
npm test
npm run build
npm run pack:check
```

Public tests use mocked/local authorization behavior. Do not point repository CI at production Noxgild accounts or real customer computers.
