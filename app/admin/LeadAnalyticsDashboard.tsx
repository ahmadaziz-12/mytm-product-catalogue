"use client";

import { useMemo, useState } from "react";

type Lead = {
  id: number;
  name: string;
  company: string;
  request_type: string;
  product_interest: string;
  service_interest: string;
  source: string;
  status: string;
  created_at: string;
};

type DashboardData = {
  products: Array<{ active: boolean }>;
  services: Array<{ active: boolean }>;
  leads: Lead[];
  calendarConnected: boolean;
};

type DatePreset = "all" | "today" | "7" | "30" | "custom";

const chartColors = ["#d71936", "#7257e8", "#168aad", "#d9911c", "#79737a"];

function dateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function presetBounds(preset: DatePreset) {
  if (preset === "all" || preset === "custom") return { from: "", to: "" };
  const to = new Date();
  const from = new Date(to);
  if (preset === "7") from.setDate(from.getDate() - 6);
  if (preset === "30") from.setDate(from.getDate() - 29);
  return { from: dateKey(from), to: dateKey(to) };
}

function groupCount<T>(items: T[], value: (item: T) => string) {
  return items.reduce<Record<string, number>>((map, item) => {
    const key = value(item) || "Unspecified";
    map[key] = (map[key] || 0) + 1;
    return map;
  }, {});
}

