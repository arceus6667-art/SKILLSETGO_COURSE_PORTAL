"use client";
import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { DomainGrid } from "./domain-grid";
import type { Domain } from "@/lib/types";
import { learningGoals } from "@/lib/discovery";
export function DomainExplorer({
  domains,
  initial = "",
  portal = true,
  initialGoal = "all",
}: {
  domains: Domain[];
  initial?: string;
  portal?: boolean;
  initialGoal?: string;
}) {
  const [search, setSearch] = useState(initial),
    [category, setCategory] = useState("All domains"),
    [goal, setGoal] = useState(
      learningGoals.some((g) => g.id === initialGoal) ? initialGoal : "all",
    );
  const selectedGoal = learningGoals.find((g) => g.id === goal)!;
  const categories = [
    "All domains",
    ...new Set(domains.map((d) => d.category)),
  ];
  const filtered = domains.filter(
    (d) =>
      (goal === "all" ||
        (selectedGoal.domains as readonly string[]).includes(d.id)) &&
      (category === "All domains" || d.category === category) &&
      `${d.name} ${d.category} ${d.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="goal-discovery">
        <div>
          <span className="eyebrow gold">YOUR GOAL. YOUR STARTING POINT.</span>
          <h2>What would you like to do?</h2>
          <p>Choose a direction to find relevant learning paths.</p>
        </div>
        <div className="goal-chips" aria-label="Learning goals">
          {learningGoals.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={goal === g.id}
              className={goal === g.id ? "selected" : ""}
              onClick={() => setGoal(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
      <div className="catalog-controls">
        <label className="catalog-search">
          <Search size={19} />
          <input
            aria-label="Search domains"
            placeholder="Search a skill, topic, or domain…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search ? (
            <button aria-label="Clear search" onClick={() => setSearch("")}>
              <X size={16} />
            </button>
          ) : null}
        </label>
        <label className="catalog-filter">
          <SlidersHorizontal size={17} />
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="catalog-count" role="status" aria-live="polite">
        <strong>{filtered.length}</strong>{" "}
        {filtered.length === 1 ? "domain" : "domains"} to explore
        <span>Learn at your pace. Assess when you’re ready.</span>
      </div>
      {filtered.length ? (
        <DomainGrid domains={filtered} portal={portal} />
      ) : (
        <div className="panel empty">
          <Search />
          <h2>No domains match your search.</h2>
          <p>Try another topic or clear your filters.</p>
          <button
            className="btn btn-outline"
            onClick={() => {
              setSearch("");
              setCategory("All domains");
              setGoal("all");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
