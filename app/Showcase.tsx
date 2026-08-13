"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  defaultSettings,
  seedCases,
  seedProducts,
  seedServices,
  type CaseStudy,
  type Product,
  type Service,
  type SiteSettings,
} from "./catalog-data";

type Catalogue = {
  products: Product[];
  services: Service[];
  cases: CaseStudy[];
  settings: SiteSettings;
};

type SelectedItem =
  | { type: "product"; item: Product }
  | { type: "service"; item: Service }
  | null;

const financialCategories = new Set(["Banking", "Payments", "Lending", "Wallets", "Cards"]);
const intelligenceCategories = new Set(["AI", "Cybersecurity", "Compliance"]);

function productImage(category: string) {
  if (financialCategories.has(category)) return "/catalogue-finance.png";
  if (intelligenceCategories.has(category)) return "/catalogue-intelligence.png";
  return "/catalogue-enterprise.png";
}

function serviceImage(index: number) {
  return ["/catalogue-intelligence.png", "/catalogue-enterprise.png", "/catalogue-finance.png", "/catalogue-intelligence.png"][index % 4];
}

export default function Showcase() {
  const [catalogue, setCatalogue] = useState<Catalogue>({
    products: seedProducts,
    services: seedServices,
    cases: seedCases,
    settings: defaultSettings,
  });
  const [mode, setMode] = useState<"products" | "services">("products");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SelectedItem>(null);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [leadProduct, setLeadProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetch("/api/catalog")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setCatalogue)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    document.body.style.overflow = selected || meetingOpen || leadProduct ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selected, meetingOpen, leadProduct]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(catalogue.products.map((product) => product.category)))],
    [catalogue.products],
  );

  const products = catalogue.products.filter(
    (product) =>
      (category === "All" || product.category === category) &&
      `${product.name} ${product.shortDescription} ${product.category}`.toLowerCase().includes(search.toLowerCase()),
  );

  const services = catalogue.services.filter((service) =>
    `${service.name} ${service.shortDescription}`.toLowerCase().includes(search.toLowerCase()),
  );

  const openMeeting = () => catalogue.settings.meetingEnabled && setMeetingOpen(true);

  return (
    <main className="catalog-app">
      <header className="app-bar">
        <div className="app-brand">
          <img src="/mytm-logo.svg" alt="MYTM" />
          <span />
          <strong>Product Catalogue</strong>
        </div>
        <label className="top-search">
          <span>⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products and services"
            aria-label="Search products and services"
          />
          {search && <button onClick={() => setSearch("")} aria-label="Clear search">×</button>}
        </label>
        <div className="app-bar-actions">
          <a href="/admin" aria-label="Open admin panel">Admin</a>
          <button onClick={openMeeting}>{catalogue.settings.meetingLabel}</button>
        </div>
      </header>

      <div className="app-frame">
        <aside className="catalog-sidebar">
          <div className="sidebar-section">
            <small>CATALOGUE</small>
            <button className={mode === "products" ? "active" : ""} onClick={() => setMode("products")}>
              <i>▦</i><span>Products</span><b>{catalogue.products.length}</b>
            </button>
            <button className={mode === "services" ? "active" : ""} onClick={() => setMode("services")}>
              <i>◇</i><span>Services</span><b>{catalogue.services.length}</b>
            </button>
          </div>
          {mode === "products" && (
            <div className="sidebar-section category-list">
              <small>CATEGORIES</small>
              {categories.map((item) => (
                <button className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)}>
                  <i>{item === "All" ? "•" : item.slice(0, 2).toUpperCase()}</i><span>{item}</span>
                </button>
              ))}
            </div>
          )}
          <div className="sidebar-help">
            <div>?</div>
            <strong>Need help choosing?</strong>
            <p>Talk to a MYTM specialist.</p>
            <button onClick={openMeeting}>Book a meeting</button>
          </div>
        </aside>

        <section className="catalog-main">
          <div className="mobile-search-row">
            <label className="mobile-search">
              <span>⌕</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search catalogue" />
            </label>
          </div>

          <div className="catalog-heading">
            <div>
              <span className="welcome-pill">MYTM DIGITAL CATALOGUE</span>
              <h1>{mode === "products" ? "All products" : "Professional services"}</h1>
              <p>
                {mode === "products"
                  ? "Browse MYTM's complete technology portfolio. Tap any product to view details."
                  : "Explore specialist services for technology delivery, quality and security."}
              </p>
            </div>
            <div className="view-summary">
              <strong>{mode === "products" ? products.length : services.length}</strong>
              <span>{mode === "products" ? "products" : "services"}</span>
            </div>
          </div>

          <div className="mobile-mode-switch" role="tablist" aria-label="Catalogue type">
            <button className={mode === "products" ? "active" : ""} onClick={() => setMode("products")}>Products <b>{catalogue.products.length}</b></button>
            <button className={mode === "services" ? "active" : ""} onClick={() => setMode("services")}>Services <b>{catalogue.services.length}</b></button>
          </div>

          {mode === "products" && (
            <div className="catalog-chips" aria-label="Product categories">
              {categories.map((item) => (
                <button className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)}>{item}</button>
              ))}
            </div>
          )}

          {mode === "products" ? (
            <div className="catalog-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onOpen={() => setSelected({ type: "product", item: product })} />
              ))}
            </div>
          ) : (
            <div className="catalog-grid services-catalog-grid">
              {services.map((service, index) => (
                <ServiceCard key={service.id} service={service} index={index} onOpen={() => setSelected({ type: "service", item: service })} />
              ))}
            </div>
          )}

          {mode === "products" && products.length === 0 && (
            <div className="catalog-empty"><span>⌕</span><h2>No products found</h2><p>Try another category or search term.</p><button onClick={() => { setSearch(""); setCategory("All"); }}>Show all products</button></div>
          )}
        </section>
      </div>

      <nav className="app-bottom-nav" aria-label="Mobile catalogue navigation">
        <button className={mode === "products" ? "active" : ""} onClick={() => setMode("products")}><i>▦</i><span>Products</span></button>
        <button className={mode === "services" ? "active" : ""} onClick={() => setMode("services")}><i>◇</i><span>Services</span></button>
        <button onClick={openMeeting}><i>□</i><span>Meeting</span></button>
        <a href="/admin"><i>⚙</i><span>Admin</span></a>
      </nav>

      {selected?.type === "product" && (
        <ProductPanel
          product={selected.item}
          onClose={() => setSelected(null)}
          onMeeting={openMeeting}
          onDeck={() => {
            if (selected.item.requireLead && !sessionStorage.getItem("mytm-lead-captured")) {
              setLeadProduct(selected.item);
            } else if (selected.item.pdfUrl) {
              window.open(selected.item.pdfUrl, "_blank", "noopener,noreferrer");
            } else {
              setLeadProduct(selected.item);
            }
          }}
        />
      )}
      {selected?.type === "service" && (
        <ServicePanel service={selected.item} onClose={() => setSelected(null)} onMeeting={openMeeting} />
      )}
      {meetingOpen && <MeetingModal settings={catalogue.settings} onClose={() => setMeetingOpen(false)} />}
      {leadProduct && (
        <LeadModal
          catalogue={catalogue}
          product={leadProduct}
          onClose={() => setLeadProduct(null)}
          onSuccess={() => {
            sessionStorage.setItem("mytm-lead-captured", "true");
            const url = leadProduct.pdfUrl;
            setLeadProduct(null);
            if (url) window.open(url, "_blank", "noopener,noreferrer");
          }}
        />
      )}
    </main>
  );
}

function ProductCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
  return (
    <article className="catalog-card">
      <button className="card-image-button" onClick={onOpen} aria-label={`View ${product.name}`}>
        <img src={productImage(product.category)} alt="" />
        <span className="card-category">{product.category}</span>
        {product.featured && <span className="card-featured">Featured</span>}
      </button>
      <div className="catalog-card-body">
        <h2>{product.name}</h2>
        <p>{product.shortDescription}</p>
        <div className="card-info-row">
          <span>{product.videoUrl ? "▶ Video" : "Overview"}</span>
          <span>{product.pdfUrl ? "▤ PDF" : "Deck on request"}</span>
        </div>
        <button className="open-card" onClick={onOpen}>View details <span>›</span></button>
      </div>
    </article>
  );
}

function ServiceCard({ service, index, onOpen }: { service: Service; index: number; onOpen: () => void }) {
  return (
    <article className="catalog-card service-catalog-card">
      <button className="card-image-button" onClick={onOpen} aria-label={`View ${service.name}`}>
        <img src={serviceImage(index)} alt="" />
        <span className="card-category">Service</span>
      </button>
      <div className="catalog-card-body">
        <h2>{service.name}</h2>
        <p>{service.shortDescription}</p>
        <div className="service-mini-features">{service.features.slice(0, 3).map((feature) => <span key={feature}>{feature}</span>)}</div>
        <button className="open-card" onClick={onOpen}>View service <span>›</span></button>
      </div>
    </article>
  );
}

