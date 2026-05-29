/**
 * Sydney Rail Network Data (Auto-Generated from GTFS)
 */

import type { TrainLine, Station, Edge, LineId } from '@/types';
import stationsData from '../../public/stations.json';

export const LINES: TrainLine[] = [
  { id: 'T1', name: 'T1 North Shore & Western', color: '#F99D1C', textColor: '#000' },
  { id: 'T2', name: 'T2 Inner West & Leppington', color: '#0098CD', textColor: '#fff' },
  { id: 'T3', name: 'T3 Liverpool & Inner West', color: '#F37021', textColor: '#fff' },
  { id: 'T4', name: 'T4 Eastern Suburbs & Illawarra', color: '#005AA3', textColor: '#fff' },
  { id: 'T5', name: 'T5 Cumberland Line', color: '#C4258F', textColor: '#fff' },
  { id: 'T6', name: 'T6 Lidcombe & Bankstown', color: '#7C3E21', textColor: '#fff' },
  { id: 'T7', name: 'T7 Olympic Park Line', color: '#6F818E', textColor: '#fff' },
  { id: 'T8', name: 'T8 Airport & South Line', color: '#00954C', textColor: '#fff' },
  { id: 'T9', name: 'T9 Northern Line', color: '#D11F2F', textColor: '#fff' },
  { id: 'M1', name: 'Metro City & Southwest', color: '#168388', textColor: '#fff' },
];

export const LINE_MAP: Record<LineId, TrainLine> = Object.fromEntries(
  LINES.map(l => [l.id, l])
) as Record<LineId, TrainLine>;

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

export const STATIONS_DEDUPED = STATIONS;

