// "My Pictures": the pictures a kid colored in Crayon (/kids/crayon), kept on
// this device only and served on the kids Puzzle Shelf (/kids/jigsaw) as
// jigsaws of their own (owner, 2026-11-22). Nothing leaves the browser, like
// every other kids save.
//
// sot_kids_my_pictures = [{ id, pic, name, at, src }], newest first. `src` is
// a 960 x 720 JPEG data URL (4:3, the wide jigsaw shape, with room above and
// below so the 3 x 2 cut keeps the whole drawing). Capped at MAX so the store
// stays well inside localStorage; on a full store the oldest go first.

export const MY_PICTURES_KEY = 'sot_kids_my_pictures';
export const MY_MAX = 24;

export function readMyPictures() {
  try {
    const a = JSON.parse(localStorage.getItem(MY_PICTURES_KEY) || '[]');
    return Array.isArray(a) ? a.filter((p) => p && p.id && typeof p.src === 'string' && p.src.startsWith('data:image/')) : [];
  } catch (e) { return []; }
}

export function saveMyPicture(entry) {
  let list = [entry, ...readMyPictures().filter((p) => p.id !== entry.id)].slice(0, MY_MAX);
  while (list.length) {
    try { localStorage.setItem(MY_PICTURES_KEY, JSON.stringify(list)); return true; } catch (e) {
      if (list.length === 1) return false;
      list = list.slice(0, -1);
    }
  }
  return false;
}

export function removeMyPicture(id) {
  try { localStorage.setItem(MY_PICTURES_KEY, JSON.stringify(readMyPictures().filter((p) => p.id !== id))); } catch (e) { /* ignore */ }
}

// A small stable number from the id, so the jigsaw cut and shuffle are the
// same every time this picture is played.
function numOf(id) {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 9000) + 1000;
}

// A saved picture as an object URL. The jigsaw draws the picture once per
// piece (tray, board and the lifted copy); handing every one of those SVG
// <image>s a ~80 KB data URL drew black squares on iPad Safari (owner,
// 2026-11-22). A blob URL behaves like the photo puzzles' normal image URLs.
const urlCache = new Map();
export function blobUrlOf(dataUrl) {
  if (urlCache.has(dataUrl)) return urlCache.get(dataUrl);
  try {
    const comma = dataUrl.indexOf(',');
    const mime = (dataUrl.slice(0, comma).match(/^data:([^;,]+)/) || [])[1] || 'image/jpeg';
    const bin = atob(dataUrl.slice(comma + 1));
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([u8], { type: mime }));
    urlCache.set(dataUrl, url);
    return url;
  } catch (e) { return dataUrl; }
}

// The shape the Puzzle Shelf uses for a board (client only: makes a blob URL).
export function myPictureBoard(p) {
  return { key: `my-${p.id}`, g: 'my', num: numOf(p.id), name: p.name, src: blobUrlOf(p.src), tall: false, mine: true, at: p.at };
}
