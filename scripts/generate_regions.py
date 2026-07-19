#!/usr/bin/env python3
"""generate_regions.py — rebuilds public/provinces.geojson.

Herodian-era (~AD 29-33) region boundaries assembled from a shared-border network:
the Mediterranean coast, Jordan river, Yarmuk, and Dead Sea line are extracted from
world-atlas countries-10m (so region edges match the rendered basemap exactly);
inland borders are hand-anchored polylines smoothed with Chaikin's algorithm.
Every border polyline is defined once and shared by both adjacent regions, so
adjacency is exact. Rings are wound planar-clockwise (d3-geo's exterior-ring
convention — planar-CCW renders as the sphere's complement and floods the map).

Validates that every city in src/data/gospels-data.json falls inside its declared
province before writing. Run from the repo root:

    python3 scripts/generate_regions.py
"""
import json

# ── extract natural-feature chains from the 10m basemap ──
t = json.load(open('node_modules/world-atlas/countries-10m.json'))
sc = t['transform']['scale']; tr = t['transform']['translate']
chains = []
lo_lon, hi_lon, lo_lat, hi_lat = 33.8, 36.4, 30.6, 34.4
for arc in t['arcs']:
    x, y = 0, 0; run = []
    for dx, dy in arc:
        x += dx; y += dy
        p = (round(x*sc[0]+tr[0], 4), round(y*sc[1]+tr[1], 4))
        if lo_lon <= p[0] <= hi_lon and lo_lat <= p[1] <= hi_lat:
            run.append(p)
        else:
            if len(run) > 5: chains.append(run)
            run = []
    if len(run) > 5: chains.append(run)
chains.sort(key=len, reverse=True)
C = chains
# C[0] West Bank outline (unused — anachronistic)   C[1] Lebanon coast
# C[2] Yarmuk west run + Jordan mid                 C[4] Jordan river + Dead Sea line
# C[5] Israel-Lebanon line                          C[6] Israel coast
# C[7] Yarmuk east / Syria-Jordan border

BUF = 0.022   # seaward buffer so shoreline cities (Tyre etc.) test inside their region
coast_il  = [(p[0]-BUF, p[1]) for p in sorted(C[6], key=lambda p: -p[1])]
coast_lb  = [(p[0]-BUF, p[1]) for p in sorted(C[1], key=lambda p: -p[1])]
# west-bow the river reach at Bethany-beyond-Jordan (traditional site is east-bank;
# the generalized 10m border juts east exactly there)
jordan_lo = [((35.539 if (31.82 < lat < 31.85 and lon > 35.542) else lon), lat) for lon, lat in C[4]]
blue      = sorted(C[5], key=lambda p: p[0])
yarm_w_j  = C[2]
yarm_e    = list(reversed(C[7]))

def between(chain, a, b, key=1):
    lo, hi = min(a, b), max(a, b)
    return [p for p in chain if lo <= p[key] <= hi]

def nearest(chain, lat):
    return min(chain, key=lambda p: abs(p[1]-lat))

def chaikin(pts, n=3):
    for _ in range(n):
        out = [pts[0]]
        for a, b in zip(pts[:-1], pts[1:]):
            out.append((0.75*a[0]+0.25*b[0], 0.75*a[1]+0.25*b[1]))
            out.append((0.25*a[0]+0.75*b[0], 0.25*a[1]+0.75*b[1]))
        out.append(pts[-1]); pts = out
    return pts

def rev(x):
    return list(reversed(x))

ji = min(range(len(yarm_w_j)), key=lambda i: abs(yarm_w_j[i][0]-35.563)+abs(yarm_w_j[i][1]-32.626))
jordan_mid = yarm_w_j[ji:]

c_carmel = nearest(coast_il, 32.720)   # Phoenicia | Galilee | Samaria coast point
c_sam_s  = nearest(coast_il, 32.090)   # Samaria | Judaea coast point
c_jud_s  = coast_il[-1]
c_ph_n   = nearest(coast_lb, 33.660)

T  = (35.402, 32.516)     # Galilee | Samaria | Decapolis triple point (Scythopolis lobe W corner)
RN = (35.5738, 32.5732)   # lobe N corner on the river
RS = (35.5666, 32.4432)   # lobe S corner on the river
LK = (35.6489, 32.8460)   # Ituraea | Decapolis split on the lake's east shore

lake_w    = chaikin([(35.588,32.886),(35.548,32.868),(35.534,32.826),(35.540,32.788),(35.556,32.740),(35.571,32.704)])
lake_e_s  = chaikin([(35.571,32.704),(35.616,32.724),(35.648,32.772),(35.6435,32.818),LK])   # bowed in at Kursi/Gergesa
lake_e_n  = chaikin([LK,(35.636,32.868),(35.588,32.886)])
jordan_up = chaikin([(35.612,33.060),(35.628,32.975),(35.588,32.886)])
bridge    = [(35.571,32.704),(35.567,32.664),(35.563,32.626)]   # lake S tip -> Yarmuk confluence reach

YS = min(yarm_e, key=lambda p: abs(p[0]-36.00))
itu_dec   = chaikin([LK,(35.820,32.800),(35.930,32.750),YS])
yarm_cut2 = [p for p in yarm_e if YS[0] <= p[0] <= 36.185]
YE = yarm_cut2[-1]

