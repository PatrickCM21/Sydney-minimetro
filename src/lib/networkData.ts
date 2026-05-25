/**
 * Sydney Rail Network Data
 * Covers all Greater Sydney stations across:
 * T1, T2, T3, T4, T5, T6, T7, T8, T9 (Sydney Trains)
 * M1 (Metro Northwest & City & Southwest)
 * M2 (Sydney Metro West - planned, not included yet)
 *
 * Schematic coordinates are mapped on a 1400x900 canvas,
 * approximating the layout of the official Sydney Trains network map.
 */

import type { TrainLine, Station, Edge, LineId } from '@/types';

// ---------------------------------------------------------------------------
// LINE DEFINITIONS
// ---------------------------------------------------------------------------
export const LINES: TrainLine[] = [
  { id: 'T1', name: 'T1 North Shore & Western', color: '#F7941D', textColor: '#000' },
  { id: 'T2', name: 'T2 Inner West & Leppington', color: '#0098CD', textColor: '#fff' },
  { id: 'T3', name: 'T3 Bankstown Line', color: '#F4871F', textColor: '#000' },
  { id: 'T4', name: 'T4 Eastern Suburbs & Illawarra', color: '#005AA3', textColor: '#fff' },
  { id: 'T5', name: 'T5 Cumberland Line', color: '#C4A000', textColor: '#000' },
  { id: 'T6', name: 'T6 Carlingford Line', color: '#6D2077', textColor: '#fff' },
  { id: 'T7', name: 'T7 Olympic Park Line', color: '#009B77', textColor: '#fff' },
  { id: 'T8', name: 'T8 Airport & South Line', color: '#D50032', textColor: '#fff' },
  { id: 'T9', name: 'T9 Northern Line', color: '#00B2A9', textColor: '#000' },
  { id: 'M1', name: 'Metro City & Southwest', color: '#009B77', textColor: '#fff' },
];

export const LINE_MAP: Record<LineId, TrainLine> = Object.fromEntries(
  LINES.map(l => [l.id, l])
) as Record<LineId, TrainLine>;

