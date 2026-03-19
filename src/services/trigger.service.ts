import { zabbixRequest } from "@/api/zabbix.client";
import { ZabbixTrigger } from "@/api/zabbix.types";

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