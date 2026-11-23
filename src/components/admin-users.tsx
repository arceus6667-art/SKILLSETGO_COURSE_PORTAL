"use client";
import { useState } from "react";
import { Search, Users } from "lucide-react";
import type { User } from "@/lib/types";
export function AdminUsers({
  users,
}: {
  users: (User & { enrollments: number; passed: number; documents: number })[];
}) {
  const [search, setSearch] = useState("");
  const visible = users.filter((u) =>
    `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>User directory</h2>
          <p>{users.length} accounts · User and Admin profiles only</p>
        </div>
        <label className="catalog-search">
          <Search size={18} />
          <input
            aria-label="Find a user"
            placeholder="Search name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {visible.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Profile</th>
                <th>Enrollments</th>
                <th>Domains passed</th>
                <th>Documents</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    <small>{u.email}</small>
                  </td>
                  <td>
                    <span
                      className={`badge ${u.role === "admin" ? "admin-badge" : ""}`}
                    >
                      {u.role === "admin" ? "Admin" : "User"}
                    </span>
                  </td>
                  <td>{u.enrollments}</td>
                  <td>{u.passed}</td>
                  <td>{u.documents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <Users />
          <h3>
            {users.length
              ? "No matching accounts."
              : "Your first learners will appear here."}
          </h3>
          <p>
            {users.length
              ? "Try a different name or email."
              : "New sign-ins create User profiles automatically. Admin access is assigned by the project owner."}
          </p>
        </div>
      )}
    </section>
  );
}
