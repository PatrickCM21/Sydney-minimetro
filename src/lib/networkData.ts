/**
 * Sydney Rail Network Data (Auto-Generated from Wikipedia Scraper)
 */

import type { TrainLine, Station, Edge, LineId } from '@/types';
import stationsData from '../../public/stations.json';

export const LINES: TrainLine[] = [
  { id: 'T1', name: 'T1 North Shore & Western Line', color: '#F99D1C', textColor: '#fff' },
  { id: 'T2', name: 'T2 Inner West & Leppington Line', color: '#0098CD', textColor: '#fff' },
  { id: 'T3', name: 'T3 Liverpool & Inner West Line', color: '#F37021', textColor: '#fff' },
  { id: 'T4', name: 'T4 Eastern Suburbs & Illawarra Line', color: '#005AA3', textColor: '#fff' },
  { id: 'T5', name: 'T5 Cumberland Line', color: '#C4258F', textColor: '#fff' },
  { id: 'T6', name: 'T6 Lidcombe & Bankstown Line', color: '#7C3E21', textColor: '#fff' },
  { id: 'T7', name: 'T7 Olympic Park Line', color: '#6F818E', textColor: '#fff' },
  { id: 'T8', name: 'T8 Airport & South Line', color: '#00954C', textColor: '#fff' },
  { id: 'T9', name: 'T9 Northern Line', color: '#D11F2F', textColor: '#fff' },
  { id: 'M1', name: 'M1 Metro Northwest & Bankstown Line', color: '#168388', textColor: '#fff' },
];

export const LINE_MAP: Record<LineId, TrainLine> = Object.fromEntries(
  LINES.map(l => [l.id, l])
) as Record<LineId, TrainLine>;

export const STATIONS: Station[] = Object.values(stationsData as unknown as Record<string, {
  id: string;
  name: string;
  interchanges: string[];
  lat: number;
  lng: number;
}>).map(s => ({
  id: s.id,
  name: s.name,
  lines: s.interchanges as LineId[],
  lat: s.lat,
  lng: s.lng
}));

export const STATIONS_DEDUPED = STATIONS;

