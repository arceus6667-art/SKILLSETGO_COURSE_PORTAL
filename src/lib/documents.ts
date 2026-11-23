import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import type { Credential, Domain, Attempt } from "./types";
import { verifyToken } from "./engine";
export function verificationUrl(c: Credential) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/verification?id=${c.id}&token=${verifyToken(c.id, c.mode === "sandbox")}`;
}
const escape = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
export async function certificateSVG(
  c: Credential,
  d: Domain,
  preview = false,
  signatureBytes?: Buffer,
) {
  const logo = await fs.readFile(
    path.join(process.cwd(), "public", "official-logo.jpg"),
  );
  const qr = await QRCode.toDataURL(
    preview
      ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verification`
      : verificationUrl(c),
    { width: 350, margin: 1, errorCorrectionLevel: "M" },
  );
  const date = new Date(c.issuedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="3840" height="2160" viewBox="0 0 3840 2160"><rect width="3840" height="2160" fill="#fff"/><path d="M0 0H1050L0 1050Z" fill="#102b4e"/><path d="M0 0H700L0 700Z" fill="#b7924c"/><path d="M3840 2160H2900L3840 1220Z" fill="#102b4e"/><path d="M3840 2160H3280L3840 1600Z" fill="#b7924c"/><rect x="125" y="125" width="3590" height="1910" fill="none" stroke="#b7924c" stroke-width="5"/><rect x="152" y="152" width="3536" height="1856" fill="none" stroke="#d8dce2" stroke-width="2"/><image x="1540" y="180" width="760" height="500" preserveAspectRatio="xMidYMid meet" href="data:image/jpeg;base64,${logo.toString("base64")}"/><g text-anchor="middle" fill="#102b4e"><text x="1920" y="800" font-size="64" font-family="Arial,sans-serif" letter-spacing="14">CERTIFICATE OF COMPLETION</text><path d="M1480 875H2360" stroke="#b7924c" stroke-width="4"/><text x="1920" y="1010" font-size="42" font-family="Arial,sans-serif" fill="#687386">This certificate is proudly presented to</text><text x="1920" y="1190" font-size="${Math.min(112, (2500 / Math.max(c.name.length, 1)) * 1.6)}" font-family="Georgia,serif">${escape(c.name)}</text><text x="1920" y="1320" font-size="40" font-family="Arial,sans-serif" fill="#687386">for successfully completing the assessment requirements in</text><text x="1920" y="1450" font-size="${Math.min(66, (2800 / d.name.length) * 1.65)}" font-family="Georgia,serif">${escape(d.name)}</text><text x="1920" y="1550" font-size="33" font-family="Arial,sans-serif" fill="#687386">Skill Set Go EduTech · Learn. Build. Prove.</text></g><g fill="#102b4e" font-family="Arial,sans-serif"><text x="480" y="1800" font-size="38">${date}</text><path d="M480 1840H1130" stroke="#b7924c" stroke-width="3"/><text x="480" y="1900" font-size="28" fill="#687386">DATE OF ISSUE</text>${signatureBytes ? `<image x="1580" y="1670" width="650" height="150" href="data:image/png;base64,${signatureBytes.toString("base64")}" preserveAspectRatio="xMidYMid meet"/>` : `<rect x="1580" y="1680" width="650" height="130" fill="#f8f9fb" stroke="#d7dce3" stroke-dasharray="12 8"/><text x="1905" y="1760" text-anchor="middle" font-size="26" fill="#8c95a2">SIGNATURE TO BE PROVIDED</text>`}<path d="M1580 1840H2230" stroke="#b7924c" stroke-width="3"/><text x="1905" y="1900" text-anchor="middle" font-size="28" fill="#687386">AUTHORIZED SIGNATORY</text><image x="2760" y="1660" width="240" height="240" href="${qr}"/><text x="2880" y="1950" text-anchor="middle" font-size="23">${preview ? "PREVIEW ONLY" : "SCAN TO VERIFY"}</text><text x="1920" y="1990" text-anchor="middle" font-size="22" fill="#687386">${preview ? "TEMPLATE PREVIEW · NOT AN ISSUED CREDENTIAL" : escape(c.id)}</text></g>${c.mode === "sandbox" || preview ? '<text x="1920" y="1640" text-anchor="middle" font-family="Arial" font-size="40" letter-spacing="9" fill="#a76b39">SAMPLE · NOT AN OFFICIAL CREDENTIAL</text>' : ""}</svg>`;
}
export async function documentPDF(
  c: Credential,
  d: Domain,
  signatureBytes?: Buffer,
) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(
      await fs.readFile(
        path.join(process.cwd(), "public", "fonts", "noto-sans-devanagari.ttf"),
      ),
      { subset: true },
    ),
    serif = await doc.embedFont(StandardFonts.TimesRoman);
  const navy = rgb(0.063, 0.169, 0.306),
    gold = rgb(0.718, 0.573, 0.298),
    muted = rgb(0.4, 0.45, 0.5);
  const landscape = c.kind === "certificate",
    w = landscape ? 1280 : 595,
    h = landscape ? 720 : 842;
  const page = doc.addPage([w, h]);
  const txt = (
    text: string,
    x: number,
    y: number,
    size: number,
    f = font,
    color = navy,
  ) =>
    page.drawText(text, {
      x,
      y,
      size,
      font: /[^\x20-\x7e]/.test(text) ? font : f,
      color,
    });
  const centered = (text: string, y: number, size: number, f = font) => {
    const val = text;
    if (/[^\x20-\x7e]/.test(text)) f = font;
    const adjusted = Math.min(
      size,
      (w - 130) / Math.max(f.widthOfTextAtSize(val, 1), 1),
    );
    page.drawText(val, {
      x: (w - f.widthOfTextAtSize(val, adjusted)) / 2,
      y,
      size: adjusted,
      font: f,
      color: navy,
    });
  };
  page.drawRectangle({
    x: 25,
    y: 25,
    width: w - 50,
    height: h - 50,
    borderColor: gold,
    borderWidth: 1.5,
  });
  const logo = await doc.embedJpg(
    await fs.readFile(path.join(process.cwd(), "public", "official-logo.jpg")),
  );
  page.drawImage(logo, { x: w / 2 - 90, y: h - 185, width: 180, height: 180 });
  if (landscape) {
    centered("CERTIFICATE OF COMPLETION", h - 230, 28);
    centered("This certificate is proudly presented to", h - 285, 15);
    centered(c.name, h - 350, 40, serif);
    centered(
      "for successfully completing the assessment requirements in",
      h - 400,
      15,
    );
    centered(d.name, h - 445, 26, serif);
    centered("Skill Set Go EduTech | Learn. Build. Prove.", h - 480, 13);
  } else {
    centered("LETTER OF APPRECIATION", h - 230, 23);
    txt(`Dear ${c.name},`, 60, h - 290, 14, serif);
    const lines = [
      "We appreciate your commitment to learning and your successful",
      `performance in ${d.name}.`,
      `You achieved ${c.score}/30 in the assessment, meeting the passing`,
      `requirement of 23/30. This letter recognizes your demonstrated`,
      `knowledge and encourages your continued development.`,
      `Thank you for making your learning journey part of Skill Set Go.`,
      `We look forward to the skills and possibilities you build next.`,
    ];
    let y = h - 330;
    for (const line of lines) {
      const chunks = wrap(ascii(line), 65);
      for (const chunk of chunks) {
        txt(chunk, 60, y, 12);
        y -= 22;
      }
    }
  }
  const bottom = landscape ? 110 : 145;
  txt(new Date(c.issuedAt).toISOString().slice(0, 10), 60, bottom, 12);
  txt("Date of issue", 60, bottom - 22, 10, font, muted);
  if (signatureBytes) {
    try {
      const image = await doc.embedPng(signatureBytes);
      page.drawImage(image, {
        x: w / 2 - 90,
        y: bottom,
        width: 180,
        height: 45,
      });
    } catch {
      txt("Signature pending", w / 2 - 70, bottom, 11);
    }
  } else txt("Signature to be provided", w / 2 - 70, bottom, 11, font, muted);
  txt("Authorized signatory", w / 2 - 65, bottom - 22, 10, font, muted);
  const qr = await QRCode.toBuffer(verificationUrl(c), {
    width: 240,
    margin: 1,
  });
  const q = await doc.embedPng(qr);
  page.drawImage(q, { x: w - 160, y: bottom - 25, width: 90, height: 90 });
  txt(c.id, 60, 45, 8, font, muted);
  if (c.mode === "sandbox")
    centered(
      "SANDBOX SAMPLE - NOT AN OFFICIAL CREDENTIAL",
      landscape ? 180 : 80,
      12,
    );
  return doc.save();
}
export async function reportPDF(attempts: Attempt[], d: Domain, name: string) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(
    await fs.readFile(
      path.join(process.cwd(), "public", "fonts", "noto-sans-devanagari.ttf"),
    ),
    { subset: true },
  );
  let page = doc.addPage([595, 842]),
    y = 780;
  function line(text: string, size = 12) {
    for (const part of wrap(text, Math.floor((85 * 12) / size))) {
      if (y < 60) {
        page = doc.addPage([595, 842]);
        y = 780;
      }
      page.drawText(part, {
        x: 50,
        y,
        size,
        font,
        color: rgb(0.063, 0.169, 0.306),
      });
      y -= size + 10;
    }
  }
  line("STUDENT PERFORMANCE REPORT", 22);
  line("Skill Set Go EduTech | Complimentary", 11);
  line(name, 18);
  line(d.name, 16);
  line("");
  const done = attempts.filter((a) => a.status === "submitted");
  line(`Completed attempts: ${done.length} of 5`);
  for (const [i, a] of done.entries()) {
    line(
      `Attempt ${i + 1}: ${a.score}/30 - ${(a.score || 0) >= 23 ? "PASS" : "NOT PASSED"}`,
      15,
    );
    line(`Submitted: ${a.submittedAt?.slice(0, 10)} | Reason: ${a.reason}`);
    const topics = new Map<string, { total: number; correct: number }>();
    for (const q of a.questions) {
      const t = topics.get(q.topic) || { total: 0, correct: 0 };
      t.total++;
      if (a.answers[q.id] === q.correct) t.correct++;
      topics.set(q.topic, t);
    }
    for (const [topic, t] of topics)
      line(
        `${topic}: ${t.correct}/${t.total} - ${t.correct / t.total >= 0.75 ? "Strength" : "Review recommended"}`,
      );
    line("");
  }
  line(
    "Recommendation: revisit topics marked for review, practice independently, and use official documentation to deepen your understanding.",
  );
  line(
    "Learning acknowledgements are self-reported; this assessment is not evidence of verified video watch time.",
    10,
  );
  return doc.save();
}
function ascii(s: string) {
  return s;
}
function wrap(s: string, n: number) {
  const lines: string[] = [];
  let current = "";
  for (const word of s.split(" ")) {
    if ((current + " " + word).length > n && current) {
      lines.push(current);
      current = word;
    } else current += (current ? " " : "") + word;
  }
  if (current) lines.push(current);
  return lines.length ? lines : [" "];
}
