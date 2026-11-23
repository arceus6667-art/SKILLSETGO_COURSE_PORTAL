export function CertificatePreview({
  src = "/api/certificate-preview",
}: {
  src?: string;
}) {
  const png = src.includes("?")
    ? src.replace("format=svg", "format=png")
    : `${src}?format=png`;
  return (
    <div className="certificate-preview">
      <img
        src={src}
        alt="4K landscape Certificate of Completion preview with official logo and signature placeholder"
      />
      <div className="hero-actions">
        <a
          className="btn btn-outline"
          href={png}
          download="skill-set-go-certificate-4k.png"
        >
          Download 4K PNG
        </a>
        <a
          className="btn btn-ghost"
          href={src}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open vector preview
        </a>
      </div>
    </div>
  );
}