export const slugToIdMap: Record<string, string> = Object.fromEntries(
  STATIONS.map(s => {
    const slug = s.name.toLowerCase()
      .replace(/ /g, '_')
      .replace(/'/g, '')
      .replace(/-/g, '_')
      .replace(/&/g, 'and');
    return [slug, s.id];
  })
);
slugToIdMap['mount_kuring-gai'] = 'STN-MKI';
slugToIdMap['mount_kuring_gai'] = 'STN-MKI';

export function resolveStationId(id: string): string {
  if (!id) return id;
  if (id.startsWith('STN-')) return id;
  return slugToIdMap[id] || id;
}

const lineSegments: Record<LineId, string[][]> = {
  T1: [
    ["STN-RCD", "STN-ERD", "STN-CRD", "STN-WSR", "STN-MUV", "STN-VYR", "STN-RVS", "STN-SFS", "STN-QKH", "STN-MYG", "STN-BAK", "STN-SEV", "STN-TGB", "STN-PDH", "STN-WVL", "STN-WMD", "STN-PAR", "STN-HPK", "STN-GAV", "STN-CYE", "STN-AUB", "STN-LDC", "STN-STR", "STN-REF", "STN-CEN", "STN-THL", "STN-WYN", "STN-MPT", "STN-NSY", "STN-WVT", "STN-WSC", "STN-SNL", "STN-ATM", "STN-CWD", "STN-RVL", "STN-LDD", "STN-KLA", "STN-GDN", "STN-PYB", "STN-TMU", "STN-WWE", "STN-WRO", "STN-WTA", "STN-HBY", "STN-ASQ", "STN-MOC", "STN-MKI", "STN-BEW"],
    ["STN-EPS", "STN-PNR", "STN-KWD", "STN-WRT", "STN-STM", "STN-MTT", "STN-RYH", "STN-DOD", "STN-BAK", "STN-SEV", "STN-TGB", "STN-PDH", "STN-WVL", "STN-WMD", "STN-PAR", "STN-HPK", "STN-GAV", "STN-CYE", "STN-AUB", "STN-LDC", "STN-STR", "STN-REF", "STN-CEN", "STN-THL", "STN-WYN", "STN-MPT", "STN-NSY", "STN-WVT", "STN-WSC", "STN-SNL", "STN-ATM", "STN-CWD", "STN-RVL", "STN-LDD", "STN-KLA", "STN-GDN", "STN-PYB", "STN-TMU", "STN-WWE", "STN-WRO", "STN-WTA", "STN-HBY", "STN-ASQ", "STN-MOC", "STN-MKI", "STN-BEW"],
  ],
  T2: [
    ["STN-LEP", "STN-EDP", "STN-GFD", "STN-CSL", "STN-LPO", "STN-WWF", "STN-CAB", "STN-CVE", "STN-FFL", "STN-YNR", "STN-GUD", "STN-MLN", "STN-GAV", "STN-CYE", "STN-AUB", "STN-LDC", "STN-FMG", "STN-HSH", "STN-STR", "STN-BUW", "STN-CYD", "STN-ASH", "STN-SMH", "STN-LWI", "STN-PSM", "STN-SMN", "STN-NTN", "STN-MAC", "STN-REF", "STN-CEN", "STN-MSM", "STN-STJ", "STN-CQY", "STN-WYN", "STN-THL", "STN-CEN"],
    ["STN-PAR", "STN-HPK", "STN-GAV", "STN-CYE", "STN-AUB", "STN-LDC", "STN-FMG", "STN-HSH", "STN-STR", "STN-BUW", "STN-CYD", "STN-ASH", "STN-SMH", "STN-LWI", "STN-PSM", "STN-SMN", "STN-NTN", "STN-MAC", "STN-REF", "STN-CEN", "STN-MSM", "STN-STJ", "STN-CQY", "STN-WYN", "STN-THL", "STN-CEN"],
  ],
  T3: [
    ["STN-LPO", "STN-WWF", "STN-CAB", "STN-CRR", "STN-VWD", "STN-LTN", "STN-CHH", "STN-SFT", "STN-RGP", "STN-BEJ", "STN-LDC", "STN-FMG", "STN-HSH", "STN-STR", "STN-BUW", "STN-CYD", "STN-ASH", "STN-SMH", "STN-LWI", "STN-PSM", "STN-SMN", "STN-NTN", "STN-MAC", "STN-REF", "STN-CEN", "STN-MSM", "STN-STJ", "STN-CQY", "STN-WYN", "STN-THL", "STN-CEN"],
  ],
  T4: [
    ["STN-CNL", "STN-WOE", "STN-CIH", "STN-MIJ", "STN-GYM", "STN-KEE", "STN-SLD", "STN-JNL", "STN-CMO", "STN-OAL", "STN-MDE", "STN-PHS", "STN-HVL", "STN-ALW", "STN-CLJ", "STN-KGH", "STN-RKL", "STN-BKS", "STN-ARN", "STN-WCI", "STN-TME", "STN-SDN", "STN-REF", "STN-CEN", "STN-THL", "STN-MPC", "STN-KSX", "STN-ECL", "STN-BJN"],
    ["STN-HNB", "STN-WFL", "STN-HTC", "STN-EGD", "STN-LOF", "STN-SLD", "STN-JNL", "STN-CMO", "STN-OAL", "STN-MDE", "STN-PHS", "STN-HVL", "STN-ALW", "STN-CLJ", "STN-KGH", "STN-RKL", "STN-BKS", "STN-ARN", "STN-WCI", "STN-TME", "STN-SDN", "STN-REF", "STN-CEN", "STN-THL", "STN-MPC", "STN-KSX", "STN-ECL", "STN-BJN"],
  ],
  T5: [
    ["STN-RCD", "STN-ERD", "STN-CRD", "STN-WSR", "STN-MUV", "STN-VYR", "STN-RVS", "STN-SFS", "STN-QKH", "STN-MYG", "STN-BAK", "STN-SEV", "STN-TGB", "STN-PDH", "STN-WVL", "STN-WMD", "STN-PAR", "STN-HPK", "STN-MLN", "STN-GUD", "STN-YNR", "STN-FFL", "STN-CVE", "STN-CAB", "STN-WWF", "STN-LPO", "STN-CSL", "STN-GFD", "STN-EDP", "STN-LEP"],
  ],
  T6: [
    ["STN-LDC", "STN-BEJ", "STN-RGP", "STN-BIO", "STN-YOA", "STN-BNK"],
  ],
  T7: [
    ["STN-LDC", "STN-OLP"],
  ],
  T8: [
    ["STN-MCA", "STN-CTN", "STN-LUM", "STN-MIO", "STN-IGB", "STN-MQF", "STN-GFD", "STN-HOL", "STN-EHS", "STN-PAN", "STN-RSY", "STN-PDW", "STN-RVD", "STN-NWE", "STN-BVH", "STN-KGV", "STN-BXN", "STN-BPK", "STN-TLL", "STN-WCI", "STN-INT", "STN-DOM", "STN-MCO", "STN-GQE", "STN-CEN", "STN-MSM", "STN-STJ", "STN-CQY", "STN-WYN", "STN-THL", "STN-CEN"],
    ["STN-MCA", "STN-CTN", "STN-LUM", "STN-MIO", "STN-IGB", "STN-MQF", "STN-GFD", "STN-HOL", "STN-EHS", "STN-PAN", "STN-RSY", "STN-PDW", "STN-RVD", "STN-NWE", "STN-BVH", "STN-KGV", "STN-BXN", "STN-BPK", "STN-TLL", "STN-WCI", "STN-SDN", "STN-SAP", "STN-EKV", "STN-REF", "STN-CEN"],
  ],
  T9: [
    ["STN-HBY", "STN-NOR", "STN-THO", "STN-PNT", "STN-BCF", "STN-CHA", "STN-EPG", "STN-EWD", "STN-DST", "STN-WRD", "STN-MEB", "STN-RDS", "STN-CDW", "STN-NST", "STN-STR", "STN-BUW", "STN-REF", "STN-CEN", "STN-THL", "STN-WYN", "STN-MPT", "STN-NSY", "STN-WVT", "STN-WSC", "STN-SNL", "STN-ATM", "STN-CWD", "STN-RVL", "STN-LDD", "STN-KLA", "STN-GDN"],
  ],
  M1: [
    ["STN-TAW", "STN-RSH", "STN-KVL", "STN-BVS", "STN-NWT", "STN-HSG", "STN-CSH", "STN-CBK", "STN-EPG", "STN-MCU", "STN-MQP", "STN-NRD", "STN-CWD", "STN-CRN", "STN-VCS", "STN-BGO", "STN-MPC", "STN-GDG", "STN-CEN", "STN-WLO", "STN-SDN"],
  ],
};

function buildEdgesList(): Edge[] {
  const edges: Edge[] = [];
  for (const [lineId, segments] of Object.entries(lineSegments)) {
    const line = lineId as LineId;
    const candidatePairs = new Set<string>();
    for (const segment of segments) {
      for (let i = 0; i < segment.length - 1; i++) {
        const [a, b] = [segment[i], segment[i + 1]].sort();
        candidatePairs.add(`${a}|${b}`);
      }
    }
    for (const pairStr of candidatePairs) {
      const [a, b] = pairStr.split('|');
      let hasAdjacentOccurrence = false;
      for (const segment of segments) {
        const indicesA: number[] = [];
        const indicesB: number[] = [];
        for (let idx = 0; idx < segment.length; idx++) {
          if (segment[idx] === a) indicesA.push(idx);
          if (segment[idx] === b) indicesB.push(idx);
        }
        if (indicesA.length === 0 || indicesB.length === 0) continue;
        let minDistance = Infinity;
        for (const idxA of indicesA) {
          for (const idxB of indicesB) {
            const dist = Math.abs(idxA - idxB);
            if (dist < minDistance) minDistance = dist;
          }
        }
        if (minDistance === 1) {
          hasAdjacentOccurrence = true;
          break;
        }
      }
      if (hasAdjacentOccurrence) {
        edges.push({ from: a, to: b, line });
      }
    }
  }
  return edges;
}

export const EDGES = buildEdgesList();

export function buildAdjacency(edges: Edge[]): Map<string, Array<{ neighbor: string; line: LineId }>> {
  const adj = new Map<string, Array<{ neighbor: string; line: LineId }>>();
  for (const edge of edges) {
    if (!adj.has(edge.from)) adj.set(edge.from, []);
    if (!adj.has(edge.to)) adj.set(edge.to, []);
    adj.get(edge.from)!.push({ neighbor: edge.to, line: edge.line });
    adj.get(edge.to)!.push({ neighbor: edge.from, line: edge.line });
  }
  return adj;
}

export function buildStationMap(stations: Station[]): Map<string, Station> {
  return new Map(stations.map(s => [s.id, s]));
}

export const STATION_MAP = buildStationMap(STATIONS_DEDUPED);
export const ADJACENCY = buildAdjacency(EDGES);
