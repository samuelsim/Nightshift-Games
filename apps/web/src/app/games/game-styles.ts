export const gameStyles = `
  :host { display: block; }
  article { display: grid; gap: 1rem; max-width: 760px; margin: 0 auto; }
  section, form { display: grid; gap: .8rem; }
  section { padding: 1rem; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
  h1,h2,p { margin: 0; } h1 { font-size: clamp(2rem,8vw,3.5rem); } h2 { font-size: 1.3rem; }
  p, small { color: var(--muted); } .secret { color: var(--gold); font-size: 1.8rem; }
  input, button { min-height: 50px; border: 1px solid var(--line); border-radius: 8px; padding: .75rem; font: inherit; }
  input { width: 100%; min-width: 0; color: var(--text); background: var(--surface-strong); }
  button { cursor: pointer; background: var(--surface-strong); color: var(--text); font-weight: 800; text-align: left; }
  button.primary { background: var(--mint); color: #141414; text-align: center; }
  button:disabled { opacity: .5; cursor: default; } button.selected { border-color: var(--gold); }
  .row { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .7rem; padding: .7rem 0; border-bottom: 1px solid var(--line); }
  .chips { display: flex; gap: .5rem; flex-wrap: wrap; } .chips strong { padding: .5rem; background: var(--surface-strong); border-radius: 6px; }
  .poll-verdict {padding:.65rem .9rem;border-left:4px solid var(--gold);background:#ffd66b12;color:var(--gold);font-weight:800;animation:reveal-arrive .35s ease both}
`;
