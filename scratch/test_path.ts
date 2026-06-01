import { bfsShortestPathWithLines } from '../src/lib/pathfinding';
import { STATION_MAP } from '../src/lib/networkData';

console.log('Strathfield:', STATION_MAP.get('STN-STR'));
console.log('North Ryde:', STATION_MAP.get('STN-NRD'));

const path = bfsShortestPathWithLines('STN-STR', 'STN-NRD');
console.log('Path result:', path);
