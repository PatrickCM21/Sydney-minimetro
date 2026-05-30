from scrape_wikipedia import fetch_wikitext, parse_stations_list
import json

title = "List_of_Sydney_Trains_railway_stations"
text = fetch_wikitext(title)
print(f"Total wikitext length: {len(text)}")

stations = parse_stations_list(title, is_metro=False)
print(f"Total stations parsed: {len(stations)}")

# Check for West Ryde
west_ryde = [s for k, s in stations.items() if 'west_ryde' in k or 'ryde' in k]
print(" Ryde stations matched:", west_ryde)

# Let's print out if "West Ryde" is in the raw text
print("Is 'West Ryde' in raw text?", "West Ryde" in text)
