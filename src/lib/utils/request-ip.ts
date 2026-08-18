const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;

function collectCandidateIps(request: Request): string[] {
  const values = [
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-vercel-forwarded-for"),
    request.headers.get("x-real-ip"),
    request.headers.get("cf-connecting-ip"),
  ];
  const ips: string[] = [];
  for (const value of values) {
    if (!value) {
      continue;
    }
    for (const part of value.split(",")) {
      const ip = part.trim();
      if (ip) {
        ips.push(ip);
      }
    }
  }
  return ips;
}

export function getClientIp(request: Request): string | null {
  const ips = collectCandidateIps(request);
  return ips.find((ip) => IPV4.test(ip)) ?? ips[0] ?? null;
}
