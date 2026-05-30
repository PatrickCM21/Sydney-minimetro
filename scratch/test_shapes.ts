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

const shapesPath = path.join(__dirname, '..', 'public', 'sydneytrainsdata.json');
const routeShapes: RouteShape[] = JSON.parse(fs.readFileSync(shapesPath, 'utf8'));

const routeCounts: Record<string, number> = {};
for (const s of routeShapes) {
  routeCounts[s.route_short_name] = (routeCounts[s.route_short_name] || 0) + 1;
}

console.log("Shape counts per route:");
console.log(routeCounts);

console.log("\nDetails for all shapes:");
routeShapes.forEach((shape, idx) => {
  console.log(`Shape ${idx}: route=${shape.route_short_name}, shape_id=${shape.shape_id}`);
});