// ---------------------------------------------------------------------------
// STATION DATA
// ---------------------------------------------------------------------------
// Schematic layout: west (left) → east (right), south (bottom) → north (top)
// Viewport: 1400 wide × 900 tall
// ---------------------------------------------------------------------------
export const STATIONS: Station[] = [
  // ---- CITY CIRCLE / SHARED HUB ----
  { id: 'central', name: 'Central', lines: ['T1','T2','T3','T4','T8','T9','M1'], x: 700, y: 530 },
  { id: 'town_hall', name: 'Town Hall', lines: ['T1','T2','T3','T4'], x: 670, y: 490 },
  { id: 'wynyard', name: 'Wynyard', lines: ['T1','T2','T3','T4'], x: 660, y: 450 },
  { id: 'circular_quay', name: 'Circular Quay', lines: ['T2','T3','T4'], x: 700, y: 420 },
  { id: 'st_james', name: 'St James', lines: ['T2','T3'], x: 730, y: 450 },
  { id: 'museum', name: 'Museum', lines: ['T2','T3'], x: 720, y: 490 },
  { id: 'redfern', name: 'Redfern', lines: ['T1','T2','T3','T4','T8'], x: 700, y: 575 },

  // ---- T1 NORTH SHORE (Milsons Point → Berowra) ----
  { id: 'milsons_point', name: 'Milsons Point', lines: ['T1'], x: 660, y: 400 },
  { id: 'north_sydney', name: 'North Sydney', lines: ['T1'], x: 650, y: 360 },
  { id: 'waverton', name: 'Waverton', lines: ['T1'], x: 635, y: 325 },
  { id: 'wollstonecraft', name: 'Wollstonecraft', lines: ['T1'], x: 640, y: 295 },
  { id: 'st_leonards', name: 'St Leonards', lines: ['T1','T9'], x: 650, y: 260 },
  { id: 'artarmon', name: 'Artarmon', lines: ['T1'], x: 645, y: 225 },
  { id: 'chatswood', name: 'Chatswood', lines: ['T1','M1'], x: 650, y: 190 },
  { id: 'roseville', name: 'Roseville', lines: ['T1'], x: 645, y: 155 },
  { id: 'lindfield', name: 'Lindfield', lines: ['T1'], x: 640, y: 120 },
  { id: 'killara', name: 'Killara', lines: ['T1'], x: 635, y: 95 },
  { id: 'gordon', name: 'Gordon', lines: ['T1'], x: 620, y: 70 },
  { id: 'pymble', name: 'Pymble', lines: ['T1'], x: 600, y: 55 },
  { id: 'turramurra', name: 'Turramurra', lines: ['T1'], x: 570, y: 50 },
  { id: 'warrawee', name: 'Warrawee', lines: ['T1'], x: 540, y: 55 },
  { id: 'wahroonga', name: 'Wahroonga', lines: ['T1'], x: 510, y: 60 },
  { id: 'waitara', name: 'Waitara', lines: ['T1'], x: 480, y: 65 },
  { id: 'hornsby', name: 'Hornsby', lines: ['T1','T9'], x: 450, y: 70 },
  { id: 'asquith', name: 'Asquith', lines: ['T1'], x: 420, y: 75 },
  { id: 'mount_colah', name: 'Mount Colah', lines: ['T1'], x: 390, y: 70 },
  { id: 'mount_kuring_gai', name: 'Mount Kuring-gai', lines: ['T1'], x: 365, y: 60 },
  { id: 'berowra', name: 'Berowra', lines: ['T1'], x: 340, y: 50 },

  // ---- T1 WESTERN (Strathfield → Emu Plains) ----
  { id: 'strathfield', name: 'Strathfield', lines: ['T1','T2','T5','T7'], x: 540, y: 580 },
  { id: 'burwood', name: 'Burwood', lines: ['T1','T2'], x: 510, y: 575 },
  { id: 'croydon', name: 'Croydon', lines: ['T1','T2'], x: 480, y: 575 },
  { id: 'ashfield', name: 'Ashfield', lines: ['T1','T2'], x: 450, y: 580 },
  { id: 'summer_hill', name: 'Summer Hill', lines: ['T2'], x: 430, y: 595 },
  { id: 'lewisham', name: 'Lewisham', lines: ['T2'], x: 410, y: 610 },
  { id: 'petersham', name: 'Petersham', lines: ['T2'], x: 390, y: 615 },
  { id: 'stanmore', name: 'Stanmore', lines: ['T2'], x: 370, y: 615 },
  { id: 'newtown', name: 'Newtown', lines: ['T2'], x: 345, y: 610 },
  { id: 'macdonaldtown', name: 'Macdonaldtown', lines: ['T2'], x: 325, y: 598 },
  { id: 'homebush', name: 'Homebush', lines: ['T2'], x: 505, y: 560 },
  { id: 'flemington', name: 'Flemington', lines: ['T2','T5'], x: 480, y: 545 },
  { id: 'lidcombe', name: 'Lidcombe', lines: ['T2','T5','T7'], x: 455, y: 535 },
  { id: 'auburn', name: 'Auburn', lines: ['T2','T5'], x: 430, y: 530 },
  { id: 'granville', name: 'Granville', lines: ['T1','T2','T5'], x: 400, y: 525 },
  { id: 'harris_park', name: 'Harris Park', lines: ['T1','T2'], x: 370, y: 520 },
  { id: 'parramatta', name: 'Parramatta', lines: ['T1','T2','T5','M1'], x: 345, y: 520 },
  { id: 'merrylands', name: 'Merrylands', lines: ['T2','T5'], x: 315, y: 535 },
  { id: 'guildford', name: 'Guildford', lines: ['T2','T5'], x: 290, y: 545 },
  { id: 'yennora', name: 'Yennora', lines: ['T2'], x: 265, y: 555 },
  { id: 'fairfield', name: 'Fairfield', lines: ['T2'], x: 240, y: 565 },
  { id: 'canley_vale', name: 'Canley Vale', lines: ['T2'], x: 215, y: 575 },
  { id: 'cabramatta', name: 'Cabramatta', lines: ['T2'], x: 190, y: 585 },
  { id: 'warwick_farm', name: 'Warwick Farm', lines: ['T2'], x: 165, y: 600 },
  { id: 'liverpool', name: 'Liverpool', lines: ['T2','T5'], x: 145, y: 615 },
  { id: 'casula', name: 'Casula', lines: ['T2'], x: 130, y: 640 },
  { id: 'glenfield', name: 'Glenfield', lines: ['T2','T8'], x: 130, y: 665 },
  { id: 'edmondson_park', name: 'Edmondson Park', lines: ['T2'], x: 125, y: 695 },
  { id: 'leppington', name: 'Leppington', lines: ['T2'], x: 115, y: 725 },

  // T1 Western line from Strathfield west
  { id: 'clyde', name: 'Clyde', lines: ['T1'], x: 420, y: 555 },
  { id: 'pendle_hill', name: 'Pendle Hill', lines: ['T1'], x: 295, y: 505 },
  { id: 'wentworthville', name: 'Wentworthville', lines: ['T1'], x: 320, y: 508 },
  { id: 'westmead', name: 'Westmead', lines: ['T1','M1'], x: 348, y: 505 },
  { id: 'toongabbie', name: 'Toongabbie', lines: ['T1'], x: 270, y: 503 },
  { id: 'seven_hills', name: 'Seven Hills', lines: ['T1'], x: 245, y: 500 },
  { id: 'blacktown', name: 'Blacktown', lines: ['T1'], x: 215, y: 495 },
  { id: 'marayong', name: 'Marayong', lines: ['T1'], x: 188, y: 488 },
  { id: 'quakers_hill', name: 'Quakers Hill', lines: ['T1'], x: 163, y: 482 },
  { id: 'schofields', name: 'Schofields', lines: ['T1'], x: 138, y: 465 },
  { id: 'riverstone', name: 'Riverstone', lines: ['T1'], x: 118, y: 445 },
  { id: 'vineyard', name: 'Vineyard', lines: ['T1'], x: 105, y: 425 },
  { id: 'mulgrave', name: 'Mulgrave', lines: ['T1'], x: 95, y: 405 },
  { id: 'windsor', name: 'Windsor', lines: ['T1'], x: 85, y: 385 },
  { id: 'clarendon', name: 'Clarendon', lines: ['T1'], x: 80, y: 365 },
  { id: 'east_richmond', name: 'East Richmond', lines: ['T1'], x: 75, y: 345 },
  { id: 'richmond', name: 'Richmond', lines: ['T1'], x: 65, y: 325 },

  // T1 Main Western (Blacktown → Emu Plains)
  { id: 'doonside', name: 'Doonside', lines: ['T1'], x: 185, y: 505 },
  { id: 'mount_druitt', name: 'Mount Druitt', lines: ['T1'], x: 160, y: 515 },
  { id: 'rooty_hill', name: 'Rooty Hill', lines: ['T1'], x: 140, y: 522 },
  { id: 'st_marys', name: 'St Marys', lines: ['T1'], x: 118, y: 530 },
  { id: 'werrington', name: 'Werrington', lines: ['T1'], x: 105, y: 537 },
  { id: 'kingswood', name: 'Kingswood', lines: ['T1'], x: 92, y: 543 },
  { id: 'penrith', name: 'Penrith', lines: ['T1'], x: 75, y: 550 },
  { id: 'emu_plains', name: 'Emu Plains', lines: ['T1'], x: 55, y: 558 },

  // ---- T3 BANKSTOWN LINE (Sydenham → Bankstown) ----
  { id: 'sydenham', name: 'Sydenham', lines: ['T3','T4','T8','M1'], x: 730, y: 620 },
  { id: 'marrickville', name: 'Marrickville', lines: ['T3'], x: 750, y: 640 },
  { id: 'dulwich_hill', name: 'Dulwich Hill', lines: ['T3'], x: 765, y: 655 },
  { id: 'hurlstone_park', name: 'Hurlstone Park', lines: ['T3'], x: 775, y: 675 },
  { id: 'canterbury', name: 'Canterbury', lines: ['T3'], x: 790, y: 695 },
  { id: 'campsie', name: 'Campsie', lines: ['T3'], x: 810, y: 710 },
  { id: 'belmore', name: 'Belmore', lines: ['T3'], x: 835, y: 718 },
  { id: 'lakemba', name: 'Lakemba', lines: ['T3'], x: 860, y: 722 },
  { id: 'wiley_park', name: 'Wiley Park', lines: ['T3'], x: 885, y: 725 },
  { id: 'punchbowl', name: 'Punchbowl', lines: ['T3'], x: 910, y: 722 },
  { id: 'bankstown', name: 'Bankstown', lines: ['T3'], x: 940, y: 715 },

  // ---- T4 EASTERN SUBURBS & ILLAWARRA ----
  // Eastern Suburbs branch (from Central)
  { id: 'edgecliff', name: 'Edgecliff', lines: ['T4'], x: 775, y: 475 },
  { id: 'kings_cross', name: 'Kings Cross', lines: ['T4'], x: 755, y: 490 },
  { id: 'martin_place', name: 'Martin Place', lines: ['T4'], x: 710, y: 460 },
  { id: 'bondi_junction', name: 'Bondi Junction', lines: ['T4'], x: 810, y: 460 },

  // Illawarra Line (from Sydenham south)
  { id: 'st_peters', name: 'St Peters', lines: ['T4'], x: 740, y: 640 },
  { id: 'tempe', name: 'Tempe', lines: ['T4'], x: 755, y: 660 },
  { id: 'wolli_creek', name: 'Wolli Creek', lines: ['T4','T8'], x: 765, y: 680 },
  { id: 'arncliffe', name: 'Arncliffe', lines: ['T4'], x: 770, y: 705 },
  { id: 'banksia', name: 'Banksia', lines: ['T4'], x: 775, y: 730 },
  { id: 'rockdale', name: 'Rockdale', lines: ['T4'], x: 785, y: 750 },
  { id: 'kogarah', name: 'Kogarah', lines: ['T4'], x: 800, y: 768 },
  { id: 'allawah', name: 'Allawah', lines: ['T4'], x: 815, y: 780 },
  { id: 'carlton', name: 'Carlton', lines: ['T4'], x: 830, y: 788 },
  { id: 'hurstville', name: 'Hurstville', lines: ['T4'], x: 850, y: 793 },
  { id: 'penshurst', name: 'Penshurst', lines: ['T4'], x: 872, y: 793 },
  { id: 'mortdale', name: 'Mortdale', lines: ['T4'], x: 895, y: 793 },
  { id: 'oatley', name: 'Oatley', lines: ['T4'], x: 918, y: 790 },
  { id: 'como', name: 'Como', lines: ['T4'], x: 940, y: 785 },
  { id: 'jannali', name: 'Jannali', lines: ['T4'], x: 960, y: 778 },
  { id: 'sutherland', name: 'Sutherland', lines: ['T4'], x: 980, y: 768 },
  { id: 'kirrawee', name: 'Kirrawee', lines: ['T4'], x: 1000, y: 758 },
  { id: 'gymea', name: 'Gymea', lines: ['T4'], x: 1018, y: 745 },
  { id: 'miranda', name: 'Miranda', lines: ['T4'], x: 1035, y: 733 },
  { id: 'caringbah', name: 'Caringbah', lines: ['T4'], x: 1052, y: 720 },
  { id: 'woolooware', name: 'Woolooware', lines: ['T4'], x: 1068, y: 708 },
  { id: 'cronulla', name: 'Cronulla', lines: ['T4'], x: 1090, y: 695 },

  // Sutherland → Waterfall branch
  { id: 'loftus', name: 'Loftus', lines: ['T4'], x: 990, y: 745 },
  { id: 'engadine', name: 'Engadine', lines: ['T4'], x: 1000, y: 730 },
  { id: 'heathcote', name: 'Heathcote', lines: ['T4'], x: 1010, y: 715 },
  { id: 'waterfall', name: 'Waterfall', lines: ['T4'], x: 1025, y: 700 },

  // ---- T5 CUMBERLAND LINE ----
  { id: 'blacktown_t5', name: 'Blacktown', lines: ['T5'], x: 215, y: 495 },
  // (shared with T1 Blacktown - we reference same id 'blacktown')
  { id: 'pendle_hill_t5', name: 'Pendle Hill', lines: ['T5'], x: 295, y: 505 },
  // Cumberland: Blacktown → Lidcombe via non-city route
  // Some stations are shared with T1/T2, rest are unique
  { id: 'mt_druitt_t5', name: 'Mount Druitt', lines: ['T5'], x: 160, y: 515 },
  { id: 'st_marys_t5', name: 'St Marys', lines: ['T5'], x: 118, y: 530 },
  // Note: T5 uses: Blacktown ↔ Pendle Hill ↔ Wentworthville ↔ Parramatta ↔ Granville ↔ Auburn ↔ Lidcombe
  // (all shared with T1/T2 except T5-only Carramar etc.)
  { id: 'carramar', name: 'Carramar', lines: ['T5'], x: 265, y: 568 },
  { id: 'villawood', name: 'Villawood', lines: ['T5'], x: 242, y: 558 },
  { id: 'leightonfield', name: 'Leightonfield', lines: ['T5'], x: 254, y: 548 },
  { id: 'berala', name: 'Berala', lines: ['T5'], x: 438, y: 541 },
  { id: 'birrong', name: 'Birrong', lines: ['T5'], x: 290, y: 558 },
  { id: 'sefton', name: 'Sefton', lines: ['T5'], x: 302, y: 567 },
  { id: 'chester_hill', name: 'Chester Hill', lines: ['T5'], x: 325, y: 565 },
  { id: 'sefton_south', name: 'Regents Park', lines: ['T5'], x: 348, y: 558 },
  { id: 'bass_hill', name: 'Bass Hill', lines: ['T5'], x: 310, y: 575 },
  // T5 simplified: main corridor uses shared stations

  // ---- T8 AIRPORT & SOUTH LINE ----
  { id: 'domestic_airport', name: 'Domestic Airport', lines: ['T8'], x: 790, y: 640 },
  { id: 'international_airport', name: 'International Airport', lines: ['T8'], x: 808, y: 652 },
  { id: 'mascot', name: 'Mascot', lines: ['T8'], x: 790, y: 620 },
  { id: 'green_square', name: 'Green Square', lines: ['T8','M1'], x: 760, y: 595 },
  // From Sydenham → Revesby → Campbelltown
  { id: 'kingsgrove', name: 'Kingsgrove', lines: ['T8'], x: 860, y: 735 },
  { id: 'belmore_t8', name: 'Belmore', lines: ['T8'], x: 835, y: 718 },
  { id: 'revesby', name: 'Revesby', lines: ['T8'], x: 895, y: 748 },
  { id: 'padstow', name: 'Padstow', lines: ['T8'], x: 918, y: 750 },
  { id: 'panania', name: 'Panania', lines: ['T8'], x: 940, y: 748 },
  { id: 'east_hills', name: 'East Hills', lines: ['T8'], x: 960, y: 745 },
  { id: 'holsworthy', name: 'Holsworthy', lines: ['T8'], x: 980, y: 740 },
  { id: 'wattle_grove', name: 'Wattle Grove', lines: ['T8'], x: 1000, y: 730 },
  { id: 'milperra', name: 'Milperra', lines: ['T8'], x: 940, y: 730 },
  { id: 'georges_hall', name: "Georges Hall", lines: ['T8'], x: 922, y: 732 },
  // Campbelltown branch
  { id: 'campbelltown', name: 'Campbelltown', lines: ['T8'], x: 150, y: 780 },
  { id: 'macarthur', name: 'Macarthur', lines: ['T8'], x: 168, y: 770 },
  { id: 'ingleburn', name: 'Ingleburn', lines: ['T8'], x: 145, y: 750 },
  { id: 'minto', name: 'Minto', lines: ['T8'], x: 143, y: 733 },
  { id: 'leumeah', name: 'Leumeah', lines: ['T8'], x: 140, y: 718 },
  { id: 'glenquarie', name: 'Glenquarie', lines: ['T8'], x: 137, y: 703 },
  { id: 'macquarie_fields', name: 'Macquarie Fields', lines: ['T8'], x: 134, y: 688 },
  { id: 'claymore', name: 'Claymore', lines: ['T8'], x: 130, y: 673 },

  // ---- T9 NORTHERN LINE (Gordon → Hornsby, Central Coast branch) ----
  { id: 'beecroft', name: 'Beecroft', lines: ['T9'], x: 510, y: 100 },
  { id: 'cheltenham', name: 'Cheltenham', lines: ['T9'], x: 490, y: 95 },
  { id: 'epping', name: 'Epping', lines: ['T9','M1'], x: 560, y: 120 },
  { id: 'eastwood', name: 'Eastwood', lines: ['T9'], x: 590, y: 145 },
  { id: 'west_ryde', name: 'West Ryde', lines: ['T9'], x: 610, y: 170 },
  { id: 'meadowbank', name: 'Meadowbank', lines: ['T9'], x: 630, y: 190 },
  { id: 'rhodes', name: 'Rhodes', lines: ['T9'], x: 645, y: 210 },
  { id: 'concord_west', name: 'Concord West', lines: ['T9'], x: 620, y: 225 },
  { id: 'north_strathfield', name: 'North Strathfield', lines: ['T9'], x: 588, y: 240 },
  { id: 'olympic_park', name: 'Olympic Park', lines: ['T7'], x: 538, y: 550 },

  // T9 from St Leonards/Hornsby
  { id: 'pennant_hills', name: 'Pennant Hills', lines: ['T9'], x: 475, y: 110 },
  { id: 'thornleigh', name: 'Thornleigh', lines: ['T9'], x: 460, y: 95 },
  { id: 'normanhurst', name: 'Normanhurst', lines: ['T9'], x: 453, y: 80 },

  // ---- M1 METRO NORTHWEST & CITY & SOUTHWEST ----
  // NW section: Tallawong → Chatswood
  { id: 'tallawong', name: 'Tallawong', lines: ['M1'], x: 115, y: 290 },
  { id: 'cudgegong_road', name: 'Cudgegong Road', lines: ['M1'], x: 135, y: 305 },
  { id: 'rouse_hill', name: 'Rouse Hill', lines: ['M1'], x: 160, y: 315 },
  { id: 'hills_showground', name: 'Hills Showground', lines: ['M1'], x: 190, y: 320 },
  { id: 'kellyville', name: 'Kellyville', lines: ['M1'], x: 218, y: 325 },
  { id: 'bella_vista', name: 'Bella Vista', lines: ['M1'], x: 245, y: 330 },
  { id: 'norwest', name: 'Norwest', lines: ['M1'], x: 268, y: 335 },
  { id: 'castle_hill', name: 'Castle Hill', lines: ['M1'], x: 292, y: 338 },
  { id: 'cherrybrook', name: 'Cherrybrook', lines: ['M1'], x: 320, y: 332 },
  { id: 'showground_m1', name: 'Hills Showground', lines: ['M1'], x: 190, y: 320 },
  // Metro City section: Chatswood → Central (underground)
  { id: 'crows_nest', name: "Crows Nest", lines: ['M1'], x: 655, y: 225 },
  { id: 'victoria_cross', name: 'Victoria Cross', lines: ['M1'], x: 655, y: 385 },
  { id: 'barangaroo', name: 'Barangaroo', lines: ['M1'], x: 645, y: 430 },
  { id: 'martin_place_m', name: 'Martin Place (Metro)', lines: ['M1'], x: 710, y: 462 },
  { id: 'gadigal', name: 'Gadigal', lines: ['M1'], x: 700, y: 490 },
  // Metro Southwest section: Central → Bankstown
  { id: 'waterloo', name: 'Waterloo', lines: ['M1'], x: 740, y: 565 },
  { id: 'zetland', name: 'Zetland', lines: ['M1'], x: 755, y: 580 },
  { id: 'south_eveleigh', name: 'South Eveleigh', lines: ['M1'], x: 720, y: 555 },
  { id: 'marrickville_m', name: 'Marrickville (Metro)', lines: ['M1'], x: 740, y: 640 },
  { id: 'dulwich_hill_m', name: 'Dulwich Hill (Metro)', lines: ['M1'], x: 755, y: 660 },
  { id: 'hurlstone_park_m', name: 'Hurlstone Park (Metro)', lines: ['M1'], x: 770, y: 675 },
  { id: 'canterbury_m', name: 'Canterbury (Metro)', lines: ['M1'], x: 785, y: 695 },
  { id: 'campsie_m', name: 'Campsie (Metro)', lines: ['M1'], x: 805, y: 710 },
  { id: 'belmore_m', name: 'Belmore (Metro)', lines: ['M1'], x: 830, y: 718 },
  { id: 'lakemba_m', name: 'Lakemba (Metro)', lines: ['M1'], x: 855, y: 722 },
  { id: 'wiley_park_m', name: 'Wiley Park (Metro)', lines: ['M1'], x: 880, y: 725 },
  { id: 'punchbowl_m', name: 'Punchbowl (Metro)', lines: ['M1'], x: 905, y: 722 },
  { id: 'bankstown_m', name: 'Bankstown (Metro)', lines: ['M1'], x: 935, y: 715 },

  // ---- T6 CARLINGFORD LINE (Clyde → Carlingford) ----
  { id: 'rosehill', name: 'Rosehill', lines: ['T6'], x: 395, y: 542 },
  { id: 'camellia', name: 'Camellia', lines: ['T6'], x: 382, y: 540 },
  { id: 'rydalmere', name: 'Rydalmere', lines: ['T6'], x: 370, y: 537 },
  { id: 'dundas', name: 'Dundas', lines: ['T6'], x: 355, y: 533 },
  { id: 'telopea', name: 'Telopea', lines: ['T6'], x: 342, y: 530 },
  { id: 'carlingford', name: 'Carlingford', lines: ['T6'], x: 328, y: 527 },
];

