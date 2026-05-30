import csv
import os
import math
from collections import defaultdict

gtfs_dir = 'public/full_sydney_gtfs'

def clean_station_name(name):
    suffixes = [" Station Platform", " Station", " Platform", " Light Rail", " Metro"]
    for suffix in suffixes:
        if suffix in name:
            name = name.split(suffix)[0]
    return name.strip()

def get_station_slug(name):
    clean_name = clean_station_name(name)
    slug = clean_name.lower().replace(" ", "_").replace("'", "").replace("-", "_").replace("&", "and")
    return slug

print("Loading routes...")
routes = {}
with open(os.path.join(gtfs_dir, 'routes.txt'), encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row.get('agency_id') in {'x0001', 'SMNW'}:
            routes[row['route_id']] = {
                'short_name': row['route_short_name'],
                'color': row.get('route_color', '888888')
            }

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

def resolve_stop(sid):
    stop = stops.get(sid)
    if stop and stop['parent_station']:
        return stop['parent_station']
    return sid

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

print("Loading stop times...")
trip_stops = defaultdict(list)
with open(os.path.join(gtfs_dir, 'stop_times.txt'), encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        tid = row['trip_id']
        if tid in trips:
            parent_sid = resolve_stop(row['stop_id'])
            seq = int(row['stop_sequence'])
            trip_stops[tid].append((seq, parent_sid))

# Group trips by route using nested dicts
route_seq_to_shapes = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
for tid, stps in trip_stops.items():
    route_short = trips[tid]['route_short_name']
    shape_id = trips[tid]['shape_id']
    if not shape_id:
        continue
    stps.sort()
    slugs = [get_station_slug(stops[sid]['name']) for _, sid in stps if sid in stops]
    seq_tuple = tuple(slugs)
    route_seq_to_shapes[route_short][seq_tuple][shape_id] += 1

kept_route_segments = {
    'T1': [
        ("berowra", "mount_kuring_gai", "mount_colah", "asquith", "hornsby", "waitara", "wahroonga", "warrawee", "turramurra", "pymble", "gordon", "killara", "lindfield", "roseville", "chatswood", "artarmon", "st_leonards", "wollstonecraft", "waverton", "north_sydney", "milsons_point", "wynyard", "town_hall", "central"),
        ("central", "town_hall", "wynyard", "milsons_point", "north_sydney", "waverton", "wollstonecraft", "st_leonards", "artarmon", "chatswood", "roseville", "lindfield", "killara", "gordon", "pymble", "turramurra", "warrawee", "wahroonga", "waitara", "hornsby", "asquith", "mount_colah", "mount_kuring_gai", "berowra"),
        ("central", "redfern", "strathfield", "burwood", "croydon", "ashfield", "homebush", "flemington", "lidcombe", "auburn", "clyde", "granville", "harris_park", "parramatta", "westmead", "wentworthville", "pendle_hill", "toongabbie", "seven_hills", "blacktown", "marayong", "quakers_hill", "schofields", "riverstone", "vineyard", "mulgrave", "windsor", "clarendon", "east_richmond", "richmond"),
        ("richmond", "east_richmond", "clarendon", "windsor", "mulgrave", "vineyard", "riverstone", "schofields", "quakers_hill", "marayong", "blacktown", "seven_hills", "toongabbie", "pendle_hill", "wentworthville", "westmead", "parramatta", "harris_park", "granville", "clyde", "auburn", "lidcombe", "flemington", "homebush", "ashfield", "croydon", "burwood", "strathfield", "redfern", "central"),
        ("central", "redfern", "strathfield", "burwood", "croydon", "ashfield", "homebush", "flemington", "lidcombe", "auburn", "clyde", "granville", "harris_park", "parramatta", "westmead", "wentworthville", "pendle_hill", "toongabbie", "seven_hills", "blacktown", "doonside", "rooty_hill", "mount_druitt", "st_marys", "werrington", "kingswood", "penrith", "emu_plains"),
        ("emu_plains", "penrith", "kingswood", "werrington", "st_marys", "mount_druitt", "rooty_hill", "doonside", "blacktown", "seven_hills", "toongabbie", "pendle_hill", "wentworthville", "westmead", "parramatta", "harris_park", "granville", "clyde", "auburn", "lidcombe", "flemington", "homebush", "ashfield", "croydon", "burwood", "strathfield", "redfern", "central")
    ]
}

print("\nMatching segments to shapes requiring endpoint coverage...")
for rshort, segments in kept_route_segments.items():
    print(f"\nRoute {rshort}:")
    for s_idx, segment in enumerate(segments):
        start_station = segment[0]
        end_station = segment[-1]
        
        best_shape = None
        best_overlap = 0
        best_seq = None
        best_shape_count = 0
        
        # Search all GTFS trip sequences for this route
        for gtfs_seq, shape_counts in route_seq_to_shapes[rshort].items():
            gtfs_set = set(gtfs_seq)
            
            # REQUIRE that the shape covers both the start and end stations
            if start_station in gtfs_set and end_station in gtfs_set:
                seg_set = set(segment)
                overlap = len(seg_set.intersection(gtfs_set))
                
                if overlap > best_overlap:
                    best_overlap = overlap
                    best_s = max(shape_counts, key=shape_counts.get)
                    best_shape = best_s
                    best_seq = gtfs_seq
                    best_shape_count = shape_counts[best_s]
                elif overlap == best_overlap and best_overlap > 0:
                    best_s = max(shape_counts, key=shape_counts.get)
                    if shape_counts[best_s] > best_shape_count:
                        best_shape = best_s
                        best_seq = gtfs_seq
                        best_shape_count = shape_counts[best_s]
                        
        print(f"  Segment {s_idx} ({start_station} -> ... -> {end_station}):")
        if best_shape:
            print(f"    Matched Shape: {best_shape}")
            print(f"    Overlap: {best_overlap} stations")
            print(f"    GTFS path (len {len(best_seq)}): {best_seq[0]} -> ... -> {best_seq[-1]}")
        else:
            # Fallback if no shape covers both endpoints: match by maximum overlap
            print("    ⚠️ NO EXACT ENDPOINT MATCH! Falling back to maximum overlap...")
            for gtfs_seq, shape_counts in route_seq_to_shapes[rshort].items():
                gtfs_set = set(gtfs_seq)
                seg_set = set(segment)
                overlap = len(seg_set.intersection(gtfs_set))
                if overlap > best_overlap:
                    best_overlap = overlap
                    best_s = max(shape_counts, key=shape_counts.get)
                    best_shape = best_s
                    best_seq = gtfs_seq
                    best_shape_count = shape_counts[best_s]
            if best_shape:
                print(f"    Matched Shape (Fallback): {best_shape}")
                print(f"    Overlap: {best_overlap} stations")
                print(f"    GTFS path (len {len(best_seq)}): {best_seq[0]} -> ... -> {best_seq[-1]}")
            else:
                print("    ❌ NO MATCH FOUND AT ALL!")
