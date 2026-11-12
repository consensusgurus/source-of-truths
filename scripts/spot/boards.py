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
 ('recolor', dict(label='The tallest tower turned pink', box=(581,142,628,386), seed=(604,250), by='lab', tol=90, hue=170, set_sat=80, comp=False)),
 ('recolor', dict(label='The blue glass tower on the left turned green', box=(101,137,157,247), seed=(128,190), by='lab', tol=90, hue=62, set_sat=90, comp=False)),
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
