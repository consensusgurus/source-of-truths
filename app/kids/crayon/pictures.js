// Crayon's outline pictures (owner, 2026-11-22). Each picture is drawn in a
// 400 x 360 box as a list of PARTS a kid can color, in paint order: a later
// part sits on top of an earlier one, and its outline is drawn with it, so a
// part in front hides the lines of the parts behind it. `decor` is ink detail
// (eyes, whiskers, a doorknob) drawn last and never colored.
//
// A part is [id, tag, attrs]. Keep shapes simple and big: these are for
// small fingers. Every picture starts with `back`, the whole frame.

const BACK = ['back', 'rect', { x: 2, y: 2, width: 396, height: 356, rx: 10 }];
const ground = (id, d) => [id, 'path', { d }];
const star = (cx, cy, r) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${Math.round((cx + rr * Math.cos(a)) * 10) / 10} ${Math.round((cy + rr * Math.sin(a)) * 10) / 10}`);
  }
  return `M${pts.join(' L')} Z`;
};

export const PICTURES = [
  {
    id: 'house', name: 'Little House', band: '#e3f4f7',
    parts: [
      BACK,
      ['cloud', 'path', { d: 'M50 100 a20 20 0 0 1 10 -36 a26 26 0 0 1 48 -6 a20 20 0 0 1 22 42 z' }],
      ['sun', 'circle', { cx: 330, cy: 72, r: 34 }],
      ground('grass', 'M2 292 Q100 268 200 286 T398 280 V348 a10 10 0 0 1 -10 10 H12 a10 10 0 0 1 -10 -10 Z'),
      ['chimney', 'rect', { x: 208, y: 104, width: 24, height: 52 }],
      ['walls', 'rect', { x: 90, y: 170, width: 160, height: 124 }],
      ['roof', 'path', { d: 'M72 176 L170 94 L268 176 Z' }],
      ['door', 'rect', { x: 152, y: 226, width: 36, height: 68, rx: 4 }],
      ['window1', 'rect', { x: 106, y: 194, width: 34, height: 34, rx: 3 }],
      ['window2', 'rect', { x: 200, y: 194, width: 34, height: 34, rx: 3 }],
      ['trunk', 'rect', { x: 300, y: 204, width: 20, height: 92 }],
      ['leaves', 'circle', { cx: 310, cy: 186, r: 42 }],
    ],
    decor: [['circle', { cx: 181, cy: 262, r: 3.5 }]],
  },
  {
    id: 'cat', name: 'Sleepy Cat', band: '#fdeede',
    parts: [
      BACK,
      ['rug', 'ellipse', { cx: 205, cy: 300, rx: 175, ry: 42 }],
      ['tail', 'path', { d: 'M270 252 Q352 244 342 172 Q338 150 320 158 Q328 222 262 230 Z' }],
      ['body', 'ellipse', { cx: 215, cy: 240, rx: 92, ry: 62 }],
      ['paw1', 'ellipse', { cx: 160, cy: 294, rx: 24, ry: 13 }],
      ['paw2', 'ellipse', { cx: 236, cy: 296, rx: 24, ry: 13 }],
      ['ear1', 'path', { d: 'M120 122 L128 60 L170 98 Z' }],
      ['ear2', 'path', { d: 'M230 122 L222 60 L180 98 Z' }],
      ['head', 'circle', { cx: 175, cy: 140, r: 62 }],
      ['nose', 'path', { d: 'M166 150 L184 150 L175 161 Z' }],
    ],
    decor: [
      ['path', { d: 'M140 132 Q150 141 160 132 M190 132 Q200 141 210 132', fill: 'none' }],
      ['path', { d: 'M175 161 Q169 172 159 167 M175 161 Q181 172 191 167', fill: 'none' }],
      ['path', { d: 'M120 152 L146 156 M120 166 L146 162 M230 152 L204 156 M230 166 L204 162', fill: 'none' }],
    ],
  },
  {
    id: 'fish', name: 'Happy Fish', band: '#eaf6ef',
    parts: [
      BACK,
      ground('sand', 'M2 302 Q120 282 220 302 T398 294 V348 a10 10 0 0 1 -10 10 H12 a10 10 0 0 1 -10 -10 Z'),
      ['weed1', 'path', { d: 'M58 306 Q38 244 64 198 Q80 244 70 304 Z' }],
      ['weed2', 'path', { d: 'M340 300 Q328 232 352 188 Q368 236 354 298 Z' }],
      ['fin', 'path', { d: 'M150 114 Q190 58 242 116 Z' }],
      ['tail', 'path', { d: 'M272 172 L350 110 L340 176 L350 242 Z' }],
      ['body', 'ellipse', { cx: 190, cy: 176, rx: 100, ry: 70 }],
      ['stripe', 'path', { d: 'M214 108.05 A100 70 0 0 1 240 115.38 L240 236.62 A100 70 0 0 1 214 243.95 Z' }],
      ['flipper', 'path', { d: 'M184 190 Q212 210 230 186 Q210 168 184 190 Z' }],
      ['eye', 'circle', { cx: 126, cy: 160, r: 15 }],
      ['bubble1', 'circle', { cx: 108, cy: 84, r: 11 }],
      ['bubble2', 'circle', { cx: 86, cy: 52, r: 8 }],
      ['bubble3', 'circle', { cx: 116, cy: 28, r: 6 }],
    ],
    decor: [
      ['circle', { cx: 129, cy: 160, r: 6 }],
      ['path', { d: 'M94 188 Q104 196 112 189', fill: 'none' }],
    ],
  },
  {
    id: 'rocket', name: 'Rocket', band: '#f1ecfb',
    parts: [
      BACK,
      ['planet', 'circle', { cx: 324, cy: 82, r: 40 }],
      ['star1', 'path', { d: star(70, 70, 20) }],
      ['star2', 'path', { d: star(96, 250, 16) }],
      ['star3', 'path', { d: star(330, 260, 18) }],
      ['flame', 'path', { d: 'M176 262 Q200 346 224 262 Z' }],
      ['fin1', 'path', { d: 'M166 200 L118 274 L166 256 Z' }],
      ['fin2', 'path', { d: 'M234 200 L282 274 L234 256 Z' }],
      ['body', 'path', { d: 'M200 36 Q254 100 242 262 H158 Q146 100 200 36 Z' }],
      ['nose', 'path', { d: 'M200 36 Q226 66 233 98 H167 Q174 66 200 36 Z' }],
      ['window', 'circle', { cx: 200, cy: 160, r: 25 }],
      ['band', 'rect', { x: 156, y: 238, width: 88, height: 24, rx: 4 }],
    ],
    decor: [],
  },
  {
    id: 'flower', name: 'Flower', band: '#fde7f0',
    parts: [
      BACK,
      ['sun', 'circle', { cx: 340, cy: 62, r: 30 }],
      ground('grass', 'M2 304 Q100 284 200 300 T398 296 V348 a10 10 0 0 1 -10 10 H12 a10 10 0 0 1 -10 -10 Z'),
      ['stem', 'path', { d: 'M194 180 H206 V318 H194 Z' }],
      ['leaf1', 'path', { d: 'M194 282 Q150 250 126 270 Q158 302 194 292 Z' }],
      ['leaf2', 'path', { d: 'M206 250 Q250 220 274 240 Q242 272 206 262 Z' }],
      ['petal1', 'circle', { cx: 200, cy: 72, r: 34 }],
      ['petal2', 'circle', { cx: 250, cy: 104, r: 34 }],
      ['petal3', 'circle', { cx: 240, cy: 160, r: 34 }],
      ['petal4', 'circle', { cx: 160, cy: 160, r: 34 }],
      ['petal5', 'circle', { cx: 150, cy: 104, r: 34 }],
      ['middle', 'circle', { cx: 200, cy: 122, r: 34 }],
    ],
    decor: [],
  },
  {
    id: 'car', name: 'Little Car', band: '#fdeaea',
    parts: [
      BACK,
      ['sun', 'circle', { cx: 70, cy: 70, r: 32 }],
      ground('road', 'M2 282 H398 V348 a10 10 0 0 1 -10 10 H12 a10 10 0 0 1 -10 -10 Z'),
      ['body', 'path', { d: 'M40 256 V214 Q40 194 62 192 L110 188 L150 132 H262 L302 188 L346 194 Q364 198 364 216 V256 Z' }],
      ['window1', 'path', { d: 'M162 144 H202 V188 H130 Z' }],
      ['window2', 'path', { d: 'M212 144 H254 L286 188 H212 Z' }],
      ['light', 'rect', { x: 340, y: 204, width: 20, height: 14, rx: 3 }],
      ['wheel1', 'circle', { cx: 116, cy: 256, r: 34 }],
      ['wheel2', 'circle', { cx: 290, cy: 256, r: 34 }],
      ['hub1', 'circle', { cx: 116, cy: 256, r: 13 }],
      ['hub2', 'circle', { cx: 290, cy: 256, r: 13 }],
    ],
    decor: [['path', { d: 'M207 196 V244 M196 210 H186', fill: 'none' }]],
  },
  {
    id: 'turtle', name: 'Turtle', band: '#eaf6ef',
    parts: [
      BACK,
      ['sun', 'circle', { cx: 70, cy: 66, r: 30 }],
      ground('grass', 'M2 296 Q110 276 210 294 T398 288 V348 a10 10 0 0 1 -10 10 H12 a10 10 0 0 1 -10 -10 Z'),
      ['tail', 'path', { d: 'M74 238 L36 252 L76 258 Z' }],
      ['leg1', 'ellipse', { cx: 108, cy: 262, rx: 19, ry: 28 }],
      ['leg2', 'ellipse', { cx: 162, cy: 270, rx: 19, ry: 28 }],
      ['leg3', 'ellipse', { cx: 240, cy: 270, rx: 19, ry: 28 }],
      ['leg4', 'ellipse', { cx: 292, cy: 262, rx: 19, ry: 28 }],
      ['head', 'circle', { cx: 334, cy: 218, r: 34 }],
      ['shell', 'path', { d: 'M60 252 Q70 120 200 120 Q330 120 340 252 Z' }],
      ['plate1', 'path', { d: 'M88 244 Q94 182 150 154 L160 198 L140 244 Z' }],
      ['plate2', 'path', { d: 'M170 152 H230 L250 198 L230 244 H170 L150 198 Z' }],
      ['plate3', 'path', { d: 'M312 244 Q306 182 250 154 L240 198 L260 244 Z' }],
    ],
    decor: [
      ['circle', { cx: 344, cy: 210, r: 4.5 }],
      ['path', { d: 'M336 232 Q348 240 358 230', fill: 'none' }],
    ],
  },
  {
    id: 'butterfly', name: 'Butterfly', band: '#fdeede',
    parts: [
      BACK,
      ['wing1', 'ellipse', { cx: 148, cy: 238, rx: 62, ry: 52 }],
      ['wing2', 'ellipse', { cx: 252, cy: 238, rx: 62, ry: 52 }],
      ['wing3', 'ellipse', { cx: 132, cy: 134, rx: 86, ry: 66 }],
      ['wing4', 'ellipse', { cx: 268, cy: 134, rx: 86, ry: 66 }],
      ['spot1', 'circle', { cx: 118, cy: 124, r: 22 }],
      ['spot2', 'circle', { cx: 282, cy: 124, r: 22 }],
      ['spot3', 'circle', { cx: 144, cy: 244, r: 17 }],
      ['spot4', 'circle', { cx: 256, cy: 244, r: 17 }],
      ['body', 'ellipse', { cx: 200, cy: 188, rx: 15, ry: 92 }],
      ['head', 'circle', { cx: 200, cy: 86, r: 21 }],
    ],
    decor: [['path', { d: 'M193 68 Q180 30 156 26 M207 68 Q220 30 244 26', fill: 'none' }]],
  },
];

export const PICTURE_MAP = Object.fromEntries(PICTURES.map((p) => [p.id, p]));

// How many parts a kid colors (the frame counts: it is the sky, the water).
export const partCount = (p) => p.parts.length;
