// Generates supabase/migrations/<timestamp>_seed_internships.sql with 200
// realistic Bangladesh-context internship postings. Run with:
//   node scripts/gen-internship-seed.mjs
//
// The output is a single .sql migration that TRUNCATEs public.internships
// and inserts 200 hand-curated rows. Idempotent on re-run because of the
// TRUNCATE.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const TS = process.argv[2] || new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
const OUT = resolve(
  process.cwd(),
  `supabase/migrations/${TS}_seed_internships.sql`,
);

const json = (arr) => "'[" + arr.map((s) => `"${s.replace(/"/g, '\\"').replace(/'/g, "''")}"`).join(",") + "]'::jsonb";

// =====================================================================
// Company roster (~70 real-feeling BD employers, deduped per row)
// =====================================================================
const COMPANIES = {
  software: [
    "Brain Station 23", "Cefalo Bangladesh", "BJIT", "Vivasoft", "Enosis Solutions",
    "Therap (BD) Ltd.", "DataSoft Systems", "Kona Software Lab", "Astha IT",
    "Systech Digital", "Nascenia", "WeDevLab", "Genex Infosys", "Relianttech",
    "Apsis Solutions", "Techlogicians", "SDI Labs", "LEAD3", "M360 ICT",
    "TigerIT Bangladesh",
  ],
  fintech: [
    "bKash", "Nagad", "Rocket (DBBL)", "Dutch-Bangla Bank IT", "BRAC Bank IT",
    "Pathway Fintech", "Safa Fintech", "Cellfin", "SureCash", "AamarPay",
  ],
  ecommerce: [
    "Daraz Bangladesh", "Chaldal", "Evaly", "Shohoz", "Pathao", "Sheba.xyz",
    "Alesha Mart", "PriyoShop", "Othoba.com", "Kayum",
  ],
  edtech: [
    "10 Minute School", "Shikho", "Bohubrihi", "Coursera Local Partner",
    "Interactive Cares", "Ostad", "CodemanBD", "Programming Hero",
  ],
  healthtech: [
    "Praava Health", "CMED Health", "Telmed BD", "DocTime", "SasthoTech",
    "Maya (mental wellness)", "Pulse Health", "HealthOS BD",
  ],
  logistics: [
    "Pathao (Logistics)", "Sundarban Courier", "SA Paribahan", "eCourier",
    "RedX", "Steadfast", "Delivery Tiger", "Flyman Logistics",
  ],
  gaming: [
    "Gamoss Studios", "Dream71 Bangladesh", "Mindcrew Studios", "Protik Game Labs",
    "Azimutt Game Studios", "BD Game House",
  ],
  agritech: [
    "iFarmer", "Arohi ( agritech )", "Agroshift", "Shwapno AgriTech", "BD Crop Tech",
  ],
  cybersec: [
    "TigerIT SOC", "BD CERT Help Desk", "CyberRoot Security", "Defendza BD",
    "Bangladesh Bank Cyber Cell", "BdREN SOC",
  ],
  data: [
    "DataPath BD", "InsightWorks Bangladesh", "Quantanite (BD analytics)",
    "Stream Vision BD", "Aritro Data Labs",
  ],
  media: [
    "TBS Newscred Tech", "RTV Digital", "Daily Star Tech", "barta24 IT",
    "Dhaka Tribune Tech", "Ananda TV Digital", "ATN Digital",
  ],
  ngo: [
    "BRAC", "Grameenphone Community", "Sajida Foundation", "A2I (a2i)",
    "Bangladesh Computer Council", "ICT Division", "BCC (BD Computer Council)",
  ],
};

const COMPANY_TYPE_BY_SECTOR = {
  software: "Software",
  fintech: "Fintech",
  ecommerce: "E-commerce",
  edtech: "EdTech",
  healthtech: "HealthTech",
  logistics: "Logistics",
  gaming: "Gaming",
  agritech: "Agritech",
  cybersec: "Cybersecurity",
  data: "Data / AI",
  media: "Media",
  ngo: "NGO",
};

