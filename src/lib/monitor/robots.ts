/** robots.txt parsing (pure, no network). Longest matching rule wins; Allow wins a tie. */
export const UA_TOKEN = 'ifafa-careerhub';

/* ---------- robots.txt ---------- */
export interface Rule { allow: boolean; path: string }
export function robotsRules(txt: string, uaToken = UA_TOKEN): Rule[] {
  const groups: { agents: string[]; rules: Rule[] }[] = []; let cur: { agents: string[]; rules: Rule[] } | null = null; let lastWasAgent = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim(); if (!line) continue;
    const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(line); if (!m) continue;
    const key = m[1].toLowerCase(), val = m[2].trim();
    if (key === 'user-agent') { if (!cur || !lastWasAgent) { cur = { agents: [], rules: [] }; groups.push(cur); } cur.agents.push(val.toLowerCase()); lastWasAgent = true; continue; }
    lastWasAgent = false;
    if (cur && (key === 'allow' || key === 'disallow')) { if (key === 'disallow' && !val) continue; cur.rules.push({ allow: key === 'allow', path: val }); }
  }
  const mine = groups.filter(g => g.agents.some(a => a !== '*' && a === uaToken));
  return (mine.length ? mine : groups.filter(g => g.agents.includes('*'))).flatMap(g => g.rules);
}
export function robotsAllows(rules: Rule[], pathWithQuery: string): boolean {
  let best: Rule | null = null; let bestLen = -1;
  for (const r of rules) {
    const re = new RegExp('^' + r.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
    if (re.test(pathWithQuery) && (r.path.length > bestLen || (r.path.length === bestLen && r.allow))) { best = r; bestLen = r.path.length; }
  }
  return !best || best.allow;
}