function ProductPanel({ product, onClose, onMeeting, onDeck }: { product: Product; onClose: () => void; onMeeting: () => void; onDeck: () => void }) {
  return (
    <div className="panel-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="detail-panel" role="dialog" aria-modal="true" aria-label={product.name}>
        <button className="panel-close" onClick={onClose} aria-label="Close">×</button>
        <div className="detail-picture"><img src={productImage(product.category)} alt="" /><span>{product.category}</span></div>
        <div className="detail-content">
          <small>MYTM PRODUCT</small>
          <h2>{product.name}</h2>
          <p className="detail-lead">{product.shortDescription}</p>
          <p className="detail-description">{product.fullDescription}</p>
          <section><h3>Key features</h3><div className="feature-list">{product.features.map((feature) => <div key={feature}><i>✓</i><span>{feature}</span></div>)}</div></section>
          <section><h3>Business benefits</h3><div className="benefit-list">{product.benefits.map((benefit) => <span key={benefit}>{benefit}</span>)}</div></section>
        </div>
        <div className="detail-actions"><button className="outline-action" onClick={onDeck}>{product.pdfUrl ? "View PDF" : "Request PDF"}</button><button className="red-action" onClick={onMeeting}>Book a demo</button></div>
      </aside>
    </div>
  );
}

function ServicePanel({ service, onClose, onMeeting }: { service: Service; onClose: () => void; onMeeting: () => void }) {
  return (
    <div className="panel-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="detail-panel" role="dialog" aria-modal="true" aria-label={service.name}>
        <button className="panel-close" onClick={onClose} aria-label="Close">×</button>
        <div className="detail-picture"><img src="/catalogue-enterprise.png" alt="" /><span>Professional service</span></div>
        <div className="detail-content">
          <small>MYTM SERVICE</small><h2>{service.name}</h2><p className="detail-lead">{service.shortDescription}</p>
          <section><h3>Capabilities</h3><div className="feature-list">{service.features.map((feature) => <div key={feature}><i>✓</i><span>{feature}</span></div>)}</div></section>
        </div>
        <div className="detail-actions"><button className="red-action full-action" onClick={onMeeting}>{service.cta || "Book a consultation"}</button></div>
      </aside>
    </div>
  );
}

function MeetingModal({ settings, onClose }: { settings: SiteSettings; onClose: () => void }) {
  const connected = settings.calendlyUrl && settings.calendlyUrl !== "https://calendly.com/";
  return (
    <div className="app-modal-backdrop">
      <section className="app-modal calendar-app-modal" role="dialog" aria-modal="true">
        <header><div><small>MYTM CALENDAR</small><h2>Book a meeting</h2></div><button onClick={onClose}>×</button></header>
        {connected ? (
          <iframe title="Book a meeting with MYTM" src={settings.calendlyUrl} />
        ) : (
          <div className="calendar-not-connected"><span>31</span><h3>Calendar is ready to connect</h3><p>Add your Calendly link in the Admin panel. It will automatically work on every product and service.</p><a href="/admin">Open Admin</a></div>
        )}
      </section>
    </div>
  );
}

function LeadModal({ catalogue, product, onClose, onSuccess }: { catalogue: Catalogue; product: Product; onClose: () => void; onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...values, source: "Product Deck", contentAccessed: product.name, productInterest: product.name, serviceInterest: "None" }) });
      if (!response.ok) throw new Error();
      onSuccess();
    } catch {
      setError("Please check your details and try again."); setSaving(false);
    }
  }
  const config = catalogue.settings.formConfig;
  return (
    <div className="app-modal-backdrop"><section className="app-modal lead-app-modal" role="dialog" aria-modal="true"><header><div><small>PRODUCT DECK</small><h2>Enter your details</h2><p>We will only ask once during this session.</p></div><button onClick={onClose}>×</button></header><form onSubmit={submit}><label>Full name<input name="name" required={config.requireName} /></label><label>Contact number<input name="phone" required={config.requirePhone} /></label><label>Business email<input name="email" type="email" required={config.requireEmail} /></label><label>Company name<input name="company" required={config.requireCompany} /></label><label>Notes<textarea name="notes" rows={3} required={config.requireNotes} placeholder="What are you interested in?" /></label>{error && <p className="lead-error">{error}</p>}<button disabled={saving}>{saving ? "Submitting..." : product.pdfUrl ? "Continue to PDF" : "Request product deck"}</button></form></section></div>
  );
}
