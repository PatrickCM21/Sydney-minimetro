/**
 * Sydney Rail Network Data
 * Loads station coordinates and connected lines from public/stations.json,
 * and dynamically reconstructs line edges based on segment sequences.
 */

import type { TrainLine, Station, Edge, LineId } from '@/types';
import stationsData from '../../public/stations.json';

// ---------------------------------------------------------------------------
// LINE DEFINITIONS
// ---------------------------------------------------------------------------
export const LINES: TrainLine[] = [
  { id: 'T1', name: 'T1 North Shore & Western', color: '#F99D1C', textColor: '#000' },
  { id: 'T2', name: 'T2 Inner West & Leppington', color: '#0098CD', textColor: '#fff' },
  { id: 'T3', name: 'T3 Liverpool & Inner West', color: '#DC3B14', textColor: '#fff' },
  { id: 'T4', name: 'T4 Eastern Suburbs & Illawarra', color: '#005AA3', textColor: '#fff' },
  { id: 'T5', name: 'T5 Cumberland Line', color: '#C4258F', textColor: '#fff' },
  { id: 'T6', name: 'T6 Lidcombe & Bankstown', color: '#456CAA', textColor: '#fff' },
  { id: 'T7', name: 'T7 Olympic Park Line', color: '#6F818E', textColor: '#fff' },
  { id: 'T8', name: 'T8 Airport & South Line', color: '#00954C', textColor: '#fff' },
  { id: 'T9', name: 'T9 Northern Line', color: '#D11F2F', textColor: '#fff' },
  { id: 'M1', name: 'Metro City & Southwest', color: '#168388', textColor: '#fff' },
];

export const LINE_MAP: Record<LineId, TrainLine> = Object.fromEntries(
  LINES.map(l => [l.id, l])
) as Record<LineId, TrainLine>;

// ---------------------------------------------------------------------------
// STATION DATA (Loaded from public/stations.json)
// ---------------------------------------------------------------------------
export const STATIONS: Station[] = (stationsData as unknown as Array<{
  id: string;
  name: string;
  lines: string[];
  lat: number;
  lng: number;
}>).map(s => ({
  id: s.id,
  name: s.name,
  lines: s.lines as LineId[],
  lat: s.lat,
  lng: s.lng
}));

export const STATIONS_DEDUPED: Station[] = STATIONS;

