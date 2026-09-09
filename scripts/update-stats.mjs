#!/usr/bin/env node
// Node 22+, no packages. Only public REST endpoints are queried.
import assert from 'node:assert/strict';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const USER = 'Tyleronthebase';
const API = 'https://api.github.com';
const assetDirectory = fileURLToPath(new URL('../assets/', import.meta.url));
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const themes = {
  light: { bg: '#F2F5FA', fg: '#18243A', secondary: '#50627A', border: '#D8E1ED', accent: '#365BD7', teal: '#168577', orange: '#B95B32' },
  dark: { bg: '#111C30', fg: '#F3F6FD', secondary: '#A9B8D0', border: '#2A3C58', accent: '#A8BAFF', teal: '#74D5C5', orange: '#EDA783' },
};

function integer(value, name) {
  assert(Number.isSafeInteger(value) && value >= 0, `Invalid ${name}`);
  return value;
}

function xml(value) {
  const text = String(value);
  assert(!/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/u.test(text), 'Invalid XML character');
  return text.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]);
}

async function get(path) {
  // Deliberately do not use /user/repos, GraphQL, or any private-data endpoint.
  assert(path.startsWith(`/users/${USER}/repos?`) || path.startsWith(`/repos/${USER}/`), 'Unexpected API route');
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': `${USER}-profile-assets` };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, { headers, redirect: 'error', signal: AbortSignal.timeout(30_000) });
  assert(response.ok, `GitHub API returned HTTP ${response.status}`);
  return response.json();
}

async function snapshot() {
  const repositories = [];
  const names = new Set();
  for (let page = 1; ; page += 1) {
    assert(page <= 100, 'Repository pagination exceeded its safety limit');
    const batch = await get(`/users/${USER}/repos?type=owner&sort=full_name&per_page=100&page=${page}`);
    assert(Array.isArray(batch) && batch.length <= 100, 'Invalid repository response');
    for (const repository of batch) {
      assert(repository && repository.private === false, 'Public endpoint returned non-public repository data');
      assert(typeof repository.name === 'string' && /^[A-Za-z0-9_.-]+$/.test(repository.name), 'Invalid repository name');
      assert(repository.owner?.login?.toLowerCase() === USER.toLowerCase(), 'Unexpected repository owner');
      assert(repository.full_name?.toLowerCase() === `${USER}/${repository.name}`.toLowerCase(), 'Invalid repository identity');
      assert(typeof repository.fork === 'boolean' && typeof repository.archived === 'boolean', 'Invalid repository flags');
      integer(repository.stargazers_count, 'star count');
      const name = repository.name.toLowerCase();
      assert(!names.has(name), 'Duplicate repository in paginated response');
      names.add(name);
      if (name !== USER.toLowerCase()) repositories.push(repository);
    }
    if (batch.length < 100) break;
  }

  const originals = repositories.filter((repository) => !repository.fork);
  const languages = new Map();
  // Sequential requests keep the public API load small and fail before any writes.
  for (const repository of originals.filter((repository) => !repository.archived)) {
    const data = await get(`/repos/${USER}/${encodeURIComponent(repository.name)}/languages`);
    assert(data && typeof data === 'object' && !Array.isArray(data), 'Invalid language response');
    for (const [language, value] of Object.entries(data)) {
      assert(language.length > 0 && language.length <= 80, 'Invalid language name');
      xml(language);
      const bytes = integer(value, 'language bytes');
      if (bytes > 0) languages.set(language, integer((languages.get(language) || 0) + bytes, 'language total'));
    }
  }

  const sorted = [...languages].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en'));
  const totalBytes = integer(sorted.reduce((sum, [, bytes]) => sum + bytes, 0), 'total language bytes');
  const shown = sorted.slice(0, 3);
  if (sorted.length > 3) shown.push(['Other', sorted.slice(3).reduce((sum, [, bytes]) => sum + bytes, 0)]);
  return {
    projects: repositories.length,
    originals: originals.length,
    stars: integer(repositories.reduce((sum, repository) => sum + repository.stargazers_count, 0), 'total stars'),
    languages: shown,
    allLanguages: sorted,
    totalBytes,
    updated: `${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`,
  };
}

