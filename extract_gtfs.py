import csv
import json
import math
import os
from collections import defaultdict

VALID_STATIONS_BY_LINE = {
    'T1': {
        "berowra", "mount_kuring_gai", "mount_colah", "asquith", "hornsby", "waitara", "wahroonga", 
        "warrawee", "turramurra", "pymble", "gordon", "killara", "lindfield", "roseville", "chatswood", 
        "artarmon", "st_leonards", "wollstonecraft", "waverton", "north_sydney", "milsons_point", 
        "wynyard", "town_hall", "central", "redfern", "ashfield", "croydon", "burwood", "strathfield", 
        "homebush", "flemington", "lidcombe", "auburn", "clyde", "granville", "harris_park", "parramatta", 
        "westmead", "wentworthville", "pendle_hill", "toongabbie", "seven_hills", "blacktown", "doonside", 
        "rooty_hill", "mount_druitt", "st_marys", "werrington", "kingswood", "penrith", "emu_plains",
        "marayong", "quakers_hill", "schofields", "riverstone", "vineyard", "mulgrave", "windsor", 
        "clarendon", "east_richmond", "richmond"
    },
    'T2': {
        "central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "redfern", 
        "macdonaldtown", "newtown", "stanmore", "petersham", "lewisham", "summer_hill", "ashfield", 
        "croydon", "burwood", "strathfield", "homebush", "flemington", "lidcombe", "auburn", "clyde", 
        "granville", "merrylands", "guildford", "yennora", "fairfield", "canley_vale", "cabramatta", 
        "warwick_farm", "liverpool", "casula", "glenfield", "edmondson_park", "leppington", "harris_park", 
        "parramatta"
    },
    'T3': {
        "central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "redfern", 
        "macdonaldtown", "newtown", "stanmore", "petersham", "lewisham", "summer_hill", "ashfield", 
        "croydon", "burwood", "strathfield", "homebush", "flemington", "lidcombe", "berala", 
        "regents_park", "sefton", "chester_hill", "leightonfield", "villawood", "carramar", 
        "cabramatta", "warwick_farm", "liverpool", "casula", "glenfield", "macquarie_fields", 
        "ingleburn", "minto", "leumeah", "campbelltown", "macarthur", "birrong", "yagoona", "bankstown"
    },
    'T4': {
        "bondi_junction", "edgecliff", "kings_cross", "martin_place", "town_hall", "central", "redfern", 
        "erskineville", "st_peters", "sydenham", "tempe", "wolli_creek", "arncliffe", "banksia", 
        "rockdale", "kogarah", "carlton", "allawah", "hurstville", "penshurst", "mortdale", "oatley", 
        "como", "jannali", "sutherland", "kirrawee", "gymea", "miranda", "caringbah", "woolooware", 
        "cronulla", "loftus", "engadine", "heathcote", "waterfall", "helensburgh"
    },
    'T5': {
        "richmond", "east_richmond", "clarendon", "windsor", "mulgrave", "vineyard", "riverstone", 
        "schofields", "quakers_hill", "marayong", "blacktown", "seven_hills", "toongabbie", 
        "pendle_hill", "wentworthville", "westmead", "parramatta", "harris_park", "merrylands", 
        "guildford", "yennora", "fairfield", "canley_vale", "cabramatta", "warwick_farm", "liverpool", 
        "casula", "glenfield", "edmondson_park", "leppington", "st_marys", "werrington", "kingswood", 
        "penrith", "emu_plains", "campbelltown", "macarthur"
    },
    'T6': {
        "lidcombe", "berala", "regents_park", "birrong", "yagoona", "bankstown"
    },
    'T7': {
        "lidcombe", "olympic_park"
    },
    'T8': {
        "central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "green_square", 
        "mascot", "domestic_airport", "international_airport", "wolli_creek", "turrella", 
        "bardwell_park", "bexley_north", "kingsgrove", "beverly_hills", "narwee", "riverwood", 
        "padstow", "revesby", "panania", "east_hills", "holsworthy", "glenfield", "macquarie_fields", 
        "ingleburn", "minto", "leumeah", "campbelltown", "macarthur", "edmondson_park", "leppington", 
        "redfern", "erskineville", "st_peters", "sydenham"
    },
    'T9': {
        "hornsby", "normanhurst", "thornleigh", "pennant_hills", "beecroft", "cheltenham", "epping", 
        "eastwood", "denistone", "west_ryde", "meadowbank", "rhodes", "concord_west", "north_strathfield", 
        "strathfield", "burwood", "croydon", "ashfield", "redfern", "central", "town_hall", "wynyard", 
        "milsons_point", "north_sydney", "waverton", "wollstonecraft", "st_leonards", "artarmon", 
        "chatswood", "roseville", "lindfield", "killara", "gordon"
    },
    'M1': {
        "tallawong", "rouse_hill", "kellyville", "bella_vista", "norwest", "hills_showground", 
        "castle_hill", "cherrybrook", "epping", "macquarie_university", "macquarie_park", 
        "north_ryde", "chatswood", "crows_nest", "victoria_cross", "barangaroo", "martin_place", 
        "gadigal", "central", "waterloo", "sydenham"
    }
}

