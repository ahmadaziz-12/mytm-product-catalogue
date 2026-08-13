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

function videoEmbedUrl(url: string) {
  const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return "";
}

function isDirectVideo(url: string) {
  return url.startsWith("/api/media") || /\.(mp4|webm|ogg)(?:\?|$)/i.test(url);
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
  const [welcomeOpen, setWelcomeOpen] = useState(true);

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

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const activity = () => {
      clearTimeout(timer);
      setWelcomeOpen(false);
      if (!selected && !meetingOpen && !leadProduct) timer = setTimeout(() => setWelcomeOpen(true), 45_000);
    };
    if (!welcomeOpen && !selected && !meetingOpen && !leadProduct) timer = setTimeout(() => setWelcomeOpen(true), 45_000);
    window.addEventListener("pointerdown", activity, true);
    window.addEventListener("keydown", activity, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", activity, true);
      window.removeEventListener("keydown", activity, true);
    };
  }, [welcomeOpen, selected, meetingOpen, leadProduct]);

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
          <strong>Interactive Catalogue</strong>
        </div>
        <nav className="top-catalog-nav" aria-label="Catalogue navigation">
          <button className={mode === "products" ? "active" : ""} onClick={() => { setMode("products"); document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" }); }}>Products</button>
          <button className={mode === "services" ? "active" : ""} onClick={() => { setMode("services"); document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" }); }}>Services</button>
          <button onClick={() => document.getElementById("partners")?.scrollIntoView({ behavior: "smooth" })}>Partners & clients</button>
        </nav>
        <div className="app-bar-actions">
          <button onClick={openMeeting}>{catalogue.settings.meetingLabel}</button>
        </div>
      </header>

      <div className="app-frame">
        <section className="catalog-main">
          <section className="catalog-story" aria-labelledby="catalog-story-title">
            <div className="story-copy">
              <span>MYTM DIGITAL EXPERIENCE CENTRE</span>
              <h1 id="catalog-story-title">Touch. Discover.<br /><em>Transform.</em></h1>
              <p>Explore the technology powering modern finance. Tap any product or service to see its story, watch a demo, open its deck or meet our team.</p>
              <div className="story-actions">
                <button onClick={() => document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" })}>Explore catalogue</button>
                <button onClick={openMeeting}>Talk to MYTM</button>
              </div>
            </div>
            <div className="story-visual">
              <img src="/finova-cover.png" alt="MYTM digital lending and AI product experience" />
              <div><strong>{catalogue.products.length}+</strong><span>Products</span></div>
              <div><strong>{catalogue.services.length}</strong><span>Services</span></div>
            </div>
          </section>

          <section className="partner-showcase" id="partners" aria-labelledby="partners-title">
            <div className="partner-heading">
              <span>TRUSTED ECOSYSTEM</span>
              <h2 id="partners-title">Our partners & clients</h2>
              <p>Built alongside organizations shaping payments, banking, lending and digital transformation.</p>
            </div>
            <img src="/mytm-partners-clients.png" alt="MYTM partners and clients including RentRacks, 1Bill, Mastercard, PayFast, SAMA, RIDE, Rabee and others" />
          </section>

          <div className="catalogue-toolbar" id="catalogue">
            <div className="catalogue-mode-switch" role="tablist" aria-label="Catalogue type">
              <button className={mode === "products" ? "active" : ""} onClick={() => setMode("products")}><span>Products</span><b>{catalogue.products.length}</b></button>
              <button className={mode === "services" ? "active" : ""} onClick={() => setMode("services")}><span>Services</span><b>{catalogue.services.length}</b></button>
            </div>
            <label className="catalog-search">
              <span>Search</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a product or service" aria-label="Search catalogue" />
              {search && <button onClick={() => setSearch("")} aria-label="Clear search">×</button>}
            </label>
          </div>

          <div className="catalog-heading">
            <div>
              <span className="welcome-pill">EXPLORE THE CATALOGUE</span>
              <h2>{mode === "products" ? "Products built for progress" : "Services that move you forward"}</h2>
              <p>
                {mode === "products"
                  ? "Tap a card to explore capabilities, watch videos, view product decks and book a tailored demonstration."
                  : "Discover expert support for delivery, quality, security and technology transformation."}
              </p>
            </div>
            <div className="view-summary">
              <strong>{mode === "products" ? products.length : services.length}</strong>
              <span>{mode === "products" ? "products" : "services"}</span>
            </div>
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

          <section className="catalogue-cta">
            <div><span>READY TO GO DEEPER?</span><h2>Let’s build your next digital financial experience.</h2></div>
            <button onClick={openMeeting}>{catalogue.settings.meetingLabel}</button>
          </section>
        </section>
      </div>

      <nav className="app-bottom-nav" aria-label="Mobile catalogue navigation">
        <button className={mode === "products" ? "active" : ""} onClick={() => setMode("products")}><span>Products</span></button>
        <button className={mode === "services" ? "active" : ""} onClick={() => setMode("services")}><span>Services</span></button>
        <button onClick={() => document.getElementById("partners")?.scrollIntoView({ behavior: "smooth" })}><span>Clients</span></button>
        <button onClick={openMeeting}><span>Meeting</span></button>
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
      {welcomeOpen && (
        <section className="idle-experience" aria-label="Welcome to the MYTM catalogue">
          <video autoPlay muted loop playsInline poster="/finova-cover.png" src="/api/media?key=finova-product-video.mp4"><track kind="captions" src="/empty.vtt" srcLang="en" label="English" /></video>
          <div className="idle-shade" />
          <div className="idle-content">
            <img src="/mytm-logo.svg" alt="MYTM" />
            <span>MYTM DIGITAL EXPERIENCE CENTRE</span>
            <h1>Touch to see MYTM’s products & services</h1>
            <p>Step into the future of finance. Explore solutions, watch product stories and connect with our team.</p>
            <button onClick={() => setWelcomeOpen(false)}>Touch anywhere to explore</button>
          </div>
        </section>
      )}
    </main>
  );
}

function ProductCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
  return (
    <article className="catalog-card">
      <button className="card-image-button" onClick={onOpen} aria-label={`View ${product.name}`}>
        <img src={product.thumbnailUrl || productImage(product.category)} alt={`${product.name} catalogue visual`} />
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
        <img src={service.thumbnailUrl || serviceImage(index)} alt={`${service.name} service visual`} />
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
  const embedUrl = product.videoUrl ? videoEmbedUrl(product.videoUrl) : "";
  return (
    <div className="panel-backdrop" role="button" tabIndex={0} aria-label="Close product details" onKeyDown={(event) => event.key === "Escape" && onClose()} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="detail-panel" role="dialog" aria-modal="true" aria-label={product.name}>
        <button className="panel-close" onClick={onClose} aria-label="Close">×</button>
        <div className="detail-picture"><img src={product.thumbnailUrl || productImage(product.category)} alt="" /><span>{product.category}</span></div>
        <div className="detail-content">
          <small>MYTM PRODUCT</small>
          <h2>{product.name}</h2>
          <p className="detail-lead">{product.shortDescription}</p>
          <p className="detail-description">{product.fullDescription}</p>
          {product.videoUrl && <section className="detail-media"><h3>Product video</h3>{isDirectVideo(product.videoUrl) ? <video controls playsInline preload="metadata" poster={product.thumbnailUrl || productImage(product.category)} src={product.videoUrl}><track kind="captions" src="/empty.vtt" srcLang="en" label="English" /></video> : embedUrl ? <iframe title={`${product.name} video`} src={embedUrl} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /> : <a href={product.videoUrl} target="_blank" rel="noreferrer">Watch product video ↗</a>}</section>}
          <section><h3>Key features</h3><div className="feature-list">{product.features.map((feature) => <div key={feature}><i>✓</i><span>{feature}</span></div>)}</div></section>
          <section><h3>Business benefits</h3><div className="benefit-list">{product.benefits.map((benefit) => <span key={benefit}>{benefit}</span>)}</div></section>
        </div>
        <div className="detail-actions"><button className="outline-action" onClick={onDeck}>{product.pdfUrl ? "View PDF" : "Request PDF"}</button><button className="red-action" onClick={onMeeting}>Book a demo</button></div>
      </aside>
    </div>
  );
}

function ServicePanel({ service, onClose, onMeeting }: { service: Service; onClose: () => void; onMeeting: () => void }) {
  const embedUrl = service.videoUrl ? videoEmbedUrl(service.videoUrl) : "";
  return (
    <div className="panel-backdrop" role="button" tabIndex={0} aria-label="Close service details" onKeyDown={(event) => event.key === "Escape" && onClose()} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="detail-panel" role="dialog" aria-modal="true" aria-label={service.name}>
        <button className="panel-close" onClick={onClose} aria-label="Close">×</button>
        <div className="detail-picture"><img src={service.thumbnailUrl || "/catalogue-enterprise.png"} alt="" /><span>Professional service</span></div>
        <div className="detail-content">
          <small>MYTM SERVICE</small><h2>{service.name}</h2><p className="detail-lead">{service.shortDescription}</p>
          {service.videoUrl && <section className="detail-media"><h3>Service video</h3>{isDirectVideo(service.videoUrl) ? <video controls playsInline preload="metadata" poster={service.thumbnailUrl || "/catalogue-enterprise.png"} src={service.videoUrl}><track kind="captions" src="/empty.vtt" srcLang="en" label="English" /></video> : embedUrl ? <iframe title={`${service.name} video`} src={embedUrl} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /> : <a href={service.videoUrl} target="_blank" rel="noreferrer">Watch service video ↗</a>}</section>}
          <section><h3>Capabilities</h3><div className="feature-list">{service.features.map((feature) => <div key={feature}><i>✓</i><span>{feature}</span></div>)}</div></section>
        </div>
        <div className="detail-actions">{service.pdfUrl && <button className="outline-action" onClick={() => window.open(service.pdfUrl, "_blank", "noopener,noreferrer")}>View deck</button>}<button className="red-action" onClick={onMeeting}>{service.cta || "Book a consultation"}</button></div>
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
      const response = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...values, source: "Product Deck", contentAccessed: product.name, productInterest: values.productInterest || product.name, serviceInterest: values.serviceInterest || "None" }) });
      if (!response.ok) throw new Error();
      onSuccess();
    } catch {
      setError("Please check your details and try again."); setSaving(false);
    }
  }
  const config = catalogue.settings.formConfig;
  return (
    <div className="app-modal-backdrop"><section className="app-modal lead-app-modal" role="dialog" aria-modal="true"><header><div><small>PRODUCT DECK</small><h2>Enter your details</h2><p>Tell us what interests you, then continue to the deck.</p></div><button onClick={onClose}>×</button></header><form onSubmit={submit}><label>Full name<input name="name" required={config.requireName} /></label><label>Contact number<input name="phone" required={config.requirePhone} /></label><label>Business email<input name="email" type="email" required={config.requireEmail} /></label><label>Company name<input name="company" required={config.requireCompany} /></label>{config.showProductInterest && <label>Product interest<select name="productInterest" defaultValue={product.name}><option value="None">None</option>{catalogue.products.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}<option value="Something else">Something else</option></select></label>}{config.showServiceInterest && <label>Service interest<select name="serviceInterest" defaultValue="None"><option value="None">None</option>{catalogue.services.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}<option value="Something else">Something else</option></select></label>}<label>Notes / something else<textarea name="notes" rows={3} required={config.requireNotes} placeholder="What are you most interested in?" /></label>{error && <p className="lead-error">{error}</p>}<button disabled={saving}>{saving ? "Submitting..." : product.pdfUrl ? "Continue to deck" : "Request product deck"}</button></form></section></div>
  );
}
