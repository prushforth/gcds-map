# Preview release process (`@prushforth/map` on npmjs.com)

Personal npm preview channel for testers, before the official `@gcds-extensions/map` ships.

> This file lives only on the local `preview-release` branch. Do **not** merge it to
> `main` or push it to the `gcds-extensions` org.

## Where the config lives

- Kept on local branch `preview-release` (never merge to main, never push to the org).
- Diff vs `main` `package.json`:
  - `name`: `@gcds-extensions/map` -> `@prushforth/map`
  - `version`: `1.0.0-preview.N` (prerelease so it never becomes plain `latest`)
  - add `publishConfig: { "access": "public", "tag": "preview" }`
  - add script `"prepublishOnly": "npm run build"`
- README install line -> `npm install @prushforth/map@preview` (a bare install 404s by
  design — there is intentionally no `latest`-channel install).

## Publish a new preview

```bash
git checkout preview-release
npm install                    # REQUIRED in a fresh clone before anything else (see Gotchas)
npm login && npm whoami        # must print: prushforth (owns the @prushforth scope)
# bump version in package.json to next 1.0.0-preview.N, commit
npm publish                    # publishConfig sets access=public + tag=preview
npm view @prushforth/map dist-tags   # verify
```

`prepublishOnly` runs prebuild (locale generation) + `stencil build` automatically.

## Removing old releases (IMPORTANT)

- Per-version `npm unpublish pkg@ver` only works within **72h** of that version's publish.
  After that it is rejected.
- The only way to remove older versions afterward is to unpublish the whole package:
  `npm unpublish @prushforth/map --force`.
  - Consequence: the package name is blocked from re-publishing for ~24h.
- 2026-08-04: did a full-package unpublish to clear `preview.1` + `preview.2`, then
  republished as `preview.3` after the 24h block.

## Gotchas

- **Fresh clone:** run `npm install` **before** `npm publish`. Without `node_modules`,
  `prepublishOnly` -> prebuild (`scripts/generate-locale.js`) fails with
  `English messages.json not found at .../node_modules/mapml-extension/src/_locales/en/messages.json`.
  `mapml-extension` is a git dependency (`git+https://github.com/Maps4HTML/mapml-extension`).
  This is not a config bug — just missing deps. (Hit 2026-08-06.)
- First publish of a package force-creates a `latest` tag even with `--tag preview`
  (npm requires `latest` to exist). It may point at the wrong version. Fix:
  `npm dist-tag add @prushforth/map@<ver> latest`, or — on a clean re-publish with only
  one version present — `latest` resolves correctly on its own.
- Published version contents (including the README) are immutable; to update the
  npmjs.com README you must publish a new version.
- The `@prushforth` scope is permanently tied to the first account that publishes it;
  it can't be moved without npm support.
