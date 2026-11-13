BOARDS = {}
BOARDS['kyoto'] = dict(src='jig38.jpg', ops=[])
BOARDS['havana'] = dict(src='jig18.jpg', ops=[])
BOARDS['rialto'] = dict(src='jig14.jpg', ops=[])
BOARDS['windmill'] = dict(src='jig27.jpg', ops=[])
BOARDS['viron'] = dict(src='jig51.jpg', ops=[])
BOARDS['atrani'] = dict(src='jig9.jpg', ops=[])
BOARDS['torii'] = dict(src='jig28.jpg', ops=[])
BOARDS['zrinski'] = dict(src='jig34.jpg', ops=[])
BOARDS['frankfurt'] = dict(src='jig44.jpg', ops=[])
BOARDS['poodle'] = dict(src='jig36.jpg', ops=[])
BOARDS['bulldogs'] = dict(src='jig2.jpg', ops=[])
BOARDS['dingle'] = dict(src='jig49.jpg', ops=[])
BOARDS['lviv'] = dict(src='jig61.jpg', ops=[])
BOARDS['nyhavn'] = dict(src='jig5.jpg', ops=[])
BOARDS['masks'] = dict(src='jig24.jpg', ops=[])
BOARDS['buns'] = dict(src='jig7.jpg', ops=[])
BOARDS['kyoto']['ops'] = [
 ('copy', dict(label='The small manhole cover in the road', src=(452,584,542,606), to=(497,564))),
 ('recolor', dict(label='The middle paper umbrella turned red', box=(888,248,1014,404), seed=(945,330), by='lab', tol=26, hue=2, set_sat=150, val=0.92)),
 ('recolor', dict(label='The sign on the wooden box turned blue', box=(196,520,246,592), seed=(220,555), tol=10, hue=112, comp=False, min_s=90)),
 ('copy', dict(label='The small lettering on the wooden signpost', src=(957,512,985,574), to=(1004,543), shape='rect')),
 ('recolor', dict(label='The leaves at the top right turned red', box=(1030,0,1200,78), seed=(1160,25), tol=13, hue=3, comp=False, min_s=95, min_v=70, sat=1.1)),
 ('recolor', dict(label='The orange hanging sign turned blue', box=(292,254,326,312), seed=(308,283), tol=10, hue=108, comp=False, min_s=80)),
 ('flip', dict(label='The poster of the woman is mirrored', box=(642,424,684,498))),
]

BOARDS['havana']['ops'] = [
 ('recolor', dict(label='The big car changed color', box=(258,476,704,684), seed=(430,560), tol=12, hue=176, comp=False, min_s=70, sat=1.05)),
 ('remove', dict(label='One head of the second street lamp', shape=('ell',956,252,22,14), rad=5, grain=0)),
 ('copy', dict(label='An extra cloud in the sky', src=(722,333,802,372), to=(350,285))),
 ('hfill', dict(label='One head of the tallest street lamp', shape=('box',505,73,549,105), vertical=True)),
 ('remove', dict(label='A white dash on the road', shape=('box',938,625,1016,647), rad=5)),
 ('hfill', dict(label='The tall building on the left skyline', shape=('box',313,504,343,546))),
 ('recolor', dict(label='The far car changed color', box=(1050,538,1160,600), seed=(1100,575), tol=16, hue=24, comp=False, min_s=28, sat=2.2)),
]

BOARDS['rialto']['ops'] = [
 ('recolor', dict(label='The blue boat hull turned red', box=(0,452,240,514), seed=(40,492), tol=12, hue=2, comp=False, min_s=70)),
 ('recolor', dict(label='The flag on the left building changed color', box=(70,250,102,322), seed=(88,290), tol=12, hue=110, comp=False, min_s=80)),
 ('recolor', dict(label='The red banner on the corner building turned green', box=(46,136,84,180), seed=(64,158), tol=12, hue=62, comp=False, min_s=70)),
 ('copy', dict(label='The small white boat under the bridge', src=(758,474,838,514), to=(797,457))),
 ('recolor', dict(label='The pink building on the right turned blue', box=(1036,246,1094,392), seed=(1060,330), tol=9, hue=104, comp=False, min_s=70)),
 ('copy', dict(label='An extra boat on the water', src=(1012,490,1108,550), to=(930,690))),
 ('recolor', dict(label='The red awnings along the quay turned green', box=(0,376,426,421), seed=(150,396), tol=8, hue=64, comp=False, min_s=110, min_v=60)),
]

BOARDS['windmill']['ops'] = [
 ('hfill', dict(label='The top sail of the windmill', shape=('box',858,96,920,226))),
 ('fill', dict(label='The name on the black sign', shape=('box',960,479,1025,501), pick='dark', only='bright')),
 ('recolor', dict(label='The red boat turned blue', box=(606,556,668,646), seed=(637,582), tol=12, hue=110, comp=False, min_s=80)),
 ('hfill', dict(label='The chimney on the far right house', shape=('box',1162,362,1193,385))),
 ('hfill', dict(label='The bird on the wooden post', shape=('box',318,564,344,590))),
 ('recolor', dict(label='The white van turned yellow', box=(78,522,162,554), seed=(105,536), by='lab', tol=20, hue=25, set_sat=190, comp=False)),
 ('recolor', dict(label='The white house across the water turned pink', box=(652,492,692,552), seed=(672,520), by='lab', tol=20, hue=170, set_sat=110, comp=False)),
]

BOARDS['viron']['ops'] = [
 ('recolor', dict(label='The yellow flag by the door turned red', box=(636,368,666,414), seed=(650,392), tol=6, hue=2, comp=False, min_s=135)),
 ('hfill', dict(label='The finial on the left tower', shape=('box',356,56,385,110))),
 ('recolor', dict(label='The yellow bush turned pink', box=(952,522,1200,632), seed=(1080,570), tol=9, hue=166, comp=False, min_s=80)),
 ('hfill', dict(label='A small spire on the roof', shape=('box',554,176,581,223))),
 ('recolor', dict(label='The front door turned blue', box=(578,418,607,467), seed=(592,446), tol=14, hue=108, comp=False, min_s=30, sat=1.5)),
 ('copy', dict(label='An extra bench on the lawn', src=(982,608,1044,642), to=(420,560))),
 ('recolor', dict(label='The roof of the right tower turned red', box=(792,98,872,214), seed=(830,170), by='lab', tol=26, hue=6, set_sat=150, val=1.35, comp=False)),
]

BOARDS['atrani']['ops'] = [
 ('recolor', dict(label='The orange roof on the left turned blue', box=(144,266,252,300), seed=(200,284), tol=8, hue=104, comp=False, min_s=90)),
 ('recolor', dict(label='The pink building in the middle turned blue', box=(500,300,588,384), seed=(545,345), tol=7, hue=104, comp=False, min_s=38, sat=1.3)),
 ('recolor', dict(label='The blue railings along the road turned red', box=(0,460,422,532), seed=(200,480), tol=10, hue=2, comp=False, min_s=120)),
 ('copy', dict(label='The boat anchored off the breakwater', src=(1040,512,1104,552), to=(1007,537))),
 ('copy', dict(label='The rowboat at the bottom right', src=(846,752,922,792), to=(962,775))),
 ('copy', dict(label='The long white boat near the shore', src=(600,678,700,714), to=(533,653))),
 ('copy', dict(label='The small boat at the bottom of the bay', src=(296,716,372,762), to=(433,713))),
]

BOARDS['zrinski']['ops'] = [
 ('recolor', dict(label='The church spire turned green', box=(600,314,652,368), seed=(626,348), tol=10, hue=62, comp=False, min_s=80)),
 ('recolor', dict(label='The yellow leaves at the top left turned red', box=(0,0,262,440), seed=(120,150), tol=7, hue=4, comp=False, min_s=110, min_v=90)),
 ('hfill', dict(label='A window on the top floor is shuttered', shape=('box',962,246,991,300), vertical=True)),
 ('recolor', dict(label='The gray utility box turned red', box=(1069,531,1128,576), seed=(1100,552), by='lab', tol=12, hue=2, set_sat=170, comp=False)),
 ('recolor', dict(label='The brown door of the white building turned green', box=(341,511,366,558), seed=(353,536), tol=12, hue=62, comp=False, min_s=50, sat=1.3)),
 ('recolor', dict(label='The big orange roof turned blue', box=(222,370,656,494), seed=(450,455), tol=8, hue=104, comp=False, min_s=100, shape=('poly',[(222,370),(656,370),(656,494),(282,494),(282,440),(222,440)]))),
 ('hfill', dict(label='A drainpipe on the long building', shape=('box',768,282,789,572))),
]

