/**
 * Shared types and interfaces for report components
 */

import { EventStatus } from 'src/app/insights-editor/data-services/insights-editor.data-model';

export interface EventConfig {
  EventIdentifier: string;
  Domain: string;
  [key: string]: any;
}

export interface Session {
  SessionId: string;
  SessionTitle: string;
  StartsAt: string;
  EndsAt: string;
  EventDay: string;
  Track: string;
  Type: string;
  Status: EventStatus | string;
  pdfPathV1?: string;
  pdfPathV2?: string;
  pdfVersion?: number;
  reportUrl?: string;
  audioSegmentUrl?: string;
  Editor?: string;
  [key: string]: any;
}

export interface DailyDebriefRow {
  EventDay: string;
  pdfPathV2?: string;
  version?: number;
  reportUrl?: string;
  [key: string]: any;
}

export interface TrackDebriefRow {
  Track: string;
  pdfPathV2?: string;
  version?: number;
  reportUrl?: string;
  [key: string]: any;
}

export interface ExecutiveSummaryRow {
  executiveSummaryId: string;
  pdfPathV2?: string;
  version?: number;
  reportUrl?: string;
  [key: string]: any;
}

export type FileFilterMode =
  | 'all'
  | 'publishPdfOnly'
  | 'audioFileOnly'
  | 'both'
  | 'either'
  | 'neither';

export type PdfFilterMode =
  | 'all'
  | 'pdfV1Only'
  | 'pdfV2Only'
  | 'both'
  | 'either'
  | 'neither';

export type TrackDebriefPublishFilterMode =
  | 'all'
  | 'publishPdfOnly'
  | 'noPublishPdf';

export type TrackDebriefPdfFilterMode = 'all' | 'hasV2' | 'noV2';
