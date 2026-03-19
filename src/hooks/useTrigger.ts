import { ZabbixTrigger } from "@/api/zabbix.types";
import { fetchTriggers } from "@/services/trigger.service";
import { useQuery } from "@tanstack/react-query";
import { useActiveSessions } from "./useActiveSessions";
import { da } from "zod/v4/locales";

export interface UseTriggerOptions {
    selectedServerId: 'all' | string
    triggerid: number[],
}

export interface TriggersResult {
    triggers: ZabbixTrigger[]
}

export function useTriggers(options: UseTriggerOptions): TriggersResult {

    const acticeSessions = useActiveSessions()
    const serverstoFetch = options.selectedServerId === 'all' ? acticeSessions : acticeSessions.filter(s => s.server.id === options.selectedServerId)

    const {data, isLoading, isRefetching, error, refetch} = useQuery({
        queryKey: ['triggers', options.selectedServerId, acticeSessions.map(s => s.server.id).join(',')],

        queryFn: async (): Promise<ZabbixTrigger[]> => {
            const results = await Promise.allSettled(serverstoFetch.map(async ({server, token}) => {
                return await fetchTriggers({serverUrl: server.url, token, limit: 10, triggerids: options.triggerid})

            }))

            const allTriggers: ZabbixTrigger[] = []
            for (const result of results) {
                if(result.status === 'fulfilled'){
                    allTriggers.push(...result.value)
                }
            }

            return allTriggers
        }
    })

    return {triggers: data ?? []}

    
}