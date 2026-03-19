import { number } from 'zod';
import { zabbixRequest } from '../api/zabbix.client';
import type { ZabbixProblem, ZabbixTrigger } from '../api/zabbix.types';

export interface FetchProblemsOptions {
  serverUrl: string;
  token: string;
  severities?: number[];
  acknowledged?: boolean,
  suppressed?: boolean,
  limit?: number;
  id?: number[]
}

export interface ProblemWithServer extends ZabbixProblem {
  serverId: string;
  serverName: string;
  hostName: string;
}

export interface SuppressProblemsOptions {
  serverUrl: string;
  token: string;
  message: string | undefined;
  suppress_until: number | undefined,
  eventids: number[]
}

export async function fetchProblems(options: FetchProblemsOptions,): Promise<ZabbixProblem[]> {

  const { serverUrl, token, severities, limit = 100, id, acknowledged, suppressed } = options;
  const params: Record<string, unknown> = {
    output: [
      'eventid',
      'objectid',
      'clock',
      'name',
      'severity',
      'acknowledged',
      'suppressed',
      'r_eventid',
    ],
    selectAcknowledges: ['acknowledgeid', 'userid', 'clock', 'message', 'action'],
    sortfield: ['eventid'],
    sortorder: 'DESC',
    limit,
    recent: true,
  };



  if (id) {
    params.eventids = id
  }

  if (acknowledged != undefined){
    params.acknowledged = acknowledged
  }

  if (severities && severities.length > 0) {
    params.severities = severities
  }

  if(suppressed){ 
    params.suppressed = true
  }


  return zabbixRequest<ZabbixProblem[]>(serverUrl, 'problem.get', params, token);
}

export async function fetchTriggersForProblems(
  serverUrl: string,
  token: string,
  triggerIds: string[],
): Promise<ZabbixTrigger[]> {
  if (triggerIds.length === 0) return [];

  return zabbixRequest<ZabbixTrigger[]>(
    serverUrl,
    'trigger.get',
    {
      triggerids: triggerIds,
      output: ['triggerid', 'description'],
      filter: {
        'value': '1'
      },
      selectHosts: ['hostid', 'name'],
    },
    token,
  );
}

export async function fetchProblemsWithHosts(options: FetchProblemsOptions,): Promise<ProblemWithServer[]> {
  const { serverUrl, token } = options;
  const problems = await fetchProblems(options);
  if (problems.length === 0) return [];


  const triggerIds = [...new Set(problems.map(p => p.objectid))];
  let triggers = await fetchTriggersForProblems(serverUrl, token, triggerIds);

  // triggers = triggers.filter((f) => f.value === '0')

  const triggerMap = new Map<string, ZabbixTrigger>(
    triggers.map(t => [t.triggerid, t]),
  );

  return problems.map(p => {
    const trigger = triggerMap.get(p.objectid);
    const hostName = trigger?.hosts?.[0]?.name ?? 'Host desconhecido';
    return {
      ...p,
      serverId: '',
      serverName: '',
      hostName,
    };
  });
}

export async function acknowledgeProblems(serverUrl: string,token: string,eventids: string[],message: string,): Promise<void> {

  if (message === '') message = ' '
  let params: Record<string, unknown> = {
    eventids: eventids,
    action: 6,
    message: message
  }
  await zabbixRequest(serverUrl,'event.acknowledge',params, token,);

}

export async function suppressProblems({eventids, serverUrl, token, message, suppress_until} : SuppressProblemsOptions): Promise<void> {

  if (!message) message = ' '
  if (!suppress_until) suppress_until = 0

  let params: Record<string, unknown> = {
    eventids: eventids,
    action: 36,
    message: message,
    suppress_until: suppress_until
  }
  await zabbixRequest(serverUrl,'event.acknowledge',params, token,);

}


export async function unsuppressProblems(eventids: number[], serverUrl: string, token: string, message:string): Promise<void> {

  if (!message) message = ' '

  let params: Record<string, unknown> = {
    eventids: eventids,
    action: 68,
    message: message,
  }
  await zabbixRequest(serverUrl,'event.acknowledge',params, token,);

}