export default function LeadAnalyticsDashboard({ data, onNavigate }: { data: DashboardData; onNavigate: (tab: "Products" | "Leads" | "Meetings" | "Calendar Setup") => void }) {
  const [preset, setPreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("all");
  const presetRange = presetBounds(preset);
  const from = preset === "custom" ? customFrom : presetRange.from;
  const to = preset === "custom" ? customTo : presetRange.to;

  const sources = useMemo(() => Array.from(new Set(data.leads.map((lead) => lead.source).filter(Boolean))).sort(), [data.leads]);
  const statuses = useMemo(() => Array.from(new Set(data.leads.map((lead) => lead.status).filter(Boolean))).sort(), [data.leads]);
  const filtered = useMemo(() => data.leads.filter((lead) => {
    const created = lead.created_at.slice(0, 10);
    return (!from || created >= from) && (!to || created <= to) && (source === "all" || lead.source === source) && (status === "all" || lead.status === status);
  }), [data.leads, from, to, source, status]);

  const stats = [
    ["Leads in view", filtered.length, "Matches active filters"],
    ["New leads", filtered.filter((lead) => lead.status.toLowerCase() === "new").length, "Awaiting first action"],
    ["Demo requests", filtered.filter((lead) => lead.request_type.toLowerCase() === "demo").length, "Meeting intent"],
    ["PDF requests", filtered.filter((lead) => lead.request_type.toLowerCase() === "pdf").length, "Content intent"],
  ] as const;

  const interestCounts = groupCount(filtered, (lead) => lead.product_interest !== "None" ? lead.product_interest : lead.service_interest !== "None" ? lead.service_interest : "Unspecified");
  const topInterests = Object.entries(interestCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxInterest = Math.max(1, ...topInterests.map(([, count]) => count));
  const requestMix = Object.entries(groupCount(filtered, (lead) => lead.request_type || "General")).sort((a, b) => b[1] - a[1]);
  let cursor = 0;
  const pieStops = requestMix.map(([, count], index) => {
    const start = cursor;
    cursor += filtered.length ? (count / filtered.length) * 100 : 0;
    return `${chartColors[index % chartColors.length]} ${start}% ${cursor}%`;
  });
  const pieBackground = filtered.length ? `conic-gradient(${pieStops.join(",")})` : "conic-gradient(#ebe7e8 0 100%)";

  const trend = useMemo(() => {
    const dayCounts = groupCount(filtered, (lead) => lead.created_at.slice(0, 10));
    const newest = filtered.length ? new Date(Math.max(...filtered.map((lead) => new Date(lead.created_at).getTime()))) : new Date();
    const days = Array.from({ length: 14 }, (_, index) => {
      const day = new Date(newest);
      day.setDate(day.getDate() - (13 - index));
      const key = dateKey(day);
      return { key, label: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }), value: dayCounts[key] || 0 };
    });
    return days;
  }, [filtered]);
  const trendMax = Math.max(1, ...trend.map((point) => point.value));
  const linePoints = trend.map((point, index) => `${30 + (index / (trend.length - 1)) * 540},${185 - (point.value / trendMax) * 145}`).join(" ");

  const clearFilters = () => { setPreset("all"); setCustomFrom(""); setCustomTo(""); setSource("all"); setStatus("all"); };
  const rangeLabel = preset === "all" ? "All recorded leads" : preset === "today" ? "Today" : preset === "7" ? "Last 7 days" : preset === "30" ? "Last 30 days" : `${customFrom || "Start"} to ${customTo || "Today"}`;

  return <div className="lead-analytics-dashboard">
    <section className="analytics-hero">
      <div><small>REVENUE INTELLIGENCE</small><h2>Lead performance, clearly understood.</h2><p>Monitor demand, prospect intent and follow-up priorities from one live operating view.</p></div>
      <div className="analytics-hero-status"><span><i /> LIVE DATA</span><strong>{filtered.length}</strong><small>leads in the current view</small><button onClick={() => onNavigate("Leads")}>Manage leads →</button></div>
    </section>

    <section className="analytics-filter-bar" aria-label="Dashboard filters">
      <div><small>DATE PERIOD</small><select value={preset} onChange={(event) => setPreset(event.target.value as DatePreset)}><option value="all">All time</option><option value="today">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="custom">Custom range</option></select></div>
      <div><small>FROM DATE</small><input type="date" value={from} onChange={(event) => { setPreset("custom"); setCustomFrom(event.target.value); }} /></div>
      <div><small>TO DATE</small><input type="date" value={to} onChange={(event) => { setPreset("custom"); setCustomTo(event.target.value); }} /></div>
      <div><small>SOURCE</small><select value={source} onChange={(event) => setSource(event.target.value)}><option value="all">All sources</option>{sources.map((item) => <option value={item} key={item}>{item}</option>)}</select></div>
      <div><small>STATUS</small><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{statuses.map((item) => <option value={item} key={item}>{item}</option>)}</select></div>
      <button onClick={clearFilters}>Reset</button>
    </section>

    <div className="analytics-kpis">{stats.map(([label, value, note], index) => <article key={label}><span className={`analytics-kpi-icon kpi-${index}`}>{["◎", "＋", "◷", "↓"][index]}</span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div></article>)}</div>

    <div className="analytics-chart-grid">
      <section className="analytics-card trend-card">
        <header><div><small>LEAD VOLUME</small><h3>Lead activity over time</h3><p>Daily submissions · latest 14 days in selected view</p></div><span>{rangeLabel}</span></header>
        <div className="line-chart-wrap">
          <svg viewBox="0 0 600 220" role="img" aria-label="Daily lead submissions line chart">
            {[40, 76, 112, 148, 184].map((y) => <line key={y} x1="30" x2="570" y1={y} y2={y} className="chart-gridline" />)}
            <polyline points={linePoints} className="lead-line" />
            {trend.map((point, index) => <circle key={point.key} cx={30 + (index / (trend.length - 1)) * 540} cy={185 - (point.value / trendMax) * 145} r="4" className="lead-point"><title>{point.label}: {point.value} lead{point.value === 1 ? "" : "s"}</title></circle>)}
          </svg>
          <div className="line-axis-labels"><span>{trend[0].label}</span><span>{trend[6].label}</span><span>{trend[13].label}</span></div>
        </div>
      </section>

      <section className="analytics-card mix-card">
        <header><div><small>REQUEST MIX</small><h3>What prospects request</h3><p>Share of filtered leads by request type</p></div></header>
        <div className="pie-chart-layout"><div className="pie-chart" style={{ background: pieBackground }}><div><strong>{filtered.length}</strong><span>Total</span></div></div><div className="pie-legend">{requestMix.map(([label, value], index) => <div key={label}><i style={{ background: chartColors[index % chartColors.length] }} /><span>{label}</span><strong>{value}</strong><small>{filtered.length ? Math.round((value / filtered.length) * 100) : 0}%</small></div>)}{!requestMix.length && <p>No lead data in this range.</p>}</div></div>
      </section>

      <section className="analytics-card interest-card">
        <header><div><small>DEMAND SIGNALS</small><h3>Top product and service interests</h3><p>Filtered leads ranked by stated interest</p></div></header>
        <div className="bar-chart">{topInterests.map(([label, value]) => <div key={label}><div><span>{label}</span><strong>{value}</strong></div><i><b style={{ width: `${(value / maxInterest) * 100}%` }} /></i></div>)}{!topInterests.length && <p>No interest data in this range.</p>}</div>
      </section>

      <section className="analytics-card recent-card">
        <header><div><small>RECENT ACTIVITY</small><h3>Latest leads in this view</h3><p>Operational follow-up queue</p></div><button onClick={() => onNavigate("Leads")}>View all →</button></header>
        <div className="analytics-recent-list">{filtered.slice(0, 5).map((lead) => <button key={lead.id} onClick={() => onNavigate("Leads")}><span>{lead.name.slice(0, 1).toUpperCase()}</span><div><strong>{lead.name}</strong><small>{lead.company || lead.source}</small></div><em>{lead.request_type}</em><time>{new Date(lead.created_at).toLocaleDateString()}</time></button>)}{!filtered.length && <p>No leads match the selected filters.</p>}</div>
      </section>
    </div>

    <section className="analytics-footer-strip"><div><small>CATALOGUE STATUS</small><strong>{data.products.filter((item) => item.active).length} products · {data.services.filter((item) => item.active).length} services live</strong></div><div><small>CALENDAR</small><strong>{data.calendarConnected ? "Google Calendar connected" : "Calendar setup required"}</strong></div><button onClick={() => onNavigate("Products")}>Manage catalogue</button><button onClick={() => onNavigate(data.calendarConnected ? "Meetings" : "Calendar Setup")}>Manage meetings</button></section>
  </div>;
}
