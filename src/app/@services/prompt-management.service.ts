import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * Adjust these interfaces to match your backend payloads
 */
export interface SessionReportType {
  sessionType: string;
  reportType: string;
}

export interface PromptVersion {
  version: string;
  promptTitle: string;
  promptDescription: string;
  // Add other fields as needed
}

export interface PromptContent {
  prompt_title: string;
  prompt_description: string;
  prompt: string;
  inputs: Array<{
    title: string;
    prompt_key: string;
    required: boolean;
    help?: string;
    type?: string; // "text" or "number"
  }>;
}

@Injectable({ providedIn: 'root' })
export class PromptManagementService {
  constructor(private http: HttpClient) {}

  // You can switch between local endpoints (offline) and production
  // by reading from environment variables or your environment.ts file
  private _baseurl = environment.prompt_mangement_base_url;

  // GET /getSessionReportTypes
  getSessionReportTypes(): Observable<any> {
    return this.http.get<any>(`${this._baseurl}/get-session-report-types`);
  }

  // POST /getPromptVersions
  getPromptVersions(
    sessionType: string,
    reportType: string
  ): Observable<PromptVersion[]> {
    const payload = { sessionType, reportType };
    return this.http.post<PromptVersion[]>(
      `${this._baseurl}/get-prompt-versions`,
      payload
    );
  }

  // POST /getPromptContent
  getPromptContent(
    sessionType: string,
    reportType: string,
    version: string
  ): Observable<PromptContent> {
    const payload = { sessionType, reportType, version };
    return this.http.post<PromptContent>(
      `${this._baseurl}/get-prompt-content`,
      payload
    );
  }

  // POST /uploadOrRefreshDefaultPrompts
  uploadOrRefreshDefaultPrompts(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this._baseurl}/upload-or-refresh-default-prompts`,
      {}
    );
  }
}
