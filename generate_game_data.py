import os
import csv
import json

# Define the stop lists for M1 and T1-T9 based on the map
# (Using geographical order: branches first, then main routes)
lines_config = {
    "M1": [
        "Tallawong", "Rouse Hill", "Kellyville", "Bella Vista", "Norwest", 
        "Hills Showground", "Castle Hill", "Cherrybrook", "Epping", 
        "Macquarie University", "Macquarie Park", "North Ryde", "Chatswood", 
        "Crows Nest", "Victoria Cross", "Barangaroo", "Martin Place", 
        "Gadigal", "Central", "Waterloo", "Sydenham"
    ],
    "T1": [
        # Richmond Branch
        "Richmond", "East Richmond", "Clarendon", "Windsor", "Mulgrave", 
        "Vineyard", "Riverstone", "Schofields", "Quakers Hill", "Marayong",
        # Emu Plains Branch
        "Emu Plains", "Penrith", "Kingswood", "Werrington", "St Marys", 
        "Mount Druitt", "Rooty Hill", "Doonside", 
        # Main Line Western & Shore:
        "Blacktown", "Seven Hills", "Toongabbie", "Pendle Hill", "Wentworthville", 
        "Westmead", "Parramatta", "Harris Park", "Granville", "Clyde", 
        "Auburn", "Lidcombe", "Strathfield", "Burwood", "Redfern", "Central", 
        "Town Hall", "Wynyard", "Milsons Point", "North Sydney", "Waverton", 
        "Wollstonecraft", "St Leonards", "Artarmon", "Chatswood", "Roseville", 
        "Lindfield", "Killara", "Gordon", "Pymble", "Turramurra", "Warrawee", 
        "Wahroonga", "Waitara", "Hornsby", "Asquith", "Mount Colah", 
        "Mount Kuring-gai", "Berowra"
    ],
    "T2": [
        # Leppington Branch
        "Leppington", "Edmondson Park", "Glenfield", "Casula", "Liverpool", 
        "Warwick Farm", "Cabramatta", "Canley Vale", "Fairfield", "Yennora", 
        "Guildford", "Merrylands", "Granville", "Harris Park", "Parramatta", 
        "Clyde", "Auburn", "Lidcombe", "Flemington", "Homebush", "Strathfield", 
        "Burwood", "Croydon", "Ashfield", "Summer Hill", "Lewisham", "Petersham", 
        "Stanmore", "Newtown", "Macdonaldtown", "Redfern", "Central", 
        # City Circle
        "Town Hall", "Wynyard", "Circular Quay", "St James", "Museum"
    ],
    "T3": [
        "Liverpool", "Cabramatta", "Carramar", "Villawood", "Leightonfield", 
        "Chester Hill", "Sefton", "Birrong", "Regents Park", "Berala", 
        "Lidcombe", "Flemington", "Homebush", "Strathfield", "Burwood", 
        "Croydon", "Ashfield", "Summer Hill", "Lewisham", "Petersham", 
        "Stanmore", "Newtown", "Macdonaldtown", "Redfern", "Central", 
        # City Circle
        "Town Hall", "Wynyard", "Circular Quay", "St James", "Museum"
    ],
    "T4": [
        "Bondi Junction", "Edgecliff", "Kings Cross", "Martin Place", "Town Hall", 
        "Central", "Redfern", "Sydenham", "St Peters", "Tempe", "Wolli Creek", 
        "Arncliffe", "Banksia", "Rockdale", "Kogarah", "Carlton", "Allawah", 
        "Hurstville", "Penshurst", "Mortdale", "Oatley", "Como", "Jannali", 
        "Sutherland", 
        # Cronulla Branch
        "Kirrawee", "Gymea", "Miranda", "Caringbah", "Woolooware", "Cronulla",
        # Waterfall Branch
        "Loftus", "Engadine", "Heathcote", "Waterfall"
    ],
    "T5": [
        "Richmond", "East Richmond", "Clarendon", "Windsor", "Mulgrave", 
        "Vineyard", "Riverstone", "Schofields", "Quakers Hill", "Marayong", 
        "Blacktown", "Seven Hills", "Toongabbie", "Pendle Hill", "Wentworthville", 
        "Westmead", "Parramatta", "Harris Park", "Granville", "Merrylands", 
        "Guildford", "Yennora", "Fairfield", "Canley Vale", "Cabramatta", 
        "Warwick Farm", "Liverpool", "Casula", "Glenfield", "Edmondson Park", 
        "Leppington"
    ],
    "T6": [
        "Lidcombe", "Berala", "Regents Park", "Birrong", "Yagoona", "Bankstown"
    ],
    "T7": [
        "Lidcombe", "Olympic Park", "Strathfield"
    ],
    "T8": [
        "Macarthur", "Campbelltown", "Leumeah", "Minto", "Ingleburn", 
        "Macquarie Fields", "Glenfield", "Holsworthy", "East Hills", "Panania", 
        "Revesby", "Padstow", "Riverwood", "Narwee", "Beverly Hills", "Kingsgrove", 
        "Bexley North", "Bardwell Park", "Turrella", "Wolli Creek", 
        # Airport split
        "International Airport", "Domestic Airport", "Mascot", "Green Square",
        # Sydenham split
        "Sydenham", 
        # Redfern/Central + City Circle
        "Redfern", "Central", "Town Hall", "Wynyard", "Circular Quay", "St James", "Museum"
    ],
    "T9": [
        "Hornsby", "Normanhurst", "Thornleigh", "Pennant Hills", "Beecroft", 
        "Cheltenham", "Epping", "Eastwood", "Denistone", "West Ryde", 
        "Meadowbank", "Rhodes", "Concord West", "North Strathfield", "Strathfield", 
        "Redfern", "Central", "Town Hall", "Wynyard", "Milsons Point", 
        "North Sydney", "Waverton", "Wollstonecraft", "St Leonards", "Artarmon", 
        "Chatswood", "Roseville", "Lindfield", "Killara", "Gordon"
    ]
}

