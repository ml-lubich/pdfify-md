---
status: doing
owner: /root/pdfify_pdf2epub
created: 2026-10-25
updated: 2026-10-25
source: user
---

# Goal

Expose the complete pdfify-md CLI contract as machine-readable agent schema and verify it against actual supported options.

# Acceptance criteria

- `agent schema` prints JSON without performing conversion work.
- Schema covers version, positional inputs, options, types, defaults, and repeatability.
- Tests prove schema stays aligned with the CLI parser.
- Docs describe the command and package/release state.
- Documented verification and package build pass; default branch receives the change and stable release.
