"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import * as XLSX from "xlsx";
import { MAPLE_LOGO_B64 } from "./maple-logo-b64";

// Modular Imports
import { 
  QuoteData, QuoteItem, QuoteRoom, QuoteMeta, CompanyPayment, Draft, 
  UnitType, DiscountType, GstMode 
} from "./lib/types";

import { 
  money, computeTotals, safeParse, newItem, newRoom, 
  makeId, todayISODate, toNumber, quickConvert, discountAmount 
} from "./lib/utils";
import { TEMPLATES } from "./lib/constants";

import { MasterProposalPdf } from "./components/PdfCatalog";
import { 
  LiveClock, InputLabel, TextInput, Select, TextArea, 
  NumberInput, BrandStyles 
} from "./components/BrandUI";

const LS_KEY_DRAFTS = "mapleQuotation.drafts.v1";
const LS_KEY_LAST = "mapleQuotation.last.v2";
const LS_KEY_TERMS = "mapleQuotation.terms.v1";

export default function QuotationBuilderPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BrandStyles }} />
      <QuotationBuilderContent />
    </>
  );
}

function LivePreviewPanel({ data, computed, terms }: { data: QuoteData; computed: ReturnType<typeof computeTotals>; terms: string[] }) {
  return (
    <div className="live-preview-panel flex-1 overflow-y-auto p-4">
      {!data.client.name ? (
        <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center text-[var(--text-muted)]">
          <div className="mb-3 h-7 w-6 rounded border border-[var(--border)] bg-[var(--bg-surface)]" />
          <p className="text-[11px] font-medium max-w-[220px]">Fill in client details to see preview</p>
        </div>
      ) : (
        <div style={{ background: 'white', color: '#111', padding: '24px', minHeight: '100%', fontSize: '11px', lineHeight: '1.6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #632a2a', paddingBottom: '12px', marginBottom: '16px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#632a2a' }}>MAPLE FURNISHERS</div>
            <div style={{ fontSize: '9px', color: '#666', textAlign: 'right' }}>
              <div>B-3, W.H.S. Timber Market Kriti Nagar</div>
              <div>Delhi-110015</div>
              <div>9262968727</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', background: '#fafafa', padding: '10px', borderRadius: '4px' }}>
            <div>
              <div style={{ fontSize: '8px', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Prepared For</div>
              <div style={{ fontWeight: 700 }}>{data.client.name || '—'}</div>
              <div style={{ color: '#666' }}>{data.client.phone}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '8px', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Ref No.</div>
              <div style={{ fontWeight: 700 }}>{data.quote.number}</div>
              <div style={{ color: '#666' }}>{data.quote.date}</div>
            </div>
          </div>

          {data.rooms.map((room) => (
            <div key={room.id} style={{ marginBottom: '16px' }}>
              <div style={{ background: '#632a2a', color: 'white', padding: '6px 10px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', borderRadius: '3px', marginBottom: '8px' }}>
                {room.name || 'Room'} — {room.items.length} items
              </div>
              {room.items.map((item) => {
                const total = (item.price || 0) * (item.unitValue || 1) * (item.quantity || 1);
                return (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{item.category || 'Item'}</div>
                      <div style={{ color: '#666', fontSize: '9px' }}>{item.description}</div>
                      <div style={{ color: '#999', fontSize: '8px' }}>Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#632a2a' }}>₹{total.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          ))}

          <div style={{ marginTop: '16px', borderTop: '1px solid #ddd', paddingTop: '12px' }}>
            {computed.totals.lines.map((line) => (
              <div key={line.key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: line.emphasis ? 700 : 400, color: line.emphasis ? '#632a2a' : '#333', fontSize: line.emphasis ? '12px' : '9px' }}>
                <span>{line.label}</span>
                <span>₹{line.value?.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {terms.length > 0 && (
            <div style={{ marginTop: '16px', padding: '10px', background: '#fafafa', borderRadius: '4px' }}>
              <div style={{ fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', marginBottom: '6px', color: '#632a2a' }}>Terms & Conditions</div>
              {terms.map((t, i) => <div key={i} style={{ fontSize: '8px', color: '#555', marginBottom: '3px' }}>{i + 1}. {t}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuotationBuilderContent() {
  const [activeTab, setActiveTab] = useState<"client" | "rooms" | "finance" | "payment" | "drafts">("client");
  const [data, setData] = useState<QuoteData>({
    version: 2,
    client: { name: "", phone: "", address: "" },
    quote: { 
      number: "MF/2026/DRAFT", 
      date: todayISODate(), 
      validityDays: 15, 
      siteName: "", 
      salesPerson: "Senior Consultant" 
    },
    rooms: [newRoom("General Area")],
    charges: {
      packingPercent: 0,
      loadingCharge: 0,
      gstPercent: 18,
      gstMode: "excluded",
      splitCgstSgst: true,
      overallDiscountValue: 0,
      overallDiscountType: "flat",
    },
    payment: { upiId: "maple@bank", bankName: "Heritage Bank", accountName: "Maple Furnishers", accountNumber: "", ifsc: "" },
    updatedAt: Date.now(),
  });
  
  const [terms, setTerms] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  // FEATURE 1 — UNDO/REDO
  const [history, setHistory] = useState<QuoteData[]>([]);
  const [future, setFuture] = useState<QuoteData[]>([]);

  function selectTab(tab: typeof activeTab) {
    setActiveTab(tab);
  }

  function openTemplates() {
    setShowTemplates(true);
  }

  const updateData = (newData: QuoteData | ((prev: QuoteData) => QuoteData)) => {
    setHistory(h => [...h.slice(-49), data]);
    setFuture([]);
    if (typeof newData === 'function') {
      setData(prev => newData(prev));
    } else {
      setData(newData);
    }
  };

  function undo() {
    if (!history.length) return;
    setFuture(f => [data, ...f]);
    setData(history[history.length - 1]);
    setHistory(h => h.slice(0, -1));
    toast("Undone");
  }

  function redo() {
    if (!future.length) return;
    setHistory(h => [...h, data]);
    setData(future[0]);
    setFuture(f => f.slice(1));
    toast("Redone");
  }

  // FEATURE 2 — TOAST SYSTEM
  const [toasts, setToasts] = useState<{id:string; msg:string; type:string}[]>([]);
  function toast(msg: string, type = "success") {
    const id = makeId();
    setToasts(t => [...t, {id, msg, type}]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }

  const computed = useMemo(() => computeTotals(data), [data]);

  // FEATURE 3 — KEYBOARD SHORTCUTS
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveDraft(); }
      if (e.ctrlKey && e.key === 'p') { e.preventDefault(); onGeneratePdf(); }
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); if(confirm("Start new quote?")) window.location.reload(); }
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.shiftKey && e.key === 'z') { e.preventDefault(); redo(); }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [data, history, future]);

  // Persist last state
  useEffect(() => {
    localStorage.setItem(LS_KEY_LAST, JSON.stringify(data));
  }, [data]);

  // Load drafts, terms, last session, and check share link
  useEffect(() => {
    // FEATURE 5 — SHARE LINK CHECK
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get('q');
    if (qParam) {
      try {
        const decoded = JSON.parse(atob(qParam));
        if (decoded.version === 2) {
          setData(decoded);
          toast("Shared quote loaded ✓");
          return; // Skip loading last session if shared quote exists
        }
      } catch {}
    }

    const last = safeParse<QuoteData>(localStorage.getItem(LS_KEY_LAST));
    if (last && last.version === 2) {
      setData(last);
    } else {
      setData(prev => ({
        ...prev,
        quote: { ...prev.quote, number: `MF/2026/Q-${Math.floor(Math.random()*1000).toString().padStart(3, '0')}` }
      }));
    }

    const loadedDrafts = safeParse<Draft[]>(localStorage.getItem(LS_KEY_DRAFTS)) || [];
    setDrafts(loadedDrafts);
    const loadedTerms = safeParse<string[]>(localStorage.getItem(LS_KEY_TERMS)) || [
      "50% Advance at the time of booking.",
      "40% After completion of woodwork structure.",
      "10% Before delivery of items.",
      "GST will be extra as applicable.",
      "Transportation and loading extra if not mentioned.",
    ];
    setTerms(loadedTerms);
  }, []);

  function saveDraft() {
    const name = prompt("Enter draft name:", data.client.name || "Untitled Quote");
    if (!name) return;
    const newDraft: Draft = { id: makeId(), name, savedAt: Date.now(), data };
    const updated = [newDraft, ...drafts];
    setDrafts(updated);
    localStorage.setItem(LS_KEY_DRAFTS, JSON.stringify(updated));
    toast("Draft saved ✓");
  }

  function deleteDraft(id: string) {
    if (!confirm("Delete this draft?")) return;
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    localStorage.setItem(LS_KEY_DRAFTS, JSON.stringify(updated));
    toast("Draft deleted");
  }

  function updateRoom(roomIndex: number, patch: Partial<QuoteRoom>) {
    updateData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r, i) => (i === roomIndex ? { ...r, ...patch } : r)),
    }));
  }

  function deleteRoom(roomIndex: number) {
    if (data.rooms.length <= 1) return;
    if (!confirm("Delete this entire room?")) return;
    updateData(prev => ({ ...prev, rooms: prev.rooms.filter((_, i) => i !== roomIndex) }));
  }

  function updateItem(roomIndex: number, itemIndex: number, patch: Partial<QuoteItem>) {
    updateData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r, i) =>
        i !== roomIndex ? r : { ...r, items: r.items.map((it, ii) => (ii === itemIndex ? { ...it, ...patch } : it)) },
      ),
    }));
  }

  async function handleImageUpload(roomIdx: number, itemIdx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const b64 = evt.target?.result as string;
      updateItem(roomIdx, itemIdx, { imageUrl: b64 });
    };
    reader.readAsDataURL(file);
  }

  function deleteItem(roomIdx: number, itemIdx: number) {
    updateData(prev => {
      const rooms = [...prev.rooms];
      rooms[roomIdx].items = rooms[roomIdx].items.filter((_, i) => i !== itemIdx);
      return { ...prev, rooms };
    });
  }

  function addRoom() {
    updateData((prev) => ({ ...prev, rooms: [...prev.rooms, newRoom("")] }));
  }

  function addItem(roomIndex: number, template?: any) {
    updateData((prev) => {
      const rooms = [...prev.rooms];
      rooms[roomIndex].items.push(newItem(template));
      return { ...prev, rooms };
    });
  }

  async function onGeneratePdf() {
    toast("Generating PDF...", "success");
    const blob = await pdf(<MasterProposalPdf data={data} computed={computed} terms={terms} />).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    toast("PDF generated ✓");
  }

  async function onImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws) as any[];
        const newRooms: QuoteRoom[] = [newRoom("Imported Inventory")];
        rows.forEach(row => {
          newRooms[0].items.push(newItem({
            category: String(row.Category || row.category || ""),
            description: String(row.Description || row.description || ""),
            price: toNumber(row.Price || row.price || 0),
            quantity: toNumber(row.Quantity || row.quantity || 1),
            unitType: (row.Unit || row.unit || "nos") as UnitType,
            material: String(row.Material || ""),
          }));
        });
        updateData(prev => ({ ...prev, rooms: [...prev.rooms, ...newRooms] }));
        toast("Excel imported ✓");
      } catch (err) { toast("Excel import failed", "error"); }
    };
    reader.readAsBinaryString(file);
  }

  function shareQuote() {
    const encoded = btoa(JSON.stringify(data));
    const url = `${window.location.origin}${window.location.pathname}?q=${encoded}`;
    navigator.clipboard.writeText(url);
    toast("Share link copied to clipboard ✓");
  }

  const applyTemplate = (type: 1 | 2 | 3) => {
    if (!confirm("Apply this template? Current data will be replaced.")) return;
    
    let templateData: QuoteData = { ...data, updatedAt: Date.now() };

    if (type === 1) { // Living Room Package
      templateData.rooms = [{
        id: makeId(),
        name: "Living Room",
        roomDiscountValue: 0,
        roomDiscountType: "flat",
        moodBoard: [],
        items: [
          newItem({ category: "Sofa Set", description: "Premium fabric 3+2 seater", price: 85000, quantity: 1, unitType: "set" }),
          newItem({ category: "TV Console", description: "Wall mounted with storage", price: 35000, quantity: 1, unitType: "nos" }),
          newItem({ category: "Coffee Table", description: "Marble top center table", price: 22000, quantity: 1, unitType: "nos" }),
          newItem({ category: "Display Unit", description: "Glass door cabinet", price: 45000, quantity: 1, unitType: "nos" }),
        ]
      }];
    } else if (type === 2) { // Full Home
      templateData.rooms = ["Living Room", "Master Bedroom", "Kitchen", "Bathroom"].map(name => ({
        id: makeId(),
        name,
        roomDiscountValue: 0,
        roomDiscountType: "flat",
        moodBoard: [],
        items: [
          newItem({ category: `${name} Item 1`, price: 50000, quantity: 1, unitType: "nos" }),
          newItem({ category: `${name} Item 2`, price: 30000, quantity: 1, unitType: "nos" }),
        ]
      }));
    } else if (type === 3) { // Bedroom Set
      templateData.rooms = [{
        id: makeId(),
        name: "Master Bedroom",
        roomDiscountValue: 0,
        roomDiscountType: "flat",
        moodBoard: [],
        items: [
          newItem({ category: "King Bed", description: "Engineered wood with storage", price: 180000, quantity: 1, unitType: "nos" }),
          newItem({ category: "Wardrobe", description: "4-door sliding wardrobe", price: 95000, quantity: 1, unitType: "nos" }),
          newItem({ category: "Side Tables", description: "Pair of matching tables", price: 35000, quantity: 1, unitType: "nos" }),
        ]
      }];
    }

    updateData(templateData);
    setShowTemplates(false);
    toast("Template applied ✓");
  };

  function seedSampleData() {
    // Keep existing seed logic but use updateData and toast
    const samples: Draft[] = Array.from({ length: 5 }).map((_, i) => {
      const id = makeId();
      const sampleData: QuoteData = {
        version: 2,
        client: { name: `Demo Client ${i+1}`, phone: `99999999${i}`, address: "Sample Address" },
        quote: { number: `MF/2026/DEMO-${i+1}`, date: todayISODate(), validityDays: 15, siteName: "Demo Site", salesPerson: "Demo User" },
        rooms: [newRoom("Living Area")],
        charges: { packingPercent: 0, loadingCharge: 0, gstPercent: 18, gstMode: "excluded", splitCgstSgst: true, overallDiscountValue: 0, overallDiscountType: "flat" },
        payment: { upiId: "maple@bank", bankName: "Heritage Bank", accountName: "Maple Furnishers", accountNumber: "", ifsc: "" },
        updatedAt: Date.now()
      };
      return { id, name: `Demo: ${sampleData.client.name}`, savedAt: Date.now(), data: sampleData };
    });
    setDrafts(prev => [...samples, ...prev]);
    localStorage.setItem(LS_KEY_DRAFTS, JSON.stringify([...samples, ...drafts]));
    toast("Sample drafts added");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#08080a] text-[#f7f7f8]">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-[220px] flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <img src={MAPLE_LOGO_B64} alt="Logo" className="w-8 h-8 object-contain" />
            <div>
              <div className="text-[13px] font-semibold leading-none">Maple Furnishers</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1">Quotation Suite</div>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 mt-2">
          {[
            { id: "client", label: "Overview" },
            { id: "rooms", label: "Rooms & Items" },
            { id: "finance", label: "Finance & T&C" },
            { id: "payment", label: "Payment" },
            { id: "drafts", label: "Archives" },
          ].map((item) => (
            <button
              type="button"
              key={item.id}
              onPointerDown={() => selectTab(item.id as typeof activeTab)}
              onClick={() => selectTab(item.id as typeof activeTab)}
              className={`w-full h-10 px-5 flex items-center text-[13px] font-medium transition-all ${
                activeTab === item.id 
                ? 'bg-[rgba(200,169,110,0.12)] text-[#c8a96e] border-l-2 border-[#c8a96e]' 
                : 'text-[#71717a] hover:bg-[#1f1f1f] hover:text-[#fafafa]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <div className="text-[10px] text-[var(--text-muted)] leading-relaxed uppercase tracking-[0.08em]">
            Ctrl+S Save / Ctrl+P PDF<br/>
            Ctrl+N New / Ctrl+Z Undo
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[var(--bg)]">
        
        {/* TOP BAR */}
        <header className="hidden">
          <div className="min-w-0">
            <img src={MAPLE_LOGO_B64} alt="Maple Furnishers" className="mb-3 h-8 w-auto object-contain" />
            <h1 className="text-[18px] font-semibold tracking-[-0.01em] text-white">Maple Furnishers — Quotation Builder</h1>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Drafts, discounts, GST modes, room summary, templates, and branded PDF export.</p>
            <nav className="mt-5 flex flex-wrap gap-2">
              {[
                { id: "client", label: "Client & Quote" },
                { id: "rooms", label: "Rooms" },
                { id: "finance", label: "Finance" },
                { id: "payment", label: "Payment" },
                { id: "drafts", label: "Drafts" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onPointerDown={() => selectTab(item.id as typeof activeTab)}
                  onClick={() => selectTab(item.id as typeof activeTab)}
                  className={`h-8 rounded-lg px-3 text-[12px] font-semibold transition-colors ${
                    activeTab === item.id ? "bg-[#fafafa] text-[#09090b]" : "bg-[#18181b] text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 pt-[54px]">
            <button type="button" onClick={() => window.location.reload()} className="maple-btn-secondary">New quote</button>
            <button type="button" onPointerDown={openTemplates} onClick={openTemplates} className="maple-btn-secondary">Templates</button>
            <button type="button" onClick={shareQuote} className="maple-btn-secondary">Share</button>
            <button type="button" onClick={saveDraft} className="maple-btn-danger">Save draft</button>
            <button type="button" onClick={onGeneratePdf} className="maple-btn-primary">Generate PDF</button>
          </div>
        </header>

        <header className="h-12 flex items-center justify-between px-6 border-b border-[var(--border-subtle)] bg-[var(--bg)] sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <input 
              value={data.quote.number} 
              onChange={(e) => updateData(p => ({ ...p, quote: { ...p.quote, number: e.target.value }}))}
              className="bg-transparent border-none text-base font-semibold focus:outline-none w-48"
            />
            <div className="px-3 py-1 rounded-full bg-[var(--bg-elevated)] text-[10px] text-[var(--text-secondary)] font-medium">
              {new Date(data.quote.date).toLocaleDateString()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={undo} className="maple-btn-ghost" title="Undo (Ctrl+Z)">↺ Undo</button>
            <button type="button" onClick={redo} className="maple-btn-ghost" title="Redo (Ctrl+Shift+Z)">↻ Redo</button>
            <div className="w-[1px] h-4 bg-[var(--border-subtle)] mx-2" />
            <button type="button" onPointerDown={openTemplates} onClick={openTemplates} className="maple-btn-ghost">Templates</button>
            <button type="button" onClick={shareQuote} className="maple-btn-ghost">Share</button>
            <button type="button" onClick={saveDraft} className="maple-btn-secondary ml-2">Save Draft</button>
            <button type="button" onClick={onGeneratePdf} className="maple-btn-primary ml-2">Generate PDF</button>
            <div className="ml-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
              Preview
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <section className="contents">
          
          {activeTab === "client" && (
            <div className="max-w-4xl space-y-4">
              <div className="card p-6">
                <h2 className="section-heading">Client Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <InputLabel label="Client Full Name">
                    <TextInput value={data.client.name} onChange={(e) => updateData(p => ({ ...p, client: { ...p.client, name: e.target.value }}))} placeholder="e.g. Vimal Gupta" />
                  </InputLabel>
                  <InputLabel label="Contact Phone">
                    <TextInput value={data.client.phone} onChange={(e) => updateData(p => ({ ...p, client: { ...p.client, phone: e.target.value }}))} placeholder="+91" />
                  </InputLabel>
                  <div className="col-span-2">
                    <InputLabel label="Project Site / Delivery Address">
                      <TextArea value={data.client.address} onChange={(e) => updateData(p => ({ ...p, client: { ...p.client, address: e.target.value }}))} rows={3} placeholder="Full address..." />
                    </InputLabel>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="section-heading">Quote Info</h2>
                <div className="grid grid-cols-2 gap-4">
                  <InputLabel label="Quote Number">
                    <TextInput value={data.quote.number} onChange={(e) => updateData(p => ({ ...p, quote: { ...p.quote, number: e.target.value }}))} />
                  </InputLabel>
                  <InputLabel label="Proposal Date">
                    <TextInput type="date" value={data.quote.date} onChange={(e) => updateData(p => ({ ...p, quote: { ...p.quote, date: e.target.value }}))} />
                  </InputLabel>
                  <InputLabel label="Validity (Days)">
                    <NumberInput value={data.quote.validityDays} onChange={(e) => updateData(p => ({ ...p, quote: { ...p.quote, validityDays: toNumber(e.target.value) }}))} />
                  </InputLabel>
                  <InputLabel label="Sales Representative">
                    <TextInput value={data.quote.salesPerson} onChange={(e) => updateData(p => ({ ...p, quote: { ...p.quote, salesPerson: e.target.value }}))} />
                  </InputLabel>
                  <InputLabel label="Site / Project Name">
                    <TextInput value={data.quote.siteName} onChange={(e) => updateData(p => ({ ...p, quote: { ...p.quote, siteName: e.target.value }}))} placeholder="e.g. Penthouse A" />
                  </InputLabel>
                </div>
              </div>
            </div>
          )}

          {activeTab === "rooms" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="section-heading !mb-0">Project Inventory</h2>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-wider">Detailed Itemization & Room Allocation</p>
                </div>
                <div className="flex gap-3">
                  <label className="maple-btn-secondary cursor-pointer">
                    Excel Import
                    <input type="file" className="hidden" accept=".xlsx,.xls" onChange={onImportExcel} />
                  </label>
                  <button onClick={addRoom} className="maple-btn-primary">+ Add New Room</button>
                </div>
              </div>

              {data.rooms.map((room, rIdx) => (
                <div key={room.id} className="overflow-hidden rounded-xl border border-[#3f3f46] bg-[#111113] mb-4">
                  <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-elevated)]/20">
                    <input 
                      value={room.name} 
                      onChange={(e) => updateRoom(rIdx, { name: e.target.value })} 
                      className="bg-transparent border-none text-sm font-semibold focus:outline-none w-1/2" 
                      placeholder="Room Name..." 
                    />
                    <div className="flex gap-2">
                      <span className="h-8 rounded-md border border-[#3f3f46] bg-[#18181b] px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#71717a] flex items-center">{room.items.length} items</span>
                      <Select className="h-8 w-40 text-[10px]" onChange={(e) => {
                        const t = TEMPLATES.find(t => t.label === e.target.value);
                        if(t) addItem(rIdx, t);
                      }}>
                        <option value="">Quick Add Template...</option>
                        {TEMPLATES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                      </Select>
                      <button onClick={() => addItem(rIdx)} className="maple-btn-secondary h-8 px-3 text-[10px]">+ Add Item</button>
                      <button onClick={() => deleteRoom(rIdx)} className="maple-btn-ghost text-[var(--red)] hover:bg-[var(--red)]/10 h-8 w-8 p-0">✕</button>
                    </div>
                  </div>

                  {room.items.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                      <div className="text-[12px] font-semibold text-[var(--text)]">No items yet</div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-1 mb-5">Add your first item to this room</div>
                      <div className="flex justify-center gap-3">
                        <button onClick={() => addItem(rIdx)} className="maple-btn-secondary h-8 px-3 text-[10px]">+ Custom Item</button>
                        <Select className="h-8 w-44 text-[10px]" onChange={(e) => {
                          const t = TEMPLATES.find(t => t.label === e.target.value);
                          if(t) addItem(rIdx, t);
                        }}>
                          <option value="">Template...</option>
                          {TEMPLATES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                        </Select>
                      </div>
                    </div>
                  ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)]">
                          <th className="px-6 py-3 text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">Item</th>
                          <th className="px-6 py-3 text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold w-48">Spec</th>
                          <th className="px-6 py-3 text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold w-64">Financials</th>
                          <th className="px-6 py-3 text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold text-right w-32">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {room.items.map((item, iIdx) => (
                          <tr key={item.id} className="group">
                            <td className="px-6 py-5">
                              <div className="flex gap-4">
                                <div className="w-20 h-20 rounded bg-[var(--bg-elevated)] border border-[var(--border)] overflow-hidden relative group/img">
                                  {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20">📸</div>}
                                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 cursor-pointer transition-opacity text-[8px] font-bold">
                                    UPLOAD
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(rIdx, iIdx, e)} />
                                  </label>
                                </div>
                                <div className="flex-1 space-y-1">
                                  <input 
                                    value={item.category} 
                                    onChange={(e) => updateItem(rIdx, iIdx, { category: e.target.value })} 
                                    className="w-full bg-transparent border-none font-semibold text-sm focus:outline-none" 
                                    placeholder="Category..."
                                  />
                                  <textarea 
                                    value={item.description} 
                                    onChange={(e) => updateItem(rIdx, iIdx, { description: e.target.value })} 
                                    className="w-full bg-transparent border-none text-[11px] text-[var(--text-secondary)] focus:outline-none resize-none h-12"
                                    placeholder="Description..."
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 space-y-4">
                              <div className="grid grid-cols-2 gap-2">
                                <InputLabel label="Material"><TextInput className="h-7 text-[10px]" value={item.material} onChange={(e) => updateItem(rIdx, iIdx, { material: e.target.value })} /></InputLabel>
                                <InputLabel label="Fabric"><TextInput className="h-7 text-[10px]" value={item.fabric} onChange={(e) => updateItem(rIdx, iIdx, { fabric: e.target.value })} /></InputLabel>
                              </div>
                              <div className="flex gap-1">
                                {(['l', 'w', 'h'] as Array<keyof NonNullable<QuoteItem['dimensions']>>).map(d => (
                                  <NumberInput key={d} placeholder={d.toUpperCase()} className="h-7 text-[10px] text-center" value={item.dimensions?.[d]} onChange={(e) => updateItem(rIdx, iIdx, { dimensions: { ...item.dimensions!, [d]: toNumber(e.target.value) } })} />
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                                <InputLabel label="Rate"><NumberInput className="h-7 font-bold" value={item.price} onChange={(e) => updateItem(rIdx, iIdx, { price: toNumber(e.target.value) })} /></InputLabel>
                                <InputLabel label="Unit"><Select className="h-7 text-[10px]" value={item.unitType} onChange={(e) => updateItem(rIdx, iIdx, { unitType: e.target.value as any })}>
                                  <option value="nos">NOS</option><option value="set">SET</option><option value="sqft">SQFT</option><option value="rft">RFT</option>
                                </Select></InputLabel>
                                <InputLabel label="Qty Val"><NumberInput className="h-7" value={item.unitValue} onChange={(e) => updateItem(rIdx, iIdx, { unitValue: toNumber(e.target.value) })} /></InputLabel>
                                <InputLabel label="Count"><NumberInput className="h-7" value={item.quantity} onChange={(e) => updateItem(rIdx, iIdx, { quantity: toNumber(e.target.value) })} /></InputLabel>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="text-sm font-bold">{money((item.price || 0) * (item.unitValue || 1) * (item.quantity || 1))}</div>
                              <button onClick={() => deleteItem(rIdx, iIdx)} className="text-[9px] text-[var(--red)] font-bold uppercase mt-4 opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  )}

                  {/* Room Footer */}
                  <div className="px-6 py-4 bg-[var(--bg-elevated)]/10 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <InputLabel label="Room Discount" className="flex-row items-center gap-3">
                        <NumberInput className="h-7 w-20" value={room.roomDiscountValue} onChange={(e) => updateRoom(rIdx, { roomDiscountValue: toNumber(e.target.value) })} />
                        <Select className="h-7 w-24 text-[10px]" value={room.roomDiscountType} onChange={(e) => updateRoom(rIdx, { roomDiscountType: e.target.value as any })}>
                          <option value="flat">Flat ₹</option><option value="percent">% Off</option>
                        </Select>
                      </InputLabel>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mr-3">Subtotal:</span>
                      <span className="text-base font-bold text-[var(--accent)]">{money(computed.summaryByRoom[rIdx]?.net)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "finance" && (
            <div className="max-w-[580px]">
              <div className="space-y-4">
                <div className="card p-6">
                  <h2 className="section-heading">Taxation & Charges</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <InputLabel label="Overall Discount"><NumberInput value={data.charges.overallDiscountValue} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, overallDiscountValue: toNumber(e.target.value) }}))} /></InputLabel>
                    <InputLabel label="Discount Type"><Select value={data.charges.overallDiscountType} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, overallDiscountType: e.target.value as any }}))}>
                      <option value="flat">Flat ₹</option><option value="percent">% Off</option>
                    </Select></InputLabel>
                    <InputLabel label="Packing (%)"><NumberInput value={data.charges.packingPercent} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, packingPercent: toNumber(e.target.value) }}))} /></InputLabel>
                    <InputLabel label="Loading (₹)"><NumberInput value={data.charges.loadingCharge} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, loadingCharge: toNumber(e.target.value) }}))} /></InputLabel>
                    <InputLabel label="GST (%)"><NumberInput value={data.charges.gstPercent} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, gstPercent: toNumber(e.target.value) }}))} /></InputLabel>
                    <InputLabel label="GST Mode"><Select value={data.charges.gstMode} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, gstMode: e.target.value as any }}))}>
                      <option value="excluded">Extra</option><option value="included">Inclusive</option>
                    </Select></InputLabel>
                  </div>
                </div>

                <div className="card p-6">
                  <h2 className="section-heading">Terms & Conditions</h2>
                  <div className="space-y-3">
                    {terms.map((t, i) => (
                      <div key={i} className="flex gap-3 group">
                        <div className="text-[10px] font-bold text-[var(--text-muted)] mt-2">#{i+1}</div>
                        <TextArea value={t} rows={1} className="min-h-8 text-[12px] py-1.5" onChange={(e) => {
                          const n = [...terms]; n[i] = e.target.value; setTerms(n);
                        }} />
                        <button onClick={() => setTerms(p => p.filter((_, idx) => idx !== i))} className="maple-btn-ghost text-[var(--red)] opacity-0 group-hover:opacity-100">✕</button>
                      </div>
                    ))}
                    <button onClick={() => setTerms(p => [...p, "New condition..."])} className="w-full py-2 border-2 border-dashed border-[var(--border)] rounded text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:border-[var(--accent)] transition-all">
                      + Add New Condition
                    </button>
                  </div>
                </div>
              </div>

              <div className="hidden">
                <h2 className="section-heading">Financial Summary</h2>
                <div className="space-y-4">
                  {computed.totals.lines.map(line => (
                    <div key={line.key} className={`flex justify-between items-center ${line.isLast ? 'pt-5 border-t border-[var(--border-subtle)] mt-5' : ''}`}>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">{line.label}</span>
                      <span className={`font-semibold tabular-nums ${line.isLast ? 'text-[18px] text-[var(--accent)] font-bold' : 'text-sm text-white'}`}>{money(line.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "payment" && (
            <div className="max-w-2xl card p-6">
              <h2 className="section-heading">Settlement Details</h2>
              <div className="space-y-4">
                <InputLabel label="UPI ID / VPA"><TextInput value={data.payment.upiId} onChange={(e) => updateData(p => ({ ...p, payment: { ...p.payment, upiId: e.target.value }}))} /></InputLabel>
                <div className="grid grid-cols-2 gap-4">
                  <InputLabel label="Bank"><TextInput value={data.payment.bankName} onChange={(e) => updateData(p => ({ ...p, payment: { ...p.payment, bankName: e.target.value }}))} /></InputLabel>
                  <InputLabel label="Holder"><TextInput value={data.payment.accountName} onChange={(e) => updateData(p => ({ ...p, payment: { ...p.payment, accountName: e.target.value }}))} /></InputLabel>
                  <InputLabel label="Account #"><TextInput value={data.payment.accountNumber} onChange={(e) => updateData(p => ({ ...p, payment: { ...p.payment, accountNumber: e.target.value }}))} /></InputLabel>
                  <InputLabel label="IFSC"><TextInput value={data.payment.ifsc} onChange={(e) => updateData(p => ({ ...p, payment: { ...p.payment, ifsc: e.target.value }}))} /></InputLabel>
                </div>
              </div>
            </div>
          )}

          {activeTab === "drafts" && (
            <div className="card p-6 min-h-[500px]">
              <div className="flex items-start justify-between">
                <h2 className="section-heading flex-1">Saved Drafts</h2>
                <button onClick={seedSampleData} className="maple-btn-secondary h-8 px-4 text-[10px]">+ Seed Samples</button>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {drafts.map(d => (
                  <div key={d.id} className="card p-6 group hover:border-[var(--accent)] transition-all relative">
                    <button onClick={() => { if(confirm("Load draft?")) setData(d.data); }} className="text-left w-full">
                      <div className="font-bold text-sm mb-1">{d.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{new Date(d.savedAt).toLocaleString()}</div>
                      <div className="divider" />
                      <div className="text-[11px] font-bold text-[var(--accent)]">{money(computeTotals(d.data).totals.grandTotal)}</div>
                    </button>
                    <button onClick={() => deleteDraft(d.id)} className="absolute top-4 right-4 text-[var(--red)] opacity-0 group-hover:opacity-100">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          </section>

          <aside className="hidden">
            <div className="card p-4">
              <h2 className="section-heading">Drafts</h2>
              <p className="mb-3 text-[11px] text-[var(--text-muted)]">Saved locally in this browser.</p>
              <div className="rounded-lg bg-[#09090b] p-3">
                {drafts.length === 0 ? (
                  <div className="text-[12px] text-[var(--text-muted)]">No drafts yet.</div>
                ) : (
                  <div className="space-y-2">
                    {drafts.slice(0, 4).map((draft) => (
                      <button key={draft.id} type="button" onClick={() => setData(draft.data)} className="w-full rounded-md px-2 py-2 text-left text-[12px] text-white hover:bg-[#18181b]">
                        <div className="font-semibold">{draft.name}</div>
                        <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">{new Date(draft.savedAt).toLocaleString()}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card p-4">
              <h2 className="section-heading">Totals</h2>
              <div className="space-y-3">
                {computed.totals.lines.map((line) => (
                  <div key={line.key} className={`flex items-center justify-between text-[12px] ${line.isLast ? "border-t border-[var(--border-subtle)] pt-3" : ""}`}>
                    <span className={line.emphasis ? "font-semibold text-white" : "text-[var(--text-secondary)]"}>{line.label}</span>
                    <span className={line.isLast ? "text-[16px] font-bold text-[var(--accent)]" : "font-semibold text-white"}>{money(line.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card max-h-[360px] overflow-hidden p-0">
              <LivePreviewPanel data={data} computed={computed} terms={terms} />
            </div>
          </aside>
        </div>
      </main>

      {/* LIVE PREVIEW PANEL */}
      <aside className="w-[340px] border-l border-[var(--border-subtle)] bg-[#111113] flex flex-col gap-4 p-4 overflow-y-auto">
        <div className="card p-4">
          <h2 className="section-heading">Live Preview</h2>
          <div className="max-h-[420px] overflow-y-auto rounded-lg bg-[#09090b]">
            <LivePreviewPanel data={data} computed={computed} terms={terms} />
          </div>
        </div>

        <div className="card p-4">
          <h2 className="section-heading">Financial Summary</h2>
          <div className="space-y-4">
            {computed.totals.lines.map(line => (
              <div key={line.key} className={`flex justify-between items-center ${line.isLast ? 'pt-5 border-t border-[var(--border-subtle)] mt-5' : ''}`}>
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">{line.label}</span>
                <span className={`font-semibold tabular-nums ${line.isLast ? 'text-[18px] text-[var(--accent)] font-bold' : 'text-sm text-white'}`}>{money(line.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* TOAST SYSTEM */}
      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}
      </div>

      {/* TEMPLATES MODAL */}
      {showTemplates && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="card w-full max-w-[460px] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold">Proposal Templates</h3>
              <button onClick={() => setShowTemplates(false)} className="maple-btn-ghost p-0 w-8 h-8">✕</button>
            </div>
            
            <div className="space-y-4">
              {[
                { type: 1, title: "Living Room Package", desc: "Sofa, TV Unit, Table, Display", items: 4 },
                { type: 2, title: "Full Home Renovation", desc: "Living, Master Bed, Kitchen, Bath", items: 8 },
                { type: 3, title: "Bedroom Set", desc: "King Bed, Wardrobe, Side Tables", items: 3 }
              ].map((temp) => (
                <div key={temp.type} className="card p-5 bg-[var(--bg-elevated)]/40 hover:border-[var(--accent)] transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm">{temp.title}</h4>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--accent)] font-bold">{temp.items} ITEMS</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mb-4">Includes {temp.desc.toLowerCase()}.</p>
                  <button onClick={() => applyTemplate(temp.type as any)} className="maple-btn-template w-full">Apply Template</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