// ---------------------------------------------------------------------------
// LINE SEGMENTS FOR DYNAMIC EDGES CONSTRUCTION
// ---------------------------------------------------------------------------
const lineSegments: Record<LineId, string[][]> = {
  M1: [
    [
      "tallawong", "rouse_hill", "kellyville", "bella_vista", "norwest", 
      "hills_showground", "castle_hill", "cherrybrook", "epping", 
      "macquarie_university", "macquarie_park", "north_ryde", "chatswood", 
      "crows_nest", "victoria_cross", "barangaroo", "martin_place", 
      "gadigal", "central", "waterloo", "sydenham"
    ]
  ],
  T1: [
    // Richmond Branch
    [
      "richmond", "east_richmond", "clarendon", "windsor", "mulgrave", 
      "vineyard", "riverstone", "schofields", "quakers_hill", "marayong", 
      "blacktown"
    ],
    // Emu Plains Branch
    [
      "emu_plains", "penrith", "kingswood", "werrington", "st_marys", 
      "mount_druitt", "rooty_hill", "doonside", "blacktown"
    ],
    // Main Trunk & North Shore
    [
      "blacktown", "seven_hills", "toongabbie", "pendle_hill", "wentworthville", 
      "westmead", "parramatta", "harris_park", "granville", "clyde", 
      "auburn", "lidcombe", "strathfield", "burwood", "redfern", "central", 
      "town_hall", "wynyard", "milsons_point", "north_sydney", "waverton", 
      "wollstonecraft", "st_leonards", "artarmon", "chatswood", "roseville", 
      "lindfield", "killara", "gordon", "pymble", "turramurra", "warrawee", 
      "wahroonga", "waitara", "hornsby", "asquith", "mount_colah", 
      "mount_kuring-gai", "berowra"
    ]
  ],
  T2: [
    // Leppington Branch
    [
      "leppington", "edmondson_park", "glenfield", "casula", "liverpool", 
      "warwick_farm", "cabramatta", "canley_vale", "fairfield", "yennora", 
      "guildford", "merrylands", "granville"
    ],
    // Parramatta Branch
    [
      "granville", "harris_park", "parramatta"
    ],
    // Main Trunk
    [
      "granville", "clyde", "auburn", "lidcombe", "flemington", "homebush", 
      "strathfield", "burwood", "croydon", "ashfield", "summer_hill", 
      "lewisham", "petersham", "stanmore", "newtown", "macdonaldtown", 
      "redfern", "central", "town_hall", "wynyard", "circular_quay", 
      "st_james", "museum", "central"
    ]
  ],
  T3: [
    // Liverpool to Lidcombe via Regents Park
    [
      "liverpool", "cabramatta", "carramar", "villawood", "leightonfield", 
      "chester_hill", "sefton", "birrong", "regents_park", "berala", "lidcombe"
    ],
    // Lidcombe to Central / City Circle
    [
      "lidcombe", "flemington", "homebush", "strathfield", "burwood", "croydon", 
      "ashfield", "summer_hill", "lewisham", "petersham", "stanmore", 
      "newtown", "macdonaldtown", "redfern", "central", "town_hall", "wynyard", 
      "circular_quay", "st_james", "museum", "central"
    ]
  ],
  T4: [
    // Trunk
    [
      "bondi_junction", "edgecliff", "kings_cross", "martin_place", "town_hall", 
      "central", "redfern", "sydenham", "st_peters", "tempe", "wolli_creek", 
      "arncliffe", "banksia", "rockdale", "kogarah", "carlton", "allawah", 
      "hurstville", "penshurst", "mortdale", "oatley", "como", "jannali", 
      "sutherland"
    ],
    // Cronulla Branch
    [
      "sutherland", "kirrawee", "gymea", "miranda", "caringbah", "woolooware", 
      "cronulla"
    ],
    // Waterfall Branch
    [
      "sutherland", "loftus", "engadine", "heathcote", "waterfall"
    ]
  ],
  T5: [
    // Richmond to Blacktown
    [
      "richmond", "east_richmond", "clarendon", "windsor", "mulgrave", 
      "vineyard", "riverstone", "schofields", "quakers_hill", "marayong", 
      "blacktown"
    ],
    // Blacktown to Leppington
    [
      "blacktown", "seven_hills", "toongabbie", "pendle_hill", "wentworthville", 
      "westmead", "parramatta", "harris_park", "granville", "merrylands", 
      "guildford", "yennora", "fairfield", "canley_vale", "cabramatta", 
      "warwick_farm", "liverpool", "casula", "glenfield", "edmondson_park", 
      "leppington"
    ]
  ],
  T6: [
    [
      "lidcombe", "berala", "regents_park", "birrong", "yagoona", "bankstown"
    ]
  ],
  T7: [
    [
      "lidcombe", "olympic_park"
    ],
    [
      "strathfield", "olympic_park"
    ]
  ],
  T8: [
    // Macarthur to Glenfield
    [
      "macarthur", "campbelltown", "leumeah", "minto", "ingleburn", 
      "macquarie_fields", "glenfield"
    ],
    // Glenfield to Wolli Creek via East Hills
    [
      "glenfield", "holsworthy", "east_hills", "panania", "revesby", 
      "padstow", "riverwood", "narwee", "beverly_hills", "kingsgrove", 
      "bexley_north", "bardwell_park", "turrella", "wolli_creek"
    ],
    // Airport Branch
    [
      "wolli_creek", "international_airport", "domestic_airport", "mascot", 
      "green_square", "central"
    ],
    // Sydenham Branch
    [
      "wolli_creek", "sydenham", "redfern", "central"
    ],
    // City Circle
    [
      "central", "town_hall", "wynyard", "circular_quay", "st_james", 
      "museum", "central"
    ]
  ],
  T9: [
    [
      "hornsby", "normanhurst", "thornleigh", "pennant_hills", "beecroft", 
      "cheltenham", "epping", "eastwood", "denistone", "west_ryde", 
      "meadowbank", "rhodes", "concord_west", "north_strathfield", 
      "strathfield", "redfern", "central", "town_hall", "wynyard", 
      "milsons_point", "north_sydney", "waverton", "wollstonecraft", 
      "st_leonards", "artarmon", "chatswood", "roseville", "lindfield", 
      "killara", "gordon"
    ]
  ]
};

// ---------------------------------------------------------------------------
// DYNAMIC EDGES CONSTRUCTION
// ---------------------------------------------------------------------------
function buildEdgesList(): Edge[] {
  const edges: Edge[] = [];
  const edgeKeys = new Set<string>();

  for (const [lineId, segments] of Object.entries(lineSegments)) {
    const line = lineId as LineId;
    for (const segment of segments) {
      for (let i = 0; i < segment.length - 1; i++) {
        const from = segment[i];
        const to = segment[i + 1];
        
        // Deduplicate bidirectional key
        const [a, b] = [from, to].sort();
        const key = `${a}|${b}|${line}`;
        
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          edges.push({ from, to, line });
        }
      }
    }
  }
  return edges;
}

export const EDGES = buildEdgesList();

// ---------------------------------------------------------------------------
// GRAPH HELPERS
// ---------------------------------------------------------------------------

/** Adjacency map: stationId → list of {neighbor, line} */
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

/** Station lookup map */
export function buildStationMap(stations: Station[]): Map<string, Station> {
  return new Map(stations.map(s => [s.id, s]));
}

export const STATION_MAP = buildStationMap(STATIONS_DEDUPED);
export const ADJACENCY = buildAdjacency(EDGES);
