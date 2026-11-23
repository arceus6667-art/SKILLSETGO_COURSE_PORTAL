import Link from "next/link";
import {
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Code2,
  BrainCircuit,
  Award,
  Check,
  Orbit,
} from "lucide-react";
import { PublicNav, Footer } from "@/components/brand";
import { DomainGrid } from "@/components/domain-grid";
import { transact, sandbox } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function Home() {
  const domains = await transact((s) => s.domains.filter((d) => d.published));
  return (
    <>
      <PublicNav />
      {sandbox ? (
        <div className="sandbox-bar">
          LOCAL SANDBOX · Explore the complete workflow. No real payment or
          official credential is created.
        </div>
      ) : null}
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="pill">
              <span /> YOUR NEXT CHAPTER STARTS HERE
            </span>
            <h1>
              Learn with purpose.
              <br />
              Build with confidence.
              <br />
              <em>Prove your skills.</em>
            </h1>
            <p>
              A learning journey that moves at your pace. Explore future-focused
              domains, put your knowledge to the test, and turn progress into a
              verifiable achievement.
            </p>
            <div className="hero-actions">
              <Link href="/domains" className="btn btn-primary">
                Explore learning domains
              </Link>
              <Link href="/how-it-works" className="btn btn-outline">
                See how it works
              </Link>
            </div>
            <div className="hero-assurance">
              <span>
                <Check size={15} /> Learn at your pace
              </span>
              <span>
                <Check size={15} /> Free performance report
              </span>
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="Learning, assessment and achievement connected in one journey"
          >
            <div className="orbital orbital-one" />
            <div className="orbital orbital-two" />
            <div className="orbit-tag tag-code">
              <Code2 /> Build something meaningful
            </div>
            <div className="orbit-tag tag-brain">
              <BrainCircuit /> Discover your potential
            </div>
            <div className="achievement-card">
              <div className="achievement-logo">
                <GraduationCap size={40} />
              </div>
              <span className="eyebrow">YOUR SKILLS. RECOGNIZED.</span>
              <h2>
                Knowledge becomes
                <br />
                <em>your next opportunity.</em>
              </h2>
              <div className="mini-credential">
                <Award size={35} />
                <div>
                  <strong>Certificate of Completion</strong>
                  <small>A milestone worth sharing</small>
                </div>
                <ShieldCheck size={22} />
              </div>
              <div className="achievement-track">
                <span>LEARN</span>
                <i />
                <span>BUILD</span>
                <i />
                <span>PROVE</span>
              </div>
            </div>
            <div className="orbit-tag tag-award">
              <ShieldCheck /> Verifiable achievement
            </div>
            <div className="art-caption">
              A clear path from curiosity to capability.
            </div>
          </div>
        </section>
        <section className="principles">
          <div>
            <BookOpen />
            <strong>12 learning domains</strong>
            <span>One place to find your direction</span>
          </div>
          <div>
            <Orbit />
            <strong>Your learning. Your pace.</strong>
            <span>Study first or take a direct assessment</span>
          </div>
          <div>
            <ShieldCheck />
            <strong>Proof you can verify</strong>
            <span>Secure QR-linked credentials</span>
          </div>
        </section>
        <section className="section">
          <div className="section-heading">
            <div>
              <span className="eyebrow gold">FIND YOUR DIRECTION</span>
              <h2>
                Big ambitions.
                <br />
                Twelve places to begin.
              </h2>
            </div>
            <p>
              From your first line of code to your next engineering challenge.
              Choose a domain and start building your knowledge.
            </p>
          </div>
          <DomainGrid domains={domains} />
        </section>
        <section className="journey section">
          <span className="eyebrow gold">A PATH THAT MAKES SENSE</span>
          <h2>From “I’m curious” to “I did it.”</h2>
          <div className="three-grid">
            {[
              [
                "Explore & learn",
                "Choose your domain. Work through the available videos, reading, and resources at your own pace.",
              ],
              [
                "Demonstrate your skills",
                "Take a 30-question assessment. You need 23 correct answers to pass, with up to five attempts.",
              ],
              [
                "Make it official",
                "Get your performance report for free. Purchase optional documents after passing or secure your bundle early.",
              ],
            ].map(([title, text], i) => (
              <article key={title}>
                <span className="step">0{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <Link className="btn btn-primary" href="/login">
            Begin your learning journey
          </Link>
        </section>
        <section className="section pricing-teaser">
          <div>
            <span className="eyebrow gold">CLARITY AT EVERY STEP</span>
            <h2>
              Learn freely.
              <br />
              Celebrate your achievement.
            </h2>
            <p>
              Learning and assessment have no separate registration fee.
              Documents are optional and issued only after a passing result and
              verified payment.
            </p>
            <Link href="/pricing" className="btn btn-outline">
              View all pricing
            </Link>
          </div>
          <div className="price-feature">
            <span className="pill">EARLY DOCUMENT BUNDLE</span>
            <div className="big-price">
              ₹400<small> / domain</small>
            </div>
            <p>Before your first examination attempt</p>
            <ul>
              <li>
                <Check /> Certificate of Completion
              </li>
              <li>
                <Check /> Letter of Appreciation
              </li>
              <li>
                <Check /> Complimentary performance report
              </li>
            </ul>
            <small>₹500 after starting · Individual documents ₹350 each</small>
          </div>
        </section>
        <section className="section faq">
          <span className="eyebrow gold">A LITTLE MORE CLARITY</span>
          <h2>Questions, answered.</h2>
          {[
            [
              "Do I have to complete every learning resource?",
              "No. You can choose the direct-examination pathway after acknowledging the policy. Your learning history remains separate from your examination record.",
            ],
            [
              "How is the examination scored?",
              "Each exam has 30 single-choice questions. A score of 23 or more passes. You have up to five attempts per domain.",
            ],
            [
              "What happens if I switch tabs?",
              "In standard mode, three confirmed tab or fullscreen exits cause autosubmission. Browser monitoring has limitations. Accessibility accommodations are available before starting.",
            ],
            [
              "Are documents included for free?",
              "The performance report is free. The Certificate of Completion and Letter of Appreciation are optional paid documents, issued only after passing and verified payment.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