// =====================================================================
// Sectors, with domain (DB column), industry (DB column), titles,
// responsibilities, requirements, preferred_skills, tech_stack.
// =====================================================================
const SECTORS = [
  {
    key: "software",
    domain: "Software Engineering",
    industry: "Software / SaaS",
    titles: [
      "Frontend Developer Intern", "Backend Developer Intern", "Full-Stack Developer Intern",
      "Mobile App Developer Intern (React Native)", "QA Engineer Intern",
      "DevOps Engineer Intern", "Site Reliability Intern", "Software Engineering Intern",
      "API Integration Intern", "Microservices Developer Intern", "Junior Platform Engineer Intern",
      "Cloud Engineering Intern", "SDK Developer Intern",
      "Junior .NET Developer Intern", "Junior Java Developer Intern",
      "Frontend Performance Intern", "Build & Release Intern",
    ],
    responsibilities: [
      "Build and ship new product pages with reusable React components",
      "Pair with senior engineers on API design and code reviews",
      "Write unit and integration tests for new features",
      "Investigate and triage customer-reported bugs",
      "Improve developer documentation and onboarding guides",
      "Set up CI/CD pipelines and monitoring for new services",
    ],
    requirements: [
      "Currently enrolled in a CS / CSE / EEE / Software Engineering program",
      "Solid grasp of at least one programming language (JavaScript, Python, or Java)",
      "Familiar with Git, GitHub, and basic code-review etiquette",
      "Strong written and spoken English",
    ],
    preferred_skills: ["React", "Next.js", "Node.js", "TypeScript", "PostgreSQL", "Docker", "AWS"],
    tech_stack: ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "Redis", "Docker", "AWS"],
  },
  {
    key: "fintech",
    domain: "Software Engineering",
    industry: "Fintech",
    titles: [
      "Mobile Wallet Backend Intern", "Fintech QA Intern", "KYC Automation Intern",
      "Payments Reconciliation Intern", "Fraud Detection Intern",
      "Risk Modelling Intern", "iOS Developer Intern (Fintech)", "Android Developer Intern (Fintech)",
      "Compliance Engineering Intern", "Transaction Monitoring Intern",
      "Merchant Onboarding Intern", "Open Banking API Intern",
      "Internal Tools Developer Intern", "Card Systems Intern",
      "AML Data Analyst Intern", "Fintech SRE Intern",
      "Customer Support Tooling Intern",
    ],
    responsibilities: [
      "Reconcile mobile-wallet transactions and flag anomalies",
      "Help automate KYC document checks using OCR",
      "Build internal tools for the merchant risk team",
      "Monitor live transaction pipelines and alert on failures",
      "Write SQL reports for the compliance team",
      "Investigate fraud-rule false positives",
    ],
    requirements: [
      "Currently enrolled in CS / CSE / EEE / Finance / Accounting",
      "Comfortable with SQL and at least one backend language",
      "Strong attention to detail and ability to handle sensitive data",
      "Basic understanding of mobile payment flows",
    ],
    preferred_skills: ["Node.js", "NestJS", "PostgreSQL", "Redis", "AWS", "Python", "Airflow"],
    tech_stack: ["Node.js", "NestJS", "PostgreSQL", "Redis", "Kafka", "AWS", "Docker", "Python"],
  },
  {
    key: "ecommerce",
    domain: "Software Engineering",
    industry: "E-commerce",
    titles: [
      "E-commerce Frontend Intern", "Catalog & Merchandising Intern",
      "Order Management Backend Intern", "Search Relevance Intern",
      "Logistics Tech Intern", "Warehouse Tech Intern",
      "Growth Marketing Intern", "Customer Reviews Intern",
      "Pricing & Promo Engine Intern", "Seller Onboarding Intern",
      "Returns & Refunds Intern", "Mobile App Intern",
      "A/B Testing Intern", "Personalization Intern",
      "Inventory Sync Intern", "Courier Integration Intern",
      "Shopfront Performance Intern",
    ],
    responsibilities: [
      "Improve category and product detail pages for faster load times",
      "Help merchants upload and manage their catalogs",
      "Build dashboards for the ops team to monitor courier SLAs",
      "Investigate and resolve order-state bugs",
      "Run A/B tests on the homepage and checkout funnel",
      "Optimize Elasticsearch relevance for product search",
    ],
    requirements: [
      "Currently enrolled in CS / CSE / EEE or Business / Marketing",
      "Basic React or Node.js experience",
      "Comfort with SQL and spreadsheets",
      "Interest in consumer products",
    ],
    preferred_skills: ["React", "Next.js", "Node.js", "Elasticsearch", "GraphQL", "Mixpanel"],
    tech_stack: ["React", "Next.js", "Node.js", "PostgreSQL", "Elasticsearch", "Redis", "Kafka"],
  },
  {
    key: "edtech",
    domain: "Education",
    industry: "EdTech",
    titles: [
      "Curriculum Design Intern", "Learning Experience Designer Intern",
      "Mobile Learning App Intern", "Live Class Backend Intern",
      "Content Operations Intern", "Bangla Content QA Intern",
      "Student Support Intern", "Educator Onboarding Intern",
      "Assessment Engine Intern", "Video Pipeline Intern",
      "Learning Analytics Intern", "Partnerships Intern",
      "Community Moderator Intern", "Marketing Intern (EdTech)",
      "Illustration & Animation Intern", "Product Growth Intern",
      "Sales Operations Intern",
    ],
    responsibilities: [
      "Help script micro-lessons in Bangla and English",
      "QA new assessment items for accuracy",
      "Moderate student forums and escalate issues",
      "Build dashboards for learner engagement metrics",
      "Onboard new partner schools and tutors",
      "Optimize the video streaming pipeline for low-bandwidth users",
    ],
    requirements: [
      "Currently enrolled in any discipline",
      "Strong written Bangla and English",
      "Comfort working with spreadsheets and basic SQL",
      "Patience for reviewing long-form content",
    ],
    preferred_skills: ["Figma", "Notion", "Airtable", "SQL", "React"],
    tech_stack: ["React Native", "Node.js", "PostgreSQL", "AWS MediaConvert", "Cloudflare"],
  },
  {
    key: "healthtech",
    domain: "Healthcare Tech",
    industry: "HealthTech",
    titles: [
      "Clinical Data Intern", "Telehealth Frontend Intern", "Patient Records Intern",
      "Health Analytics Intern", "Telemedicine QA Intern",
      "Doctor Onboarding Intern", "Pharmacy Integration Intern",
      "Medical Records OCR Intern", "Appointment Scheduling Intern",
      "Mobile Health App Intern", "Diagnostic Tooling Intern",
      "Hospital Partnerships Intern", "Health Content Intern",
      "Compliance & HIPAA-style Intern", "Insurance Claims Intern",
      "Mental Wellness Intern", "Healthcare SEO Intern",
    ],
    responsibilities: [
      "Process anonymized clinical data and build summary dashboards",
      "Help onboard partner doctors to the platform",
      "QA new telehealth features end-to-end",
      "Build appointment scheduling integrations",
      "Investigate OCR accuracy on prescription uploads",
      "Coordinate with partner pharmacies for inventory sync",
    ],
    requirements: [
      "Currently enrolled in CS / CSE / BME / Public Health / Pharmacy",
      "Discretion when handling sensitive medical data",
      "Basic Python or JavaScript",
      "Strong written Bangla and English",
    ],
    preferred_skills: ["Python", "Django", "React", "PostgreSQL", "OCR / Tesseract"],
    tech_stack: ["Python", "Django", "React", "PostgreSQL", "Tesseract OCR", "AWS"],
  },
  {
    key: "logistics",
    domain: "Logistics",
    industry: "Logistics & Supply Chain",
    titles: [
      "Last-Mile Routing Intern", "Fleet Operations Intern", "Warehouse Tech Intern",
      "Courier App Intern", "Dispatch Optimization Intern",
      "Field Operations Intern", "Tracking & Visibility Intern",
      "COD Reconciliation Intern", "Driver Onboarding Intern",
      "Customer Service Tooling Intern", "Logistics Analytics Intern",
      "Hub & Spoke Modelling Intern", "Operations Research Intern",
      "Quality Assurance Intern", "Partner Integration Intern",
      "Data Entry Automation Intern", "Supply Chain Intern",
    ],
    responsibilities: [
      "Optimize courier routes using simple heuristics",
      "Build dashboards to track on-time delivery SLAs",
      "Reconcile cash-on-delivery collections daily",
      "Automate manual data entry from PDF waybills",
      "Investigate late-delivery root causes",
      "Onboard new fleet partners to the platform",
    ],
    requirements: [
      "Currently enrolled in CS / CSE / EEE / Operations Research / Business",
      "Strong Excel and basic SQL",
      "Comfort with maps and geo data",
      "Willingness to occasionally visit a hub in person",
    ],
    preferred_skills: ["Python", "Pandas", "PostgreSQL", "Leaflet / Mapbox", "Excel"],
    tech_stack: ["Python", "FastAPI", "PostgreSQL", "Redis", "Mapbox", "Airflow"],
  },
  {
    key: "gaming",
    domain: "Game Development",
    industry: "Gaming",
    titles: [
      "Unity Gameplay Programmer Intern", "Unreal Engine Intern",
      "2D Artist Intern", "3D Artist Intern", "Game QA Intern",
      "Game Designer Intern", "Level Designer Intern", "Audio Intern",
      "Tools & Pipeline Intern", "Mobile Game Intern",
      "Narrative Designer Intern", "Animation Intern",
      "UI/UX Intern (Games)", "Multiplayer Networking Intern",
      "Live Ops Intern", "Marketing & Community Intern",
      "Concept Artist Intern",
    ],
    responsibilities: [
      "Implement gameplay mechanics in Unity or Unreal",
      "Create 2D / 3D assets for upcoming titles",
      "Design and playtest new levels",
      "QA builds across Android and iOS devices",
      "Prototype UI flows for the in-game store",
      "Write shaders and optimize for mid-range devices",
    ],
    requirements: [
      "Currently enrolled in CS / CSE / Fine Arts / Animation / Game Design",
      "Portfolio showing at least one project (game, art, mod, or shader)",
      "Familiar with at least one game engine",
      "Strong sense of game feel and pacing",
    ],
    preferred_skills: ["Unity", "C#", "Unreal", "C++", "Blender", "Photoshop"],
    tech_stack: ["Unity", "C#", "Unreal Engine", "C++", "Blender", "Photoshop", "Firebase"],
  },
  {
    key: "agritech",
    domain: "Agriculture Tech",
    industry: "Agritech",
    titles: [
      "Field Data Collection Intern", "Crop Yield Modelling Intern",
      "Supply Chain Intern", "Agri Marketplace Intern",
      "Farmer Onboarding Intern", "Weather Data Intern",
      "Soil & Sensor Data Intern", "Agronomy Content Intern",
      "Mobile App Intern (Vernacular)", "Logistics Intern (Cold Chain)",
      "Credit Risk Modelling Intern", "Satellite Imagery Intern",
      "Government Partnerships Intern", "Agri Call Center Intern",
      "Data Engineering Intern", "Marketing Intern (Agritech)",
      "Field Operations Intern",
    ],
    responsibilities: [
      "Collect and validate field data from partner farmers",
      "Build dashboards for crop-yield predictions",
      "Help farmers download and use the mobile app",
      "Translate app copy into Bangla and Sylheti",
      "Build a cold-chain monitoring pipeline",
      "Investigate weather-data ingestion errors",
    ],
    requirements: [
      "Currently enrolled in CS / CSE / Agriculture / Economics / BBA",
      "Strong spoken Bangla; able to travel to rural districts",
      "Basic Excel and SQL",
      "Empathy for smallholder farmers",
    ],
    preferred_skills: ["Python", "Pandas", "React Native", "PostgreSQL", "GIS"],
    tech_stack: ["Python", "Django", "React Native", "PostgreSQL", "AWS", "GIS"],
  },
  {
    key: "cybersec",
    domain: "Cybersecurity",
    industry: "Cybersecurity",
    titles: [
      "SOC Analyst Intern", "Penetration Testing Intern", "Threat Intelligence Intern",
      "Security Engineering Intern", "Incident Response Intern",
      "AppSec Intern", "Network Security Intern", "Cloud Security Intern",
      "Vulnerability Management Intern", "Red Team Intern",
      "Blue Team Intern", "GRC Intern", "DevSecOps Intern",
      "Malware Analysis Intern", "Digital Forensics Intern",
      "Security Awareness Intern", "IAM Intern",
    ],
    responsibilities: [
      "Monitor SIEM alerts and triage incidents",
      "Run scans and document findings in write-ups",
      "Audit cloud configurations against best practices",
      "Build internal security tooling and dashboards",
      "Investigate phishing samples submitted by users",
      "Coordinate tabletop incident-response exercises",
    ],
    requirements: [
      "Currently enrolled in CS / CSE / EEE / Cybersecurity",
      "Comfort with Linux command line and networking fundamentals",
      "Basic scripting in Python or Bash",
      "Strong written English for reports",
    ],
    preferred_skills: ["Wireshark", "Burp Suite", "Metasploit", "Python", "Splunk"],
    tech_stack: ["Python", "Wireshark", "Burp Suite", "Splunk", "AWS", "Terraform"],
  },
  {
    key: "data",
    domain: "Data / AI",
    industry: "Data / AI",
    titles: [
      "Machine Learning Engineer Intern", "Data Analyst Intern",
      "Data Engineer Intern", "NLP Intern", "Computer Vision Intern",
      "MLOps Intern", "BI Analyst Intern", "Analytics Engineer Intern",
      "Recommendation Systems Intern", "Speech Recognition Intern",
      "Research Engineer Intern", "Forecasting Intern",
      "Time-Series Intern", "Data Quality Intern",
      "Experimentation Intern", "Customer Analytics Intern",
      "AI Product Intern",
    ],
    responsibilities: [
      "Train and evaluate ML models on production data",
      "Build ETL pipelines with Python and Airflow",
      "Write SQL queries for product analytics",
      "Design and analyze A/B experiments",
      "Improve OCR for Bangla handwriting",
      "Document notebooks and share findings with the team",
    ],
    requirements: [
      "Currently enrolled in CS / CSE / Statistics / Math / EEE",
      "Strong Python and SQL",
      "Linear algebra and probability fundamentals",
      "Familiar with Pandas and at least one ML library",
    ],
    preferred_skills: ["Python", "PyTorch", "TensorFlow", "Pandas", "Airflow", "dbt"],
    tech_stack: ["Python", "PyTorch", "TensorFlow", "Pandas", "Airflow", "PostgreSQL", "AWS"],
  },
  {
    key: "media",
    domain: "Media",
    industry: "Media & AdTech",
    titles: [
      "Frontend Intern (News)", "CMS Developer Intern", "Ad Operations Intern",
      "Video Streaming Intern", "Audience Insights Intern",
      "Newsletter Growth Intern", "Bangla Newsroom Tech Intern",
      "Paywall & Subscription Intern", "Live Stream Intern",
      "Podcast Platform Intern", "SEO Intern", "Social Media Intern",
      "Graphics & Motion Intern", "Reporter Tools Intern",
      "Data Journalism Intern", "Photo Desk Intern",
      "Marketing Analytics Intern",
    ],
    responsibilities: [
      "Build new landing pages for breaking-news stories",
      "Monitor ad delivery and click-through metrics",
      "Optimize video player for low-bandwidth viewers",
      "Write SQL reports for the editorial team",
      "Improve the paywall funnel",
      "Automate newsletter content assembly",
    ],
    requirements: [
      "Currently enrolled in any discipline",
      "Strong written Bangla and English",
      "Basic HTML / CSS / JavaScript",
      "Interest in journalism and media",
    ],
    preferred_skills: ["React", "Next.js", "Node.js", "Google Analytics", "Looker"],
    tech_stack: ["React", "Next.js", "Node.js", "PostgreSQL", "Cloudflare", "GA4"],
  },
  {
    key: "ngo",
    domain: "Development",
    industry: "NGO / Development",
    titles: [
      "Field Tech Intern", "ICT4D Intern", "Digital Literacy Intern",
      "M&E Intern", "Data Collection Intern", "Survey Tooling Intern",
      "Government Liaison Intern", "Training Content Intern",
      "Translation Intern", "Accessibility Intern",
      "Cybersecurity Awareness Intern", "GIS Mapping Intern",
      "Health Programme Intern", "Education Programme Intern",
      "Climate Programme Intern", "Microfinance Tech Intern",
      "Partnerships Intern",
    ],
    responsibilities: [
      "Build simple survey tools for field staff",
      "Translate training materials into Bangla and Chittagonian",
      "Coordinate training sessions in district offices",
      "Collect and clean programme data",
      "Map field activities using GIS tools",
      "Monitor digital-literacy programme uptake",
    ],
    requirements: [
      "Currently enrolled in any discipline",
      "Strong Bangla and working English",
      "Willingness to travel to field sites",
      "Patience and empathy for diverse users",
    ],
    preferred_skills: ["KoboToolbox", "ODK", "Excel", "GIS", "Bangla typing"],
    tech_stack: ["KoboToolbox", "ODK", "PostgreSQL", "Python", "Leaflet"],
  },
];

