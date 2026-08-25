"use client";

import { useEffect, useMemo, useState } from "react";

export type ManagedLead = {
  id: number;
  name: string;
  phone: string;
  email: string;
  company: string;
  designation: string;
  preferred_date: string;
  request_type: string;
  notes: string;
  product_interest: string;
  service_interest: string;
  source: string;
  content_accessed: string;
  status: string;
  created_at: string;
};

type CatalogueOption = { name: string };

const blankLead: Partial<ManagedLead> = {
  request_type: "General",
  product_interest: "None",
  service_interest: "None",
  source: "Manual",
  status: "New",
  notes: "",
  preferred_date: "",
};

export default function LeadManagement({ leads, products, services, onSave, onDelete }: {
  leads: ManagedLead[];
  products: CatalogueOption[];
  services: CatalogueOption[];
  onSave: (lead: Record<string, unknown>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<ManagedLead | null>(null);
  const [editing, setEditing] = useState<Partial<ManagedLead> | null>(null);
  const statuses = useMemo(() => Array.from(new Set(leads.map((lead) => lead.status))).sort(), [leads]);
  const shown = leads.filter((lead) => {
    const matchesQuery = `${lead.name} ${lead.company} ${lead.email} ${lead.phone} ${lead.designation} ${lead.product_interest} ${lead.service_interest} ${lead.request_type} ${lead.notes}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (status === "all" || lead.status === status);
  });
  const remove = async (lead: ManagedLead) => {
    if (!confirm(`Delete ${lead.name}'s lead record? This cannot be undone.`)) return;
    await onDelete(lead.id);
    setSelected(null);
  };
  return <div className="lead-management">
    <section className="lead-management-hero"><div><small>LEAD MANAGEMENT</small><h2>Every prospect, fully actionable.</h2><p>Add offline enquiries, update follow-up details and keep your pipeline clean from one workspace.</p></div><button onClick={() => setEditing({ ...blankLead })}><span>＋</span>Add manual lead</button></section>
    <section className="lead-management-stats"><article><small>TOTAL LEADS</small><strong>{leads.length}</strong><span>All captured records</span></article><article><small>NEW</small><strong>{leads.filter((lead) => lead.status === "New").length}</strong><span>Awaiting action</span></article><article><small>DEMO INTENT</small><strong>{leads.filter((lead) => lead.request_type === "Demo").length}</strong><span>Meeting requests</span></article><article><small>MANUAL</small><strong>{leads.filter((lead) => lead.source === "Manual").length}</strong><span>Added by your team</span></article></section>
    <section className="admin-panel lead-management-panel">
      <div className="lead-management-toolbar"><label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, company, email or interest…" /></label><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select><span>{shown.length} of {leads.length} leads</span><button onClick={() => downloadLeads(shown)}>Export CSV ↓</button></div>
      <div className="lead-management-table">
        <div className="lead-management-row labels"><span>Prospect</span><span>Interest</span><span>Request</span><span>Status</span><span>Received</span><span>Actions</span></div>
        {shown.map((lead) => <div className="lead-management-row" key={lead.id} role="button" tabIndex={0} onClick={() => setSelected(lead)} onKeyDown={(event) => { if (event.key === "Enter") setSelected(lead); }}>
          <span className="lead-person"><i>{lead.name.slice(0, 1).toUpperCase()}</i><b>{lead.name}<small>{lead.company || "No company"}<br />{lead.email}</small></b></span>
          <span><strong>{lead.product_interest !== "None" ? lead.product_interest : lead.service_interest !== "None" ? lead.service_interest : "Not specified"}</strong><small>{lead.designation || "Designation not supplied"}</small></span>
          <span><strong>{lead.request_type}</strong><small>{lead.source}</small></span>
          <span><i className={`lead-status status-${lead.status.toLowerCase().replace(/[^a-z]+/g, "-")}`}>● {lead.status}</i></span>
          <span><strong>{new Date(lead.created_at).toLocaleDateString()}</strong><small>{new Date(lead.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></span>
          <span className="lead-row-actions"><button onClick={(event) => { event.stopPropagation(); setEditing(lead); }}>Edit</button><button onClick={(event) => { event.stopPropagation(); void remove(lead); }} aria-label={`Delete ${lead.name}`}>×</button></span>
        </div>)}
      </div>
      {!shown.length && <div className="lead-management-empty"><span>⌕</span><h3>No leads found</h3><p>Change the filters or add a new manual lead.</p></div>}
    </section>
    {selected && <LeadDetails lead={selected} onClose={() => setSelected(null)} onEdit={() => { setEditing(selected); setSelected(null); }} onDelete={() => void remove(selected)} />}
    {editing && <LeadEditor lead={editing} products={products} services={services} onClose={() => setEditing(null)} onSave={async (lead) => { await onSave(lead); setEditing(null); }} />}
  </div>;
}

function LeadEditor({ lead, products, services, onClose, onSave }: { lead: Partial<ManagedLead>; products: CatalogueOption[]; services: CatalogueOption[]; onClose: () => void; onSave: (lead: Record<string, unknown>) => Promise<void> }) {
  const [draft, setDraft] = useState({ ...blankLead, ...lead });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof ManagedLead, value: string) => setDraft({ ...draft, [key]: value });
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try { await onSave(draft as Record<string, unknown>); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to save lead"); setSaving(false); }
  };
  return <div className="editor-backdrop"><aside className="editor-panel lead-editor"><header><div><small>{lead.id ? `LEAD #${lead.id}` : "MANUAL ENTRY"}</small><h2>{lead.id ? "Edit lead" : "Add a new lead"}</h2></div><button onClick={onClose} aria-label="Close lead editor">×</button></header><form onSubmit={submit}>
    <div className="editor-grid"><label>Full name<input required value={draft.name || ""} onChange={(event) => set("name", event.target.value)} /></label><label>Business email<input required type="email" value={draft.email || ""} onChange={(event) => set("email", event.target.value)} /></label></div>
    <div className="editor-grid"><label>Contact number<input value={draft.phone || ""} onChange={(event) => set("phone", event.target.value)} /></label><label>Company<input value={draft.company || ""} onChange={(event) => set("company", event.target.value)} /></label></div>
    <div className="editor-grid"><label>Designation<input value={draft.designation || ""} onChange={(event) => set("designation", event.target.value)} /></label><label>Status<select value={draft.status || "New"} onChange={(event) => set("status", event.target.value)}><option>New</option><option>Contacted</option><option>Qualified</option><option>Proposal</option><option>Won</option><option>Closed</option></select></label></div>
    <div className="editor-grid"><label>Request type<select value={draft.request_type || "General"} onChange={(event) => set("request_type", event.target.value)}><option>General</option><option>Demo</option><option>PDF</option><option>Talk to Sales</option></select></label><label>Preferred demo date<input type="date" value={draft.preferred_date || ""} onChange={(event) => set("preferred_date", event.target.value)} /></label></div>
    <div className="editor-grid"><label>Product interest<select value={draft.product_interest || "None"} onChange={(event) => set("product_interest", event.target.value)}><option>None</option>{products.map((item) => <option key={item.name}>{item.name}</option>)}<option>Something else</option></select></label><label>Service interest<select value={draft.service_interest || "None"} onChange={(event) => set("service_interest", event.target.value)}><option>None</option>{services.map((item) => <option key={item.name}>{item.name}</option>)}<option>Something else</option></select></label></div>
    <div className="editor-grid"><label>Lead source<input value={draft.source || "Manual"} onChange={(event) => set("source", event.target.value)} placeholder="Manual, Event, Referral…" /></label><label>Content accessed<input value={draft.content_accessed || ""} onChange={(event) => set("content_accessed", event.target.value)} placeholder="Deck or product page" /></label></div>
    <label>Notes<textarea rows={5} value={draft.notes || ""} onChange={(event) => set("notes", event.target.value)} placeholder="Customer context, requirements or next action…" /></label>
    {error && <p className="lead-editor-error">{error}</p>}
    <div className="editor-actions"><button type="button" onClick={onClose}>Cancel</button><button disabled={saving}>{saving ? "Saving…" : lead.id ? "Save changes" : "Add lead"}</button></div>
  </form></aside></div>;
}

function LeadDetails({ lead, onClose, onEdit, onDelete }: { lead: ManagedLead; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  const [copied, setCopied] = useState("");
  useEffect(() => { const close = (event: KeyboardEvent) => event.key === "Escape" && onClose(); window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]);
  const interest = lead.product_interest !== "None" ? lead.product_interest : lead.service_interest !== "None" ? lead.service_interest : lead.content_accessed || "Not specified";
  const copy = async (value: string, label: string) => { if (!value) return; await navigator.clipboard.writeText(value); setCopied(label); window.setTimeout(() => setCopied(""), 1600); };
  const summary = [`Name: ${lead.name}`, `Email: ${lead.email}`, `Phone: ${lead.phone || "Not supplied"}`, `Company: ${lead.company || "Not supplied"}`, `Designation: ${lead.designation || "Not supplied"}`, `Status: ${lead.status}`, `Request: ${lead.request_type}`, `Interest: ${interest}`, `Preferred date: ${lead.preferred_date || "Not requested"}`, `Notes: ${lead.notes || "No notes"}`].join("\n");
  return <div className="lead-detail-backdrop"><section className="lead-detail-modal" role="dialog" aria-modal="true" aria-label={`Lead details for ${lead.name}`}>
    <header><div className="lead-detail-avatar">{lead.name.slice(0, 1).toUpperCase()}</div><div><small>LEAD #{lead.id}</small><h2>{lead.name}</h2><p>{lead.designation || "Designation not supplied"}{lead.company ? ` · ${lead.company}` : ""}</p></div><button onClick={onClose} aria-label="Close lead details">×</button></header>
    <div className="lead-detail-summary"><div><small>REQUEST</small><strong>{lead.request_type}</strong></div><div><small>STATUS</small><strong className="lead-status-live">● {lead.status}</strong></div><div><small>RECEIVED</small><strong>{new Date(lead.created_at).toLocaleString()}</strong></div></div>
    <div className="lead-detail-body"><section><div className="lead-section-title"><small>CONTACT</small><h3>Prospect information</h3></div><div className="lead-info-grid"><div><small>EMAIL</small><strong>{lead.email}</strong><button onClick={() => copy(lead.email, "Email")}>{copied === "Email" ? "Copied ✓" : "Copy"}</button></div><div><small>PHONE</small><strong>{lead.phone || "Not supplied"}</strong>{lead.phone && <button onClick={() => copy(lead.phone, "Phone")}>{copied === "Phone" ? "Copied ✓" : "Copy"}</button>}</div><div><small>COMPANY</small><strong>{lead.company || "Not supplied"}</strong></div><div><small>DESIGNATION</small><strong>{lead.designation || "Not supplied"}</strong></div></div></section><section className="lead-intent-card"><div><small>PRIMARY INTEREST</small><h3>{interest}</h3><p>{lead.source} · {lead.request_type}</p></div>{lead.preferred_date && <div className="lead-date-card"><span>{new Date(`${lead.preferred_date}T00:00:00`).getDate()}</span><div><small>PREFERRED DEMO DATE</small><strong>{new Date(`${lead.preferred_date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</strong></div></div>}</section><section><div className="lead-section-title"><small>CUSTOMER CONTEXT</small><h3>Notes</h3></div><div className={`lead-notes ${lead.notes ? "" : "empty"}`}>{lead.notes || "No notes have been added."}</div></section></div>
    <footer><span>{copied ? `${copied} copied` : "Lead record ready for action"}</span><button className="lead-delete-action" onClick={onDelete}>Delete</button><button className="lead-edit-action" onClick={onEdit}>Edit lead</button><button onClick={() => copy(summary, "All details")}>{copied === "All details" ? "Copied ✓" : "Copy all details"}</button></footer>
  </section></div>;
}

function downloadLeads(leads: ManagedLead[]) {
  const headers = ["Name", "Phone", "Email", "Company", "Designation", "Request Type", "Preferred Date", "Product", "Service", "Notes", "Source", "Status", "Date"];
  const rows = leads.map((lead) => [lead.name, lead.phone, lead.email, lead.company, lead.designation, lead.request_type, lead.preferred_date, lead.product_interest, lead.service_interest, lead.notes, lead.source, lead.status, lead.created_at]);
  const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = "mytm-leads.csv"; anchor.click(); URL.revokeObjectURL(url);
}
