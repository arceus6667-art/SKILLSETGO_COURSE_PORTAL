import Link from "next/link";
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PublicNav, Footer } from "@/components/brand";
import { DomainGrid } from "@/components/domain-grid";
import { learningGoals } from "@/lib/discovery";
import { transact, sandbox } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function Home() {
  const domains = await transact((s) => s.domains.filter((d) => d.published));
  return (
    <div className="academy-home">
      <PublicNav />
      {sandbox ? (
        <div className="preview-notice">
          LOCAL PREVIEW · Test accounts, payments, and credentials.
        </div>
      ) : null}
      <main>
        <section className="academy-hero">
          <div className="academy-hero-inner">
            <div className="academy-hero-copy">
              <span className="hero-kicker">
                <Sparkles size={16} /> BIG IDEAS START WITH ONE NEW SKILL
              </span>
              <h1>
                Less searching.
                <br />
                More learning.
                <br />
                <em>Your next move.</em>
              </h1>
              <p>
                Build the skills you’re curious about. Learn at your pace, put
                your knowledge to the test, and make your progress count.
              </p>
              <div className="hero-actions">
                <Link className="btn btn-gold" href="/login">
                  Start your learning journey
                </Link>
                <Link className="hero-secondary" href="/domains">
                  Explore all domains
                </Link>
              </div>
              <div className="hero-checks">
                <span>
                  <Check size={16} /> Free learning & assessments
                </span>
                <span>
                  <Check size={16} /> Optional verified documents
                </span>
              </div>
            </div>
            <div
              className="learning-scene"
              aria-label="Illustration of the learning journey from a new skill to a verified achievement"
            >
              <div className="scene-window">
                <div className="scene-toolbar">
                  <span />
                  <span />
                  <span />
                  <small>YOUR NEXT CHAPTER</small>
                </div>
                <div className="scene-course">
                  <div className="scene-code">
                    <Code2 size={48} />
                    <span>hello, possibilities.</span>
                  </div>
                  <div>
                    <small>EXPLORE · LEARN · PRACTICE</small>
                    <h2>
                      A little progress.
                      <br />
                      Every single day.
                    </h2>
                    <div className="scene-lessons">
                      <span>
                        <Play size={13} fill="currentColor" /> Videos
                      </span>
                      <span>
                        <BookOpen size={14} /> Reading
                      </span>
                      <span>
                        <ClipboardCheck size={14} /> Assessment
                      </span>
                    </div>
                  </div>
                </div>
                <div className="scene-path">
                  <span>
                    <CheckCircle2 /> Discover a domain
                  </span>
                  <span>
                    <CheckCircle2 /> Build your knowledge
                  </span>
                  <span>
                    <Award /> Prove what you know
                  </span>
                </div>
              </div>
              <div className="scene-badge">
                <ShieldCheck size={27} />
                <div>
                  <strong>Achievement, made verifiable.</strong>
                  <small>Secure QR-linked documents</small>
                </div>
              </div>
              <div className="scene-float">
                <Sparkles size={18} /> Made for your next chapter
              </div>
            </div>
          </div>
          <div className="academy-proof">
            <div>
              <strong>{domains.length}</strong>
              <span>domains to discover</span>
            </div>
            <div>
              <strong>Your pace</strong>
              <span>videos, PDFs & reading</span>
            </div>
            <div>
              <strong>Free report</strong>
              <span>understand your performance</span>
            </div>
            <div>
              <strong>One journey</strong>
              <span>learn, assess & achieve</span>
            </div>
          </div>
        </section>
        <section className="academy-section goal-section">
          <div className="academy-section-title">
            <div>
              <span className="eyebrow gold">START WITH WHAT EXCITES YOU</span>
              <h2>A direction for every ambition.</h2>
            </div>
            <p>
              You don’t need the whole plan.
              <br />
              Just a place to begin.
            </p>
          </div>
          <div className="home-goals">
            {learningGoals
              .filter((g) => g.id !== "all")
              .map((g) => (
                <Link href={`/domains?goal=${g.id}`} key={g.id}>
                  <span className="goal-orbit">
                    <Sparkles size={22} />
                  </span>
                  <strong>{g.label}</strong>
                  <span>Find your learning path</span>
                </Link>
              ))}
          </div>
        </section>
        <section className="academy-section catalogue-home">
          <div className="academy-section-title">
            <div>
              <span className="eyebrow gold">A WORLD OF POSSIBILITIES</span>
              <h2>Find a skill. Make it yours.</h2>
            </div>
            <Link href="/domains" className="btn btn-outline">
              <Search size={17} /> Browse all {domains.length} domains
            </Link>
          </div>
          <DomainGrid domains={domains.slice(0, 6)} />
        </section>
        <section className="academy-section journey-block">
          <div className="academy-section-title">
            <div>
              <span className="eyebrow gold">A CLEAR PATH FORWARD</span>
              <h2>
                From “I want to”
                <br />
                to “I know how.”
              </h2>
            </div>
            <p>
              A simple journey with the freedom to choose your starting point.
            </p>
          </div>
          <div className="journey-cards">
            {[
              {
                Icon: BookOpen,
                title: "Learn something new",
                text: "Choose a domain and explore its published videos, PDFs, and reading. Your progress stays with you.",
                link: "/domains",
                label: "Explore learning paths",
              },
              {
                Icon: ClipboardCheck,
                title: "Already know your stuff?",
                text: "Choose the direct-exam pathway after acknowledging the policy. 30 questions, 23 to pass, up to five attempts.",
                link: "/dashboard/exams",
                label: "Visit the exam center",
              },
              {
                Icon: Award,
                title: "Make your progress count",
                text: "Get a free performance report. After passing, unlock optional documents with verified payment.",
                link: "/pricing",
                label: "Explore credentials",
              },
            ].map(({ Icon, title, text, link, label }) => (
              <article key={title}>
                <div className="journey-icon">
                  <Icon size={27} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <Link href={link}>{label}</Link>
              </article>
            ))}
          </div>
        </section>
        <section className="academy-section credential-spotlight">
          <div>
            <span className="eyebrow gold">YOUR WORK DESERVES A RECORD</span>
            <h2>
              A milestone you can
              <br />
              <em>make official.</em>
            </h2>
            <p>
              Celebrate a passing result with a Certificate of Completion and
              Letter of Appreciation. Each document links to a secure
              verification record.
            </p>
            <ul>
              <li>
                <CheckCircle2 /> High-resolution landscape certificate
              </li>
              <li>
                <CheckCircle2 /> QR verification for issued documents
              </li>
              <li>
                <CheckCircle2 /> Free performance report with your result
              </li>
            </ul>
            <Link className="btn btn-primary" href="/verification">
              Verify a credential
            </Link>
          </div>
          <div className="credential-price">
            <span className="price-label">OPTIONAL DOCUMENT BUNDLE</span>
            <div className="credential-seal">
              <Award size={42} />
            </div>
            <h3>
              Your achievement.
              <br />A lasting impression.
            </h3>
            <div className="credential-amount">
              ₹400 <small>per domain</small>
            </div>
            <p>Before your first examination attempt</p>
            <div className="price-breakdown">
              <span>
                After starting <strong>₹500</strong>
              </span>
              <span>
                Individual document <strong>₹350</strong>
              </span>
            </div>
            <Link className="btn btn-gold" href="/pricing">
              See document options
            </Link>
            <small>Issued after passing and verified payment.</small>
          </div>
        </section>
        <section className="academy-section academy-faq">
          <div>
            <span className="eyebrow gold">GOOD TO KNOW</span>
            <h2>
              A little clarity.
              <br />A confident start.
            </h2>
            <p>Everything you need before your next step.</p>
            <Link href="/contact">Get in touch with support</Link>
          </div>
          <div>
            {[
              [
                "Can I take an exam without finishing the learning materials?",
                "Yes. Choose the direct-exam pathway and acknowledge the exam policy before starting. Learning progress is kept separately from exam results.",
              ],
              [
                "What does learning cost?",
                "Learning, assessments, and the performance report have no separate registration fee. Certificates and appreciation letters are optional paid documents.",
              ],
              [
                "What are the assessment requirements?",
                "Each assessment has 30 questions. Pass with 23 correct answers, with up to five attempts per domain. The time limit is shown before starting.",
              ],
              [
                "How does exam monitoring work?",
                "Three confirmed tab or fullscreen exits trigger autosubmission in standard mode. Browser monitoring has limits. Accessibility mode is available before starting.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="academy-final">
          <span className="eyebrow">ONE SMALL STEP. A NEW POSSIBILITY.</span>
          <h2>Your next chapter is waiting.</h2>
          <p>Find your direction. Build your knowledge. Prove your skills.</p>
          <Link className="btn btn-gold" href="/login">
            Let’s get started
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
