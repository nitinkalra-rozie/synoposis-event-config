import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  constructor(private http: HttpClient) {
    this._headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: localStorage.getItem('idToken') || '',
    });
  }

  private _baseUrl: string = environment.AUTH_API_END_POINT || '';
  private _headers: HttpHeaders;

  updateHeaders(headers: Record<string, string>): void {
    this._headers = new HttpHeaders(headers);
  }

  updateBaseUrl(url: string): void {
    this._baseUrl = url;
  }

  get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, params);
  }

  post<T>(endpoint: string, body: Record<string, any>, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>('POST', endpoint, body, params);
  }

  put<T>(endpoint: string, body: Record<string, any>, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>('PUT', endpoint, body, params);
  }

  delete<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, params);
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: Record<string, any>,
    params?: Record<string, string | number | boolean>
  ): Promise<T> {
    const url = this._baseUrl + endpoint;
    const httpOptions = {
      headers: this._headers,
      params: new HttpParams({ fromObject: params as Record<string, string> }),
    };

    try {
      switch (method) {
        case 'GET':
          return await this.http.get<T>(url, httpOptions).toPromise();
        case 'POST':
          return await this.http.post<T>(url, body, httpOptions).toPromise();
        case 'PUT':
          return await this.http.put<T>(url, body, httpOptions).toPromise();
        case 'DELETE':
          return await this.http.delete<T>(url, httpOptions).toPromise();
        default:
          throw new Error('Invalid HTTP method');
      }
    } catch (error) {
      console.error(`Error with ${method} request to ${url}`, error);
      throw error;
    }
  }
}
