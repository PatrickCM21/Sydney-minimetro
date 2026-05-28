import os
import csv
from collections import defaultdict
import json

def read_gtfs_stops(directory):
    stops = {}
    path = os.path.join(directory, 'stops.txt')
    if not os.path.exists(path):
        return stops
    with open(path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            stop_id = row['stop_id']
            is_parent = row.get('location_type') == '1'
            stops[stop_id] = {
                'id': stop_id,
                'name': row['stop_name'],
                'lat': float(row['stop_lat']) if row.get('stop_lat') else None,
                'lon': float(row['stop_lon']) if row.get('stop_lon') else None,
                'parent': row.get('parent_station'),
                'is_parent': is_parent
            }
    return stops

def load_route_stops(directory, stops):
    routes_path = os.path.join(directory, 'routes.txt')
    trips_path = os.path.join(directory, 'trips.txt')
    stop_times_path = os.path.join(directory, 'stop_times.txt')
    
    if not (os.path.exists(routes_path) and os.path.exists(trips_path) and os.path.exists(stop_times_path)):
        return {}
        
    routes = {}
    with open(routes_path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            routes[row['route_id']] = row['route_short_name']
            
    trips = {}
    with open(trips_path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            trips[row['trip_id']] = row['route_id']
            
    route_to_stops = defaultdict(set)
    with open(stop_times_path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            trip_id = row['trip_id']
            stop_id = row['stop_id']
            route_id = trips.get(trip_id)
            if route_id:
                route_short_name = routes.get(route_id)
                if route_short_name:
                    # Resolve to parent station if it has one
                    stop_info = stops.get(stop_id)
                    if stop_info:
                        parent_id = stop_info['parent']
                        if parent_id and parent_id in stops:
                            route_to_stops[route_short_name].add(parent_id)
                        else:
                            route_to_stops[route_short_name].add(stop_id)
                            
    return {k: list(v) for k, v in route_to_stops.items()}

def run_analysis():
    trains_dir = '/Users/patrickcrown-milliss/Coding-Stuff/sydney_minimetro/public/sydneytrains_gtfs'
    metro_dir = '/Users/patrickcrown-milliss/Coding-Stuff/sydney_minimetro/public/sydneymetro_gtfs'
    
    train_stops = read_gtfs_stops(trains_dir)
    metro_stops = read_gtfs_stops(metro_dir)
    
    # Merge stops
    all_stops = {}
    for k, v in train_stops.items():
        all_stops[k] = v
    for k, v in metro_stops.items():
        if k not in all_stops:
            all_stops[k] = v
            
    train_route_stops = load_route_stops(trains_dir, all_stops)
    metro_route_stops = load_route_stops(metro_dir, all_stops)
    
    print("Train routes found in GTFS:")
    for r, stps in sorted(train_route_stops.items()):
        print(f"  {r}: {len(stps)} stops")
        
    print("\nMetro routes found in GTFS:")
    for r, stps in sorted(metro_route_stops.items()):
        print(f"  {r}: {len(stps)} stops")

if __name__ == '__main__':
    run_analysis()
