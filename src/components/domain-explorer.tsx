"use client";
import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { DomainGrid } from "./domain-grid";
import type { Domain } from "@/lib/types";
export function DomainExplorer({
  domains,
  initial = "",
  portal = true,
}: {
  domains: Domain[];
  initial?: string;
  portal?: boolean;
}) {
  const [search, setSearch] = useState(initial),
    [category, setCategory] = useState("All domains");
  const categories = [
    "All domains",
    ...new Set(domains.map((d) => d.category)),
  ];
  const filtered = domains.filter(
    (d) =>
      (category === "All domains" || d.category === category) &&
      `${d.name} ${d.category} ${d.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
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
      <div className="catalog-count">
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
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
