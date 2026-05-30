/**
 * Verify stations.json against the official TfNSW Sydney Trains network map.
 * 
 * The official map shows colored dots/circles at each station for lines that
 * serve it. This script uses the official map's station-to-line assignments.
 * 
 * Key rules from the official map:
 * - T1 runs express Redfern → Strathfield (no dots at Ashfield/Croydon/Burwood/Homebush/Flemington)
 * - T9 runs Strathfield → Burwood → Redfern (no dots at Ashfield/Croydon)
 * - T4 terminates at Waterfall (Helensburgh is intercity, not on suburban map)
 * - T8 does NOT include Leppington/Edmondson Park (those are T2/T5)
 * - T3 goes via Lidcombe → Berala → Regents Park → Sefton → Chester Hill → ... → Liverpool
 *   but does NOT include Birrong/Yagoona/Bankstown (those are T6 only post-2024)
 */

import fs from 'fs';
import path from 'path';

interface StationEntry {
  id: string;
  name: string;
  lines: string[];
  lat: number;
  lng: number;
}

const stationsPath = path.join(__dirname, '..', 'public', 'stations.json');
const stations: StationEntry[] = JSON.parse(fs.readFileSync(stationsPath, 'utf-8'));

// ============================================================
// OFFICIAL MAP - Station lists per line (colored dots on map)
// ============================================================