BOARDS['frankfurt']['ops'] = [
 ('recolor', dict(label='A red marker on the bridge turned green', box=(258,392,290,422), seed=(268,406), tol=10, hue=62, comp=False, min_s=120)),
 ('recolor', dict(label='The two yellow markers on the bridge turned blue', box=(402,394,462,422), seed=(416,408), tol=10, hue=108, comp=False, min_s=120)),
 ('hfill', dict(label='The antenna on the middle tower', shape=('box',567,112,587,158))),
 ('hfill', dict(label='The crane beside the lit tower', shape=('box',822,192,868,246))),
 ('recolor', dict(label='The lit tower on the right changed color', box=(868,208,926,290), seed=(884,250), tol=12, hue=140, comp=False, min_s=60)),
 ('recolor', dict(label='The red reflection on the water turned green', box=(256,672,292,752), seed=(273,705), tol=10, hue=62, comp=False, min_s=120)),
 ('recolor', dict(label='The glowing top of the tallest tower turned red', box=(438,62,468,140), seed=(450,90), tol=10, hue=2, comp=False, min_s=120)),
]

BOARDS['lviv'] = dict(src='jig61.jpg', ops=[])
BOARDS['dingle'] = dict(src='jig49.jpg', ops=[])
BOARDS['grant'] = dict(src='jig67.jpg', ops=[])
BOARDS['bench'] = dict(src='jig37.jpg', ops=[])

BOARDS['lviv']['ops'] = [
 ('recolor', dict(label='The big green dome turned copper', box=(398,242,476,324), seed=(437,295), tol=7, hue=14, comp=False, min_s=50, sat=1.4, shape=('ell',437,285,40,43))),
 ('recolor', dict(label='The red roof on the far left turned blue', box=(0,316,134,358), seed=(60,338), tol=8, hue=108, comp=False, min_s=110)),
 ('recolor', dict(label='The long orange roof on the right turned green', box=(898,342,1072,374), seed=(980,358), tol=8, hue=62, comp=False, min_s=100)),
 ('recolor', dict(label='The red roof in the front row turned blue', box=(606,494,680,568), seed=(642,535), tol=8, hue=108, comp=False, min_s=90)),
 ('recolor', dict(label='The small green domes turned gold', box=(694,324,754,386), seed=(725,366), tol=10, hue=22, comp=False, min_s=50, sat=1.5)),
 ('recolor', dict(label='The turquoise roof on the right turned red', box=(1040,286,1200,330), seed=(1076,301), tol=8, hue=3, comp=False, min_s=60, min_v=120, sat=1.4)),
 ('recolor', dict(label='The yellow building at the bottom left turned pink', box=(158,572,234,684), seed=(195,622), tol=8, hue=166, comp=False, min_s=60)),
]
BOARDS['dingle']['ops'] = [
 ('recolor', dict(label='The dark roof of the lighthouse building turned red', box=(580,420,632,450), seed=(603,436), by='lab', tol=18, hue=2, set_sat=175, val=1.4, comp=False)),
 ('hfill', dict(label='The pole in the green field', shape=('box',565,306,583,352))),
 ('copy', dict(label='An extra patch of surf out at sea', src=(424,658,502,706), to=(1050,620))),
 ('recolor', dict(label='The tan field turned green', box=(300,262,792,326), seed=(550,290), tol=8, hue=50, comp=False, min_s=40, sat=1.5)),
 ('copy', dict(label='A patch of white surf below the cliff', src=(540,738,624,792), to=(462,682))),
 ('copy', dict(label='A dark cloud at the top left', src=(48,12,152,78), to=(218,48))),
 ('recolor', dict(label='The lighthouse tower turned yellow', box=(657,414,681,449), seed=(669,440), by='lab', tol=20, hue=27, set_sat=200, comp=False)),
]

BOARDS['grant']['ops'] = [
 ('recolor', dict(label='The tallest tower turned pink', box=(581,142,628,386), seed=(604,250), by='lab', tol=90, hue=170, set_sat=80, comp=False, region=('ell',604,264,30,128))),
 ('recolor', dict(label='The blue glass tower on the left turned green', box=(101,137,157,247), seed=(128,190), by='lab', tol=90, hue=62, set_sat=90, comp=False, region=('ell',129,192,36,64))),
 ('hfill', dict(label='The slim blue tower', shape=('box',376,146,412,296))),
 ('recolor', dict(label='The white post on the left turned red', box=(58,342,80,444), seed=(69,400), by='lab', tol=20, hue=2, set_sat=180, comp=False)),
 ('recolor', dict(label='The orange shrub turned purple', box=(766,410,962,525), seed=(880,450), tol=8, hue=150, comp=False, min_s=80)),
 ('recolor', dict(label='The brick path turned blue', box=(0,596,112,766), seed=(30,700), tol=6, hue=108, comp=False, min_s=85)),
 ('recolor', dict(label='The teal glass building turned gold', box=(762,238,816,402), seed=(790,320), tol=10, hue=20, comp=False, min_s=40, sat=1.3)),
]

BOARDS['masks']['ops'] = [
 ('recolor', dict(label='The orange feathers on the left turned blue', box=(0,0,340,388), seed=(120,150), tol=13, hue=108, comp=False, min_s=120, shape=('poly',[(0,0),(332,0),(262,96),(232,120),(228,250),(262,300),(236,388),(0,388)]))),
 ('recolor', dict(label='The green bow turned blue', box=(900,195,1125,425), seed=(1000,290), tol=7, hue=108, comp=False, min_s=60)),
 ('recolor', dict(label='The amber jewel turned green', box=(702,104,758,164), seed=(730,135), tol=12, hue=62, comp=False, min_s=80)),
 ('recolor', dict(label='The stone in the hat brooch turned green', box=(268,158,335,232), seed=(300,195), tol=14, hue=62, comp=False, min_s=50, sat=1.4)),
 ('recolor', dict(label='The red patch on the left mask turned blue', box=(238,328,342,432), seed=(272,375), tol=13, hue=110, comp=False, min_s=150)),
 ('recolor', dict(label='The red brooch on the right turned blue', box=(1112,170,1196,275), seed=(1150,215), tol=8, hue=110, comp=False, min_s=120)),
 ('recolor', dict(label='The blue post in the background turned green', box=(722,0,802,92), seed=(760,40), tol=12, hue=62, comp=False, min_s=60)),
]

BOARDS['bench']['ops'] = [
 ('copy', dict(label='The hut on the far right slope', src=(1060,462,1140,512), to=(1168,430))),
 ('copy', dict(label='The village in the valley', src=(118,392,286,458), to=(355,436))),
 ('recolor', dict(label='The gray bench turned brown', box=(446,466,998,714), seed=(700,522), by='lab', tol=34, hue=11, set_sat=150, val=0.95, comp=True)),
 ('copy', dict(label='An extra hut on the left hillside', src=(1142,408,1200,450), to=(150,468))),
 ('copy', dict(label='The tall white wildflower behind the bench', src=(578,392,628,462), to=(716,446))),
 ('recolor', dict(label='The yellow flowers on the right turned red', box=(880,515,1010,585), seed=(925,548), tol=7, hue=2, comp=False, min_s=140, min_v=150)),
 ('recolor', dict(label='The snow on the left peak melted', box=(0,150,100,215), seed=(40,180), by='lab', tol=22, hue=22, set_sat=28, val=0.6, comp=False)),
]

