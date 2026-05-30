import csv
import os
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
                'long_name': row['route_long_name']
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

print("\n=== T1 sequences in GTFS ===")
t1_trips = {tid: info for tid, info in trips.items() if info['route_short_name'] == 'T1'}
print(f"Total T1 trips: {len(t1_trips)}")

unique_t1_sequences = set()
t1_sequence_to_shapes = defaultdict(set)

for tid, info in t1_trips.items():
    stps = trip_stops[tid]
    if not stps:
        continue
    stps.sort()
    slugs = [get_station_slug(stops[sid]['name']) for _, sid in stps if sid in stops]
    seq_tuple = tuple(slugs)
    unique_t1_sequences.add(seq_tuple)
    
    if info['shape_id']:
        t1_sequence_to_shapes[seq_tuple].add(info['shape_id'])

print(f"Found {len(unique_t1_sequences)} unique T1 stop sequences in GTFS trips.")

# Sort sequences by length descending and print them
sorted_seqs = sorted(list(unique_t1_sequences), key=len, reverse=True)
for idx, seq in enumerate(sorted_seqs[:20]):
    print(f"\nSequence {idx} (length {len(seq)}):")
    print(f"  Path: {' -> '.join(seq)}")
    print(f"  Shapes: {list(t1_sequence_to_shapes[seq])}")
