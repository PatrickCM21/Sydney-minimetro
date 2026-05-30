import urllib.request
import re
import json
import os
import sys

# Define target lines and details
LINE_DETAILS = {
    'T1': ('T1 North Shore & Western Line', '#F99D1C'),
    'T2': ('T2 Inner West & Leppington Line', '#0098CD'),
    'T3': ('T3 Liverpool & Inner West Line', '#F37021'),
    'T4': ('T4 Eastern Suburbs & Illawarra Line', '#005AA3'),
    'T5': ('T5 Cumberland Line', '#C4258F'),
    'T6': ('T6 Lidcombe & Bankstown Line', '#7C3E21'),
    'T7': ('T7 Olympic Park Line', '#6F818E'),
    'T8': ('T8 Airport & South Line', '#00954C'),
    'T9': ('T9 Northern Line', '#D11F2F'),
    'M1': ('M1 Metro Northwest & Bankstown Line', '#168388')
}

METRO_ONLY_CODES = {
    'barangaroo': 'BGO',
    'bella_vista': 'BVS',
    'castle_hill': 'CSH',
    'cherrybrook': 'CBK',
    'crows_nest': 'CRN',
    'gadigal': 'GDG',
    'hills_showground': 'HSG',
    'kellyville': 'KVL',
    'macquarie_park': 'MQP',
    'macquarie_university': 'MCU',
    'norwest': 'NWT',
    'north_ryde': 'NRD',
    'rouse_hill': 'RSH',
    'tallawong': 'TAW',
    'victoria_cross': 'VCS',
    'waterloo': 'WLO',
    'airport_business_park': 'ABP',
    'airport_terminal': 'APT',
    'bradfield': 'BDF',
    'burwood_north': 'BWN',
    'five_dock': 'FDK',
    'hunter_street': 'HST',
    'luddenham': 'LDH',
    'orchard_hills': 'OHL',
    'pyrmont': 'PYR',
    'the_bays': 'TBY'
}

