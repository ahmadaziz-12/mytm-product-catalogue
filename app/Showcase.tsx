"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  Bank,
  CaretLeft,
  CaretRight,
  CardsThree,
  CheckCircle,
  Cube,
  FilePdf,
  MagnifyingGlass,
  Robot,
  ShieldCheck,
  Sparkle,
  Stack,
  Wallet,
  X,
} from "@phosphor-icons/react";
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

type AssistantRecommendation = { type: "product" | "service"; id: number; name: string; category: string };
type AssistantMessage = { role: "user" | "assistant"; content: string; recommendations?: AssistantRecommendation[]; poweredBy?: "openai" | "catalogue" };
type RequestKind = "demo" | "pdf";

const heroSlides = [
  { eyebrow: "FINOVA INTELLIGENCE", title: "AI Financial Analyst", copy: "Decision-ready financial intelligence for faster forecasting, analysis and executive action.", image: "/product-financial-analyst.jpg", match: /financial analyst/i, accent: "AI · FINANCE" },
  { eyebrow: "DIGITAL LENDING", title: "LOS / LMS", copy: "A connected origination and servicing platform for the complete credit lifecycle.", image: "/product-los-lms.jpg", match: /los\s*\/\s*lms/i, accent: "LENDING · AUTOMATION" },
  { eyebrow: "TRUSTED COMPLIANCE", title: "CompliClear AML/KYC", copy: "Automated identity checks, risk screening and ongoing compliance monitoring in one flow.", image: "/product-complyclear.jpg", match: /compliclear/i, accent: "AML · KYC" },
  { eyebrow: "SMARTER RECOVERY", title: "AI Collection Management", copy: "Prioritize accounts, automate outreach and improve recovery performance with intelligent insights.", image: "/product-collection-management.jpg", match: /collection management/i, accent: "AI · COLLECTIONS" },
  { eyebrow: "DIGITAL RESILIENCE", title: "Cyber Security", copy: "Enterprise protection, continuous monitoring and operational resilience for critical platforms.", image: "/card-cybersecurity.jpg", match: /cyber security/i, accent: "SECURITY · TRUST" },
] as const;

const categoryImages: Record<string, string> = {
  Banking: "/card-banking.jpg",
  Payments: "/card-banking.jpg",
  Lending: "/card-banking.jpg",
  Wallets: "/card-banking.jpg",
  Cards: "/card-banking.jpg",
  AI: "/card-ai.jpg",
  Cybersecurity: "/card-cybersecurity.jpg",
  Compliance: "/card-cybersecurity.jpg",
  Government: "/card-government.jpg",
  PropTech: "/card-proptech.jpg",
  Travel: "/card-travel.jpg",
  Education: "/card-education.jpg",
  Enterprise: "/card-enterprise.jpg",
};

function productImage(product: Product) {
  const productAssets: Array<[RegExp, string]> = [
    [/financial analyst/i, "/product-financial-analyst.jpg"],
    [/collection management/i, "/product-collection-management.jpg"],
    [/compliclear|aml\/kyc/i, "/product-complyclear.jpg"],
    [/los\s*\/\s*lms|loan origination|loan management/i, "/product-los-lms.jpg"],
  ];
  const matchedAsset = productAssets.find(([pattern]) => pattern.test(product.name));
  if (matchedAsset) return matchedAsset[1];
  if (product.thumbnailUrl && !product.thumbnailUrl.startsWith("/catalogue-")) return product.thumbnailUrl;
  return categoryImages[product.category] || "/card-enterprise.jpg";
}
function productDisplayName(product: Product) {
  return /^ai financial analyst$/i.test(product.name) ? "Finova AI Financial Analyst" : product.name;
}

