/* stejnaaudio.com -- the screenshot viewer, the site's one script.
   A screenshot's link opens the picture in a viewer you page through: the big previous / next keys, a swipe, or the
   arrow keys. The X, Escape, a tap beside the picture and the browser's Back button close it, on the same page.
   Each .shots list is its own set. Without JavaScript the links still open the picture by itself. */
(() => {
  'use strict';
  const galleries = [...document.querySelectorAll('.shots')]
    .map(list => [...list.querySelectorAll('a[href]')].filter(a => a.querySelector('img')))
    .filter(links => links.length);
  if (!galleries.length || !window.HTMLDialogElement) return;

  const icon = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const viewer = document.createElement('dialog');
  viewer.className = 'viewer';
  viewer.setAttribute('aria-label', 'Screenshots');
  viewer.innerHTML = `
    <p class="viewer-count" aria-live="polite"></p>
    <button class="viewer-close" type="button" aria-label="Close">${icon('M6 6l12 12M18 6 6 18')}</button>
    <button class="viewer-side viewer-prev" type="button" aria-label="Previous picture"><span class="viewer-key">${icon('M15 4l-8 8 8 8')}</span></button>
    <div class="viewer-body"><img class="viewer-pic" alt=""><p class="viewer-cap"></p></div>
    <button class="viewer-side viewer-next" type="button" aria-label="Next picture"><span class="viewer-key">${icon('M9 4l8 8-8 8')}</span></button>`;
  document.body.append(viewer);
  const count = viewer.querySelector('.viewer-count');
  const pic = viewer.querySelector('.viewer-pic');
  const cap = viewer.querySelector('.viewer-cap');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const KEY = 'stejnaShot';                 // the history entry the viewer adds, so Back closes it
  const shotIn = state => {
    const s = state && state[KEY];
    return s && galleries[s[0]] && galleries[s[0]][s[1]] ? s : null;
  };
  let cur = [0, 0];

  // Show picture i of gallery g: the thumbnail at once (already loaded), the full size as soon as it arrives.
  function show(g, i, dir = 0) {
    const links = galleries[g];
    i = (i + links.length) % links.length;
    cur = [g, i];
    const a = links[i], thumb = a.querySelector('img'), figcap = a.closest('figure')?.querySelector('figcaption');
    const w = +thumb.getAttribute('width') || thumb.naturalWidth, h = +thumb.getAttribute('height') || thumb.naturalHeight;
    viewer.style.setProperty('--ar', w && h ? w / h : 4 / 3);
    pic.alt = thumb.alt;
    const full = new Image();
    full.src = a.href;
    if (full.complete && full.naturalWidth) pic.src = full.src;
    else {
      pic.src = thumb.currentSrc || thumb.src;
      full.onload = () => { if (cur[0] === g && cur[1] === i) pic.src = full.src; };
    }
    for (const j of [i - 1, i + 1]) new Image().src = links[(j + links.length) % links.length].href;
    cap.innerHTML = figcap ? figcap.innerHTML : '';
    count.textContent = `${i + 1} / ${links.length}`;
    if (dir && pic.animate && !still.matches)
      pic.animate([{ opacity: 0, transform: `translateX(${dir * 48}px)` }, { opacity: 1, transform: 'none' }],
                  { duration: 180, easing: 'ease-out' });
  }

  let shown = false;                          // from open() to its one tidy-up in shut()
  function open(g, i) {
    show(g, i);
    if (!shown) {
      shown = true;
      if (!viewer.open) viewer.showModal();
      document.documentElement.classList.add('viewing');
    }
  }

  // Every way out ends here, once. Leaving by the X, Escape or a tap also takes back the viewer's history entry;
  // leaving by Back (fromHistory) already has.
  function shut(fromHistory) {
    if (viewer.open) viewer.close();
    if (!shown) return;
    shown = false;
    document.documentElement.classList.remove('viewing');
    const a = galleries[cur[0]][cur[1]];
    a.focus({ preventScroll: true });
    a.scrollIntoView({ block: 'nearest', inline: 'nearest' });   // the phone's row lands on the last picture seen
    if (!fromHistory && shotIn(history.state)) history.back();
  }

  function step(dir) {
    show(cur[0], cur[1] + dir, dir);
    if (shotIn(history.state)) history.replaceState({ [KEY]: cur }, '');
  }

  galleries.forEach((links, g) => links.forEach((a, i) => a.addEventListener('click', e => {
    if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // a new tab still works
    e.preventDefault();
    history.pushState({ [KEY]: [g, i] }, '');
    open(g, i);
  })));

  viewer.addEventListener('close', () => { if (!viewer.open) shut(); });   // the browser closed it (Android's back gesture)
  addEventListener('popstate', e => {
    const s = shotIn(e.state);
    if (s) open(s[0], s[1]);                 // Forward, back into the viewer
    else shut(true);                         // Back
  });
  const reopen = shotIn(history.state);      // a reload while the viewer was open
  if (reopen) open(reopen[0], reopen[1]);

  viewer.querySelector('.viewer-prev').addEventListener('click', () => step(-1));
  viewer.querySelector('.viewer-next').addEventListener('click', () => step(1));
  viewer.querySelector('.viewer-close').addEventListener('click', () => shut());
  viewer.addEventListener('click', e => {        // anywhere but the picture, the keys and the count
    if (!e.target.closest('.viewer-pic, button, .viewer-count') && !String(getSelection())) shut();
  });
  document.addEventListener('keydown', e => {
    if (!viewer.open || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'Escape') shut();
    else return;
    e.preventDefault();
  });

  // A one-finger swipe pages; a pinch, or a drag around a zoomed-in picture, doesn't.
  let touch = null;
  viewer.addEventListener('touchstart', e => {
    touch = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  }, { passive: true });
  viewer.addEventListener('touchcancel', () => { touch = null; }, { passive: true });
  viewer.addEventListener('touchend', e => {
    if (!touch || e.touches.length) return;
    const t = e.changedTouches[0], dx = t.clientX - touch.x, dy = t.clientY - touch.y;
    touch = null;
    if (window.visualViewport && visualViewport.scale > 1.05) return;
    if (Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(dy)) step(dx < 0 ? 1 : -1);
  }, { passive: true });
})();