const officialLineStations: Record<string, string[]> = {
  // T1 North Shore & Western Line
  // North Shore: Berowra → Hornsby → ... → Chatswood → ... → North Sydney → Milsons Point → Wynyard → Town Hall → Central
  // Western: Central → Redfern → (EXPRESS) → Strathfield → Lidcombe → Auburn → ... → Emu Plains / Richmond
  // NOTE: T1 runs express Redfern → Strathfield. No T1 dots at Ashfield/Croydon/Burwood/Homebush/Flemington
  T1: [
    // North Shore branch
    "berowra", "mount_kuring_gai", "mount_colah", "asquith", "hornsby",
    "waitara", "wahroonga", "warrawee", "turramurra", "pymble",
    "gordon", "killara", "lindfield", "roseville",
    "chatswood", "artarmon", "st_leonards", "wollstonecraft", "waverton",
    "north_sydney", "milsons_point", "wynyard", "town_hall", "central",
    // Western branch — express Redfern → Strathfield, then all stops
    "redfern", "strathfield",
    "lidcombe", "auburn", "clyde", "granville",
    "harris_park", "parramatta", "westmead", "wentworthville",
    "pendle_hill", "toongabbie", "seven_hills", "blacktown",
    // Richmond branch (from Blacktown)
    "marayong", "quakers_hill", "schofields", "riverstone", "vineyard",
    "mulgrave", "windsor", "clarendon", "east_richmond", "richmond",
    // Emu Plains branch (from Blacktown)
    "doonside", "rooty_hill", "mount_druitt", "st_marys", "werrington",
    "kingswood", "penrith", "emu_plains",
  ],

  // T2 Inner West & Leppington Line
  // City Circle + Inner West (all stops) + Leppington/Parramatta branches
  T2: [
    // City Circle
    "central", "museum", "st_james", "circular_quay", "wynyard", "town_hall",
    // Inner West (all stops Redfern → Strathfield)
    "redfern", "macdonaldtown", "newtown", "stanmore", "petersham",
    "lewisham", "summer_hill", "ashfield", "croydon", "burwood",
    "strathfield", "homebush", "flemington", "lidcombe",
    "auburn", "clyde", "granville",
    // Parramatta branch
    "harris_park", "parramatta",
    // Leppington branch (from Granville)
    "merrylands", "guildford", "yennora", "fairfield", "canley_vale",
    "cabramatta", "warwick_farm", "liverpool",
    "casula", "glenfield", "edmondson_park", "leppington",
  ],

  // T3 Liverpool & Inner West Line (post-2024)
  // City Circle + Inner West → Lidcombe → Berala → Regents Park → Sefton → ... → Liverpool
  // T3 does NOT include Birrong/Yagoona/Bankstown (those are T6 only)
  T3: [
    // City Circle
    "central", "museum", "st_james", "circular_quay", "wynyard", "town_hall",
    // Inner West
    "redfern", "macdonaldtown", "newtown", "stanmore", "petersham",
    "lewisham", "summer_hill", "ashfield", "croydon", "burwood",
    "strathfield", "homebush", "flemington", "lidcombe",
    // Via Berala/Regents Park branch
    "berala", "regents_park", "sefton", "chester_hill", "leightonfield",
    "villawood", "carramar",
    // To Liverpool
    "cabramatta", "warwick_farm", "liverpool",
  ],

  // T4 Eastern Suburbs & Illawarra Line
  // Bondi Junction → City → Cronulla / Waterfall (NOT Helensburgh - that's intercity)
  T4: [
    "bondi_junction", "edgecliff", "kings_cross", "martin_place",
    "town_hall", "central", "redfern",
    "erskineville", "st_peters", "sydenham", "tempe", "wolli_creek",
    "arncliffe", "banksia", "rockdale", "kogarah", "carlton", "allawah",
    "hurstville", "penshurst", "mortdale", "oatley", "como", "jannali",
    "sutherland",
    // Cronulla branch
    "kirrawee", "gymea", "miranda", "caringbah", "woolooware", "cronulla",
    // Waterfall branch (from Sutherland) — NOT Helensburgh
    "loftus", "engadine", "heathcote", "waterfall",
  ],

  // T5 Cumberland Line
  T5: [
    "richmond", "east_richmond", "clarendon", "windsor", "mulgrave",
    "vineyard", "riverstone", "schofields", "quakers_hill", "marayong",
    "blacktown", "seven_hills", "toongabbie", "pendle_hill",
    "wentworthville", "westmead", "parramatta", "harris_park",
    "merrylands", "guildford", "yennora", "fairfield", "canley_vale",
    "cabramatta", "warwick_farm", "liverpool",
    "casula", "glenfield", "edmondson_park", "leppington",
    // Penrith branch (from Blacktown)
    "doonside", "rooty_hill", "mount_druitt", "st_marys", "werrington",
    "kingswood", "penrith",
  ],

  // T6 Lidcombe & Bankstown Line (shuttle)
  T6: [
    "lidcombe", "berala", "regents_park", "birrong", "yagoona", "bankstown",
  ],

  // T7 Olympic Park Line (shuttle from Lidcombe)
  T7: [
    "lidcombe", "olympic_park",
  ],

  // T8 Airport & South Line
  // City Circle + Airport branch + South (via East Hills) to Macarthur
  // Via Sydenham branch: Redfern → Erskineville → St Peters → Sydenham → Wolli Creek
  // Does NOT include Leppington/Edmondson Park
  T8: [
    // City Circle
    "central", "museum", "st_james", "circular_quay", "wynyard", "town_hall",
    // Airport branch
    "green_square", "mascot", "domestic_airport", "international_airport",
    // Via Sydenham branch
    "redfern", "erskineville", "st_peters", "sydenham",
    // Common trunk
    "wolli_creek", "turrella", "bardwell_park", "bexley_north",
    "kingsgrove", "beverly_hills", "narwee", "riverwood",
    "padstow", "revesby", "panania", "east_hills", "holsworthy",
    "glenfield",
    // Macarthur branch only
    "macquarie_fields", "ingleburn", "minto", "leumeah",
    "campbelltown", "macarthur",
  ],

  // T9 Northern Line
  // Branch 1: Hornsby → Epping → ... → North Strathfield → Strathfield → Burwood → Redfern → Central
  // NOTE: T9 does NOT stop at Croydon or Ashfield (express Strathfield/Burwood → Redfern)
  // Branch 2: Gordon → Chatswood → ... → North Sydney → Milsons Point → Wynyard → Town Hall → Central
  T9: [
    // Northern branch: Hornsby → Central
    "hornsby", "normanhurst", "thornleigh", "pennant_hills", "beecroft",
    "cheltenham", "epping", "eastwood", "denistone", "west_ryde",
    "meadowbank", "rhodes", "concord_west", "north_strathfield",
    "strathfield", "burwood",
    "redfern", "central",
    // North Shore branch: Gordon → Central
    "gordon", "killara", "lindfield", "roseville",
    "chatswood", "artarmon", "st_leonards", "wollstonecraft", "waverton",
    "north_sydney", "milsons_point", "wynyard", "town_hall",
  ],

  // M1 Metro City & Southwest
  M1: [
    "tallawong", "rouse_hill", "kellyville", "bella_vista", "norwest",
    "hills_showground", "castle_hill", "cherrybrook", "epping",
    "macquarie_university", "macquarie_park", "north_ryde",
    "chatswood", "crows_nest", "victoria_cross", "barangaroo",
    "martin_place", "gadigal", "central", "waterloo", "sydenham",
  ],
};

