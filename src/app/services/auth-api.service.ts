import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private baseURLs: Record<string, string>= {
    default: environment.AUTH_API_END_POINT || '',
    requestAccess: environment.REQUEST_ACCESS_API || '',
  };;
  private defaultHeaders: Record<string, Record<string, string>>={
    default: {
      'Content-Type': 'application/json',
    },
    initiateAuth: {
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
      'Content-Type': 'application/x-amz-json-1.1',
    },
    respondToAuthChallenge: {
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.RespondToAuthChallenge',
      'Content-Type': 'application/x-amz-json-1.1',
    },
    synopsis: {
      Authorization: localStorage.getItem('idToken') || '',
      'Content-Type': 'application/json',
    },
    webClient: {
      'Content-Type': 'application/json',
      'Custom-Header': 'AnotherServiceHeader',
    },
    requestAccess: {
      'x-api-key': environment.REQUEST_ACCESS_API_KEY || '',
      'Content-Type': 'application/json',
    },
  };;

  constructor(private http: HttpClient) {
    this.baseURLs = {
      default: environment.AUTH_API_END_POINT || '',
      requestAccess: environment.REQUEST_ACCESS_API || '',
    };

    this.defaultHeaders = {
      default: {
        'Content-Type': 'application/json',
      },
      initiateAuth: {
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
        'Content-Type': 'application/x-amz-json-1.1',
      },
      respondToAuthChallenge: {
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.RespondToAuthChallenge',
        'Content-Type': 'application/x-amz-json-1.1',
      },
      synopsis: {
        Authorization: localStorage.getItem('idToken') || '',
        'Content-Type': 'application/json',
      },
      webClient: {
        'Content-Type': 'application/json',
        'Custom-Header': 'AnotherServiceHeader',
      },
      requestAccess: {
        'x-api-key': environment.REQUEST_ACCESS_API_KEY || '',
        'Content-Type': 'application/json',
      },
    };
  }

  private getHeaders(
    headerType?: keyof typeof this.defaultHeaders,
    headers?: Record<string, string>
  ): Record<string, string> {
    let combinedHeaders: Record<string, string> = {};

    if (headerType) {
      combinedHeaders = { ...this.defaultHeaders[headerType] };
    }

    if (headers) {
      combinedHeaders = { ...combinedHeaders, ...headers };
    }

    return combinedHeaders;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: Record<string, any>,
    params?: Record<string, string | number | boolean>,
    headers?: Record<string, string>,
    baseURLType: keyof typeof this.baseURLs = 'default',
    headerType?: keyof typeof this.defaultHeaders
  ): Promise<T> {
    const url = this.baseURLs[baseURLType] + endpoint;
    const requestHeaders = this.getHeaders(headerType, headers);
    const httpOptions = {
      headers: new HttpHeaders(requestHeaders),
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

  public async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    baseURLType: keyof typeof this.baseURLs = 'default',
    headerType?: keyof typeof this.defaultHeaders,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, params, headers, baseURLType, headerType);
  }

  public async post<T>(
    endpoint: string,
    body: Record<string, any>,
    params?: Record<string, string | number | boolean>,
    baseURLType: keyof typeof this.baseURLs = 'default',
    headerType?: keyof typeof this.defaultHeaders,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>('POST', endpoint, body, params, headers, baseURLType, headerType);
  }

  public async put<T>(
    endpoint: string,
    body: Record<string, any>,
    params?: Record<string, string | number | boolean>,
    baseURLType: keyof typeof this.baseURLs = 'default',
    headerType?: keyof typeof this.defaultHeaders,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>('PUT', endpoint, body, params, headers, baseURLType, headerType);
  }

  public async delete<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    baseURLType: keyof typeof this.baseURLs = 'default',
    headerType?: keyof typeof this.defaultHeaders,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, params, headers, baseURLType, headerType);
  }
}
