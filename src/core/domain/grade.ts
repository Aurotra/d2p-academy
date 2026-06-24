export interface GradeRecord {
  id: string;
  studentId: string;
  documentId: string;
  score: number;
  feedback: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GradeWithDocument extends GradeRecord {
  documentTitle: string;
  documentFileUrl: string;
}

export type ScoreLabelTone = "success" | "warning" | "danger";

export interface ScoreLabel {
  label: string;
  tone: ScoreLabelTone;
}

export function getScoreLabel(score: number): ScoreLabel {
  if (score >= 85) {
    return { label: "Başarılı", tone: "success" };
  }

  if (score >= 60) {
    return { label: "Geliştirilebilir", tone: "warning" };
  }

  return { label: "Yetersiz", tone: "danger" };
}
