import Link from "next/link";
import {
  ShieldCheck,
  BookOpen,
  Award,
  Users,
  GraduationCap,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { sandbox } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ portal?: string; error?: string }>;
}) {
  const query = await searchParams,
    admin = query.portal === "admin";
  return (
    <main className="login-page login-v2">
      <div className="login-aside">
        <Brand />
        <div className="login-story">
          <span className="eyebrow gold">LEARN. BUILD. PROVE.</span>
          <h1>
            Your next chapter
            <br />
            starts with <em>you.</em>
          </h1>
          <p>
            A connected space to build knowledge, demonstrate your skills, and
            make your progress count.
          </p>
          <div className="login-features">
            <div>
              <BookOpen size={20} />
              <span>Twelve directions to explore</span>
            </div>
            <div>
              <ShieldCheck size={20} />
              <span>A clear standard for assessment</span>
            </div>
            <div>
              <Award size={20} />
              <span>Achievements you can verify</span>
            </div>
          </div>
        </div>
        <div className="login-aside-footer">
          Skill Set Go EduTech<span>Built around your growth.</span>
        </div>
      </div>
      <div className="login-box">
        <div className="login-badge">
          {admin ? <Users size={22} /> : <GraduationCap size={23} />}
        </div>
        <span className="eyebrow">
          {sandbox ? "LOCAL PREVIEW" : admin ? "ADMIN PORTAL" : "USER PORTAL"}
        </span>
        <h2>
          {admin ? "Welcome to your control room." : "Good to see you here."}
        </h2>
        <p>
          {admin
            ? "Manage courses, learners, assessments, and achievements."
            : "Sign in to pick up your learning journey."}
        </p>
        <div className="portal-tabs" aria-label="Choose portal">
          <Link href="/login" className={!admin ? "selected" : ""}>
            User
          </Link>
          <Link href="/login?portal=admin" className={admin ? "selected" : ""}>
            Admin
          </Link>
        </div>
        {query.error ? (
          <p className="notice">
            Your sign-in link could not be completed. Please request a fresh
            link.
          </p>
        ) : null}
        <LoginForm
          sandbox={sandbox}
          googleReady={process.env.GOOGLE_AUTH_ENABLED === "true"}
          portal={admin ? "admin" : "user"}
        />
        {admin && !sandbox ? (
          <p className="muted">
            Admin access is assigned to your account by the project owner.
          </p>
        ) : null}
        <small>
          By continuing, you accept the <Link href="/terms">terms</Link> and{" "}
          <Link href="/privacy">privacy notice</Link>. Exam policies are
          acknowledged separately.
        </small>
        <Link className="login-home" href="/">
          Back to Skill Set Go
        </Link>
      </div>
    </main>
  );
}
