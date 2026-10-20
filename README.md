# Crumble specifications

This repository holds hand-written protocols, architecture decisions, and product rules shared across Crumble clients and servers.

## Find a specification

- [Product brief](product/brief.md) and [parity research](product/parity.md): the goal and reference capabilities.
- [Glossary](GLOSSARY.md): the canonical domain language for every repository.
- [Features](features/README.md): user-visible capabilities, from idea to implementation.
- [Protocols](protocols/README.md): wire behavior and interoperability rules.
- [Architecture](architecture/README.md): cross-repository boundaries and decisions.
- [Authored schemas](schemas/README.md): JSON Schemas for authored specifications, not generated API artifacts.
- [Contribution guide](CONTRIBUTING.md): ownership, review, and validation.
- [Changelog](CHANGELOG.md): changes to this repository.

## Find the API contract

Bot owns and publishes the machine-readable API contract. Use the [bot contract releases](https://github.com/crumble-project/bot/releases), selecting a `contract-vX.Y.Z` release. Releases contain OpenAPI, server-sent event payload schemas, checksums, and source provenance.

Do not copy generated contracts into this repository. Read the [contract maintenance guide](https://github.com/crumble-project/bot/blob/main/docs/api-contract.md) for generation and compatibility rules. Before the first contract release, consult that guide; no published contract is implied.

## Validate changes

Use Bun `1.4.2` and [lychee](https://github.com/lycheeverse/lychee) `0.24.2`:

```sh
bun install --frozen-lockfile
bun run check
lychee --include-fragments --no-progress --exclude-path node_modules '**/*.md'
```

CI runs the same schema and link checks. Validation requires no deployment access or credentials. Link checks use the public network; schema validation stays local.
