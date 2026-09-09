import { mkdir, writeFile } from 'node:fs/promises';

const themes = {
  light: { bg: '#F2F5FA', ink: '#18243A', muted: '#50627A', line: '#D8E1ED', blue: '#365BD7', teal: '#168577', clay: '#B95B32', card: '#FFFFFF' },
  dark: { bg: '#111C30', ink: '#F3F6FD', muted: '#A9B8D0', line: '#2A3C58', blue: '#A8BAFF', teal: '#74D5C5', clay: '#EDA783', card: '#18273E' },
};

function hero(t) {
  const node = (x, y, w, label, color, icon) => `<g transform="translate(${x} ${y})">
    <rect width="${w}" height="56" rx="14" fill="${t.card}" stroke="${t.line}"/>
    <rect x="12" y="12" width="32" height="32" rx="9" fill="${color}" fill-opacity=".1"/>
    <text x="28" y="33" text-anchor="middle" font-size="14" fill="${color}">${icon}</text>
    <text x="55" y="33" font-size="14" fill="${t.ink}">${label}</text>
  </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="380" viewBox="0 0 960 380" role="img" aria-labelledby="title desc">
  <title id="title">Tianen Wang — AI application engineer</title>
  <desc id="desc">From ideas to working software. A branching diagram connects an idea to an agent, tools, an interface, and a feedback loop.</desc>
  <defs>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${t.line}"/></pattern>
    <clipPath id="frame"><rect x=".5" y=".5" width="959" height="379" rx="24"/></clipPath>
  </defs>
  <g clip-path="url(#frame)">
    <rect width="960" height="380" fill="${t.bg}"/>
    <rect x="514" width="446" height="380" fill="url(#grid)"/>
    <circle cx="754" cy="191" r="147" fill="none" stroke="${t.line}"/>
    <circle cx="754" cy="191" r="118" fill="none" stroke="${t.line}" stroke-dasharray="3 8"/>
    <g font-family="Menlo,Consolas,monospace">
      <rect x="40" y="36" width="32" height="26" rx="7" fill="${t.blue}"/>
      <text x="56" y="54" font-size="15" text-anchor="middle" fill="${t.bg}">t.</text>
      <text x="85" y="54" font-size="13" letter-spacing="1.3" fill="${t.muted}">TYLER / BUILD LOG</text>
    </g>
    <g font-family="Trebuchet MS,Arial,sans-serif" font-weight="700" font-size="77" letter-spacing="-4" fill="${t.ink}">
      <text x="37" y="154">Tianen</text>
      <text x="37" y="235">Wang<tspan fill="${t.blue}">.</tspan></text>
    </g>
    <text x="41" y="279" font-family="Trebuchet MS,Arial,sans-serif" font-size="22" fill="${t.muted}">From ideas to working software.</text>
    <g fill="none" stroke="${t.blue}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M679 79 H712 Q732 79 732 99 V115"/>
      <path d="M749 171 V184 Q749 194 739 194 H608 Q598 194 598 207 V218"/>
      <path d="M765 171 V183 Q765 194 778 194 H832 Q842 194 842 206 V218"/>
      <path d="M598 274 V289 Q598 305 614 305 H832 Q842 305 842 289 V274" stroke="${t.teal}"/>
      <path d="M715 305 V319 Q715 336 698 336 H546 Q529 336 529 319 V96 Q529 79 546 79 H550" stroke="${t.muted}" stroke-dasharray="4 7"/>
    </g>
    <g font-family="Menlo,Consolas,monospace">
      ${node(550, 51, 129, 'idea', t.blue, '↗')}
      ${node(677, 115, 166, 'agent', t.blue, '✳')}
      ${node(544, 218, 145, 'tools', t.teal, '{ }')}
      ${node(758, 218, 162, 'interface', t.clay, '⌘')}
      <rect x="653" y="292" width="148" height="27" rx="13.5" fill="${t.bg}" stroke="${t.line}"/>
      <text x="727" y="310" text-anchor="middle" font-size="12" fill="${t.teal}">build · learn · ship</text>
      <circle cx="529" cy="186" r="5" fill="${t.bg}" stroke="${t.blue}" stroke-width="2"/>
      <circle cx="842" cy="202" r="4" fill="${t.clay}"/>
    </g>
    <path d="M40 316 H454" stroke="${t.line}"/>
    <text x="41" y="347" font-family="Menlo,Consolas,monospace" font-size="13" letter-spacing="1.2" fill="${t.blue}">AI APPLICATION ENGINEER</text>
  </g>
  <rect x=".5" y=".5" width="959" height="379" rx="24" fill="none" stroke="${t.line}"/>
</svg>\n`;
}

await mkdir(new URL('../assets/', import.meta.url), { recursive: true });
for (const [name, theme] of Object.entries(themes)) {
  await writeFile(new URL(`../assets/hero-${name}.svg`, import.meta.url), hero(theme));
}
console.log('Generated light and dark profile banners.');
