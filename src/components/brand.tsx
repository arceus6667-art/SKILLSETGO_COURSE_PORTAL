import Link from "next/link";
export function Brand() {
  return (
    <Link href="/" className="brand">
      <img src="/official-logo.jpg" alt="Skill Set Go EduTech official logo" />
      <span>
        SKILL SET GO<small>EDUTECH · LEARN. BUILD. PROVE.</small>
      </span>
    </Link>
  );
}
export function Footer() {
  return (
    <footer>
      <Brand />
      <p>Build knowledge. Demonstrate capability. Own your next chapter.</p>
      <div>
        <Link href="/domains">Learning paths</Link>
        <Link href="/pricing">Documents & pricing</Link>
        <Link href="/verification">Verify a credential</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/exam-policy">Exam policy</Link>
        <Link href="/refund-policy">Refund policy</Link>
        <Link href="/contact">Support</Link>
      </div>
      <small>
        Skill Set Go EduTech · No external accreditation is implied.
      </small>
    </footer>
  );
}
export function PublicNav() {
  return (
    <header className="public-nav">
      <Brand />
      <nav>
        <Link href="/domains">Learning paths</Link>
        <Link href="/how-it-works">How it works</Link>
        <Link href="/pricing">Certificates & pricing</Link>
        <Link href="/verification">Verify a credential</Link>
      </nav>
      <details className="public-mobile-menu">
        <summary>Menu</summary>
        <nav>
          <Link href="/domains">Learning paths</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/verification">Verify a credential</Link>
          <Link href="/login?portal=admin">Admin sign-in</Link>
          <Link href="/login">User sign-in</Link>
        </nav>
      </details>
      <Link className="btn btn-primary" href="/dashboard">
        Start learning
      </Link>
    </header>
  );
}
