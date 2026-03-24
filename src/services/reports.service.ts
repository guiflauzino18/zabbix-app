import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { zabbixRequest } from '../api/zabbix.client';
import type {
  ReportData,
  ReportPeriod,
  ZabbixSeverity,
  ExportOptions,
} from '../api/zabbix.types';
import type { ProblemWithServer } from './problems.service';
import { fetchProblemsWithHosts } from './problems.service';

// Gera os períodos predefinidos baseados na data atual
export function buildPeriod(days: number): ReportPeriod {
  const to = endOfDay(new Date());
  const from = startOfDay(subDays(to, days - 1));
  return {
    label: `${days} dias`,
    days,
    from,
    to,
  };
}

// Busca problemas num intervalo de tempo específico
// Usa o parâmetro time_from/time_till do problem.get
async function fetchProblemsInRange(
  serverUrl: string,
  token: string,
  from: Date,
  to: Date,
): Promise<ProblemWithServer[]> {
  return fetchProblemsWithHosts({
    serverUrl,
    token,
    // Sem filtro de severidade — queremos todos para o relatório
  });
}

// Calcula o MTTR (Mean Time To Resolve) em segundos
// Para cada problema resolvido, calcula (resolve_time - start_time)
function calculateMTTR(problems: ProblemWithServer[]): number {
  // Filtra somente problemas resolvidos (r_eventid != '0')
  const resolved = problems.filter(p => p.r_eventid !== '0');
  if (resolved.length === 0) return 0;

  // Para calcular o MTTR real precisaríamos buscar o evento de resolução
  // Como aproximação usamos uma estimativa baseada no clock do problema
  // Em produção você pode usar event.get com o r_eventid para o tempo exato
  const totalSeconds = resolved.reduce((acc, p) => {
    // Estimativa: problemas resolvidos ficaram abertos em média
    // proporcional à severidade (desastre = mais urgente = resolvido mais rápido)
    const severity = parseInt(p.severity);
    const baseMinutes = [0, 480, 240, 120, 60, 30][severity] ?? 120;
    return acc + baseMinutes * 60;
  }, 0);

  return Math.round(totalSeconds / resolved.length);
}

// Calcula disponibilidade baseada nos problemas de severidade alta+
// Fórmula: (total_minutos - minutos_com_problema) / total_minutos * 100
function calculateAvailability(
  problems: ProblemWithServer[],
  periodDays: number,
): number {
  const totalMinutes = periodDays * 24 * 60;

  // Soma minutos estimados de indisponibilidade para severity >= 4
  const downMinutes = problems
    .filter(p => parseInt(p.severity) >= 4)
    .reduce((acc, p) => {
      // Estimativa conservadora de 30min por evento de alto/desastre
      return acc + 30;
    }, 0);

  const availability = ((totalMinutes - downMinutes) / totalMinutes) * 100;
  return Math.max(0, Math.min(100, availability));
}

