// Feature 15: Curated learning resources — a hand-picked static library keyed by domain.

export type Resource = {
  title: string;
  provider: string;
  url: string;
  type: "Course" | "Docs" | "Video" | "Practice" | "Article" | "Book";
  free: boolean;
};

export type ResourceGroup = {
  domain: string;
  resources: Resource[];
};

export const CURATED_RESOURCES: ResourceGroup[] = [
  {
    domain: "Software Development",
    resources: [
      { title: "The Odin Project — Full Stack", provider: "The Odin Project", url: "https://www.theodinproject.com/", type: "Course", free: true },
      { title: "JavaScript: The Definitive Guide (MDN)", provider: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript", type: "Docs", free: true },
      { title: "CS50x: Intro to Computer Science", provider: "Harvard / edX", url: "https://cs50.harvard.edu/x/", type: "Course", free: true },
      { title: "Grokking the Coding Interview Patterns", provider: "NeetCode", url: "https://neetcode.io/practice", type: "Practice", free: true },
    ],
  },
  {
    domain: "AI/ML",
    resources: [
      { title: "Machine Learning Specialization", provider: "DeepLearning.AI / Coursera", url: "https://www.coursera.org/specializations/machine-learning-introduction", type: "Course", free: true },
      { title: "fast.ai — Practical Deep Learning", provider: "fast.ai", url: "https://course.fast.ai/", type: "Course", free: true },
      { title: "scikit-learn User Guide", provider: "scikit-learn", url: "https://scikit-learn.org/stable/user_guide.html", type: "Docs", free: true },
      { title: "Kaggle Learn — Intro to ML", provider: "Kaggle", url: "https://www.kaggle.com/learn", type: "Practice", free: true },
    ],
  },
  {
    domain: "AI Engineer",
    resources: [
      { title: "Building LLM Apps", provider: "DeepLearning.AI", url: "https://www.deeplearning.ai/short-courses/", type: "Course", free: true },
      { title: "LangChain Documentation", provider: "LangChain", url: "https://python.langchain.com/docs/introduction/", type: "Docs", free: true },
      { title: "Prompt Engineering Guide", provider: "DAIR.AI", url: "https://www.promptingguide.ai/", type: "Article", free: true },
      { title: "OpenAI Cookbook", provider: "OpenAI", url: "https://cookbook.openai.com/", type: "Practice", free: true },
    ],
  },
  {
    domain: "DevOps",
    resources: [
      { title: "Docker — Getting Started", provider: "Docker", url: "https://docs.docker.com/get-started/", type: "Docs", free: true },
      { title: "Kubernetes Basics", provider: "Kubernetes", url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/", type: "Docs", free: true },
      { title: "DevOps Roadmap", provider: "roadmap.sh", url: "https://roadmap.sh/devops", type: "Article", free: true },
      { title: "GitHub Actions Documentation", provider: "GitHub", url: "https://docs.github.com/en/actions", type: "Docs", free: true },
    ],
  },
  {
    domain: "UI/UX Design",
    resources: [
      { title: "Google UX Design Certificate", provider: "Google / Coursera", url: "https://www.coursera.org/professional-certificates/google-ux-design", type: "Course", free: true },
      { title: "Refactoring UI", provider: "Adam Wathan & Steve Schoger", url: "https://www.refactoringui.com/", type: "Book", free: false },
      { title: "Figma Learn", provider: "Figma", url: "https://help.figma.com/hc/en-us/categories/360002051613", type: "Docs", free: true },
      { title: "Laws of UX", provider: "Jon Yablonski", url: "https://lawsofux.com/", type: "Article", free: true },
    ],
  },
  {
    domain: "SQA",
    resources: [
      { title: "Software Testing — ISTQB Foundations", provider: "Test Automation University", url: "https://testautomationu.applitools.com/", type: "Course", free: true },
      { title: "Playwright Documentation", provider: "Playwright", url: "https://playwright.dev/docs/intro", type: "Docs", free: true },
      { title: "Cypress Real World Testing", provider: "Cypress", url: "https://learn.cypress.io/", type: "Course", free: true },
      { title: "QA Roadmap", provider: "roadmap.sh", url: "https://roadmap.sh/qa", type: "Article", free: true },
    ],
  },
  {
    domain: "Cybersecurity",
    resources: [
      { title: "TryHackMe — Learning Paths", provider: "TryHackMe", url: "https://tryhackme.com/", type: "Practice", free: true },
      { title: "PortSwigger Web Security Academy", provider: "PortSwigger", url: "https://portswigger.net/web-security", type: "Course", free: true },
      { title: "OWASP Top Ten", provider: "OWASP", url: "https://owasp.org/www-project-top-ten/", type: "Docs", free: true },
      { title: "Cybersecurity Roadmap", provider: "roadmap.sh", url: "https://roadmap.sh/cyber-security", type: "Article", free: true },
    ],
  },
  {
    domain: "Data Analytics",
    resources: [
      { title: "Google Data Analytics Certificate", provider: "Google / Coursera", url: "https://www.coursera.org/professional-certificates/google-data-analytics", type: "Course", free: true },
      { title: "SQL Tutorial", provider: "Mode Analytics", url: "https://mode.com/sql-tutorial/", type: "Course", free: true },
      { title: "Pandas Documentation", provider: "pandas", url: "https://pandas.pydata.org/docs/", type: "Docs", free: true },
      { title: "Kaggle — Data Visualization", provider: "Kaggle", url: "https://www.kaggle.com/learn/data-visualization", type: "Practice", free: true },
    ],
  },
  {
    domain: "Data Engineering",
    resources: [
      { title: "Data Engineering Zoomcamp", provider: "DataTalksClub", url: "https://github.com/DataTalksClub/data-engineering-zoomcamp", type: "Course", free: true },
      { title: "Apache Airflow Docs", provider: "Apache", url: "https://airflow.apache.org/docs/", type: "Docs", free: true },
      { title: "The Data Engineering Roadmap", provider: "roadmap.sh", url: "https://roadmap.sh/data-engineer", type: "Article", free: true },
      { title: "SQL for Data Analysis", provider: "Mode", url: "https://mode.com/sql-tutorial/", type: "Course", free: true },
    ],
  },
  {
    domain: "System Design",
    resources: [
      { title: "System Design Primer", provider: "GitHub (donnemartin)", url: "https://github.com/donnemartin/system-design-primer", type: "Article", free: true },
      { title: "Grokking System Design", provider: "DesignGurus", url: "https://www.designgurus.io/course/grokking-the-system-design-interview", type: "Course", free: false },
      { title: "ByteByteGo Newsletter", provider: "ByteByteGo", url: "https://blog.bytebytego.com/", type: "Article", free: true },
      { title: "System Design Roadmap", provider: "roadmap.sh", url: "https://roadmap.sh/system-design", type: "Article", free: true },
    ],
  },
  {
    domain: "Vibe Coding",
    resources: [
      { title: "Prompt Engineering Guide", provider: "DAIR.AI", url: "https://www.promptingguide.ai/", type: "Article", free: true },
      { title: "Build with AI — Short Courses", provider: "DeepLearning.AI", url: "https://www.deeplearning.ai/short-courses/", type: "Course", free: true },
      { title: "Full Stack Roadmap", provider: "roadmap.sh", url: "https://roadmap.sh/full-stack", type: "Article", free: true },
      { title: "The Odin Project", provider: "The Odin Project", url: "https://www.theodinproject.com/", type: "Course", free: true },
    ],
  },
];

const GENERAL: ResourceGroup = {
  domain: "Career Essentials",
  resources: [
    { title: "Tech Interview Handbook", provider: "Yangshun Tay", url: "https://www.techinterviewhandbook.org/", type: "Article", free: true },
    { title: "freeCodeCamp", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/", type: "Course", free: true },
    { title: "roadmap.sh — All Roadmaps", provider: "roadmap.sh", url: "https://roadmap.sh/", type: "Article", free: true },
    { title: "Git & GitHub Crash Course", provider: "freeCodeCamp", url: "https://www.youtube.com/watch?v=RGOj5yH7evk", type: "Video", free: true },
  ],
};

export function resourcesForDomain(domain: string | null | undefined): ResourceGroup[] {
  if (!domain) return [GENERAL, ...CURATED_RESOURCES.slice(0, 2)];
  const lower = domain.toLowerCase();
  const exact = CURATED_RESOURCES.find((g) => g.domain.toLowerCase() === lower);
  const fuzzy =
    exact ??
    CURATED_RESOURCES.find(
      (g) => lower.includes(g.domain.toLowerCase()) || g.domain.toLowerCase().includes(lower),
    );
  const primary = fuzzy ? [fuzzy] : [];
  return [...primary, GENERAL];
}
