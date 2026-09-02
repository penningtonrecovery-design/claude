import type { CriterionStatus } from "./criteria";

export interface AuditRequest {
  businessName: string;
  websiteUrl: string;
  city: string;
}

export interface SiteSignals {
  finalUrl: string;
  statusCode: number;
  fetchMs: number;
  htmlBytes: number;
  title: string | null;
  metaDescription: string | null;
  viewportContent: string | null;
  h1Texts: string[];
  telLinkCount: number;
  mailtoLinkCount: number;
  phoneNumberMatchCount: number;
  reviewSignalHits: string[];
  ctaTexts: string[];
  navLinkTexts: string[];
  footerTextSnippet: string;
  aboveFoldTextSnippet: string;
  scriptTagCount: number;
  stylesheetCount: number;
  imageCount: number;
  imagesMissingDimensionsCount: number;
}

export interface CriterionResult {
  status: CriterionStatus;
  tip: string;
}

export interface ScorecardResult {
  overallSummary: string;
  valueProp: CriterionResult;
  mobileFriendly: CriterionResult;
  loadSpeed: CriterionResult;
  clickToCall: CriterionResult;
  socialProof: CriterionResult;
  primaryCta: CriterionResult;
  contactFindability: CriterionResult;
}

export interface AuditResponse {
  businessName: string;
  city: string;
  auditedUrl: string;
  scorecard: ScorecardResult;
}