BOARDS['nyhavn']['ops'] = [
 ('remove', dict(label='A porthole on the white ship', shape=('ell',154,524,11,17), rad=6)),
 ('recolor', dict(label='The blue-gray house on the left turned pink', box=(83,259,141,354), seed=(112,300), tol=13, hue=172, comp=False, min_s=35, min_v=70, sat=1.25, shape=('poly',[(83,261),(140,281),(140,353),(83,349)]))),
 ('remove', dict(label='The yellow buoy by the dock', shape=('ell',714,482,10,20), rad=5)),
 ('recolor', dict(label='The blue tarp on the boat turned red', box=(770,428,903,484), seed=(820,452), tol=12, hue=2, comp=True, min_s=110, min_v=95)),
 ('fill', dict(label='The red neon sign', shape=('box',845,316,898,339), pick='dark', only='bright')),
 ('remove', dict(label='A window on the yellow building', shape=('box',1104,263,1131,320), rad=8)),
 ('remove', dict(label='The weather vane on the red roof', shape=('poly',[(929,112),(946,112),(945,143),(950,143),(950,157),(929,157)]), rad=4, grain=0, feather=1.5)),
]

BOARDS['poodle']['ops'] = [
 ('recolor', dict(label='The green checks on the pants turned pink', box=(208,238,554,730), seed_hsv=(78,160,150), tol=13, hue=168, comp=False, min_s=70, min_v=60)),
 ('recolor', dict(label='The pale blue cap turned pink', box=(705,120,916,230), seed_hsv=(106,60,200), tol=14, hue=168, comp=False, min_s=22, min_v=130, sat=1.9)),
 ('copy', dict(label='The rainbow tag on the shirt', src=(583,424,651,468), to=(670,485))),
 ('recolor', dict(label='The tail turned white', box=(112,172,292,352), seed_hsv=(12,150,170), tol=9, hue=14, comp=False, min_s=60, min_v=60, sat=0.2, val=1.1)),
 ('recolor', dict(label='The orange harness strap turned green', box=(738,343,902,422), seed_hsv=(9,210,225), tol=6, hue=62, comp=False, min_s=165, min_v=165)),
 ('recolor', dict(label='The gray undershirt turned yellow', box=(522,330,614,506), seed=(565,425), by='lab', tol=15, hue=25, set_sat=170, comp=True)),
 ('recolor', dict(label='The black buckle turned red', box=(710,393,758,470), seed=(733,432), by='lab', tol=26, hue=2, set_sat=210, val=3.2, comp=False)),
]

# ---- December restock (2026-11-13): boards for 2026-11-26 to 2026-12-31 ----
BOARDS['market'] = dict(src='jig77.jpg', ops=[
 ('recolor', dict(label='The red food sign over the stall turned blue', box=(212,412,352,462), seed=(282,437), tol=5, hue=108, comp=False, min_s=140, shape=('ell',282,437,72,24))),
 ('recolor', dict(label='The red coat of the man at the stall turned green', box=(326,540,394,702), seed=(360,620), tol=10, hue=62, comp=False, min_s=110)),
 ('recolor', dict(label='The pink scarf turned blue', box=(1004,612,1050,656), seed=(1026,630), tol=8, hue=108, comp=False, min_s=120)),
 ('recolor', dict(label='The yellow ring of the round beer sign turned green', box=(196,66,342,216), seed=(212,140), tol=8, hue=62, comp=False, min_s=110)),
 ('recolor', dict(label='The yellow menu board turned pink', box=(64,518,110,662), seed=(85,555), tol=10, hue=168, comp=False, min_s=70)),
 ('recolor', dict(label='The green trash bin turned red', box=(408,598,452,664), seed=(430,630), tol=14, hue=2, comp=False, min_s=40, set_sat=190, val=1.3)),
 ('recolor', dict(label='The little Santa at the right stall turned green', box=(1148,640,1184,700), seed=(1166,668), tol=6, hue=62, comp=False, min_s=175, min_v=130)),
])

BOARDS['kotor'] = dict(src='jig74.jpg', ops=[
 ('recolor', dict(label='The red roofs in the far town turned blue', box=(1100,218,1200,256), seed_hsv=(4,130,170), tol=14, hue=108, comp=False, min_s=50, min_v=60, sat=1.3)),
 ('recolor', dict(label='The orange roof of the tall hotel turned green', box=(192,512,302,540), seed=(245,525), tol=8, hue=62, comp=False, min_s=80)),
 ('recolor', dict(label='The tiled roof below the bell tower turned blue', box=(752,466,910,624), seed=(840,570), tol=9, hue=106, comp=False, min_s=50, shape=('poly',[(805,470),(900,468),(910,520),(905,622),(756,590),(760,550)]))),
 ('copy', dict(label='An extra cloud in the sky', src=(660,8,790,48), to=(130,24))),
 ('recolor', dict(label='The red roof on the point turned green', box=(488,318,532,342), seed=(508,330), tol=9, hue=62, comp=False, min_s=80)),
 ('recolor', dict(label='The white house above the bay turned yellow', box=(652,410,686,442), seed=(668,425), by='lab', tol=20, hue=25, set_sat=170, comp=False)),
 ('recolor', dict(label='The gray dome at the bottom left turned copper', box=(46,748,130,800), seed=(88,778), by='lab', tol=28, hue=14, set_sat=140, val=1.5, comp=False)),
])

BOARDS['fischburg'] = dict(src='jig91.jpg', ops=[
 ('recolor', dict(label='The chimney of the white farmhouse turned red', box=(954,168,974,206), seed=(964,192), by='lab', tol=30, hue=2, set_sat=160, comp=False)),
 ('recolor', dict(label='The tall pointed tower roof turned blue', box=(798,130,894,202), seed=(845,175), tol=8, hue=106, comp=False, min_s=60, shape=('poly',[(845,128),(896,202),(796,202)]))),
 ('recolor', dict(label='The gray cone roof of the round tower turned red', box=(236,372,344,470), seed=(290,432), by='lab', tol=20, hue=2, set_sat=130, comp=False, shape=('poly',[(290,372),(344,468),(236,468)]))),
 ('recolor', dict(label='The hiker\'s blue jacket turned red', box=(326,538,356,592), seed=(340,575), tol=12, hue=2, comp=False, min_s=80)),
 ('recolor', dict(label='The red roof of the small house at the left turned blue', box=(156,482,190,504), seed=(172,492), tol=10, hue=106, comp=False, min_s=80)),
 ('copy', dict(label='The top window of the white farmhouse', src=(998,242,1034,282), to=(1050,262), shape='rect')),
 ('copy', dict(label='An extra house on the far hillside', src=(26,336,64,362), to=(46,310))),
])

BOARDS['grau'] = dict(src='jig81.jpg', ops=[
 ('hfill', dict(label='The boat out on the horizon', shape=('box',450,430,500,478))),
 ('hfill', dict(label='A seagull in the middle of the sky', shape=('box',394,366,420,392))),
 ('hfill', dict(label='The mast of the far fishing boat', shape=('box',816,348,829,440))),
 ('recolor', dict(label='The top of the small lighthouse turned green', box=(703,398,727,446), seed=(713,412), tol=6, hue=62, comp=False, min_s=140, shape=('box',707,401,721,442))),
 ('recolor', dict(label='The hull of the big fishing boat turned blue', box=(832,505,1036,580), seed=(950,545), by='lab', tol=24, hue=106, set_sat=180, val=1.2, comp=False)),
 ('copy', dict(label='An extra seagull in the sky', src=(394,366,420,392), to=(585,372), mode='hard', feather=4.0)),
 ('hfill', dict(label='A thin mast on the left', shape=('box',151,316,163,420))),
])

BOARDS['tea'] = dict(src='jig40.jpg', ops=[
 ('recolor', dict(label='The knob on top of the umbrella turned gold', box=(798,56,828,92), seed=(812,75), tol=8, hue=22, comp=False, min_s=120)),
 ('recolor', dict(label='Her white socks turned pink', box=(296,756,344,794), seed=(318,776), by='lab', tol=18, hue=168, set_sat=120, comp=False)),
 ('recolor', dict(label='The white paper tag on the pole turned yellow', box=(824,398,838,532), seed=(831,460), by='lab', tol=22, hue=25, set_sat=170, comp=False)),
 ('recolor', dict(label='The pink band at her waist turned green', box=(402,522,438,558), seed=(420,540), tol=10, hue=62, comp=False, min_s=50)),
 ('recolor', dict(label='The red kettle stand turned blue', box=(758,704,872,762), seed=(790,735), tol=8, hue=108, comp=False, min_s=120)),
 ('recolor', dict(label='The small yellow flowers on the pole turned purple', box=(836,568,866,614), seed=(848,590), tol=10, hue=150, comp=False, min_s=110, min_v=120, shape=('ell',851,590,15,21))),
 ('recolor', dict(label='The golden ring under the umbrella turned blue', box=(762,170,862,198), seed=(810,182), tol=9, hue=108, comp=False, min_s=80)),
])

