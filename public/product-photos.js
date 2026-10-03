/* Original supplied artwork, matched by printed product names. No resizing or recompression.
   Distinct products never share a photo unless the artwork itself is verified for that exact item. */
(function(){
  const map = {
  "american-rice": {
    "url": "assets/products/originals/american-rice.jpg",
    "width": 926,
    "height": 1425,
    "quality": "original-supplied"
  },
  "baldo-italian-rice": {
    "url": "assets/products/originals/baldo-italian-rice.jpg",
    "width": 1011,
    "height": 1494,
    "quality": "original-supplied"
  },
  "termos-helo": {
    "url": "assets/products/originals/termos-helo.jpg",
    "width": 1024,
    "height": 1506,
    "quality": "original-supplied"
  },
  "shaariye": {
    "url": "assets/products/originals/shaariye.jpg",
    "width": 999,
    "height": 1499,
    "quality": "original-supplied"
  },
  "zaytoun-jarjir": {
    "url": "assets/products/originals/zaytoun-jarjir.jpg",
    "width": 1024,
    "height": 1504,
    "quality": "original-supplied"
  },
  "shankleesh-har": {
    "url": "assets/products/originals/shankleesh-har.jpg",
    "width": 968,
    "height": 1505,
    "quality": "original-supplied"
  },
  "makatar-asiin": {
    "url": "assets/products/originals/makatar-asiin.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "kabees-left": {
    "url": "assets/products/originals/kabees-left.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "makatar-zaatar": {
    "url": "assets/products/originals/makatar-zaatar.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "makatar-zaarour": {
    "url": "assets/products/originals/makatar-zaarour.jpg",
    "width": 921,
    "height": 1478,
    "quality": "original-supplied"
  },
  "kameh-habe-kamle": {
    "url": "assets/products/originals/kameh-habe-kamle.jpg",
    "width": 1024,
    "height": 1474,
    "quality": "original-supplied"
  },
  "freeke": {
    "url": "assets/products/originals/freeke.jpg",
    "width": 1024,
    "height": 1482,
    "quality": "original-supplied"
  },
  "zhourat": {
    "url": "assets/products/originals/zhourat.jpg",
    "width": 831,
    "height": 1385,
    "quality": "original-supplied"
  },
  "shankleesh-bil-zaatar": {
    "url": "assets/products/originals/shankleesh-bil-zaatar.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "qawerma": {
    "url": "assets/products/originals/qawerma.jpg",
    "width": 1024,
    "height": 1391,
    "quality": "original-supplied"
  },
  "burglur-abyad-kheshen": {
    "url": "assets/products/originals/burglur-abyad-kheshen.jpg",
    "width": 1024,
    "height": 1464,
    "quality": "original-supplied"
  },
  "fasolya-snoubareye": {
    "url": "assets/products/originals/fasolya-snoubareye.jpg",
    "width": 818,
    "height": 1280,
    "quality": "original-supplied"
  },
  "loz-makshour": {
    "url": "assets/products/originals/loz-makshour.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "mraba-el-karaz": {
    "url": "assets/products/originals/mraba-el-karaz.jpg",
    "width": 888,
    "height": 1280,
    "quality": "original-supplied"
  },
  "labneh-mkaazleh-naanaa": {
    "url": "assets/products/originals/labneh-mkaazleh-naanaa.jpg",
    "width": 939,
    "height": 1416,
    "quality": "original-supplied"
  },
  "warak-enab-bil-labneh": {
    "url": "assets/products/originals/warak-enab-bil-labneh.jpg",
    "width": 950,
    "height": 1436,
    "quality": "original-supplied"
  },
  "cornichon": {
    "url": "assets/products/originals/cornichon.jpg",
    "width": 1024,
    "height": 1497,
    "quality": "original-supplied"
  },
  "debes-el-remen": {
    "url": "assets/products/originals/debes-el-remen.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "maa-ward": {
    "url": "assets/products/originals/maa-ward.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "rub-el-bandoura": {
    "url": "assets/products/originals/rub-el-bandoura.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "extra-virgin-olive-oil": {
    "url": "assets/products/originals/extra-virgin-olive-oil.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "aadas-aarid": {
    "url": "assets/products/originals/aadas-aarid.jpg",
    "width": 872,
    "height": 1435,
    "quality": "original-supplied"
  },
  "ardi-shawki": {
    "url": "assets/products/originals/ardi-shawki.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "zaatar-halabi": {
    "url": "assets/products/originals/zaatar-halabi.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "popcorn-jumbo": {
    "url": "assets/products/originals/popcorn-jumbo.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "semaq": {
    "url": "assets/products/originals/semaq.jpg",
    "width": 1018,
    "height": 1496,
    "quality": "original-supplied"
  },
  "burglur-asmar-neeme": {
    "url": "assets/products/originals/burglur-asmar-neeme.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "zaatar-baladi-extra": {
    "url": "assets/products/originals/zaatar-baladi-extra.jpg",
    "width": 995,
    "height": 1149,
    "quality": "original-supplied"
  },
  "foul-aarid": {
    "url": "assets/products/originals/foul-aarid.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "waraq-enab": {
    "url": "assets/products/originals/waraq-enab.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "bemye-yebse": {
    "url": "assets/products/originals/bemye-yebse.jpg",
    "width": 727,
    "height": 1280,
    "quality": "original-supplied"
  },
  "burglur-asmar-kheshen": {
    "url": "assets/products/originals/burglur-asmar-kheshen.jpg",
    "width": 1024,
    "height": 1295,
    "quality": "original-supplied"
  },
  "foul-mdamas": {
    "url": "assets/products/originals/foul-mdamas.jpg",
    "width": 1024,
    "height": 1350,
    "quality": "original-supplied"
  },
  "aadas-majroush": {
    "url": "assets/products/originals/aadas-majroush.jpg",
    "width": 1004,
    "height": 1339,
    "quality": "original-supplied"
  },
  "humus-baladi": {
    "url": "assets/products/originals/humus-baladi.jpg",
    "width": 1020,
    "height": 992,
    "quality": "original-supplied"
  },
  "molokhiya": {
    "url": "assets/products/originals/molokhiya.jpg",
    "width": 851,
    "height": 1395,
    "quality": "original-supplied"
  },
  "mraba-el-tout": {
    "url": "assets/products/originals/mraba-el-tout.jpg",
    "width": 1024,
    "height": 1514,
    "quality": "original-supplied"
  },
  "labneh-mkaazleh-har": {
    "url": "assets/products/originals/labneh-mkaazleh-har.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "mraba-el-fraise": {
    "url": "assets/products/originals/mraba-el-fraise.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "mraba-el-yaqtin": {
    "url": "assets/products/originals/mraba-el-yaqtin.jpg",
    "width": 945,
    "height": 1280,
    "quality": "original-supplied"
  },
  "kabees-meete": {
    "url": "assets/products/originals/kabees-meete.jpg",
    "width": 1024,
    "height": 1415,
    "quality": "original-supplied"
  },
  "kabees-meshakal": {
    "url": "assets/products/originals/kabees-meshakal.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "kabees-khyar": {
    "url": "assets/products/originals/kabees-khyar.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "makdous-el-loz": {
    "url": "assets/products/originals/makdous-el-loz.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "maraba-el-meshmosh": {
    "url": "assets/products/originals/maraba-el-meshmosh.jpg",
    "width": 1024,
    "height": 1024,
    "quality": "original-supplied"
  },
  "kabes-har": {
    "url": "assets/products/originals/kabes-har.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "mraba-el-tin-yebes": {
    "url": "assets/products/originals/mraba-el-tin-yebes.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "kishek-zayt-w-mouneh": {
    "url": "assets/products/originals/kishek-zayt-w-mouneh.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "mraba-el-ward": {
    "url": "assets/products/originals/mraba-el-ward.jpg",
    "width": 853,
    "height": 1280,
    "quality": "original-supplied"
  },
  "khal-el-enab": {
    "url": "assets/products/originals/khal-el-enab.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "mraba-sfarjel": {
    "url": "assets/products/originals/mraba-sfarjel.jpg",
    "width": 853,
    "height": 1280,
    "quality": "original-supplied"
  },
  "bandoura-mujafafeh": {
    "url": "assets/products/originals/bandoura-mujafafeh.jpg",
    "width": 853,
    "height": 1280,
    "quality": "original-supplied"
  },
  "labneh-mkaazleh-seda": {
    "url": "assets/products/originals/labneh-mkaazleh-seda.jpg",
    "width": 853,
    "height": 1280,
    "quality": "original-supplied"
  },
  "bhar-batata": {
    "url": "assets/products/originals/bhar-batata.jpg",
    "width": 987,
    "height": 1491,
    "quality": "original-supplied"
  },
  "bhar-helo": {
    "url": "assets/products/originals/bhar-helo.jpg",
    "width": 890,
    "height": 1454,
    "quality": "original-supplied"
  },
  "paprika": {
    "url": "assets/products/originals/paprika.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "oregano": {
    "url": "assets/products/originals/oregano.jpg",
    "width": 951,
    "height": 1464,
    "quality": "original-supplied"
  },
  "sabaa-bharat": {
    "url": "assets/products/originals/sabaa-bharat.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "daqet-el-kebbe-nehme": {
    "url": "assets/products/originals/daqet-el-kebbe-nehme.jpg",
    "width": 858,
    "height": 1470,
    "quality": "original-supplied"
  },
  "bhar-kabse": {
    "url": "assets/products/originals/bhar-kabse.jpg",
    "width": 1107,
    "height": 1024,
    "quality": "original-supplied"
  },
  "korfa": {
    "url": "assets/products/originals/korfa.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "kurkum": {
    "url": "assets/products/originals/kurkum.jpg",
    "width": 973,
    "height": 1501,
    "quality": "original-supplied"
  },
  "kozbara-yebse-hab": {
    "url": "assets/products/originals/kozbara-yebse-hab.jpg",
    "width": 944,
    "height": 1468,
    "quality": "original-supplied"
  },
  "bhar-aswad-hab": {
    "url": "assets/products/originals/bhar-aswad-hab.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "mardakoush": {
    "url": "assets/products/originals/mardakoush.jpg",
    "width": 894,
    "height": 1513,
    "quality": "original-supplied"
  },
  "zbeeb-chile": {
    "url": "assets/products/originals/zbeeb-chile.jpg",
    "width": 1021,
    "height": 1465,
    "quality": "original-supplied"
  },
  "zbeeb-aswad": {
    "url": "assets/products/originals/zbeeb-aswad.jpg",
    "width": 1024,
    "height": 1434,
    "quality": "original-supplied"
  },
  "barkouk-mjafaf": {
    "url": "assets/products/originals/barkouk-mjafaf.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "zanjabeel": {
    "url": "assets/products/originals/zanjabeel.jpg",
    "width": 1024,
    "height": 1420,
    "quality": "original-supplied"
  },
  "barley": {
    "url": "assets/products/originals/barley.jpg",
    "width": 1000,
    "height": 1500,
    "quality": "original-supplied"
  },
  "joz-farashe": {
    "url": "assets/products/originals/joz-farashe.jpg",
    "width": 869,
    "height": 1370,
    "quality": "original-supplied"
  },
  "zarshak": {
    "url": "assets/products/originals/zarshak.jpg",
    "width": 750,
    "height": 1296,
    "quality": "original-supplied"
  },
  "aamar-el-din-kotaa": {
    "url": "assets/products/originals/aamar-el-din-kotaa.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "meshmosh-mojafaf": {
    "url": "assets/products/originals/meshmosh-mojafaf.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "moshmosh-mojafaf": {
    "url": "assets/products/originals/meshmosh-mojafaf.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "iodized-salt": {
    "url": "assets/products/originals/iodized-salt.jpg",
    "width": 909,
    "height": 1363,
    "quality": "original-supplied"
  },
  "bhar-mansaf": {
    "url": "assets/products/originals/bhar-mansaf.jpg",
    "width": 796,
    "height": 1254,
    "quality": "original-supplied"
  },
  "bhar-abyad": {
    "url": "assets/products/originals/bhar-abyad.jpg",
    "width": 824,
    "height": 1193,
    "quality": "original-supplied"
  },
  "shoumar-hab": {
    "url": "assets/products/originals/shoumar-hab.jpg",
    "width": 1024,
    "height": 1459,
    "quality": "original-supplied"
  },
  "kozbara-yebse-neeme": {
    "url": "assets/products/originals/kozbara-yebse-neeme.jpg",
    "width": 925,
    "height": 1411,
    "quality": "original-supplied"
  },
  "daqet-el-kebbe-hab": {
    "url": "assets/products/originals/daqet-el-kebbe-hab.jpg",
    "width": 1005,
    "height": 1489,
    "quality": "original-supplied"
  },
  "zero-flour": {
    "url": "assets/products/originals/zero-flour.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "all-use-flour": {
    "url": "assets/products/originals/all-use-flour.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "barley-flour": {
    "url": "assets/products/originals/barley-flour.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "barly-flour": {
    "url": "assets/products/originals/barley-flour.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "whole-wheat-flour": {
    "url": "assets/products/originals/whole-wheat-flour.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "chamomile": {
    "url": "assets/products/originals/chamomile.jpg",
    "width": 859,
    "height": 1280,
    "quality": "original-supplied"
  },
  "zaatar-manakish": {
    "url": "assets/products/originals/zaatar-manakish.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "rice-neeme": {
    "url": "assets/products/originals/rice-neeme.jpg",
    "width": 970,
    "height": 1436,
    "quality": "original-supplied"
  },
  "egyptian-rice": {
    "url": "assets/products/originals/egyptian-rice.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "grated-coconut": {
    "url": "assets/products/originals/grated-coconut.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "teen-mjafaf": {
    "url": "assets/products/originals/teen-mjafaf.jpg",
    "width": 991,
    "height": 1486,
    "quality": "original-supplied"
  },
  "kajo-falkat": {
    "url": "assets/products/originals/kajo-falkat.jpg",
    "width": 987,
    "height": 1480,
    "quality": "original-supplied"
  },
  "habet-el-barakeh": {
    "url": "assets/products/originals/habet-el-barakeh.jpg",
    "width": 963,
    "height": 1466,
    "quality": "original-supplied"
  },
  "zaatar-with-nuts": {
    "url": "assets/products/originals/zaatar-with-nuts.jpg",
    "width": 916,
    "height": 1485,
    "quality": "original-supplied"
  },
  "yansoun-hab": {
    "url": "assets/products/originals/yansoun-hab.jpg",
    "width": 902,
    "height": 1436,
    "quality": "original-supplied"
  },
  "shoufen": {
    "url": "assets/products/originals/shoufen.jpg",
    "width": 824,
    "height": 1433,
    "quality": "original-supplied"
  },
  "sila-rice-xxl": {
    "url": "assets/products/originals/sila-rice-xxl.jpg",
    "width": 971,
    "height": 1335,
    "quality": "original-supplied"
  },
  "smeed": {
    "url": "assets/products/originals/smeed.jpg",
    "width": 1024,
    "height": 1385,
    "quality": "original-supplied"
  },
  "shea-seeds": {
    "url": "assets/products/originals/shea-seeds.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "bezer-al-ketan": {
    "url": "assets/products/originals/bezer-al-ketan.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "bezer-el-kettan": {
    "url": "assets/products/originals/bezer-al-ketan.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "bezer-dwar-el-shames": {
    "url": "assets/products/originals/bezer-dwar-el-shames.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "bezer-el-yaqtin": {
    "url": "assets/products/originals/bezer-el-yaqtin.jpg",
    "width": 1024,
    "height": 1509,
    "quality": "original-supplied"
  },
  "yansoun-najmeh": {
    "url": "assets/products/originals/yansoun-najmeh.jpg",
    "width": 1019,
    "height": 1506,
    "quality": "original-supplied"
  },
  "sugar-free-jeleb": {
    "url": "assets/products/originals/sugar-free-jeleb.jpg",
    "width": 1020,
    "height": 1510,
    "quality": "original-supplied"
  },
  "fustuq-halabi-kasr": {
    "url": "assets/products/originals/fustuq-halabi-kasr.jpg",
    "width": 1020,
    "height": 1412,
    "quality": "original-supplied"
  },
  "fustuq-halabi-hab": {
    "url": "assets/products/originals/fustuq-halabi-hab.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "bodret-el-basal": {
    "url": "assets/products/originals/bodret-el-basal.jpg",
    "width": 864,
    "height": 1296,
    "quality": "original-supplied"
  },
  "bhar-el-tawouk": {
    "url": "assets/products/originals/bhar-el-tawouk.jpg",
    "width": 1017,
    "height": 1404,
    "quality": "original-supplied"
  },
  "jeleb": {
    "url": "assets/products/originals/jeleb.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "himalaya-salt": {
    "url": "assets/products/originals/himalaya-salt.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "icing-sugar": {
    "url": "assets/products/originals/icing-sugar.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "snoubar": {
    "url": "assets/products/originals/snoubar.jpg",
    "width": 985,
    "height": 1367,
    "quality": "original-supplied"
  },
  "brown-sugar": {
    "url": "assets/products/originals/brown-sugar.jpg",
    "width": 805,
    "height": 1260,
    "quality": "original-supplied"
  },
  "waraq-ghar": {
    "url": "assets/products/originals/waraq-ghar.jpg",
    "width": 780,
    "height": 1024,
    "quality": "original-supplied"
  },
  "bhar-el-salek": {
    "url": "assets/products/originals/bhar-el-salek.jpg",
    "width": 869,
    "height": 1022,
    "quality": "original-supplied"
  },
  "theen-farkha": {
    "url": "assets/products/originals/theen-farkha.jpg",
    "width": 928,
    "height": 1024,
    "quality": "original-supplied"
  },
  "bhar-samak": {
    "url": "assets/products/originals/bhar-samak.jpg",
    "width": 1024,
    "height": 1024,
    "quality": "original-supplied"
  },
  "oshrok": {
    "url": "assets/products/originals/oshrok.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "bhar-shawarma-lahme": {
    "url": "assets/products/originals/bhar-shawarma-lahme.jpg",
    "width": 1024,
    "height": 1421,
    "quality": "original-supplied"
  },
  "bhar-fahita": {
    "url": "assets/products/originals/bhar-fahita.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "paprika-mdakhane": {
    "url": "assets/products/originals/paprika-mdakhane.jpg",
    "width": 894,
    "height": 1364,
    "quality": "original-supplied"
  },
  "bhar-shawarma-djej": {
    "url": "assets/products/originals/bhar-shawarma-djej.jpg",
    "width": 820,
    "height": 1305,
    "quality": "original-supplied"
  },
  "shoufen-flour": {
    "url": "assets/products/originals/shoufen-flour.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "almond-flour": {
    "url": "assets/products/originals/almond-flour.jpg",
    "width": 745,
    "height": 1237,
    "quality": "original-supplied"
  },
  "zbeeb-ashlamish": {
    "url": "assets/products/originals/zbeeb-ashlamish.jpg",
    "width": 1024,
    "height": 1358,
    "quality": "original-supplied"
  },
  "hail-hab": {
    "url": "assets/products/originals/hail-hab.jpg",
    "width": 1024,
    "height": 1515,
    "quality": "original-supplied"
  },
  "austrailian-aadas": {
    "url": "assets/products/originals/austrailian-aadas.jpg",
    "width": 980,
    "height": 1429,
    "quality": "original-supplied"
  },
  "fasolya-aarida": {
    "url": "assets/products/originals/fasolya-aarida.jpg",
    "width": 816,
    "height": 1278,
    "quality": "original-supplied"
  },
  "humus-fahle": {
    "url": "assets/products/originals/humus-fahle.jpg",
    "width": 768,
    "height": 1340,
    "quality": "original-supplied"
  },
  "khaltet-el-manaa": {
    "url": "assets/products/originals/khaltet-el-manaa.jpg",
    "width": 1021,
    "height": 1393,
    "quality": "original-supplied"
  },
  "korfa-oud": {
    "url": "assets/products/originals/korfa-oud.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "korfa-cigar": {
    "url": "assets/products/originals/korfa-cigar.jpg",
    "width": 887,
    "height": 1301,
    "quality": "original-supplied"
  },
  "korfa-silani": {
    "url": "assets/products/originals/korfa-silani.jpg",
    "width": 1009,
    "height": 1487,
    "quality": "original-supplied"
  },
  "kamoun-neeme": {
    "url": "assets/products/originals/kamoun-neeme.jpg",
    "width": 848,
    "height": 1413,
    "quality": "original-supplied"
  },
  "kary-har": {
    "url": "assets/products/originals/kary-har.jpg",
    "width": 907,
    "height": 1451,
    "quality": "original-supplied"
  },
  "har-kheshen": {
    "url": "assets/products/originals/har-kheshen.jpg",
    "width": 917,
    "height": 1421,
    "quality": "original-supplied"
  },
  "koronfol": {
    "url": "assets/products/originals/koronfol.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "har-neeme": {
    "url": "assets/products/originals/har-neeme.jpg",
    "width": 950,
    "height": 1416,
    "quality": "original-supplied"
  },
  "krawya": {
    "url": "assets/products/originals/krawya.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "kary-helo": {
    "url": "assets/products/originals/kary-helo.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "naanaa-yebes": {
    "url": "assets/products/originals/naanaa-yebes.jpg",
    "width": 828,
    "height": 1374,
    "quality": "original-supplied"
  },
  "bhar-el-riz": {
    "url": "assets/products/originals/bhar-el-riz.jpg",
    "width": 1054,
    "height": 1492,
    "quality": "original-supplied"
  },
  "dried-rose-petals": {
    "url": "assets/products/originals/dried-rose-petals.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "khaltet-el-unoutha": {
    "url": "assets/products/originals/khaltet-el-unoutha.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "somsom-be-kshroh": {
    "url": "assets/products/originals/somsom-be-kshroh.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "goji-berries": {
    "url": "assets/products/originals/goji-berries.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "cranberries": {
    "url": "assets/products/originals/cranberries.jpg",
    "width": 1054,
    "height": 1492,
    "quality": "original-supplied"
  },
  "viventia-rosemary-oil": {
    "url": "assets/products/originals/viventia-rosemary-oil.jpg",
    "width": 792,
    "height": 1040,
    "quality": "original-supplied"
  },
  "roasted-cheese-corn": {
    "url": "assets/products/originals/roasted-cheese-corn.jpg",
    "width": 917,
    "height": 1444,
    "quality": "original-supplied"
  },
  "krikri": {
    "url": "assets/products/originals/krikri.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "secar-nabat": {
    "url": "assets/products/originals/secar-nabat.jpg",
    "width": 1024,
    "height": 1505,
    "quality": "original-supplied"
  },
  "bonbon": {
    "url": "assets/products/originals/bonbon.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "sheeh": {
    "url": "assets/products/originals/sheeh.jpg",
    "width": 1004,
    "height": 1506,
    "quality": "original-supplied"
  },
  "kamoun-hab": {
    "url": "assets/products/originals/kamoun-hab.jpg",
    "width": 983,
    "height": 1441,
    "quality": "original-supplied"
  },
  "elixir": {
    "url": "assets/products/originals/elixir.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "shoumar-neeme": {
    "url": "assets/products/originals/shoumar-neeme.jpg",
    "width": 889,
    "height": 1334,
    "quality": "original-supplied"
  },
  "daqet-el-kaek": {
    "url": "assets/products/originals/daqet-el-kaek.jpg",
    "width": 943,
    "height": 1194,
    "quality": "original-supplied"
  },
  "louban-el-dakar": {
    "url": "assets/products/originals/louban-el-dakar.jpg",
    "width": 1018,
    "height": 1344,
    "quality": "original-supplied"
  },
  "dried-moghrabieh": {
    "url": "assets/products/originals/dried-moghrabieh.jpg",
    "width": 956,
    "height": 1229,
    "quality": "original-supplied"
  },
  "bazela-yebsa": {
    "url": "assets/products/originals/bazela-yebsa.jpg",
    "width": 1058,
    "height": 1455,
    "quality": "original-supplied"
  },
  "moringa-tea": {
    "url": "assets/products/originals/moringa-tea.jpg",
    "width": 1024,
    "height": 1494,
    "quality": "original-supplied"
  },
  "green-tea": {
    "url": "assets/products/originals/green-tea.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "mahlab": {
    "url": "assets/products/originals/mahlab.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "proplis-with-ethanol": {
    "url": "assets/products/originals/proplis-with-ethanol.jpg",
    "width": 987,
    "height": 1480,
    "quality": "original-supplied"
  },
  "raw-proplis": {
    "url": "assets/products/originals/raw-proplis.jpg",
    "width": 1015,
    "height": 1471,
    "quality": "original-supplied"
  },
  "white-honey-blend": {
    "url": "assets/products/originals/white-honey-blend.jpg",
    "width": 1023,
    "height": 1486,
    "quality": "original-supplied"
  },
  "immune-boosting-honey-blend": {
    "url": "assets/products/originals/immune-boosting-honey-blend.jpg",
    "width": 1024,
    "height": 1477,
    "quality": "original-supplied"
  },
  "cedar-honey": {
    "url": "assets/products/originals/cedar-honey.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "flower-honey": {
    "url": "assets/products/originals/flower-honey.jpg",
    "width": 1024,
    "height": 1504,
    "quality": "original-supplied"
  },
  "wild-thistle-honey": {
    "url": "assets/products/originals/wild-thistle-honey.jpg",
    "width": 983,
    "height": 1495,
    "quality": "original-supplied"
  },
  "honey-vingar": {
    "url": "assets/products/originals/honey-vingar.jpg",
    "width": 1024,
    "height": 1506,
    "quality": "original-supplied"
  },
  "oak-honey": {
    "url": "assets/products/originals/oak-honey.jpg",
    "width": 1024,
    "height": 1488,
    "quality": "original-supplied"
  },
  "bhar-el-escalope": {
    "url": "assets/products/originals/bhar-el-escalope.jpg",
    "width": 941,
    "height": 1454,
    "quality": "original-supplied"
  },
  "kurkum-hab": {
    "url": "assets/products/originals/kurkum-hab.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "karkadeh": {
    "url": "assets/products/originals/karkadeh.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "kinwa-bayda": {
    "url": "assets/products/originals/kinwa-bayda.jpg",
    "width": 1024,
    "height": 1472,
    "quality": "original-supplied"
  },
  "aasal-bshahdo": {
    "url": "assets/products/originals/aasal-bshahdo.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "bee-pollen": {
    "url": "assets/products/originals/bee-pollen.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "mounet-el-nahel-honey-blend": {
    "url": "assets/products/originals/mounet-el-nahel-honey-blend.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "avocado-orange-blossom-honey": {
    "url": "assets/products/originals/avocado-orange-blossom-honey.jpg",
    "width": 933,
    "height": 1412,
    "quality": "original-supplied"
  },
  "aasfor": {
    "url": "assets/products/originals/aasfor.jpg",
    "width": 1054,
    "height": 1492,
    "quality": "original-supplied"
  },
  "daqet-kaak-el-abas": {
    "url": "assets/products/originals/daqet-kaak-el-abas.jpg",
    "width": 1023,
    "height": 1537,
    "quality": "original-supplied"
  },
  "debes-el-fleyfleh": {
    "url": "assets/products/originals/debes-el-fleyfleh.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "date-paste": {
    "url": "assets/products/originals/date-paste.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "mix-and-eat-chickpeas": {
    "url": "assets/products/originals/mix-and-eat-chickpeas.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "oatmeal-cookies": {
    "url": "assets/products/originals/oatmeal-cookies.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "peanut-butter-and-molasses": {
    "url": "assets/products/originals/peanut-butter-and-molasses.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "tahini": {
    "url": "assets/products/originals/tahini.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "carob-molasses-glass-jar": {
    "url": "assets/products/originals/carob-molasses-glass-jar.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "debes-el-enab": {
    "url": "assets/products/originals/debes-el-enab.jpg",
    "width": 1200,
    "height": 1311,
    "quality": "original-supplied"
  },
  "pumpkin-seed-oil": {
    "url": "assets/products/originals/pumpkin-seed-oil.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "blackseed-oil": {
    "url": "assets/products/originals/blackseed-oil.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "argan-oil": {
    "url": "assets/products/originals/argan-oil.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "rose-oil": {
    "url": "assets/products/originals/rose-oil.jpg",
    "width": 1024,
    "height": 1535,
    "quality": "original-supplied"
  },
  "bitter-almond-oil": {
    "url": "assets/products/originals/bitter-almond-oil.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "coconut-oil": {
    "url": "assets/products/originals/coconut-oil.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "sweet-almond-oil": {
    "url": "assets/products/originals/sweet-almond-oil.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "rosemary-oil": {
    "url": "assets/products/originals/rosemary-oil.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "sharab-el-ward": {
    "url": "assets/products/originals/sharab-el-ward.jpg",
    "width": 1054,
    "height": 1492,
    "quality": "original-supplied"
  },
  "sharab-el-tout": {
    "url": "assets/products/originals/sharab-el-tout.jpg",
    "width": 1054,
    "height": 1492,
    "quality": "original-supplied"
  },
  "bahar-maghrabiya": {
    "url": "assets/products/originals/bahar-maghrabiya.jpg",
    "width": 857,
    "height": 1428,
    "quality": "original-supplied"
  },
  "bahar-maklouba": {
    "url": "assets/products/originals/bahar-maklouba.jpg",
    "width": 914,
    "height": 1399,
    "quality": "original-supplied"
  },
  "zaytoun-aswad-baladi": {
    "url": "assets/products/originals/zaytoun-aswad-baladi.jpg",
    "width": 1060,
    "height": 1484,
    "quality": "original-supplied"
  },
  "baking-powder": {
    "url": "assets/products/originals/baking-powder.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "vanilla": {
    "url": "assets/products/originals/vanilla.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "zaytoun-akhdar-baladi": {
    "url": "assets/products/originals/zaytoun-akhdar-baladi.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "salamki": {
    "url": "assets/products/originals/salamki.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "hab-el-rashad": {
    "url": "assets/products/originals/hab-el-rashad.jpg",
    "width": 1055,
    "height": 1491,
    "quality": "original-supplied"
  },
  "zoufah": {
    "url": "assets/products/originals/zoufah.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "arabic-gum": {
    "url": "assets/products/originals/arabic-gum.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "termos-morr": {
    "url": "assets/products/originals/termos-morr.jpg",
    "width": 1122,
    "height": 1402,
    "quality": "original-supplied"
  },
  "burglur-abyad-faksh": {
    "url": "assets/products/originals/burglur-abyad-faksh.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "burglur-asmar-faksh": {
    "url": "assets/products/originals/burglur-asmar-faksh.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "sea-salt": {
    "url": "assets/products/originals/sea-salt.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "olive-oil-soap": {
    "url": "assets/products/originals/olive-oil-soap.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "bhar-maggi": {
    "url": "assets/products/originals/bhar-maggi.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "chinese-salt": {
    "url": "assets/products/originals/chinese-salt.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "loz-mkataa": {
    "url": "assets/products/originals/loz-mkataa.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "bahar-ouzi": {
    "url": "assets/products/originals/bahar-ouzi.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "bhar-philadelphia": {
    "url": "assets/products/originals/bhar-philadelphia.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "zaatar-jordanian-mix": {
    "url": "assets/products/originals/zaatar-jordanian-mix.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "labneh-mkaazleh-habet-barakeh": {
    "url": "assets/products/originals/labneh-mkaazleh-habet-barakeh.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "sugar-free-rose-jam": {
    "url": "assets/products/originals/sugar-free-rose-jam.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "sugar-free-strawberry-jam": {
    "url": "assets/products/originals/sugar-free-strawberry-jam.jpg",
    "width": 900,
    "height": 1600,
    "quality": "original-supplied"
  },
  "golden-sila-basmati-rice": {
    "url": "assets/products/originals/golden-sila-basmati-rice.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "long-grain-brown-rice": {
    "url": "assets/products/originals/long-grain-brown-rice.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "saad-oil": {
    "url": "assets/products/originals/saad-oil.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "raw-pecans": {
    "url": "assets/products/originals/raw-pecans.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "suger-free-mulberry": {
    "url": "assets/products/originals/suger-free-mulberry.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "mraba-el-tin-mamrout": {
    "url": "assets/products/originals/mraba-el-tin-mamrout.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "jozet-el-teeb-nameeh": {
    "url": "assets/products/originals/jozet-el-teeb-nameeh.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "loumi-mathoun": {
    "url": "assets/products/originals/loumi-mathoun.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "raw-peeled-peanuts": {
    "url": "assets/products/originals/raw-peeled-peanuts.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "bhar-lahme-baajeen": {
    "url": "assets/products/originals/bhar-lahme-baajeen.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "hive-soap": {
    "url": "assets/products/originals/hive-soap.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "bee-pollen-soap": {
    "url": "assets/products/originals/bee-pollen-soap.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "honey-soap": {
    "url": "assets/products/originals/honey-soap.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "coal-soap": {
    "url": "assets/products/originals/coal-soap.jpg",
    "width": 1122,
    "height": 1402,
    "quality": "original-supplied"
  },
  "makdous-el-beqaa-seda": {
    "url": "assets/products/originals/makdous-el-beqaa-seda.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  },
  "kishek-akhdar-bil-joz": {
    "url": "assets/products/originals/kishek-akhdar-bil-joz.jpg",
    "width": 1024,
    "height": 1481,
    "quality": "original-supplied"
  },
  "qlobet-naye": {
    "url": "assets/products/originals/qlobet-naye.jpg",
    "width": 650,
    "height": 1155,
    "quality": "original-supplied"
  },
  "kishek-bakari-beqaa": {
    "url": "assets/products/originals/kishek-bakari-beqaa.jpg",
    "width": 1086,
    "height": 1448,
    "quality": "original-supplied"
  },
  "zaytoun-akhdar-koura": {
    "url": "assets/products/originals/zaytoun-akhdar-koura.jpg",
    "width": 1024,
    "height": 1536,
    "quality": "original-supplied"
  }
};
  const sourceFor = id => map[id] || null;
  window.ZWM_PRODUCT_PHOTOS = {
    map, sourceFor, cardSourceFor: sourceFor, tile: sourceFor,
    load(){ return Promise.resolve(true); }
  };
})();
