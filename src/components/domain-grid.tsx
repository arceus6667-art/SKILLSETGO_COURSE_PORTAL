import Link from "next/link";
import {
  BrainCircuit,
  ChartNoAxesCombined,
  Code2,
  Globe,
  Smartphone,
  ShieldCheck,
  Cloud,
  PenTool,
  Blocks,
  TrendingUp,
  ChartCandlestick,
  Cpu,
} from "lucide-react";
import type { Domain } from "@/lib/types";
const icons = [
  BrainCircuit,
  ChartNoAxesCombined,
  Code2,
  Globe,
  Smartphone,
  ShieldCheck,
  Cloud,
  PenTool,
  Blocks,
  TrendingUp,
  ChartCandlestick,
  Cpu,
];
const domainIds = [
  "ai-ml",
  "data-science",
  "python",
  "web-development",
  "app-development",
  "cybersecurity",
  "cloud-devops",
  "ui-ux",
  "blockchain",
  "digital-marketing",
  "financial-engineering",
  "mechatronics",
];
export function DomainGrid({
  domains,
  portal = false,
}: {
  domains: Domain[];
  portal?: boolean;
}) {
  return (
    <div className="domain-grid">
      {domains.map((d, i) => {
        const domainIndex = Math.max(0, domainIds.indexOf(d.id));
        const Icon = icons[domainIndex];
        return (
          <Link
            className="domain-card"
            href={portal ? `/dashboard/course/${d.slug}` : `/domains/${d.slug}`}
            key={d.id}
          >
            <div className={`domain-icon tint-${domainIndex % 4}`}>
              <Icon size={25} />
            </div>
            <span className="eyebrow">{d.category}</span>
            <h3>{d.short}</h3>
            <p>{d.description}</p>
            <div className="card-bottom">
              <span>Self-paced learning</span>
              <span className="text-navy">Explore domain</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