BOARDS['mushrooms'] = dict(src='jig13.jpg', ops=[
 ('recolor', dict(label='The white clover flower at the top left turned pink', box=(262,90,294,124), seed=(277,104), by='lab', tol=24, hue=168, set_sat=110, comp=False)),
 ('recolor', dict(label='The big yellow cap at the left turned red', box=(292,278,378,352), seed=(335,310), tol=8, hue=2, comp=False, min_s=80)),
 ('copy', dict(label='An extra white clover flower in the grass', src=(262,88,294,124), to=(1110,640))),
 ('recolor', dict(label='The handle of the small basket turned blue', box=(756,172,1066,292), seed=(900,183), tol=8, hue=108, comp=False, min_s=70)),
 ('recolor', dict(label='A brown cap in the small basket turned green', box=(998,352,1050,398), seed=(1022,375), tol=8, hue=62, comp=False, min_s=90, shape=('ell',1022,376,24,20))),
 ('recolor', dict(label='The round orange cap in the big basket turned purple', box=(612,340,696,402), seed=(652,372), tol=8, hue=150, comp=False, min_s=100, shape=('ell',654,372,38,28))),
 ('recolor', dict(label='A big leaf at the top turned yellow', box=(296,160,362,220), seed=(326,190), tol=10, hue=22, comp=True, min_s=50)),
])

BOARDS['footbridge'] = dict(src='jig66.jpg', ops=[
 ('recolor', dict(label='The long blue boat turned red', box=(106,400,234,420), seed_hsv=(104,120,150), tol=16, hue=2, comp=False, min_s=50, min_v=60)),
 ('hfill', dict(label='The small boat farther up the river', shape=('box',286,395,344,407))),
 ('recolor', dict(label='The blue tarp on the hut turned red', box=(358,592,386,618), seed=(372,604), tol=12, hue=2, comp=False, min_s=60)),
 ('recolor', dict(label='The blue roof across the river turned red', box=(116,376,162,394), seed_hsv=(104,110,160), tol=16, hue=2, comp=False, min_s=45, min_v=60)),
 ('copy', dict(label='An extra cloud in the blue sky', src=(700,160,774,198), to=(1052,165))),
 ('copy', dict(label='An extra hut on the beach', src=(276,582,390,642), to=(138,598), shape='rect', mode='hard', feather=5.0)),
 ('recolor', dict(label='The tall tree in the middle turned orange', box=(735,175,862,262), seed=(800,215), tol=14, hue=14, comp=False, min_s=50, sat=1.5, val=1.2, shape=('ell',798,220,62,44))),
])

BOARDS['calafuria'] = dict(src='jig69.jpg', ops=[
 ('recolor', dict(label='The little roof on top of the villa turned green', box=(676,382,720,398), seed=(697,390), tol=10, hue=62, comp=False, min_s=60)),
 ('recolor', dict(label='The square tower turned pink', box=(878,404,926,472), seed=(900,440), by='lab', tol=22, hue=170, set_sat=90, comp=False)),
 ('recolor', dict(label='The red roof of the villa turned blue', box=(662,402,788,424), seed=(722,414), tol=10, hue=106, comp=False, min_s=60)),
 ('recolor', dict(label='The yellow bush on the far hill turned red', box=(1096,412,1156,440), seed=(1125,426), tol=8, hue=2, comp=False, min_s=60)),
 ('hfill', dict(label='The small white cloud above the sea', shape=('box',538,413,587,429))),
 ('copy', dict(label='An extra dark cloud over the sea', src=(398,348,548,378), to=(180,385))),
 ('recolor', dict(label='The golden grass on the right hill turned green', box=(1000,440,1200,560), seed=(1100,500), tol=8, hue=50, comp=False, min_s=60, shape=('poly',[(1000,560),(1050,470),(1130,440),(1200,430),(1200,560)]))),
])

BOARDS['tekapo'] = dict(src='jig26.jpg', ops=[
 ('hfill', dict(label='The white cloud above the mountains', shape=('box',366,138,502,180), vertical=True)),
 ('copy', dict(label='An extra cloud in the sky', src=(1004,160,1134,194), to=(170,80))),
 ('recolor', dict(label='The green bush on the shore turned orange', box=(828,388,972,462), seed=(890,425), tol=12, hue=14, comp=False, min_s=50, sat=1.4)),
 ('recolor', dict(label='A tall purple lupin turned pink', box=(758,505,802,745), seed=(780,620), tol=12, hue=168, comp=False, min_s=60, shape=('ell',780,625,22,118))),
 ('recolor', dict(label='The lupin at the far right turned white', box=(962,596,1008,745), seed=(985,660), tol=14, comp=False, min_s=50, sat=0.12, val=1.35, shape=('ell',985,670,22,74))),
 ('copy', dict(label='A rock in the shallow water', src=(470,368,506,388), to=(447,377), shape='rect')),
 ('recolor', dict(label='The dark trees on the far shore turned orange', box=(990,190,1200,245), seed=(1100,222), tol=16, hue=14, comp=False, min_s=30, sat=1.8, val=1.3)),
])

BOARDS['secondbeach'] = dict(src='jig31.jpg', ops=[
 ('copy', dict(label='The small pointed sea stack', src=(792,300,852,343), to=(768,321.5), shape='rect', mode='hard', feather=3.0)),
 ('copy', dict(label='An extra little sea stack on the right', src=(746,310,792,341), to=(1158,326), shape='rect')),
 ('recolor', dict(label='The tall thin sea stack turned light gray', box=(650,286,700,340), seed=(675,310), by='lab', tol=26, sat=0.3, val=1.7, comp=False)),
 ('hfill', dict(label='The small cloud at the far left', shape=('box',6,226,76,284))),
 ('copy', dict(label='An extra cloud in the blue sky', src=(688,158,802,238), to=(640,60))),
 ('recolor', dict(label='The big rock on the right turned brown', box=(880,272,1048,340), seed=(960,310), by='lab', tol=22, hue=12, set_sat=110, val=1.3, comp=False)),
 ('recolor', dict(label='The green moss on the island turned orange', box=(400,176,566,262), seed=(480,215), tol=10, hue=14, comp=False, min_s=50, sat=1.3)),
])

BOARDS['lunersee'] = dict(src='jig33.jpg', ops=[
 ('hfill', dict(label='The white cloud at the top', shape=('box',618,0,726,64))),
 ('copy', dict(label='An extra small cloud in the sky', src=(96,16,166,52), to=(420,40))),
 ('copy', dict(label='The boulder at the bottom', src=(426,750,482,792), to=(398,771), shape='rect', mode='hard', feather=3.0)),
 ('recolor', dict(label='The green point in the lake turned orange', box=(338,330,458,372), seed=(400,348), tol=14, hue=9, sat=1.3, comp=False, min_s=60, shape=('poly',[(338,372),(360,342),(420,330),(458,345),(455,372)]))),
 ('recolor', dict(label='The green slope at the top right turned orange', box=(900,138,1060,202), seed=(950,170), tol=10, hue=12, comp=False, min_s=60, sat=1.3)),
 ('copy', dict(label='An extra boulder on the grass', src=(372,750,424,792), to=(160,762), mode='hard', feather=4.0)),
 ('recolor', dict(label='The dark bushes on the left slope turned red', box=(130,350,205,422), seed=(165,385), tol=12, hue=2, comp=False, min_s=50, sat=1.3)),
])

BOARDS['rerik'] = dict(src='jig80.jpg', ops=[
 ('recolor', dict(label='The orange edge of the house turned blue', box=(1024,334,1042,400), seed=(1033,372), tol=10, hue=108, comp=False, min_s=80)),
 ('recolor', dict(label='The hood of a beach chair turned red', box=(186,650,220,674), seed_hsv=(106,150,150), tol=14, hue=2, comp=False, min_s=60, min_v=50)),
 ('recolor', dict(label='The hood of a beach chair at the front turned yellow', box=(126,672,164,692), seed_hsv=(106,150,150), tol=14, hue=24, comp=False, min_s=60, min_v=50)),
 ('recolor', dict(label='The white house on the cliff turned pink', box=(1026,328,1102,398), seed=(1045,378), by='lab', tol=20, hue=170, set_sat=90, comp=False)),
 ('copy', dict(label='An extra beach chair on the sand', src=(514,546,544,574), to=(660,522), mode='hard', feather=3.0)),
 ('hfill', dict(label='A small cloud at the far left', shape=('box',74,266,130,296))),
 ('copy', dict(label='An extra cloud in the blue sky', src=(500,214,662,244), to=(700,36))),
])