// Deduplicate: if same station id appears in STATIONS, keep only first occurrence
const seen = new Set<string>();
export const STATIONS_DEDUPED: Station[] = STATIONS.filter(s => {
  if (seen.has(s.id)) return false;
  seen.add(s.id);
  return true;
});

// ---------------------------------------------------------------------------
// EDGES — adjacent pairs along each line
// ---------------------------------------------------------------------------
type EdgeDef = [string, string, LineId];

const rawEdges: EdgeDef[] = [
  // T1 NORTH SHORE (south → north)
  ['wynyard', 'milsons_point', 'T1'],
  ['milsons_point', 'north_sydney', 'T1'],
  ['north_sydney', 'waverton', 'T1'],
  ['waverton', 'wollstonecraft', 'T1'],
  ['wollstonecraft', 'st_leonards', 'T1'],
  ['st_leonards', 'artarmon', 'T1'],
  ['artarmon', 'chatswood', 'T1'],
  ['chatswood', 'roseville', 'T1'],
  ['roseville', 'lindfield', 'T1'],
  ['lindfield', 'killara', 'T1'],
  ['killara', 'gordon', 'T1'],
  ['gordon', 'pymble', 'T1'],
  ['pymble', 'turramurra', 'T1'],
  ['turramurra', 'warrawee', 'T1'],
  ['warrawee', 'wahroonga', 'T1'],
  ['wahroonga', 'waitara', 'T1'],
  ['waitara', 'hornsby', 'T1'],
  ['hornsby', 'asquith', 'T1'],
  ['asquith', 'mount_colah', 'T1'],
  ['mount_colah', 'mount_kuring_gai', 'T1'],
  ['mount_kuring_gai', 'berowra', 'T1'],

  // T1 CITY (Wynyard ↔ Town Hall ↔ Central)
  ['wynyard', 'town_hall', 'T1'],
  ['town_hall', 'central', 'T1'],
  ['central', 'redfern', 'T1'],
  ['redfern', 'strathfield', 'T1'],

  // T1 WESTERN (Strathfield → Emu Plains via Parramatta)
  ['strathfield', 'burwood', 'T1'],
  ['burwood', 'croydon', 'T1'],
  ['croydon', 'ashfield', 'T1'],
  ['ashfield', 'strathfield', 'T1'],
  ['strathfield', 'homebush', 'T1'],
  ['strathfield', 'clyde', 'T1'],
  ['clyde', 'granville', 'T1'],
  ['granville', 'harris_park', 'T1'],
  ['harris_park', 'parramatta', 'T1'],
  ['parramatta', 'westmead', 'T1'],
  ['westmead', 'wentworthville', 'T1'],
  ['wentworthville', 'pendle_hill', 'T1'],
  ['pendle_hill', 'toongabbie', 'T1'],
  ['toongabbie', 'seven_hills', 'T1'],
  ['seven_hills', 'blacktown', 'T1'],

  // T1 Richmond branch
  ['blacktown', 'marayong', 'T1'],
  ['marayong', 'quakers_hill', 'T1'],
  ['quakers_hill', 'schofields', 'T1'],
  ['schofields', 'riverstone', 'T1'],
  ['riverstone', 'vineyard', 'T1'],
  ['vineyard', 'mulgrave', 'T1'],
  ['mulgrave', 'windsor', 'T1'],
  ['windsor', 'clarendon', 'T1'],
  ['clarendon', 'east_richmond', 'T1'],
  ['east_richmond', 'richmond', 'T1'],

  // T1 Main Western (Blacktown → Emu Plains)
  ['blacktown', 'doonside', 'T1'],
  ['doonside', 'mount_druitt', 'T1'],
  ['mount_druitt', 'rooty_hill', 'T1'],
  ['rooty_hill', 'st_marys', 'T1'],
  ['st_marys', 'werrington', 'T1'],
  ['werrington', 'kingswood', 'T1'],
  ['kingswood', 'penrith', 'T1'],
  ['penrith', 'emu_plains', 'T1'],

  // T2 CITY CIRCLE
  ['central', 'museum', 'T2'],
  ['museum', 'st_james', 'T2'],
  ['st_james', 'circular_quay', 'T2'],
  ['circular_quay', 'wynyard', 'T2'],
  ['wynyard', 'town_hall', 'T2'],
  ['town_hall', 'central', 'T2'],

  // T2 INNER WEST (Central → Strathfield)
  ['central', 'redfern', 'T2'],
  ['redfern', 'macdonaldtown', 'T2'],
  ['macdonaldtown', 'newtown', 'T2'],
  ['newtown', 'stanmore', 'T2'],
  ['stanmore', 'petersham', 'T2'],
  ['petersham', 'lewisham', 'T2'],
  ['lewisham', 'summer_hill', 'T2'],
  ['summer_hill', 'ashfield', 'T2'],
  ['ashfield', 'croydon', 'T2'],
  ['croydon', 'burwood', 'T2'],
  ['burwood', 'strathfield', 'T2'],

  // T2 to Parramatta / Leppington
  ['strathfield', 'homebush', 'T2'],
  ['homebush', 'flemington', 'T2'],
  ['flemington', 'lidcombe', 'T2'],
  ['lidcombe', 'auburn', 'T2'],
  ['auburn', 'granville', 'T2'],
  ['granville', 'harris_park', 'T2'],
  ['harris_park', 'parramatta', 'T2'],
  ['parramatta', 'merrylands', 'T2'],
  ['merrylands', 'guildford', 'T2'],
  ['guildford', 'yennora', 'T2'],
  ['yennora', 'fairfield', 'T2'],
  ['fairfield', 'canley_vale', 'T2'],
  ['canley_vale', 'cabramatta', 'T2'],
  ['cabramatta', 'warwick_farm', 'T2'],
  ['warwick_farm', 'liverpool', 'T2'],
  ['liverpool', 'casula', 'T2'],
  ['casula', 'glenfield', 'T2'],
  ['glenfield', 'edmondson_park', 'T2'],
  ['edmondson_park', 'leppington', 'T2'],

  // T3 BANKSTOWN
  ['central', 'town_hall', 'T3'],
  ['town_hall', 'wynyard', 'T3'],
  ['wynyard', 'circular_quay', 'T3'],
  ['circular_quay', 'st_james', 'T3'],
  ['st_james', 'museum', 'T3'],
  ['museum', 'central', 'T3'],
  ['central', 'redfern', 'T3'],
  ['redfern', 'sydenham', 'T3'],
  ['sydenham', 'marrickville', 'T3'],
  ['marrickville', 'dulwich_hill', 'T3'],
  ['dulwich_hill', 'hurlstone_park', 'T3'],
  ['hurlstone_park', 'canterbury', 'T3'],
  ['canterbury', 'campsie', 'T3'],
  ['campsie', 'belmore', 'T3'],
  ['belmore', 'lakemba', 'T3'],
  ['lakemba', 'wiley_park', 'T3'],
  ['wiley_park', 'punchbowl', 'T3'],
  ['punchbowl', 'bankstown', 'T3'],

  // T4 EASTERN SUBURBS
  ['central', 'museum', 'T4'],
  ['museum', 'st_james', 'T4'],
  ['st_james', 'circular_quay', 'T4'],
  ['circular_quay', 'wynyard', 'T4'],
  ['wynyard', 'town_hall', 'T4'],
  ['town_hall', 'central', 'T4'],
  ['central', 'martin_place', 'T4'],
  ['martin_place', 'kings_cross', 'T4'],
  ['kings_cross', 'edgecliff', 'T4'],
  ['edgecliff', 'bondi_junction', 'T4'],

  // T4 ILLAWARRA (Sydenham south)
  ['central', 'redfern', 'T4'],
  ['redfern', 'sydenham', 'T4'],
  ['sydenham', 'st_peters', 'T4'],
  ['st_peters', 'tempe', 'T4'],
  ['tempe', 'wolli_creek', 'T4'],
  ['wolli_creek', 'arncliffe', 'T4'],
  ['arncliffe', 'banksia', 'T4'],
  ['banksia', 'rockdale', 'T4'],
  ['rockdale', 'kogarah', 'T4'],
  ['kogarah', 'allawah', 'T4'],
  ['allawah', 'carlton', 'T4'],
  ['carlton', 'hurstville', 'T4'],
  ['hurstville', 'penshurst', 'T4'],
  ['penshurst', 'mortdale', 'T4'],
  ['mortdale', 'oatley', 'T4'],
  ['oatley', 'como', 'T4'],
  ['como', 'jannali', 'T4'],
  ['jannali', 'sutherland', 'T4'],

  // Sutherland → Cronulla
  ['sutherland', 'kirrawee', 'T4'],
  ['kirrawee', 'gymea', 'T4'],
  ['gymea', 'miranda', 'T4'],
  ['miranda', 'caringbah', 'T4'],
  ['caringbah', 'woolooware', 'T4'],
  ['woolooware', 'cronulla', 'T4'],

  // Sutherland → Waterfall
  ['sutherland', 'loftus', 'T4'],
  ['loftus', 'engadine', 'T4'],
  ['engadine', 'heathcote', 'T4'],
  ['heathcote', 'waterfall', 'T4'],

  // T5 CUMBERLAND (simplified main corridor)
  ['liverpool', 'berala', 'T5'],
  ['berala', 'sefton_south', 'T5'],
  ['sefton_south', 'chester_hill', 'T5'],
  ['chester_hill', 'sefton', 'T5'],
  ['sefton', 'birrong', 'T5'],
  ['birrong', 'carramar', 'T5'],
  ['carramar', 'villawood', 'T5'],
  ['villawood', 'leightonfield', 'T5'],
  ['leightonfield', 'yennora', 'T5'],
  ['yennora', 'fairfield', 'T5'],
  ['fairfield', 'liverpool', 'T5'],
  // Northern T5 corridor
  ['blacktown', 'seven_hills', 'T5'],
  ['seven_hills', 'toongabbie', 'T5'],
  ['toongabbie', 'pendle_hill', 'T5'],
  ['pendle_hill', 'wentworthville', 'T5'],
  ['wentworthville', 'parramatta', 'T5'],
  ['parramatta', 'granville', 'T5'],
  ['granville', 'auburn', 'T5'],
  ['auburn', 'lidcombe', 'T5'],
  ['lidcombe', 'flemington', 'T5'],
  ['flemington', 'strathfield', 'T5'],

  // T6 CARLINGFORD
  ['clyde', 'rosehill', 'T6'],
  ['rosehill', 'camellia', 'T6'],
  ['camellia', 'rydalmere', 'T6'],
  ['rydalmere', 'dundas', 'T6'],
  ['dundas', 'telopea', 'T6'],
  ['telopea', 'carlingford', 'T6'],

  // T7 OLYMPIC PARK
  ['strathfield', 'olympic_park', 'T7'],
  ['lidcombe', 'olympic_park', 'T7'],

  // T8 AIRPORT & SOUTH
  ['central', 'redfern', 'T8'],
  ['redfern', 'sydenham', 'T8'],
  ['sydenham', 'st_peters', 'T8'],
  ['st_peters', 'mascot', 'T8'],
  ['mascot', 'domestic_airport', 'T8'],
  ['domestic_airport', 'international_airport', 'T8'],
  ['international_airport', 'wolli_creek', 'T8'],
  ['wolli_creek', 'arncliffe', 'T8'],
  ['arncliffe', 'banksia', 'T8'],
  ['banksia', 'rockdale', 'T8'],
  ['rockdale', 'sydenham', 'T8'],
  // T8 South (via Glenfield)
  ['sydenham', 'wolli_creek', 'T8'],
  ['wolli_creek', 'kingsgrove', 'T8'],
  ['kingsgrove', 'revesby', 'T8'],
  ['revesby', 'padstow', 'T8'],
  ['padstow', 'panania', 'T8'],
  ['panania', 'east_hills', 'T8'],
  ['glenfield', 'macquarie_fields', 'T8'],
  ['macquarie_fields', 'ingleburn', 'T8'],
  ['ingleburn', 'minto', 'T8'],
  ['minto', 'leumeah', 'T8'],
  ['leumeah', 'campbelltown', 'T8'],
  ['campbelltown', 'macarthur', 'T8'],

  // T9 NORTHERN LINE
  ['central', 'redfern', 'T9'],
  ['redfern', 'central', 'T9'],
  ['central', 'st_leonards', 'T9'],
  ['st_leonards', 'chatswood', 'T9'],
  ['chatswood', 'epping', 'T9'],
  ['epping', 'eastwood', 'T9'],
  ['eastwood', 'west_ryde', 'T9'],
  ['west_ryde', 'meadowbank', 'T9'],
  ['meadowbank', 'rhodes', 'T9'],
  ['rhodes', 'concord_west', 'T9'],
  ['concord_west', 'north_strathfield', 'T9'],
  ['north_strathfield', 'strathfield', 'T9'],
  // Hornsby branch
  ['hornsby', 'normanhurst', 'T9'],
  ['normanhurst', 'thornleigh', 'T9'],
  ['thornleigh', 'pennant_hills', 'T9'],
  ['pennant_hills', 'beecroft', 'T9'],
  ['beecroft', 'cheltenham', 'T9'],
  ['cheltenham', 'epping', 'T9'],

  // M1 METRO NORTHWEST (Tallawong → Chatswood)
  ['tallawong', 'cudgegong_road', 'M1'],
  ['cudgegong_road', 'rouse_hill', 'M1'],
  ['rouse_hill', 'hills_showground', 'M1'],
  ['hills_showground', 'kellyville', 'M1'],
  ['kellyville', 'bella_vista', 'M1'],
  ['bella_vista', 'norwest', 'M1'],
  ['norwest', 'castle_hill', 'M1'],
  ['castle_hill', 'cherrybrook', 'M1'],
  ['cherrybrook', 'epping', 'M1'],
  ['epping', 'chatswood', 'M1'],

  // M1 METRO CITY (Chatswood → Sydenham)
  ['chatswood', 'crows_nest', 'M1'],
  ['crows_nest', 'victoria_cross', 'M1'],
  ['victoria_cross', 'barangaroo', 'M1'],
  ['barangaroo', 'martin_place_m', 'M1'],
  ['martin_place_m', 'gadigal', 'M1'],
  ['gadigal', 'central', 'M1'],
  ['central', 'sydenham', 'M1'],

  // M1 METRO SOUTHWEST (Sydenham → Bankstown)
  ['sydenham', 'marrickville_m', 'M1'],
  ['marrickville_m', 'dulwich_hill_m', 'M1'],
  ['dulwich_hill_m', 'hurlstone_park_m', 'M1'],
  ['hurlstone_park_m', 'canterbury_m', 'M1'],
  ['canterbury_m', 'campsie_m', 'M1'],
  ['campsie_m', 'belmore_m', 'M1'],
  ['belmore_m', 'lakemba_m', 'M1'],
  ['lakemba_m', 'wiley_park_m', 'M1'],
  ['wiley_park_m', 'punchbowl_m', 'M1'],
  ['punchbowl_m', 'bankstown_m', 'M1'],

  // M1 connection to Parramatta
  ['parramatta', 'westmead', 'M1'],
  ['westmead', 'parramatta', 'M1'],
  // T8 Airport connections  
  ['central', 'green_square', 'T8'],
  ['green_square', 'mascot', 'T8'],
  ['green_square', 'waterloo', 'M1'],
  ['waterloo', 'green_square', 'M1'],
];

