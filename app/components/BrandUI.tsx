import React, { useEffect, useState } from "react";

export const BrandStyles = `
  .maple-input {
    background: #27272a;
    border: 1px solid #3f3f46;
    color: #fafafa;
    border-radius: 8px;
    padding: 0 14px;
    height: 40px !important;
    font-size: 13px;
    width: 100%;
    transition: border-color 0.15s;
    font-family: 'Inter', system-ui, sans-serif;
  }
  .maple-input:focus {
    outline: none;
    border-color: #c8a96e;
    box-shadow: 0 0 0 2px rgba(200,169,110,0.15);
  }
  .maple-input::placeholder { color: var(--text-muted); }
  textarea.maple-input { height: auto; padding: 10px 14px; resize: vertical; }
  select.maple-input { cursor: pointer; }

  .maple-btn-primary {
    background: var(--accent);
    color: #000;
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.03em;
    padding: 0 20px;
    height: 36px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    font-family: 'Inter', system-ui, sans-serif;
    white-space: nowrap;
  }
  .maple-btn-primary:hover { background: var(--accent-hover); }
  .maple-btn-primary:active { transform: scale(0.98); }

  .maple-btn-secondary {
    background: #18181b;
    color: var(--text);
    font-weight: 700;
    font-size: 12px;
    padding: 0 16px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid var(--border-subtle);
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'Inter', system-ui, sans-serif;
    white-space: nowrap;
  }
  .maple-btn-secondary:hover { background: #222226; color: var(--text); border-color: var(--border); }

  .maple-btn-danger {
    background: #991f22;
    color: #fff;
    font-weight: 700;
    font-size: 12px;
    padding: 0 16px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.06);
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'Inter', system-ui, sans-serif;
    white-space: nowrap;
  }
  .maple-btn-danger:hover { background: #b3262a; }

  .maple-btn-ghost {
    background: transparent;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 500;
    padding: 0 10px;
    height: 32px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'Inter', system-ui, sans-serif;
  }
  .maple-btn-ghost:hover { background: var(--bg-elevated); color: var(--text); }

  .maple-btn-template {
    background: transparent;
    color: var(--text-secondary);
    font-weight: 600;
    font-size: 10px;
    padding: 0 14px;
    height: 32px;
    border-radius: 6px;
    border: 1px solid var(--border);
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'Inter', system-ui, sans-serif;
    white-space: nowrap;
  }
  .maple-btn-template:hover {
    background: var(--accent);
    color: #000;
    border-color: var(--accent);
  }

  .section-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
  }

  .card {
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 12px;
  }

  .section-heading {
    font-size: 13px;
    font-weight: 600;
    color: #fafafa;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #27272a;
  }

  .divider {
    height: 1px;
    background: var(--border-subtle);
    margin: 16px 0;
  }

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
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    color: var(--text);
    animation: slideIn 0.2s ease;
    pointer-events: all;
  }
  .toast.success { border-color: var(--accent); color: var(--accent); }
  .toast.error { border-color: var(--red); color: var(--red); }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

export const LiveClock = () => {
  const [time, setTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      setTime(new Date().toLocaleString());
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>CALIBRATING...</div>;

  return (
    <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
      {time}
    </div>
  );
};

export const InputLabel = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col ${className}`}>
    <label className="block mb-[6px] text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#71717a" }}>{label}</label>
    {children}
  </div>
);

export const TextInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`maple-input w-full ${props.className || ""}`} />
);

export const NumberInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} type="number" className={`maple-input w-full ${props.className || ""}`} />
);

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`maple-input w-full ${props.className || ""}`} />
);

export const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={`maple-input w-full ${props.className || ""}`} />
);
