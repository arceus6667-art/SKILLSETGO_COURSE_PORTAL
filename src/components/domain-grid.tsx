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
import { domainVisuals } from "@/lib/discovery";
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
      {domains.map((d) => {
        const domainIndex = Math.max(0, domainIds.indexOf(d.id));
        const Icon = icons[domainIndex];
        const visual = domainVisuals[d.id] || {
          mark: "GO",
          caption: "Discover your next skill",
          tone: "blue",
        };
        return (
          <Link
            className="domain-card"
            href={portal ? `/dashboard/course/${d.slug}` : `/domains/${d.slug}`}
            key={d.id}
          >
            <div
              className={`domain-cover cover-${visual.tone}`}
              aria-hidden="true"
            >
              <span className="cover-caption">{visual.caption}</span>
              <span className="cover-mark">{visual.mark}</span>
              <Icon size={43} strokeWidth={1.4} />
              <span className="cover-format">SELF-PACED PATH</span>
            </div>
            <div className="domain-card-body">
              <span className="eyebrow">{d.category}</span>
              <h3>{d.short}</h3>
              <p>{d.description}</p>
              <div className="card-bottom">
                <span>
                  {d.resources.length
                    ? `${d.resources.length} resources`
                    : "Curriculum coming soon"}
                </span>
                <span className="text-navy">View path</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
