import React, { useEffect, useState } from "react";

// ── BRAND STYLES (BRUTALIST EDITION) ─────────────────────────────────────────
// Brutalist aesthetic: sharp corners (0px radius), thick borders, hard offset shadows,
// stark contrasts, and raw interactions. No soft blurs or gentle curves.
// ─────────────────────────────────────────────────────────────────────────────

export const BrandStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

  :root {
    --bg-page:        #0c0c0e;
    --bg-surface:     #18181b;
    --bg-elevated:    #232329;
    --bg-input:       #0c0c0e;
    --border-subtle:  #1f1f25;
    --border-base:    #3f3f4a;
    --border-strong:  #f4f4f5;
    --text-primary:   #ffffff;
    --text-secondary: #a1a1aa;
    --text-muted:     #71717a;
    --text-faint:     #52525b;
    --maple:          #8a3535;
    --maple-hover:    #a34040;
    --maple-deep:     #4a1f1f;
    --green:          #22c55e;
    
    /* Brutalist Tokens */
    --brutal-border:  2px solid var(--border-base);
    --brutal-shadow:  4px 4px 0px #000000;
    --brutal-shadow-sm: 2px 2px 0px #000000;
  }

  * { box-sizing: border-box; }

  body {
    background: var(--bg-page);
    color: var(--text-primary);
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: var(--bg-page); border-left: var(--brutal-border); }
  ::-webkit-scrollbar-thumb { background: var(--border-base); border: 1px solid #000; }
  ::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }

  /* Cards */
  .mpl-card {
    background: var(--bg-surface);
    border: var(--brutal-border);
    border-radius: 0px;
    padding: 24px;
    box-shadow: var(--brutal-shadow);
    margin-bottom: 24px;
    transition: transform 0.1s, box-shadow 0.1s;
  }

  .mpl-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    margin-bottom: 20px;
    border-bottom: 2px solid #000;
  }

  .mpl-card-title {
    font-size: 16px;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--text-primary);
    letter-spacing: 0.05em;
  }

  /* Inputs */
  .maple-input {
    width: 100%;
    height: 44px;
    padding: 0 14px;
    background: var(--bg-input);
    border: 2px solid var(--border-base);
    border-radius: 0px;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 600;
    font-family: 'Inter', system-ui, sans-serif;
    outline: none;
    transition: border-color 0.1s, box-shadow 0.1s;
  }

  .maple-input::placeholder { color: var(--text-faint); font-weight: 400; }
  .maple-input:hover { border-color: var(--text-secondary); }
  .maple-input:focus {
    border-color: var(--text-primary);
    box-shadow: var(--brutal-shadow-sm);
    background: var(--bg-surface);
  }

  textarea.maple-input {
    height: auto;
    min-height: 90px;
    padding: 12px 14px;
    resize: vertical;
    line-height: 1.5;
  }

  select.maple-input { 
    cursor: pointer; 
    appearance: none;
    border-radius: 0px;
  }

  /* Buttons */
  .maple-btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 40px;
    padding: 0 20px;
    background: var(--maple);
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-family: 'Inter', system-ui, sans-serif;
    border: 2px solid #000;
    border-radius: 0px;
    box-shadow: var(--brutal-shadow);
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s;
    white-space: nowrap;
  }
  .maple-btn-primary:hover { 
    background: var(--maple-hover); 
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0px #000;
  }
  .maple-btn-primary:active { 
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0px #000;
  }

  .maple-btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 40px;
    padding: 0 16px;
    background: var(--bg-surface);
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-family: 'Inter', system-ui, sans-serif;
    border: 2px solid var(--text-muted);
    border-radius: 0px;
    box-shadow: var(--brutal-shadow-sm);
    cursor: pointer;
    transition: all 0.1s;
    white-space: nowrap;
  }
  .maple-btn-secondary:hover {
    background: var(--bg-elevated);
    border-color: var(--text-primary);
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0px #000;
  }
  .maple-btn-secondary:active {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0px #000;
  }

  .maple-btn-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 32px;
    padding: 0 10px;
    background: transparent;
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    font-family: 'Inter', system-ui, sans-serif;
    border: 2px solid transparent;
    border-radius: 0px;
    cursor: pointer;
    transition: all 0.1s;
  }
  .maple-btn-ghost:hover { 
    color: var(--text-primary); 
    border-color: var(--text-muted);
    background: var(--bg-elevated); 
  }

  /* Labels */
  .maple-label {
    display: block;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-secondary);
    margin-bottom: 8px;
    font-family: 'Inter', system-ui, sans-serif;
  }

  /* Field grid */
  .maple-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .maple-grid-2 .maple-full { grid-column: 1 / -1; }

  /* Sidebar */
  .maple-nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    height: 44px;
    padding: 0 16px;
    border-radius: 0px;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    background: transparent;
    border: 2px solid transparent;
    cursor: pointer;
    margin-bottom: 4px;
    text-align: left;
    font-family: 'Inter', system-ui, sans-serif;
    transition: all 0.1s;
  }
  .maple-nav-item:hover { 
    background: var(--bg-elevated); 
    color: var(--text-primary); 
    border-color: var(--border-base);
  }
  .maple-nav-item.active {
    background: var(--bg-surface);
    color: var(--text-primary);
    border: 2px solid var(--text-primary);
    box-shadow: 4px 4px 0px var(--maple);
    transform: translate(-2px, -2px);
    margin-bottom: 8px;
  }

  /* Badges */
  .maple-badge-live {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 0px;
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    background: #000;
    border: 2px solid var(--green);
    color: var(--green);
    box-shadow: 2px 2px 0px var(--green);
  }
  .maple-badge-live::before {
    content: '';
    width: 6px;
    height: 6px;
    background: var(--green);
  }

  /* Toast */
  .maple-toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
  }
  .maple-toast {
    padding: 12px 20px;
    border-radius: 0px;
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    font-family: 'Inter', system-ui, sans-serif;
    background: #000;
    border: 2px solid var(--text-primary);
    color: var(--text-primary);
    pointer-events: all;
    box-shadow: var(--brutal-shadow);
  }
  .maple-toast.success { border-color: var(--green); color: var(--green); }
  .maple-toast.error { border-color: #ef4444; color: #ef4444; }
  
  /* Shortcut key */
  .maple-key {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    background: #000;
    border: 2px solid var(--border-base);
    border-radius: 0px;
    font-size: 10px;
    font-weight: 800;
    color: var(--text-primary);
    font-family: 'SF Mono', 'Fira Code', monospace;
  }
`;

// ── LIVE CLOCK ────────────────────────────────────────────────────────────────
export const LiveClock = () => {
  const [time, setTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => setTime(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) return null;

  return (
    <span style={{
      fontSize: '11px',
      fontWeight: 800,
      color: 'var(--text-secondary)',
      fontVariantNumeric: 'tabular-nums',
      fontFamily: "'SF Mono', 'Fira Code', monospace",
      letterSpacing: '0.05em'
    }}>
      {time}
    </span>
  );
};

// ── INPUT COMPONENTS ──────────────────────────────────────────────────────────
export const InputLabel = ({
  label,
  children,
  className = ""
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col ${className}`} style={{ gap: '8px' }}>
    <label className="maple-label">{label}</label>
    {children}
  </div>
);

export const TextInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`maple-input ${props.className || ""}`} />
);

export const NumberInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    type="number"
    className={`maple-input ${props.className || ""}`}
  />
);

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`maple-input ${props.className || ""}`} />
);

export const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={`maple-input ${props.className || ""}`} />
);