BOARDS['fuji'] = dict(src='jig54.jpg', ops=[
 ('recolor', dict(label='The snow on top of Mount Fuji melted', box=(578,298,702,338), seed=(635,312), by='lab', tol=16, hue=110, set_sat=40, val=0.62, comp=False, shape=('poly',[(638,298),(704,338),(574,338)]))),
 ('recolor', dict(label='The red shrubs at the bottom left turned green', box=(190,575,410,690), seed=(300,620), tol=10, hue=45, comp=False, min_s=50, shape=('ell',300,632,105,52))),
 ('recolor', dict(label='A light green tree in the middle turned orange', box=(596,426,704,520), seed=(650,470), tol=10, hue=12, comp=False, min_s=60, sat=1.3, shape=('ell',650,472,50,42))),
 ('copy', dict(label='An extra cloud in the deep blue sky', src=(418,302,562,356), to=(130,44))),
 ('copy', dict(label='The low cloud beside Mount Fuji', src=(250,300,394,356), to=(486,328), shape='rect')),
 ('recolor', dict(label='A white building in the town turned red', box=(268,424,302,446), seed=(285,435), by='lab', tol=18, hue=2, set_sat=150, comp=False)),
 ('recolor', dict(label='The bright bush at the bottom turned yellow', box=(556,636,646,724), seed=(600,680), tol=10, hue=24, comp=False, min_s=60, shape=('ell',600,680,42,40))),
])

BOARDS['rakovets'] = dict(src='jig72.jpg', ops=[
 ('recolor', dict(label='The red roof across the river turned blue', box=(1084,342,1122,366), seed=(1100,354), tol=10, hue=108, comp=False, min_s=80)),
 ('recolor', dict(label='The grass on top of the tower turned brown', box=(334,186,588,222), seed=(400,205), tol=14, hue=14, comp=False, min_s=30, sat=1.4)),
 ('recolor', dict(label='The far hillside on the right turned orange', box=(880,196,1200,300), seed=(1050,250), tol=14, hue=10, comp=False, min_s=30, sat=1.7, val=1.25, shape=('ell',1040,248,160,50), feather=8.0)),
 ('hfill', dict(label='A small cloud in the middle of the sky', shape=('box',748,96,828,143))),
 ('copy', dict(label='An extra cloud at the right', src=(866,82,974,138), to=(1080,112))),
 ('recolor', dict(label='The river on the left turned blue', box=(30,362,344,448), seed=(200,410), tol=10, hue=105, comp=False, min_s=25, sat=1.6)),
 ('recolor', dict(label='The bush in front of the tower turned red', box=(240,400,342,500), seed=(290,445), tol=10, hue=2, comp=False, min_s=60, shape=('ell',290,450,48,48))),
])

BOARDS['calico'] = dict(src='jig83.jpg', ops=[
 ('recolor', dict(label='Her left eye turned blue', box=(366,302,408,338), seed=(387,320), tol=12, hue=105, comp=False, min_s=50, shape=('ell',387,320,18,15))),
 ('recolor', dict(label='Her pink nose turned dark', box=(426,368,462,396), seed=(444,380), tol=10, comp=False, min_s=40, val=0.45)),
 ('copy', dict(label='The knot in the wooden door', src=(1074,348,1128,402), to=(1166,375), shape='rect', mode='hard', feather=3.0)),
 ('copy', dict(label='The small pebble on the step', src=(214,596,252,624), to=(272,610), shape='rect', mode='hard', feather=3.0)),
 ('recolor', dict(label='An orange patch on her back turned gray', box=(590,236,712,304), seed=(650,270), tol=10, comp=True, min_s=60, sat=0.12)),
 ('copy', dict(label='An extra pebble on the step', src=(258,596,290,624), to=(1000,640), mode='hard', feather=3.0)),
 ('copy', dict(label='The dark mark on the door', src=(1024,192,1060,218), to=(1078,205), shape='rect', mode='hard', feather=3.0)),
])

BOARDS['corrour'] = dict(src='jig87.jpg', ops=[
 ('recolor', dict(label='The front car of the train turned red', box=(652,500,840,610), seed=(760,552), tol=12, hue=2, comp=False, min_s=60, shape=('poly',[(658,503),(838,566),(838,606),(652,540)]))),
 ('recolor', dict(label='The yellow nose of the train turned green', box=(834,566,858,606), seed=(846,586), tol=10, hue=62, comp=False, min_s=100)),
 ('copy', dict(label='Part of the white wake in the water', src=(250,610,306,704), to=(344,657), shape='rect', mode='hard', feather=4.0)),
 ('recolor', dict(label='A yellow gorse bush on the right turned red', box=(1056,404,1108,440), seed=(1082,422), tol=8, hue=2, comp=False, min_s=120, shape=('ell',1082,422,24,16))),
 ('recolor', dict(label='The pine wood by the lake turned orange', box=(300,228,462,300), seed=(380,262), tol=14, hue=14, comp=False, min_s=40, sat=1.5, val=1.2, shape=('ell',380,264,78,34))),
 ('recolor', dict(label='The gray rock face at the bottom right turned pink', box=(926,520,1190,690), seed=(1050,600), by='lab', tol=22, hue=170, set_sat=80, comp=False, shape=('poly',[(935,580),(1030,522),(1170,545),(1190,690),(1100,690),(935,615)]))),
 ('recolor', dict(label='A yellow gorse bush by the track turned white', box=(598,560,652,602), seed=(625,580), tol=8, comp=False, min_s=120, sat=0.1, val=1.2, shape=('ell',625,580,24,19))),
])

BOARDS['messara'] = dict(src='jig88.jpg', ops=[
 ('recolor', dict(label='The tall pine at the bottom left turned orange', box=(296,426,452,660), seed=(370,520), tol=14, hue=14, comp=False, min_s=40, sat=1.5, val=1.2, shape=('ell',372,545,72,112))),
 ('copy', dict(label='An extra cloud in the blue sky', src=(828,112,1002,196), to=(990,48))),
 ('recolor', dict(label='Two round trees in the fields turned red', box=(866,438,948,484), seed=(905,460), tol=12, hue=2, comp=False, min_s=30, sat=1.5, val=1.2, shape=('ell',906,462,34,22))),
 ('recolor', dict(label='The bare tan slope on the hill turned green', box=(394,324,466,354), seed=(430,340), by='lab', tol=18, hue=50, set_sat=90, comp=False)),
 ('recolor', dict(label='The green field at the bottom left turned yellow', box=(0,522,80,594), seed=(35,560), tol=10, hue=25, comp=False, min_s=60, sat=1.2)),
 ('recolor', dict(label='The long green field in the middle turned brown', box=(670,474,910,504), seed=(780,490), tol=10, hue=14, comp=False, min_s=60)),
 ('recolor', dict(label='The farm building at the bottom turned red', box=(712,654,788,686), seed=(750,666), by='lab', tol=20, hue=2, set_sat=140, comp=False)),
])

BOARDS['sandhamn'] = dict(src='jig96.jpg', ops=[
 ('recolor', dict(label='The big pine at the left turned orange', box=(66,106,374,300), seed=(220,180), tol=14, hue=14, comp=False, min_s=40, sat=1.5, val=1.2, shape=('ell',220,200,150,92))),
 ('copy', dict(label='An extra cloud in the blue sky', src=(516,98,652,192), to=(700,250))),
 ('recolor', dict(label='The red bush at the far left turned green', box=(0,392,124,472), seed=(40,420), tol=10, hue=50, comp=False, min_s=60)),
 ('recolor', dict(label='The pale rock on the right turned pink', box=(776,422,864,474), seed=(810,440), by='lab', tol=20, hue=170, set_sat=80, comp=False)),
 ('recolor', dict(label='A grass tuft on the rocks turned yellow', box=(436,500,486,540), seed=(462,520), tol=12, hue=24, comp=False, min_s=50, sat=1.4)),
 ('copy', dict(label='A small rock at the back', src=(244,452,302,480), to=(334,467), shape='rect', mode='hard', feather=3.0)),
 ('recolor', dict(label='The leaves at the top right turned red', box=(940,80,1160,240), seed=(1050,160), tol=10, hue=2, comp=False, min_s=60, shape=('ell',1050,160,94,72))),
])

