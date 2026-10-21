/* Shared catalogue search. French names mirror fr-runtime-v1.js, independent of UI locale. */
(function(root){
"use strict";
const frenchNames={"Baking Powder":"Levure chimique","Brown Sugar":"Sucre brun","Carbonate":"Carbonate","Chinese Salt":"Sel chinois","Citric Acid (Lemon Salt)":"Acide citrique (sel de citron)","Himalayan Salt":"Sel de l’Himalaya","Icing Sugar":"Sucre glace","Iodized Salt":"Sel iodé","Pakmaya Yeast":"Levure Pakmaya","Sea Salt":"Sel marin","Rock Sugar":"Sucre candi","White Sugar":"Sucre blanc","Date Paste":"Pâte de dattes","Bisco Choco":"Bisco Choco","Caramel Craze":"Caramel Craze","Carob Biscuit":"Biscuit à la caroube","Carob Cookies":"Cookies à la caroube","Carob Date Bites":"Bouchées à la caroube et aux dattes","Carob Maacroun":"Maacroun à la caroube","Carob Molasses Glass Jar":"Mélasse de caroube — pot en verre","Carob Molasses Plastic Jar":"Mélasse de caroube — pot en plastique","Carobella":"Carobella","Cherry Craze":"Cherry Craze","Choco Cookies":"Cookies au chocolat","Choco Peanut Cookies":"Cookies chocolat-cacahuète","Chocopeas":"Chocopeas","Coconut Cookies":"Cookies à la noix de coco","Coconut Carob Balls":"Boules à la noix de coco et à la caroube","Craze Control":"Craze Control","Crunchy Craze":"Crunchy Craze","Crunchy Seeds":"Graines croquantes","Debsy Pretzy":"Debsy Pretzy","Ginger Biscuit":"Biscuit au gingembre","Hazelnut Craze":"Hazelnut Craze","Mix and Eat Chickpeas":"Pois chiches Mix & Eat","Nutty Bites":"Bouchées aux noix","Oat Kaak with Cheese":"Kaak à l’avoine et au fromage","Oat Kaak with Sesame":"Kaak à l’avoine et au sésame","Oat Kaak with Sunflower Seeds":"Kaak à l’avoine et aux graines de tournesol","Oat Kaak with Thyme":"Kaak à l’avoine et au thym","Oatmeal Cookies":"Cookies à l’avoine","Peanut Butter and Molasses":"Beurre de cacahuète et mélasse","Peanuts Carob Bar":"Barre à la cacahuète et à la caroube","Raisin Cookies":"Cookies aux raisins secs","Ricky Ricardo":"Ricky Ricardo","Sesame Carob Bar":"Barre au sésame et à la caroube","Sesame Cookies":"Cookies au sésame","Tahini":"Tahini","Jallab Syrup":"Sirop de jallab","Rose Water":"Eau de rose","Orange Blossom Water":"Eau de fleur d’oranger","Myrtle Distillate":"Distillat de myrte","Hawthorn Distillate":"Distillat d’aubépine","Thyme Distillate":"Distillat de thym","Mulberry Syrup":"Sirop de mûre","Rose Syrup":"Sirop de rose","Sugar-Free Jeleb":"Jallab sans sucre","Sugar-Free Mulberry Syrup":"Sirop de mûre sans sucre","Apricot Fruit Leather Pieces":"Morceaux de pâte d’abricot","Prunes":"Pruneaux","Cranberries":"Canneberges","Goji Berries":"Baies de goji","Grated Coconut":"Noix de coco râpée","Dried Apricots — 500 g":"Apricots — 500 g séché","Dried Apricots — 250 g":"Apricots — 250 g séché","Sun-Dried Tomatoes":"Tomates séchées au soleil","String-Dried Figs":"Figues séchées en chapelet","Dried Figs":"Figues sèches","Barberries":"Épine-vinette","Ashlamish Raisins":"Raisins secs Ashlamish","Black Raisins":"Raisins secs noirs","Chilean Raisins":"Raisins secs chiliens","All-Purpose Flour":"Farine tout usage","Almond Flour":"Farine de amande","Barley Flour":"Farine de orge","Corn Flour":"Farine de maïs","Dora Flour (Corn Flour)":"Dora Flour (Corn Flour)","Oat Flour":"Farine de avoine","Farina Flour":"Farine de semoule fine","Whole Wheat Flour":"Farine de blé complet","Yeast":"Levure","Zero Flour":"Farine zéro","American Rice":"Riz américain","Baldo Italian Rice":"Riz italien Baldo","Barley":"Orge","Extra-Coarse White Bulgur":"Boulgour blanc extra gros","Coarse White Bulgur":"Boulgour blanc gros","Fine White Bulgur":"Boulgour blanc fin","Extra-Coarse Brown Bulgur":"Boulgour brun extra gros","Coarse Brown Bulgur":"Boulgour brun gros","Fine Brown Bulgur":"Boulgour brun fin","Dried Moghrabieh":"Moghrabieh séchée","Egyptian Rice":"Riz égyptien","Freekeh":"Freekeh","Golden Sila Basmati Rice":"Riz basmati Sila doré","Whole Wheat Berries":"Grains de blé entier","Cracked Wheat":"Blé concassé","White Quinoa":"Quinoa blanc","Long Grain Brown Rice":"Riz brun à grains longs","Mixed Grains":"Mélange de céréales","Popcorn":"Maïs à éclater","Popcorn Jumbo":"Maïs à éclater jumbo","Fine Rice":"Riz fin","Vermicelli":"Vermicelles","Oats":"Avoine","Sila Rice Xxl":"Riz Sila XXL","Semolina":"Semoule","Safflower":"Carthame","Chamomile":"Camomille","Dried Rose Petals":"Pétales de rose séchés","Dried Rosemary":"Romarin séché","Green Tea":"Thé vert","Habaa Herb":"Herbe habaa","Hibiscus":"Hibiscus","Immunity Herbal Blend":"Mélange de plantes « Immunité »","Women's Herbal Blend":"Mélange de plantes pour femmes","Marjoram":"Marjolaine","Dried Molokhia":"Molokhia séchée","Moringa Tea":"Thé au moringa","Dried Mint":"Menthe séchée","Oregano":"Origan","Oshrok Herb":"Herbe oshrok","Senna":"Séné","Wormwood":"Absinthe","Ceylon Tea":"Thé de Ceylan","Bay Leaves":"Feuilles de laurier","Mixed Herbal Infusion":"Mélange de plantes pour infusion","Hyssop":"Hysope","Zayt w Mouneh White Honey Blend":"Mélange de miel blanc Zayt w Mouneh","Honey with Honeycomb":"Miel avec rayon","Avocado & Orange Blossom Honey":"Miel d’avocat et de fleur d’oranger","Bee Pollen":"Pollen d’abeille","Cedar Honey":"Miel de cèdre","Flower Honey":"Miel de fleurs","Immune Boosting Honey Blend":"Mélange de miel pour l’immunité","Bee Bite":"Bouchée de l’abeille","Mounet El Nahel Honey Blend":"Mélange de miel Mounet El Nahel","Oak Honey":"Miel de chêne","Propolis with Ethanol":"Propolis à l’éthanol","Propolis with Olive Oil":"Propolis à l’huile d’olive","Raw Propolis":"Propolis brute","White Honey Blend":"Mélange de miel blanc","Wild Thistle Honey":"Miel de chardon sauvage","Grape Molasses":"Mélasse de raisin","Pomegranate Molasses":"Mélasse de grenade","Bandoura Mujafafeh (Sun-Dried Tomatoes)":"Bandoura Mujafafeh (Sun-Dried Tomatoes)","Dried Okra":"Gombo séché","Sweet Red Pepper Paste":"Pâte de poivron rouge douce","Spicy Red Pepper Paste":"Pâte de poivron rouge épicée","Green Kishk with Walnuts":"Kishk vert aux noix","Cow's-Milk Kishk - Bekaa":"Kishk au lait de vache — Bekaa","Goat's-Milk Kishk - Bekaa":"Kishk au lait de chèvre — Bekaa","Zayt w Mouneh Kishk":"Kishk Zayt w Mouneh","Labneh Balls with Nigella Seeds":"Boules de labneh à la nigelle","Spicy Labneh Balls":"Boules de labneh épicées","Labneh Balls with Mint":"Boules de labneh à la menthe","Plain Labneh Balls":"Boules de labneh nature","Labneh Balls with Za’atar":"Boules de labneh au za’atar","Spicy Bekaa Makdous":"Makdous épicé de la Bekaa","Plain Bekaa Makdous":"Makdous nature de la Bekaa","Almond Makdous":"Makdous aux amandes","Apricot Jam":"Confiture de abricot","Strawberry Jam":"Confiture de fraise","Cherry Jam":"Confiture de cerise","Mamrout Fig Jam":"Confiture de figues Mamrout","Dried Fig Jam":"Confiture de séché fig","Mulberry Jam":"Confiture de mûre","Rose Jam":"Confiture de rose","Pumpkin Jam":"Confiture de citrouille","Quince Jam":"Confiture de coing","Qawarma Preserved Meat":"Qawarma — viande confite","Tomato Paste":"Concentré de tomate","Za’atar Shanklish":"Shanklish au za’atar","Spicy Shanklish":"Shanklish épicé","Sugar-Free Rose Jam":"Confiture de rose sans sucre","Sugar-Free Strawberry Jam":"Confiture de fraise sans sucre","Grape Leaves with Labneh":"Feuilles de vigne au labneh","Grape Leaves":"Feuilles de vigne","Grape Leaves in Water":"Feuilles de vigne dans l’eau","Extra Baladi Za’atar":"Za’atar baladi extra","Aleppo Za’atar":"Za’atar d’Alep","Jordanian Za'atar Blend":"Mélange de za’atar jordanien","Manakish Za’atar":"Za’atar pour manakish","Za’atar with Nuts":"Za’atar aux noix","Ground Wild Thyme Flowers":"Fleurs de thym sauvage moulues","Flax Seeds":"Graines de lin","Sunflower Seeds":"Graines de tournesol","Pumpkin Seeds":"Graines de citrouille","Elixir":"Elixir","Whole Pistachios":"Pistaches entières","Shelled Pistachios":"Pistaches décortiquées","Garden Cress Seeds":"Graines de cresson alénois","Nigella Seeds (Black Seed)":"Graines de nigelle","Walnuts":"Noix","Cashew Halves":"Demi-noix de cajou","Krikri":"Krikri","Almonds in Shell":"Amandes en coque","Shelled Almonds":"Amandes décortiquées","Sliced Almonds":"Amandes effilées","Raw Nut Kernels":"Mélange de noix crues","Raw Pecans":"Noix de pécan crues","Raw Peeled Peanuts":"Cacahuètes crues pelées","Roasted Cheese Corn":"Maïs grillé au fromage","Roasted Salted Corn":"Maïs grillé salé","Chia Seeds":"Graines de chia","Pine Nuts":"Pignons de pin","Unhulled Sesame Seeds":"Graines de sésame non décortiquées","Toasted Sesame":"Sésame grillé","Raw Sesame":"Sésame cru","Argan Oil":"Huile d’argan","Bitter Almond Oil":"Huile d’amande amère","Black Seed Oil":"Huile de nigelle","Castor Seed Oil":"Huile de ricin","Coconut Oil":"Huile de coco","Pumpkin Seed Oil":"Huile de pépins de courge","Rose Oil":"Huile de rose","Rosemary Oil":"Huile de romarin","Saad Oil":"Huile de saad","Sweet Almond Oil":"Huile d’amande douce","Viventia Rosemary Oil":"Huile de romarin Viventia","Extra Virgin Olive Oil":"Huile d’olive extra vierge","Local Green Olives":"Olives vertes locales","Bekaa Green Olives":"Olives vertes de la Bekaa","Koura Green Olives":"Olives vertes du Koura","Spicy Stuffed Green Olives — 360 g":"Spicy Stuffed Green Olives — 360 g","Spicy Stuffed Green Olives — 2.5 kg":"Spicy Stuffed Green Olives — 2.5 kg","Local Black Olives":"Olives noires locales","Bekaa Black Olives":"Olives noires de la Bekaa","Jarjir Olives":"Olives au jarjir","Pickled Artichoke":"Artichaut mariné","Gherkins":"Cornichons","Pickled Almonds":"amandes mariné","Pickled Cucumber":"Concombre mariné","Pickled Turnip":"Navet mariné","Meete Pickles":"Légumes marinés Meete","Mixed Pickles":"Légumes marinés assortis","Spicy Pickles":"Légumes marinés épicés","Large Lentils":"Grosses lentilles","Split Lentils":"Lentilles cassées","Australian Lentils":"Lentilles australiennes","Dried Peas":"Pois secs","Broad White Beans":"Gros haricots blancs","Pine-Shaped Beans":"Haricots en forme de pignon","Large Fava Beans":"Grosses fèves","Fava Beans for Foul Mdammas":"Fèves pour foul mdammas","American Chickpeas":"Pois chiches américains","Local Chickpeas":"Pois chiches locaux","Large Chickpeas":"Gros pois chiches","Sweet Lupini Beans":"Lupins doux","Bitter Lupini Beans":"Lupins amers","Bee Pollen Soap":"Savon au pollen d’abeille","Charcoal Soap":"Savon au charbon","Hive Soap":"Savon de la ruche","Honey Soap":"Savon au miel","Olive Oil Soap":"Savon à l’huile d’olive","Arabic Gum":"Gomme arabique","Moghrabieh Seasoning":"Assaisonnement pour moghrabieh","Maqluba Seasoning":"Assaisonnement pour maqluba","Ouzi Seasoning":"Assaisonnement pour ouzi","White Pepper":"Poivre blanc","Whole Black Pepper":"Poivre noir en grains","Hot Black Pepper":"Poivre noir piquant","Potato Seasoning":"Assaisonnement pour pomme de terre","Crispy Seasoning":"Assaisonnement pour panure croustillante","Chicken Seasoning":"Assaisonnement pour poulet","Escalope Seasoning":"Assaisonnement pour escalope","Rice Seasoning":"Assaisonnement pour riz","Swiss Chard Seasoning":"Assaisonnement pour blettes","Shish Tawook Seasoning":"Assaisonnement pour shish tawook","Fajita Seasoning":"Assaisonnement pour fajita","Allspice":"Piment de la Jamaïque","Kabsa Seasoning":"Assaisonnement pour kabsa","Meat Seasoning":"Assaisonnement pour viande","Lahm bi Ajeen Seasoning":"Assaisonnement pour lahm bi ajeen","Maggi Seasoning":"Assaisonnement pour maggi","Mansaf Seasoning":"Assaisonnement pour mansaf","Grilling Seasoning":"Assaisonnement pour grillades","Philadelphia Seasoning":"Assaisonnement pour philadelphia","Fish Seasoning":"Assaisonnement pour poisson","Chicken Shawarma Seasoning":"Assaisonnement pour chawarma de poulet","Meat Shawarma Seasoning":"Assaisonnement pour chawarma de viande","Onion Powder":"Oignon en poudre","Garlic Powder":"Ail en poudre","Kaak Spice Mix":"Mélange d’épices kaak","Whole Kibbeh Spice":"Mélange d’épices pour kebbé — entier","Ground Kibbeh Spice":"Mélange d’épices pour kebbé — moulu","Abbas Kaak Spice Mix":"Mélange d’épices abbas kaak","Whole Cardamom":"Cardamome entière","Ground Cardamom":"Cardamome moulue","Coarse Hot Pepper":"Piment fort grossier","Fine Hot Pepper":"Piment fort fin","Fenugreek Seeds":"Graines de fenugrec","Whole Nutmeg":"Noix de muscade entière","Ground Nutmeg":"Muscade moulue","Cumin Seeds":"Graines de cumin","Ground Cumin":"Cumin moulu","Hot Curry":"Curry piquant","Mild Curry":"Curry doux","Cinnamon":"Cannelle","Cinnamon Sticks (Cigar)":"Cinnamon Sticks (Cigar)","Cinnamon Sticks (Oud)":"Cinnamon Sticks (Oud)","Ceylon Cinnamon":"Cannelle de Ceylan","Cloves":"Clous de girofle","Coriander Seeds":"Graines de coriandre","Ground Coriander":"Coriandre moulue","Caraway":"Carvi","Turmeric":"Curcuma","Whole Turmeric":"Curcuma entier","Frankincense":"Encens","Dried Lime":"Citron vert séché","Ground Dried Lime":"Citron vert séché moulu","Mahleb":"Mahleb","Paprika":"Paprika","Paprika Mdakhane":"Paprika fumé","Seven Spice":"Sept épices","Sumac":"Sumac","Fennel Seeds":"Graines de fenouil","Ground Fennel":"Fenouil moulu","Vanilla":"Vanille","Anise Seeds":"Graines d’anis","Star Anise":"Badiane","Ginger":"Gingembre","Bonbon":"Bonbon","Sabo":"Sabo","Bekaa Verjuice":"Verjus de la Bekaa","Koura Verjuice":"Verjus du Koura","Honey Vinegar":"Vinaigre de miel","Grape Vinegar":"Vinaigre de raisin","Apple Vinegar":"Vinaigre de pomme"};
const groups=[
 'oil|huile|زيت|zeit|zayt|zait',
 'olive oil|زيت زيتون|زيت الزيتون|zayt zaytoun|zayt zaytoon|zeit zeitoun',
 'olive|olives|زيتون|zaytoun|zaytoon|zeitoun|zaitoun',
 'zaatar|zatar|za ater|زعتر|za3tar',
 'thyme|thym|زعتر',
 'chickpea|chickpeas|hummus|hommos|hommous|humus|حمص|7omos',
 'lentil|lentils|lentille|lentilles|عدس|adas|3adas|aadas',
 'bulgur|boulgour|burghol|borghol|burgul|برغل',
 'freekeh|freek|frikeh|فريكة|فريك',
 'molasses|melasse|melasses|دبس|dibs|debs',
 'pomegranate|grenade|رمان|remmen|roumman|roman',
 'carob|caroube|خروب|kharoub|kharroub|5aroub',
 'honey|miel|عسل|asal|3asal|assal',
 'jam|confiture|مربى|مربي|mrabba|morabba',
 'apricot|apricots|abricot|abricots|مشمش|meshmesh|mishmish',
 'fig|figs|figue|figues|تين|teen|tin',
 'strawberry|fraise|فراولة|فريز|frez',
 'mulberry|mure|توت|tout',
 'tahini|tahina|tahine|طحينة|t7ine|tehini',
 'kishk|keshek|keshk|كشك',
 'labneh|labne|لبنة|labni',
 'makdous|makdoos|mekdous|مكدوس',
 'shanklish|shankleesh|chanklich|شنكليش',
 'qawarma|kawarma|awarma|قورما|قاورما',
 'garlic|ail|ثوم|توم|toum|thoum',
 'cumin|كمون|kamoun|kammoun',
 'sumac|sumak|somak|سماق|سمّاق',
 'coriander|coriandre|كزبرة|kezbara|kizbara',
 'cinnamon|cannelle|قرفة|ارفة|qerfe|erfe',
 'turmeric|curcuma|كركم|عقدة صفرا|kurkum',
 'ginger|gingembre|زنجبيل|zanjabil',
 'mint|menthe|نعنع|نعناع|na3na3',
 'anise|anis|يانسون|yensoun',
 'fennel|fenouil|شومر|shoumar',
 'fenugreek|fenugrec|حلبة|helbe|7elbeh',
 'nigella|nigelle|حبة البركة|حبة سوداء|habbet el barake',
 'sesame|sesame|سمسم|semsom',
 'rice|riz|ارز|رز|rezz|rouz',
 'flour|farine|طحين|دقيق|t7in|taheen',
 'wheat|ble|قمح|ameh|qamh',
 'oat|oats|avoine|شوفان|choufan',
 'barley|orge|شعير|cha3ir',
 'semolina|semoule|سميد|smid',
 'vermicelli|vermicelles|شعيرية|cha3riye',
 'bean|beans|haricot|haricots|فاصوليا|fasoulia',
 'fava|foul|foule|فول|feves',
 'pea|peas|بازيلا|بازلاء|bezella',
 'sugar|sucre|سكر|sekar|sukkar',
 'salt|sel|ملح|mele7|milh',
 'pepper|poivre|فلفل|فليفلة',
 'vinegar|vinaigre|خل|khal|5al',
 'pickle|pickles|pickled|marines|marine|مخلل|كبيس|kabis|kabees',
 'cucumber|concombre|خيار|khyar',
 'turnip|navet|لفت|left',
 'tomato|tomatoes|tomate|tomates|بندورة|طماطم|banadoura',
 'grape|raisin|عنب|3enab',
 'raisin|raisins|زبيب|zbib',
 'lemon|citron|ليمون|حامض|laymoun|7amod',
 'rose|ورد|wared',
 'water|eau|ماء|مي|may',
 'blossom|زهر|zaher',
 'walnut|walnuts|noix|جوز|joz',
 'almond|almonds|amande|amandes|لوز|lawz',
 'peanut|peanuts|cacahuete|cacahuetes|فستق سوداني',
 'pistachio|pistache|فستق حلبي',
 'cashew|cashews|كاجو|cajou',
 'soap|savon|صابون|saboun',
 'date|dates|datte|dattes|تمر|tamer',
 'seed|seeds|graine|graines|بذور',
 'spice|spices|epice|epices|بهار|بهارات|bharat',
 'dried|dry|sec|secs|seche|seches|مجفف|يابس',
 'ground|powder|moulu|moulue|poudre|مطحون|بودرة|ناعم',
 'whole|entier|entiere|حب|كامل',
 'green|vert|verte|اخضر|خضراء',
 'black|noir|noire|اسود|سوداء',
 'white|blanc|blanche|ابيض|بيضاء',
 'brown|brun|brune|اسمر|بني',
 'red|rouge|احمر|حمراء',
 'coarse|gros|خشن',
 'fine|fin|fine|ناعم',
 'virgin|vierge|بكر|beker|bikr',
 'extra|ممتاز|momtaz|mumtaz',
 'kg|kilogram|kilograms|كيلو|كيلوغرام|كغ',
 'g|gram|grams|غرام|جرام|غ',
 'l|litre|liter|litres|liters|لتر',
];
function normalize(value){
 return String(value==null?'':value).normalize('NFKD').toLowerCase()
  .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g,'')
  .replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي')
  .replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776))
  .replace(/([a-z])3(?=[a-z])/g,'$1a').replace(/3(?=[a-z])/g,'a')
  .replace(/7['’](?=[a-z])/g,'kh').replace(/5(?=[a-z])/g,'kh').replace(/7(?=[a-z])/g,'h')
  .replace(/6(?=[a-z])/g,'t').replace(/8(?=[a-z])/g,'gh').replace(/9(?=[a-z])/g,'s').replace(/2(?=[a-z])/g,'a')
  .replace(/\b[dl]['’](?=[a-z])/g,'').replace(/['’`]/g,'').replace(/(\d)([a-z\u0621-\u064a])/g,'$1 $2')
  .replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
}
function tokens(value){return normalize(value).split(' ').filter(Boolean).map(t=>/^ال[\u0621-\u064a]{3,}$/.test(t)?t.slice(2):t)}
const aliases=new Map();
groups.forEach((group,index)=>group.split('|').forEach(term=>{
 const key=tokens(term).join(' ');
 for(const form of new Set([key,key.replace(/ /g,'')])){if(!aliases.has(form))aliases.set(form,new Set());aliases.get(form).add(index);}
}));
const stop=new Set(tokens('the a an of with for and de du des le la les au aux et d l el al w bel men avec please find search buy بدي اريد ابحث عن لو سمحت من مع و ال'));
function concepts(list){
 const out=new Set();
 for(let i=0;i<list.length;i++)for(let n=1;n<=4&&i+n<=list.length;n++){
  const key=list.slice(i,i+n).join(' ');for(const id of aliases.get(key)||[])out.add(id);
 }
 return out;
}
// Consonant forms bridge unlisted Lebanese transliterations and Arabic names.
// Use only cross-script comparisons and at least three consonants.
function phonetic(term){
 const letters={ا:'',ب:'b',ت:'t',ث:'t',ج:'j',ح:'h',خ:'x',د:'d',ذ:'z',ر:'r',ز:'z',س:'s',ش:'c',ص:'s',ض:'d',ط:'t',ظ:'z',ع:'',غ:'g',ف:'f',ق:'k',ك:'k',ل:'l',م:'m',ن:'n',ه:'h',و:'',ي:'',ء:''};
 return term.replace(/[\u0621-\u064a]/g,c=>letters[c]??c).replace(/kh/g,'x').replace(/gh/g,'g').replace(/sh|ch/g,'c').replace(/q/g,'k').replace(/[aeiouy]/g,'').replace(/(.)\1+/g,'$1');
}
// Adjacent swaps count as one typo; short tokens and numbers require exact/prefix matches.
function distance(a,b){
 const rows=Array.from({length:a.length+1},(_,i)=>[i]);
 for(let j=0;j<=b.length;j++)rows[0][j]=j;
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
  rows[i][j]=Math.min(rows[i-1][j]+1,rows[i][j-1]+1,rows[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])rows[i][j]=Math.min(rows[i][j],rows[i-2][j-2]+1);
 }return rows[a.length][b.length];
}
const categoryAr={
  "Condiments":"مستلزمات المطبخ",
  "Dates":"تمر",
  "Debsy Carob":"دبسي خروب",
  "Distillates + Syrups":"مقطرات وشرابات",
  "Dried Foods":"أطعمة مجففة",
  "Flour":"طحين",
  "Grains":"حبوب",
  "Herbs":"أعشاب",
  "Honey":"عسل",
  "Molasses":"دبس",
  "Mouneh":"مونة",
  "Nuts + Seeds":"مكسرات وبذور",
  "Oils":"زيوت",
  "Olive Oil":"زيت زيتون",
  "Olives":"زيتون",
  "Pickles":"مخللات",
  "Pulses":"بقوليات",
  "Soap":"صابون",
  "Spices":"بهارات",
  "Sweets + Candy":"حلويات وسكاكر",
  "Vinegars":"خل"
};
const cache=new WeakMap(),queries=new Map();
function index(product){
 const fields=[product.id,product.nameEn,product.nameAr,product.nameFr,frenchNames[product.nameEn],product.original,...(product.searchAliases||[]),...(product.variants||[]).flatMap(v=>[v.id,v.sizeEn,v.sizeAr,v.sizeFr])];
 const more=[product.category,categoryAr[product.category],product.descriptionEn,product.descriptionAr,product.descriptionFr,product.description,product.detailsEn,product.detailsAr,product.detailsFr];
 const signature=JSON.stringify([fields,more]);
 if(cache.get(product)?.signature===signature)return cache.get(product);
 const primary=tokens(fields.join(' ')),secondary=tokens(more.join(' '));
 const crossScript={arabic:[],latin:[]};
 for(const term of new Set(primary)){const key=phonetic(term);if(key.length>=3)crossScript[/[\u0621-\u064a]/.test(term)?"arabic":"latin"].push(key);}
 const entry={signature,crossScript,primary:[...new Set(primary)],secondary:[...new Set(secondary)],phrases:fields.map(normalize).filter(Boolean),concepts:concepts([...primary,...tokens([product.category,categoryAr[product.category]].join(" "))])};
 cache.set(product,entry);return entry;
}
function prepare(query){
 const key=normalize(query).slice(0,240);if(queries.has(key))return queries.get(key);
 const all=tokens(key),meaningful=all.filter(t=>!stop.has(t));
 const list=meaningful.length?meaningful:all;
 const prepared={key,list,concepts:concepts(list)};
 if(queries.size>=100)queries.clear();queries.set(key,prepared);return prepared;
}
function score(product,query){
 const q=prepare(query);if(!q.key)return 1;
 const entry=index(product);
 if(entry.phrases.includes(q.key))return 300;
 if(entry.phrases.some(s=>s.includes(q.key)))return 240;
 if(q.key.length>=5&&!q.key.includes(" ")&&entry.phrases.some(s=>s.replace(/ /g,"").includes(q.key)))return 220;
 let total=0;
 for(let i=0;i<q.list.length;){
  let matched=0,consumed=1;
  for(let n=Math.min(4,q.list.length-i);n>0;n--){
   const ids=aliases.get(q.list.slice(i,i+n).join(' '));
   if(ids&&[...ids].some(id=>entry.concepts.has(id))){matched=55;consumed=n;break;}
  }
  if(!matched){
   const term=q.list[i];
   if(entry.primary.includes(term))matched=65;
   else if(term.length>=2&&!/^\d+$/.test(term)&&entry.primary.some(t=>t.startsWith(term)))matched=45;
   else if(entry.secondary.includes(term))matched=25;
   else if(term.length>=4&&term.length<=40&&!/\d/.test(term)){
    const limit=term.length>=7?2:1;
    if(entry.primary.some(t=>Math.abs(t.length-term.length)<=limit&&distance(term,t)<=limit))matched=20;
   }
  }
  if(!matched){
   const term=q.list[i],key=phonetic(term);
   const opposite=entry.crossScript[/[\u0621-\u064a]/.test(term)?"latin":"arabic"];
   if(key.length>=3&&opposite.some(t=>t===key||t===key+"h"||t+"h"===key))matched=15;
  }
  if(!matched)return 0;
  total+=matched;i+=consumed;
 }
 return 100+total/Math.max(1,q.list.length);
}
root.ZWM_PRODUCT_SEARCH=Object.freeze({normalize,score});
})(typeof window!=='undefined'?window:globalThis);
