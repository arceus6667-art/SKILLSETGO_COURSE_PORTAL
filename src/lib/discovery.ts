export const learningGoals = [
  { id: "all", label: "Explore everything", domains: [] as string[] },
  {
    id: "build",
    label: "Build apps & websites",
    domains: ["python", "web-development", "app-development"],
  },
  {
    id: "data",
    label: "Work with AI & data",
    domains: ["ai-ml", "data-science", "python"],
  },
  {
    id: "secure",
    label: "Secure & scale technology",
    domains: ["cybersecurity", "cloud-devops", "blockchain"],
  },
  {
    id: "creative",
    label: "Design & grow brands",
    domains: ["ui-ux", "digital-marketing", "web-development"],
  },
  {
    id: "engineer",
    label: "Explore engineering",
    domains: ["financial-engineering", "mechatronics", "ai-ml"],
  },
] as const;

export const domainVisuals: Record<
  string,
  { mark: string; caption: string; tone: string }
> = {
  "ai-ml": {
    mark: "AI",
    caption: "Think beyond the algorithm",
    tone: "violet",
  },
  "data-science": {
    mark: "DATA",
    caption: "Find the story in the numbers",
    tone: "blue",
  },
  python: {
    mark: "Py",
    caption: "Small scripts. Big possibilities.",
    tone: "mint",
  },
  "web-development": {
    mark: "</>",
    caption: "Build your corner of the web",
    tone: "blue",
  },
  "app-development": {
    mark: "APP",
    caption: "Bring an idea to the screen",
    tone: "violet",
  },
  cybersecurity: {
    mark: "{✓}",
    caption: "Make the digital world safer",
    tone: "mint",
  },
  "cloud-devops": {
    mark: "CLOUD",
    caption: "From local to limitless",
    tone: "blue",
  },
  "ui-ux": {
    mark: "Aa",
    caption: "Make every interaction matter",
    tone: "rose",
  },
  blockchain: {
    mark: "WEB3",
    caption: "Understand connected systems",
    tone: "violet",
  },
  "digital-marketing": {
    mark: "GROW",
    caption: "Turn attention into impact",
    tone: "rose",
  },
  "financial-engineering": {
    mark: "ƒ(x)",
    caption: "Where finance meets technology",
    tone: "mint",
  },
  mechatronics: {
    mark: "MECH",
    caption: "Connect code to the real world",
    tone: "blue",
  },
};
