import { mkdir, readFile, writeFile, open, unlink, readdir, access, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileString } from 'sass';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const validName = /^(?=.{1,63}$)[a-z0-9]+(?:-[a-z0-9]+)*$/;
const windowsReservedName = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function hasSiteFolder(parent, name) {
  try {
    return (await readdir(parent)).some(entry => entry.toLowerCase() === name);
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

// Templates live here, so deleting demo-site cannot break this command.
function starterFiles(name) {
  return {
    [`src/Sites/${name}/styles/main.scss`]: `@use './sass/header';
@use './sass/footer';

// Keep this site's rules inside its own wrapper.
[data-site-theme='${name}'] {
  @include header.styles;
  @include footer.styles;
}
`,
    [`src/Sites/${name}/styles/sass/_header.scss`]: `// main.scss includes this mixin inside the site wrapper.
@mixin styles {
  > header {
    // Add the site's header styles here.
  }
}
`,
    [`src/Sites/${name}/styles/sass/_footer.scss`]: `// main.scss includes this mixin inside the site wrapper.
@mixin styles {
  > footer {
    // Add the site's footer styles here.
  }
}
`,
    [`public/Sites/${name}/images/.gitkeep`]: '',
    [`public/Sites/${name}/fonts/.gitkeep`]: '',
    [`src/components/Sites/${name}/.gitkeep`]: '',
  };
}

export async function createSite(name, { rootDir = projectRoot, log = console.log } = {}) {
  if (!validName.test(name ?? '') || windowsReservedName.test(name)) {
    throw new Error(`Invalid site name "${name ?? ''}". Use 1-63 lowercase letters, numbers and single hyphens, for example "xyz-demo". Windows reserved names are not allowed.`);
  }

  const registryPath = path.join(rootDir, 'src/Sites/siteThemes.json');
  const lockPath = path.join(rootDir, 'src/Sites/.site-create.lock');
  let lock;
  try {
    // Prevent two commands from losing each other's registry updates.
    lock = await open(lockPath, 'wx');
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new Error('Another site creation may be running. See docs/site-creation.md before removing .site-create.lock.');
    }
    throw error;
  }

  try {
    const themes = JSON.parse(await readFile(registryPath, 'utf8'));
    if (!themes || Array.isArray(themes) || typeof themes !== 'object' ||
        Object.values(themes).some(theme => !theme || typeof theme.name !== 'string' || typeof theme.stylesheet !== 'string')) {
      throw new Error('Invalid siteThemes.json. Expected an object containing theme names and stylesheet paths.');
    }

    const roots = ['src/Sites', 'public/Sites', 'src/components/Sites'];
    const folders = await Promise.all(roots.map(folder => hasSiteFolder(path.join(rootDir, folder), name)));
    const registered = Object.keys(themes).some(key => key.toLowerCase() === name);
    if (registered || folders.some(Boolean)) {
      const mainExists = await exists(path.join(rootDir, `src/Sites/${name}/styles/main.scss`));
      if (registered && folders.every(Boolean) && mainExists) {
        log(`Site "${name}" already exists. No files were changed.`);
        return 'exists';
      }
      throw new Error(`Site "${name}" has an incomplete setup. No files were changed. Check its folders and theme registration.`);
    }

    const files = starterFiles(name);
    // Compile before writing. A template error must not leave half a site behind.
    const entry = files[`src/Sites/${name}/styles/main.scss`];
    const partials = {
      'sass/header': files[`src/Sites/${name}/styles/sass/_header.scss`],
      'sass/footer': files[`src/Sites/${name}/styles/sass/_footer.scss`],
    };
    const css = compileString(entry, {
      style: 'compressed',
      importers: [{
        canonicalize(url) { return Object.hasOwn(partials, url) ? new URL(`site:${url}`) : null; },
        load(url) { return { contents: partials[url.pathname], syntax: 'scss' }; },
      }],
    }).css;
    files[`public/Sites/${name}/styles/main.css`] = css;

    for (const [relativePath, contents] of Object.entries(files)) {
      const destination = path.join(rootDir, relativePath);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, contents, { encoding: 'utf8', flag: 'wx' });
    }

    // Register only after all files exist. Preserve every other site's entry.
    themes[name] = { name, stylesheet: `/Sites/${name}/styles/main.css` };
    // Replace the registry only after its new contents have been written fully.
    const temporaryRegistry = `${registryPath}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporaryRegistry, `${JSON.stringify(themes, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
      await rename(temporaryRegistry, registryPath);
    } finally {
      await unlink(temporaryRegistry).catch(error => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
    log(`Site "${name}" created and CSS compiled.`);
    for (const file of Object.keys(files)) log(`  ${file}`);
    log('Updated src/Sites/siteThemes.json. Add your styles and components, then run npm run dev.');
    return 'created';
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error('Usage: npm run site:create -- <site-name>');
    process.exitCode = 1;
  } else {
    try {
      await createSite(args[0]);
    } catch (error) {
      console.error(error.message);
      console.error('If files were created before an I/O failure, inspect them before retrying. See docs/site-creation.md.');
      process.exitCode = 1;
    }
  }
}
