# stejnaaudio.com

The Stejna Audio website: plain HTML, one stylesheet and one small script. No build step, no frameworks, no cookies,
no analytics, nothing loaded from other sites.

| path | page |
|---|---|
| `index.html` | home: Stejna Mix (hero, the App Preview video, Pocket Mix, StompTap, screenshots, features) |
| `pocket-mix/index.html` | /pocket-mix: Stejna Mix on iPhone |
| `support/index.html` | /support: contact, compatibility, FAQ |
| `privacy/index.html` | /privacy: the Stejna Mix privacy policy (App Store Connect links here) |
| `404.html` | not found |
| `viewer.js` | the screenshot viewer: a screenshot opens big, to page through with the arrows, a swipe or the arrow keys; the X, Escape, a tap beside it or Back closes it. Pages with a `.shots` list load it; without JavaScript the link opens the picture by itself |
| `style.css` | the one stylesheet |
| `img/` | emblem and title SVGs, icons, link-preview image, iPad screenshots (`shots/NN_name-800.webp` and `-1600.webp`), iPhone screenshots (`phone/NN_name-900.webp` and `-1800.webp`) |
| `video/` | the App Previews for the web, each silent with a poster: iPad (`stejna-mix-ipad.mp4`, 1280 x 960) and Pocket Mix (`pocket-mix-iphone.mp4`, 1280 x 590) |

The header and footer are repeated in each page; change all of them together.

**Preview:** `python3 -m http.server 8765` in this folder, then open http://localhost:8765/ (links are root-relative,
so opening the files directly won't load the styles).

**Brand:** colours follow the app's `Vfd.h` / `Brand.h`, which cite the brand's source of truth; change them there
first. `tools/make_svg.py` redraws `img/emblem.svg` and `img/vfd-title.svg` from the app's own font table
(`../MAir_iPad_Lab/app/Source/VfdFont.h`).

**Screenshots:** made from `MAir_iPad_Lab/app/renders/store/*.png` (2752 x 2064):

    for f in .../app/renders/store/*.png; do b=$(basename $f .png)
      for w in 800 1600; do cwebp -q 80 -m 6 -resize $w 0 $f -o img/shots/$b-$w.webp; done; done

**iPhone screenshots:** made from `MAir_iPad_Lab_phone/app/renders/store/iphone/*.png` (2868 x 1320, `tools/phone_store_screens.sh`
in the app repo), the same way at 900 and 1800 wide.

**The video:** the App Store preview with captions (`app/renders/review/StejnaMix_app_preview_30s_captions.mov`), re-encoded with
the app repo's `tools/transcode_video.swift <in> video/stejna-mix-ipad.mp4 1280 960 3000000` (H.264, no sound track); the poster is
the frame at 23 s. It plays on the page itself (`preload="none"`), so nothing loads until someone presses play.
