# Create a local site

From the project directory, run:

```powershell
npm run site:create -- xyz-demo
```

Install the project's existing dependencies with `npm install` first.
This command creates Next.js files only. It does not commit or push changes.
Its templates live in `scripts/create-site.mjs`; demo-site can be removed safely.

## Files created

```text
src/Sites/xyz-demo/styles/
  main.scss
  sass/
    _header.scss
    _footer.scss
src/components/Sites/xyz-demo/
  .gitkeep
public/Sites/xyz-demo/
  images/.gitkeep
  fonts/.gitkeep
  styles/main.css             Generated; not committed
```

The command also adds the site to `src/Sites/siteThemes.json`. The existing
`siteThemes.ts` lookup remains unchanged. Other registrations are preserved.
No sample React component or region comment is generated. Developers add their
components and comments manually. Component names must remain unique in the map.

The starter SCSS has empty header/footer mixins, so its first CSS file may be
empty. This is expected. Add design rules and run `npm run styles:sites:build`,
or use `npm run dev` to watch SCSS changes. Refresh to see the generated CSS.
The creation command compiles only the new site's starter styles; it does not
rebuild other sites. Keep selectors inside the site's data-site-theme wrapper.

## Site names

Use 1-63 lowercase letters or numbers, with single hyphens between groups.
Examples: `xyz-demo`, `canada-hcp`, `site1`. Spaces, uppercase letters, slashes,
leading/trailing hyphens and Windows reserved names such as `con` are rejected.
The command does not silently rename your input.

```text
Invalid site name "XYZ Demo". Use 1-63 lowercase letters, numbers and single
hyphens, for example "xyz-demo". Windows reserved names are not allowed.
```

## Existing sites and incomplete setup

A registered site with all three site folders and main.scss is left untouched:

```text
Site "xyz-demo" already exists. No files were changed.
```

This is a successful no-op. It does not reset styles, rebuild CSS or overwrite
developer work. An incomplete setup stops with a nonzero exit code:

```text
Site "xyz-demo" has an incomplete setup. No files were changed.
Check its folders and theme registration.
```

Check the three folders and JSON entry. Complete existing work manually, or
remove only the unused partial setup after reviewing it, then rerun the command.
The command never deletes an existing site to repair it.

## Failures and concurrent commands

Invalid registry JSON and Sass compilation errors stop before site files are
created. Filesystem failures during writing can leave a partial setup. Inspect
the files and registry before retrying; do not remove files containing user work.
Check `git diff` after every failed write, including a failed registry update.

The temporary `src/Sites/.site-create.lock` prevents two creation commands from
overwriting registry changes. It is removed on normal completion or handled
failure. If the process was forcibly stopped, first confirm no creation command
is still running, then remove that exact lock file and inspect the partial site.
Do not edit the registry manually while site creation is running.

## Remove a site

Remove its JSON entry, then remove its source, component and public asset
folders only after checking their references. Remove stale generated CSS too.
Keep the shared registry, lookup and creation script. Deleting demo-site does
not affect future site creation. See [site styles](../src/Sites/README.md) for
full style enable/disable and removal instructions.

## Branch workflow and checks

Maintain this shared tooling on multisite. Sync it to develop before creating
real site designs there. Review and commit generated source/assets yourself;
generated CSS stays ignored. No new dependency is required.

Run the isolated command tests with:

```powershell
node --test scripts/create-site.test.mjs
```