# Spherical Mercator projection parameters
R_MAJOR = 6378137.0

def lat_lng_to_mercator(lat, lng):
    x = lng * R_MAJOR * math.pi / 180.0
    lat_rad = lat * math.pi / 180.0
    y = R_MAJOR * math.log(math.tan(math.pi / 4.0 + lat_rad / 2.0))
    return x, y

def clean_station_name(name):
    # Remove common GTFS suffixes for station names
    suffixes = [
        " Station Platform", " Station", " Platform", " Light Rail", " Metro"
    ]
    for suffix in suffixes:
        if suffix in name:
            name = name.split(suffix)[0]
    return name.strip()

def get_station_slug(name):
    clean_name = clean_station_name(name)
    slug = clean_name.lower().replace(" ", "_").replace("'", "").replace("-", "_").replace("&", "and")
    return slug

def is_subsequence(sub, main):
    if len(sub) > len(main):
        return False
    it = iter(main)
    return all(x in it for x in sub)

def filter_subsequences(sequences):
    # Sort sequences by length descending
    sorted_seqs = sorted(sequences, key=len, reverse=True)
    kept = []
    for seq in sorted_seqs:
        is_sub = False
        for k in kept:
            if is_subsequence(seq, k):
                is_sub = True
                break
        if not is_sub:
            kept.append(seq)
    return kept