lobeN     = chaikin([RN,(35.470,32.545),T])
lobeS     = chaikin([T,(35.470,32.452),RS])
gal_south = chaikin([c_carmel,(35.148,32.640),(35.290,32.575),T])
sam_south = chaikin([c_sam_s,(35.120,32.030),(35.300,31.990),(35.440,31.962),(35.5342,31.9299)])
jud_south = chaikin([c_jud_s,(34.750,31.300),(35.050,31.180),(35.300,31.130),(35.450,31.150)])
ds_ext    = chaikin([jordan_lo[-1],(35.440,31.350),(35.428,31.245),(35.450,31.150)])
phoen_in  = chaikin([c_carmel,(35.170,32.860),(35.240,33.000),(35.296,33.078)])
phoen_n   = chaikin([(35.296,33.078),(35.360,33.250),(35.450,33.430),(35.420,33.560),c_ph_n])
blue_gal  = between(blue, 35.296, 35.545, key=0)
gal_ne    = chaikin([blue_gal[-1],(35.585,33.055),(35.612,33.060)])
philip_n  = chaikin([(35.612,33.060),(35.680,33.300),(35.850,33.470),(36.050,33.400),(36.110,33.250)])
philip_e  = chaikin([(36.110,33.250),(36.250,33.050),(36.300,32.800),YE])
decap_e   = chaikin([YE,(36.150,32.250),(36.100,32.050),(36.020,31.780)])
decap_s   = chaikin([(36.020,31.780),(35.900,31.620),(35.740,31.480)])
perea_de  = chaikin([RS,(35.700,32.380),(35.780,32.180),(35.800,31.950),(35.760,31.700),(35.740,31.480)])
perea_s   = chaikin([(35.740,31.480),(35.550,31.410),(35.440,31.350)])

coast_ph  = between(coast_lb, c_ph_n[1], 33.088) + between(coast_il, 33.088, c_carmel[1])
coast_sam = between(coast_il, c_carmel[1], c_sam_s[1])
coast_jud = between(coast_il, c_sam_s[1], c_jud_s[1])
jm_gal    = between(jordan_mid, 32.626, RN[1])
jm_lobe   = between(jordan_mid, RS[1], 32.3841)
jl_a      = between(jordan_lo, 32.3841, 31.9299)
jl_b      = between(jordan_lo, 31.9299, jordan_lo[-1][1])
ds_jud    = between(ds_ext, jordan_lo[-1][1], 31.350)
ds_jud_s  = between(ds_ext, 31.350, 31.150)

def ring(*segs):
    pts = []
    for s in segs:
        for p in s:
            if not pts or (abs(p[0]-pts[-1][0])+abs(p[1]-pts[-1][1])) > 1e-9:
                pts.append(p)
    if pts[0] != pts[-1]: pts.append(pts[0])
    area = sum(pts[i][0]*pts[i+1][1] - pts[i+1][0]*pts[i][1] for i in range(len(pts)-1))
    if area > 0: pts = list(reversed(pts))   # enforce planar-CW for d3-geo
    return [[round(x, 4), round(y, 4)] for x, y in pts]

R = {
 'Phoenicia': ('Province of Syria',    ring(coast_ph, phoen_in, phoen_n)),
 'Galilee':   ('Herod Antipas',        ring(blue_gal, gal_ne, jordan_up, lake_w, bridge, jm_gal, rev(lobeN), rev(gal_south), phoen_in)),
 'Ituraea':   ('Herod Philip',         ring(philip_n, philip_e, rev(yarm_cut2), rev(itu_dec), rev(lake_e_n), rev(jordan_up))),
 'Decapolis': ('League of ten cities', ring(rev(bridge), lake_e_s, itu_dec, yarm_cut2, decap_e, decap_s, rev(perea_de), rev(lobeS), lobeN, rev(jm_gal))),
 'Samaria':   ('Roman prefect',        ring(coast_sam, sam_south, rev(jl_a), rev(jm_lobe), rev(lobeS), rev(gal_south))),
 'Judaea':    ('Roman prefect',        ring(coast_jud, jud_south, rev(ds_jud_s), rev(ds_jud), rev(jl_b), rev(sam_south))),
 'Peraea':    ('Herod Antipas',        ring(jm_lobe, jl_a[1:], jl_b[1:], ds_jud[1:], rev(perea_s), rev(perea_de))),
}

feats = [{'type': 'Feature',
          'properties': {'name': n, 'ruler': r,
                         'source': 'Redrawn along natural features (10m coastline, Jordan, Yarmuk, Dead Sea); informed by OpenBible.info regions (CC-BY 4.0)'},
          'geometry': {'type': 'Polygon', 'coordinates': [rp]}}
         for n, (r, rp) in R.items()]
json.dump({'type': 'FeatureCollection', 'features': feats}, open('public/provinces.geojson', 'w'))
print('written:', [(f['properties']['name'], len(f['geometry']['coordinates'][0])) for f in feats])

# ── validation: every city must fall inside its declared province ──
def pip(pt, rp):
    x, y = pt; inside = False
    for i in range(len(rp)-1):
        x1, y1 = rp[i]; x2, y2 = rp[i+1]
        if (y1 > y) != (y2 > y) and x < (x2-x1)*(y-y1)/(y2-y1)+x1:
            inside = not inside
    return inside

name2id = {'Phoenicia': 'phoenicia', 'Galilee': 'galilee', 'Ituraea': 'iturea',
           'Decapolis': 'decapolis', 'Samaria': 'samaria', 'Judaea': 'judea', 'Peraea': 'perea'}
d = json.load(open('src/data/gospels-data.json'))
bad = [(c['id'], c['province']) for c in d['cities'] if c.get('province')
       and c['province'] not in [name2id[n] for n, (r, rp) in R.items() if pip(c['coords'], rp)]]
if bad:
    raise SystemExit(f'containment errors: {bad}')
print('all cities fall inside their declared regions')