SLUG_VARIANTS = {
    'T1': {
        'richmond_to_berowra': ["richmond", "east_richmond", "clarendon", "windsor", "mulgrave", "vineyard", "riverstone", "schofields", "quakers_hill", "marayong", "blacktown", "seven_hills", "toongabbie", "pendle_hill", "wentworthville", "westmead", "parramatta", "harris_park", "granville", "clyde", "auburn", "lidcombe", "strathfield", "redfern", "central", "town_hall", "wynyard", "milsons_point", "north_sydney", "waverton", "wollstonecraft", "st_leonards", "artarmon", "chatswood", "roseville", "lindfield", "killara", "gordon", "pymble", "turramurra", "warrawee", "wahroonga", "waitara", "hornsby", "asquith", "mount_colah", "mount_kuring_gai", "berowra"],
        'emu_plains_to_berowra': ["emu_plains", "penrith", "kingswood", "werrington", "st_marys", "mount_druitt", "rooty_hill", "doonside", "blacktown", "seven_hills", "toongabbie", "pendle_hill", "wentworthville", "westmead", "parramatta", "harris_park", "granville", "clyde", "auburn", "lidcombe", "strathfield", "redfern", "central", "town_hall", "wynyard", "milsons_point", "north_sydney", "waverton", "wollstonecraft", "st_leonards", "artarmon", "chatswood", "roseville", "lindfield", "killara", "gordon", "pymble", "turramurra", "warrawee", "wahroonga", "waitara", "hornsby", "asquith", "mount_colah", "mount_kuring_gai", "berowra"]
    },
    'T2': {
        'leppington_to_city': ["leppington", "edmondson_park", "glenfield", "casula", "liverpool", "warwick_farm", "cabramatta", "canley_vale", "fairfield", "yennora", "guildford", "merrylands", "granville", "clyde", "auburn", "lidcombe", "flemington", "homebush", "strathfield", "burwood", "croydon", "ashfield", "summer_hill", "lewisham", "petersham", "stanmore", "newtown", "macdonaldtown", "redfern", "central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "central"],
        'parramatta_to_city': ["parramatta", "harris_park", "granville", "clyde", "auburn", "lidcombe", "flemington", "homebush", "strathfield", "burwood", "croydon", "ashfield", "summer_hill", "lewisham", "petersham", "stanmore", "newtown", "macdonaldtown", "redfern", "central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "central"]
    },
    'T3': {
        'liverpool_to_city': ["liverpool", "warwick_farm", "cabramatta", "carramar", "villawood", "leightonfield", "chester_hill", "sefton", "regents_park", "berala", "lidcombe", "flemington", "homebush", "strathfield", "burwood", "croydon", "ashfield", "summer_hill", "lewisham", "petersham", "stanmore", "newtown", "macdonaldtown", "redfern", "central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "central"]
    },
    'T4': {
        'cronulla_to_bondi': ["cronulla", "woolooware", "caringbah", "miranda", "gymea", "kirrawee", "sutherland", "jannali", "como", "oatley", "mortdale", "penshurst", "hurstville", "allawah", "carlton", "kogarah", "rockdale", "banksia", "arncliffe", "wolli_creek", "tempe", "sydenham", "redfern", "central", "town_hall", "martin_place", "kings_cross", "edgecliff", "bondi_junction"],
        'helensburgh_to_bondi': ["helensburgh", "waterfall", "heathcote", "engadine", "loftus", "sutherland", "jannali", "como", "oatley", "mortdale", "penshurst", "hurstville", "allawah", "carlton", "kogarah", "rockdale", "banksia", "arncliffe", "wolli_creek", "tempe", "sydenham", "redfern", "central", "town_hall", "martin_place", "kings_cross", "edgecliff", "bondi_junction"]
    },
    'T5': {
        'richmond_to_leppington': ["richmond", "east_richmond", "clarendon", "windsor", "mulgrave", "vineyard", "riverstone", "schofields", "quakers_hill", "marayong", "blacktown", "seven_hills", "toongabbie", "pendle_hill", "wentworthville", "westmead", "parramatta", "harris_park", "merrylands", "guildford", "yennora", "fairfield", "canley_vale", "cabramatta", "warwick_farm", "liverpool", "casula", "glenfield", "edmondson_park", "leppington"]
    },
    'T6': {
        'main': ["lidcombe", "berala", "regents_park", "birrong", "yagoona", "bankstown"]
    },
    'T7': {
        'main': ["lidcombe", "olympic_park"]
    },
    'T8': {
        'via_airport': ["macarthur", "campbelltown", "leumeah", "minto", "ingleburn", "macquarie_fields", "glenfield", "holsworthy", "east_hills", "panania", "revesby", "padstow", "riverwood", "narwee", "beverly_hills", "kingsgrove", "bexley_north", "bardwell_park", "turrella", "wolli_creek", "international_airport", "domestic_airport", "mascot", "green_square", "central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "central"],
        'via_sydenham': ["macarthur", "campbelltown", "leumeah", "minto", "ingleburn", "macquarie_fields", "glenfield", "holsworthy", "east_hills", "panania", "revesby", "padstow", "riverwood", "narwee", "beverly_hills", "kingsgrove", "bexley_north", "bardwell_park", "turrella", "wolli_creek", "sydenham", "st_peters", "erskineville", "redfern", "central"]
    },
    'T9': {
        'main': ["hornsby", "normanhurst", "thornleigh", "pennant_hills", "beecroft", "cheltenham", "epping", "eastwood", "denistone", "west_ryde", "meadowbank", "rhodes", "concord_west", "north_strathfield", "strathfield", "burwood", "redfern", "central", "town_hall", "wynyard", "milsons_point", "north_sydney", "waverton", "wollstonecraft", "st_leonards", "artarmon", "chatswood", "roseville", "lindfield", "killara", "gordon"]
    },
    'M1': {
        'main': ["tallawong", "rouse_hill", "kellyville", "bella_vista", "norwest", "hills_showground", "castle_hill", "cherrybrook", "epping", "macquarie_university", "macquarie_park", "north_ryde", "chatswood", "crows_nest", "victoria_cross", "barangaroo", "martin_place", "gadigal", "central", "waterloo", "sydenham"]
    }
}

def fetch_wikitext(title):
    title = title.replace(' ', '_')
    url = f"https://en.wikipedia.org/w/index.php?title={title}&action=raw"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'SydneyTrainsScraper/1.0 (patrick@example.com)'}
    )
    with urllib.request.urlopen(req) as response:
        text = response.read().decode('utf-8')
        
    redirect_match = re.match(r'#REDIRECT\s*\[\[(.*?)\]\]', text, re.IGNORECASE)
    if redirect_match:
        target = redirect_match.group(1)
        if '#' in target:
            target = target.split('#')[0]
        return fetch_wikitext(target)
    return text

def parse_wikitext_table(table_text):
    rows = []
    lines = table_text.strip().split('\n')
    raw_rows = []
    current_raw_row = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.startswith('|+'):
            continue
        if line.startswith('{|'):
            continue
        if line.startswith('|}'):
            if current_raw_row:
                raw_rows.append(current_raw_row)
            continue
        if line.startswith('|-'):
            if current_raw_row:
                raw_rows.append(current_raw_row)
                current_raw_row = []
            continue
        
        if line.startswith('|') or line.startswith('!'):
            is_header = line.startswith('!')
            content = line[1:]
            
            sep = '!!' if is_header else '||'
            parts = re.split(r'\|\||!!', content)
            
            for part in parts:
                current_raw_row.append((is_header, part.strip()))
                
    if current_raw_row:
        raw_rows.append(current_raw_row)
        
    grid = []
    for r_idx, raw_row in enumerate(raw_rows):
        while len(grid) <= r_idx:
            grid.append([])
            
        c_idx = 0
        for is_header, cell_text in raw_row:
            while c_idx < len(grid[r_idx]) and grid[r_idx][c_idx] is not None:
                c_idx += 1
                
            rowspan = 1
            colspan = 1
            cell_content = cell_text
            
            if '|' in cell_text and '[[' not in cell_text and '{{' not in cell_text:
                pipe_idx = -1
                bracket_level = 0
                brace_level = 0
                for i, char in enumerate(cell_text):
                    if char == '[': bracket_level += 1
                    elif char == ']': bracket_level -= 1
                    elif char == '{': brace_level += 1
                    elif char == '}': brace_level -= 1
                    elif char == '|' and bracket_level == 0 and brace_level == 0:
                        pipe_idx = i
                        break
                
                if pipe_idx != -1:
                    attrs_str = cell_text[:pipe_idx].strip()
                    cell_content = cell_text[pipe_idx+1:].strip()
                    
                    rowspan_match = re.search(r'rowspan=["\']?(\d+)["\']?', attrs_str, re.IGNORECASE)
                    if rowspan_match:
                        rowspan = int(rowspan_match.group(1))
                    colspan_match = re.search(r'colspan=["\']?(\d+)["\']?', attrs_str, re.IGNORECASE)
                    if colspan_match:
                        colspan = int(colspan_match.group(1))
            
            for dr in range(rowspan):
                nr = r_idx + dr
                while len(grid) <= nr:
                    grid.append([])
                for dc in range(colspan):
                    nc = c_idx + dc
                    while len(grid[nr]) <= nc:
                        grid[nr].append(None)
                    grid[nr][nc] = cell_content
                    
            c_idx += colspan
            
    return grid

def clean_station_name(cell_text):
    if not cell_text:
        return ""
    match = re.search(r'\[\[([^\]|]+)(?:\|([^\]]+))?\]\]', cell_text)
    if match:
        name = match.group(2) if match.group(2) else match.group(1)
    else:
        name = cell_text
    
    name = re.sub(r'<[^>]+>', '', name)
    name = re.sub(r'\{\{[^\}]+\}\}', '', name)
    name = name.strip(' \t\n\r*§#')
    name = re.sub(r'\s+(railway|metro|light rail)?\s*station.*', '', name, flags=re.IGNORECASE)
    return name.strip()

def extract_lines(cell_text):
    if not cell_text:
        return []
    lines = re.findall(r'\b(T[1-9]|M1)\b', cell_text)
    return sorted(list(set(lines)))

def get_station_slug(name):
    slug = name.lower().replace(" ", "_").replace("'", "").replace("-", "_").replace("&", "and")
    return slug

def parse_stations_list(title, is_metro=False):
    text = fetch_wikitext(title)
    tables = re.findall(r'(\{\n?\|.*?\n?\|\})', text, re.DOTALL)
    if not tables:
        print(f"No tables found in {title}!")
        return {}
        
    # For Metro, we need to process both "List of current stations" and "List of future stations"
    # The List of current stations is tables[0], List of future stations is tables[1]
    parsed_tables = [tables[0]]
    if is_metro and len(tables) > 1:
        parsed_tables.append(tables[1])
        
    stations = {}
    last_lines = []
    
    for table_text in parsed_tables:
        grid = parse_wikitext_table(table_text)
        if not grid:
            continue
            
        header_row = grid[0]
        station_col = -1
        code_col = -1
        services_col = -1
        
        for idx, cell in enumerate(header_row):
            if not cell:
                continue
            if "Station" in cell:
                station_col = idx
            elif "Code" in cell:
                code_col = idx
            elif "Suburban services" in cell or "Services" in cell or "Served by" in cell:
                services_col = idx
                
        # If code column not found (like in Metro tables), it stays -1
        for r_idx in range(1, len(grid)):
            row = grid[r_idx]
            if len(row) <= station_col:
                continue
                
            raw_name = row[station_col]
            name = clean_station_name(raw_name)
            if not name:
                continue
                
            code = ""
            if code_col != -1 and len(row) > code_col and row[code_col]:
                code = row[code_col].strip()
            if name == "West Ryde":
                code = "WRD"
                
            lines = []
            if services_col != -1 and len(row) > services_col and row[services_col]:
                lines = extract_lines(row[services_col])
                
            if not lines:
                lines = last_lines
            else:
                last_lines = lines
                
            # For Metro stations, if it says served by M1 or has M1 in it, or is in the Metro article
            if is_metro and 'M1' not in lines:
                lines = sorted(list(set(lines + ['M1'])))
                
            slug = get_station_slug(name)
            stations[slug] = {
                'name': name,
                'code': code,
                'lines': lines
            }
            
    return stations

def main():
    update_mode = "--update" in sys.argv
    
    print("Scraping Sydney Trains and Metro station lists...")
    trains_stns = parse_stations_list("List_of_Sydney_Trains_railway_stations", is_metro=False)
    metro_stns = parse_stations_list("List_of_Sydney_Metro_stations", is_metro=True)
    
    print(f"Scraped {len(trains_stns)} Trains stations.")
    print(f"Scraped {len(metro_stns)} Metro stations.")
    
    # Merge both datasets
    all_stations = {}
    for slug, stn in trains_stns.items():
        all_stations[slug] = {
            'name': stn['name'],
            'code': stn['code'],
            'lines': stn['lines']
        }
        
    for slug, stn in metro_stns.items():
        if slug in all_stations:
            # Combine lines
            all_lines = sorted(list(set(all_stations[slug]['lines'] + stn['lines'])))
            all_stations[slug]['lines'] = all_lines
        else:
            all_stations[slug] = {
                'name': stn['name'],
                'code': stn['code'],
                'lines': stn['lines']
            }
            
    # Resolve station codes
    slug_to_id = {}
    stations_data = {}
    
    for slug, stn in all_stations.items():
        code = stn['code'].strip()
        if ',' in code:
            code = code.split(',')[0].strip()
        if '/' in code:
            code = code.split('/')[0].strip()
            
        # If no code in trains, check Metro-only codes
        if not code:
            code = METRO_ONLY_CODES.get(slug, "")
        if not code:
            # Fallback code generation
            clean_code = re.sub(r'[^a-zA-Z]', '', stn['name']).upper()
            code = clean_code[:3]
            
        station_id = f"STN-{code}"
        slug_to_id[slug] = station_id
        
        # Interchanges must only contain valid lines T1-T9 and M1
        interchanges = [line for line in stn['lines'] if line in LINE_DETAILS]
        
        stations_data[station_id] = {
            'id': station_id,
            'name': stn['name'],
            'interchanges': interchanges,
            'lat': 0.0,
            'lng': 0.0
        }
        
    # Read existing coordinates from public/stations.json
    stations_path = 'public/stations.json'
    existing_coords = {}
    if os.path.exists(stations_path):
        try:
            with open(stations_path, 'r', encoding='utf-8') as f:
                old_stns = json.load(f)
                if isinstance(old_stns, list):
                    for stn in old_stns:
                        # old stations are list of objects with "id" as slug or similar
                        stn_slug = get_station_slug(stn.get('name', ''))
                        existing_coords[stn_slug] = (stn.get('lat', 0.0), stn.get('lng', 0.0))
                elif isinstance(old_stns, dict):
                    for k, stn in old_stns.items():
                        stn_slug = get_station_slug(stn.get('name', ''))
                        existing_coords[stn_slug] = (stn.get('lat', 0.0), stn.get('lng', 0.0))
        except Exception as e:
            print(f"Could not read existing coordinates: {e}")
            
    # Populate coords
    for slug, station_id in slug_to_id.items():
        coords = existing_coords.get(slug, (0.0, 0.0))
        stations_data[station_id]['lat'] = coords[0]
        stations_data[station_id]['lng'] = coords[1]
        
    # Ensure Regents Park gets the exact requested coordinates
    if 'regents_park' in slug_to_id:
        rp_id = slug_to_id['regents_park']
        stations_data[rp_id]['lat'] = -33.8831901
        stations_data[rp_id]['lng'] = 151.02401965
        
    # Backfill interchanges from SLUG_VARIANTS to stations_data
    for lid, variants in SLUG_VARIANTS.items():
        for v_name, slug_seq in variants.items():
            for slug in slug_seq:
                if slug in slug_to_id:
                    stn_id = slug_to_id[slug]
                    if stn_id in stations_data:
                        if lid not in stations_data[stn_id]['interchanges']:
                            stations_data[stn_id]['interchanges'].append(lid)

    # Filter out stations that have no interchanges
    stations_data = {k: v for k, v in stations_data.items() if v['interchanges']}
    
    # Generate lines.json data
    lines_data = {}
    for line_id, (display_name, color) in LINE_DETAILS.items():
        # Get variants for this line
        line_variants = SLUG_VARIANTS.get(line_id, {})
        mapped_variants = {}
        for var_name, slugs in line_variants.items():
            # Filter and map slugs to STN- IDs
            mapped_ids = []
            for s in slugs:
                if s in slug_to_id:
                    mapped_ids.append(slug_to_id[s])
            mapped_variants[var_name] = mapped_ids
            
        lines_data[line_id] = {
            'lineId': line_id,
            'displayName': display_name,
            'color': color,
            'variants': mapped_variants
        }
        
    if not update_mode:
        print("\nScraping complete (DRY RUN). Run with '--update' to write changes to files.")
        print(f"Scraped {len(stations_data)} stations with valid lines.")
        return
        
    print("\nUpdating project JSON files with scraped data...")
    with open('public/stations.json', 'w', encoding='utf-8') as f:
        json.dump(stations_data, f, indent=2)
    print(f"  Successfully wrote public/stations.json")
    
    with open('public/lines.json', 'w', encoding='utf-8') as f:
        json.dump(lines_data, f, indent=2)
    print(f"  Successfully wrote public/lines.json")
    
    # Also update whitelist in extract_gtfs.py if needed, or re-run
    # For this task, we will also generate networkData.ts directly to match!
    # Let's write the networkData.ts generation code right here, or in a separate helper.
    # We will generate src/lib/networkData.ts directly from stations_data and SLUG_VARIANTS.
    
    print("\nGenerating src/lib/networkData.ts...")
    ts_content = []
    ts_content.append("/**")
    ts_content.append(" * Sydney Rail Network Data (Auto-Generated from Wikipedia Scraper)")
    ts_content.append(" */")
    ts_content.append("")
    ts_content.append("import type { TrainLine, Station, Edge, LineId } from '@/types';")
    ts_content.append("import stationsData from '../../public/stations.json';")
    ts_content.append("")
    ts_content.append("export const LINES: TrainLine[] = [")
    
    line_order = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'M1']
    for lid in line_order:
        name, color = LINE_DETAILS[lid]
        ts_content.append(f"  {{ id: '{lid}', name: '{name}', color: '{color}', textColor: '#fff' }},")
    ts_content.append("];")
    ts_content.append("")
    ts_content.append("export const LINE_MAP: Record<LineId, TrainLine> = Object.fromEntries(")
    ts_content.append("  LINES.map(l => [l.id, l])")
    ts_content.append(") as Record<LineId, TrainLine>;")
    ts_content.append("")
    ts_content.append("export const STATIONS: Station[] = Object.values(stationsData as unknown as Record<string, {")
    ts_content.append("  id: string;")
    ts_content.append("  name: string;")
    ts_content.append("  interchanges: string[];")
    ts_content.append("  lat: number;")
    ts_content.append("  lng: number;")
    ts_content.append("}>).map(s => ({")
    ts_content.append("  id: s.id,")
    ts_content.append("  name: s.name,")
    ts_content.append("  lines: s.interchanges as LineId[],")
    ts_content.append("  lat: s.lat,")
    ts_content.append("  lng: s.lng")
    ts_content.append("}));")
    ts_content.append("")
    ts_content.append("export const STATIONS_DEDUPED = STATIONS;")
    ts_content.append("")
    ts_content.append("export const slugToIdMap: Record<string, string> = Object.fromEntries(")
    ts_content.append("  STATIONS.map(s => {")
    ts_content.append("    const slug = s.name.toLowerCase()")
    ts_content.append("      .replace(/ /g, '_')")
    ts_content.append("      .replace(/'/g, '')")
    ts_content.append("      .replace(/-/g, '_')")
    ts_content.append("      .replace(/&/g, 'and');")
    ts_content.append("    return [slug, s.id];")
    ts_content.append("  })")
    ts_content.append(");")
    ts_content.append("slugToIdMap['mount_kuring-gai'] = 'STN-MKI';")
    ts_content.append("slugToIdMap['mount_kuring_gai'] = 'STN-MKI';")
    ts_content.append("")
    ts_content.append("export function resolveStationId(id: string): string {")
    ts_content.append("  if (!id) return id;")
    ts_content.append("  if (id.startsWith('STN-')) return id;")
    ts_content.append("  return slugToIdMap[id] || id;")
    ts_content.append("}")
    ts_content.append("")
    ts_content.append("const lineSegments: Record<LineId, string[][]> = {")
    
    for lid in line_order:
        ts_content.append(f"  {lid}: [")
        variants = SLUG_VARIANTS.get(lid, {})
        for var_name, slugs in variants.items():
            mapped_ids = [slug_to_id[s] for s in slugs if s in slug_to_id]
            seg_strs = ", ".join(f'"{sid}"' for sid in mapped_ids)
            ts_content.append(f"    [{seg_strs}],")
        ts_content.append("  ],")
        
    ts_content.append("};")
    ts_content.append("")
    ts_content.append("function buildEdgesList(): Edge[] {")
    ts_content.append("  const edges: Edge[] = [];")
    ts_content.append("  for (const [lineId, segments] of Object.entries(lineSegments)) {")
    ts_content.append("    const line = lineId as LineId;")
    ts_content.append("    const candidatePairs = new Set<string>();")
    ts_content.append("    for (const segment of segments) {")
    ts_content.append("      for (let i = 0; i < segment.length - 1; i++) {")
    ts_content.append("        const [a, b] = [segment[i], segment[i + 1]].sort();")
    ts_content.append("        candidatePairs.add(`${a}|${b}`);")
    ts_content.append("      }")
    ts_content.append("    }")
    ts_content.append("    for (const pairStr of candidatePairs) {")
    ts_content.append("      const [a, b] = pairStr.split('|');")
    ts_content.append("      let hasAdjacentOccurrence = false;")
    ts_content.append("      for (const segment of segments) {")
    ts_content.append("        const indicesA: number[] = [];")
    ts_content.append("        const indicesB: number[] = [];")
    ts_content.append("        for (let idx = 0; idx < segment.length; idx++) {")
    ts_content.append("          if (segment[idx] === a) indicesA.push(idx);")
    ts_content.append("          if (segment[idx] === b) indicesB.push(idx);")
    ts_content.append("        }")
    ts_content.append("        if (indicesA.length === 0 || indicesB.length === 0) continue;")
    ts_content.append("        let minDistance = Infinity;")
    ts_content.append("        for (const idxA of indicesA) {")
    ts_content.append("          for (const idxB of indicesB) {")
    ts_content.append("            const dist = Math.abs(idxA - idxB);")
    ts_content.append("            if (dist < minDistance) minDistance = dist;")
    ts_content.append("          }")
    ts_content.append("        }")
    ts_content.append("        if (minDistance === 1) {")
    ts_content.append("          hasAdjacentOccurrence = true;")
    ts_content.append("          break;")
    ts_content.append("        }")
    ts_content.append("      }")
    ts_content.append("      if (hasAdjacentOccurrence) {")
    ts_content.append("        edges.push({ from: a, to: b, line });")
    ts_content.append("      }")
    ts_content.append("    }")
    ts_content.append("  }")
    ts_content.append("  return edges;")
    ts_content.append("}")
    ts_content.append("")
    ts_content.append("export const EDGES = buildEdgesList();")
    ts_content.append("")
    ts_content.append("export function buildAdjacency(edges: Edge[]): Map<string, Array<{ neighbor: string; line: LineId }>> {")
    ts_content.append("  const adj = new Map<string, Array<{ neighbor: string; line: LineId }>>();")
    ts_content.append("  for (const edge of edges) {")
    ts_content.append("    if (!adj.has(edge.from)) adj.set(edge.from, []);")
    ts_content.append("    if (!adj.has(edge.to)) adj.set(edge.to, []);")
    ts_content.append("    adj.get(edge.from)!.push({ neighbor: edge.to, line: edge.line });")
    ts_content.append("    adj.get(edge.to)!.push({ neighbor: edge.from, line: edge.line });")
    ts_content.append("  }")
    ts_content.append("  return adj;")
    ts_content.append("}")
    ts_content.append("")
    ts_content.append("export function buildStationMap(stations: Station[]): Map<string, Station> {")
    ts_content.append("  return new Map(stations.map(s => [s.id, s]));")
    ts_content.append("}")
    ts_content.append("")
    ts_content.append("export const STATION_MAP = buildStationMap(STATIONS_DEDUPED);")
    ts_content.append("export const ADJACENCY = buildAdjacency(EDGES);")
    ts_content.append("")
    
    with open('src/lib/networkData.ts', 'w', encoding='utf-8') as f:
        f.write("\n".join(ts_content))
    print("Successfully wrote src/lib/networkData.ts")

if __name__ == '__main__':
    main()
