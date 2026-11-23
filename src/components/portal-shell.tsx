"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  Award,
  CreditCard,
  UserRound,
  LifeBuoy,
  Settings2,
  LogOut,
  ShieldCheck,
  Search,
  Menu,
  X,
  Users,
  FolderOpen,
  HelpCircle,
} from "lucide-react";
import { Brand } from "./brand";
import type { User } from "@/lib/types";
const userMenu = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/dashboard/domains", "Explore domains", BookOpen],
  ["/dashboard/my-learning", "My learning", GraduationCap],
  ["/dashboard/exams", "Examination center", ClipboardCheck],
  ["/dashboard/results", "My results", ShieldCheck],
  ["/dashboard/documents", "My documents", Award],
  ["/dashboard/payments", "Payments", CreditCard],
] as const;
const adminMenu = [
  ["/admin", "Overview", LayoutDashboard],
  ["/admin?view=students", "Users", Users],
  ["/admin?view=content", "Courses & resources", FolderOpen],
  ["/admin?view=questions", "Examinations", ClipboardCheck],
  ["/admin?view=finance", "Payments", CreditCard],
  ["/admin?view=documents", "Documents", Award],
  ["/admin?view=support", "Support requests", HelpCircle],
  ["/admin?view=settings", "Settings", Settings2],
  ["/admin?view=audit", "Audit log", ShieldCheck],
] as const;
export function PortalShell({
  user,
  sandbox,
  children,
}: {
  user: User;
  sandbox: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname(),
    query = useSearchParams(),
    router = useRouter(),
    mobile = useRef<HTMLDialogElement>(null);
  const admin = pathname.startsWith("/admin");
  const navigation = admin ? adminMenu : userMenu;
  const selected = admin ? query.get("view") || "overview" : "";
  const active = (href: string) =>
    admin
      ? (new URL(href, "http://local").searchParams.get("view") ||
          "overview") === selected
      : pathname === href ||
        (href === "/dashboard/my-learning" &&
          pathname.startsWith("/dashboard/course/")) ||
        (href === "/dashboard/exams" &&
          pathname.startsWith("/dashboard/exam/"));
  const title =
    navigation.find(([href]) => active(href))?.[1] || "Your workspace";
  const links = navigation.map(([href, label, Icon]) => (
    <Link
      key={href}
      href={href}
      onClick={() => mobile.current?.close()}
      className={active(href) ? "active" : ""}
      aria-current={active(href) ? "page" : undefined}
    >
      <Icon size={19} />
      {label}
    </Link>
  ));
  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  const utilities = (
    <>
      <Link href="/dashboard/profile">
        <UserRound size={18} />
        My profile
      </Link>
      <Link href="/dashboard/support">
        <LifeBuoy size={18} />
        Help & support
      </Link>
      {user.role === "admin" ? (
        <Link href={admin ? "/dashboard" : "/admin"}>
          {admin ? <GraduationCap size={18} /> : <Settings2 size={18} />}Open{" "}
          {admin ? "user" : "admin"} portal
        </Link>
      ) : null}
      <button onClick={logout}>
        <LogOut size={18} />
        Sign out
      </button>
    </>
  );
  return (
    <div
      className={`portal workspace-v2 ${admin ? "admin-workspace" : "user-workspace"}`}
    >
      <a className="skip-link" href="#workspace-main">
        Skip to main content
      </a>
      <div className="mobile-toolbar">
        <Brand />
        <button
          aria-label="Open navigation"
          onClick={() => mobile.current?.showModal()}
        >
          <Menu />
        </button>
      </div>
      <dialog ref={mobile} className="navigation-dialog">
        <div className="mobile-toolbar">
          <Brand />
          <button
            aria-label="Close navigation"
            onClick={() => mobile.current?.close()}
          >
            <X />
          </button>
        </div>
        <nav aria-label="Mobile navigation">{links}</nav>
        <div
          className="mobile-utilities"
          onClick={() => mobile.current?.close()}
        >
          {utilities}
        </div>
      </dialog>
      <aside className="sidebar">
        <Brand />
        <span className="sidebar-label">
          {admin ? "ADMIN WORKSPACE" : "LEARNING WORKSPACE"}
        </span>
        <nav aria-label={admin ? "Admin navigation" : "Learning navigation"}>
          {links}
        </nav>
        <div className="sidebar-bottom">
          {utilities}
          <div className="sidebar-note">
            <span className="eyebrow gold">
              {admin ? "A BETTER LEARNING EXPERIENCE" : "LEARN. BUILD. PROVE."}
            </span>
            <p>
              {admin
                ? "Everything your learners need. One connected platform."
                : "Small steps. Real skills. Your next chapter."}
            </p>
          </div>
        </div>
      </aside>
      <div className="portal-main">
        <header className="portal-header">
          <div>
            <span className="eyebrow">
              {admin ? "ADMIN PORTAL" : "USER PORTAL"}
            </span>
            <p>{title}</p>
          </div>
          {!admin ? (
            <form className="workspace-search" action="/dashboard/domains">
              <Search size={17} />
              <input
                name="q"
                aria-label="Search learning domains"
                placeholder="What do you want to learn?"
              />
            </form>
          ) : (
            <span className="workspace-mode">Platform management</span>
          )}
          <Link href="/dashboard/profile" className="user-chip">
            <span>{user.name.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.role === "admin" ? "Admin" : "User"}</small>
            </div>
          </Link>
        </header>
        {sandbox ? (
          <div className="sandbox-bar">
            LOCAL PREVIEW · Test accounts and payments · Live database is
            configured separately
          </div>
        ) : null}
        <main id="workspace-main" className="portal-content">
          {children}
        </main>
        <div className="workspace-footer">
          Skill Set Go EduTech<span>Learn. Build. Prove.</span>
        </div>
      </div>
    </div>
  );
}
