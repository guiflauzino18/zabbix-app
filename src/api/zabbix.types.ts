export interface ZabbixServer {
  id: string;
  name: string;
  url: string;           // ex: https://zabbix.empresa.com
  apiVersion?: string;   // preenchido após conexão
  isActive: boolean;
  createdAt: number;
}

export interface ZabbixSession {
  serverId: string;
  token: string;         // token retornado pelo user.login
  username: string;
  createdAt: number;
}

export interface ZabbixApiRequest {
  jsonrpc: '2.0';
  method: string;
  params: Record<string, unknown>;
  id: number;
}

export interface ZabbixApiResponse<T = unknown> {
  jsonrpc: '2.0';
  result?: T;
  error?: {
    code: number;
    message: string;
    data: string;
  };
  id: number;
}

export interface ZabbixUser {
  userid: string;
  username: string;
  name: string;
  surname: string;
  type: number;  // 1=user, 2=admin, 3=super admin
  sessionid: string;
}

export interface ZabbixProblem {
  eventid: string;
  objectid: string;       // triggerid
  clock: string;
  name: string;
  severity: '0' | '1' | '2' | '3' | '4' | '5';
  acknowledged: '0' | '1';
  suppressed: '0' | '1';
  r_eventid: string;      // resolve event id
  acknowledges?: ZabbixAcknowledge[];
}


export interface ZabbixAcknowledge {
  acknowledgeid: string;
  userid: string;
  clock: string;
  message: string;
  action: string;
}

export interface ZabbixTrigger {
  triggerid: string;
  description: string;
  priority: string;
  status: string;
  value: string;
  lastchange: string;
  hosts: Array<{ hostid: string; name: string }>;
}

export type ZabbixSeverity = 0 | 1 | 2 | 3 | 4 | 5;

export const SEVERITY_LABELS: Record<ZabbixSeverity, string> = {
  0: 'Não classificado',
  1: 'Informação',
  2: 'Aviso',
  3: 'Médio',
  4: 'Alto',
  5: 'Desastre',
};

export const SEVERITY_COLORS: Record<ZabbixSeverity, string> = {
  0: '#97AAB3',
  1: '#7499FF',
  2: '#FFC859',
  3: '#FFA059',
  4: '#E97659',
  5: '#E45959',
};

export const SEVERITY_BG: Record<ZabbixSeverity, string> = {
  0: '#1a1f2e',
  1: '#161d3b',
  2: '#3b2e10',
  3: '#3b2a10',
  4: '#3b2010',
  5: '#3b1515',
};