// =====================================================================
// Helpers
// =====================================================================
const CITIES = [
  "Dhaka", "Dhaka", "Dhaka", "Dhaka", // weighted toward Dhaka
  "Chattogram", "Chattogram",
  "Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur", "Gazipur", "Narayanganj",
];
const DOMAIN_KEYS = {
  "Software Engineering": "software",
  "Healthcare Tech": "healthtech",
  "Logistics": "logistics",
  "Game Development": "gaming",
  "Agriculture Tech": "agritech",
  "Cybersecurity": "cybersec",
  "Data / AI": "data",
  "Media": "media",
  "Education": "edtech",
  "Development": "ngo",
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickN(arr, n) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}
function pickSalary(sector) {
  // Fintech/Gaming/Data skew higher, NGO/Education skew lower / unpaid.
  const r = Math.random();
  if (sector === "ngo") {
    return r < 0.55 ? "Unpaid — certificate provided"
                    : "BDT 8,000 – 12,000 / month";
  }
  if (sector === "edtech") {
    return r < 0.25 ? "Unpaid — certificate provided"
                    : "BDT 10,000 – 15,000 / month";
  }
  if (sector === "fintech" || sector === "data" || sector === "gaming") {
    return r < 0.6  ? "BDT 25,000 – 35,000 / month"
         : r < 0.95 ? "BDT 40,000 – 60,000 / month"
                    : "BDT 15,000 – 20,000 / month";
  }
  if (sector === "cybersec") {
    return r < 0.5  ? "BDT 25,000 – 35,000 / month"
                    : "BDT 15,000 – 20,000 / month";
  }
  // software / ecommerce / healthtech / logistics / agritech / media
  return r < 0.6  ? "BDT 15,000 – 20,000 / month"
       : r < 0.95 ? "BDT 25,000 – 35,000 / month"
                  : "BDT 40,000 – 60,000 / month";
}
function pickDuration() {
  const r = Math.random();
  if (r < 0.35) return "3 months";
  if (r < 0.75) return "6 months";
  if (r < 0.9)  return "4–6 months";
  return "Summer 2026 (May–Aug)";
}
function pickExperience() {
  const r = Math.random();
  if (r < 0.55) return "Entry";
  if (r < 0.85) return "Fresher";
  return "Intermediate";
}
function pickWorkModel(sector, city) {
  const r = Math.random();
  // NGOs and Agritech tend to be field-heavy (Onsite/Hybrid).
  if (sector === "ngo" || sector === "agritech") {
    return r < 0.6 ? "Onsite" : "Hybrid";
  }
  if (r < 0.45) return "Onsite";
  if (r < 0.75) return "Hybrid";
  return "Remote";
}
function pickLocation(city, workModel) {
  if (workModel === "Remote") return "Remote (Bangladesh)";
  if (workModel === "Hybrid")  return `Hybrid — ${city}`;
  return city;
}
function slugIndustry(industry) {
  return industry;
}