const lineSegments: Record<LineId, string[][]> = {
  T1: [
    ["central", "redfern", "ashfield", "croydon", "burwood", "strathfield", "homebush", "flemington", "lidcombe", "auburn", "clyde", "granville", "harris_park", "parramatta", "westmead", "wentworthville", "pendle_hill", "toongabbie", "seven_hills", "blacktown", "doonside", "rooty_hill", "mount_druitt", "st_marys", "werrington", "kingswood", "penrith"],
    ["emu_plains", "penrith", "kingswood", "werrington", "st_marys", "mount_druitt", "rooty_hill", "doonside", "blacktown", "seven_hills", "toongabbie", "pendle_hill", "wentworthville", "westmead", "parramatta", "granville", "auburn", "lidcombe", "flemington", "homebush", "strathfield", "burwood", "croydon", "ashfield", "redfern", "central"],
    ["central", "redfern", "burwood", "strathfield", "homebush", "flemington", "lidcombe", "granville", "parramatta", "westmead", "wentworthville", "pendle_hill", "toongabbie", "seven_hills", "blacktown", "marayong", "quakers_hill", "schofields", "riverstone", "vineyard", "mulgrave", "windsor", "clarendon", "east_richmond", "richmond"],
    ["berowra", "mount_kuring_gai", "mount_colah", "asquith", "hornsby", "waitara", "wahroonga", "warrawee", "turramurra", "pymble", "gordon", "killara", "lindfield", "roseville", "chatswood", "artarmon", "st_leonards", "wollstonecraft", "waverton", "north_sydney", "milsons_point", "wynyard", "town_hall", "central"],
    ["central", "town_hall", "wynyard", "milsons_point", "north_sydney", "waverton", "wollstonecraft", "st_leonards", "artarmon", "chatswood", "roseville", "lindfield", "killara", "gordon", "pymble", "turramurra", "warrawee", "wahroonga", "waitara", "hornsby", "asquith", "mount_colah", "mount_kuring_gai", "berowra"],
    ["penrith", "kingswood", "werrington", "st_marys", "mount_druitt", "rooty_hill", "doonside", "blacktown", "seven_hills", "westmead", "parramatta", "harris_park", "granville", "clyde", "auburn", "lidcombe", "flemington", "homebush", "strathfield", "burwood", "croydon", "ashfield", "redfern", "central"],
    ["central", "redfern", "strathfield", "lidcombe", "granville", "harris_park", "parramatta", "westmead", "wentworthville", "pendle_hill", "toongabbie", "seven_hills", "blacktown", "marayong", "quakers_hill", "schofields", "riverstone", "vineyard", "mulgrave", "windsor", "clarendon", "east_richmond", "richmond"],
    ["emu_plains", "penrith", "kingswood", "werrington", "st_marys", "mount_druitt", "rooty_hill", "doonside", "blacktown", "seven_hills", "westmead", "parramatta", "harris_park", "granville", "clyde", "auburn", "lidcombe", "flemington", "homebush", "strathfield", "burwood", "redfern", "central"],
    ["olympic_park", "lidcombe", "auburn", "clyde", "granville", "harris_park", "parramatta", "westmead", "wentworthville", "pendle_hill", "toongabbie", "seven_hills", "blacktown", "marayong", "quakers_hill", "schofields", "riverstone", "vineyard", "mulgrave", "windsor", "clarendon", "east_richmond", "richmond"],
    ["emu_plains", "penrith", "kingswood", "werrington", "st_marys", "mount_druitt", "rooty_hill", "doonside", "blacktown", "seven_hills", "toongabbie", "pendle_hill", "wentworthville", "westmead", "parramatta", "harris_park", "granville", "auburn", "lidcombe", "strathfield", "burwood", "redfern", "central"],
    ["penrith", "kingswood", "werrington", "st_marys", "mount_druitt", "rooty_hill", "doonside", "blacktown", "seven_hills", "toongabbie", "pendle_hill", "wentworthville", "westmead", "parramatta", "harris_park", "granville", "clyde", "auburn", "lidcombe", "strathfield", "redfern", "central"],
    ["richmond", "east_richmond", "clarendon", "windsor", "mulgrave", "vineyard", "riverstone", "schofields", "quakers_hill", "marayong", "blacktown", "seven_hills", "toongabbie", "pendle_hill", "wentworthville", "westmead", "parramatta", "harris_park", "granville", "auburn", "lidcombe", "olympic_park"],
    ["richmond", "east_richmond", "clarendon", "windsor", "mulgrave", "vineyard", "riverstone", "schofields", "quakers_hill", "marayong", "blacktown", "seven_hills", "toongabbie", "pendle_hill", "wentworthville", "westmead", "parramatta", "granville", "lidcombe", "strathfield", "redfern", "central"],
    ["central", "redfern", "strathfield", "lidcombe", "auburn", "clyde", "granville", "harris_park", "parramatta", "westmead", "seven_hills", "blacktown", "doonside", "rooty_hill", "mount_druitt", "st_marys", "werrington", "kingswood", "penrith", "emu_plains"],
    ["schofields", "quakers_hill", "marayong", "blacktown", "seven_hills", "westmead", "parramatta", "harris_park", "granville", "clyde", "auburn", "lidcombe", "strathfield", "redfern", "central"],
    ["central", "redfern", "strathfield", "lidcombe", "auburn", "clyde", "granville", "harris_park", "parramatta", "westmead", "seven_hills", "blacktown", "marayong", "quakers_hill", "schofields"],
    ["emu_plains", "penrith", "blacktown", "seven_hills", "westmead", "parramatta", "granville", "lidcombe", "olympic_park"],
    ["olympic_park", "lidcombe", "granville", "parramatta", "westmead", "seven_hills", "blacktown", "st_marys", "penrith"],
  ],
  T2: [
    ["central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "central", "redfern", "newtown", "lewisham", "summer_hill", "ashfield", "croydon", "burwood", "strathfield", "flemington", "lidcombe", "auburn", "clyde", "granville", "merrylands", "guildford", "yennora", "fairfield", "canley_vale", "cabramatta", "warwick_farm", "liverpool", "casula", "glenfield", "edmondson_park", "leppington"],
    ["central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "central", "redfern", "newtown", "stanmore", "petersham", "ashfield", "burwood", "strathfield", "flemington", "lidcombe", "auburn", "granville", "merrylands", "guildford", "yennora", "fairfield", "canley_vale", "cabramatta", "warwick_farm", "liverpool", "casula", "glenfield", "edmondson_park", "leppington"],
    ["central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "central", "redfern", "macdonaldtown", "newtown", "stanmore", "petersham", "lewisham", "summer_hill", "ashfield", "croydon", "burwood", "strathfield", "homebush", "flemington", "lidcombe", "granville", "merrylands", "guildford", "yennora", "fairfield", "canley_vale", "cabramatta", "warwick_farm", "liverpool"],
    ["central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "central", "redfern", "newtown", "ashfield", "burwood", "strathfield", "homebush", "flemington", "lidcombe", "auburn", "granville", "merrylands", "guildford", "yennora", "fairfield", "canley_vale", "cabramatta", "warwick_farm", "liverpool", "casula", "glenfield", "edmondson_park", "leppington"],
    ["leppington", "edmondson_park", "glenfield", "casula", "liverpool", "warwick_farm", "cabramatta", "canley_vale", "fairfield", "yennora", "guildford", "merrylands", "granville", "clyde", "auburn", "lidcombe", "flemington", "strathfield", "burwood", "croydon", "ashfield", "summer_hill", "lewisham", "newtown", "redfern", "central"],
    ["central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "central", "redfern", "macdonaldtown", "newtown", "stanmore", "petersham", "lewisham", "summer_hill", "ashfield", "croydon", "burwood", "strathfield", "homebush", "flemington", "lidcombe", "auburn", "clyde", "granville", "harris_park", "parramatta"],
    ["liverpool", "warwick_farm", "cabramatta", "canley_vale", "fairfield", "yennora", "guildford", "merrylands", "granville", "lidcombe", "flemington", "homebush", "strathfield", "burwood", "croydon", "ashfield", "summer_hill", "lewisham", "petersham", "stanmore", "newtown", "macdonaldtown", "redfern", "central"],
    ["leppington", "edmondson_park", "glenfield", "casula", "liverpool", "warwick_farm", "cabramatta", "canley_vale", "fairfield", "yennora", "guildford", "merrylands", "granville", "auburn", "lidcombe", "flemington", "strathfield", "burwood", "ashfield", "petersham", "stanmore", "newtown", "redfern", "central"],
    ["leppington", "edmondson_park", "glenfield", "casula", "liverpool", "warwick_farm", "cabramatta", "canley_vale", "fairfield", "yennora", "guildford", "merrylands", "granville", "auburn", "lidcombe", "flemington", "homebush", "strathfield", "burwood", "ashfield", "newtown", "redfern", "central"],
    ["parramatta", "harris_park", "granville", "clyde", "auburn", "lidcombe", "flemington", "homebush", "strathfield", "burwood", "croydon", "ashfield", "summer_hill", "lewisham", "petersham", "stanmore", "newtown", "macdonaldtown", "redfern", "central"],
    ["central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "central", "redfern", "macdonaldtown", "newtown", "stanmore", "petersham", "lewisham", "summer_hill", "ashfield", "croydon", "burwood", "strathfield", "homebush", "olympic_park"],
    ["olympic_park", "lidcombe", "auburn", "clyde", "granville", "merrylands", "guildford", "yennora", "fairfield", "canley_vale", "cabramatta", "warwick_farm", "liverpool", "casula", "glenfield", "edmondson_park", "leppington"],
    ["leppington", "edmondson_park", "glenfield", "casula", "liverpool", "warwick_farm", "cabramatta", "canley_vale", "fairfield", "yennora", "guildford", "merrylands", "granville", "auburn", "lidcombe", "olympic_park"],
    ["bankstown", "yagoona", "birrong", "sefton", "chester_hill", "leightonfield", "villawood", "carramar", "cabramatta", "warwick_farm", "liverpool", "casula", "glenfield", "edmondson_park", "leppington"],
    ["leppington", "edmondson_park", "glenfield", "casula", "liverpool", "warwick_farm", "cabramatta", "birrong", "yagoona", "bankstown"],
    ["central", "town_hall", "wynyard", "circular_quay", "st_james", "museum", "central", "redfern"],
  ],
  T3: [
    ["central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "central", "redfern", "macdonaldtown", "newtown", "stanmore", "petersham", "lewisham", "summer_hill", "ashfield", "croydon", "burwood", "strathfield", "homebush", "flemington", "lidcombe", "berala", "regents_park", "sefton", "chester_hill", "leightonfield", "villawood", "carramar", "cabramatta", "warwick_farm", "liverpool", "casula", "glenfield", "macquarie_fields", "ingleburn", "minto", "leumeah", "campbelltown"],
    ["liverpool", "warwick_farm", "cabramatta", "carramar", "villawood", "leightonfield", "chester_hill", "sefton", "regents_park", "berala", "lidcombe", "flemington", "homebush", "strathfield", "burwood", "croydon", "ashfield", "summer_hill", "lewisham", "petersham", "stanmore", "newtown", "macdonaldtown", "redfern", "central"],
    ["central", "town_hall", "wynyard", "circular_quay", "st_james", "museum", "central"],
    ["macarthur", "campbelltown"],
  ],
  T4: [
    ["bondi_junction", "edgecliff", "kings_cross", "martin_place", "town_hall", "central", "redfern", "erskineville", "st_peters", "sydenham", "tempe", "wolli_creek", "arncliffe", "banksia", "rockdale", "kogarah", "carlton", "allawah", "hurstville", "penshurst", "mortdale", "oatley", "como", "jannali", "sutherland", "kirrawee", "gymea", "miranda", "caringbah", "woolooware", "cronulla"],
    ["cronulla", "woolooware", "caringbah", "miranda", "gymea", "kirrawee", "sutherland", "jannali", "como", "oatley", "mortdale", "penshurst", "hurstville", "allawah", "carlton", "kogarah", "rockdale", "banksia", "arncliffe", "wolli_creek", "tempe", "sydenham", "st_peters", "erskineville", "redfern", "central", "town_hall", "martin_place", "kings_cross", "edgecliff", "bondi_junction"],
    ["central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "central", "redfern", "erskineville", "st_peters", "sydenham", "tempe", "arncliffe", "banksia", "rockdale", "kogarah", "carlton", "allawah", "hurstville", "penshurst", "mortdale", "oatley", "como", "jannali", "sutherland", "kirrawee", "gymea", "miranda", "caringbah", "woolooware", "cronulla"],
    ["central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "central", "redfern", "erskineville", "st_peters", "sydenham", "tempe", "wolli_creek", "arncliffe", "banksia", "rockdale", "kogarah", "carlton", "allawah", "hurstville", "penshurst", "mortdale", "oatley", "como", "jannali", "sutherland", "loftus", "engadine", "heathcote", "waterfall"],
    ["central", "town_hall", "wynyard", "circular_quay", "st_james", "museum", "central", "redfern", "erskineville", "st_peters", "sydenham", "tempe", "wolli_creek", "arncliffe", "banksia", "rockdale", "kogarah", "carlton", "allawah", "hurstville", "penshurst", "mortdale", "oatley", "como", "jannali", "sutherland", "loftus", "engadine", "heathcote", "waterfall"],
    ["bondi_junction", "edgecliff", "kings_cross", "martin_place", "town_hall", "central", "redfern", "sydenham", "tempe", "wolli_creek", "arncliffe", "banksia", "rockdale", "kogarah", "carlton", "allawah", "hurstville", "penshurst", "mortdale", "oatley", "como", "jannali", "sutherland", "loftus", "engadine", "heathcote", "waterfall"],
    ["central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "central", "redfern", "erskineville", "st_peters", "sydenham", "wolli_creek", "rockdale", "kogarah", "hurstville", "penshurst", "mortdale", "oatley", "como", "jannali", "sutherland", "kirrawee", "gymea", "miranda", "caringbah", "woolooware", "cronulla"],
    ["waterfall", "heathcote", "engadine", "loftus", "sutherland", "jannali", "como", "oatley", "mortdale", "penshurst", "hurstville", "allawah", "carlton", "kogarah", "rockdale", "banksia", "arncliffe", "wolli_creek", "tempe", "sydenham", "redfern", "central", "town_hall", "martin_place", "kings_cross", "edgecliff", "bondi_junction"],
    ["bondi_junction", "edgecliff", "kings_cross", "martin_place", "town_hall", "central", "redfern", "erskineville", "st_peters", "sydenham", "tempe", "wolli_creek", "arncliffe", "banksia", "rockdale", "kogarah", "carlton", "allawah", "hurstville", "penshurst", "mortdale", "sutherland", "loftus", "engadine", "heathcote", "waterfall"],
    ["waterfall", "heathcote", "engadine", "loftus", "sutherland", "mortdale", "penshurst", "hurstville", "allawah", "carlton", "kogarah", "rockdale", "banksia", "arncliffe", "wolli_creek", "tempe", "sydenham", "st_peters", "erskineville", "redfern", "central", "town_hall", "martin_place", "kings_cross", "edgecliff", "bondi_junction"],
    ["bondi_junction", "edgecliff", "kings_cross", "martin_place", "town_hall", "central", "redfern", "sydenham", "tempe", "wolli_creek", "arncliffe", "banksia", "rockdale", "kogarah", "carlton", "allawah", "hurstville", "penshurst", "mortdale", "sutherland", "loftus", "engadine", "heathcote", "waterfall", "helensburgh"],
    ["waterfall", "heathcote", "engadine", "loftus", "sutherland", "jannali", "como", "oatley", "mortdale", "penshurst", "hurstville", "allawah", "carlton", "kogarah", "rockdale", "banksia", "arncliffe", "wolli_creek", "tempe", "sydenham", "st_peters", "erskineville", "redfern", "central"],
    ["helensburgh", "waterfall", "heathcote", "engadine", "loftus", "sutherland", "mortdale", "penshurst", "hurstville", "wolli_creek", "redfern", "central", "town_hall", "martin_place", "kings_cross", "edgecliff", "bondi_junction"],
  ],
  T5: [
    ["richmond", "east_richmond", "clarendon", "windsor", "mulgrave", "vineyard", "riverstone", "schofields", "quakers_hill", "marayong", "blacktown", "seven_hills", "toongabbie", "pendle_hill", "wentworthville", "westmead", "parramatta", "harris_park", "merrylands", "guildford", "yennora", "fairfield", "canley_vale", "cabramatta", "warwick_farm", "liverpool", "casula", "glenfield", "edmondson_park", "leppington"],
    ["leppington", "edmondson_park", "glenfield", "casula", "liverpool", "warwick_farm", "cabramatta", "canley_vale", "fairfield", "yennora", "guildford", "merrylands", "harris_park", "parramatta", "westmead", "wentworthville", "pendle_hill", "toongabbie", "seven_hills", "blacktown", "marayong", "quakers_hill", "schofields", "riverstone", "vineyard", "mulgrave", "windsor", "clarendon", "east_richmond", "richmond"],
    ["liverpool", "warwick_farm", "cabramatta", "canley_vale", "fairfield", "yennora", "guildford", "merrylands", "harris_park", "parramatta", "westmead", "wentworthville", "pendle_hill", "toongabbie", "seven_hills", "blacktown", "st_marys", "werrington", "kingswood", "penrith"],
    ["parramatta", "westmead", "wentworthville", "pendle_hill", "toongabbie", "seven_hills", "blacktown", "doonside", "rooty_hill", "mount_druitt", "st_marys", "werrington", "kingswood", "penrith"],
    ["emu_plains", "penrith", "blacktown"],
    ["macarthur", "campbelltown"],
  ],
  T6: [
    ["lidcombe", "berala", "regents_park", "birrong", "yagoona", "bankstown"],
    ["bankstown", "yagoona", "birrong", "regents_park", "berala", "lidcombe"],
  ],
  T7: [
    ["blacktown", "seven_hills", "westmead", "parramatta", "granville", "lidcombe", "olympic_park"],
    ["olympic_park", "lidcombe", "granville", "parramatta", "westmead", "seven_hills", "blacktown"],
    ["olympic_park", "strathfield", "redfern", "central"],
    ["central", "redfern", "strathfield", "olympic_park"],
  ],
  T8: [
    ["central", "town_hall", "wynyard", "circular_quay", "st_james", "museum", "central", "green_square", "mascot", "domestic_airport", "international_airport", "wolli_creek", "turrella", "bardwell_park", "bexley_north", "kingsgrove", "beverly_hills", "narwee", "riverwood", "padstow", "revesby", "panania", "east_hills", "holsworthy", "glenfield", "macquarie_fields", "ingleburn", "minto", "leumeah", "campbelltown", "macarthur"],
    ["central", "town_hall", "wynyard", "circular_quay", "st_james", "museum", "central", "green_square", "mascot", "domestic_airport", "international_airport", "wolli_creek", "turrella", "bardwell_park", "bexley_north", "kingsgrove", "beverly_hills", "narwee", "riverwood", "padstow", "revesby", "panania", "east_hills", "holsworthy", "glenfield", "edmondson_park", "leppington"],
    ["macarthur", "campbelltown", "leumeah", "minto", "ingleburn", "macquarie_fields", "glenfield", "holsworthy", "east_hills", "panania", "revesby", "padstow", "riverwood", "narwee", "beverly_hills", "kingsgrove", "bexley_north", "bardwell_park", "turrella", "wolli_creek", "international_airport", "domestic_airport", "mascot", "green_square", "central"],
    ["central", "town_hall", "wynyard", "circular_quay", "st_james", "museum", "central", "redfern", "erskineville", "st_peters", "sydenham", "revesby", "panania", "east_hills", "holsworthy", "glenfield", "macquarie_fields", "ingleburn", "minto", "leumeah", "campbelltown"],
    ["macarthur", "campbelltown", "leumeah", "minto", "ingleburn", "macquarie_fields", "glenfield", "holsworthy", "east_hills", "panania", "revesby", "sydenham", "st_peters", "erskineville", "redfern", "central"],
  ],
  T9: [
    ["central", "redfern", "macdonaldtown", "newtown", "stanmore", "petersham", "lewisham", "summer_hill", "ashfield", "burwood", "strathfield", "north_strathfield", "concord_west", "rhodes", "meadowbank", "west_ryde", "denistone", "eastwood", "epping", "cheltenham", "beecroft", "pennant_hills", "thornleigh", "normanhurst", "hornsby"],
    ["hornsby", "normanhurst", "thornleigh", "pennant_hills", "beecroft", "cheltenham", "epping", "eastwood", "denistone", "west_ryde", "meadowbank", "rhodes", "concord_west", "north_strathfield", "strathfield", "burwood", "ashfield", "summer_hill", "lewisham", "petersham", "stanmore", "newtown", "macdonaldtown", "redfern", "central"],
    ["berowra", "mount_kuring_gai", "mount_colah", "asquith", "hornsby", "waitara", "wahroonga", "warrawee", "turramurra", "pymble", "gordon", "killara", "lindfield", "roseville", "chatswood", "artarmon", "st_leonards", "wollstonecraft", "waverton", "north_sydney", "milsons_point", "wynyard", "town_hall", "central"],
    ["central", "redfern", "burwood", "strathfield", "north_strathfield", "concord_west", "rhodes", "meadowbank", "west_ryde", "denistone", "eastwood", "epping", "cheltenham", "beecroft", "pennant_hills", "thornleigh", "normanhurst", "hornsby", "asquith", "mount_colah", "mount_kuring_gai", "berowra"],
    ["berowra", "mount_kuring_gai", "mount_colah", "asquith", "hornsby", "normanhurst", "thornleigh", "pennant_hills", "beecroft", "cheltenham", "epping", "eastwood", "denistone", "west_ryde", "meadowbank", "rhodes", "concord_west", "north_strathfield", "strathfield", "burwood", "redfern", "central"],
    ["central", "redfern", "ashfield", "croydon", "burwood", "strathfield", "north_strathfield", "concord_west", "rhodes", "meadowbank", "west_ryde", "denistone", "eastwood", "epping", "cheltenham", "beecroft", "pennant_hills", "thornleigh", "normanhurst", "hornsby"],
    ["hornsby", "normanhurst", "thornleigh", "pennant_hills", "beecroft", "cheltenham", "epping", "eastwood", "denistone", "west_ryde", "meadowbank", "rhodes", "concord_west", "north_strathfield", "strathfield", "burwood", "croydon", "ashfield", "redfern", "central"],
    ["central", "town_hall", "wynyard", "milsons_point", "north_sydney", "waverton", "wollstonecraft", "st_leonards", "artarmon", "chatswood", "roseville", "lindfield", "killara", "gordon"],
  ],
  M1: [
    ["tallawong", "rouse_hill", "kellyville", "bella_vista", "norwest", "hills_showground", "castle_hill", "cherrybrook", "epping", "macquarie_university", "macquarie_park", "north_ryde", "chatswood", "crows_nest", "victoria_cross", "barangaroo", "martin_place", "gadigal", "central", "waterloo", "sydenham"],
    ["sydenham", "waterloo", "central", "gadigal", "martin_place", "barangaroo", "victoria_cross", "crows_nest", "chatswood", "north_ryde", "macquarie_park", "macquarie_university", "epping", "cherrybrook", "castle_hill", "hills_showground", "norwest", "bella_vista", "kellyville", "rouse_hill", "tallawong"],
  ],
};

function buildEdgesList(): Edge[] {
  const edges: Edge[] = [];
  const edgeKeys = new Set<string>();
  for (const [lineId, segments] of Object.entries(lineSegments)) {
    const line = lineId as LineId;
    for (const segment of segments) {
      for (let i = 0; i < segment.length - 1; i++) {
        const from = segment[i];
        const to = segment[i + 1];
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
