import React, { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   BRAND STYLES — injected via <style> to avoid Tailwind conflicts
   ═══════════════════════════════════════════════════════════════ */
export const BrandStyles = `
  /* ── INPUTS ─────────────────────────────────────────────────── */
  .maple-input {
    background: #16161e;
    border: 1px solid #28283a;
    color: #f0f0f4;
    border-radius: 8px;
    padding: 0 14px;
    height: 40px;
    font-size: 13px;
    width: 100%;
    transition: border-color 0.15s, box-shadow 0.15s;
    font-family: var(--font-outfit), system-ui, sans-serif;
    appearance: none;
  }
  .maple-input:hover:not(:disabled) { border-color: #3a3a50; }
  .maple-input:focus {
    outline: none;
    border-color: #c8a96e;
    box-shadow: 0 0 0 3px rgba(200,169,110,0.10);
  }
  .maple-input::placeholder { color: #42425a; }
  .maple-input:disabled { opacity: 0.38; cursor: not-allowed; }

  textarea.maple-input {
    height: auto;
    padding: 10px 14px;
    resize: vertical;
    line-height: 1.65;
  }
  select.maple-input {
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2352526a'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }
  select.maple-input option { background: #111118; color: #f0f0f4; }

  /* ── BUTTONS ────────────────────────────────────────────────── */
  .maple-btn-primary {
    background: #c8a96e;
    color: #000;
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.02em;
    padding: 0 16px;
    height: 32px;
    border-radius: 6px;
    transition: all 0.18s ease;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: var(--font-outfit), system-ui, sans-serif;
  }
  .maple-btn-primary:hover { background: #d4b97e; }

  .maple-btn-secondary {
    background: transparent;
    border: 1px solid #2a2a38;
    color: #88889a;
    font-size: 12px;
    font-weight: 500;
    height: 32px;
    padding: 0 14px;
    border-radius: 6px;
    transition: all 0.18s ease;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: var(--font-outfit), system-ui, sans-serif;
  }
  .maple-btn-secondary:hover { border-color: #50506a; color: #f0f0f4; }

  .maple-btn-icon {
    width: 30px;
    height: 30px;
    background: #141420;
    border: 1px solid #22222e;
    border-radius: 7px;
    color: #88889a;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 13px;
  }
  .maple-btn-icon:hover { color: #f0f0f4; border-color: #36364e; }
  .maple-btn-icon.danger:hover {
    background: rgba(240,71,71,0.10);
    color: #f04747;
    border-color: rgba(240,71,71,0.25);
  }

  /* ── SECTION LABELS & HEADINGS ───────────────────────────────── */
  .section-label {
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.11em;
    color: #56566e;
    margin-bottom: 6px;
    display: block;
    font-family: var(--font-outfit), system-ui, sans-serif;
  }

  .section-heading {
    font-size: 16px;
    font-weight: 600;
    color: #f0f0f4;
    font-family: var(--font-instrument), serif;
    letter-spacing: -0.015em;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #181826;
    display: block;
    width: 100%;
  }

  /* ── CARDS ───────────────────────────────────────────────────── */
  .card {
    background: #0e0e16;
    border: 1px solid #1e1e2c;
    border-radius: 14px;
    padding: 28px;
    position: relative;
    overflow: hidden;
  }
  .card::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, rgba(200,169,110,0.55) 0%, rgba(200,169,110,0.05) 55%, transparent 100%);
  }

  /* ── BADGES ───────────────────────────────────────────────────── */
  .live-edit-badge {
    background: rgba(34,197,94,0.07);
    color: #22c55e;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 3px 10px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 5px;
    border: 1px solid rgba(34,197,94,0.15);
    font-family: var(--font-outfit), system-ui, sans-serif;
  }
  .live-edit-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #22c55e;
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-family: var(--font-outfit), system-ui, sans-serif;
  }
  .badge-accent {
    background: rgba(200,169,110,0.10);
    color: #c8a96e;
    border: 1px solid rgba(200,169,110,0.18);
  }

  /* ── TOPBAR ──────────────────────────────────────────────────── */
  .topbar {
    height: 52px;
    background: rgba(6,6,10,0.92);
    border-bottom: 1px solid #14141e;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(16px);
  }

  /* ── NAV ITEM ────────────────────────────────────────────────── */
  .nav-item {
    height: 36px;
    padding: 0 14px;
    font-size: 13px;
    font-weight: 500;
    border-radius: 7px;
    margin: 1px 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #56566e;
    background: transparent;
    border: none;
    border-left: 3px solid transparent;
    cursor: pointer;
    width: calc(100% - 20px);
    transition: all 0.15s ease;
    font-family: var(--font-outfit), system-ui, sans-serif;
  }
  .nav-item:hover { background: #14141c; color: #c0c0d0; }
  .nav-item.active {
    background: rgba(200,169,110,0.07);
    color: #c8a96e;
    border-left-color: #c8a96e;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
  .nav-item .icon { font-size: 13px; opacity: 0.55; }
  .nav-item.active .icon { opacity: 1; }

  /* ── FINANCIALS ──────────────────────────────────────────────── */
  .fin-line {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #88889a;
    padding: 7px 0;
    border-bottom: 1px solid #141420;
  }
  .fin-line.grand {
    font-size: 15px;
    font-weight: 700;
    color: #c8a96e;
    border-top: 1px solid #2a2a3a;
    border-bottom: none;
    padding-top: 12px;
    margin-top: 4px;
  }
  .fin-header {
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.11em;
    color: #56566e;
    margin-bottom: 14px;
    text-transform: uppercase;
    font-family: var(--font-outfit), system-ui, sans-serif;
  }

  /* ── PREVIEW ─────────────────────────────────────────────────── */
  .preview-container {
    margin-top: 16px;
    background: #0a0a10;
    border: 1px solid #1a1a28;
    border-radius: 12px;
    padding: 18px;
    min-height: 200px;
  }
  .preview-placeholder {
    color: #42425a;
    font-size: 12px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 160px;
  }

  /* ── ROOM HEADER ─────────────────────────────────────────────── */
  .room-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: #08080e;
    border-bottom: 1px solid #18182a;
    gap: 16px;
    flex-wrap: wrap;
  }
  .room-name-input {
    background: transparent;
    border: none;
    color: #f0f0f4;
    font-size: 15px;
    font-weight: 700;
    outline: none;
    font-family: var(--font-outfit), system-ui, sans-serif;
    min-width: 160px;
  }
  .room-name-input::placeholder { color: #2a2a3a; }

  /* ── TABLE ───────────────────────────────────────────────────── */
  .maple-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    font-family: var(--font-outfit), system-ui, sans-serif;
  }
  .maple-table th {
    text-align: left;
    padding: 10px 16px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.11em;
    color: #40405a;
    background: #08080e;
    border-bottom: 1px solid #18182a;
  }
  .maple-table td {
    padding: 16px;
    border-bottom: 1px solid #12121e;
    vertical-align: top;
  }
  .maple-table tbody tr { transition: background 0.12s ease; }
  .maple-table tbody tr:hover td { background: #10101a; }
  .maple-table tbody tr:last-child td { border-bottom: none; }

  /* ── ITEM IMAGE ──────────────────────────────────────────────── */
  .item-img-box {
    width: 56px;
    height: 56px;
    border-radius: 8px;
    background: #16161e;
    border: 1px solid #22222e;
    overflow: hidden;
    flex-shrink: 0;
    position: relative;
    cursor: pointer;
  }
  .item-img-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.15s;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #f0f0f4;
    cursor: pointer;
    font-family: var(--font-outfit), system-ui, sans-serif;
  }
  .item-img-box:hover .item-img-overlay { opacity: 1; }

  /* ── EMPTY STATE ─────────────────────────────────────────────── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 56px 24px;
    text-align: center;
  }
  .empty-state-icon { font-size: 36px; margin-bottom: 16px; opacity: 0.45; }
  .empty-state-title {
    font-size: 14px;
    font-weight: 700;
    color: #c0c0d0;
    margin-bottom: 8px;
    font-family: var(--font-outfit), system-ui, sans-serif;
  }
  .empty-state-desc {
    font-size: 12px;
    color: #42425a;
    max-width: 280px;
    line-height: 1.7;
  }

  /* ── DRAFT CARDS ─────────────────────────────────────────────── */
  .draft-card {
    background: #0e0e16;
    border: 1px solid #1e1e2c;
    border-radius: 14px;
    padding: 22px;
    transition: all 0.22s var(--ease-out);
    position: relative;
    overflow: hidden;
  }
  .draft-card::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, rgba(200,169,110,0.5) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.22s;
  }
  .draft-card:hover {
    border-color: rgba(200,169,110,0.22);
    transform: translateY(-3px);
    box-shadow: 0 10px 32px rgba(0,0,0,0.55);
  }
  .draft-card:hover::before { opacity: 1; }

  /* ── TOAST ───────────────────────────────────────────────────── */
  .toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }
  .toast {
    background: #16161e;
    border: 1px solid #2a2a3a;
    border-radius: 10px;
    padding: 10px 16px;
    font-size: 12px;
    font-weight: 600;
    color: #c0c0d0;
    pointer-events: all;
    animation: slideUp 0.25s var(--ease-out) both;
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    min-width: 180px;
    font-family: var(--font-outfit), system-ui, sans-serif;
  }
  .toast.success { border-color: rgba(46,184,114,0.28); color: #2eb872; }
  .toast.error { border-color: rgba(240,71,71,0.28); color: #f04747; }

  /* ── MODAL ───────────────────────────────────────────────────── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(10px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .modal-box {
    background: #0e0e16;
    border: 1px solid #22223a;
    border-radius: 20px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    animation: scaleIn 0.22s var(--ease-bounce) both;
    box-shadow: 0 30px 80px rgba(0,0,0,0.75);
    position: relative;
  }
  .modal-box::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, rgba(200,169,110,0.5) 0%, transparent 55%);
    border-radius: 20px 20px 0 0;
  }
  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 24px;
    border-bottom: 1px solid #181826;
  }
  .modal-title {
    font-size: 18px;
    font-weight: 600;
    color: #f0f0f4;
    font-family: var(--font-instrument), serif;
    letter-spacing: -0.015em;
  }
  .modal-body { padding: 24px; }
  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid #181826;
    display: flex;
    justify-content: flex-end;
  }

  /* ── CREATIVE BUTTON ANIMATIONS ──────────────────────────────── */
  .creative-btn {
    position: relative;
    cursor: pointer;
    overflow: hidden;
    text-align: center;
    font-weight: 600;
    font-family: var(--font-outfit), system-ui, sans-serif;
    font-size: 12px;
    letter-spacing: 0.01em;
    transition: all 0.25s var(--ease-out);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border);
  }
  .creative-btn .text-wrapper {
    display: inline-block;
    transition: all 0.25s var(--ease-out);
  }
  .creative-btn:hover .text-wrapper {
    transform: translateY(-150%);
    opacity: 0;
  }
  .creative-btn .hover-layer {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translateY(100%);
    opacity: 0;
    transition: all 0.25s var(--ease-out);
    background: var(--accent);
    color: #000;
  }
  .creative-btn:hover .hover-layer {
    transform: translateY(0);
    opacity: 1;
  }
  .creative-btn.primary { background: var(--accent); color: #000; border-color: var(--accent); }
  .creative-btn.primary .hover-layer { background: var(--accent-hover); }
  .creative-btn.secondary { background: var(--bg-surface); color: var(--text-secondary); }
  .creative-btn.secondary:hover { color: #000; }
  .creative-btn.outline { background: transparent; color: var(--text); border-color: var(--border); }
  .creative-btn.outline .hover-layer { background: var(--bg-elevated); color: var(--text); }
  .creative-btn.danger .hover-layer { background: var(--red); color: white; }
  .creative-btn.danger:hover { border-color: var(--red); }
`;

/* ═══════════════════════════════════════════════════════════════
   REACT COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

/** Live clock shown in the sidebar footer */
export const LiveClock = () => {
  const [time, setTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      const d = new Date();
      setTime(
        d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted)
    return (
      <span className="section-label" style={{ color: "#38383f" }}>
        ——:——:——
      </span>
    );

  return (
    <span className="section-label" style={{ color: "#71717a", letterSpacing: "0.08em" }}>
      {time}
    </span>
  );
};

/** Wraps an input/select with a floating label */
export const InputLabel = ({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col gap-[6px] w-full ${className}`}>
    <label className="section-label">{label}</label>
    {children}
  </div>
);

/** Thin wrapper components that apply .maple-input */
export const TextInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`maple-input ${props.className ?? ""}`} />
);

export const NumberInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} type="number" className={`maple-input ${props.className ?? ""}`} />
);

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`maple-input ${props.className ?? ""}`} />
);

export const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={`maple-input ${props.className ?? ""}`} />
);

/** 
 * CREATIVE BUTTON
 * Implements the sliding text effect for a premium feel
 */
export const CreativeButton = ({ 
  children, 
  onClick, 
  variant = "primary", 
  className = "", 
  icon,
  type = "button"
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: "primary" | "secondary" | "danger" | "outline"; 
  className?: string;
  icon?: React.ReactNode;
  type?: "button" | "submit";
}) => {
  return (
    <button 
      type={type}
      onClick={onClick}
      className={`creative-btn ${variant} ${className} group rounded-full px-5 py-2`}
    >
      <span className="text-wrapper flex items-center gap-2">
        {icon}
        {children}
      </span>
      <div className="hover-layer font-bold flex items-center gap-2">
        {icon}
        {children}
      </div>
    </button>
  );
};