// ============================================================
// VERIFICATION
// ============================================================

console.log("=== SYDNEY TRAINS NETWORK MAP VERIFICATION ===\n");

const allDiscrepancies: {line: string, station: string, type: 'extra' | 'missing'}[] = [];

for (const [lineId, officialStations] of Object.entries(officialLineStations)) {
  const officialSet = new Set(officialStations);
  
  const jsonStationsOnLine: string[] = [];
  for (const s of stations) {
    if (s.lines.includes(lineId)) {
      jsonStationsOnLine.push(s.id);
    }
  }
  const jsonSet = new Set(jsonStationsOnLine);
  
  const inJsonButNotOfficial = jsonStationsOnLine.filter(id => !officialSet.has(id));
  const inOfficialButNotJson = officialStations.filter(id => !jsonSet.has(id));
  
  console.log(`--- ${lineId} ---`);
  console.log(`  Official map stations: ${officialSet.size}`);
  console.log(`  stations.json stations: ${jsonSet.size}`);
  
  if (inJsonButNotOfficial.length > 0) {
    console.log(`  ❌ EXTRA in stations.json (NOT on official map):`);
    for (const id of inJsonButNotOfficial) {
      console.log(`     - ${id}`);
      allDiscrepancies.push({line: lineId, station: id, type: 'extra'});
    }
  }
  
  if (inOfficialButNotJson.length > 0) {
    console.log(`  ❌ MISSING from stations.json (IS on official map):`);
    for (const id of inOfficialButNotJson) {
      console.log(`     - ${id}`);
      allDiscrepancies.push({line: lineId, station: id, type: 'missing'});
    }
  }
  
  if (inJsonButNotOfficial.length === 0 && inOfficialButNotJson.length === 0) {
    console.log(`  ✅ MATCH`);
  }
  
  console.log();
}

// Check orphan stations
const allOfficialStations = new Set<string>();
for (const stns of Object.values(officialLineStations)) {
  for (const s of stns) allOfficialStations.add(s);
}

const orphanStations = stations.filter(s => !allOfficialStations.has(s.id));
if (orphanStations.length > 0) {
  console.log("--- ORPHAN STATIONS ---");
  for (const s of orphanStations) {
    console.log(`  - ${s.id} (lines: ${s.lines.join(', ')})`);
  }
  console.log();
}

// Check missing station entries
const jsonStationIds = new Set(stations.map(s => s.id));
const missingFromJson = [...allOfficialStations].filter(id => !jsonStationIds.has(id));
if (missingFromJson.length > 0) {
  console.log("--- COMPLETELY MISSING STATION ENTRIES ---");
  for (const id of missingFromJson) {
    const onLines: string[] = [];
    for (const [lineId, stns] of Object.entries(officialLineStations)) {
      if (stns.includes(id)) onLines.push(lineId);
    }
    console.log(`  - ${id} (should be on: ${onLines.join(', ')})`);
  }
  console.log();
}

console.log("=== SUMMARY ===");
if (allDiscrepancies.length === 0) {
  console.log("✅ All stations match the official network map!");
} else {
  console.log(`❌ Found ${allDiscrepancies.length} discrepancies:\n`);
  
  // Group by type
  const extras = allDiscrepancies.filter(d => d.type === 'extra');
  const missings = allDiscrepancies.filter(d => d.type === 'missing');
  
  if (extras.length > 0) {
    console.log("  STATIONS TO REMOVE from lines:");
    for (const d of extras) {
      console.log(`    ${d.station} should NOT have ${d.line}`);
    }
  }
  if (missings.length > 0) {
    console.log("\n  STATIONS TO ADD to lines:");
    for (const d of missings) {
      console.log(`    ${d.station} should HAVE ${d.line}`);
    }
  }
}
