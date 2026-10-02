/* Supplied Zayt w Mouneh product photography only — batches 1–2. */
(function(){
  const sources={"batch1":{"tileW":300,"tileH":450,"atlasW":1800,"atlasH":2700,"atlasUrl":"assets/products/catalog-refresh-batch1.webp?v=20261002-batch1"},"b2r1":{"tileW":200,"tileH":300,"atlasW":1200,"atlasH":300,"atlasUrl":"assets/products/catalog-b2-row1.webp?v=20261002-b2"},"b2r2":{"tileW":200,"tileH":300,"atlasW":1200,"atlasH":300,"atlasUrl":"assets/products/catalog-b2-row2.webp?v=20261002-b2"},"b2r3":{"tileW":200,"tileH":300,"atlasW":1200,"atlasH":300,"atlasUrl":"assets/products/catalog-b2-row3.webp?v=20261002-b2"},"b2r4":{"tileW":200,"tileH":300,"atlasW":1200,"atlasH":300,"atlasUrl":"assets/products/catalog-b2-row4.webp?v=20261002-b2"},"b2r5":{"tileW":200,"tileH":300,"atlasW":1200,"atlasH":300,"atlasUrl":"assets/products/catalog-b2-row5.webp?v=20261002-b2"},"b2r6":{"tileW":200,"tileH":300,"atlasW":1200,"atlasH":300,"atlasUrl":"assets/products/catalog-b2-row6.webp?v=20261002-b2"},"b2r7":{"tileW":200,"tileH":300,"atlasW":1200,"atlasH":300,"atlasUrl":"assets/products/catalog-b2-row7.webp?v=20261002-b2"},"b2r8":{"tileW":200,"tileH":300,"atlasW":1200,"atlasH":300,"atlasUrl":"assets/products/catalog-b2-row8.webp?v=20261002-b2"}};
  const map={"teen-mjafaf":["batch1",0,0],"bezer-el-yaqtin":["batch1",1,0],"loz-mkataa":["batch1",2,0],"kajo-falkat":["batch1",3,0],"fustuq-halabi-hab":["batch1",4,0],"aamar-el-din-kotaa":["batch1",5,0],"molokhiya":["batch1",0,1],"himalaya-salt":["batch1",1,1],"popcorn-jumbo":["batch1",2,1],"bahar-ouzi":["batch1",3,1],"bhar-philadelphia":["batch1",4,1],"zaatar-jordanian-mix":["batch1",5,1],"sugar-free-rose-jam":["batch1",0,2],"sugar-free-strawberry-jam":["batch1",1,2],"golden-sila-basmati-rice":["batch1",2,2],"burglur-asmar-kheshen":["batch1",3,2],"saad-oil":["batch1",4,2],"raw-pecans":["batch1",5,2],"sharab-el-tout":["b2r4",4,0],"jozet-el-teeb-nameeh":["batch1",1,3],"loumi-mathoun":["batch1",2,3],"mraba-el-tin-yebes":["batch1",3,3],"mraba-el-tin-mamrout":["batch1",4,3],"mraba-el-fraise":["batch1",5,3],"mraba-el-karaz":["batch1",0,4],"mraba-el-ward":["batch1",1,4],"mraba-el-tout":["batch1",2,4],"raw-peeled-peanuts":["batch1",3,4],"bandoura-mujafafeh":["batch1",4,4],"bhar-lahme-baajeen":["batch1",5,4],"hive-soap":["batch1",0,5],"bee-pollen-soap":["batch1",1,5],"honey-soap":["batch1",2,5],"aasal-bshahdo":["b2r1",0,0],"bee-pollen":["b2r1",1,0],"mounet-el-nahel-honey-blend":["b2r1",2,0],"aasfor":["b2r1",3,0],"joz-farashe":["b2r1",4,0],"daqet-kaak-el-abas":["b2r1",5,0],"ardi-shawki":["b2r2",0,0],"mix-and-eat-chickpeas":["b2r2",1,0],"oatmeal-cookies":["b2r2",2,0],"peanut-butter-and-molasses":["b2r2",3,0],"tahini":["b2r2",4,0],"debes-el-enab":["b2r2",5,0],"chamomile":["b2r3",0,0],"pumpkin-seed-oil":["b2r3",1,0],"blackseed-oil":["b2r3",2,0],"argan-oil":["b2r3",3,0],"rose-oil":["b2r3",4,0],"bitter-almond-oil":["b2r3",5,0],"coconut-oil":["b2r4",0,0],"sweet-almond-oil":["b2r4",1,0],"rosemary-oil":["b2r4",2,0],"sharab-el-ward":["b2r4",3,0],"bahar-maghrabiya":["b2r4",5,0],"bahar-maklouba":["b2r5",0,0],"kabees-meshakal":["b2r5",1,0],"zaytoun-aswad-baladi":["b2r5",2,0],"baking-powder":["b2r5",3,0],"vanilla":["b2r5",4,0],"zaytoun-akhdar-baladi":["b2r5",5,0],"salamki":["b2r6",0,0],"hab-el-rashad":["b2r6",1,0],"zoufah":["b2r6",2,0],"arabic-gum":["b2r6",3,0],"burglur-abyad-faksh":["b2r6",4,0],"burglur-asmar-faksh":["b2r6",5,0],"sea-salt":["b2r7",0,0],"coal-soap":["b2r7",1,0],"viventia-rosemary-oil":["b2r7",2,0],"olive-oil-soap":["b2r7",3,0],"honey-vingar":["b2r7",4,0],"bhar-maggi":["b2r7",5,0],"chinese-salt":["b2r8",0,0]};
  const sourceFor=(id)=>{
    const ref=map[id];
    if(!ref)return null;
    const source=sources[ref[0]];
    if(!source)return null;
    return {
      coords:[ref[1],ref[2]],
      focus:null,
      tileW:source.tileW,
      tileH:source.tileH,
      atlasW:source.atlasW,
      atlasH:source.atlasH,
      atlasUrl:source.atlasUrl,
      quality:"supplied"
    };
  };
  window.ZWM_PRODUCT_PHOTOS={
    sources,
    map,
    tile:sourceFor,
    sourceFor,
    load(){return Promise.resolve(true);}
  };
})();
