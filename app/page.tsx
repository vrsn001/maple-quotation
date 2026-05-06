"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import * as XLSX from "xlsx";
import { MAPLE_LOGO_B64 } from "./maple-logo-b64";

// Modular Imports
import { 
  QuoteData, QuoteItem, QuoteRoom, QuoteMeta, CompanyPayment, Draft, 
  UnitType, DiscountType, GstMode, TotalsResult 
} from "./lib/types";

import { 
  money, computeTotals, safeParse, newItem, newRoom, 
  makeId, todayISODate, toNumber, quickConvert, discountAmount 
} from "./lib/utils";
import { TEMPLATES } from "./lib/constants";

import { MasterProposalPdf } from "./components/PdfCatalog";
import { 
  LiveClock, InputLabel, TextInput, Select, TextArea, 
  NumberInput, BrandStyles, CreativeButton
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

function LivePreviewPanel({ data, computed, terms }: { data: QuoteData; computed: TotalsResult; terms: string[] }) {
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

  function addItem(roomIndex: number, template?: Partial<QuoteItem>) {
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
        const rows = XLSX.utils.sheet_to_json(ws) as Record<string, string | number>[];
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
    
    const templateData: QuoteData = { ...data, updatedAt: Date.now() };

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
    <div className="flex h-screen overflow-hidden bg-[#0d0d0f] text-[var(--text)]">

      {/* LEFT SIDEBAR */}
      <aside className="w-[220px] flex flex-col shrink-0 z-20" style={{ background: '#111114', borderRight: '1px solid #1e1e23' }}>
        <div style={{ padding: '20px 16px 16px' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#632a2a] flex items-center justify-center">
              <img src={MAPLE_LOGO_B64} alt="Logo" className="w-6 h-6 object-contain brightness-0" />
            </div>
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Maple Furnishers</div>
              <div style={{ fontSize: '11px', color: '#888896', marginTop: '2px' }}>Quotation Suite</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-0 space-y-0 custom-scroll overflow-y-auto">
          <div style={{ padding: '20px 16px 8px' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.18em', color: '#555560', textTransform: 'uppercase' }}>Navigation</span>
          </div>
          {[
            { id: "client", label: "Overview", icon: "▤" },
            { id: "rooms", label: "Rooms & Items", icon: "❖" },
            { id: "finance", label: "Finance & T&C", icon: "±" },
            { id: "payment", label: "Settlement", icon: "💳" },
            { id: "drafts", label: "Archives", icon: "📂" },
          ].map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => selectTab(item.id as typeof activeTab)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid #1e1e23', padding: '16px' }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: '11px', color: '#555560' }}>System time</span>
            <LiveClock />
          </div>
          <div className="space-y-[6px]">
            <div className="flex justify-between items-center">
              <span style={{ fontSize: '11px', color: '#555560' }}>Save Draft</span>
              <span style={{ background: '#232329', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', color: '#888896' }}>⌃S</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ fontSize: '11px', color: '#555560' }}>Export PDF</span>
              <span style={{ background: '#232329', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', color: '#888896' }}>⌃P</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ fontSize: '11px', color: '#555560' }}>Undo Change</span>
              <span style={{ background: '#232329', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', color: '#888896' }}>⌃Z</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ fontSize: '11px', color: '#555560' }}>New Quote</span>
              <span style={{ background: '#232329', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', color: '#888896' }}>⌃N</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* TOP BAR */}
        <header className="topbar">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span style={{ color: '#555560', fontSize: '14px' }}>#</span>
              <input
                value={data.quote.number}
                onChange={(e) => updateData(p => ({ ...p, quote: { ...p.quote, number: e.target.value }}))}
                style={{ background: 'transparent', border: 'none', fontSize: '15px', fontWeight: 700, color: '#ffffff', outline: 'none', width: '176px', fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
                placeholder="QUOTE-NO"
              />
            </div>
            <div className="live-edit-badge">
              <div className="live-edit-dot" />
              LIVE EDITING
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <button type="button" onClick={undo} className="maple-btn-icon" title="Undo (Ctrl+Z)">↺</button>
              <button type="button" onClick={redo} className="maple-btn-icon" title="Redo (Ctrl+Shift+Z)">↻</button>
            </div>
            
            <button type="button" onClick={openTemplates} style={{ background: 'transparent', border: 'none', fontSize: '13px', color: '#888896', fontWeight: 500, padding: '0 8px', cursor: 'pointer', fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}>Templates</button>
            <button type="button" onClick={shareQuote} style={{ background: 'transparent', border: 'none', fontSize: '13px', color: '#888896', fontWeight: 500, padding: '0 8px', cursor: 'pointer', fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}>Share</button>
            <CreativeButton onClick={saveDraft} variant="secondary" className="h-8 !px-4">Save Draft</CreativeButton>
            <CreativeButton onClick={onGeneratePdf} className="h-8 !px-4">Generate PDF</CreativeButton>
          </div>
        </header>


        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto custom-scroll" style={{ padding: '28px' }}>
          <section className="contents">
          
          {activeTab === "client" && (
            <div className="max-w-4xl space-y-6 animate-slide-up">
              <div className="card">
                <h2 className="section-heading">Client Information</h2>
                <div className="grid grid-cols-2 gap-5">
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

              <div className="card">
                <h2 className="section-heading">Proposal Configuration</h2>
                <div className="grid grid-cols-2 gap-5">
                  <InputLabel label="Quote Identifier">
                    <TextInput value={data.quote.number} onChange={(e) => updateData(p => ({ ...p, quote: { ...p.quote, number: e.target.value }}))} />
                  </InputLabel>
                  <InputLabel label="Submission Date">
                    <TextInput type="date" value={data.quote.date} onChange={(e) => updateData(p => ({ ...p, quote: { ...p.quote, date: e.target.value }}))} />
                  </InputLabel>
                  <InputLabel label="Validity Period (Days)">
                    <NumberInput value={data.quote.validityDays} onChange={(e) => updateData(p => ({ ...p, quote: { ...p.quote, validityDays: toNumber(e.target.value) }}))} />
                  </InputLabel>
                  <InputLabel label="Sales Executive">
                    <TextInput value={data.quote.salesPerson} onChange={(e) => updateData(p => ({ ...p, quote: { ...p.quote, salesPerson: e.target.value }}))} />
                  </InputLabel>
                  <div className="col-span-2">
                    <InputLabel label="Project / Site Name">
                      <TextInput value={data.quote.siteName} onChange={(e) => updateData(p => ({ ...p, quote: { ...p.quote, siteName: e.target.value }}))} placeholder="e.g. Skyline Residency" />
                    </InputLabel>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "rooms" && (
            <div className="space-y-6 animate-slide-up">
              <div style={{ background: '#18181b', border: '1px solid #2e2e33', borderRadius: '16px', padding: '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Project Inventory</h2>
                  <p style={{ fontSize: '12px', color: '#888896', marginTop: '4px' }}>Allocation by Room & Category</p>
                </div>
                <div className="flex gap-3">
                  <label className="creative-btn secondary cursor-pointer" style={{ height: '34px', padding: '0 16px' }}>
                    <span>📥 Import Excel</span>
                    <input type="file" className="hidden" accept=".xlsx,.xls" onChange={onImportExcel} />
                  </label>
                  <CreativeButton onClick={addRoom}>+ Create Room</CreativeButton>
                </div>
              </div>

              {data.rooms.map((room, rIdx) => (
                <div key={room.id} className="card overflow-hidden" style={{ padding: 0, marginBottom: '20px' }}>
                  <div className="room-header">
                    <div className="flex items-center flex-1">
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#632a2a', color: '#ffffff', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: '12px' }}>
                        {rIdx + 1}
                      </div>
                      <input
                        value={room.name}
                        onChange={(e) => updateRoom(rIdx, { name: e.target.value })}
                        className="room-name-input"
                        placeholder="Room Name (e.g. Master Bedroom)..."
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ background: '#232329', color: '#888896', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>{room.items.length} items</span>
                      <div className="w-[1px] h-4 bg-[#2e2e33] mx-2" />
                      <Select className="h-8 w-44 text-[10px]" onChange={(e) => {
                        const t = TEMPLATES.find(t => t.label === e.target.value);
                        if(t) addItem(rIdx, t);
                      }}>
                        <option value="">Quick Add Template...</option>
                        {TEMPLATES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                      </Select>
                      <CreativeButton onClick={() => addItem(rIdx)} variant="secondary" className="h-8 !px-3 text-[10px]">+ Item</CreativeButton>
                      <button onClick={() => deleteRoom(rIdx)} className="maple-btn-icon danger ml-1">✕</button>
                    </div>
                  </div>

                  {room.items.length === 0 ? (
                    <div className="empty-state" style={{ margin: '16px' }}>
                      <div className="empty-state-title">No items yet. Add your first item to this room.</div>
                    </div>
                  ) : (
                  <div className="overflow-x-auto">
                    <table className="maple-table">
                      <thead>
                        <tr>
                          <th className="w-[40%]">Item & Specification</th>
                          <th className="w-[20%]">Technical Detail</th>
                          <th className="w-[25%]">Commercials</th>
                          <th className="text-right w-[15%]">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {room.items.map((item, iIdx) => (
                          <tr key={item.id} className="group">
                            <td>
                              <div className="flex gap-4">
                                <div className="item-img-box">
                                  {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20 text-xl">📸</div>}
                                  <label className="item-img-overlay">
                                    REPLACE
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(rIdx, iIdx, e)} />
                                  </label>
                                </div>
                                <div className="flex-1 space-y-1.5">
                                  <input 
                                    value={item.category} 
                                    onChange={(e) => updateItem(rIdx, iIdx, { category: e.target.value })} 
                                    className="w-full bg-transparent border-none font-bold text-[14px] text-[var(--text)] focus:outline-none" 
                                    placeholder="Item Category..."
                                  />
                                  <textarea 
                                    value={item.description} 
                                    onChange={(e) => updateItem(rIdx, iIdx, { description: e.target.value })} 
                                    className="w-full bg-transparent border-none text-[12px] text-[var(--text-secondary)] focus:outline-none resize-none h-14 leading-relaxed"
                                    placeholder="Brief description or notes..."
                                  />
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-5">
                                  <InputLabel label="Material"><TextInput className="h-7 text-[10px] px-2" value={item.material} onChange={(e) => updateItem(rIdx, iIdx, { material: e.target.value })} /></InputLabel>
                                  <InputLabel label="Fabric"><TextInput className="h-7 text-[10px] px-2" value={item.fabric} onChange={(e) => updateItem(rIdx, iIdx, { fabric: e.target.value })} /></InputLabel>
                                </div>
                                <div>
                                  <span className="section-label mb-1.5 block">Size (L × W × H)</span>
                                  <div className="flex gap-1.5">
                                    {(['l', 'w', 'h'] as Array<keyof NonNullable<QuoteItem['dimensions']>>).map(d => (
                                      <NumberInput key={d} placeholder={d.toUpperCase()} className="h-7 text-[10px] px-1 text-center" value={item.dimensions?.[d]} onChange={(e) => updateItem(rIdx, iIdx, { dimensions: { ...item.dimensions!, [d]: toNumber(e.target.value) } })} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="grid grid-cols-2 gap-5">
                                <InputLabel label="Unit Rate"><NumberInput className="h-8 font-bold" value={item.price} onChange={(e) => updateItem(rIdx, iIdx, { price: toNumber(e.target.value) })} /></InputLabel>
                                <InputLabel label="Type"><Select className="h-8 text-[10px] px-1" value={item.unitType} onChange={(e) => updateItem(rIdx, iIdx, { unitType: e.target.value as UnitType })}>
                                  <option value="nos">NOS</option><option value="set">SET</option><option value="sqft">SQFT</option><option value="rft">RFT</option>
                                </Select></InputLabel>
                                <InputLabel label="Unit Value"><NumberInput className="h-8" value={item.unitValue} onChange={(e) => updateItem(rIdx, iIdx, { unitValue: toNumber(e.target.value) })} /></InputLabel>
                                <InputLabel label="Quantity"><NumberInput className="h-8" value={item.quantity} onChange={(e) => updateItem(rIdx, iIdx, { quantity: toNumber(e.target.value) })} /></InputLabel>
                              </div>
                            </td>
                            <td className="text-right">
                              <div className="text-[14px] font-bold text-[var(--text)] tabular-nums">{money((item.price || 0) * (item.unitValue || 1) * (item.quantity || 1))}</div>
                              <button onClick={() => deleteItem(rIdx, iIdx)} className="text-[10px] text-[var(--red)] font-bold uppercase mt-6 opacity-0 group-hover:opacity-100 transition-base hover:underline">Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  )}

                  {/* Room Footer */}
                  <div className="px-6 py-4 flex items-center justify-between" style={{ background: '#111114', borderTop: '1px solid #1e1e23' }}>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <span className="section-label mb-0">Room Discount</span>
                        <div className="flex gap-1.5">
                          <NumberInput className="h-8 w-20 px-2" value={room.roomDiscountValue} onChange={(e) => updateRoom(rIdx, { roomDiscountValue: toNumber(e.target.value) })} />
                          <Select className="h-8 w-24 text-[10px] px-1" value={room.roomDiscountType} onChange={(e) => updateRoom(rIdx, { roomDiscountType: e.target.value as DiscountType })}>
                            <option value="flat">Flat ₹</option><option value="percent">% Off</option>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="section-label mb-0 mr-3 inline-block">Room Net:</span>
                      <span className="text-lg font-bold text-[#632a2a] tabular-nums">{money(computed.summaryByRoom[rIdx]?.net)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}


          {activeTab === "finance" && (
            <div className="max-w-3xl space-y-6 animate-slide-up">
              <div className="card">
                <h2 className="section-heading">Financial Adjustments</h2>
                <div className="grid grid-cols-2 gap-5">
                  <InputLabel label="Global Discount">
                    <div className="flex gap-2">
                      <NumberInput value={data.charges.overallDiscountValue} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, overallDiscountValue: toNumber(e.target.value) }}))} />
                      <Select className="w-32" value={data.charges.overallDiscountType} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, overallDiscountType: e.target.value as DiscountType }}))}>
                        <option value="flat">Flat ₹</option><option value="percent">% Off</option>
                      </Select>
                    </div>
                  </InputLabel>
                  <InputLabel label="GST Configuration">
                    <div className="flex gap-2">
                      <NumberInput placeholder="Rate %" value={data.charges.gstPercent} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, gstPercent: toNumber(e.target.value) }}))} />
                      <Select className="w-32" value={data.charges.gstMode} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, gstMode: e.target.value as GstMode }}))}>
                        <option value="excluded">Extra</option><option value="included">Inclusive</option>
                      </Select>
                    </div>
                  </InputLabel>
                  <InputLabel label="Packing & Handling (%)">
                    <NumberInput value={data.charges.packingPercent} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, packingPercent: toNumber(e.target.value) }}))} />
                  </InputLabel>
                  <InputLabel label="Logistics / Loading (₹)">
                    <NumberInput value={data.charges.loadingCharge} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, loadingCharge: toNumber(e.target.value) }}))} />
                  </InputLabel>
                </div>
                <div className="mt-6 p-4 rounded-xl flex items-center justify-between" style={{ background: 'rgba(99,42,42,0.05)', border: '1px solid rgba(99,42,42,0.15)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#632a2a]" />
                    <span className="text-[12px] font-semibold text-[#88889a]">Split GST into CGST & SGST (9%+9%)</span>
                  </div>
                  <button 
                    onClick={() => updateData(p => ({ ...p, charges: { ...p.charges, splitCgstSgst: !p.charges.splitCgstSgst }}))}
                    className={`w-10 h-5 rounded-full transition-all relative ${data.charges.splitCgstSgst ? 'bg-[#632a2a]' : 'bg-[#22223a]'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${data.charges.splitCgstSgst ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="card">
                <h2 className="section-heading">Terms & Conditions</h2>
                <div className="space-y-4">
                  {terms.map((t, i) => (
                    <div key={i} className="flex gap-4 group items-start">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1" style={{ background: '#232329', border: '1px solid #38383f' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#888896' }}>{i+1}</span>
                      </div>
                      <TextArea 
                        value={t} 
                        style={{ height: '44px', minHeight: '44px', maxHeight: '44px', padding: '12px 14px', overflowY: 'hidden', resize: 'none', fontSize: '13px', lineHeight: '1.4' }}
                        onChange={(e) => {
                          const n = [...terms]; n[i] = e.target.value; setTerms(n);
                        }} 
                      />
                      <button onClick={() => setTerms(p => p.filter((_, idx) => idx !== i))} className="maple-btn-icon danger mt-2 opacity-0 group-hover:opacity-100">✕</button>
                    </div>
                  ))}
                  <button onClick={() => setTerms(p => [...p, "New condition..."])} style={{ width: '100%', padding: '14px', border: '1px dashed #2e2e33', borderRadius: '10px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555560', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}>
                    + Append New Term
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payment" && (
            <div className="max-w-2xl animate-slide-up">
              <div className="card">
                <h2 className="section-heading">Settlement Accounts</h2>
                <div className="space-y-6">
                  <InputLabel label="Digital Payments (UPI ID / VPA)">
                    <TextInput value={data.payment.upiId} onChange={(e) => updateData(p => ({ ...p, payment: { ...p.payment, upiId: e.target.value }}))} placeholder="e.g. maplefurnishers@axis" />
                  </InputLabel>
                  <div className="h-[1px] my-6" style={{ background: '#2e2e33' }} />
                  <div className="grid grid-cols-2 gap-5">
                    <InputLabel label="Bank Institution"><TextInput value={data.payment.bankName} onChange={(e) => updateData(p => ({ ...p, payment: { ...p.payment, bankName: e.target.value }}))} /></InputLabel>
                    <InputLabel label="Account Holder"><TextInput value={data.payment.accountName} onChange={(e) => updateData(p => ({ ...p, payment: { ...p.payment, accountName: e.target.value }}))} /></InputLabel>
                    <InputLabel label="Account Number"><TextInput value={data.payment.accountNumber} onChange={(e) => updateData(p => ({ ...p, payment: { ...p.payment, accountNumber: e.target.value }}))} /></InputLabel>
                    <InputLabel label="IFSC Branch Code"><TextInput value={data.payment.ifsc} onChange={(e) => updateData(p => ({ ...p, payment: { ...p.payment, ifsc: e.target.value }}))} /></InputLabel>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "drafts" && (
            <div className="space-y-6 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Saved Drafts</h2>
                  <p style={{ fontSize: '12px', color: '#888896', marginTop: '4px' }}>Saved locally in this browser</p>
                </div>
                <CreativeButton onClick={seedSampleData} variant="secondary" className="h-9 !px-4 text-[11px]">+ Seed Sample Data</CreativeButton>
              </div>

              {drafts.length === 0 ? (
                <div style={{ color: '#555560', textAlign: 'center', padding: '20px', border: '1px dashed #2e2e33', borderRadius: '8px', fontSize: '13px' }}>
                  No drafts yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {drafts.map(d => (
                    <div key={d.id} className="draft-card group">
                      <button onClick={() => { if(confirm("Load draft?")) setData(d.data); }} className="w-full text-left">
                        <div className="flex justify-between items-start mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#232329', border: '1px solid #38383f' }}>📄</div>
                          <div className="text-right">
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#632a2a' }}>{money(computeTotals(d.data).totals.grandTotal)}</div>
                            <div style={{ fontSize: '9px', color: '#888896', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginTop: '4px' }}>{d.data.rooms.length} Rooms</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }} className="truncate mb-1">{d.name}</div>
                        <div style={{ fontSize: '11px', color: '#888896' }} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-[#2e2e33]" />
                          {new Date(d.savedAt).toLocaleDateString()} at {new Date(d.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </button>
                      <button onClick={() => deleteDraft(d.id)} className="maple-btn-icon danger absolute top-3 right-3 opacity-0 group-hover:opacity-100 scale-90">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </section>
        </div>
      </main>

      {/* LIVE PREVIEW PANEL */}
      <aside className="w-[360px] flex flex-col overflow-hidden shrink-0 z-20" style={{ background: '#0d0d0f', borderLeft: '1px solid #1e1e23' }}>
        <div className="p-5 flex items-center justify-between sticky top-0 z-10" style={{ borderBottom: '1px solid #1e1e23', background: '#0d0d0f' }}>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Summary & Preview</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              <span style={{ fontSize: '10px', color: '#555560' }}>Real-time sync</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={onGeneratePdf} className="maple-btn-icon" title="Preview Full PDF">⬈</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="fin-header">Financial Summary</div>
            <div>
              {computed.totals.lines.map(line => (
                <div
                  key={line.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: line.isLast ? '12px 0 0' : '7px 0',
                    marginTop: line.isLast ? '4px' : 0,
                    borderBottom: line.isLast ? 'none' : '1px solid #1a1a1f',
                    borderTop: line.isLast ? '1px solid #2e2e33' : 'none',
                  }}
                >
                  <span style={{ 
                    fontSize: line.isLast ? '16px' : '13px', 
                    fontWeight: line.isLast ? 800 : 400, 
                    color: line.isLast ? '#632a2a' : '#888896' 
                  }}>
                    {line.label}
                  </span>
                  <span style={{ 
                    fontSize: line.isLast ? '16px' : '13px', 
                    fontWeight: line.isLast ? 800 : 500, 
                    color: line.isLast ? '#632a2a' : '#e4e4e7' 
                  }} className="tabular-nums">
                    {money(line.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="preview-container">
            <div className="flex items-center justify-between mb-4">
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#555560', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Proposal Preview</span>
              <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#232329', color: '#555560' }}>DRAFT</span>
            </div>
            <div className="max-h-[500px] overflow-y-auto rounded-lg bg-white shadow-2xl relative custom-scroll ring-1 ring-black/10">
              {!data.client.name ? (
                <div className="preview-placeholder">
                  Fill in client details to see preview
                </div>
              ) : (
                <LivePreviewPanel data={data} computed={computed} terms={terms} />
              )}
            </div>
          </div>
        </div>
      </aside>


      {/* TOAST SYSTEM */}
      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}
      </div>

      {/* TEMPLATES MODAL */}
      {showTemplates && (
        <div className="modal-overlay">
          <div className="modal-box max-w-[500px]">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Proposal Templates</h3>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold mt-1">Pre-configured Inventory Packages</p>
              </div>
              <button onClick={() => setShowTemplates(false)} className="maple-btn-icon">✕</button>
            </div>
            
            <div className="modal-body space-y-4">
              {[
                { type: 1, title: "Living Room Package", desc: "Sofa Set, TV Console, Coffee Table, Display Unit", items: 4, icon: "🛋️" },
                { type: 2, title: "Full Home Renovation", desc: "Living, Master Bedroom, Modular Kitchen, Bathroom", items: 12, icon: "🏠" },
                { type: 3, title: "Master Bedroom Set", desc: "King Size Bed, 4-Door Wardrobe, Pair of Side Tables", items: 3, icon: "🛏️" }
              ].map((temp) => (
                <div key={temp.type} className="card p-5 bg-[var(--bg-elevated)]/40 hover:border-[var(--accent)] transition-base group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center text-xl group-hover:scale-110 transition-base">{temp.icon}</div>
                      <div>
                        <h4 className="font-bold text-sm text-[var(--text)]">{temp.title}</h4>
                        <span className="badge badge-accent mt-1">{temp.items} ITEMS</span>
                      </div>
                    </div>
                  </div>
                    <p className="text-[12px] text-[var(--text-secondary)] mb-5 leading-relaxed">Includes {temp.desc}. Perfect for quick estimates.</p>
                  <CreativeButton onClick={() => applyTemplate(temp.type as 1 | 2 | 3)} className="w-full !rounded-xl !h-10">Apply Template</CreativeButton>
                  </div>
                ))}
              </div>
  
              <div className="modal-footer">
                <CreativeButton onClick={() => setShowTemplates(false)} variant="secondary" className="h-10 !px-8 !rounded-xl">Close</CreativeButton>
              </div>
          </div>
        </div>
      )}

    </div>
  );
}