BOARDS['heilbronn'] = dict(src='jig82.jpg', ops=[
 ('copy', dict(label='The swan landing on the lake', src=(702,412,754,446), to=(680,429), shape='rect', mode='hard', feather=3.0)),
 ('hfill', dict(label='The small cloud at the top left', shape=('box',226,46,334,90))),
 ('copy', dict(label='An extra small cloud in the sky', src=(578,76,682,110), to=(480,62))),
 ('recolor', dict(label='A light green tree across the lake turned orange', box=(590,276,694,392), seed=(640,330), tol=12, hue=14, comp=False, min_s=40, sat=1.6, val=1.15, shape=('ell',640,335,48,52))),
 ('recolor', dict(label='The big tree on the right turned red', box=(880,160,1110,340), seed=(990,250), tol=12, hue=2, comp=False, min_s=40, sat=1.5, val=1.1, shape=('ell',990,250,104,82))),
 ('recolor', dict(label='The reeds at the left turned green', box=(98,362,236,418), seed=(160,385), tol=10, hue=50, comp=False, min_s=40, sat=1.4)),
 ('copy', dict(label='A lily pad near the bottom', src=(680,720,732,746), to=(762,733), shape='rect', mode='hard', feather=3.0)),
])

BOARDS['caracol'] = dict(src='jig56.jpg', ops=[
 ('recolor', dict(label='The golden cliff at the left turned gray', box=(196,290,556,556), seed=(420,420), tol=10, comp=False, min_s=50, sat=0.18, shape=('poly',[(200,545),(300,450),(400,350),(500,310),(545,300),(545,470),(420,520),(260,556)]), region=('box',150,250,600,600))),
 ('recolor', dict(label='The green pool below the falls turned blue', box=(680,636,800,706), seed=(740,670), tol=14, hue=105, comp=False, min_s=20, sat=1.8)),
 ('recolor', dict(label='A treetop at the left turned orange', box=(46,306,154,394), seed=(100,350), tol=14, hue=14, comp=False, min_s=40, sat=1.5, val=1.15, shape=('ell',100,350,52,42))),
 ('recolor', dict(label='A treetop at the bottom right turned red', box=(800,560,900,640), seed=(850,600), tol=14, hue=2, comp=False, min_s=40, sat=1.5, val=1.1, shape=('ell',850,600,48,38))),
 ('recolor', dict(label='A treetop at the bottom left turned yellow', box=(250,660,350,740), seed=(300,700), tol=14, hue=26, comp=False, min_s=40, sat=1.4, val=1.15, shape=('ell',300,700,48,38))),
 ('recolor', dict(label='The bright moss in the cave turned yellow', box=(490,510,566,566), seed=(528,540), tol=12, hue=25, comp=False, min_s=50, sat=1.3)),
 ('recolor', dict(label='A patch of forest at the top right turned gold', box=(1020,40,1180,200), seed=(1100,120), tol=14, hue=20, comp=False, min_s=40, sat=1.5, val=1.25, shape=('ell',1100,120,60,55))),
])

BOARDS['bussaglia'] = dict(src='jig62.jpg', ops=[
 ('recolor', dict(label='The red roof of the beach hut turned blue', box=(0,346,56,372), seed=(22,358), tol=10, hue=108, comp=False, min_s=70)),
 ('hfill', dict(label='The small cloud over the right mountains', shape=('box',980,140,1076,181))),
 ('copy', dict(label='An extra cloud in the blue sky', src=(796,36,876,70), to=(860,120))),
 ('recolor', dict(label='The green slope above the beach hut turned orange', box=(0,180,120,320), seed=(60,250), tol=12, hue=14, comp=False, min_s=80, sat=1.4, val=1.1, shape=('ell',60,250,56,52), feather=6.0)),
 ('recolor', dict(label='The green mountainside on the right turned orange', box=(700,240,1200,400), seed=(950,330), tol=14, hue=14, comp=False, min_s=40, sat=1.5, val=1.2, shape=('ell',950,320,240,72))),
 ('copy', dict(label='A rock at the edge of the water', src=(470,404,516,424), to=(523,413), shape='rect', mode='hard', feather=3.0)),
 ('recolor', dict(label='The gray peak turned pink', box=(500,140,610,232), seed=(560,190), by='lab', tol=24, hue=170, set_sat=70, comp=False, shape=('ell',556,190,52,44))),
])

BOARDS['sassolungo'] = dict(src='jig71.jpg', ops=[
 ('hfill', dict(label='A small cloud in the blue sky', shape=('box',598,70,686,114))),
 ('copy', dict(label='An extra small cloud at the top left', src=(598,70,686,114), to=(170,32))),
 ('recolor', dict(label='The tall spruce at the right turned orange', box=(1060,388,1200,610), seed=(1130,500), tol=24, hue=14, comp=False, min_s=15, min_v=15, set_sat=170, val=1.8, shape=('ell',1132,500,62,112))),
 ('recolor', dict(label='The far rocky plateau at the left turned pink', box=(4,562,116,600), seed=(60,584), by='lab', tol=22, hue=170, set_sat=70, comp=False, shape=('ell',60,582,54,18))),
 ('recolor', dict(label='The sunlit forest in the middle turned red', box=(226,606,424,656), seed=(320,630), tol=20, hue=2, comp=False, min_s=25, min_v=20, set_sat=170, val=1.6, shape=('ell',322,631,94,22))),
 ('copy', dict(label='An extra small cloud in the blue sky', src=(598,70,686,114), to=(470,170))),
 ('recolor', dict(label='The gray scree slope on the mountain turned brown', box=(620,596,704,644), seed=(660,620), by='lab', tol=18, hue=12, set_sat=70, comp=False, shape=('ell',662,620,38,22))),
])

BOARDS['tennfjord'] = dict(src='jig73.jpg', ops=[
 ('recolor', dict(label='The white house on the left shore turned red', box=(186,326,232,348), seed=(208,337), by='lab', tol=22, hue=2, set_sat=160, comp=False)),
 ('copy', dict(label='The small rocky islet with a tree', src=(750,340,830,376), to=(866,358), shape='rect', mode='hard', feather=3.0)),
 ('recolor', dict(label='The pale cliff on the right turned pink', box=(976,310,1036,378), seed=(1005,345), by='lab', tol=22, hue=170, set_sat=80, comp=False)),
 ('hfill', dict(label='A wispy cloud on the left', shape=('box',156,146,364,180), vertical=True)),
 ('recolor', dict(label='The leaves of the little tree turned red', box=(230,404,374,540), seed=(300,470), tol=14, hue=2, comp=False, min_s=40, sat=1.5, shape=('ell',300,470,68,64))),
 ('recolor', dict(label='The yellow trees on the left shore turned green', box=(0,286,186,376), seed=(80,330), tol=12, hue=50, comp=False, min_s=50, sat=1.3, shape=('ell',90,332,92,42))),
 ('copy', dict(label='An extra wispy cloud in the sky', src=(506,80,700,110), to=(900,60))),
])

BOARDS['lacderoy'] = dict(src='jig58.jpg', ops=[
 ('copy', dict(label='The big boulder at the front', src=(380,662,452,722), to=(512,688), shape='rect', mode='hard', feather=4.0)),
 ('recolor', dict(label='The small hut on the right turned red', box=(1006,526,1032,550), seed=(1019,538), by='lab', tol=26, hue=2, set_sat=160, val=1.2, comp=False)),
 ('copy', dict(label='An extra boulder in the meadow', src=(482,662,550,712), to=(860,640), mode='hard', feather=4.0)),
 ('recolor', dict(label='The rocky face of the left peak turned red', box=(100,90,280,280), seed=(180,180), by='lab', tol=26, hue=6, set_sat=100, comp=False, shape=('poly',[(130,92),(160,100),(280,270),(240,280),(110,150)]))),
 ('recolor', dict(label='The green slope at the far right turned yellow', box=(990,150,1200,300), seed=(1080,230), tol=12, hue=24, comp=False, min_s=40, sat=1.3, shape=('poly',[(1080,148),(1200,220),(1200,300),(990,300)]))),
 ('copy', dict(label='An extra hut in the meadow', src=(1004,524,1034,552), to=(150,560), mode='hard', feather=3.0)),
 ('recolor', dict(label='The dark pine wood in the valley turned orange', box=(550,316,700,382), seed=(620,340), tol=16, hue=14, comp=False, min_s=20, min_v=20, set_sat=150, val=1.6, shape=('ell',625,348,72,32))),
])