# Fallback coordinates for 5 new Metro Southwest extension stations not in old GTFS stops.txt
fallback_coords = {
    "Crows Nest": (-33.825406, 151.198969),
    "Victoria Cross": (-33.837242, 151.207528),
    "Barangaroo": (-33.863730, 151.202980),
    "Gadigal": (-33.872838, 151.208760),
    "Waterloo": (-33.897569, 151.200119)
}

def read_gtfs_stops(directory):
    stops = []
    path = os.path.join(directory, 'stops.txt')
    if not os.path.exists(path):
        return stops
    with open(path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('location_type') == '1': # Parent station
                stops.append({
                    'id': row['stop_id'],
                    'name': row['stop_name'],
                    'lat': float(row['stop_lat']) if row.get('stop_lat') else None,
                    'lon': float(row['stop_lon']) if row.get('stop_lon') else None
                })
    return stops

def run():
    trains_dir = '/Users/patrickcrown-milliss/Coding-Stuff/sydney_minimetro/public/sydneytrains_gtfs'
    metro_dir = '/Users/patrickcrown-milliss/Coding-Stuff/sydney_minimetro/public/sydneymetro_gtfs'
    
    train_stops = read_gtfs_stops(trains_dir)
    metro_stops = read_gtfs_stops(metro_dir)
    all_gtfs_stops = train_stops + metro_stops
    
    # 1. Collect all unique station names from lines_config
    all_station_names = sorted(list(set(
        station 
        for stops in lines_config.values() 
        for station in stops
    )))
    
    # 2. Map station names to coordinates
    station_coords = {}
    unmatched = []
    
    for sname in all_station_names:
        if sname in fallback_coords:
            station_coords[sname] = fallback_coords[sname]
            continue
            
        target1 = sname.lower() + " station"
        target2 = sname.lower()
        
        found = None
        for stop in all_gtfs_stops:
            s_stop_name = stop['name'].lower()
            if s_stop_name == target1 or s_stop_name == target2:
                found = stop
                break
                
        if not found:
            # Try containing match
            for stop in all_gtfs_stops:
                s_stop_name = stop['name'].lower()
                if sname.lower() in s_stop_name:
                    found = stop
                    break
                    
        if found:
            station_coords[sname] = (found['lat'], found['lon'])
        else:
            unmatched.append(sname)
            
    if unmatched:
        print(f"Warning: {len(unmatched)} stations could not be matched:")
        for u in unmatched:
            print(f"  {u}")
        return
        
    print("All stations matched successfully!")
    
    # 3. For each station, find all lines it is connected to
    station_to_lines = {}
    for sname in all_station_names:
        connected_lines = []
        for line_id, stops in lines_config.items():
            if sname in stops:
                connected_lines.append(line_id)
        station_to_lines[sname] = sorted(connected_lines)
        
    # 4. Construct stations.json
    stations_json = []
    for sname in all_station_names:
        lat, lon = station_coords[sname]
        normalized_id = sname.lower().replace(" ", "_").replace("'", "")
        stations_json.append({
            "id": normalized_id,
            "name": sname,
            "lines": station_to_lines[sname],
            "lat": lat,
            "lng": lon,
            "coordinates": [lat, lon]
        })
        
    # Write stations.json
    stations_file = '/Users/patrickcrown-milliss/Coding-Stuff/sydney_minimetro/public/stations.json'
    with open(stations_file, 'w') as f:
        json.dump(stations_json, f, indent=2)
    print(f"Successfully wrote {len(stations_json)} stations to {stations_file}")
    
    # 5. Construct lines.json
    lines_json = {}
    for line_id, stops in lines_config.items():
        line_stops = []
        for sname in stops:
            normalized_id = sname.lower().replace(" ", "_").replace("'", "")
            line_stops.append({
                "id": normalized_id,
                "name": sname,
                "connections": station_to_lines[sname]
            })
        lines_json[line_id] = line_stops
        
    # Write lines.json
    lines_file = '/Users/patrickcrown-milliss/Coding-Stuff/sydney_minimetro/public/lines.json'
    with open(lines_file, 'w') as f:
        json.dump(lines_json, f, indent=2)
    print(f"Successfully wrote {len(lines_json)} lines to {lines_file}")

if __name__ == '__main__':
    run()
