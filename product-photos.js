/* Product photography refresh — supplied Zayt w Mouneh artwork, batch 1. */
(function(){
  const cfg={
    cols:6, rows:6, tileW:300, tileH:450, atlasW:1800, atlasH:2700,
    map:{"teen-mjafaf":[0,0],"bezer-el-yaqtin":[1,0],"loz-mkataa":[2,0],"kajo-falkat":[3,0],"fustuq-halabi-hab":[4,0],"aamar-el-din-kotaa":[5,0],"molokhiya":[0,1],"himalaya-salt":[1,1],"popcorn-jumbo":[2,1],"bahar-ouzi":[3,1],"bhar-philadelphia":[4,1],"zaatar-jordanian-mix":[5,1],"sugar-free-rose-jam":[0,2],"sugar-free-strawberry-jam":[1,2],"golden-sila-basmati-rice":[2,2],"burglur-asmar-kheshen":[3,2],"saad-oil":[4,2],"raw-pecans":[5,2],"sharab-el-tout":[0,3],"jozet-el-teeb-nameeh":[1,3],"loumi-mathoun":[2,3],"mraba-el-tin-yebes":[3,3],"mraba-el-tin-mamrout":[4,3],"mraba-el-fraise":[5,3],"mraba-el-karaz":[0,4],"mraba-el-ward":[1,4],"mraba-el-tout":[2,4],"raw-peeled-peanuts":[3,4],"bandoura-mujafafeh":[4,4],"bhar-lahme-baajeen":[5,4],"hive-soap":[0,5],"bee-pollen-soap":[1,5],"honey-soap":[2,5]},
    focus:{},
    atlasUrl:"assets/products/catalog-refresh-batch1.webp?v=20261002-batch1",
    tile(id){return this.map[id]||null;},
    load(){return Promise.resolve(this.atlasUrl);}
  };
  window.ZWM_PRODUCT_PHOTOS=cfg;
})();
