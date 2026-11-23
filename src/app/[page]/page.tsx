import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicNav, Footer } from "@/components/brand";
const pages: Record<
  string,
  { title: string; intro: string; sections: [string, string][] }
> = {
  about: {
    title: "Built for the next version of you.",
    intro:
      "Skill Set Go EduTech brings learning, assessment, and verifiable achievement into one connected experience.",
    sections: [
      [
        "Learn. Build. Prove.",
        "Explore twelve configurable domains. Study available resources, demonstrate your knowledge, and choose optional digital credentials.",
      ],
      [
        "A clear standard",
        "A passing assessment means at least 23 correct answers out of 30. Learning acknowledgements and assessment outcomes remain separate records.",
      ],
    ],
  },
  "how-it-works": {
    title: "Your journey, at your pace.",
    intro: "One connected path from learning to achievement.",
    sections: [
      [
        "Choose your domain",
        "Enroll in a domain and explore administrator-published videos, PDFs, and reading resources.",
      ],
      [
        "Learn or proceed directly",
        "Learning is optional. You can acknowledge the direct-exam policy without changing your resource viewing history.",
      ],
      [
        "Demonstrate your knowledge",
        "Complete thirty single-choice questions within the stated server-enforced time limit. Pass with 23/30, with up to five attempts.",
      ],
      [
        "Keep your achievement",
        "Your performance report is complimentary. Paid documents are issued automatically after a passing result and verified payment.",
      ],
    ],
  },
  pricing: {
    title: "Simple prices. Meaningful milestones.",
    intro:
      "Learning and assessment have no separate registration fee. Paid documents are optional.",
    sections: [
      [
        "Early bundle · ₹400 per domain",
        "Certificate of Completion + Letter of Appreciation, purchased before the first attempt starts. An unpaid early quote cannot be completed in sandbox after the first attempt starts.",
      ],
      [
        "After-start bundle · ₹500 per domain",
        "The same document bundle after any attempt has started. A passing result is still required for issuance.",
      ],
      [
        "Individual documents · ₹350 each",
        "Choose a Certificate of Completion or Letter of Appreciation. Each is priced per domain.",
      ],
      [
        "Performance report · Free",
        "A downloadable PDF after every completed assessment, including unsuccessful attempts. No purchase required.",
      ],
    ],
  },
  examinations: {
    title: "A clear way to demonstrate what you know.",
    intro:
      "Thirty questions. One mark each. Twenty-three correct answers to pass.",
    sections: [
      [
        "Fair and consistent",
        "Up to five attempts per domain. Questions and answer options are shuffled; the server stores a snapshot so later bank edits cannot alter your result.",
      ],
      [
        "Timer and submission",
        "The server owns the deadline and grades saved responses. On expiry, the attempt is finalized on the next request. Late answers are rejected.",
      ],
      [
        "Accessible by design",
        "Choose accessibility mode before starting if assistive technology or browser limitations make fullscreen unsuitable. No webcam recording or screen recording is used.",
      ],
    ],
  },
  "exam-policy": {
    title: "Examination policy",
    intro:
      "Policy version 2026-11-v1. Please read before starting an assessment.",
    sections: [
      [
        "Assessment rules",
        "30 single-correct questions, 1 mark each, no negative marking. Pass at 23/30 (the integer mark needed to meet a 75% threshold). Maximum 5 attempts per domain. Default duration 30 minutes; your readiness page shows the current domain duration.",
      ],
      [
        "Optional learning pathway",
        "You may proceed without completing optional resources after explicit acknowledgement. Mark all as acknowledged is self-reported and does not certify video watch time.",
      ],
      [
        "Browser monitoring and confirmation",
        "Standard mode detects supported tab visibility and fullscreen exits after you enable monitoring. Three intentional exits confirmed by the learner cause autosubmission. Overlapping events are debounced. Browser monitoring can miss events or misclassify system interruptions; it is not proof of misconduct. Do not confirm assistive technology, permission prompts, or operating-system interruptions as intentional exits.",
      ],
      [
        "Accommodations and support",
        "Accessibility mode disables exit penalties and fullscreen requirements. Select it before starting or request help through support. Use it for incompatible browsers or assistive technology.",
      ],
      [
        "Connection and timer",
        "Keep the assessment connected and watch the saved-answer indicator. Only server-received responses count. The deadline continues during disconnection. An expired attempt finalizes on the next server request; no late answers are accepted.",
      ],
      [
        "Review and appeals",
        "Ask support to review interrupted assessments, incorrect questions, or accommodation needs. This MVP does not automatically grant extra attempts.",
      ],
    ],
  },
  privacy: {
    title: "Privacy notice",
    intro: "MVP policy draft for operator review before live launch.",
    sections: [
      [
        "Information used",
        "The platform stores your account identity, enrollment, self-reported learning progress, policy consents, examination responses and results, confirmed exit events, document purchases, issued documents, and support requests.",
      ],
      [
        "Payments and documents",
        "Card details are handled by Razorpay checkout. The platform stores provider references and verified payment status. QR verification reveals an abbreviated recipient name, domain, document type, issuance date, and revocation status.",
      ],
      [
        "Your choices",
        "Use support to request access, correction, deletion, or an accommodation. Retention periods, data controller contact, and grievance details must be finalized by the operator before public launch. Sandbox records stay in the local project directory.",
      ],
    ],
  },
  terms: {
    title: "Platform terms",
    intro: "MVP terms draft for operator review before live launch.",
    sections: [
      [
        "Learning and assessment",
        "Use your own account and provide accurate information. Assessment rules are shown and accepted separately before each attempt.",
      ],
      [
        "Documents",
        "Paid documents require a passing score and verified payment. No external accreditation, government recognition, or employment guarantee is implied. Do not alter or misrepresent credentials.",
      ],
      [
        "Operator review required",
        "The operator must finalize legal identity, contact details, jurisdiction, eligibility, retention, grievance handling, and payment terms before accepting real purchases.",
      ],
    ],
  },
  "refund-policy": {
    title: "Refund and cancellation policy",
    intro:
      "MVP policy draft. The operator must approve final terms before accepting live payments.",
    sections: [
      [
        "Before purchase",
        "Documents are optional. Payment does not guarantee a passing result. Review your chosen domain and document product carefully.",
      ],
      [
        "Duplicate or unsuccessful transactions",
        "Contact support with your order reference if you were charged twice or a captured payment is not reflected. Never send card numbers, CVV, or passwords.",
      ],
      [
        "Refund processing",
        "This MVP provides payment records for finance review. Automated refunds are not enabled. Eligibility, timelines, processing method, and cancellation terms require operator approval.",
      ],
    ],
  },
  contact: {
    title: "Let’s keep you moving.",
    intro:
      "For learning questions, exam accommodations, or document corrections, create a support request in your student portal.",
    sections: [
      [
        "Student support",
        "Sign in and open Help & support. Your request is saved with a status you can track.",
      ],
      [
        "Official reference",
        "Visit skillsetgoedu.in for the organization’s current public information. Contact addresses have not been invented for this MVP.",
      ],
    ],
  },
};
export default async function Info({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const p = pages[page];
  if (!p) notFound();
  return (
    <>
      <PublicNav />
      <main className="section narrow">
        <span className="eyebrow gold">SKILL SET GO EDUTECH</span>
        <h1>{p.title}</h1>
        <p className="lead">{p.intro}</p>
        {p.sections.map(([title, text]) => (
          <section className="policy-section" key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </section>
        ))}
        <div className="hero-actions">
          <Link href="/dashboard" className="btn btn-primary">
            Open student portal
          </Link>
          <a
            href="https://skillsetgoedu.in"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            Official website
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
