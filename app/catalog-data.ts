export type Product = {
  id: number;
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  features: string[];
  benefits: string[];
  thumbnailUrl: string;
  videoUrl: string;
  pdfUrl: string;
  featured: boolean;
  requireLead: boolean;
  active: boolean;
  displayOrder: number;
};

export type Service = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string;
  features: string[];
  cta: string;
  thumbnailUrl: string;
  videoUrl: string;
  pdfUrl: string;
  active: boolean;
  displayOrder: number;
};

export type CaseStudy = {
  id: number;
  clientName: string;
  challenge: string;
  solution: string;
  impact: string;
  active: boolean;
  displayOrder: number;
};

export type SiteSettings = {
  calendlyUrl: string;
  meetingLabel: string;
  meetingEnabled: boolean;
  heroHeading: string;
  heroSubheading: string;
  contactEmail: string;
  contactNumber: string;
  eventMode: boolean;
  welcomeScreen: boolean;
  formConfig: {
    requireName: boolean;
    requirePhone: boolean;
    requireCompany: boolean;
    requireEmail: boolean;
    requireNotes: boolean;
    showProductInterest: boolean;
    showServiceInterest: boolean;
  };
};

const productNames: Array<[string, string, string]> = [
  ["MYTM Cyber Security", "Cybersecurity", "Enterprise-grade digital defense, monitoring and resilience."],
  ["Agent Banking Solution", "Banking", "Extend banking services through a secure, intelligent agent network."],
  ["Payment Aggregation Solution", "Payments", "Accept, process, reconcile and settle payments from one platform."],
  ["Loan Origination System", "Lending", "Digitize the complete credit journey from application to approval."],
  ["White Label Wallet Solution", "Wallets", "Launch a branded, configurable digital wallet at enterprise speed."],
  ["Loan Management System", "Lending", "Control servicing, collections and portfolio performance end to end."],
  ["KSA Government Services Integration", "Government", "A unified layer for Saudi identity, compliance and financial APIs."],
  ["Card Management System", "Cards", "Issue and manage physical, digital and virtual cards securely."],
  ["MYTM Core", "Banking", "A modular financial infrastructure engine built for modern institutions."],
  ["PropTech", "PropTech", "Connect property operations, payments and customer journeys digitally."],
  ["OTA — Online Travel Agency", "Travel", "A complete booking and travel commerce experience."],
  ["Appointment Management System", "Enterprise", "Simplify scheduling, capacity and customer service operations."],
  ["Transforming Car Buying", "Enterprise", "A connected vehicle discovery, financing and purchase journey."],
  ["Learning Management System", "Education", "Deliver, manage and measure modern digital learning."],
  ["Lending & Financing Solutions", "Lending", "A configurable ecosystem for inclusive and specialized financing."],
  ["MYTM Wallet Solutions", "Wallets", "Secure wallet experiences for consumers, merchants and institutions."],
  ["Onboarding Studio", "Enterprise", "Design compliant digital onboarding journeys without operational friction."],
  ["School Management System", "Education", "Unify academics, administration, payments and parent engagement."],
  ["CompliClear AML/KYC Solution", "Compliance", "Automate AML screening, KYC verification and ongoing compliance monitoring."],
  ["LOS / LMS", "Lending", "A unified loan origination and loan management platform for the complete credit lifecycle."],
  ["AI Collection Management", "AI", "Improve recovery performance with intelligent prioritization, automation and collection insights."],
  ["AI Financial Analyst", "AI", "Turn complex financial data into decision-ready intelligence."],
  ["Agentic AI", "AI", "Deploy goal-driven AI agents across enterprise workflows."],
];

const featureMap: Record<string, string[]> = {
  Banking: ["Digital onboarding", "Real-time operations", "Open API architecture", "Regulatory controls"],
  Payments: ["Omnichannel acceptance", "Smart reconciliation", "Real-time settlements", "Deep reporting"],
  Lending: ["Automated workflows", "Credit scoring", "Portfolio analytics", "Configurable products"],
  Wallets: ["White-label experience", "Secure ledger", "P2P and merchant payments", "Programmable limits"],
  AI: ["Enterprise intelligence", "Human-in-the-loop controls", "Explainable insights", "Workflow automation"],
  Compliance: ["AML screening", "Digital KYC", "Risk scoring", "Ongoing monitoring"],
};

export const seedProducts: Product[] = productNames.map(([name, category, description], index) => ({
  id: index + 1,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  category,
  shortDescription: description,
  fullDescription: `${description} MYTM combines modular technology, regional expertise and an implementation model designed for complex enterprise environments.`,
  features: featureMap[category] ?? ["Modular architecture", "API-first integrations", "Operational dashboards", "Enterprise security"],
  benefits: ["Faster time to market", "Lower operational complexity", "Scalable by design"],
  thumbnailUrl: ["AI Financial Analyst", "AI Collection Management"].includes(name) ? "/finova-cover.png" : "",
  videoUrl: ["AI Financial Analyst", "AI Collection Management"].includes(name) ? "/api/media?key=finova-product-video.mp4" : "",
  pdfUrl: ["AI Financial Analyst", "AI Collection Management"].includes(name) ? "/api/media?key=finova-product-deck.pptx" : "",
  featured: ["MYTM Cyber Security", "Payment Aggregation Solution", "KSA Government Services Integration", "Lending & Financing Solutions", "CompliClear AML/KYC Solution", "AI Financial Analyst"].includes(name),
  requireLead: true,
  active: true,
  displayOrder: index + 1,
}));