def extract_data():
    gtfs_dir = 'public/full_sydney_gtfs'
    target_agencies = {'x0001', 'SMNW'}
    
    # 1. Load routes
    print("Loading routes...")
    routes = {}
    with open(os.path.join(gtfs_dir, 'routes.txt'), encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('agency_id') in target_agencies:
                routes[row['route_id']] = {
                    'short_name': row['route_short_name'],
                    'color': row.get('route_color', '888888'),
                    'long_name': row['route_long_name']
                }
    print(f"Loaded {len(routes)} target routes.")
    
    # 2. Load stops and resolve parents
    print("Loading stops...")
    stops = {}
    with open(os.path.join(gtfs_dir, 'stops.txt'), encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            sid = row['stop_id']
            parent = row.get('parent_station')
            stops[sid] = {
                'id': sid,
                'name': row['stop_name'],
                'lat': float(row['stop_lat']) if row.get('stop_lat') else 0.0,
                'lon': float(row['stop_lon']) if row.get('stop_lon') else 0.0,
                'parent_station': parent if parent else None
            }
            
    # Resolve stop_id to parent stop_id
    def resolve_stop(sid):
        stop = stops.get(sid)
        if stop and stop['parent_station']:
            return stop['parent_station']
        return sid
        
    # 3. Load trips
    print("Loading trips...")
    trips = {}
    with open(os.path.join(gtfs_dir, 'trips.txt'), encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            route_id = row['route_id']
            if route_id in routes:
                trips[row['trip_id']] = {
                    'route_id': route_id,
                    'shape_id': row.get('shape_id'),
                    'route_short_name': routes[route_id]['short_name']
                }
    print(f"Loaded {len(trips)} trips.")
    
    # 4. Load stop times and build sequences per trip
    print("Loading stop times (this may take a few seconds)...")
    trip_stops = defaultdict(list)
    with open(os.path.join(gtfs_dir, 'stop_times.txt'), encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            tid = row['trip_id']
            if tid in trips:
                parent_sid = resolve_stop(row['stop_id'])
                seq = int(row['stop_sequence'])
                trip_stops[tid].append((seq, parent_sid))
                
    # Sort stop sequences for each trip
    print("Sorting trip stop sequences...")
    trip_sequences = {}
    for tid, stps in trip_stops.items():
        stps.sort()
        trip_sequences[tid] = [sid for _, sid in stps]
        
    # 5. Group trips by unique parent station slug sequences per route
    print("Grouping sequences by route...")
    route_sequences = defaultdict(set) # route_short_name -> set of tuple of slugs
    route_seq_to_shapes = defaultdict(lambda: defaultdict(int)) # (route_short_name, tuple of slugs) -> shape_id -> count
    
    for tid, seq in trip_sequences.items():
        route_short = trips[tid]['route_short_name']
        shape_id = trips[tid]['shape_id']
        
        # Convert stop IDs to normalized slugs and filter by line whitelist
        allowed_slugs = VALID_STATIONS_BY_LINE.get(route_short, set())
        raw_slugs = [get_station_slug(stops[sid]['name']) for sid in seq if sid in stops]
        
        # Split sequence on invalid stations to avoid collapsing gaps
        subseqs = []
        current_subseq = []
        for slug in raw_slugs:
            if slug in allowed_slugs:
                current_subseq.append(slug)
            else:
                if len(current_subseq) >= 2:
                    deduped = []
                    for s in current_subseq:
                        if not deduped or deduped[-1] != s:
                            deduped.append(s)
                    if len(deduped) >= 2:
                        subseqs.append(tuple(deduped))
                current_subseq = []
        if len(current_subseq) >= 2:
            deduped = []
            for s in current_subseq:
                if not deduped or deduped[-1] != s:
                    deduped.append(s)
            if len(deduped) >= 2:
                subseqs.append(tuple(deduped))
                
        for slug_seq in subseqs:
            route_sequences[route_short].add(slug_seq)
            if shape_id:
                route_seq_to_shapes[(route_short, slug_seq)][shape_id] += 1
            
    # Filter out subsequences for each route to keep only the maximal mainline segments
    print("Filtering subsequences...")
    kept_route_segments = {}
    for rshort, seqs in route_sequences.items():
        kept = filter_subsequences(list(seqs))
        kept_route_segments[rshort] = kept
        print(f"  Route {rshort}: kept {len(kept)} / {len(seqs)} segments.")
        
    # Override kept_route_segments with clean, fully local, whitelisted passenger-facing segments
    kept_route_segments = {
        'T1': [
            ("berowra", "mount_kuring_gai", "mount_colah", "asquith", "hornsby", "waitara", "wahroonga", "warrawee", "turramurra", "pymble", "gordon", "killara", "lindfield", "roseville", "chatswood", "artarmon", "st_leonards", "wollstonecraft", "waverton", "north_sydney", "milsons_point", "wynyard", "town_hall", "central"),
            ("central", "town_hall", "wynyard", "milsons_point", "north_sydney", "waverton", "wollstonecraft", "st_leonards", "artarmon", "chatswood", "roseville", "lindfield", "killara", "gordon", "pymble", "turramurra", "warrawee", "wahroonga", "waitara", "hornsby", "asquith", "mount_colah", "mount_kuring_gai", "berowra"),
            ("central", "redfern", "strathfield", "burwood", "croydon", "ashfield", "homebush", "flemington", "lidcombe", "auburn", "clyde", "granville", "harris_park", "parramatta", "westmead", "wentworthville", "pendle_hill", "toongabbie", "seven_hills", "blacktown", "marayong", "quakers_hill", "schofields", "riverstone", "vineyard", "mulgrave", "windsor", "clarendon", "east_richmond", "richmond"),
            ("richmond", "east_richmond", "clarendon", "windsor", "mulgrave", "vineyard", "riverstone", "schofields", "quakers_hill", "marayong", "blacktown", "seven_hills", "toongabbie", "pendle_hill", "wentworthville", "westmead", "parramatta", "harris_park", "granville", "clyde", "auburn", "lidcombe", "flemington", "homebush", "ashfield", "croydon", "burwood", "strathfield", "redfern", "central"),
            ("central", "redfern", "strathfield", "burwood", "croydon", "ashfield", "homebush", "flemington", "lidcombe", "auburn", "clyde", "granville", "harris_park", "parramatta", "westmead", "wentworthville", "pendle_hill", "toongabbie", "seven_hills", "blacktown", "doonside", "rooty_hill", "mount_druitt", "st_marys", "werrington", "kingswood", "penrith", "emu_plains"),
            ("emu_plains", "penrith", "kingswood", "werrington", "st_marys", "mount_druitt", "rooty_hill", "doonside", "blacktown", "seven_hills", "toongabbie", "pendle_hill", "wentworthville", "westmead", "parramatta", "harris_park", "granville", "clyde", "auburn", "lidcombe", "flemington", "homebush", "ashfield", "croydon", "burwood", "strathfield", "redfern", "central")
        ],
        'T2': [
            ("central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "central"),
            ("central", "town_hall", "wynyard", "circular_quay", "st_james", "museum", "central"),
            ("central", "redfern", "macdonaldtown", "newtown", "stanmore", "petersham", "lewisham", "summer_hill", "ashfield", "croydon", "burwood", "strathfield", "homebush", "flemington", "lidcombe", "auburn", "clyde", "granville", "merrylands", "guildford", "yennora", "fairfield", "canley_vale", "cabramatta", "warwick_farm", "liverpool", "casula", "glenfield", "edmondson_park", "leppington"),
            ("leppington", "edmondson_park", "glenfield", "casula", "liverpool", "warwick_farm", "cabramatta", "canley_vale", "fairfield", "yennora", "guildford", "merrylands", "granville", "clyde", "auburn", "lidcombe", "flemington", "homebush", "strathfield", "burwood", "croydon", "ashfield", "summer_hill", "lewisham", "petersham", "stanmore", "newtown", "macdonaldtown", "redfern", "central"),
            ("central", "redfern", "macdonaldtown", "newtown", "stanmore", "petersham", "lewisham", "summer_hill", "ashfield", "croydon", "burwood", "strathfield", "homebush", "flemington", "lidcombe", "auburn", "clyde", "granville", "harris_park", "parramatta"),
            ("parramatta", "harris_park", "granville", "clyde", "auburn", "lidcombe", "flemington", "homebush", "strathfield", "burwood", "croydon", "ashfield", "summer_hill", "lewisham", "petersham", "stanmore", "newtown", "macdonaldtown", "redfern", "central")
        ],
        'T3': [
            ("liverpool", "warwick_farm", "cabramatta", "carramar", "villawood", "leightonfield", "chester_hill", "sefton", "regents_park", "berala", "lidcombe", "flemington", "homebush", "strathfield", "burwood", "croydon", "ashfield", "summer_hill", "lewisham", "petersham", "stanmore", "newtown", "macdonaldtown", "redfern", "central"),
            ("central", "redfern", "macdonaldtown", "newtown", "stanmore", "petersham", "lewisham", "summer_hill", "ashfield", "croydon", "burwood", "strathfield", "homebush", "flemington", "lidcombe", "berala", "regents_park", "sefton", "chester_hill", "leightonfield", "villawood", "carramar", "cabramatta", "warwick_farm", "liverpool"),
            ("central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "central"),
            ("central", "town_hall", "wynyard", "circular_quay", "st_james", "museum", "central"),
            ("cabramatta", "carramar", "villawood", "leightonfield", "chester_hill", "sefton", "birrong", "yagoona", "bankstown"),
            ("bankstown", "yagoona", "birrong", "sefton", "chester_hill", "leightonfield", "villawood", "carramar", "cabramatta")
        ],
        'T4': [
            ("cronulla", "woolooware", "caringbah", "miranda", "gymea", "kirrawee", "sutherland", "jannali", "como", "oatley", "mortdale", "penshurst", "hurstville", "allawah", "carlton", "kogarah", "rockdale", "banksia", "arncliffe", "wolli_creek", "tempe", "sydenham", "st_peters", "erskineville", "redfern", "central", "town_hall", "martin_place", "kings_cross", "edgecliff", "bondi_junction"),
            ("bondi_junction", "edgecliff", "kings_cross", "martin_place", "town_hall", "central", "redfern", "erskineville", "st_peters", "sydenham", "tempe", "wolli_creek", "arncliffe", "banksia", "rockdale", "kogarah", "carlton", "allawah", "hurstville", "penshurst", "mortdale", "oatley", "como", "jannali", "sutherland", "kirrawee", "gymea", "miranda", "caringbah", "woolooware", "cronulla"),
            ("helensburgh", "waterfall", "heathcote", "engadine", "loftus", "sutherland", "jannali", "como", "oatley", "mortdale", "penshurst", "hurstville", "allawah", "carlton", "kogarah", "rockdale", "banksia", "arncliffe", "wolli_creek", "tempe", "sydenham", "st_peters", "erskineville", "redfern", "central", "town_hall", "martin_place", "kings_cross", "edgecliff", "bondi_junction"),
            ("bondi_junction", "edgecliff", "kings_cross", "martin_place", "town_hall", "central", "redfern", "erskineville", "st_peters", "sydenham", "tempe", "wolli_creek", "arncliffe", "banksia", "rockdale", "kogarah", "carlton", "allawah", "hurstville", "penshurst", "mortdale", "oatley", "como", "jannali", "sutherland", "loftus", "engadine", "heathcote", "waterfall", "helensburgh")
        ],
        'T5': [
            ("richmond", "east_richmond", "clarendon", "windsor", "mulgrave", "vineyard", "riverstone", "schofields", "quakers_hill", "marayong", "blacktown", "seven_hills", "toongabbie", "pendle_hill", "wentworthville", "westmead", "parramatta", "harris_park", "merrylands", "guildford", "yennora", "fairfield", "canley_vale", "cabramatta", "warwick_farm", "liverpool", "casula", "glenfield", "edmondson_park", "leppington"),
            ("leppington", "edmondson_park", "glenfield", "casula", "liverpool", "warwick_farm", "cabramatta", "canley_vale", "fairfield", "yennora", "guildford", "merrylands", "harris_park", "parramatta", "westmead", "wentworthville", "pendle_hill", "toongabbie", "seven_hills", "blacktown", "marayong", "quakers_hill", "schofields", "riverstone", "vineyard", "mulgrave", "windsor", "clarendon", "east_richmond", "richmond"),
            ("penrith", "kingswood", "werrington", "st_marys", "mount_druitt", "rooty_hill", "doonside", "blacktown", "seven_hills", "toongabbie", "pendle_hill", "wentworthville", "westmead", "parramatta", "harris_park", "merrylands", "guildford", "yennora", "fairfield", "canley_vale", "cabramatta", "warwick_farm", "liverpool"),
            ("liverpool", "warwick_farm", "cabramatta", "canley_vale", "fairfield", "yennora", "guildford", "merrylands", "harris_park", "parramatta", "westmead", "wentworthville", "pendle_hill", "toongabbie", "seven_hills", "blacktown", "doonside", "rooty_hill", "mount_druitt", "st_marys", "werrington", "kingswood", "penrith")
        ],
        'T6': [
            ("lidcombe", "berala", "regents_park", "birrong", "yagoona", "bankstown"),
            ("bankstown", "yagoona", "birrong", "regents_park", "berala", "lidcombe")
        ],
        'T7': [
            ("lidcombe", "olympic_park"),
            ("olympic_park", "lidcombe")
        ],
        'T8': [
            ("macarthur", "campbelltown", "leumeah", "minto", "ingleburn", "macquarie_fields", "glenfield", "holsworthy", "east_hills", "panania", "revesby", "padstow", "riverwood", "narwee", "beverly_hills", "kingsgrove", "bexley_north", "bardwell_park", "turrella", "wolli_creek", "international_airport", "domestic_airport", "mascot", "green_square", "central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "central"),
            ("central", "town_hall", "wynyard", "circular_quay", "st_james", "museum", "central", "green_square", "mascot", "domestic_airport", "international_airport", "wolli_creek", "turrella", "bardwell_park", "bexley_north", "kingsgrove", "beverly_hills", "narwee", "riverwood", "padstow", "revesby", "panania", "east_hills", "holsworthy", "glenfield", "macquarie_fields", "ingleburn", "minto", "leumeah", "campbelltown", "macarthur"),
            ("leppington", "edmondson_park", "glenfield", "holsworthy", "east_hills", "panania", "revesby", "padstow", "riverwood", "narwee", "beverly_hills", "kingsgrove", "bexley_north", "bardwell_park", "turrella", "wolli_creek", "international_airport", "domestic_airport", "mascot", "green_square", "central", "museum", "st_james", "circular_quay", "wynyard", "town_hall", "central"),
            ("central", "town_hall", "wynyard", "circular_quay", "st_james", "museum", "central", "green_square", "mascot", "domestic_airport", "international_airport", "wolli_creek", "turrella", "bardwell_park", "bexley_north", "kingsgrove", "beverly_hills", "narwee", "riverwood", "padstow", "revesby", "panania", "east_hills", "holsworthy", "glenfield", "edmondson_park", "leppington"),
            ("macarthur", "campbelltown", "leumeah", "minto", "ingleburn", "macquarie_fields", "glenfield", "holsworthy", "east_hills", "panania", "revesby", "padstow", "riverwood", "narwee", "beverly_hills", "kingsgrove", "bexley_north", "bardwell_park", "turrella", "wolli_creek", "sydenham", "st_peters", "erskineville", "redfern", "central"),
            ("central", "redfern", "erskineville", "st_peters", "sydenham", "wolli_creek", "turrella", "bardwell_park", "bexley_north", "kingsgrove", "beverly_hills", "narwee", "riverwood", "padstow", "revesby", "panania", "east_hills", "holsworthy", "glenfield", "macquarie_fields", "ingleburn", "minto", "leumeah", "campbelltown", "macarthur")
        ],
        'T9': [
            ("hornsby", "normanhurst", "thornleigh", "pennant_hills", "beecroft", "cheltenham", "epping", "eastwood", "denistone", "west_ryde", "meadowbank", "rhodes", "concord_west", "north_strathfield", "strathfield", "burwood", "croydon", "ashfield", "redfern", "central"),
            ("central", "redfern", "ashfield", "croydon", "burwood", "strathfield", "north_strathfield", "concord_west", "rhodes", "meadowbank", "west_ryde", "denistone", "eastwood", "epping", "cheltenham", "beecroft", "pennant_hills", "thornleigh", "normanhurst", "hornsby"),
            ("gordon", "killara", "lindfield", "roseville", "chatswood", "artarmon", "st_leonards", "wollstonecraft", "waverton", "north_sydney", "milsons_point", "wynyard", "town_hall", "central"),
            ("central", "town_hall", "wynyard", "milsons_point", "north_sydney", "waverton", "wollstonecraft", "st_leonards", "artarmon", "chatswood", "roseville", "lindfield", "killara", "gordon")
        ],
        'M1': [
            ("tallawong", "rouse_hill", "kellyville", "bella_vista", "norwest", "hills_showground", "castle_hill", "cherrybrook", "epping", "macquarie_university", "macquarie_park", "north_ryde", "chatswood", "crows_nest", "victoria_cross", "barangaroo", "martin_place", "gadigal", "central", "waterloo", "sydenham"),
            ("sydenham", "waterloo", "central", "gadigal", "martin_place", "barangaroo", "victoria_cross", "crows_nest", "chatswood", "north_ryde", "macquarie_park", "macquarie_university", "epping", "cherrybrook", "castle_hill", "hills_showground", "norwest", "bella_vista", "kellyville", "rouse_hill", "tallawong")
        ]
    }
        
    # Select the representative shape IDs for the kept segments using endpoint matching
    print("Selecting representative shapes...")
    selected_shapes = set()
    shape_to_route_info = {} # shape_id -> {short_name, color}
    
    # Restructure route_seq_to_shapes to index by rshort and seq for easier lookup
    nested_route_seq_to_shapes = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
    for (rshort, seq), shape_counts in route_seq_to_shapes.items():
        nested_route_seq_to_shapes[rshort][seq] = shape_counts
        
    for rshort, segments in kept_route_segments.items():
        # Get the color of this route (use the first route_id color we find)
        color = next(r['color'] for r in routes.values() if r['short_name'] == rshort)
        
        for segment in segments:
            start_station = segment[0]
            end_station = segment[-1]
            
            best_shape = None
            best_overlap = 0
            best_shape_count = 0
            
            # Find shape covering both endpoints of the segment with max overlap
            for gtfs_seq, shape_counts in nested_route_seq_to_shapes[rshort].items():
                gtfs_set = set(gtfs_seq)
                if start_station in gtfs_set and end_station in gtfs_set:
                    overlap = len(set(segment).intersection(gtfs_set))
                    if overlap > best_overlap:
                        best_overlap = overlap
                        best_s = max(shape_counts, key=shape_counts.get)
                        best_shape = best_s
                        best_shape_count = shape_counts[best_s]
                    elif overlap == best_overlap and best_overlap > 0:
                        best_s = max(shape_counts, key=shape_counts.get)
                        if shape_counts[best_s] > best_shape_count:
                            best_shape = best_s
                            best_shape_count = shape_counts[best_s]
                            
            # Fallback to maximum overlap if no shape covers both endpoints
            if not best_shape:
                for gtfs_seq, shape_counts in nested_route_seq_to_shapes[rshort].items():
                    overlap = len(set(segment).intersection(set(gtfs_seq)))
                    if overlap > best_overlap:
                        best_overlap = overlap
                        best_s = max(shape_counts, key=shape_counts.get)
                        best_shape = best_s
                        best_shape_count = shape_counts[best_s]
                        
            if best_shape:
                selected_shapes.add(best_shape)
                shape_to_route_info[best_shape] = {
                    'short_name': rshort,
                    'color': color
                }
                
    print(f"Selected {len(selected_shapes)} shapes.")
    
    # 6. Stream and extract coordinates for selected shapes
    print("Extracting coordinates from shapes.txt...")
    shape_points = defaultdict(list)
    with open(os.path.join(gtfs_dir, 'shapes.txt'), encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            sh_id = row['shape_id']
            if sh_id in selected_shapes:
                seq = int(row['shape_pt_sequence'])
                lat = float(row['shape_pt_lat'])
                lon = float(row['shape_pt_lon'])
                # Store coordinates directly as [longitude, latitude] degrees
                shape_points[sh_id].append((seq, [lon, lat]))
                
    # Format shapes for sydneytrainsdata.json
    print("Formatting route shapes...")
    sydneytrainsdata_json = []
    for sh_id, pts in shape_points.items():
        pts.sort()
        coords = [xy for _, xy in pts]
        info = shape_to_route_info[sh_id]
        
        sydneytrainsdata_json.append({
            "route_short_name": info['short_name'],
            "route_color": info['color'],
            "shape_id": sh_id,
            "json_geometry": {
                "type": "LineString",
                "coordinates": coords
            }
        })
        
    # Write sydneytrainsdata.json
    with open('public/sydneytrainsdata.json', 'w') as f:
        json.dump(sydneytrainsdata_json, f, indent=2)
    print(f"Successfully wrote {len(sydneytrainsdata_json)} shapes to public/sydneytrainsdata.json")
    
    # 7. Collect all visited stations
    print("Collecting visited stations...")
    visited_station_ids = set()
    station_lines = defaultdict(set)
    
    for rshort, segments in kept_route_segments.items():
        for segment in segments:
            for slug in segment:
                visited_station_ids.add(slug)
                station_lines[slug].add(rshort)
                
    # Find matching parent stop info
    slug_to_stop_info = {}
    for sid, stop in stops.items():
        # parent stops only
        if stop['parent_station'] is None:
            slug = get_station_slug(stop['name'])
            if slug in visited_station_ids:
                existing = slug_to_stop_info.get(slug)
                if not existing:
                    slug_to_stop_info[slug] = stop
                else:
                    def score_id(stop_id):
                        if stop_id.startswith('place-'):
                            return 3 # Metro
                        if stop_id.isdigit():
                            return 2 # Sydney Trains
                        if stop_id.startswith('G'):
                            return 0 # Bus
                        return 1 # Other
                    
                    if score_id(stop['id']) > score_id(existing['id']):
                        slug_to_stop_info[slug] = stop
                
    # Format stations.json
    stations_json = []
    for slug in sorted(list(visited_station_ids)):
        stop = slug_to_stop_info.get(slug)
        if not stop:
            # Create dummy stop if not found (should not happen)
            print(f"Warning: could not find GTFS stop for station slug: {slug}")
            continue
            
        clean_name = clean_station_name(stop['name'])
        stations_json.append({
            "id": slug,
            "name": clean_name,
            "lines": sorted(list(station_lines[slug])),
            "lat": stop['lat'],
            "lng": stop['lon']
        })
        
    # Write stations.json
    with open('public/stations.json', 'w') as f:
        json.dump(stations_json, f, indent=2)
    print(f"Successfully wrote {len(stations_json)} stations to public/stations.json")
    
    # 8. Format lines.json
    print("Formatting lines.json...")
    lines_json = {}
    for rshort, segments in kept_route_segments.items():
        line_stops = []
        # Union of all stations on this line to maintain a flat list (similar to original lines.json)
        # Order them based on the longest segment first
        longest_segment = max(segments, key=len)
        seen = set()
        for slug in longest_segment:
            seen.add(slug)
            stop = slug_to_stop_info.get(slug)
            if stop:
                line_stops.append({
                    "id": slug,
                    "name": clean_station_name(stop['name']),
                    "connections": sorted(list(station_lines[slug]))
                })
        # Add remaining stations that might be on branches
        for segment in segments:
            for slug in segment:
                if slug not in seen:
                    seen.add(slug)
                    stop = slug_to_stop_info.get(slug)
                    if stop:
                        line_stops.append({
                            "id": slug,
                            "name": clean_station_name(stop['name']),
                            "connections": sorted(list(station_lines[slug]))
                        })
        lines_json[rshort] = line_stops
        
    with open('public/lines.json', 'w') as f:
        json.dump(lines_json, f, indent=2)
    print(f"Successfully wrote lines.json")
    
    # 9. Reconstruct networkData.ts
    print("Generating src/lib/networkData.ts...")
    ts_content = []
    ts_content.append("/**")
    ts_content.append(" * Sydney Rail Network Data (Auto-Generated from GTFS)")
    ts_content.append(" */")
    ts_content.append("")
    ts_content.append("import type { TrainLine, Station, Edge, LineId } from '@/types';")
    ts_content.append("import stationsData from '../../public/stations.json';")
    ts_content.append("")
    ts_content.append("export const LINES: TrainLine[] = [")
    
    # Add target lines
    line_order = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'M1']
    line_details = {
        'T1': ('T1 North Shore & Western', '#F99D1C', '#000'),
        'T2': ('T2 Inner West & Leppington', '#0098CD', '#fff'),
        'T3': ('T3 Liverpool & Inner West', '#F37021', '#fff'),
        'T4': ('T4 Eastern Suburbs & Illawarra', '#005AA3', '#fff'),
        'T5': ('T5 Cumberland Line', '#C4258F', '#fff'),
        'T6': ('T6 Lidcombe & Bankstown', '#7C3E21', '#fff'),
        'T7': ('T7 Olympic Park Line', '#6F818E', '#fff'),
        'T8': ('T8 Airport & South Line', '#00954C', '#fff'),
        'T9': ('T9 Northern Line', '#D11F2F', '#fff'),
        'M1': ('Metro City & Southwest', '#168388', '#fff'),
    }
    
    for lid in line_order:
        name, color, txt = line_details[lid]
        ts_content.append(f"  {{ id: '{lid}', name: '{name}', color: '{color}', textColor: '{txt}' }},")
    ts_content.append("];")
    ts_content.append("")
    ts_content.append("export const LINE_MAP: Record<LineId, TrainLine> = Object.fromEntries(")
    ts_content.append("  LINES.map(l => [l.id, l])")
    ts_content.append(") as Record<LineId, TrainLine>;")
    ts_content.append("")
    ts_content.append("export const STATIONS: Station[] = (stationsData as unknown as Array<{")
    ts_content.append("  id: string;")
    ts_content.append("  name: string;")
    ts_content.append("  lines: string[];")
    ts_content.append("  lat: number;")
    ts_content.append("  lng: number;")
    ts_content.append("}>).map(s => ({")
    ts_content.append("  id: s.id,")
    ts_content.append("  name: s.name,")
    ts_content.append("  lines: s.lines as LineId[],")
    ts_content.append("  lat: s.lat,")
    ts_content.append("  lng: s.lng")
    ts_content.append("}));")
    ts_content.append("")
    ts_content.append("export const STATIONS_DEDUPED = STATIONS;")
    ts_content.append("")
    ts_content.append("const lineSegments: Record<LineId, string[][]> = {")
    
    for lid in line_order:
        segments = kept_route_segments.get(lid, [])
        ts_content.append(f"  {lid}: [")
        for seg in segments:
            seg_strs = ", ".join(f'"{slug}"' for slug in seg)
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
    
    with open('src/lib/networkData.ts', 'w') as f:
        f.write("\n".join(ts_content))
    print("Successfully wrote src/lib/networkData.ts")

if __name__ == '__main__':
    extract_data()
