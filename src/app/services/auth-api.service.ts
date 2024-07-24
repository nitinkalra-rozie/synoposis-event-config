import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private baseURL: string = environment.AUTH_API_END_POINT || '';
  private headers: HttpHeaders;

  constructor(private http: HttpClient) {
    this.headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: localStorage.getItem('idToken') || '',
    });
  }

  public updateHeaders(headers: Record<string, string>): void {
    this.headers = new HttpHeaders(headers);
  }

  public updateBaseUrl(url: string): void {
    this.baseURL = url;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: Record<string, any>,
    params?: Record<string, string | number | boolean>
  ): Promise<T> {
    const url = this.baseURL + endpoint;
    const httpOptions = {
      headers: this.headers,
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

  public get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, params);
  }

  public post<T>(
    endpoint: string,
    body: Record<string, any>,
    params?: Record<string, string | number | boolean>
  ): Promise<T> {
    return this.request<T>('POST', endpoint, body, params);
  }

  public put<T>(
    endpoint: string,
    body: Record<string, any>,
    params?: Record<string, string | number | boolean>
  ): Promise<T> {
    return this.request<T>('PUT', endpoint, body, params);
  }

  public delete<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, params);
  }
}
