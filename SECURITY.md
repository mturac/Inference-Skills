# Security Policy

Report vulnerabilities privately through GitHub's security advisory flow.

## Trust boundaries

- `*_BIN` environment variables select an executable and must point to trusted local binaries.
- Adapters invoke binaries with `shell: false` and pass arguments as an array.
- The repository performs no network calls and installs no backing product automatically.
- Product reports may contain repository paths and operational metadata; review them before external sharing.
