"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import type {
  AdminCertificateRecord,
  BulkIssueCertificateResult,
  BulkRegeneratePdfResult,
  PendingCertificateEnrollment,
} from "@/core/domain/admin-certificate";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { downloadCertificatesZip } from "@/shared/utils/download-certificate-zip";

interface CertificatesApiResponse {
  data: {
    certificates: AdminCertificateRecord[];
    pendingEnrollments: PendingCertificateEnrollment[];
  };
}

const PDF_BATCH_SIZE = 2;

function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(date);
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function formatBlockers(enrollment: PendingCertificateEnrollment): string {
  const parts: string[] = [];
  if (enrollment.profileIncomplete) {
    parts.push(`profil %${enrollment.profileProgress ?? 0}`);
  }
  if (enrollment.attendanceIncomplete) {
    parts.push(
      `yoklama ${enrollment.presentCount ?? 0}/${enrollment.requiredLessonCount ?? 8}`,
    );
  }
  return parts.join(" · ");
}

export function AdminCertificatesManager() {
  const [certificates, setCertificates] = useState<AdminCertificateRecord[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingCertificateEnrollment[]>([]);
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<Set<string>>(new Set());
  const [selectedBlockedEnrollmentIds, setSelectedBlockedEnrollmentIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedCertificateIds, setSelectedCertificateIds] = useState<Set<string>>(new Set());
  const [pendingEventFilter, setPendingEventFilter] = useState("");
  const [blockedEventFilter, setBlockedEventFilter] = useState("");
  const [certificateEventFilter, setCertificateEventFilter] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [selectedRevokeCertificateId, setSelectedRevokeCertificateId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<string | null>(null);
  const [showBulkIssueConfirm, setShowBulkIssueConfirm] = useState(false);
  const [showBlockedIssueConfirm, setShowBlockedIssueConfirm] = useState(false);

  const issuablePending = useMemo(
    () =>
      pendingEnrollments.filter((item) => !item.profileIncomplete && !item.attendanceIncomplete),
    [pendingEnrollments],
  );

  const blockedPending = useMemo(
    () =>
      pendingEnrollments.filter((item) => item.profileIncomplete || item.attendanceIncomplete),
    [pendingEnrollments],
  );

  const pendingEventOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const enrollment of pendingEnrollments) {
      map.set(enrollment.eventId, enrollment.eventTitle);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "tr"));
  }, [pendingEnrollments]);

  const blockedEventOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const enrollment of blockedPending) {
      map.set(enrollment.eventId, enrollment.eventTitle);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "tr"));
  }, [blockedPending]);

  const certificateEventOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const certificate of certificates) {
      if (certificate.status === "active") {
        map.set(certificate.eventId, certificate.eventTitle);
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "tr"));
  }, [certificates]);

  const filteredIssuablePending = useMemo(() => {
    if (!pendingEventFilter) {
      return issuablePending;
    }
    return issuablePending.filter((item) => item.eventId === pendingEventFilter);
  }, [issuablePending, pendingEventFilter]);

  const filteredBlockedPending = useMemo(() => {
    if (!blockedEventFilter) {
      return blockedPending;
    }
    return blockedPending.filter((item) => item.eventId === blockedEventFilter);
  }, [blockedPending, blockedEventFilter]);

  const filteredActiveCertificates = useMemo(() => {
    const active = certificates.filter((certificate) => certificate.status === "active");
    if (!certificateEventFilter) {
      return active;
    }
    return active.filter((certificate) => certificate.eventId === certificateEventFilter);
  }, [certificates, certificateEventFilter]);

  const selectedIssuableIds = useMemo(
    () => filteredIssuablePending.filter((item) => selectedEnrollmentIds.has(item.id)).map((item) => item.id),
    [filteredIssuablePending, selectedEnrollmentIds],
  );

  const selectedBlockedIds = useMemo(
    () =>
      filteredBlockedPending
        .filter((item) => selectedBlockedEnrollmentIds.has(item.id))
        .map((item) => item.id),
    [filteredBlockedPending, selectedBlockedEnrollmentIds],
  );

  const selectedCertificateIdsList = useMemo(
    () =>
      filteredActiveCertificates
        .filter((certificate) => selectedCertificateIds.has(certificate.id))
        .map((certificate) => certificate.id),
    [filteredActiveCertificates, selectedCertificateIds],
  );

  const allPendingSelected =
    filteredIssuablePending.length > 0 &&
    filteredIssuablePending.every((item) => selectedEnrollmentIds.has(item.id));

  const allBlockedSelected =
    filteredBlockedPending.length > 0 &&
    filteredBlockedPending.every((item) => selectedBlockedEnrollmentIds.has(item.id));

  const allCertificatesSelected =
    filteredActiveCertificates.length > 0 &&
    filteredActiveCertificates.every((certificate) => selectedCertificateIds.has(certificate.id));

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
      setSelectedEnrollmentIds(new Set());
      setSelectedBlockedEnrollmentIds(new Set());
      setSelectedCertificateIds(new Set());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Veri yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function togglePendingSelection(id: string) {
    setSelectedEnrollmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAllPending() {
    setSelectedEnrollmentIds((prev) => {
      if (filteredIssuablePending.every((item) => prev.has(item.id))) {
        const next = new Set(prev);
        for (const item of filteredIssuablePending) {
          next.delete(item.id);
        }
        return next;
      }

      const next = new Set(prev);
      for (const item of filteredIssuablePending) {
        next.add(item.id);
      }
      return next;
    });
  }

  function toggleBlockedSelection(id: string) {
    setSelectedBlockedEnrollmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAllBlocked() {
    setSelectedBlockedEnrollmentIds((prev) => {
      if (filteredBlockedPending.every((item) => prev.has(item.id))) {
        const next = new Set(prev);
        for (const item of filteredBlockedPending) {
          next.delete(item.id);
        }
        return next;
      }

      const next = new Set(prev);
      for (const item of filteredBlockedPending) {
        next.add(item.id);
      }
      return next;
    });
  }

  function toggleCertificateSelection(id: string) {
    setSelectedCertificateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAllCertificates() {
    setSelectedCertificateIds((prev) => {
      if (filteredActiveCertificates.every((certificate) => prev.has(certificate.id))) {
        const next = new Set(prev);
        for (const certificate of filteredActiveCertificates) {
          next.delete(certificate.id);
        }
        return next;
      }

      const next = new Set(prev);
      for (const certificate of filteredActiveCertificates) {
        next.add(certificate.id);
      }
      return next;
    });
  }

  async function runBulkIssue(
    enrollmentIds: string[],
    options?: { skipEligibilityGates?: boolean; overrideReason?: string },
  ) {
    if (enrollmentIds.length === 0) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setWarning(null);
    setSuccess(null);
    setBulkProgress(`0 / ${enrollmentIds.length} sertifika oluşturuluyor...`);
    setShowBulkIssueConfirm(false);
    setShowBlockedIssueConfirm(false);

    try {
      const response = await fetch("/api/v1/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk-issue",
          enrollmentIds,
          generatePdf: false,
          skipEligibilityGates: options?.skipEligibilityGates === true,
          overrideReason: options?.overrideReason?.trim(),
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        data?: BulkIssueCertificateResult;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Toplu sertifika oluşturulamadı.");
      }

      const issuedCount = payload.data.succeeded.length;
      const failedCount = payload.data.failed.length;

      if (issuedCount === 0) {
        throw new Error(
          payload.data.failed[0]?.error ?? "Hiçbir sertifika oluşturulamadı.",
        );
      }

      const certificateIds = payload.data.succeeded.map((item) => item.certificate.id);
      let pdfSuccessCount = 0;
      let pdfFailedCount = 0;

      for (const [batchIndex, batch] of chunkArray(certificateIds, PDF_BATCH_SIZE).entries()) {
        setBulkProgress(
          `PDF oluşturuluyor: ${Math.min((batchIndex + 1) * PDF_BATCH_SIZE, certificateIds.length)} / ${certificateIds.length}`,
        );

        const pdfResponse = await fetch("/api/v1/admin/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "bulk-regenerate-pdf",
            certificateIds: batch,
          }),
        });

        const pdfPayload = (await pdfResponse.json()) as {
          error?: string;
          data?: BulkRegeneratePdfResult;
        };

        if (!pdfResponse.ok || !pdfPayload.data) {
          pdfFailedCount += batch.length;
          continue;
        }

        pdfSuccessCount += pdfPayload.data.succeeded.length;
        pdfFailedCount += pdfPayload.data.failed.length;
      }

      if (options?.skipEligibilityGates) {
        setOverrideReason("");
      }

      await loadData();

      const messages = [
        `${issuedCount} sertifika oluşturuldu.`,
        options?.skipEligibilityGates ? "Profil/yoklama şartları admin onayıyla yoksayıldı." : null,
        failedCount > 0 ? `${failedCount} kayıt başarısız oldu.` : null,
        pdfSuccessCount > 0 ? `${pdfSuccessCount} PDF hazırlandı.` : null,
        pdfFailedCount > 0
          ? `${pdfFailedCount} PDF oluşturulamadı; listeden tekrar deneyebilirsiniz.`
          : null,
      ].filter(Boolean);

      if (failedCount > 0 || pdfFailedCount > 0) {
        setWarning(messages.join(" "));
      } else {
        setSuccess(messages.join(" "));
      }
    } catch (issueError) {
      setError(issueError instanceof Error ? issueError.message : "İşlem başarısız.");
    } finally {
      setIsSaving(false);
      setBulkProgress(null);
    }
  }

  async function handleBulkIssue() {
    await runBulkIssue(selectedIssuableIds);
  }

  async function handleBlockedBulkIssue() {
    await runBulkIssue(selectedBlockedIds, {
      skipEligibilityGates: true,
      overrideReason,
    });
  }

  async function handleBulkRegeneratePdf() {
    if (selectedCertificateIdsList.length === 0) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setWarning(null);
    setSuccess(null);

    try {
      let successCount = 0;
      let failedCount = 0;

      for (const [batchIndex, batch] of chunkArray(selectedCertificateIdsList, PDF_BATCH_SIZE).entries()) {
        setBulkProgress(
          `PDF oluşturuluyor: ${Math.min((batchIndex + 1) * PDF_BATCH_SIZE, selectedCertificateIdsList.length)} / ${selectedCertificateIdsList.length}`,
        );

        const response = await fetch("/api/v1/admin/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "bulk-regenerate-pdf",
            certificateIds: batch,
          }),
        });

        const payload = (await response.json()) as {
          error?: string;
          data?: BulkRegeneratePdfResult;
        };

        if (!response.ok || !payload.data) {
          failedCount += batch.length;
          continue;
        }

        successCount += payload.data.succeeded.length;
        failedCount += payload.data.failed.length;
      }

      await loadData();

      if (failedCount > 0) {
        setWarning(`${successCount} PDF oluşturuldu, ${failedCount} başarısız oldu.`);
      } else {
        setSuccess(`${successCount} PDF oluşturuldu.`);
      }
    } catch (regenerateError) {
      setError(regenerateError instanceof Error ? regenerateError.message : "İşlem başarısız.");
    } finally {
      setIsSaving(false);
      setBulkProgress(null);
    }
  }

  async function handleBulkDownloadZip() {
    const selectedCertificates = filteredActiveCertificates.filter((certificate) =>
      selectedCertificateIds.has(certificate.id),
    );
    const withPdf = selectedCertificates.filter((certificate) => certificate.pdfUrl);

    if (withPdf.length === 0) {
      setError("Seçili sertifikaların PDF'i yok. Önce «PDF Oluştur» ile hazırlayın.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setWarning(null);
    setSuccess(null);
    setBulkProgress(`ZIP hazırlanıyor (${withPdf.length} dosya)...`);

    try {
      const eventTitle =
        certificateEventFilter &&
        certificateEventOptions.find(([eventId]) => eventId === certificateEventFilter)?.[1];
      const zipFileName = eventTitle
        ? `D2P Sertifikalar - ${eventTitle}.zip`
        : "D2P Sertifikalar.zip";

      await downloadCertificatesZip(
        withPdf.map((certificate) => ({
          fileName: `${certificate.certificateCode} - ${certificate.holderName}.pdf`,
          pdfUrl: certificate.pdfUrl!,
        })),
        zipFileName,
      );

      if (withPdf.length < selectedCertificates.length) {
        setWarning(
          `${withPdf.length} PDF indirildi. ${selectedCertificates.length - withPdf.length} sertifikanın PDF'i eksik.`,
        );
      } else {
        setSuccess(`${withPdf.length} sertifika ZIP olarak indirildi. Yazdırmak için dosyayı açın.`);
      }
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "ZIP indirilemedi.");
    } finally {
      setIsSaving(false);
      setBulkProgress(null);
    }
  }

  async function handleRevoke(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRevokeCertificateId || !revokeReason.trim()) return;

    setIsSaving(true);
    setError(null);
    setWarning(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/v1/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revoke",
          certificateId: selectedRevokeCertificateId,
          revokeReason: revokeReason.trim(),
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Sertifika iptal edilemedi.");
      }

      setSelectedRevokeCertificateId("");
      setRevokeReason("");
      await loadData();
      setSuccess("Sertifika iptal edildi.");
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "İşlem başarısız.");
    } finally {
      setIsSaving(false);
    }
  }

  const selectedPendingStudents = filteredIssuablePending.filter((item) =>
    selectedEnrollmentIds.has(item.id),
  );
  const selectedBlockedStudents = filteredBlockedPending.filter((item) =>
    selectedBlockedEnrollmentIds.has(item.id),
  );

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border-surface bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-navy-950">Toplu Sertifika Oluştur</h2>
        <p className="mt-2 text-sm text-muted">
          Eğitim sonrası uygun kayıtları seçip tek seferde sertifika oluşturabilir, ardından PDF
          kaydedip ZIP olarak indirebilirsiniz.
        </p>
        <p className="mt-2 text-sm text-muted">
          Sadece <strong>zorunlu formları tamamlanmış</strong>, <strong>profili %100</strong>,{" "}
          <strong>yoklama eşiğini karşılamış</strong> kayıtlar seçilebilir.
        </p>

        {pendingEventOptions.length > 1 ? (
          <div className="mt-4 max-w-md">
            <Select
              label="Eğitime göre filtrele"
              value={pendingEventFilter}
              onChange={(event) => setPendingEventFilter(event.target.value)}
            >
              <option value="">Tüm eğitimler</option>
              {pendingEventOptions.map(([eventId, eventTitle]) => (
                <option key={eventId} value={eventId}>
                  {eventTitle}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {issuablePending.length === 0 && !isLoading ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Sertifika verilecek uygun kayıt yok.
          </p>
        ) : null}

        {blockedPending.length > 0 ? (
          <div className="mt-6 space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div>
              <h3 className="font-semibold text-amber-950">
                Formu bitmiş ama profil veya yoklama eksik ({blockedPending.length})
              </h3>
              <p className="mt-2 text-sm text-amber-950">
                Bu öğrenciler formları tamamlamış ancak profil %100 veya yoklama eşiği henüz
                karşılanmamış. Önce{" "}
                <Link href="/admin/students" className="font-semibold underline">
                  öğrenci profillerini
                </Link>{" "}
                ve{" "}
                <Link href="/admin/enrollments" className="font-semibold underline">
                  yoklamayı
                </Link>{" "}
                tamamlayın; acil durumda admin onayıyla sertifika verebilirsiniz.
              </p>
            </div>

            {blockedEventOptions.length > 1 ? (
              <div className="max-w-md">
                <Select
                  label="Eğitime göre filtrele"
                  value={blockedEventFilter}
                  onChange={(event) => setBlockedEventFilter(event.target.value)}
                >
                  <option value="">Tüm eğitimler</option>
                  {blockedEventOptions.map(([eventId, eventTitle]) => (
                    <option key={eventId} value={eventId}>
                      {eventTitle}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}

            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[240px] flex-1">
                <Input
                  label="Admin onay gerekçesi"
                  value={overrideReason}
                  onChange={(event) => setOverrideReason(event.target.value)}
                  placeholder="Örn: Yaz kursu sonu toplu sertifika"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={
                  isSaving ||
                  selectedBlockedIds.length === 0 ||
                  overrideReason.trim().length < 3
                }
                onClick={() => setShowBlockedIssueConfirm(true)}
              >
                Admin Onayıyla Ver
                {selectedBlockedIds.length > 0 ? ` (${selectedBlockedIds.length})` : ""}
              </Button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-amber-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-section text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allBlockedSelected}
                        onChange={toggleAllBlocked}
                        aria-label="Tüm eksik kayıtları seç"
                      />
                    </th>
                    <th className="px-4 py-3">Öğrenci</th>
                    <th className="px-4 py-3">Eğitim</th>
                    <th className="px-4 py-3">Eksik</th>
                    <th className="px-4 py-3">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBlockedPending.map((enrollment) => (
                    <tr key={enrollment.id} className="border-t border-border-surface">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedBlockedEnrollmentIds.has(enrollment.id)}
                          onChange={() => toggleBlockedSelection(enrollment.id)}
                          aria-label={`${enrollment.studentName} seç`}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-navy-950">
                        {enrollment.studentName}
                      </td>
                      <td className="px-4 py-3 text-muted">{enrollment.eventTitle}</td>
                      <td className="px-4 py-3 text-amber-900">{formatBlockers(enrollment)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/events/${enrollment.eventId}/attendance`}
                          className="font-semibold text-cyan-700 underline hover:text-cyan-900"
                        >
                          Yoklama
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {filteredIssuablePending.length > 0 ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                disabled={isSaving || selectedIssuableIds.length === 0}
                onClick={() => setShowBulkIssueConfirm(true)}
              >
                {isSaving
                  ? "İşleniyor..."
                  : `Seçilenlere Sertifika Ver${selectedIssuableIds.length > 0 ? ` (${selectedIssuableIds.length})` : ""}`}
              </Button>
              {selectedIssuableIds.length > 0 ? (
                <p className="text-xs text-subtle">{selectedIssuableIds.length} kayıt seçildi</p>
              ) : null}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border-surface">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-section text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allPendingSelected}
                        onChange={toggleAllPending}
                        aria-label="Tüm uygun kayıtları seç"
                      />
                    </th>
                    <th className="px-4 py-3">Öğrenci</th>
                    <th className="px-4 py-3">Eğitim</th>
                    <th className="px-4 py-3">Hazır olma</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssuablePending.map((enrollment) => (
                    <tr key={enrollment.id} className="border-t border-border-surface">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedEnrollmentIds.has(enrollment.id)}
                          onChange={() => togglePendingSelection(enrollment.id)}
                          aria-label={`${enrollment.studentName} seç`}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-navy-950">
                        {enrollment.studentName}
                      </td>
                      <td className="px-4 py-3 text-muted">{enrollment.eventTitle}</td>
                      <td className="px-4 py-3 text-muted">{formatDate(enrollment.completedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      {showBulkIssueConfirm ? (
        <div className="rounded-[2rem] border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-navy-950">Toplu sertifika onayı</h3>
          <p className="mt-2 text-sm text-muted">
            Seçilen {selectedPendingStudents.length} öğrenciye sertifika verilecek. Kayıtlar
            otomatik olarak Tamamlandı işaretlenir.
          </p>
          <ul className="mt-3 list-inside list-disc text-sm text-navy-950">
            {selectedPendingStudents.slice(0, 8).map((student) => (
              <li key={student.id}>
                {student.studentName} · {student.eventTitle}
              </li>
            ))}
            {selectedPendingStudents.length > 8 ? (
              <li>…ve {selectedPendingStudents.length - 8} kişi daha</li>
            ) : null}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" disabled={isSaving} onClick={() => void handleBulkIssue()}>
              {isSaving ? "Oluşturuluyor..." : "Onayla ve Oluştur"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isSaving}
              onClick={() => setShowBulkIssueConfirm(false)}
            >
              Vazgeç
            </Button>
          </div>
        </div>
      ) : null}

      {showBlockedIssueConfirm ? (
        <div className="rounded-[2rem] border border-amber-300 bg-amber-50 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-navy-950">Admin onayıyla toplu sertifika</h3>
          <p className="mt-2 text-sm text-muted">
            Seçilen {selectedBlockedStudents.length} öğrenciye profil/yoklama şartları
            yoksayılarak sertifika verilecek.
          </p>
          <p className="mt-2 text-sm font-medium text-amber-950">
            Gerekçe: {overrideReason.trim()}
          </p>
          <ul className="mt-3 list-inside list-disc text-sm text-navy-950">
            {selectedBlockedStudents.slice(0, 8).map((student) => (
              <li key={student.id}>
                {student.studentName} · {student.eventTitle} · {formatBlockers(student)}
              </li>
            ))}
            {selectedBlockedStudents.length > 8 ? (
              <li>…ve {selectedBlockedStudents.length - 8} kişi daha</li>
            ) : null}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" disabled={isSaving} onClick={() => void handleBlockedBulkIssue()}>
              {isSaving ? "Oluşturuluyor..." : "Onayla ve Oluştur"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isSaving}
              onClick={() => setShowBlockedIssueConfirm(false)}
            >
              Vazgeç
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-[2rem] border border-border-surface bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-navy-950">Sertifika İptal Et</h2>
        <form onSubmit={handleRevoke} className="mt-4 grid gap-4 md:grid-cols-2">
          <Select
            label="Sertifika Seç"
            value={selectedRevokeCertificateId}
            onChange={(e) => setSelectedRevokeCertificateId(e.target.value)}
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
            <Button
              type="submit"
              variant="secondary"
              disabled={isSaving || !selectedRevokeCertificateId}
            >
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
      {warning ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {warning}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </p>
      ) : null}
      {bulkProgress ? (
        <p className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          {bulkProgress}
        </p>
      ) : null}

      <div className="rounded-[2rem] border border-border-surface bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-navy-950">Tüm Sertifikalar</h2>
            <p className="mt-2 text-sm text-muted">
              PDF oluşturup ZIP indirerek toplu yazdırma için hazırlayabilirsiniz.
            </p>
          </div>
          {certificateEventOptions.length > 0 ? (
            <div className="min-w-[220px]">
              <Select
                label="Eğitime göre filtrele"
                value={certificateEventFilter}
                onChange={(event) => setCertificateEventFilter(event.target.value)}
              >
                <option value="">Tüm eğitimler</option>
                {certificateEventOptions.map(([eventId, eventTitle]) => (
                  <option key={eventId} value={eventId}>
                    {eventTitle}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
        </div>

        {filteredActiveCertificates.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={isSaving || selectedCertificateIdsList.length === 0}
              onClick={() => void handleBulkRegeneratePdf()}
            >
              PDF Oluştur
              {selectedCertificateIdsList.length > 0 ? ` (${selectedCertificateIdsList.length})` : ""}
            </Button>
            <Button
              type="button"
              disabled={isSaving || selectedCertificateIdsList.length === 0}
              onClick={() => void handleBulkDownloadZip()}
            >
              ZIP İndir
              {selectedCertificateIdsList.length > 0 ? ` (${selectedCertificateIdsList.length})` : ""}
            </Button>
            {selectedCertificateIdsList.length > 0 ? (
              <p className="text-xs text-subtle">{selectedCertificateIdsList.length} sertifika seçildi</p>
            ) : null}
          </div>
        ) : null}

        {isLoading ? (
          <p className="mt-4 text-sm text-muted">Yükleniyor...</p>
        ) : filteredActiveCertificates.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Henüz sertifika yok.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border-surface">
            <table className="min-w-full text-sm">
              <thead className="bg-surface-section text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allCertificatesSelected}
                      onChange={toggleAllCertificates}
                      aria-label="Tüm sertifikaları seç"
                    />
                  </th>
                  <th className="px-4 py-3">Kod</th>
                  <th className="px-4 py-3">Öğrenci</th>
                  <th className="px-4 py-3">Eğitim</th>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3">PDF</th>
                </tr>
              </thead>
              <tbody>
                {filteredActiveCertificates.map((certificate) => (
                  <tr key={certificate.id} className="border-t border-border-surface">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedCertificateIds.has(certificate.id)}
                        onChange={() => toggleCertificateSelection(certificate.id)}
                        aria-label={`${certificate.holderName} seç`}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-navy-950">
                      {certificate.certificateCode}
                    </td>
                    <td className="px-4 py-3 font-medium text-navy-950">{certificate.holderName}</td>
                    <td className="px-4 py-3 text-muted">{certificate.eventTitle}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(certificate.issuedAt)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={certificate.status === "active" ? "cyan" : "neutral"}>
                        {certificate.status === "active" ? "Aktif" : "İptal"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {certificate.pdfUrl ? (
                        <a
                          href={certificate.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-cyan-700 underline hover:text-cyan-900"
                        >
                          İndir
                        </a>
                      ) : (
                        <span className="text-muted">Yok</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