function render(data, theme, mobile = false) {
  const colors = [theme.accent, theme.teal, theme.orange, theme.secondary];
  const percentage = (bytes) => `${(100 * bytes / data.totalBytes).toFixed(1)}%`;
  const description = `${data.projects} public projects, ${data.originals} non-fork projects, ${data.allLanguages.length} languages. Languages by bytes in public original non-archived repositories: ${data.allLanguages.map(([language, bytes]) => `${language} ${percentage(bytes)}`).join(', ') || 'none'}. Updated ${data.updated}.`;
  let offset = 0;
  const segments = data.languages.map(([language, bytes], index) => {
    const width = 424 * bytes / data.totalBytes;
    const segment = `<rect x="${(508 + offset).toFixed(3)}" y="71" width="${width.toFixed(3)}" height="12" fill="${colors[index]}"/>`;
    offset += width;
    return segment;
  }).join('\n');
  const legend = data.languages.map(([language, bytes], index) => {
    const x = 508 + (index % 2) * 220;
    const y = 113 + Math.floor(index / 2) * 37;
    // A bounded label keeps unusual language names within the compact layout.
    const label = language.length > 17 ? `${language.slice(0, 16)}…` : language;
    return `<circle cx="${x + 4}" cy="${y - 4}" r="4" fill="${colors[index]}"/>
  <text x="${x + 17}" y="${y}" fill="${theme.fg}" font-size="13">${xml(label)}</text>
  <text x="${x + 201}" y="${y}" text-anchor="end" fill="${theme.secondary}" font-size="12">${xml(percentage(bytes))}</text>`;
  }).join('\n');

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="220" viewBox="0 0 960 220" role="img" aria-labelledby="stats-title stats-description">
  <title id="stats-title">Public code snapshot · ${xml(USER)}</title>
  <desc id="stats-description">${xml(description)}</desc>
  <rect x="0.5" y="0.5" width="959" height="219" rx="16" fill="${theme.bg}" stroke="${theme.border}"/>
  <g font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif">
  <text x="28" y="35" fill="${theme.secondary}" font-size="12" font-weight="600" letter-spacing="1.6">PUBLIC CODE SNAPSHOT</text>
  <text x="28" y="104" fill="${theme.accent}" font-size="46" font-weight="650">${xml(data.projects)}</text>
  <text x="180" y="104" fill="${theme.teal}" font-size="46" font-weight="650">${xml(data.originals)}</text>
  <text x="336" y="104" fill="${theme.orange}" font-size="46" font-weight="650">${xml(data.allLanguages.length)}</text>
  <text x="28" y="133" fill="${theme.fg}" font-size="14">Public projects</text>
  <text x="180" y="133" fill="${theme.fg}" font-size="14">Original projects</text>
  <text x="336" y="133" fill="${theme.fg}" font-size="14">Languages</text>
  <text x="28" y="154" fill="${theme.secondary}" font-size="11">Excluding this profile</text>
  <text x="180" y="154" fill="${theme.secondary}" font-size="11">Non-fork repositories</text>
  <text x="336" y="154" fill="${theme.secondary}" font-size="11">Across originals</text>
  <path d="M477 28V165" stroke="${theme.border}"/>
  <text x="508" y="35" fill="${theme.fg}" font-size="13" font-weight="600">Languages by bytes · public original repos</text>
  <rect x="508" y="71" width="424" height="12" fill="${theme.border}"/>
  ${segments}
  ${legend || `<text x="508" y="113" fill="${theme.secondary}" font-size="13">No public language data yet.</text>`}
  <path d="M28 178H932" stroke="${theme.border}"/>
  <text x="28" y="201" fill="${theme.secondary}" font-size="11">Public code only · Forks and archives excluded from languages</text>
  <text x="932" y="201" text-anchor="end" fill="${theme.secondary}" font-size="11">Updated ${xml(data.updated)}</text>
  </g>
</svg>
`;
  if (mobile) {
    const graph = `<g transform="translate(-480 128)">${segments}${legend || `<text x="508" y="113" fill="${theme.secondary}" font-size="13">No public language data yet.</text>`}</g>`;
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="358" viewBox="0 0 480 358" role="img" aria-labelledby="stats-title stats-description">
  <title id="stats-title">Public code snapshot · ${xml(USER)}</title><desc id="stats-description">${xml(description)}</desc>
  <rect x=".5" y=".5" width="479" height="357" rx="16" fill="${theme.bg}" stroke="${theme.border}"/>
  <g font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif">
    <text x="28" y="36" fill="${theme.secondary}" font-size="14" font-weight="600" letter-spacing="1.3">PUBLIC CODE SNAPSHOT</text>
    <text x="28" y="105" fill="${theme.accent}" font-size="48" font-weight="650">${xml(data.projects)}</text>
    <text x="180" y="105" fill="${theme.teal}" font-size="48" font-weight="650">${xml(data.originals)}</text>
    <text x="336" y="105" fill="${theme.orange}" font-size="48" font-weight="650">${xml(data.allLanguages.length)}</text>
    <text x="28" y="132" fill="${theme.fg}" font-size="15">Public projects</text>
    <text x="180" y="132" fill="${theme.fg}" font-size="15">Non-fork</text>
    <text x="336" y="132" fill="${theme.fg}" font-size="15">Languages</text>
    <path d="M28 155H452" stroke="${theme.border}"/>
    <text x="28" y="183" fill="${theme.fg}" font-size="14" font-weight="600">Languages by bytes · public original repos</text>
    <rect x="28" y="199" width="424" height="12" fill="${theme.border}"/>${graph}
    <path d="M28 295H452" stroke="${theme.border}"/>
    <text x="28" y="319" fill="${theme.secondary}" font-size="12">Profile excluded · Languages exclude forks and archives</text>
    <text x="28" y="341" fill="${theme.secondary}" font-size="12">Updated ${xml(data.updated)}</text>
  </g>
</svg>
`;
  }
  assert(svg.startsWith('<svg ') && svg.endsWith('</svg>\n'), 'Invalid SVG envelope');
  assert(!/<(?:script|foreignObject|image|use)\b|\son\w+=|(?:href|src)=/i.test(svg), 'Unsafe SVG content');
  assert(!/&(?!(?:amp|lt|gt|quot|apos);)/.test(svg), 'Unescaped SVG entity');
  assert(!/NaN|Infinity|undefined/.test(svg), 'Invalid SVG data');
  return svg;
}