// Deterministic-ish but varied per-index helper: ensures sectors don't all
// repeat the same first responsibility.
function offsetPick(arr, idx) {
  return arr[idx % arr.length];
}

// =====================================================================
// Build rows
// =====================================================================
const rows = [];
let counter = 0;

for (const sector of SECTORS) {
  const titles = sector.titles;
  const companies = COMPANIES[sector.key];

  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    const company = companies[i % companies.length];
    const companyType = COMPANY_TYPE_BY_SECTOR[sector.key];

    const expLevel = pickExperience();
    const workModel = pickWorkModel(sector.key, CITIES[0]);
    const city = pick(CITIES);
    const location = pickLocation(city, workModel);
    const salary = pickSalary(sector.key);
    const duration = pickDuration();

    // Responsibilities: rotate through sector pool, pick 4–6.
    const respN = 4 + (counter % 3); // 4,5,6
    const respStart = counter % sector.responsibilities.length;
    const responsibilities = [];
    for (let k = 0; k < respN; k++) {
      responsibilities.push(sector.responsibilities[(respStart + k) % sector.responsibilities.length]);
    }

    // Requirements: 3–4 of the standard ones + 1 sector-specific if available.
    const reqN = 3 + (counter % 2);
    const requirements = pickN(sector.requirements, reqN);

    // Preferred skills: pick 3–5 from the sector pool.
    const prefN = 3 + (counter % 3);
    const preferred_skills = pickN(sector.preferred_skills, prefN);

    // Tech stack: pick 4–6.
    const techN = 4 + (counter % 3);
    const tech_stack = pickN(sector.tech_stack, techN);

    const description =
      `${company} is hiring a ${title} to join its ${sector.industry} team in ${location}. ` +
      `You'll work alongside senior ${sector.domain} staff on real production problems, ` +
      `ship code (or content) that's used by customers across Bangladesh, and get ` +
      `structured mentorship over ${duration}. ${pick([
        "Strong performers are often converted to full-time roles.",
        "Stipend paid monthly via bKash or bank transfer.",
        "Remote-friendly with quarterly team meetups in Dhaka.",
        "You'll have a dedicated mentor and weekly 1:1s.",
        "Hybrid working model with flexible hours.",
        "Open to female candidates returning to the workforce.",
      ])}`;

    rows.push({
      title, company, company_type: companyType, location, salary, duration,
      requirements, preferred_skills, responsibilities, tech_stack,
      experience_level: expLevel, work_model: workModel,
      domain: sector.domain, industry: sector.industry, description,
    });
    counter++;
  }
}

