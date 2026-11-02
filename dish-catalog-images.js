/**
 * Catálogo visual de imágenes asociadas a cada plato por su nombre e identificador.
 * Cubre los 100 platos oficiales de los 10 restaurantes con imágenes reales y apetitosas.
 */
(function(window) {
  const DISH_IMAGES_BY_ID = {
    // 1. Pizzería Roma
    "1": "Imagenes/plato_pizza_margarita.jpg", // Pizza Margherita
    "2": "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80", // Pizza Pepperoni
    "3": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80", // Pizza Cuatro Quesos
    "4": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", // Pizza Hawaiana
    "5": "Imagenes/plato_calzone.jpg", // Calzone Clásico
    "6": "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=600&q=80", // Lasaña de Carne
    "7": "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=600&q=80", // Espagueti Carbonara
    "8": "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&w=600&q=80", // Pan de Ajo
    "9": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80", // Tiramisú
    "10": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80", // Gaseosa 1.5L

    // 2. Burger King
    "11": "Imagenes/plato_hamburguesa_smash.jpg", // Whopper Clásica
    "12": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80", // Whopper Doble
    "13": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80", // Cheeseburger
    "14": "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80", // Chicken Royale
    "15": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80", // Nuggets (10 uds)
    "16": "Imagenes/plato_papas_fritas.jpg", // Papas Fritas Medianas
    "17": "Imagenes/plato_papas_fritas.jpg", // Papas Fritas Grandes
    "18": "Imagenes/plato_aros_cebolla.jpg", // Aros de Cebolla
    "19": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80", // Helado Cono Clásico
    "20": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", // Gaseosa Mediana

    // 3. Sushi Zen
    "21": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80", // California Roll
    "22": "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=600&q=80", // Spicy Tuna Roll
    "23": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80", // Dragon Roll
    "24": "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=600&q=80", // Nigiri de Salmón (2 pzas)
    "25": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80", // Sashimi Mixto
    "26": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80", // Sopa Miso
    "27": "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&w=600&q=80", // Edamame
    "28": "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80", // Tempura de Camarón
    "29": "https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=600&q=80", // Helado de Té Verde
    "30": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80", // Té Helado

    // 4. Tacos El Loco
    "31": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=600&q=80", // Taco al Pastor
    "32": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80", // Taco de Bistec
    "33": "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=600&q=80", // Taco de Carnitas
    "34": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80", // Burrito Mixto
    "35": "https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=600&q=80", // Quesadilla con Carne
    "36": "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80", // Nachos Supremos
    "37": "https://images.unsplash.com/photo-1541288097308-7b8e3f58c4c6?auto=format&fit=crop&w=600&q=80", // Guacamole con Totopos
    "38": "https://images.unsplash.com/photo-1534352956036-cd81e27dd615?auto=format&fit=crop&w=600&q=80", // Enchiladas Rojas
    "39": "https://images.unsplash.com/photo-1624300629298-e9de39c13be5?auto=format&fit=crop&w=600&q=80", // Churros Rellenos
    "40": "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80", // Agua de Horchata

    // 5. KFC
    "41": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80", // Combo 2 Piezas
    "42": "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=600&q=80", // Mega Bucket (8 pzas)
    "43": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=600&q=80", // Zinger Burger
    "44": "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=600&q=80", // Popcorn Chicken
    "45": "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=600&q=80", // Hot Wings (6 pzas)
    "46": "Imagenes/plato_papas_fritas.jpg", // Papas Fritas Familiares
    "47": "Imagenes/plato_pure_papa.jpg", // Puré de Papa con Gravy
    "48": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80", // Ensalada de Col
    "49": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80", // Postre Chocochip
    "50": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", // Gaseosa Grande

    // 6. Wok Express
    "51": "Imagenes/plato_ramen_casa.jpg", // Arroz Frito / Ramen Especial
    "52": "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80", // Chow Mein de Pollo
    "53": "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80", // Cerdo Agridulce
    "54": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80", // Pollo Kung Pao
    "55": "https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80", // Res con Brócoli
    "56": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80", // Rollitos de Primavera
    "57": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80", // Sopa Wonton
    "58": "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80", // Dumplings al Vapor
    "59": "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?auto=format&fit=crop&w=600&q=80", // Plátano Frito
    "60": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80", // Té de Jazmín

    // 7. Veggie Life
    "61": "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&w=600&q=80", // Hamburguesa de Lentejas
    "62": "Imagenes/plato_bowl_arcoiris.jpg", // Bowl de Quinoa y Tofu
    "63": "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80", // Wrap de Falafel
    "64": "https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=600&q=80", // Pizza Vegana
    "65": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80", // Ensalada Mediterránea
    "66": "https://images.unsplash.com/photo-1577906096429-f73c2c312435?auto=format&fit=crop&w=600&q=80", // Hummus con Pan Pita
    "67": "https://images.unsplash.com/photo-1526230427044-d092040d48dc?auto=format&fit=crop&w=600&q=80", // Chips de Camote
    "68": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80", // Brownie Sin Gluten
    "69": "https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=600&q=80", // Batido Verde
    "70": "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=600&q=80", // Kombucha

    // 8. Sweet Bakery
    "71": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80", // Croissant de Mantequilla
    "72": "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=600&q=80", // Muffin de Arándanos
    "73": "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80", // Cheesecake de Fresa
    "74": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80", // Torta de Chocolate (Porción)
    "75": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80", // Galleta Chocochip Gigante
    "76": "Imagenes/plato_macarons.jpg", // Macarons (Caja x6)
    "77": "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80", // Donut Glaseada
    "78": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80", // Café Americano
    "79": "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80", // Latte Macchiato
    "80": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80", // Frappuccino Moca

    // 9. Texas Steakhouse
    "81": "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=600&q=80", // Ribeye (300g)
    "82": "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80", // T-Bone Steak
    "83": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80", // New York Strip
    "84": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80", // BBQ Ribs
    "85": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80", // Hamburguesa Angus
    "86": "Imagenes/plato_papa_horneada.jpg", // Papa Horneada
    "87": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80", // Mac & Cheese
    "88": "Imagenes/plato_esparragos.jpg", // Espárragos a la Parrilla
    "89": "https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&w=600&q=80", // Cheesecake Estilo NY
    "90": "Imagenes/plato_cerveza.jpg", // Cerveza Artesanal

    // 10. Gelato Mio
    "91": "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80", // Gelato de Vainilla
    "92": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80", // Gelato de Chocolate Suizo
    "93": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80", // Gelato de Pistacho
    "94": "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80", // Sorbete de Limón
    "95": "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=600&q=80", // Sorbete de Fresa
    "96": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80", // Copa Sundae
    "97": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", // Banana Split
    "98": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", // Waffle con Helado
    "99": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80", // Milkshake Clásico
    "100": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80" // Café Espresso
  };

  // Asignar platos por palabra clave si se usan IDs no estándar
  function getMatchingDishImage(dishName, dishId) {
    if (dishId && DISH_IMAGES_BY_ID[String(dishId)]) {
      return DISH_IMAGES_BY_ID[String(dishId)];
    }
    const name = String(dishName || "").toLowerCase();
    if (name.includes("margherita") || name.includes("margarita")) return DISH_IMAGES_BY_ID["1"];
    if (name.includes("pepperoni")) return DISH_IMAGES_BY_ID["2"];
    if (name.includes("queso") && name.includes("pizza")) return DISH_IMAGES_BY_ID["3"];
    if (name.includes("hawaiana")) return DISH_IMAGES_BY_ID["4"];
    if (name.includes("calzone")) return DISH_IMAGES_BY_ID["5"];
    if (name.includes("lasaña") || name.includes("lasagna")) return DISH_IMAGES_BY_ID["6"];
    if (name.includes("carbonara") || name.includes("espagueti") || name.includes("pasta")) return DISH_IMAGES_BY_ID["7"];
    if (name.includes("pan de ajo")) return DISH_IMAGES_BY_ID["8"];
    if (name.includes("tiramisú") || name.includes("tiramisu")) return DISH_IMAGES_BY_ID["9"];
    if (name.includes("gaseosa") || name.includes("soda")) return DISH_IMAGES_BY_ID["10"];

    if (name.includes("whopper") || name.includes("smash")) return DISH_IMAGES_BY_ID["11"];
    if (name.includes("cheeseburger")) return DISH_IMAGES_BY_ID["13"];
    if (name.includes("hamburguesa")) return DISH_IMAGES_BY_ID["11"];
    if (name.includes("royale") || name.includes("chicken burger")) return DISH_IMAGES_BY_ID["14"];
    if (name.includes("nugget")) return DISH_IMAGES_BY_ID["15"];
    if (name.includes("pure") || name.includes("puré") || name.includes("gravy")) return DISH_IMAGES_BY_ID["47"];
    if ((name.includes("hornead") || name.includes("asada") || name.includes("baked")) && (name.includes("papa") || name.includes("patata"))) return DISH_IMAGES_BY_ID["86"];
    if (name.includes("papa") || name.includes("papas") || name.includes("fries") || name.includes("fritas") || name.includes("patata") || name.includes("french fry") || name.includes("french fries")) return DISH_IMAGES_BY_ID["16"];
    if (name.includes("aros") || name.includes("cebolla") || name.includes("onion ring")) return DISH_IMAGES_BY_ID["18"];
    if (name.includes("cono")) return DISH_IMAGES_BY_ID["19"];

    if (name.includes("california")) return DISH_IMAGES_BY_ID["21"];
    if (name.includes("tuna roll") || name.includes("spicy tuna")) return DISH_IMAGES_BY_ID["22"];
    if (name.includes("dragon roll")) return DISH_IMAGES_BY_ID["23"];
    if (name.includes("nigiri")) return DISH_IMAGES_BY_ID["24"];
    if (name.includes("sashimi")) return DISH_IMAGES_BY_ID["25"];
    if (name.includes("miso")) return DISH_IMAGES_BY_ID["26"];
    if (name.includes("edamame")) return DISH_IMAGES_BY_ID["27"];
    if (name.includes("tempura")) return DISH_IMAGES_BY_ID["28"];
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

    if (name.includes("arroz frito") || name.includes("fried rice")) return DISH_IMAGES_BY_ID["51"];
    if (name.includes("chow mein") || name.includes("fideos")) return DISH_IMAGES_BY_ID["52"];
    if (name.includes("agridulce")) return DISH_IMAGES_BY_ID["53"];
    if (name.includes("kung pao")) return DISH_IMAGES_BY_ID["54"];
    if (name.includes("brócoli") || name.includes("brocoli")) return DISH_IMAGES_BY_ID["55"];
    if (name.includes("primavera") || name.includes("spring roll")) return DISH_IMAGES_BY_ID["56"];
    if (name.includes("wonton")) return DISH_IMAGES_BY_ID["57"];
    if (name.includes("dumpling") || name.includes("gyoza")) return DISH_IMAGES_BY_ID["58"];
    if (name.includes("plátano") || name.includes("platano")) return DISH_IMAGES_BY_ID["59"];
    if (name.includes("jazmín") || name.includes("jazmin")) return DISH_IMAGES_BY_ID["60"];
    if (name.includes("ramen")) return DISH_IMAGES_BY_ID["51"];

    if (name.includes("lenteja")) return DISH_IMAGES_BY_ID["61"];
    if (name.includes("quinoa") || name.includes("bowl")) return DISH_IMAGES_BY_ID["62"];
    if (name.includes("falafel") || name.includes("wrap")) return DISH_IMAGES_BY_ID["63"];
    if (name.includes("vegan")) return DISH_IMAGES_BY_ID["64"];
    if (name.includes("mediterránea") || name.includes("mediterranea") || name.includes("ensalada")) return DISH_IMAGES_BY_ID["65"];
    if (name.includes("hummus")) return DISH_IMAGES_BY_ID["66"];
    if (name.includes("camote")) return DISH_IMAGES_BY_ID["67"];
    if (name.includes("brownie")) return DISH_IMAGES_BY_ID["68"];
    if (name.includes("batido") || name.includes("smoothie")) return DISH_IMAGES_BY_ID["69"];
    if (name.includes("kombucha")) return DISH_IMAGES_BY_ID["70"];

    if (name.includes("croissant")) return DISH_IMAGES_BY_ID["71"];
    if (name.includes("muffin")) return DISH_IMAGES_BY_ID["72"];
    if (name.includes("cheesecake")) return DISH_IMAGES_BY_ID["73"];
    if (name.includes("torta") || name.includes("pastel")) return DISH_IMAGES_BY_ID["74"];
    if (name.includes("galleta") || name.includes("cookie")) return DISH_IMAGES_BY_ID["75"];
    if (name.includes("macaron")) return DISH_IMAGES_BY_ID["76"];
    if (name.includes("donut") || name.includes("dona")) return DISH_IMAGES_BY_ID["77"];
    if (name.includes("americano")) return DISH_IMAGES_BY_ID["78"];
    if (name.includes("latte") || name.includes("macchiato")) return DISH_IMAGES_BY_ID["79"];
    if (name.includes("frappuccino") || name.includes("moca")) return DISH_IMAGES_BY_ID["80"];

    if (name.includes("ribeye")) return DISH_IMAGES_BY_ID["81"];
    if (name.includes("t-bone") || name.includes("tbone")) return DISH_IMAGES_BY_ID["82"];
    if (name.includes("strip") || name.includes("bife")) return DISH_IMAGES_BY_ID["83"];
    if (name.includes("ribs") || name.includes("costillar") || name.includes("costillas")) return DISH_IMAGES_BY_ID["84"];
    if (name.includes("angus")) return DISH_IMAGES_BY_ID["85"];
    if (name.includes("mac & cheese") || name.includes("mac and cheese")) return DISH_IMAGES_BY_ID["87"];
    if (name.includes("espárragos") || name.includes("esparragos")) return DISH_IMAGES_BY_ID["88"];
    if (name.includes("cerveza")) return DISH_IMAGES_BY_ID["90"];

    if (name.includes("vainilla")) return DISH_IMAGES_BY_ID["91"];
    if (name.includes("chocolate") && (name.includes("helado") || name.includes("gelato"))) return DISH_IMAGES_BY_ID["92"];
    if (name.includes("pistacho")) return DISH_IMAGES_BY_ID["93"];
    if (name.includes("limón") || name.includes("limon")) return DISH_IMAGES_BY_ID["94"];
    if (name.includes("fresa") && (name.includes("sorbete") || name.includes("helado"))) return DISH_IMAGES_BY_ID["95"];
    if (name.includes("sundae")) return DISH_IMAGES_BY_ID["96"];
    if (name.includes("banana split")) return DISH_IMAGES_BY_ID["97"];
    if (name.includes("waffle")) return DISH_IMAGES_BY_ID["98"];
    if (name.includes("milkshake") || name.includes("malteada")) return DISH_IMAGES_BY_ID["99"];
    if (name.includes("espresso")) return DISH_IMAGES_BY_ID["100"];

    return "";
  }

  window.DISH_IMAGES_BY_ID = DISH_IMAGES_BY_ID;
  window.getMatchingDishImage = getMatchingDishImage;
})(typeof window !== "undefined" ? window : globalThis);
