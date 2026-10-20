# Contribute a specification

## Ownership

The Crumble project owner maintains this repository and approves every change, including changes that affect other repositories.

## Write a specification

Features follow the [feature lifecycle](features/README.md), from idea issue to implemented specification. Protocol and architecture documents follow these steps:

1. Search existing specifications and the bot contract before adding a document.
2. Place the document in `features/`, `protocols/`, or `architecture/`, and link it from that directory's index.
3. State the owner, status, affected repositories, requirements, failure cases, and compatibility policy.
4. Link implementation issues and relevant decisions. Distinguish proposals from implemented behavior.
5. Add authored JSON Schemas to `schemas/` only when a specification needs them.
6. Update `CHANGELOG.md` and run the commands in [README.md](README.md#validate-changes).
7. Open a PR explaining the change.

Use stable relative links inside this repository. Link to bot releases for generated API definitions rather than duplicating them. Examples must use fictional data, without credentials or deployment-specific hostnames.

## Author a JSON Schema

Use JSON Schema draft 2020-12 and a `.schema.json` filename. Declare `$schema` as `https://json-schema.org/draft/2020-12/schema`. Give the schema a unique `$id`, and describe its owner and purpose in its specification.

Every JSON file under `schemas/` is validated. The validator loads all authored schemas before compiling them, so references can resolve locally. Remote references must be vendored as authored dependencies or replaced with local references; validation never downloads them. Register formats through the pinned `ajv-formats` dependency rather than inventing unsupported formats.

Adding a schema does not transfer ownership of a server API definition to this repository. Change API schemas in bot.
