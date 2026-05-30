import json

with open('public/sydneytrainsdata.json') as f:
    data = json.load(f)

for shape in data:
    geom = shape['json_geometry']
    coords = geom['coordinates'] if geom['type'] == 'LineString' else geom['coordinates'][0]
    passes_sydenham = False
    passes_stpeters = False
    passes_erskineville = False
    for c in coords:
        lng, lat = c[0], c[1]
        # Sydenham: lat -33.9166826, lng 151.166415
        if abs(lat - (-33.9166826)) < 0.005 and abs(lng - 151.166415) < 0.005:
            passes_sydenham = True
        # St Peters: lat -33.90727298, lng 151.18074263
        if abs(lat - (-33.90727298)) < 0.005 and abs(lng - 151.18074263) < 0.005:
            passes_stpeters = True
        # Erskineville: lat -33.90018265, lng 151.1854959
        if abs(lat - (-33.90018265)) < 0.005 and abs(lng - 151.1854959) < 0.005:
            passes_erskineville = True
    if passes_sydenham or passes_stpeters or passes_erskineville:
        print(f"Route {shape['route_short_name']}: type={geom['type']}, coords={len(coords)}, Passes Syd={passes_sydenham}, StP={passes_stpeters}, Ersk={passes_erskineville}")
