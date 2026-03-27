import axios, { AxiosInstance } from 'axios';
import type { ZabbixApiRequest, ZabbixApiResponse } from './zabbix.types';

const clients = new Map<string, AxiosInstance>();

export function getZabbixClient(serverUrl: string): AxiosInstance {
  if (clients.has(serverUrl)) {
    return clients.get(serverUrl)!;
  }

  const client = axios.create({
    baseURL: `${serverUrl.replace(/\/$/, '')}/api_jsonrpc.php`,
    headers: { 'Content-Type': 'application/json-rpc' },
    timeout: 15000,
    httpsAgent: undefined,  // Necessário para servidores com certificado self-signed ou autoridades certificadoras privadas
  });

  clients.set(serverUrl, client);
  return client;
}

let requestId = 1;

export async function zabbixRequest<T = unknown>(serverUrl: string,method: string,params: Record<string, unknown> = {},token?: string,): Promise<T> {
  
  const client = getZabbixClient(serverUrl);

  const body: ZabbixApiRequest = {
    jsonrpc: '2.0',
    method: method,
    params: params,
    id: requestId++,
  };

  const headers: Record<string, string> = {};

  // Zabbix 7.x usa Authorization: Bearer
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await client.post<ZabbixApiResponse<T>>('', body, {
    headers,
  });

  
  const data = response.data;

  if (data.error) {
    throw new ZabbixApiError(
      data.error.message,
      data.error.code,
      data.error.data,
    );
  }

  return data.result as T;
}

export class ZabbixApiError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly data: string,
  ) {
    super(message);
    this.name = 'ZabbixApiError';
  }
}