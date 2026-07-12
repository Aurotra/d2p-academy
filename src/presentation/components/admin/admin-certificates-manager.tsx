"use client";

import { useEffect, useState, type FormEvent } from "react";

import type {
  AdminCertificateRecord,
  PendingCertificateEnrollment,
} from "@/core/domain/admin-certificate";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";

interface CertificatesApiResponse {
  data: {
    certificates: AdminCertificateRecord[];
    pendingEnrollments: PendingCertificateEnrollment[];
  };
}

function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(date);
}

export function AdminCertificatesManager() {
  const [certificates, setCertificates] = useState<AdminCertificateRecord[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingCertificateEnrollment[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [selectedCertificateId, setSelectedCertificateId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/admin/certificates");
      const payload = (await response.json()) as CertificatesApiResponse | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Veriler alınamadı.");
      }

      setCertificates(payload.data.certificates);
      setPendingEnrollments(payload.data.pendingEnrollments);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Veri yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEnrollmentId) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "issue", enrollmentId: selectedEnrollmentId }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Sertifika oluşturulamadı.");
      }

      setSelectedEnrollmentId("");
      await loadData();
    } catch (issueError) {
      setError(issueError instanceof Error ? issueError.message : "İşlem başarısız.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRevoke(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCertificateId || !revokeReason.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revoke",
          certificateId: selectedCertificateId,
          revokeReason: revokeReason.trim(),
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Sertifika iptal edilemedi.");
      }

      setSelectedCertificateId("");
      setRevokeReason("");
      await loadData();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "İşlem başarısız.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-navy-950">Sertifika Oluştur</h2>
        <p className="mt-2 text-sm text-slate-600">
          Sadece <strong>Tamamlandı</strong> işaretlenen ve henüz sertifikası olmayan kayıtlar
          burada görünür. Liste boşsa önce Etkinlik Kayıtları’ndan öğrenciyi tamamlandı yapın.
        </p>
        {pendingEnrollments.length === 0 && !isLoading ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Sertifika verilecek tamamlanmış kayıt yok.{" "}
            <a href="/admin/enrollments" className="font-semibold underline">
              Etkinlik Kayıtları
            </a>{" "}
            sayfasından “Tamamlandı” ile onaylayın.
          </p>
        ) : null}
        <form onSubmit={handleIssue} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <Select
            label="Kayıt Seç"
            value={selectedEnrollmentId}
            onChange={(e) => setSelectedEnrollmentId(e.target.value)}
          >
            <option value="">Kayıt seçin</option>
            {pendingEnrollments.map((enrollment) => (
              <option key={enrollment.id} value={enrollment.id}>
                {enrollment.studentName} · {enrollment.eventTitle}
              </option>
            ))}
          </Select>
          <Button type="submit" disabled={isSaving || !selectedEnrollmentId}>
            {isSaving ? "Oluşturuluyor..." : "Sertifika Ver"}
          </Button>
        </form>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-navy-950">Sertifika İptal Et</h2>
        <form onSubmit={handleRevoke} className="mt-4 grid gap-4 md:grid-cols-2">
          <Select
            label="Sertifika Seç"
            value={selectedCertificateId}
            onChange={(e) => setSelectedCertificateId(e.target.value)}
          >
            <option value="">Sertifika seçin</option>
            {certificates
              .filter((certificate) => certificate.status === "active")
              .map((certificate) => (
                <option key={certificate.id} value={certificate.id}>
                  {certificate.certificateCode} · {certificate.holderName}
                </option>
              ))}
          </Select>
          <Input
            label="İptal Nedeni"
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            required
          />
          <div className="md:col-span-2">
            <Button type="submit" variant="secondary" disabled={isSaving || !selectedCertificateId}>
              Sertifikayı İptal Et
            </Button>
          </div>
        </form>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-navy-950">Tüm Sertifikalar</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-slate-600">Yükleniyor...</p>
        ) : certificates.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">Henüz sertifika yok.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {certificates.map((certificate) => (
              <div
                key={certificate.id}
                className="rounded-2xl border border-slate-100 p-4 hover:border-cyan-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-bold text-navy-950">
                      {certificate.certificateCode}
                    </p>
                    <p className="mt-1 font-semibold text-navy-950">{certificate.holderName}</p>
                    <p className="text-sm text-slate-600">
                      {certificate.eventTitle} · {formatDate(certificate.issuedAt)}
                    </p>
                  </div>
                  <Badge tone={certificate.status === "active" ? "cyan" : "neutral"}>
                    {certificate.status === "active" ? "Aktif" : "İptal"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
