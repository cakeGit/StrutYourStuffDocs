import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { defineConfig } from 'vitepress'

// Paths
const docsDir = resolve(__dirname, '..', 'docs');

// Marker used in generated proxy files so we can detect and skip them when auto-generating the sidebar
const PROXY_MARKER = '<!-- generated-proxy -->';

// Helper: recursively list files in a directory (non-hidden entries)
function listMarkdownFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      files = files.concat(listMarkdownFiles(full));
    } else if (e.isFile() && e.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

// Generate lightweight proxy .md files for any *.hidden.md so they are accessible at the normal path.
// The proxy imports the hidden md as a Vue component and renders it, preserving the normal URL.
function generateHiddenProxies() {
  const allMd = listMarkdownFiles(docsDir);
  for (const path of allMd) {
    if (path.endsWith('.hidden.md')) {
      const target = path.replace(/\.hidden\.md$/, '.md');
      // Do not overwrite existing non-proxy files
      if (existsSync(target)) {
        try {
          const content = readFileSync(target, 'utf8');
          if (content.includes(PROXY_MARKER)) continue;
          continue;
        } catch (e) {
          continue;
        }
      }

      // Ensure directory exists (should already)
      const td = dirname(target);
      if (!existsSync(td)) mkdirSync(td, { recursive: true });

      // Compute relative import path from target to hidden file
      const importPath = './' + path.slice(td.length + 1).replace(/\\/g, '/');
      // Build proxy content
      const proxyContent = `${PROXY_MARKER}\n<script setup>\nimport Content from '${importPath}'\n</script>\n\n<Content/>\n`;
      writeFileSync(target, proxyContent, 'utf8');
    }
  }
}

// Run generator synchronously so proxies exist before VitePress reads files
try {
  generateHiddenProxies();
} catch (e) {
  // Fail silently — generation is best-effort
  console.error('generateHiddenProxies error:', e);
}

// Build the sidebar auto-dynamically by walking the `docs` tree recursively
function buildSidebar() {
  // recursive helper: return array of sidebar items for a directory
  function walk(dir, relPath = '') {
    const entries = readdirSync(dir, { withFileTypes: true });
    const items = [];

    // first process files
    for (const e of entries) {
      if (!e.isFile() || !e.name.endsWith('.md')) continue;
      const full = join(dir, e.name);
      // skip hidden and proxies
      if (full.endsWith('.hidden.md')) continue;
      try {
        const content = readFileSync(full, 'utf8');
        if (content.includes(PROXY_MARKER)) continue;
      } catch (err) {}
      const name = basenameWithoutExt(full);
      // skip root index (home) at top level
      if (relPath === '' && name === 'index') continue;

      // compute link (encode each segment to avoid spaces causing Invalid URL)
      let link;
      if (name === 'index') {
        // directory index becomes the path to folder
        // encode each part of relPath separately
        if (relPath) {
          const parts = relPath.split('/').map(encodeURIComponent);
          link = `/${parts.join('/')}/`;
        } else {
          link = `/`;
        }
      } else {
        if (relPath) {
          const parts = relPath.split('/').map(encodeURIComponent);
          parts.push(encodeURIComponent(name));
          link = `/${parts.join('/')}`;
        } else {
          link = `/${encodeURIComponent(name)}`;
        }
      }
      link = link.replace(/\\/g, '/');
      items.push({ text: name, link });
    }

    // then process subdirectories
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const subdir = e.name;
      const childItems = walk(join(dir, subdir), relPath ? `${relPath}/${subdir}` : subdir);
      if (childItems.length) {
        items.push({ text: subdir, items: childItems });
      }
    }

    return items;
  }

  const sidebar = walk(docsDir);
  // ensure home link is first
  sidebar.unshift({ text: 'home', link: '/' });
  return sidebar;
}

function basenameWithoutExt(fullPath) {
  const base = fullPath.split(/\\|\//).pop();
  return base.replace(/\.hidden\.md$|\.md$/i, '');
}

const sidebar = buildSidebar();

export default defineConfig({
  title: "Strut Your Stuff",
  description: "Documentation of the Strut Your Stuff library",
  themeConfig: {
    nav: [
      { text: 'home', link: '/' },
      { text: 'javadoc', link: 'https://struts-jdoc.azmod.net/' },
    ],

    sidebar: sidebar,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/cakeGit/StrutYourStuff' }
    ]
  },
  srcDir: 'docs',
  base: "/",
})
