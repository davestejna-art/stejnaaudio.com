# stejnaaudio.com

The Stejna Audio website: plain HTML and one stylesheet. No build step, no frameworks, no cookies, no analytics,
nothing loaded from other sites.

| path | page |
|---|---|
| `index.html` | home: Stejna Mix (hero, screenshots, features) |
| `support/index.html` | /support: contact, compatibility, FAQ |
| `privacy/index.html` | /privacy: the Stejna Mix privacy policy (App Store Connect links here) |
| `404.html` | not found |
| `style.css` | the one stylesheet |
| `img/` | emblem and title SVGs, icons, link-preview image, screenshots (`shots/NN_name-800.webp` and `-1600.webp`) |

The header and footer are repeated in each page; change all of them together.

**Preview:** `python3 -m http.server 8765` in this folder, then open http://localhost:8765/ (links are root-relative,
so opening the files directly won't load the styles).

**Brand:** colours follow the app's `Vfd.h` / `Brand.h`, which cite the brand's source of truth; change them there
first. `tools/make_svg.py` redraws `img/emblem.svg` and `img/vfd-title.svg` from the app's own font table
(`../MAir_iPad_Lab/app/Source/VfdFont.h`).

**Screenshots:** made from `MAir_iPad_Lab/app/renders/store/*.png` (2752 x 2064):

    for f in .../app/renders/store/*.png; do b=$(basename $f .png)
      for w in 800 1600; do cwebp -q 80 -m 6 -resize $w 0 $f -o img/shots/$b-$w.webp; done; done
