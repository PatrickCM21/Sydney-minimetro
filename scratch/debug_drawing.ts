import fs from 'fs';
import path from 'path';

interface Station {
  id: string;
  name: string;
  lines: string[];
  lat: number;
  lng: number;
}

interface RouteShape {
  route_short_name: string;
  route_color: string;
  shape_id?: string;
  json_geometry: {
    type: 'LineString' | 'MultiLineString';
    coordinates: number[][] | number[][][];
  };
}

const distance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const dLat = lat1 - lat2;
  const dLng = lng1 - lng2;
  return Math.sqrt(dLat * dLat + dLng * dLng);
};

const stationsPath = path.join(__dirname, '..', 'public', 'stations.json');
const shapesPath = path.join(__dirname, '..', 'public', 'sydneytrainsdata.json');

const stations: Station[] = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
const routeShapes: RouteShape[] = JSON.parse(fs.readFileSync(shapesPath, 'utf8'));

const STATION_MAP = new Map(stations.map(s => [s.id, s]));

const pairsToTest = [
  ["berowra", "mount_kuring_gai"],
  ["asquith", "hornsby"],
  ["hornsby", "waitara"],
  ["chatswood", "artarmon"],
  ["artarmon", "st_leonards"],
  ["emu_plains", "penrith"],
  ["penrith", "kingswood"],
  ["blacktown", "seven_hills"]
];

const lineId = 'T1';

console.log("=== Debugging evaluateAndSlice for T1 (Lat/Lng) ===");

for (const pair of pairsToTest) {
  console.log(`\nTesting pair: ${pair[0]} <-> ${pair[1]}`);
  const stationA = STATION_MAP.get(pair[0]);
  const stationB = STATION_MAP.get(pair[1]);
  if (!stationA || !stationB) {
    console.log(`  ❌ Error: Station ${pair[0]} or ${pair[1]} not found!`);
    continue;
  }

  if (!stationA.lines.includes(lineId) || !stationB.lines.includes(lineId)) {
    console.log(`  ❌ Error: Station ${stationA.name} or ${stationB.name} does not have T1 line!`);
    continue;
  }

  let bestSliced: [number, number][] | null = null;
  let bestScore = Infinity;
  let matchedShapeId = null;
  let shapesChecked = 0;

  for (const shape of routeShapes) {
    if (shape.route_short_name !== lineId) continue;
    shapesChecked++;

    const geom = shape.json_geometry;
    
    const evaluateAndSlice = (rawCoords: number[][]) => {
      // Direct Lat/Lng mapping: coords are stored as [longitude, latitude], map to [latitude, longitude]
      const coords = rawCoords.map((c) => [c[1], c[0]] as [number, number]);
      
      const candidatesA: number[] = [];
      const candidatesB: number[] = [];
      for (let i = 0; i < coords.length; i++) {
        const dA = distance(stationA.lat, stationA.lng, coords[i][0], coords[i][1]);
        if (dA < 0.005) {
          candidatesA.push(i);
        }
        const dB = distance(stationB.lat, stationB.lng, coords[i][0], coords[i][1]);
        if (dB < 0.005) {
          candidatesB.push(i);
        }
      }

      if (candidatesA.length === 0 || candidatesB.length === 0) {
        return null;
      }

      let bestSlice: [number, number][] | null = null;
      let bestPathLength = Infinity;
      let bestScore = Infinity;

      const directDist = distance(stationA.lat, stationA.lng, stationB.lat, stationB.lng);

      for (const idxA of candidatesA) {
        for (const idxB of candidatesB) {
          const minIdx = Math.min(idxA, idxB);
          const maxIdx = Math.max(idxA, idxB);
          if (maxIdx - minIdx < 1) continue;

          const sliced = coords.slice(minIdx, maxIdx + 1);

          let pathLength = 0;
          for (let k = 0; k < sliced.length - 1; k++) {
            pathLength += distance(sliced[k][0], sliced[k][1], sliced[k + 1][0], sliced[k + 1][1]);
          }

          if (pathLength <= 2.0 * directDist + 0.005) {
            const score = distance(stationA.lat, stationA.lng, coords[idxA][0], coords[idxA][1]) +
                          distance(stationB.lat, stationB.lng, coords[idxB][0], coords[idxB][1]);
            if (pathLength < bestPathLength) {
              bestPathLength = pathLength;
              bestSlice = sliced;
              bestScore = score;
            }
          }
        }
      }

      if (bestSlice) {
        return { sliced: bestSlice, score: bestScore };
      }
      return null;
    };

    if (geom.type === 'LineString') {
      const res = evaluateAndSlice(geom.coordinates as number[][]);
      if (res && res.score < bestScore) {
        bestScore = res.score;
        bestSliced = res.sliced;
        matchedShapeId = shape.shape_id;
      }
    } else if (geom.type === 'MultiLineString') {
      for (const part of (geom.coordinates as number[][][])) {
        const res = evaluateAndSlice(part);
        if (res && res.score < bestScore) {
          bestScore = res.score;
          bestSliced = res.sliced;
          matchedShapeId = shape.shape_id;
        }
      }
    }
  }

  console.log(`  Checked ${shapesChecked} shapes.`);
  if (bestSliced) {
    console.log(`  ✅ Match found in shape ${matchedShapeId}! Sliced length = ${bestSliced.length}`);
  } else {
    console.log(`  ❌ NO MATCH FOUND!`);
  }
}
