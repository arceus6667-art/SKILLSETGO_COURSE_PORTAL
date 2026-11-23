import type { Metadata } from "next";
import "./globals.css";
import "./workspace-v2.css";
import "./login-v2.css";
export const metadata: Metadata = {
  title: {
    default: "Skill Set Go EduTech · Learn. Build. Prove.",
    template: "%s · Skill Set Go",
  },
  description:
    "A connected learning, assessment, and credential platform. Explore twelve domains, demonstrate your knowledge, and build your next chapter.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
