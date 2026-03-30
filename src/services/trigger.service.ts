import { zabbixRequest } from "@/api/zabbix.client";
import { TriggerItem, ZabbixTrigger } from "@/api/zabbix.types";

export interface FetchTriggerOptions {
    serverUrl: string,
    token: string,
    triggerids: number[],
    limit: number
}

export async function fetchTriggers(options: FetchTriggerOptions): Promise<ZabbixTrigger[]> {

    const params: Record<string, unknown> = {
        output: ['triggerid', 'description', ],
        selectHosts: ['hostid', 'host'],
        triggerids: options.triggerids,
        sortorder: 'DESC',
        limit: 100
    }

    return zabbixRequest<ZabbixTrigger[]>(options.serverUrl, 'trigger.get', params, options.token)
}


// Busca os itens vinculados a um trigger específico com seus últimos valores
export async function fetchTriggerItems(serverUrl: string, token: string, triggerids: string[]): Promise<Record<string, TriggerItem[]>> {

  if (triggerids.length === 0) return {};

  // Busca os triggers com seus itens associados
  const triggers = await zabbixRequest<Array<{triggerid: string; items: TriggerItem[];}>>(serverUrl, 'trigger.get', {
      triggerids,
      output: ['triggerid'],
      // Inclui os itens do trigger com últimos valores
      selectItems: ['itemid', 'name', 'lastvalue', 'lastclock', 'units', 'value_type'],
    },
    token,
  );

  // Monta mapa triggerid -> itens para acesso rápido
  return triggers.reduce<Record<string, TriggerItem[]>>((acc, t) => {
    acc[t.triggerid] = t.items ?? [];
    return acc;
  }, {});
}