async function main() {
  assert(Number(process.versions.node.split('.')[0]) >= 22, 'Node 22 or newer is required');
  const data = await snapshot();
  // Finish all network requests, validation, and rendering before touching good assets.
  const files = Object.entries(themes).flatMap(([name, theme]) => [false, true].map((mobile) => {
    const suffix = `${mobile ? 'mobile-' : ''}${name}`;
    return {
      target: join(assetDirectory, `stats-${suffix}.svg`),
      temporary: join(assetDirectory, `.stats-${suffix}.${process.pid}.${Date.now()}.tmp`),
      content: render(data, theme, mobile),
    };
  }));
  try {
    await mkdir(dirname(files[0].target), { recursive: true });
    for (const file of files) await writeFile(file.temporary, file.content, { flag: 'wx', mode: 0o644 });
    for (const file of files) await rename(file.temporary, file.target);
  } finally {
    await Promise.all(files.map((file) => rm(file.temporary, { force: true })));
  }
  console.log(JSON.stringify({ publicProjects: data.projects, originalProjects: data.originals, stars: data.stars, languageBytes: Object.fromEntries(data.allLanguages), updated: data.updated }, null, 2));
}

main().catch((error) => {
  // Never print request headers, credentials, or API response bodies.
  console.error(`Profile stats update failed: ${error.message}`);
  process.exitCode = 1;
});
