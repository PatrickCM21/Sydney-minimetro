import json

def merge_t6():
    # Load the source data with all the trains data
    with open('public/sydneytrainsdata.json', 'r') as f:
        source_data = json.load(f)
        
    # Load the target game trains data
    with open('public/sydneytrains.json', 'r') as f:
        target_data = json.load(f)
        
    # Find all T6 entries in source data
    t6_entries = []
    for entry in source_data:
        if entry.get("route_short_name") == "T6":
            t6_entries.append({
                "route_short_name": "T6",
                "route_color": entry.get("route_color", "7C3E21"),
                "route_desc": entry.get("route_desc", "T6 Lidcombe & Bankstown Line"),
                "json_geometry": entry.get("json_geometry")
            })
            
    print(f"Found {len(t6_entries)} T6 line segment geometries in source data.")
    
    # Append T6 entries to target data
    target_data.extend(t6_entries)
    
    # Save the updated target data back to public/sydneytrains.json
    with open('public/sydneytrains.json', 'w') as f:
        json.dump(target_data, f, indent=2)
        
    print("Successfully merged T6 line data into public/sydneytrains.json.")

if __name__ == '__main__':
    merge_t6()