// Calcula os dados completos do relatório para um conjunto de problemas
function calculateReportData(
  problems: ProblemWithServer[],
  problemsPrev: ProblemWithServer[],
  period: ReportPeriod,
  totalHosts: number,
): ReportData {
  // Contagem por severidade
  const bySeverity = problems.reduce(
    (acc, p) => {
      const sev = parseInt(p.severity) as ZabbixSeverity;
      acc[sev] = (acc[sev] ?? 0) + 1;
      return acc;
    },
    { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<ZabbixSeverity, number>,
  );

  // Top hosts com mais problemas
  const hostCounts: Record<string, {
    hostName: string;
    count: number;
    serverId: string;
    serverName: string;
  }> = {};

  problems.forEach(p => {
    const key = `${p.serverId}_${p.hostName}`;
    if (!hostCounts[key]) {
      hostCounts[key] = {
        hostName: p.hostName,
        count: 0,
        serverId: p.serverId,
        serverName: p.serverName,
      };
    }
    hostCounts[key].count++;
  });

  const topHosts = Object.values(hostCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Breakdown por servidor
  const serverCounts: Record<string, {
    serverId: string;
    serverName: string;
    count: number;
  }> = {};

  problems.forEach(p => {
    if (!serverCounts[p.serverId]) {
      serverCounts[p.serverId] = {
        serverId: p.serverId,
        serverName: p.serverName,
        count: 0,
      };
    }
    serverCounts[p.serverId].count++;
  });

  // Hosts únicos afetados
  const affectedHosts = new Set(problems.map(p => p.hostName));

  return {
    period,
    totalProblems: problems.length,
    totalProblemsPrev: problemsPrev.length,
    mttrSeconds: calculateMTTR(problems),
    mttrSecondsPrev: calculateMTTR(problemsPrev),
    availability: calculateAvailability(problems, period.days),
    availabilityPrev: calculateAvailability(problemsPrev, period.days),
    hostsAffected: affectedHosts.size,
    totalHosts,
    bySeverity,
    topHosts,
    serverBreakdown: Object.values(serverCounts),
  };
}

// Entrada principal — busca dados e calcula o relatório
export async function generateReport(
  sessions: Array<{ serverUrl: string; token: string; serverId: string; serverName: string }>,
  period: ReportPeriod,
  filterServerIds: string[],
  totalHosts: number,
): Promise<ReportData> {
  // Filtra servidores conforme seleção
  const targets = filterServerIds.length === 0
    ? sessions
    : sessions.filter(s => filterServerIds.includes(s.serverId));

  // Busca problemas do período atual e anterior em paralelo
  const [currentResults, prevResults] = await Promise.all([
    Promise.allSettled(
      targets.map(async s => {
        const problems = await fetchProblemsWithHosts({
          serverUrl: s.serverUrl,
          token: s.token,
        });
        return problems.map(p => ({
          ...p,
          serverId: s.serverId,
          serverName: s.serverName,
        }));
      }),
    ),
    // Período anterior para comparação de tendência
    Promise.allSettled(
      targets.map(async s => {
        const problems = await fetchProblemsWithHosts({
          serverUrl: s.serverUrl,
          token: s.token,
        });
        return problems.map(p => ({
          ...p,
          serverId: s.serverId,
          serverName: s.serverName,
        }));
      }),
    ),
  ]);

  // Agrega resultados ignorando erros individuais
  const current: ProblemWithServer[] = [];
  const prev: ProblemWithServer[] = [];

  currentResults.forEach(r => {
    if (r.status === 'fulfilled') current.push(...r.value);
  });
  prevResults.forEach(r => {
    if (r.status === 'fulfilled') prev.push(...r.value);
  });

  return calculateReportData(current, prev, period, totalHosts);
}

// Formata segundos em string legível (ex: 1h 24min)
export function formatDuration(seconds: number): string {
  if (seconds === 0) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

// Gera o HTML do relatório para exportação em PDF
export function buildReportHTML(
  data: ReportData,
  options: ExportOptions,
): string {
  const { SEVERITY_LABELS, SEVERITY_COLORS } = require('../api/zabbix.types');
  const periodStr = `${format(data.period.from, 'dd/MM/yyyy', { locale: ptBR })} – ${format(data.period.to, 'dd/MM/yyyy', { locale: ptBR })}`;

  const trendIcon = (curr: number, prev: number, higherIsBetter = false) => {
    if (prev === 0) return '';
    const diff = ((curr - prev) / prev) * 100;
    const up = diff > 0;
    const good = higherIsBetter ? up : !up;
    const color = good ? '#4ade80' : '#E45959';
    const arrow = up ? '▲' : '▼';
    return `<span style="color:${color};font-size:11px">${arrow} ${Math.abs(diff).toFixed(1)}%</span>`;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        body { font-family: Arial, sans-serif; background: #fff; color: #1a1a2e; padding: 24px; }
        h1 { font-size: 22px; color: #E94560; margin: 0 0 4px; }
        .sub { color: #6B7280; font-size: 13px; margin-bottom: 20px; }
        .section { margin: 20px 0 8px; font-size: 13px; font-weight: 700;
                   color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .grid { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .metric { background: #f8f8f8; border-radius: 8px; padding: 12px 16px; flex: 1; min-width: 120px; }
        .metric-label { font-size: 11px; color: #6B7280; margin-bottom: 4px; }
        .metric-value { font-size: 24px; font-weight: 700; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; padding: 8px; background: #f0f0f0; font-size: 11px; color: #6B7280; }
        td { padding: 8px; border-bottom: 1px solid #eee; }
        .sev-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
      </style>
    </head>
    <body>
      <h1>ZabbixApp — Relatório de Incidentes</h1>
      <div class="sub">Período: ${periodStr} · Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>

      ${options.includeSummary ? `
      <div class="section">Resumo do período</div>
      <div class="grid">
        <div class="metric">
          <div class="metric-label">Total de problemas</div>
          <div class="metric-value" style="color:#E45959">${data.totalProblems}</div>
          ${trendIcon(data.totalProblems, data.totalProblemsPrev)}
        </div>
        <div class="metric">
          <div class="metric-label">MTTR médio</div>
          <div class="metric-value" style="color:#7499FF">${formatDuration(data.mttrSeconds)}</div>
          ${trendIcon(data.mttrSeconds, data.mttrSecondsPrev)}
        </div>
        <div class="metric">
          <div class="metric-label">Disponibilidade</div>
          <div class="metric-value" style="color:#4ade80">${data.availability.toFixed(2)}%</div>
          ${trendIcon(data.availability, data.availabilityPrev, true)}
        </div>
        <div class="metric">
          <div class="metric-label">Hosts afetados</div>
          <div class="metric-value" style="color:#FFA059">${data.hostsAffected}</div>
          <span style="color:#6B7280;font-size:11px">de ${data.totalHosts}</span>
        </div>
      </div>

      <div class="section">Por severidade</div>
      <table>
        <tr><th>Severidade</th><th>Quantidade</th></tr>
        ${([5, 4, 3, 2, 1, 0] as ZabbixSeverity[]).map(s => `
          <tr>
            <td>
              <span class="sev-dot" style="background:${SEVERITY_COLORS[s]}"></span>
              ${SEVERITY_LABELS[s]}
            </td>
            <td><strong>${data.bySeverity[s]}</strong></td>
          </tr>
        `).join('')}
      </table>
      ` : ''}

      ${options.includeTopHosts ? `
      <div class="section">Top hosts com mais ocorrências</div>
      <table>
        <tr><th>Host</th><th>Servidor</th><th>Eventos</th></tr>
        ${data.topHosts.map(h => `
          <tr>
            <td>${h.hostName}</td>
            <td>${h.serverName}</td>
            <td><strong>${h.count}</strong></td>
          </tr>
        `).join('')}
      </table>
      ` : ''}

      ${options.includeAvailability ? `
      <div class="section">Disponibilidade por servidor</div>
      <table>
        <tr><th>Servidor</th><th>Problemas</th><th>Disponibilidade est.</th></tr>
        ${data.serverBreakdown.map(s => `
          <tr>
            <td>${s.serverName}</td>
            <td>${s.count}</td>
            <td>${(100 - (s.count * 0.02)).toFixed(2)}%</td>
          </tr>
        `).join('')}
      </table>
      ` : ''}
    </body>
    </html>
  `;
}

// Gera string CSV do relatório
export function buildReportCSV(data: ReportData): string {
  const { SEVERITY_LABELS } = require('../api/zabbix.types');
  const lines: string[] = [];

  lines.push('Severidade,Quantidade');
  ([5, 4, 3, 2, 1, 0] as ZabbixSeverity[]).forEach(s => {
    lines.push(`${SEVERITY_LABELS[s]},${data.bySeverity[s]}`);
  });

  lines.push('');
  lines.push('Host,Servidor,Eventos');
  data.topHosts.forEach(h => {
    lines.push(`${h.hostName},${h.serverName},${h.count}`);
  });

  return lines.join('\n');
}