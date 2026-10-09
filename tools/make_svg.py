#!/usr/bin/env python3
"""Draws the site's two brand SVGs from the app's own sources, so the web mark cannot drift from the app's:
  img/emblem.svg       the Stejna Audio emblem (Brand.h emblem(), no bezel): dot-matrix S in the measured cyan, one amber anode
  img/vfd-title.svg    "STEJNA MIX" as a VFD readout (Vfd.h paintDirect): unlit grid first, lit anodes, three filaments
The 5x7 font is read from the app repo next to this one (not copied): ../MAir_iPad_Lab/app/Source/VfdFont.h.
Colours: the app's Vfd.h / Brand.h, which cite the brand's source of truth.
Usage: python3 tools/make_svg.py [path/to/VfdFont.h]   (run from the site folder)"""
import re, sys

FONT_H = sys.argv[1] if len(sys.argv) > 1 else '../MAir_iPad_Lab/app/Source/VfdFont.h'
font = {chr(int(h, 16)): [int(v) for v in rows.split(',')]
        for h, rows in re.findall(r'\{\s*0x([0-9A-Fa-f]+),\s*\{([^}]*)\}', open(FONT_H).read())}

CORE, HALO, GLOW, UNLIT, GLASS, FILAMENT = '#B9FFFF', '#72E9E9', '#2CA0A4', '#0A2C35', '#030E11', '#FFF4E2'
AMBER, AMBER_GLOW, AMBER_CORE = '#F5A623', '#996816', '#F9CE86'     # Brand.h AMBER; JUCE darker(0.6) and 45 % toward white

def f(v): return ('%.2f' % v).rstrip('0').rstrip('.')

def defs(p):
    dot = lambda k, halo, core: (f'<g id="{k}"><circle r="{f(1.05*p)}" fill="url(#b{k})"/><circle r="{f(.5*p)}" fill="{halo}"/>'
                                 f'<circle r="{f(.25*p)}" fill="{core}"/></g>')
    blooms = ''.join(f'<radialGradient id="b{n}"><stop offset="0" stop-color="{c}" stop-opacity=".34"/>'
                     f'<stop offset=".45" stop-color="{c}" stop-opacity=".10"/><stop offset="1" stop-color="{c}" stop-opacity="0"/></radialGradient>'
                     for n, c in (('c', GLOW), ('a', AMBER_GLOW)))
    return f'<defs>{blooms}{dot("c", HALO, CORE)}{dot("a", AMBER, AMBER_CORE)}</defs>'

def unlit(cx, cy, p): return f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(.36*p)}" fill="{UNLIT}" fill-opacity=".95"/>'

def lit(cx, cy, amber=False):            # Vfd.h litDot (the symbols in defs): bloom to 2.1 r, the halo at r, the core at 0.5 r; r = half the pitch
    return f'<use href="#{"a" if amber else "c"}" x="{f(cx)}" y="{f(cy)}"/>'

def grid(x, y, w, h, cw, ch, cols, rows, p, pid):   # the unlit anodes as one pattern tile: `cols` x `rows` anodes per cw x ch tile
    dots = ''.join(unlit((c+.5)*p, (r+.5)*p, p) for r in range(rows) for c in range(cols))
    return (f'<pattern id="{pid}" patternUnits="userSpaceOnUse" x="{f(x)}" y="{f(y)}" width="{f(cw)}" height="{f(ch)}">{dots}</pattern>'
            f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" fill="url(#{pid})"/>')

def emblem(side=100.0, corner=.18):      # Brand.h emblem(..., bezel = false, corner)
    rad = max(0.0, side*corner - side*.06); cols, rows = 7, 9
    p = side / (rows + 1.2); ox = side/2 - cols*p/2; oy = side/2 - rows*p/2
    S = font['S']
    def on(c, r): return 1 <= c <= 5 and 1 <= r <= 7 and (S[r-1] >> (5-c)) & 1
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(side)} {f(side)}">', defs(p),
           f'<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06161A"/><stop offset="1" stop-color="#051317"/></linearGradient>',
           f'<rect width="{f(side)}" height="{f(side)}" rx="{f(rad)}" fill="url(#g)"/>',
           f'<rect x="{f(side*.012)}" y="{f(side*.012)}" width="{f(side*.976)}" height="{f(side*.976)}" rx="{f(rad)}" fill="{GLASS}"/>']
    dots = [(ox + (c+.5)*p, oy + (r+.5)*p, c, r) for r in range(rows) for c in range(cols)]
    out += [grid(ox, oy, cols*p, rows*p, p, p, 1, 1, p, 'u')]
    out += [lit(x, y, amber=(c == 6 and r == 7)) for x, y, c, r in dots if (c == 6 and r == 7) or on(c, r)]
    h = max(.6, min(.6, p*.233))
    out += [f'<rect x="{f(p*.4)}" y="{f(oy + p + 7*p*k/4)}" width="{f(side - p*.8)}" height="{f(h)}" fill="{FILAMENT}" fill-opacity=".085"/>' for k in (1, 2, 3)]
    return ''.join(out) + '</svg>\n'

def readout(text, p=10.0):               # Vfd.h paintDirect, with one pitch of glass all round
    cw = 6*p; n = len(text); W = n*cw + p; H = 7*p + 2*p
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(W)} {f(H)}" role="img" aria-label="{text.title()}">', defs(p),
           f'<rect width="{f(W)}" height="{f(H)}" rx="{f(p*.5)}" fill="{GLASS}"/>']
    cells = [(p + ci*cw + rx*p + p/2, p + ry*p + p/2, (font.get(ch, [31]*7)[ry] >> (4-rx)) & 1)
             for ci, ch in enumerate(text) for ry in range(7) for rx in range(5)]
    out += [grid(p, p, n*cw, 7*p, cw, 7*p, 5, 7, p, 'u')]
    out += [lit(x, y) for x, y, on in cells if on]
    t = max(.5, p*.233)
    out += [f'<rect x="{f(p)}" y="{f(p + 7*p*k/4 + .5 - t/2)}" width="{f(n*cw)}" height="{f(t)}" fill="{FILAMENT}" fill-opacity=".085"/>' for k in (1, 2, 3)]
    return ''.join(out) + '</svg>\n'

open('img/emblem.svg', 'w').write(emblem())
open('img/vfd-title.svg', 'w').write(readout('STEJNA MIX'))
print('wrote img/emblem.svg, img/vfd-title.svg')