function serviceImage(service: Service, index = 0) {
  if (service.thumbnailUrl && !service.thumbnailUrl.startsWith("/catalogue-")) return service.thumbnailUrl;
  const name = service.name.toLowerCase();
  if (name.includes("cyber")) return "/card-cybersecurity.jpg";
  if (name.includes("devops")) return "/card-devops.jpg";
  if (name.includes("resource") || name.includes("staff")) return "/card-team.jpg";
  return ["/card-enterprise.jpg", "/card-devops.jpg", "/card-team.jpg"][index % 3];
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
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [requestKind, setRequestKind] = useState<RequestKind>("demo");
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    fetch("/api/catalog")
      .then((response) => (response.ok ? (response.json() as Promise<Catalogue>) : Promise.reject()))
      .then((data) => {
        setCatalogue(data);
        const params = new URLSearchParams(window.location.search);
        const productSlug = params.get("product");
        const requested = params.get("request");
        const initial = productSlug
          ? data.products.find((product) => product.slug === productSlug)
          : undefined;
        if (initial) setSelected({ type: "product", item: initial });
        if (requested === "pdf" || requested === "demo") setRequestKind(requested);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    document.body.style.overflow = meetingOpen || selected?.type === "service" ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [meetingOpen, selected]);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible"));
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [mode, category, search, catalogue]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setHeroSlide((current) => (current + 1) % heroSlides.length), 6_500);
    return () => window.clearInterval(timer);
  }, []);

  const productPriority = ["AI Financial Analyst", "AI Collection Management", "CompliClear AML/KYC Solution", "LOS / LMS"];
  const products = catalogue.products.filter(
    (product) =>
      (category === "All" || product.category === category) &&
      `${product.name} ${product.shortDescription} ${product.category}`.toLowerCase().includes(search.toLowerCase()),
  ).sort((a, b) => {
    const aPriority = productPriority.findIndex((name) => a.name.toLowerCase().includes(name.toLowerCase().replace(" Solution", "")));
    const bPriority = productPriority.findIndex((name) => b.name.toLowerCase().includes(name.toLowerCase().replace(" Solution", "")));
    return (aPriority === -1 ? 99 : aPriority) - (bPriority === -1 ? 99 : bPriority) || a.displayOrder - b.displayOrder;
  });

  const services = catalogue.services.filter((service) =>
    `${service.name} ${service.shortDescription}`.toLowerCase().includes(search.toLowerCase()),
  );

  const openMeeting = () => catalogue.settings.meetingEnabled && setMeetingOpen(true);
  const openAssistantRecommendation = (recommendation: AssistantRecommendation) => {
    if (recommendation.type === "product") {
      const product = catalogue.products.find((item) => item.id === recommendation.id);
      if (product) { setSelected({ type: "product", item: product }); setRequestKind("demo"); }
    } else {
      const service = catalogue.services.find((item) => item.id === recommendation.id);
      if (service) setSelected({ type: "service", item: service });
    }
  };

  const activeProduct = selected?.type === "product" ? selected.item : undefined;

  const clearProductSelection = () => {
    setSelected(null);
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("product");
    nextUrl.searchParams.delete("request");
    window.history.replaceState({}, "", nextUrl);
  };

  const selectProduct = (product: Product, kind: RequestKind = requestKind) => {
    setSelected({ type: "product", item: product });
    setRequestKind(kind);
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("product", product.slug);
    nextUrl.searchParams.set("request", kind);
    window.history.replaceState({}, "", nextUrl);
    window.requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 820px)").matches) {
        document.getElementById("product-request-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };

  const exploreHeroSlide = () => {
    const product = catalogue.products.find((item) => heroSlides[heroSlide].match.test(item.name));
    if (!product) return;
    selectProduct(product, "demo");
    window.requestAnimationFrame(() => document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <main className="product-os">
      <header className="os-header">
        {/* A native anchor avoids router-only runtime failures when this catalogue is served through the Vercel proxy. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="os-brand" href="/" aria-label="MYTM catalogue home">
          <img src="/mytm-registered-logo.png" alt="MYTM" />
          <span><strong>Product Catalogue</strong><small>Digital Experience Centre</small></span>
        </a>
        <nav className="os-nav" aria-label="Catalogue navigation">
          <button className={mode === "products" ? "active" : ""} onClick={() => { setMode("products"); clearProductSelection(); document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" }); }}>Products</button>
          <button className={mode === "services" ? "active" : ""} onClick={() => { setMode("services"); clearProductSelection(); document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" }); }}>Services</button>
          <button onClick={() => document.getElementById("partners")?.scrollIntoView({ behavior: "smooth" })}>Partners &amp; Clients</button>
        </nav>
        <div className="os-header-actions">
          <label className="os-search os-header-search">
            <MagnifyingGlass size={19} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${mode}`} aria-label={`Search ${mode}`} />
            {search && <button onClick={() => setSearch("")} aria-label="Clear search"><X size={15} /></button>}
          </label>
          <button className="os-sales" onClick={openMeeting}>Talk to Sales</button>
        </div>
        <div className="os-header-accent" aria-hidden="true" />
      </header>

      <section className="os-hero os-hero-carousel" aria-labelledby="product-os-title">
        <div className="os-hero-media" aria-hidden="true">
          {heroSlides.map((slide, index) => <img key={slide.title} className={index === heroSlide ? "active" : ""} src={slide.image} alt="" />)}
        </div>
        <div className="os-hero-scrim" />
        <div className="os-hero-copy">
          <span>{heroSlides[heroSlide].eyebrow}</span>
          <h1 id="product-os-title">{heroSlides[heroSlide].title}</h1>
          <p>{heroSlides[heroSlide].copy}</p>
          <div className="os-hero-actions"><button onClick={exploreHeroSlide}>Explore solution <ArrowRight size={17} /></button><small>{heroSlides[heroSlide].accent}</small></div>
        </div>
        <div className="os-hero-controls">
          <button onClick={() => setHeroSlide((heroSlide - 1 + heroSlides.length) % heroSlides.length)} aria-label="Previous showcase"><CaretLeft size={18} /></button>
          <div>{heroSlides.map((slide, index) => <button key={slide.title} className={index === heroSlide ? "active" : ""} onClick={() => setHeroSlide(index)} aria-label={`Show ${slide.title}`} />)}</div>
          <span>{String(heroSlide + 1).padStart(2, "0")} / {String(heroSlides.length).padStart(2, "0")}</span>
          <button onClick={() => setHeroSlide((heroSlide + 1) % heroSlides.length)} aria-label="Next showcase"><CaretRight size={18} /></button>
        </div>
      </section>

      <section className="os-catalogue" id="catalogue">
        <div className="os-toolbar">
          {mode === "products" ? (
            <div className="os-categories" aria-label="Product categories">
              {[
                ["All", Cube], ["AI", Sparkle], ["Compliance", ShieldCheck], ["Lending", Stack],
                ["Payments", Wallet], ["Banking", Bank], ["Cards", CardsThree], ["Enterprise", Cube],
              ].map(([item, Icon]) => (
                <button key={String(item)} className={category === item ? "active" : ""} onClick={() => { setCategory(String(item)); clearProductSelection(); }}>
                  <Icon size={19} weight="duotone" /><span>{item === "All" ? "All Products" : item}</span>
                </button>
              ))}
            </div>
          ) : <div className="os-section-title"><span>MYTM SERVICES</span><strong>Expertise that moves ideas into production.</strong></div>}
        </div>

        {mode === "products" ? (
          <div className={`os-workspace ${activeProduct ? "has-selection" : "is-browsing"}`}>
            <div className="os-product-grid">
              {products.map((product) => (
                <OSProductCard key={product.id} product={product} active={activeProduct?.id === product.id} onOpen={() => selectProduct(product)} />
              ))}
              {!products.length && <div className="os-empty"><MagnifyingGlass size={30} /><h2>No products found</h2><p>Try another category or search term.</p><button onClick={() => { setSearch(""); setCategory("All"); }}>Show all products</button></div>}
            </div>
            {activeProduct && (
              <OSProductRail
                product={activeProduct}
                kind={requestKind}
                onKindChange={(kind) => selectProduct(activeProduct, kind)}
                onClose={clearProductSelection}
              />
            )}
          </div>
        ) : (
          <div className="os-service-grid">
            {services.map((service, index) => <OSServiceCard key={service.id} service={service} index={index} onOpen={() => setSelected({ type: "service", item: service })} />)}
          </div>
        )}
      </section>

      <section className="os-partners" id="partners">
        <div><span>TRUSTED ECOSYSTEM</span><h2>Our partners &amp; clients</h2><p>Built alongside organizations shaping payments, banking, lending and digital transformation.</p></div>
        <img src="/mytm-partners-clients.png" alt="MYTM partners and clients" />
      </section>

      <footer className="os-footer">
        <section className="os-footer-cta">
          <div><span>BUILD WHAT FINANCE NEEDS NEXT</span><h2>Turn your next fintech idea into a working product.</h2><p>Explore the catalogue, find the right capability and start a focused conversation with MYTM.</p></div>
          <button onClick={openMeeting}>Talk to Sales <ArrowRight size={18} /></button>
        </section>
        <div className="os-footer-main">
          <div className="os-footer-brand"><img src="/mytm-registered-logo.png" alt="MYTM" /><p>Technology, products and delivery expertise for modern financial institutions.</p><span><i /> PRODUCT CATALOGUE · ONLINE</span></div>
          <nav aria-label="Footer catalogue navigation"><strong>Explore</strong><button onClick={() => { setMode("products"); clearProductSelection(); document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" }); }}>Products</button><button onClick={() => { setMode("services"); clearProductSelection(); document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" }); }}>Services</button><button onClick={() => document.getElementById("partners")?.scrollIntoView({ behavior: "smooth" })}>Partners &amp; clients</button></nav>
          <div><strong>Connect</strong><a href={`mailto:${catalogue.settings.contactEmail}`}>{catalogue.settings.contactEmail}</a>{catalogue.settings.contactNumber && <a href={`tel:${catalogue.settings.contactNumber.replace(/\s/g, "")}`}>{catalogue.settings.contactNumber}</a>}<button onClick={openMeeting}>Schedule a conversation</button></div>
          <div><strong>Workspace</strong><a href="/admin">Backoffice admin</a><button onClick={() => setAssistantOpen(true)}>Ask MYTM AI</button><small>Secure access for MYTM teams</small></div>
        </div>
        <div className="os-footer-bottom"><span>© {new Date().getFullYear()} MYTM. All rights reserved.</span><span>Payments · Banking · Lending · AI · Compliance</span></div>
      </footer>

      <button className={`os-ai-trigger ${activeProduct ? "form-open" : ""}`} onClick={() => setAssistantOpen(true)}><Robot size={24} weight="duotone" /> Ask MYTM AI</button>

      <CatalogueAssistant open={assistantOpen} onOpenChange={setAssistantOpen} onRecommendation={openAssistantRecommendation} onMeeting={openMeeting} />
      {selected?.type === "service" && <ServicePanel service={selected.item} onClose={() => setSelected(null)} onMeeting={openMeeting} />}
      {meetingOpen && <MeetingModal settings={catalogue.settings} onClose={() => setMeetingOpen(false)} />}

      <nav className="os-mobile-nav" aria-label="Mobile catalogue navigation">
        <button className={mode === "products" ? "active" : ""} onClick={() => { setMode("products"); clearProductSelection(); }}>Products</button>
        <button className={mode === "services" ? "active" : ""} onClick={() => { setMode("services"); clearProductSelection(); }}>Services</button>
        <button onClick={() => document.getElementById("partners")?.scrollIntoView({ behavior: "smooth" })}>Clients</button>
        <button onClick={openMeeting}>Sales</button>
      </nav>

    </main>
  );
}

function OSProductCard({ product, active, onOpen }: { product: Product; active: boolean; onOpen: () => void }) {
  return (
    <article className={`os-product-card ${active ? "active" : ""}`}>
      <button onClick={onOpen} aria-label={`Explore ${productDisplayName(product)}`}>
        <div className="os-product-image">
          <img src={productImage(product)} alt={`${productDisplayName(product)} product visual`} loading="lazy" decoding="async" />
          {product.featured && <span><Sparkle size={14} weight="fill" /> Featured</span>}
        </div>
        <div className="os-product-copy">
          <small>{product.category}</small>
          <h2>{productDisplayName(product)}</h2>
          <p>{product.shortDescription}</p>
          <i><ArrowRight size={19} /></i>
        </div>
      </button>
    </article>
  );
}

function OSServiceCard({ service, index, onOpen }: { service: Service; index: number; onOpen: () => void }) {
  return (
    <article className="os-service-card">
      <button onClick={onOpen} aria-label={`Explore ${service.name}`}>
        <img src={serviceImage(service, index)} alt={`${service.name} service visual`} loading="lazy" />
        <div><small>MYTM SERVICE</small><h2>{service.name}</h2><p>{service.shortDescription}</p><span>Explore service <ArrowRight size={18} /></span></div>
      </button>
    </article>
  );
}

function OSProductRail({ product, kind, onKindChange, onClose }: { product: Product; kind: RequestKind; onKindChange: (kind: RequestKind) => void; onClose: () => void }) {
  return (
    <aside className="os-product-rail" id="product-request-panel" aria-label={`${product.name} request panel`}>
      <button className="os-rail-close" onClick={onClose} aria-label="Close product request"><X size={18} /></button>
      <div className="os-rail-heading">
        <span><Sparkle size={15} weight="fill" /> {product.featured ? "Featured" : product.category}</span>
        <h2>{productDisplayName(product)}</h2>
        <p>{product.fullDescription || product.shortDescription}</p>
      </div>
      <div className="os-feature-list">
        {product.features.slice(0, 4).map((feature) => <span key={feature}><CheckCircle size={17} weight="fill" /> {feature}</span>)}
      </div>
      <div className="os-request-tabs" role="tablist" aria-label="Request type">
        <button role="tab" aria-selected={kind === "demo"} className={kind === "demo" ? "active" : ""} onClick={() => onKindChange("demo")}>Request Demo</button>
        <button role="tab" aria-selected={kind === "pdf"} className={kind === "pdf" ? "active" : ""} onClick={() => onKindChange("pdf")}>Request PDF</button>
      </div>
      <LeadRequestForm key={`${product.id}-${kind}`} product={product} kind={kind} />
    </aside>
  );
}

function LeadRequestForm({ product, kind }: { product: Product; kind: RequestKind }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...values,
          phone: "",
          company: "",
          notes: String(values.notes || "").trim(),
          requestType: kind === "demo" ? "Demo" : "PDF",
          source: kind === "demo" ? "Demo Request" : "PDF Request",
          contentAccessed: product.name,
          productInterest: product.name,
          serviceInterest: "None",
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to submit your request.");
      setSubmitted(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Please check your details and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <div className="os-request-success" aria-live="polite">
        <CheckCircle size={38} weight="fill" />
        <h3>{kind === "demo" ? "Demo request received" : "Your PDF is ready"}</h3>
        <p>{kind === "demo" ? "Our product team has your preferred date and will confirm the session by email." : "Your request is saved in the MYTM backoffice."}</p>
        {kind === "pdf" && product.pdfUrl ? <a href={product.pdfUrl} target="_blank" rel="noreferrer"><FilePdf size={19} /> Open product PDF</a> : null}
      </div>
    );
  }

  return (
    <form className="os-request-form" onSubmit={submit}>
      <div className="os-form-grid">
        <label>Name<input name="name" autoComplete="name" required placeholder="Your full name" /></label>
        <label>Email<input name="email" type="email" autoComplete="email" required placeholder="Work email" /></label>
        <label>Designation<input name="designation" autoComplete="organization-title" required placeholder="Your role" /></label>
        {kind === "demo" && <label>Preferred date<input name="preferredDate" type="date" min={new Date().toISOString().slice(0, 10)} required /></label>}
      </div>
      <label className="os-notes-field">Notes <span>Optional</span><textarea name="notes" rows={3} placeholder="Share any requirement, priority or question for our team" /></label>
      {kind === "pdf" && <p className="os-date-note"><FilePdf size={16} /> PDF requests do not require a date.</p>}
      {error && <p className="os-request-error" role="alert">{error}</p>}
      <button className="os-submit" disabled={saving}>{saving ? "Submitting…" : "Submit request"}</button>
      <small>By submitting, you agree that MYTM may contact you about this request.</small>
    </form>
  );
}

function CatalogueAssistant({ open, onOpenChange, onRecommendation, onMeeting }: { open: boolean; onOpenChange: (open: boolean) => void; onRecommendation: (recommendation: AssistantRecommendation) => void; onMeeting: () => void }) {
  const [messages, setMessages] = useState<AssistantMessage[]>([{ role: "assistant", content: "Hi — I’m the MYTM AI catalogue assistant. Tell me your business challenge and I’ll recommend the right products and services." }]);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const prompts = ["I need an AML/KYC solution", "Improve loan collections with AI", "Build a digital lending platform", "Modernize payment infrastructure"];

  async function ask(question = value) {
    const message = question.trim();
    if (!message || sending) return;
    const nextMessages = [...messages, { role: "user" as const, content: message }];
    setMessages(nextMessages);
    setValue("");
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, history: messages.slice(-6).map(({ role, content }) => ({ role, content })) }) });
      const result = await response.json() as { reply?: string; recommendations?: AssistantRecommendation[]; poweredBy?: "openai" | "catalogue"; error?: string };
      if (!response.ok || !result.reply) throw new Error(result.error || "The assistant is temporarily unavailable.");
      setMessages([...nextMessages, { role: "assistant", content: result.reply, recommendations: result.recommendations, poweredBy: result.poweredBy }]);
    } catch (assistantError) {
      setError(assistantError instanceof Error ? assistantError.message : "The assistant is temporarily unavailable.");
    } finally {
      setSending(false);
    }
  }

  return <div className={`catalogue-assistant ${open ? "open" : ""}`}>
    <button className="assistant-launcher" onClick={() => onOpenChange(!open)} aria-expanded={open} aria-controls="mytm-ai-panel"><span><i>✦</i><b>Ask MYTM AI</b></span><em>{open ? "×" : "↗"}</em></button>
    <section className="assistant-panel" id="mytm-ai-panel" aria-label="MYTM AI catalogue assistant">
      <header><div className="assistant-orb"><i>✦</i></div><div><small><i /> ONLINE</small><strong>MYTM AI Assistant</strong><span>Product intelligence, instantly</span></div><button onClick={() => onOpenChange(false)} aria-label="Close assistant">×</button></header>
      <div className="assistant-messages" aria-live="polite">
        {messages.map((message, index) => <div className={`assistant-message ${message.role}`} key={`${message.role}-${index}`}><span>{message.content}</span>{message.recommendations?.length ? <div className="assistant-recommendations">{message.recommendations.map((recommendation) => <button key={`${recommendation.type}-${recommendation.id}`} onClick={() => onRecommendation(recommendation)}><small>{recommendation.category}</small><strong>{recommendation.name}</strong><i>Open →</i></button>)}</div> : null}{message.role === "assistant" && message.poweredBy === "catalogue" && <small className="assistant-mode">Catalogue intelligence mode</small>}</div>)}
        {sending && <div className="assistant-message assistant typing"><i /><i /><i /></div>}
        {error && <div className="assistant-error">{error}</div>}
      </div>
      {messages.length === 1 && <div className="assistant-prompts">{prompts.map((prompt) => <button key={prompt} onClick={() => ask(prompt)}>{prompt}<span>↗</span></button>)}</div>}
      <form onSubmit={(event) => { event.preventDefault(); ask(); }}><label><span>Ask about a product, service or challenge</span><textarea rows={2} value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask(); } }} placeholder="e.g. Which solution can automate our loan collections?" maxLength={700} /></label><button disabled={sending || !value.trim()} aria-label="Send question">↑</button></form>
      <footer><span>Don’t share confidential or financial information.</span><button onClick={onMeeting}>Talk to a MYTM expert →</button></footer>
    </section>
  </div>;
}

function ServicePanel({ service, onClose, onMeeting }: { service: Service; onClose: () => void; onMeeting: () => void }) {
  const embedUrl = service.videoUrl ? videoEmbedUrl(service.videoUrl) : "";
  return (
    <div className="panel-backdrop" role="button" tabIndex={0} aria-label="Close service details" onKeyDown={(event) => event.key === "Escape" && onClose()} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="detail-panel" role="dialog" aria-modal="true" aria-label={service.name}>
        <button className="panel-close" onClick={onClose} aria-label="Close">×</button>
        <div className="detail-picture"><img src={serviceImage(service)} alt="" /><span>Professional service</span></div>
        <div className="detail-content">
          <small>MYTM SERVICE</small><h2>{service.name}</h2><p className="detail-lead">{service.shortDescription}</p>
          {service.videoUrl && <section className="detail-media"><h3>Service video</h3>{isDirectVideo(service.videoUrl) ? <video controls playsInline preload="metadata" poster={serviceImage(service)} src={service.videoUrl}><track kind="captions" src="/empty.vtt" srcLang="en" label="English" /></video> : embedUrl ? <iframe title={`${service.name} video`} src={embedUrl} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /> : <a href={service.videoUrl} target="_blank" rel="noreferrer">Watch service video ↗</a>}</section>}
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