BOARDS['chola'] = dict(src='jig41.jpg', ops=[
 ('recolor', dict(label='The red jacket of the hiker in front turned blue', box=(624,588,664,636), seed_hsv=(176,240,90), tol=12, hue=108, comp=False, min_s=120, min_v=40)),
 ('recolor', dict(label='The red jacket of the middle hiker turned green', box=(536,542,568,582), seed_hsv=(176,240,90), tol=12, hue=62, comp=False, min_s=120, min_v=40)),
 ('recolor', dict(label='The red jacket of the hiker at the left turned yellow', box=(72,560,104,594), seed=(88,576), tol=12, hue=25, comp=False, min_s=80)),
 ('recolor', dict(label='The blue pool turned green', box=(100,510,620,612), seed=(350,560), tol=14, hue=62, comp=False, min_s=40, sat=1.2, shape=('poly',[(110,600),(160,520),(420,512),(600,525),(530,560),(420,590),(300,600)]))),
 ('copy', dict(label='A small cloud at the top', src=(130,16,280,72), to=(512,44), shape='rect')),
 ('copy', dict(label='An extra cloud in the blue sky', src=(1036,14,1144,56), to=(260,56))),
 ('copy', dict(label='An extra rock in the snow', src=(280,394,330,424), to=(250,760))),
])

BOARDS['bronxfalls'] = dict(src='jig86.jpg', ops=[
 ('recolor', dict(label='The yellow trees at the top right turned red', box=(900,0,1200,240), seed=(1000,100), tol=10, hue=2, comp=False, min_s=80, shape=('ell',1040,110,140,110))),
 ('recolor', dict(label='The green leaves at the top middle turned orange', box=(600,40,780,180), seed=(690,110), tol=12, hue=14, comp=False, min_s=50, sat=1.4, shape=('ell',690,110,80,60))),
 ('recolor', dict(label='A leaf on the weed by the falls turned red', box=(400,550,480,680), seed=(455,600), tol=14, hue=2, comp=False, min_s=60)),
 ('recolor', dict(label='The yellow reflection on the right turned red', box=(940,300,1130,420), seed=(1000,360), tol=10, hue=2, comp=False, min_s=80, sat=1.1, shape=('ell',1030,360,90,55), feather=8.0)),
 ('recolor', dict(label='The blue reflection in the river turned purple', box=(780,380,1000,520), seed=(880,440), tol=12, hue=145, comp=False, min_s=60)),
 ('recolor', dict(label='The mossy rock at the bottom right turned brown', box=(820,730,980,800), seed=(890,765), tol=12, hue=14, comp=False, min_s=40, sat=1.3)),
 ('recolor', dict(label='The pale bush on the left bank turned red', box=(260,180,500,280), seed=(400,225), by='lab', tol=22, hue=2, set_sat=110, comp=False, shape=('ell',380,230,110,45))),
])

BOARDS['bulldogs']['ops'] = [
 ('recolor', dict(label='The life jacket of the black dog turned blue', box=(584,338,1000,436), seed_hsv=(5,180,240), tol=10, hue=108, comp=False, min_s=120, min_v=120, shape=('poly',[(590,370),(800,345),(960,380),(1000,410),(960,436),(590,400)]))),
 ('recolor', dict(label='The black leash turned red', box=(0,170,190,205), seed=(100,185), by='lab', tol=20, hue=2, set_sat=180, val=2.2, comp=False, shape=('poly',[(0,172),(190,196),(190,208),(0,184)]))),
 ('recolor', dict(label='The pink tongue of the black dog turned blue', box=(904,332,936,352), seed=(920,342), tol=12, hue=108, comp=False, min_s=40)),
 ('recolor', dict(label='The ear of the tan dog turned pink', box=(440,150,500,235), seed=(462,185), by='lab', tol=24, hue=170, set_sat=120, val=1.8, comp=False)),
 ('recolor', dict(label='The reflective stripe on the tan dog\'s jacket turned gold', box=(160,250,180,320), seed=(170,290), by='lab', tol=24, hue=22, set_sat=200, comp=False)),
 ('copy', dict(label='An extra stripe on the tan dog\'s jacket', src=(258,246,280,318), to=(370,282), shape='rect', mode='hard', feather=2.0)),
 ('recolor', dict(label='The handle on the black dog\'s jacket turned red', box=(700,310,800,352), seed=(735,330), by='lab', tol=20, hue=2, set_sat=180, val=2.6, comp=False)),
]


BOARDS['scharl'] = dict(src='jig22.jpg', ops=[
 ('copy', dict(label='The big rock at the bottom of the stream', src=(800,640,980,760), to=(692,705))),
 ('copy', dict(label='An extra rock in the white water', src=(866,320,968,380), to=(230,470), mode='hard', feather=5.0)),
 ('recolor', dict(label='The yellow larches at the top left turned red', box=(20,40,240,200), seed=(120,110), tol=10, hue=2, comp=False, min_s=80, shape=('ell',125,115,92,72))),
 ('recolor', dict(label='The yellow larch in the middle turned green', box=(420,110,560,250), seed=(490,180), tol=10, hue=50, comp=False, min_s=80, shape=('ell',490,180,60,62))),
 ('recolor', dict(label='The pile of driftwood on the rocks turned gray', box=(700,480,850,610), seed=(760,560), tol=12, comp=False, min_s=50, sat=0.1, shape=('poly',[(700,500),(780,480),(850,540),(840,610),(720,600)]))),
 ('recolor', dict(label='The pale boulder at the top right turned brown', box=(1100,195,1160,235), seed=(1130,214), by='lab', tol=22, hue=12, set_sat=120, comp=False)),
 ('recolor', dict(label='The larches at the top right turned orange', box=(900,40,1200,200), seed=(1050,120), tol=10, hue=10, comp=False, min_s=80, shape=('ell',1060,110,110,70))),
])

BOARDS['rotenfels'] = dict(src='jig95.jpg', ops=[
 ('recolor', dict(label='The train turned red', box=(514,418,602,452), seed=(556,437), by='lab', tol=34, hue=2, set_sat=170, comp=False, shape=('poly',[(514,445),(598,418),(602,428),(518,452)]))),
 ('recolor', dict(label='The far wooded hill on the right turned orange', box=(1000,240,1200,300), seed=(1110,280), by='lab', tol=22, hue=12, set_sat=120, val=1.3, comp=False, shape=('ell',1110,282,90,22))),
 ('recolor', dict(label='The pale field across the valley turned green', box=(780,400,880,440), seed=(830,420), by='lab', tol=20, hue=50, set_sat=110, comp=False)),
 ('recolor', dict(label='The trees on top of the left cliff turned orange', box=(90,120,290,190), seed=(190,150), tol=14, hue=12, comp=False, min_s=40, sat=1.5, val=1.2, shape=('ell',190,158,90,30))),
 ('recolor', dict(label='The big rock face in the middle turned gray', box=(430,150,700,400), seed=(560,280), tol=12, comp=False, min_s=25, sat=0.15, shape=('poly',[(440,190),(600,150),(690,160),(700,390),(560,400),(430,330)]))),
 ('copy', dict(label='An extra cloud in the clear sky', src=None, to=None)) if False else ('hfill', dict(label='The radio mast on the far hill', shape=('box',1086,222,1102,250))),
 ('recolor', dict(label='A tall tree in the meadow turned red', box=(1020,500,1090,620), seed=(1052,560), tol=14, hue=2, comp=False, min_s=40, sat=1.5, val=1.2, shape=('ell',1055,560,30,52))),
])

