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
  manual_close: string
  hosts: Array<{ hostid: string; name: string; status: number }>;
}

export interface TriggerItem {
  itemid: string;
  name: string;
  lastvalue: string;
  lastclock: string;
  units: string;
  value_type: string;
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



// Status de disponibilidade do host
export type ZabbixHostAvailability = '0' | '1' | '2';
// 0 = desconhecido, 1 = disponível, 2 = indisponível

export interface ZabbixHost {
  hostid: string;
  host: string;           // nome técnico
  name: string;           // nome visível
  status: '0' | '1';     // 0 = monitorado, 1 = não monitorado
  available: ZabbixHostAvailability;
  interfaces: ZabbixHostInterface[];
  groups: Array<{ groupid: string; name: string }>;
  items?: ZabbixItem[];
}

export interface ZabbixHostInterface {
  interfaceid: string;
  ip: string;
  dns: string;
  port: string;
  main: '0' | '1';       // 1 = interface principal
  type: '1' | '2' | '3' | '4'; // 1=agent, 2=snmp, 3=ipmi, 4=jmx
}

export interface ZabbixItem {
  itemid: string;
  name: string;
  key_: string;
  lastvalue: string;
  lastclock: string;
  units: string;
  value_type: '0' | '1' | '2' | '3' | '4';
  // 0=float, 1=char, 2=log, 3=int, 4=text
  delay: string;
}

export interface ZabbixHostGroup {
  groupid: string;
  name: string;
}

// Helper para obter o IP principal do host
export function getHostMainIp(host: ZabbixHost): string {
  const main = host.interfaces?.find(i => i.main === '1');
  return main?.ip || main?.dns || 'N/A';
}

// Helper para mapear disponibilidade para label e cor
export const HOST_AVAILABILITY: Record<ZabbixHostAvailability,{ label: string; color: string; dot: string }> = {
  '0': { label: 'Desconhecido', color: '#6B7280', dot: '#6B7280' },
  '1': { label: 'Disponível',   color: '#4ade80', dot: '#4ade80' },
  '2': { label: 'Indisponível', color: '#E45959', dot: '#E45959' },
};



// Representa uma notificação local gerada pelo app
// quando um novo problema é detectado pelo polling
export interface AppNotification {
  id: string;
  eventid: string;        // referência ao problema no Zabbix
  serverId: string;
  serverName: string;
  title: string;          // nome do problema
  hostName: string;
  severity: ZabbixSeverity;
  createdAt: number;      // timestamp local (ms)
  isRead: boolean;
  isResolved: boolean;    // true quando r_eventid != '0'
}

// Configuração de notificação por servidor
export interface NotificationSettings {
  serverId: string;
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  // Quais severidades geram notificação (true = notifica)
  severities: Record<ZabbixSeverity, boolean>;
  // Horário silencioso
  quietHoursEnabled: boolean;
  quietHoursStart: string;  // ex: "22:00"
  quietHoursEnd: string;    // ex: "07:00"
}

// Configuração padrão para novos servidores
export const DEFAULT_NOTIFICATION_SETTINGS: Omit<NotificationSettings, 'serverId'> = {
  enabled: true,
  sound: true,
  vibration: false,
  severities: {
    0: false,
    1: false,
    2: false,
    3: false,
    4: true,
    5: true,
  },
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};


// Período selecionado para o relatório
export interface ReportPeriod {
  label: string;
  days: number;
  from: Date;
  to: Date;
}

// Dados calculados do relatório
export interface ReportData {
  period: ReportPeriod;
  totalProblems: number;
  totalProblemsPrev: number;   // período anterior para comparação
  mttrSeconds: number;         // tempo médio de resolução em segundos
  mttrSecondsPrev: number;
  availability: number;        // porcentagem 0-100
  availabilityPrev: number;
  hostsAffected: number;
  totalHosts: number;
  bySeverity: Record<ZabbixSeverity, number>;
  topHosts: Array<{
    hostName: string;
    count: number;
    serverId: string;
    serverName: string;
  }>;
  serverBreakdown: Array<{
    serverId: string;
    serverName: string;
    count: number;
  }>;
}

// Opções de exportação
export interface ExportOptions {
  period: ReportPeriod;
  serverIds: string[];         // vazio = todos
  format: 'pdf' | 'csv' | 'json';
  includeSummary: boolean;
  includeTopHosts: boolean;
  includeAvailability: boolean;
  includeEventList: boolean;
}