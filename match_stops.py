import os
import csv
import json

stations_to_check = [
    "Tallawong", "Rouse Hill", "Kellyville", "Bella Vista", "Norwest", "Hills Showground", 
    "Castle Hill", "Cherrybrook", "Epping", "Macquarie University", "Macquarie Park", 
    "North Ryde", "Chatswood", "Crows Nest", "Victoria Cross", "Barangaroo", "Martin Place", 
    "Gadigal", "Central", "Waterloo", "Sydenham", "Richmond", "East Richmond", "Clarendon", 
    "Windsor", "Mulgrave", "Vineyard", "Riverstone", "Schofields", "Quakers Hill", "Marayong", 
    "Blacktown", "Emu Plains", "Penrith", "Kingswood", "Werrington", "St Marys", "Mount Druitt", 
    "Rooty Hill", "Doonside", "Seven Hills", "Toongabbie", "Pendle Hill", "Wentworthville", 
    "Westmead", "Parramatta", "Harris Park", "Granville", "Clyde", "Auburn", "Lidcombe", 
    "Strathfield", "Burwood", "Redfern", "Town Hall", "Wynyard", "Milsons Point", "North Sydney", 
    "Waverton", "Wollstonecraft", "St Leonards", "Artarmon", "Roseville", "Lindfield", 
    "Killara", "Gordon", "Pymble", "Turramurra", "Warrawee", "Wahroonga", "Waitara", "Hornsby", 
    "Asquith", "Mount Colah", "Mount Kuring-gai", "Berowra", "Leppington", "Edmondson Park", 
    "Glenfield", "Casula", "Liverpool", "Warwick Farm", "Cabramatta", "Canley Vale", "Fairfield", 
    "Yennora", "Guildford", "Merrylands", "Flemington", "Homebush", "Croydon", "Ashfield", 
    "Summer Hill", "Lewisham", "Petersham", "Stanmore", "Newtown", "Macdonaldtown", "Circular Quay", 
    "St James", "Museum", "Carramar", "Villawood", "Leightonfield", "Chester Hill", "Sefton", 
    "Birrong", "Regents Park", "Berala", "Bondi Junction", "Edgecliff", "Kings Cross", "St Peters", 
    "Tempe", "Wolli Creek", "Arncliffe", "Banksia", "Rockdale", "Kogarah", "Carlton", "Allawah", 
    "Hurstville", "Penshurst", "Mortdale", "Oatley", "Como", "Jannali", "Sutherland", "Kirrawee", 
    "Gymea", "Miranda", "Caringbah", "Woolooware", "Cronulla", "Loftus", "Engadine", "Heathcote", 
    "Waterfall", "Yagoona", "Bankstown", "Olympic Park", "Leumeah", "Minto", "Ingleburn", 
    "Macquarie Fields", "Holsworthy", "East Hills", "Panania", "Revesby", "Padstow", "Riverwood", 
    "Narwee", "Beverly Hills", "Kingsgrove", "Bexley North", "Bardwell Park", "Turrella", 
    "International Airport", "Domestic Airport", "Mascot", "Green Square", "Normanhurst", 
    "Thornleigh", "Pennant Hills", "Beecroft", "Cheltenham", "West Ryde", "Meadowbank", 
    "Rhodes", "Concord West", "North Strathfield"
]

def read_gtfs_stops(directory):
    stops = []
    path = os.path.join(directory, 'stops.txt')
    if not os.path.exists(path):
        return stops
    with open(path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('location_type') == '1': # parent station
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
    
    all_stops = train_stops + metro_stops
    
    # We want to match each name in stations_to_check
    matched = {}
    unmatched = []
    
    for sname in stations_to_check:
        # Try direct match with " Station"
        target1 = sname.lower() + " station"
        target2 = sname.lower()
        
        found = None
        for stop in all_stops:
            s_stop_name = stop['name'].lower()
            if s_stop_name == target1 or s_stop_name == target2:
                found = stop
                break
                
        if not found:
            # Try containing match
            for stop in all_stops:
                s_stop_name = stop['name'].lower()
                if sname.lower() in s_stop_name:
                    found = stop
                    break
                    
        if found:
            matched[sname] = found
        else:
            unmatched.append(sname)
            
    print(f"Matched {len(matched)} / {len(stations_to_check)} stations.")
    if unmatched:
        print("Unmatched stations:")
        for u in unmatched:
            print(f"  {u}")
    else:
        print("All stations matched successfully!")

if __name__ == '__main__':
    run()
