import Link from "next/link";
import { ShieldCheck, ShieldX } from "lucide-react";
import { PublicNav, Footer } from "@/components/brand";
import { transact } from "@/lib/store";
import { safeEqual, verifyToken } from "@/lib/engine";
export const dynamic = "force-dynamic";
export default async function Verification({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; token?: string }>;
}) {
  const { id, token } = await searchParams;
  const result =
    id && token
      ? await transact((s) => {
          const c = s.credentials.find((c) => c.id === id);
          if (!c || !safeEqual(verifyToken(c.id, c.mode === "sandbox"), token))
            return null;
          return { credential: c, domain: c.domainName };
        })
      : null;
  return (
    <>
      <PublicNav />
      <main className="section narrow">
        <span className="eyebrow gold">TRUST, MADE VISIBLE</span>
        <h1>Verify an achievement.</h1>
        <p className="lead">
          Scan the QR code on a document or enter the complete verification
          details.
        </p>
        <form className="panel" method="get">
          <label>
            Credential ID
            <input name="id" required defaultValue={id} maxLength={100} />
          </label>
          <label>
            Verification token
            <input name="token" required defaultValue={token} maxLength={64} />
          </label>
          <button className="btn btn-primary" type="submit">
            Verify credential
          </button>
        </form>
        {id ? (
          <section className="panel spaced">
            {result && !result.credential.revoked ? (
              <>
                <ShieldCheck size={40} className="gold" />
                <h2>
                  {result.credential.mode === "sandbox"
                    ? "Verified sandbox sample"
                    : "Credential verified"}
                </h2>
                <p>
                  {result.credential.mode === "sandbox"
                    ? "This is a local test document, not an official credential."
                    : "This document is recorded in the Skill Set Go credential register."}
                </p>
                <dl>
                  <dt>Recipient</dt>
                  <dd>
                    {result.credential.name.split(" ")[0]}{" "}
                    {result.credential.name
                      .split(" ")
                      .slice(1)
                      .map((n) => n[0] + ".")
                      .join(" ")}
                  </dd>
                  <dt>Domain</dt>
                  <dd>{result.domain}</dd>
                  <dt>Document</dt>
                  <dd>
                    {result.credential.kind === "certificate"
                      ? "Certificate of Completion"
                      : "Letter of Appreciation"}
                  </dd>
                  <dt>Issued</dt>
                  <dd>{result.credential.issuedAt.slice(0, 10)}</dd>
                </dl>
                <p className="muted">
                  Recipient names are abbreviated for privacy. No phone, email,
                  or payment information is disclosed.
                </p>
              </>
            ) : (
              <>
                <ShieldX size={40} />
                <h2>
                  {result?.credential.revoked
                    ? "Credential revoked"
                    : "Unable to verify"}
                </h2>
                <p>
                  Check the QR link and document details, or contact support.
                </p>
              </>
            )}
          </section>
        ) : null}
        <p className="muted">
          A verification record confirms issuance by this platform. It does not
          imply external accreditation.
        </p>
        <Link href="/contact">Contact support</Link>
      </main>
      <Footer />
    </>
  );
}
