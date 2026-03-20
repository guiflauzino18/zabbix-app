import { zabbixRequest } from '../api/zabbix.client';
import type { ZabbixHost, ZabbixHostGroup, ZabbixItem } from '../api/zabbix.types';

// Busca todos os hosts com interfaces, grupos e contagem de problemas
export async function fetchHosts(
  serverUrl: string,
  token: string,
): Promise<ZabbixHost[]> {
  return zabbixRequest<ZabbixHost[]>(
    serverUrl,
    'host.get',
    {
      output: ['hostid', 'host', 'name', 'status', 'available'],
      // Inclui interfaces para extrair o IP principal
      selectInterfaces: ['interfaceid', 'ip', 'dns', 'port', 'main', 'type'],
      // Inclui grupos para o filtro de grupo
      selectGroups: ['groupid', 'name'],
      // Ordena por nome para exibição
      sortfield: 'name',
      sortorder: 'ASC',
    },
    token,
  );
}

// Busca grupos de hosts para popular o seletor de filtro
export async function fetchHostGroups(
  serverUrl: string,
  token: string,
): Promise<ZabbixHostGroup[]> {
  return zabbixRequest<ZabbixHostGroup[]>(
    serverUrl,
    'hostgroup.get',
    {
      output: ['groupid', 'name'],
      // Somente grupos que têm hosts monitorados
      monitored_hosts: true,
      sortfield: 'name',
    },
    token,
  );
}

// Busca os últimos valores dos itens de um host específico
export async function fetchHostItems(
  serverUrl: string,
  token: string,
  hostid: string,
): Promise<ZabbixItem[]> {
  return zabbixRequest<ZabbixItem[]>(
    serverUrl,
    'item.get',
    {
      output: ['itemid', 'name', 'key_', 'lastvalue', 'lastclock', 'units', 'value_type', 'delay'],
      hostids: [hostid],
      // Somente itens habilitados com valor recente
      status: 0,
      // Exclui itens de log e texto (muito verbosos para listagem)
      value_type: [0, 1, 3],
      sortfield: 'name',
      limit: 50,
    },
    token,
  );
}

// Busca dados históricos de um item para o gráfico
export async function fetchItemHistory(
  serverUrl: string,
  token: string,
  itemid: string,
  valueType: string,
  hours: number = 3,
): Promise<Array<{ clock: string; value: string }>> {
  // Calcula o timestamp de início baseado nas horas solicitadas
  const timeFrom = Math.floor(Date.now() / 1000) - hours * 3600;

  return zabbixRequest<Array<{ clock: string; value: string }>>(
    serverUrl,
    'history.get',
    {
      output: ['clock', 'value'],
      itemids: [itemid],
      // value_type deve bater com o tipo do item (0=float, 3=int)
      history: parseInt(valueType),
      time_from: timeFrom,
      sortfield: 'clock',
      sortorder: 'ASC',
      limit: 100,
    },
    token,
  );
}

// Resultado enriquecido com dados do servidor de origem
export interface HostWithServer extends ZabbixHost {
  serverId: string;
  serverName: string;
  problemCount: number;
}