export const seedServices: Service[] = [
  { id: 1, name: "Cyber Security", slug: "cyber-security", shortDescription: "Enhance your digital defenses with continuous, comprehensive protection.", features: ["Disaster Recovery", "Endpoint Hardening", "HIDS", "VAPT", "MYTM SIEM", "PCI DSS", "Forensics Investigation"], cta: "Strengthen Your Defenses", thumbnailUrl: "", videoUrl: "", pdfUrl: "", active: true, displayOrder: 1 },
  { id: 2, name: "DevOps", slug: "devops", shortDescription: "Build faster, safer and more reliable technology delivery systems.", features: ["Cloud Infrastructure", "CI/CD", "Deployment Automation", "DevSecOps", "Containerization", "Cloud Optimization"], cta: "Modernize Delivery", thumbnailUrl: "", videoUrl: "", pdfUrl: "", active: true, displayOrder: 2 },
  { id: 3, name: "Resource / Staff Augmentation", slug: "staff-augmentation", shortDescription: "Add proven technology specialists to your teams and critical initiatives.", features: ["Software Engineers", "Mobile Developers", "DevOps Engineers", "QA Engineers", "Business Analysts", "UI/UX Designers", "Project Managers"], cta: "Discuss Resource Requirements", thumbnailUrl: "", videoUrl: "", pdfUrl: "", active: true, displayOrder: 3 },
  { id: 4, name: "Quality Assurance", slug: "quality-assurance", shortDescription: "Ship confident digital experiences with full-spectrum testing expertise.", features: ["Functional Testing", "Automation Testing", "Performance Testing", "Security Testing", "Mobile Testing", "API Testing", "UAT Support"], cta: "Discuss QA Requirements", thumbnailUrl: "", videoUrl: "", pdfUrl: "", active: true, displayOrder: 4 },
];

const caseRows: Array<[string, string, string]> = [
  ["Fragmented wallet and payment infrastructure limiting scalability.", "White-label wallet with integrated payment aggregation.", "Enabled rapid EMI expansion and seamless digital payments."],
  ["Disconnected investment and loan management systems.", "Customized LOS and LMS for investment services.", "Enhanced portfolio control and regulatory visibility."],
  ["Manual supply-chain financing and limited cash-flow visibility.", "End-to-end factoring platform with LOS, LMS and e-wallets.", "Streamlined financing operations and improved liquidity cycles."],
  ["Legacy banking systems restricting innovation.", "White-label open banking and payment aggregation platform.", "Faster digital product launches and improved transaction flow."],
  ["Inefficient agent-based banking and manual workflows.", "MENNAH digital agent banking platform with automated transactions.", "Improved operational efficiency and processing speed."],
  ["Manual loan processing and poor scalability.", "Fully digitized LOS and LMS implementation.", "Optimized loan lifecycle management and operations."],
  ["Need for compliant digital Islamic financing infrastructure.", "Shariah-compliant LOS and LMS system.", "Enabled compliant and scalable Islamic financing operations."],
  ["Traditional auto and personal financing processes.", "Digital car dealership and financing platform.", "Accelerated onboarding and financing journeys."],
  ["Need for secure blockchain-based payments and identity.", "Blockchain-integrated payments and digital identity platform.", "Strengthened Web3 adoption and transaction security."],
  ["Inefficient SME loan origination and management.", "SME-focused LOS and LMS platform.", "Faster approvals and increased SME financial access."],
  ["Manual SME loan origination workflows.", "Loan origination and management system for SMEs.", "Reduced turnaround time and improved financing efficiency."],
  ["Lack of internal wallet and payment technology.", "End-to-end digital wallet and payments platform.", "Enabled digital transactions and platform scalability."],
  ["Manual cash handling and reconciliation delays.", "ECR system for automated transactions and reporting.", "Improved transaction accuracy and faster reconciliation."],
  ["Manual HR processes and limited employee access.", "HRMS with Employee Self-Service portal.", "Faster processes and improved employee experience."],
];

export const seedCases: CaseStudy[] = caseRows.map(([challenge, solution, impact], index) => ({
  id: index + 1,
  clientName: `Institution ${String(index + 1).padStart(2, "0")}`,
  challenge,
  solution,
  impact,
  active: true,
  displayOrder: index + 1,
}));

export const defaultSettings: SiteSettings = {
  calendlyUrl: "https://calendly.com/",
  meetingLabel: "Book a Meeting",
  meetingEnabled: true,
  heroHeading: "Technology built for the future of finance & enterprise.",
  heroSubheading: "Explore MYTM's ecosystem of fintech, banking, lending, payments, AI and enterprise technology solutions.",
  contactEmail: "hello@mytm.com",
  contactNumber: "+92 51 843 9990",
  eventMode: false,
  welcomeScreen: false,
  formConfig: {
    requireName: true,
    requirePhone: true,
    requireCompany: true,
    requireEmail: true,
    requireNotes: true,
    showProductInterest: true,
    showServiceInterest: true,
  },
};
