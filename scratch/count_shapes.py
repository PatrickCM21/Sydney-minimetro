import csv
import os
from collections import defaultdict

gtfs_dir = 'public/full_sydney_gtfs'

print("Loading routes...")
routes = {}
with open(os.path.join(gtfs_dir, 'routes.txt'), encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row.get('agency_id') in {'x0001', 'SMNW'}:
            routes[row['route_id']] = row['route_short_name']

print("Loading trips to find all unique shape IDs per route...")
route_shapes = defaultdict(set)
with open(os.path.join(gtfs_dir, 'trips.txt'), encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        route_id = row['route_id']
        shape_id = row.get('shape_id')
        if route_id in routes and shape_id:
            rshort = routes[route_id]
            route_shapes[rshort].add(shape_id)

for rshort, shapes in sorted(route_shapes.items()):
    print(f"Route {rshort}: {len(shapes)} unique shape IDs")