// Pad to exactly 200 by cloning the last few with tiny variations if needed.
while (rows.length < 200) {
  const base = rows[rows.length % counter];
  rows.push({ ...base, title: `${base.title} (${rows.length + 1})` });
}
rows.length = 200;

// =====================================================================
// Emit SQL
// =====================================================================
function sqlStr(s) {
  return "'" + s.replace(/'/g, "''") + "'";
}

let sql = `-- Seed: 200 Bangladesh-context internship postings across 12 sectors.
-- Truncates the catalog so re-applying this migration is idempotent.
TRUNCATE public.internships RESTART IDENTITY CASCADE;

INSERT INTO public.internships (
  title, company, company_type, location, salary, duration,
  requirements, preferred_skills, responsibilities, tech_stack,
  experience_level, work_model, domain, industry, description
) VALUES
`;

const valueRows = rows.map((r) => {
  return `  ( ${sqlStr(r.title)}, ${sqlStr(r.company)}, ${sqlStr(r.company_type)}, ${sqlStr(r.location)}, ${sqlStr(r.salary)}, ${sqlStr(r.duration)}, ${json(r.requirements)}, ${json(r.preferred_skills)}, ${json(r.responsibilities)}, ${json(r.tech_stack)}, ${sqlStr(r.experience_level)}, ${sqlStr(r.work_model)}, ${sqlStr(r.domain)}, ${sqlStr(r.industry)}, ${sqlStr(r.description)} )`;
});

sql += valueRows.join(",\n") + ";\n";

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, sql);

console.log(`Wrote ${rows.length} rows to ${OUT}`);
console.log(`Sectors:`);
const bySector = rows.reduce((acc, r) => {
  acc[r.industry] = (acc[r.industry] ?? 0) + 1;
  return acc;
}, {});
for (const [k, v] of Object.entries(bySector)) console.log(`  ${k.padEnd(22)} ${v}`);
