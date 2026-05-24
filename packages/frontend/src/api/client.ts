import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import type { ZodType } from 'zod';

const http = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.response.use(
  (r) => r,
  (e: AxiosError<{ error?: string }>) => {
    const msg = e.response?.data?.error || e.message || 'request failed';
    const err = new Error(msg) as Error & { status?: number };
    err.status = e.response?.status;
    return Promise.reject(err);
  }
);

export const api = {
  async get<T>(url: string, schema: ZodType<T>, config?: AxiosRequestConfig): Promise<T> {
    const res = await http.get(url, config);
    return schema.parse(res.data);
  },
  async post<T>(url: string, body: unknown, schema: ZodType<T>, config?: AxiosRequestConfig): Promise<T> {
    const res = await http.post(url, body, config);
    return schema.parse(res.data);
  },
  async postVoid(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<void> {
    await http.post(url, body, config);
  },
  raw: http,
};
