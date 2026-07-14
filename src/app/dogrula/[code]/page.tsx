import type { Metadata } from "next";

import { CertificateVerifyByCode } from "@/presentation/components/home/certificate-verify-by-code";

type PageProps = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const decoded = decodeURIComponent(code);

  return {
    title: `Sertifika Doğrulama — ${decoded}`,
    description: `D2P Academy sertifika doğrulama: ${decoded}`,
    robots: { index: false, follow: false },
  };
}

export default async function DogrulaCertificatePage({ params }: PageProps) {
  const { code } = await params;
  const decoded = decodeURIComponent(code).trim();

  return <CertificateVerifyByCode code={decoded} />;
}