BOARDS['ride'] = dict(src='jig1.jpg', ops=[
 ('hfill', dict(label='The airplane trail in the sky', shape=('box',40,104,476,120), vertical=True)),
 ('recolor', dict(label='The red stripes on the top car turned blue', box=(470,450,590,560), seed_hsv=(176,200,170), tol=12, hue=108, comp=False, min_s=100, min_v=60)),
 ('recolor', dict(label='The red stripes on the big car turned green', box=(250,730,380,940), seed_hsv=(176,200,170), tol=12, hue=62, comp=False, min_s=100, min_v=60)),
 ('recolor', dict(label='The green car at the bottom right turned red', box=(1040,990,1160,1180), seed=(1075,1100), tol=14, hue=2, comp=False, min_s=60)),
 ('recolor', dict(label='The yellow glass of a car on the right turned blue', box=(916,520,1000,650), seed=(950,590), tol=10, hue=108, comp=False, min_s=100)),
 ('recolor', dict(label='The red band under the top car turned yellow', box=(420,610,560,650), seed_hsv=(176,220,170), tol=12, hue=25, comp=False, min_s=100, min_v=60)),
 ('recolor', dict(label='The gold trim on the top car turned blue', box=(630,360,800,470), seed_hsv=(20,170,180), tol=10, hue=108, comp=False, min_s=90, set_sat=200, shape=('poly',[(640,400),(700,360),(800,380),(790,470),(640,450)]))),
])

BOARDS['goldengate'] = dict(src='jig64.jpg', ops=[
 ('hfill', dict(label='A small cloud in the middle of the sky', shape=('box',530,90,662,144))),
 ('copy', dict(label='An extra cloud at the top', src=(940,40,1140,106), to=(770,50))),
 ('recolor', dict(label='The lone pine on the cliff turned orange', box=(344,300,380,384), seed=(362,345), by='lab', tol=28, hue=14, set_sat=170, val=1.8, comp=False, shape=('poly',[(362,300),(380,384),(344,384)]))),
 ('copy', dict(label='The small pine on the lower cliff', src=(260,420,300,470), to=(236,440), shape='rect', mode='hard', feather=3.0)),
 ('copy', dict(label='One of the bridge\'s pillars', src=(456,540,490,580), to=(512,560), shape='rect', mode='hard', feather=2.0)),
 ('copy', dict(label='An extra small cloud in the sky', src=(388,128,442,158), to=(820,190))),
 ('recolor', dict(label='The pale cliff on the right turned pink', box=(724,264,860,400), seed=(800,320), by='lab', tol=22, hue=170, set_sat=80, comp=False, shape=('poly',[(730,390),(790,280),(860,270),(840,330),(760,400)]))),
])

BOARDS['longsheng'] = dict(src='jig35.jpg', ops=[
 ('recolor', dict(label='The red patch on the round terrace turned blue', box=(310,195,380,220), seed=(345,207), tol=12, hue=108, comp=False, min_s=60)),
 ('recolor', dict(label='The rusty trees on the hill turned green', box=(780,150,960,320), seed=(860,230), tol=12, hue=42, comp=False, min_s=60, sat=0.8, val=0.9, shape=('poly',[(790,200),(850,150),(900,160),(950,210),(940,300),(800,310)]), feather=6.0)),
 ('copy', dict(label='The buildings at the top left are gone', src=(150,58,230,100), to=(94,79), shape='rect', mode='hard', feather=3.0)),
 ('recolor', dict(label='The water in the middle terraces turned blue', box=(470,330,610,400), seed=(540,370), by='lab', tol=24, hue=108, set_sat=110, comp=False, shape=('ell',540,366,66,32))),
 ('recolor', dict(label='The terraces on the far left hill turned green', box=(100,90,300,200), seed=(200,140), tol=10, hue=45, comp=False, min_s=40, sat=1.4, shape=('poly',[(100,110),(220,90),(300,120),(300,190),(120,200)]), feather=6.0)),
 ('copy', dict(label='An extra hole in the field', src=(860,690,930,730), to=(300,780), mode='hard', feather=4.0)),
 ('recolor', dict(label='The hillside at the top right turned orange', box=(900,20,1200,140), seed=(1050,80), tol=14, hue=14, comp=False, min_s=30, sat=1.5, val=1.2, shape=('ell',1050,80,140,55))),
])

BOARDS['opalpool'] = dict(src='jig48.jpg', ops=[
 ('recolor', dict(label='The orange ground at the front left turned brown', box=(150,560,480,700), seed=(300,620), tol=10, hue=9, val=0.55, comp=False, min_s=100, shape=('ell',310,630,150,52), feather=10.0)),
 ('recolor', dict(label='The blue pool turned purple', box=(170,420,1020,540), seed=(560,500), tol=12, hue=140, comp=False, min_s=60)),
 ('hfill', dict(label='A small cloud at the top left', shape=('box',166,118,282,146))),
 ('copy', dict(label='An extra cloud in the blue sky', src=(166,118,282,146), to=(650,40))),
 ('recolor', dict(label='The left bare hill turned green', box=(296,228,500,282), seed=(380,255), by='lab', tol=20, hue=50, set_sat=90, comp=False, shape=('poly',[(300,280),(360,232),(420,236),(500,270),(500,282)]))),
 ('hfill', dict(label='The dead tree at the far right', shape=('box',1008,256,1026,300))),
 ('copy', dict(label='The small bush on the flats', src=(1046,310,1082,330), to=(1088,320), shape='rect', mode='hard', feather=3.0)),
])

BOARDS['poppies'] = dict(src='jig32.jpg', ops=[
 ('recolor', dict(label='The blurry poppy at the top left turned yellow', box=(200,30,340,150), seed=(265,90), tol=12, hue=25, comp=False, min_s=120, shape=('ell',267,90,62,55), feather=5.0)),
 ('recolor', dict(label='The poppy at the right turned pink', box=(900,380,1140,600), seed=(1010,500), tol=12, hue=165, comp=False, min_s=100)),
 ('recolor', dict(label='The small poppy bud at the right turned orange', box=(880,240,960,330), seed=(915,290), tol=12, hue=12, comp=False, min_s=80)),
 ('recolor', dict(label='The poppy seed head at the top right turned purple', box=(1090,60,1175,180), seed=(1130,130), tol=18, hue=150, comp=False, min_s=50, shape=('ell',1127,140,36,42), feather=4.0)),
 ('recolor', dict(label='The bud at the bottom left turned red', box=(118,680,180,770), seed=(148,730), tol=14, hue=2, comp=False, min_s=50, shape=('ell',148,738,22,30), feather=4.0)),
 ('recolor', dict(label='The small poppy behind the big one turned blue', box=(970,310,1050,380), seed=(1010,345), tol=10, hue=110, comp=False, min_s=150, shape=('ell',1010,345,30,30), feather=4.0)),
 ('recolor', dict(label='The yellow center of the big poppy turned green', box=(500,500,600,590), seed_hsv=(20,160,170), tol=14, hue=55, comp=False, min_s=60, min_v=50, shape=('ell',540,548,40,46))),
])

BOARDS['sasov'] = dict(src='jig57.jpg', ops=[
 ('recolor', dict(label='The green bush in front of the ruins turned red', box=(600,430,660,500), seed=(625,460), tol=14, hue=2, comp=False, min_s=50, sat=1.5, shape=('ell',628,462,26,32))),
 ('copy', dict(label='An extra cloud in the blue sky', src=(568,200,708,250), to=(820,40))),
 ('copy', dict(label='A small cloud in the middle', src=(560,140,700,196), to=(630,222), shape='rect')),
 ('copy', dict(label='A window in the far wall', src=(470,322,500,356), to=(528,340), shape='rect', mode='hard', feather=2.0)),
 ('copy', dict(label='The arched door at the bottom left', src=(270,460,300,500), to=(253,482), shape='rect', mode='hard', feather=2.0)),
 ('recolor', dict(label='The forest at the left turned orange', box=(0,280,260,460), seed=(120,350), tol=16, hue=14, comp=False, min_s=40, sat=1.5, val=1.25, shape=('poly',[(0,280),(200,290),(260,300),(240,420),(160,450),(0,460)]), feather=5.0)),
 ('copy', dict(label='An extra white rock on the path', src=(862,510,892,534), to=(500,560), mode='hard', feather=3.0)),
])
