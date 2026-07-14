import { accessSync, readFileSync } from "node:fs";
import { join } from "node:path";

import QRCode from "qrcode";

import { SITE_LOGO_SRC, SITE_URL } from "@/shared/constants/site";

export interface CertificateTemplateData {
  certificateCode: string;
  studentName: string;
  programName: string;
  workshopName: string;
  durationHours: string;
  programSubtitle: string;
  badgeName: string;
  issueDate: string;
  locationName: string;
  instructorName: string;
  instructorTitle: string;
  badgeImageUrl: string;
  verificationUrl: string;
}

const TEMPLATE_PATH = join(process.cwd(), "src/lib/certificates/certificate-template.html");

/** Must match installed @sparticuz/chromium-min; Vercel functions are x64. */
const CHROMIUM_PACK_URL =
  process.env.CHROMIUM_PACK_URL ??
  "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fillTemplate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, escapeHtml(value)),
    template,
  );
}

function isServerlessRuntime(): boolean {
  return Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL);
}

async function resolveLocalChromePath(): Promise<string> {
  if (process.env.CHROME_PATH) {
    return process.env.CHROME_PATH;
  }

  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
  ];

  for (const candidate of candidates) {
    try {
      accessSync(candidate);
      return candidate;
    } catch {
      // try next path
    }
  }

  throw new Error(
    "Chrome bulunamadı. Yerel geliştirmede CHROME_PATH ortam değişkenini ayarlayın.",
  );
}

async function launchBrowser() {
  const puppeteer = await import("puppeteer-core");

  if (isServerlessRuntime()) {
    const chromium = (await import("@sparticuz/chromium-min")).default;
    const executablePath = await chromium.executablePath(CHROMIUM_PACK_URL);

    return puppeteer.default.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });
  }

  return puppeteer.default.launch({
    executablePath: await resolveLocalChromePath(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

export async function buildCertificateHtml(data: CertificateTemplateData): Promise<string> {
  const template = readFileSync(TEMPLATE_PATH, "utf8");
  const qrCodeDataUrl = await QRCode.toDataURL(data.verificationUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 256,
  });

  return fillTemplate(template, {
    logoUrl: `${SITE_URL}${SITE_LOGO_SRC}`,
    programName: data.programName,
    studentName: data.studentName,
    workshopName: data.workshopName,
    durationHours: data.durationHours,
    programSubtitle: data.programSubtitle,
    badgeName: data.badgeName,
    issueDate: data.issueDate,
    locationName: data.locationName,
    certificateNo: data.certificateCode,
    instructorName: data.instructorName,
    instructorTitle: data.instructorTitle,
    badgeImageUrl: data.badgeImageUrl,
    qrCodeDataUrl,
  });
}

export async function generateCertificatePdfBuffer(data: CertificateTemplateData): Promise<Buffer> {
  const html = await buildCertificateHtml(data);
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "load" });
    // Allow CDN fonts/styles a moment before print.
    await new Promise((resolve) => setTimeout(resolve, 750));
    const pdf = await page.pdf({
      width: "210mm",
      height: "297mm",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      pageRanges: "1",
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
