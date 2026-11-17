(function(window) {
const CATALOG_CACHE_KEY = "saborcito_catalog_cache_v8";
const DEFAULT_RESTAURANT_BANNERS = {
"1": "Imagenes/banner_pizzeria_roma.webp",
"2": "Imagenes/banner_burger_king.webp",
"3": "Imagenes/banner_sushi_zen.webp",
"4": "Imagenes/banner_taco_loco.webp",
"5": "Imagenes/banner_kfc.webp",
"6": "Imagenes/banner_wok_express.webp",
"7": "Imagenes/banner_veggie_life.webp",
"8": "Imagenes/banner_sweet_bakery.webp",
"9": "Imagenes/banner_steakhouse.webp",
"10": "Imagenes/banner_gelato_mio.webp"
};
const DISH_IMAGES_BY_ID = {
"1": "Imagenes/plato_pizza_margarita.webp",
"2": "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80",
"3": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
"4": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
"5": "Imagenes/plato_calzone.webp",
"6": "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=600&q=80",
"7": "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=600&q=80",
"8": "Imagenes/plato_pan_ajo.webp",
"9": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80",
"10": "Imagenes/plato_gaseosa.webp",
"11": "Imagenes/plato_hamburguesa_smash.webp",
"12": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
"13": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
"14": "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80",
"15": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80",
"16": "Imagenes/plato_papas_fritas.webp",
"17": "Imagenes/plato_papas_fritas.webp",
"18": "Imagenes/plato_aros_cebolla.webp",
"19": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80",
"20": "Imagenes/plato_gaseosa.webp",
"21": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80",
"22": "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=600&q=80",
"23": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
"24": "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=600&q=80",
"25": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80",
"26": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80",
"27": "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&w=600&q=80",
"28": "Imagenes/plato_tempura_camaron.webp",
"29": "https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=600&q=80",
"30": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80",
"31": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=600&q=80",
"32": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80",
"33": "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=600&q=80",
"34": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80",
"35": "https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=600&q=80",
"36": "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80",
"37": "Imagenes/guacamole.webp",
"38": "https://images.unsplash.com/photo-1534352956036-cd81e27dd615?auto=format&fit=crop&w=600&q=80",
"39": "https://images.unsplash.com/photo-1624300629298-e9de39c13be5?auto=format&fit=crop&w=600&q=80",
"40": "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80",
"41": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80",
"42": "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=600&q=80",
"43": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=600&q=80",
"44": "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=600&q=80",
"45": "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=600&q=80",
"46": "Imagenes/plato_papas_fritas.webp",
"47": "Imagenes/plato_pure_papa.webp",
"48": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
"49": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80",
"50": "Imagenes/plato_gaseosa.webp",
"51": "Imagenes/plato_ramen_casa.webp",
"52": "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80",
"53": "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80",
"54": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80",
"55": "Imagenes/plato_res_brocoli.webp",
"56": "Imagenes/plato_rollitos_primavera.webp",
"57": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
"58": "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80",
"59": "Imagenes/plato_platano_frito.webp",
"60": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
"61": "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&w=600&q=80",
"62": "Imagenes/plato_bowl_arcoiris.webp",
"63": "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80",
"64": "https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=600&q=80",
"65": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
"66": "https://images.unsplash.com/photo-1577906096429-f73c2c312435?auto=format&fit=crop&w=600&q=80",
"67": "Imagenes/plato_chips_camote.webp",
"68": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
"69": "https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=600&q=80",
"70": "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=600&q=80",
"71": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
"72": "Imagenes/plato_muffin_arandanos.webp",
"73": "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80",
"74": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
"75": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80",
"76": "Imagenes/plato_macarons.webp",
"77": "Imagenes/plato_donut_glaseada.webp",
"78": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
"79": "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80",
"80": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
"81": "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=600&q=80",
"82": "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80",
"83": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
"84": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
"85": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
"86": "Imagenes/plato_papa_horneada.webp",
"87": "Imagenes/plato_mac_and_cheese.webp",
"88": "Imagenes/plato_esparragos.webp",
"89": "https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&w=600&q=80",
"90": "Imagenes/plato_cerveza.webp",
"91": "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80",
"92": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",
"93": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80",
"94": "Imagenes/plato_sorbete_limon.webp",
"95": "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=600&q=80",
"96": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",
"97": "Imagenes/plato_banana_split.webp",
"98": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80",
"99": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
"100": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80"
};
function getMatchingDishImage(dishName, dishId) {
if (dishId && DISH_IMAGES_BY_ID[String(dishId)]) {
return DISH_IMAGES_BY_ID[String(dishId)];
}
const raw = String(dishName || "").toLowerCase();
const name = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
if (name.includes("margherita") || name.includes("margarita")) return DISH_IMAGES_BY_ID["1"];
if (name.includes("pepperoni")) return DISH_IMAGES_BY_ID["2"];
if (name.includes("cuatro quesos") || (name.includes("queso") && name.includes("pizza"))) return DISH_IMAGES_BY_ID["3"];
if (name.includes("hawaiana")) return DISH_IMAGES_BY_ID["4"];
if (name.includes("calzone")) return DISH_IMAGES_BY_ID["5"];
if (name.includes("lasana") || name.includes("lasagna")) return DISH_IMAGES_BY_ID["6"];
if (name.includes("carbonara") || name.includes("espagueti") || name.includes("pasta")) return DISH_IMAGES_BY_ID["7"];
if (name.includes("pan") && name.includes("ajo")) return DISH_IMAGES_BY_ID["8"];
if (name.includes("tiramisu")) return DISH_IMAGES_BY_ID["9"];
if (name.includes("gaseosa") || name.includes("soda") || name.includes("cola")) return DISH_IMAGES_BY_ID["10"];
if (name.includes("whopper") || name.includes("smash")) return DISH_IMAGES_BY_ID["11"];
if (name.includes("cheeseburger")) return DISH_IMAGES_BY_ID["13"];
if (name.includes("hamburguesa") && !name.includes("lenteja") && !name.includes("angus")) return DISH_IMAGES_BY_ID["11"];
if (name.includes("royale") || name.includes("chicken burger")) return DISH_IMAGES_BY_ID["14"];
if (name.includes("nugget")) return DISH_IMAGES_BY_ID["15"];
if (name.includes("aros") || name.includes("cebolla") || name.includes("onion ring")) return DISH_IMAGES_BY_ID["18"];
if (name.includes("cono") && name.includes("helado")) return DISH_IMAGES_BY_ID["19"];
if (name.includes("camote") || name.includes("sweet potato")) return DISH_IMAGES_BY_ID["67"];
if (name.includes("pure") || name.includes("gravy")) return DISH_IMAGES_BY_ID["47"];
if (name.includes("hornead") || name.includes("asada") || name.includes("baked")) return DISH_IMAGES_BY_ID["86"];
if (name.includes("papa") || name.includes("papas") || name.includes("fries") || name.includes("fritas") || name.includes("patata")) return DISH_IMAGES_BY_ID["16"];
if (name.includes("tempura")) return DISH_IMAGES_BY_ID["28"];
if (name.includes("california")) return DISH_IMAGES_BY_ID["21"];
if (name.includes("tuna roll") || name.includes("spicy tuna")) return DISH_IMAGES_BY_ID["22"];
if (name.includes("dragon roll")) return DISH_IMAGES_BY_ID["23"];
if (name.includes("nigiri")) return DISH_IMAGES_BY_ID["24"];
if (name.includes("sashimi")) return DISH_IMAGES_BY_ID["25"];
if (name.includes("miso")) return DISH_IMAGES_BY_ID["26"];
if (name.includes("edamame")) return DISH_IMAGES_BY_ID["27"];
if (name.includes("roll") || name.includes("sushi")) return DISH_IMAGES_BY_ID["21"];
if (name.includes("pastor")) return DISH_IMAGES_BY_ID["31"];
if (name.includes("bistec") && name.includes("taco")) return DISH_IMAGES_BY_ID["32"];
if (name.includes("carnitas")) return DISH_IMAGES_BY_ID["33"];
if (name.includes("taco")) return DISH_IMAGES_BY_ID["31"];
if (name.includes("burrito")) return DISH_IMAGES_BY_ID["34"];
if (name.includes("quesadilla")) return DISH_IMAGES_BY_ID["35"];
if (name.includes("nacho")) return DISH_IMAGES_BY_ID["36"];
if (name.includes("guacamole") || name.includes("totopo")) return DISH_IMAGES_BY_ID["37"];
if (name.includes("enchilada")) return DISH_IMAGES_BY_ID["38"];
if (name.includes("churro")) return DISH_IMAGES_BY_ID["39"];
if (name.includes("horchata")) return DISH_IMAGES_BY_ID["40"];
if (name.includes("bucket")) return DISH_IMAGES_BY_ID["42"];
if (name.includes("zinger")) return DISH_IMAGES_BY_ID["43"];
if (name.includes("popcorn")) return DISH_IMAGES_BY_ID["44"];
if (name.includes("wing") || name.includes("alitas")) return DISH_IMAGES_BY_ID["45"];
if (name.includes("pollo frito") || name.includes("combo")) return DISH_IMAGES_BY_ID["41"];
if (name.includes("col") || name.includes("coleslaw")) return DISH_IMAGES_BY_ID["48"];
if (name.includes("platano")) return DISH_IMAGES_BY_ID["59"];
if (name.includes("primavera") || name.includes("spring roll")) return DISH_IMAGES_BY_ID["56"];
if (name.includes("brocoli")) return DISH_IMAGES_BY_ID["55"];
if (name.includes("arroz frito") || name.includes("fried rice")) return DISH_IMAGES_BY_ID["51"];
if (name.includes("chow mein") || name.includes("fideos")) return DISH_IMAGES_BY_ID["52"];
if (name.includes("agridulce")) return DISH_IMAGES_BY_ID["53"];
if (name.includes("kung pao")) return DISH_IMAGES_BY_ID["54"];
if (name.includes("wonton")) return DISH_IMAGES_BY_ID["57"];
if (name.includes("dumpling") || name.includes("gyoza")) return DISH_IMAGES_BY_ID["58"];
if (name.includes("jazmin")) return DISH_IMAGES_BY_ID["60"];
if (name.includes("ramen")) return DISH_IMAGES_BY_ID["51"];
if (name.includes("lenteja")) return DISH_IMAGES_BY_ID["61"];
if (name.includes("quinoa") || name.includes("arcoiris") || name.includes("bowl")) return DISH_IMAGES_BY_ID["62"];
if (name.includes("falafel") || name.includes("wrap")) return DISH_IMAGES_BY_ID["63"];
if (name.includes("vegan")) return DISH_IMAGES_BY_ID["64"];
if (name.includes("mediterranea") || name.includes("ensalada")) return DISH_IMAGES_BY_ID["65"];
if (name.includes("hummus")) return DISH_IMAGES_BY_ID["66"];
if (name.includes("brownie")) return DISH_IMAGES_BY_ID["68"];
if (name.includes("batido") || name.includes("smoothie")) return DISH_IMAGES_BY_ID["69"];
if (name.includes("kombucha")) return DISH_IMAGES_BY_ID["70"];
if (name.includes("muffin") || name.includes("arandano")) return DISH_IMAGES_BY_ID["72"];
if (name.includes("donut") || name.includes("dona")) return DISH_IMAGES_BY_ID["77"];
if (name.includes("macaron")) return DISH_IMAGES_BY_ID["76"];
if (name.includes("croissant")) return DISH_IMAGES_BY_ID["71"];
if (name.includes("cheesecake") && name.includes("fresa")) return DISH_IMAGES_BY_ID["73"];
if (name.includes("torta") || name.includes("pastel")) return DISH_IMAGES_BY_ID["74"];
if (name.includes("galleta") || name.includes("cookie")) return DISH_IMAGES_BY_ID["75"];
if (name.includes("americano")) return DISH_IMAGES_BY_ID["78"];
if (name.includes("latte") || name.includes("macchiato")) return DISH_IMAGES_BY_ID["79"];
if (name.includes("frappuccino") || name.includes("moca")) return DISH_IMAGES_BY_ID["80"];
if (name.includes("esparrago")) return DISH_IMAGES_BY_ID["88"];
if (name.includes("mac & cheese") || name.includes("mac and cheese") || (name.includes("mac") && name.includes("cheese"))) return DISH_IMAGES_BY_ID["87"];
if (name.includes("cerveza")) return DISH_IMAGES_BY_ID["90"];
if (name.includes("ribeye")) return DISH_IMAGES_BY_ID["81"];
if (name.includes("t-bone") || name.includes("tbone")) return DISH_IMAGES_BY_ID["82"];
if (name.includes("strip") || name.includes("bife")) return DISH_IMAGES_BY_ID["83"];
if (name.includes("ribs") || name.includes("costillar") || name.includes("costillas")) return DISH_IMAGES_BY_ID["84"];
if (name.includes("angus")) return DISH_IMAGES_BY_ID["85"];
if (name.includes("cheesecake")) return DISH_IMAGES_BY_ID["89"];
if (name.includes("banana split") || name.includes("banana")) return DISH_IMAGES_BY_ID["97"];
if (name.includes("limon") || (name.includes("sorbete") && name.includes("lim"))) return DISH_IMAGES_BY_ID["94"];
if (name.includes("vainilla")) return DISH_IMAGES_BY_ID["91"];
if (name.includes("chocolate") && (name.includes("helado") || name.includes("gelato"))) return DISH_IMAGES_BY_ID["92"];
if (name.includes("pistacho")) return DISH_IMAGES_BY_ID["93"];
if (name.includes("fresa") && (name.includes("sorbete") || name.includes("helado"))) return DISH_IMAGES_BY_ID["95"];
if (name.includes("sundae")) return DISH_IMAGES_BY_ID["96"];
if (name.includes("waffle")) return DISH_IMAGES_BY_ID["98"];
if (name.includes("milkshake") || name.includes("malteada")) return DISH_IMAGES_BY_ID["99"];
if (name.includes("espresso")) return DISH_IMAGES_BY_ID["100"];
return "";
}
const SEED_RESTAURANTS = [
{ id: "1", name: "Pizzería Roma", category: "Pizza", icon: "🍕", rating: 4.8, time: "20–30 min", description: "Dirección: Av. Principal 101", logo: "", banner: DEFAULT_RESTAURANT_BANNERS["1"] },
{ id: "2", name: "Burger King", category: "Hamburguesas", icon: "🍔", rating: 4.8, time: "20–30 min", description: "Dirección: Mall Central L-20", logo: "", banner: DEFAULT_RESTAURANT_BANNERS["2"] },
{ id: "3", name: "Sushi Zen", category: "Asiática", icon: "🍣", rating: 4.8, time: "20–30 min", description: "Dirección: Calle del Río 45", logo: "", banner: DEFAULT_RESTAURANT_BANNERS["3"] },
{ id: "4", name: "Tacos El Loco", category: "Mexicana", icon: "🌮", rating: 4.8, time: "20–30 min", description: "Dirección: Plaza Sur Local 5", logo: "", banner: DEFAULT_RESTAURANT_BANNERS["4"] },
{ id: "5", name: "KFC", category: "Pollo", icon: "🍗", rating: 4.8, time: "20–30 min", description: "Dirección: Av. Naciones Unidas 1023", logo: "", banner: DEFAULT_RESTAURANT_BANNERS["5"] },
{ id: "6", name: "Wok Express", category: "Asiática", icon: "🥡", rating: 4.8, time: "20–30 min", description: "Dirección: Patio de Comidas Centro", logo: "", banner: DEFAULT_RESTAURANT_BANNERS["6"] },
{ id: "7", name: "Veggie Life", category: "Saludable", icon: "🥗", rating: 4.8, time: "20–30 min", description: "Dirección: Calle Verde 99", logo: "", banner: DEFAULT_RESTAURANT_BANNERS["7"] },
{ id: "8", name: "Sweet Bakery", category: "Postres", icon: "🥐", rating: 4.8, time: "20–30 min", description: "Dirección: Av. Las Flores 21", logo: "", banner: DEFAULT_RESTAURANT_BANNERS["8"] },
{ id: "9", name: "Texas Steakhouse", category: "Carnes", icon: "🥩", rating: 4.8, time: "20–30 min", description: "Dirección: Boulevard Norte 500", logo: "", banner: DEFAULT_RESTAURANT_BANNERS["9"] },
{ id: "10", name: "Gelato Mio", category: "Postres", icon: "🍨", rating: 4.8, time: "20–30 min", description: "Dirección: Plaza Mayor Local 12", logo: "", banner: DEFAULT_RESTAURANT_BANNERS["10"] }
];
const SEED_DISHES = [
[1,"1","Pizza Margherita",12.5],[2,"1","Pizza Pepperoni",14],[3,"1","Pizza Cuatro Quesos",15.5],[4,"1","Pizza Hawaiana",13],[5,"1","Calzone Clásico",11],[6,"1","Lasaña de Carne",10.5],[7,"1","Espagueti Carbonara",9.5],[8,"1","Pan de Ajo",4],[9,"1","Tiramisú",5.5],[10,"1","Gaseosa 1.5L",3],
[11,"2","Whopper Clásica",6.5],[12,"2","Whopper Doble",8.5],[13,"2","Cheeseburger",3.5],[14,"2","Chicken Royale",5.5],[15,"2","Nuggets (10 uds)",4.5],[16,"2","Papas Fritas Medianas",2.5],[17,"2","Papas Fritas Grandes",3.5],[18,"2","Aros de Cebolla",3],[19,"2","Helado Cono Clásico",1.5],[20,"2","Gaseosa Mediana",2],
[21,"3","California Roll",8],[22,"3","Spicy Tuna Roll",9.5],[23,"3","Dragon Roll",12],[24,"3","Nigiri de Salmón (2 pzas)",4.5],[25,"3","Sashimi Mixto",15],[26,"3","Sopa Miso",3],[27,"3","Edamame",4],[28,"3","Tempura de Camarón",10],[29,"3","Helado de Té Verde",4.5],[30,"3","Té Helado",2.5],
[31,"4","Taco al Pastor",2.5],[32,"4","Taco de Bistec",3],[33,"4","Taco de Carnitas",2.5],[34,"4","Burrito Mixto",7.5],[35,"4","Quesadilla con Carne",5],[36,"4","Nachos Supremos",8],[37,"4","Guacamole con Totopos",6],[38,"4","Enchiladas Rojas",7],[39,"4","Churros Rellenos",4],[40,"4","Agua de Horchata",2.5],
[41,"5","Combo 2 Piezas",6.5],[42,"5","Mega Bucket (8 pzas)",18],[43,"5","Zinger Burger",5.5],[44,"5","Popcorn Chicken",4.5],[45,"5","Hot Wings (6 pzas)",6],[46,"5","Papas Fritas Familiares",4],[47,"5","Puré de Papa con Gravy",3],[48,"5","Ensalada de Col",2.5],[49,"5","Postre Chocochip",2],[50,"5","Gaseosa Grande",2.5],
[51,"6","Arroz Frito Especial",7.5],[52,"6","Chow Mein de Pollo",8],[53,"6","Cerdo Agridulce",9],[54,"6","Pollo Kung Pao",9.5],[55,"6","Res con Brócoli",10],[56,"6","Rollitos de Primavera",4],[57,"6","Sopa Wonton",5],[58,"6","Dumplings al Vapor",6],[59,"6","Plátano Frito",3.5],[60,"6","Té de Jazmín",2],
[61,"7","Hamburguesa de Lentejas",7.5],[62,"7","Bowl de Quinoa y Tofu",9],[63,"7","Wrap de Falafel",8.5],[64,"7","Pizza Vegana (Queso de Almendras)",14],[65,"7","Ensalada Mediterránea",8],[66,"7","Hummus con Pan Pita",5.5],[67,"7","Chips de Camote",4],[68,"7","Brownie Sin Gluten",4.5],[69,"7","Batido Verde",5],[70,"7","Kombucha",4],
[71,"8","Croissant de Mantequilla",2.5],[72,"8","Muffin de Arándanos",3],[73,"8","Cheesecake de Fresa",5.5],[74,"8","Torta de Chocolate (Porción)",6],[75,"8","Galleta Chocochip Gigante",2],[76,"8","Macarons (Caja x6)",8],[77,"8","Donut Glaseada",1.5],[78,"8","Café Americano",2.5],[79,"8","Latte Macchiato",3.5],[80,"8","Frappuccino Moca",4.5],
[81,"9","Ribeye (300g)",24],[82,"9","T-Bone Steak",26],[83,"9","New York Strip",22],[84,"9","BBQ Ribs (Medio Costillar)",18],[85,"9","Hamburguesa Angus",12.5],[86,"9","Papa Horneada",4],[87,"9","Mac & Cheese",5],[88,"9","Espárragos a la Parrilla",6],[89,"9","Cheesecake Estilo NY",7],[90,"9","Cerveza Artesanal",5.5],
[91,"10","Gelato de Vainilla (1 Bola)",2.5],[92,"10","Gelato de Chocolate Suizo (2 Bolas)",4.5],[93,"10","Gelato de Pistacho",3],[94,"10","Sorbete de Limón",2.5],[95,"10","Sorbete de Fresa",2.5],[96,"10","Copa Sundae",6],[97,"10","Banana Split",7.5],[98,"10","Waffle con Helado",8],[99,"10","Milkshake Clásico",5.5],[100,"10","Café Espresso",2]
].map(([id, restaurantId, name, price]) => ({
id: String(id),
restaurantId,
name,
category: "Menú Principal",
description: "Preparado al momento.",
price,
image: getMatchingDishImage(name, id),
alt: name,
isPromotion: id % 5 === 1
}));
function saborcitoDebounce(fn, delay = 250) {
let timer;
return function(...args) {
clearTimeout(timer);
timer = setTimeout(() => fn.apply(this, args), delay);
};
}
function toWebpLocalPath(url) {
if (!url || typeof url !== "string") return "";
return url.replace(/^(\.?\/?Imagenes\/[^?#]+)\.jpe?g$/i, "$1.webp");
}
window.CATALOG_CACHE_KEY = CATALOG_CACHE_KEY;
window.DEFAULT_RESTAURANT_BANNERS = DEFAULT_RESTAURANT_BANNERS;
window.DISH_IMAGES_BY_ID = DISH_IMAGES_BY_ID;
window.SEED_RESTAURANTS = SEED_RESTAURANTS;
window.SEED_DISHES = SEED_DISHES;
window.getMatchingDishImage = getMatchingDishImage;
window.saborcitoDebounce = saborcitoDebounce;
window.toWebpLocalPath = toWebpLocalPath;
})(typeof window !== "undefined" ? window : globalThis);