// Build deduplicated edge list (bidirectional storage)
function edgeKey(from: string, to: string, line: LineId): string {
  const [a, b] = [from, to].sort();
  return `${a}|${b}|${line}`;
}

const edgeSeen = new Set<string>();
export const EDGES: Edge[] = [];

for (const [from, to, line] of rawEdges) {
  const key = edgeKey(from, to, line);
  if (!edgeSeen.has(key)) {
    edgeSeen.add(key);
    EDGES.push({ from, to, line });
  }
}

// ---------------------------------------------------------------------------
// GRAPH HELPERS
// ---------------------------------------------------------------------------

/** Adjacency map: stationId → list of {neighbor, line} */
export function buildAdjacency(edges: Edge[]): Map<string, Array<{ neighbor: string; line: LineId }>> {
  const adj = new Map<string, Array<{ neighbor: string; line: LineId }>>();
  for (const edge of edges) {
    if (!adj.has(edge.from)) adj.set(edge.from, []);
    if (!adj.has(edge.to)) adj.set(edge.to, []);
    adj.get(edge.from)!.push({ neighbor: edge.to, line: edge.line });
    adj.get(edge.to)!.push({ neighbor: edge.from, line: edge.line });
  }
  return adj;
}

/** Station lookup map */
export function buildStationMap(stations: Station[]): Map<string, Station> {
  return new Map(stations.map(s => [s.id, s]));
}

export const STATION_MAP = buildStationMap(STATIONS_DEDUPED);
export const ADJACENCY = buildAdjacency(EDGES);
