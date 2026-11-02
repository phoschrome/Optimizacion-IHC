-- ====================================================================
-- SCRIPT: Actualización de Imágenes de Platos en Oracle Cloud
-- Proyecto: Saborcito E-commerce
-- Asigna a cada uno de los 100 platos una foto real que coincide con su nombre.
-- ====================================================================

-- --------------------------------------------------------------------
-- OPCIÓN A: Sentencia CASE para el Handler REST (GET /dishes)
-- (Pega esto en la consulta SELECT de la plantilla 'dishes' en Database Actions)
-- --------------------------------------------------------------------
/*
SELECT
  id,
  restaurantid,
  name,
  category,
  description,
  price,
  CASE TO_CHAR(id)
    WHEN '1' THEN 'Imagenes/plato_pizza_margarita.jpg' -- Pizza Margherita
    WHEN '2' THEN 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80' -- Pizza Pepperoni
    WHEN '3' THEN 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80' -- Pizza Cuatro Quesos
    WHEN '4' THEN 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80' -- Pizza Hawaiana
    WHEN '5' THEN 'https://images.unsplash.com/photo-1621996346565-e3d5d6281698?auto=format&fit=crop&w=600&q=80' -- Calzone Clásico
    WHEN '6' THEN 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=600&q=80' -- Lasaña de Carne
    WHEN '7' THEN 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=600&q=80' -- Espagueti Carbonara
    WHEN '8' THEN 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&w=600&q=80' -- Pan de Ajo
    WHEN '9' THEN 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80' -- Tiramisú
    WHEN '10' THEN 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80' -- Gaseosa 1.5L
    WHEN '11' THEN 'Imagenes/plato_hamburguesa_smash.jpg' -- Whopper Clásica
    WHEN '12' THEN 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80' -- Whopper Doble
    WHEN '13' THEN 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80' -- Cheeseburger
    WHEN '14' THEN 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80' -- Chicken Royale
    WHEN '15' THEN 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80' -- Nuggets (10 uds)
    WHEN '16' THEN 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80' -- Papas Fritas Medianas
    WHEN '17' THEN 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80' -- Papas Fritas Grandes
    WHEN '18' THEN 'https://images.unsplash.com/photo-1639024471287-032f667051cf?auto=format&fit=crop&w=600&q=80' -- Aros de Cebolla
    WHEN '19' THEN 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80' -- Helado Cono Clásico
    WHEN '20' THEN 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80' -- Gaseosa Mediana
    WHEN '21' THEN 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80' -- California Roll
    WHEN '22' THEN 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=600&q=80' -- Spicy Tuna Roll
    WHEN '23' THEN 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80' -- Dragon Roll
    WHEN '24' THEN 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=600&q=80' -- Nigiri de Salmón (2 pzas)
    WHEN '25' THEN 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80' -- Sashimi Mixto
    WHEN '26' THEN 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80' -- Sopa Miso
    WHEN '27' THEN 'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&w=600&q=80' -- Edamame
    WHEN '28' THEN 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80' -- Tempura de Camarón
    WHEN '29' THEN 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=600&q=80' -- Helado de Té Verde
    WHEN '30' THEN 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80' -- Té Helado
    WHEN '31' THEN 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=600&q=80' -- Taco al Pastor
    WHEN '32' THEN 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80' -- Taco de Bistec
    WHEN '33' THEN 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=600&q=80' -- Taco de Carnitas
    WHEN '34' THEN 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80' -- Burrito Mixto
    WHEN '35' THEN 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=600&q=80' -- Quesadilla con Carne
    WHEN '36' THEN 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80' -- Nachos Supremos
    WHEN '37' THEN 'https://images.unsplash.com/photo-1541288097308-7b8e3f58c4c6?auto=format&fit=crop&w=600&q=80' -- Guacamole con Totopos
    WHEN '38' THEN 'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?auto=format&fit=crop&w=600&q=80' -- Enchiladas Rojas
    WHEN '39' THEN 'https://images.unsplash.com/photo-1624300629298-e9de39c13be5?auto=format&fit=crop&w=600&q=80' -- Churros Rellenos
    WHEN '40' THEN 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80' -- Agua de Horchata
    WHEN '41' THEN 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80' -- Combo 2 Piezas
    WHEN '42' THEN 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=600&q=80' -- Mega Bucket (8 pzas)
    WHEN '43' THEN 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=600&q=80' -- Zinger Burger
    WHEN '44' THEN 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=600&q=80' -- Popcorn Chicken
    WHEN '45' THEN 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=600&q=80' -- Hot Wings (6 pzas)
    WHEN '46' THEN 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80' -- Papas Fritas Familiares
    WHEN '47' THEN 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=600&q=80' -- Puré de Papa con Gravy
    WHEN '48' THEN 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80' -- Ensalada de Col
    WHEN '49' THEN 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80' -- Postre Chocochip
    WHEN '50' THEN 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80' -- Gaseosa Grande
    WHEN '51' THEN 'Imagenes/plato_ramen_casa.jpg' -- Arroz Frito / Ramen Especial
    WHEN '52' THEN 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80' -- Chow Mein de Pollo
    WHEN '53' THEN 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80' -- Cerdo Agridulce
    WHEN '54' THEN 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80' -- Pollo Kung Pao
    WHEN '55' THEN 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80' -- Res con Brócoli
    WHEN '56' THEN 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' -- Rollitos de Primavera
    WHEN '57' THEN 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80' -- Sopa Wonton
    WHEN '58' THEN 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80' -- Dumplings al Vapor
    WHEN '59' THEN 'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?auto=format&fit=crop&w=600&q=80' -- Plátano Frito
    WHEN '60' THEN 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80' -- Té de Jazmín
    WHEN '61' THEN 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&w=600&q=80' -- Hamburguesa de Lentejas
    WHEN '62' THEN 'Imagenes/plato_bowl_arcoiris.jpg' -- Bowl de Quinoa y Tofu
    WHEN '63' THEN 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80' -- Wrap de Falafel
    WHEN '64' THEN 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=600&q=80' -- Pizza Vegana
    WHEN '65' THEN 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80' -- Ensalada Mediterránea
    WHEN '66' THEN 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?auto=format&fit=crop&w=600&q=80' -- Hummus con Pan Pita
    WHEN '67' THEN 'https://images.unsplash.com/photo-1526230427044-d092040d48dc?auto=format&fit=crop&w=600&q=80' -- Chips de Camote
    WHEN '68' THEN 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80' -- Brownie Sin Gluten
    WHEN '69' THEN 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=600&q=80' -- Batido Verde
    WHEN '70' THEN 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=600&q=80' -- Kombucha
    WHEN '71' THEN 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80' -- Croissant de Mantequilla
    WHEN '72' THEN 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=600&q=80' -- Muffin de Arándanos
    WHEN '73' THEN 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80' -- Cheesecake de Fresa
    WHEN '74' THEN 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80' -- Torta de Chocolate (Porción)
    WHEN '75' THEN 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80' -- Galleta Chocochip Gigante
    WHEN '76' THEN 'https://images.unsplash.com/photo-1569864321398-34865fc2d744?auto=format&fit=crop&w=600&q=80' -- Macarons (Caja x6)
    WHEN '77' THEN 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80' -- Donut Glaseada
    WHEN '78' THEN 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80' -- Café Americano
    WHEN '79' THEN 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80' -- Latte Macchiato
    WHEN '80' THEN 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80' -- Frappuccino Moca
    WHEN '81' THEN 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=600&q=80' -- Ribeye (300g)
    WHEN '82' THEN 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80' -- T-Bone Steak
    WHEN '83' THEN 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' -- New York Strip
    WHEN '84' THEN 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' -- BBQ Ribs
    WHEN '85' THEN 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80' -- Hamburguesa Angus
    WHEN '86' THEN 'https://images.unsplash.com/photo-1600555379765-f82335a7b1b0?auto=format&fit=crop&w=600&q=80' -- Papa Horneada
    WHEN '87' THEN 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80' -- Mac & Cheese
    WHEN '88' THEN 'https://images.unsplash.com/photo-1515471204630-e60780ebd129?auto=format&fit=crop&w=600&q=80' -- Espárragos a la Parrilla
    WHEN '89' THEN 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&w=600&q=80' -- Cheesecake Estilo NY
    WHEN '90' THEN 'https://images.unsplash.com/photo-1608270170192-689c4d723565?auto=format&fit=crop&w=600&q=80' -- Cerveza Artesanal
    WHEN '91' THEN 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80' -- Gelato de Vainilla
    WHEN '92' THEN 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80' -- Gelato de Chocolate Suizo
    WHEN '93' THEN 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80' -- Gelato de Pistacho
    WHEN '94' THEN 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80' -- Sorbete de Limón
    WHEN '95' THEN 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=600&q=80' -- Sorbete de Fresa
    WHEN '96' THEN 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80' -- Copa Sundae
    WHEN '97' THEN 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80' -- Banana Split
    WHEN '98' THEN 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80' -- Waffle con Helado
    WHEN '99' THEN 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80' -- Milkshake Clásico
    WHEN '100' THEN 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80' -- Café Espresso
    ELSE image
  END AS "image",
  alt,
  ispromotion
FROM platos -- (o el nombre de tu tabla de comidas)
ORDER BY TO_NUMBER(id);
*/

-- --------------------------------------------------------------------
-- OPCIÓN B: UPDATEs para la tabla física (Hoja de trabajo SQL)
-- Reemplaza 'PLATOS' o la columna ID si tienen otro nombre en tu esquema.
-- --------------------------------------------------------------------
UPDATE platos SET image = 'Imagenes/plato_pizza_margarita.jpg' WHERE id = '1' OR id = 1;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80' WHERE id = '2' OR id = 2;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80' WHERE id = '3' OR id = 3;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80' WHERE id = '4' OR id = 4;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1621996346565-e3d5d6281698?auto=format&fit=crop&w=600&q=80' WHERE id = '5' OR id = 5;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=600&q=80' WHERE id = '6' OR id = 6;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=600&q=80' WHERE id = '7' OR id = 7;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&w=600&q=80' WHERE id = '8' OR id = 8;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80' WHERE id = '9' OR id = 9;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80' WHERE id = '10' OR id = 10;
UPDATE platos SET image = 'Imagenes/plato_hamburguesa_smash.jpg' WHERE id = '11' OR id = 11;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80' WHERE id = '12' OR id = 12;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80' WHERE id = '13' OR id = 13;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80' WHERE id = '14' OR id = 14;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80' WHERE id = '15' OR id = 15;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80' WHERE id = '16' OR id = 16;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80' WHERE id = '17' OR id = 17;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1639024471287-032f667051cf?auto=format&fit=crop&w=600&q=80' WHERE id = '18' OR id = 18;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80' WHERE id = '19' OR id = 19;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80' WHERE id = '20' OR id = 20;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80' WHERE id = '21' OR id = 21;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=600&q=80' WHERE id = '22' OR id = 22;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80' WHERE id = '23' OR id = 23;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=600&q=80' WHERE id = '24' OR id = 24;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80' WHERE id = '25' OR id = 25;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80' WHERE id = '26' OR id = 26;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&w=600&q=80' WHERE id = '27' OR id = 27;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80' WHERE id = '28' OR id = 28;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=600&q=80' WHERE id = '29' OR id = 29;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80' WHERE id = '30' OR id = 30;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=600&q=80' WHERE id = '31' OR id = 31;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80' WHERE id = '32' OR id = 32;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=600&q=80' WHERE id = '33' OR id = 33;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80' WHERE id = '34' OR id = 34;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=600&q=80' WHERE id = '35' OR id = 35;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80' WHERE id = '36' OR id = 36;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1541288097308-7b8e3f58c4c6?auto=format&fit=crop&w=600&q=80' WHERE id = '37' OR id = 37;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?auto=format&fit=crop&w=600&q=80' WHERE id = '38' OR id = 38;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1624300629298-e9de39c13be5?auto=format&fit=crop&w=600&q=80' WHERE id = '39' OR id = 39;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80' WHERE id = '40' OR id = 40;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80' WHERE id = '41' OR id = 41;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=600&q=80' WHERE id = '42' OR id = 42;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=600&q=80' WHERE id = '43' OR id = 43;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=600&q=80' WHERE id = '44' OR id = 44;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=600&q=80' WHERE id = '45' OR id = 45;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80' WHERE id = '46' OR id = 46;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=600&q=80' WHERE id = '47' OR id = 47;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80' WHERE id = '48' OR id = 48;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80' WHERE id = '49' OR id = 49;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80' WHERE id = '50' OR id = 50;
UPDATE platos SET image = 'Imagenes/plato_ramen_casa.jpg' WHERE id = '51' OR id = 51;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80' WHERE id = '52' OR id = 52;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80' WHERE id = '53' OR id = 53;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80' WHERE id = '54' OR id = 54;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80' WHERE id = '55' OR id = 55;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' WHERE id = '56' OR id = 56;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80' WHERE id = '57' OR id = 57;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80' WHERE id = '58' OR id = 58;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?auto=format&fit=crop&w=600&q=80' WHERE id = '59' OR id = 59;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80' WHERE id = '60' OR id = 60;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&w=600&q=80' WHERE id = '61' OR id = 61;
UPDATE platos SET image = 'Imagenes/plato_bowl_arcoiris.jpg' WHERE id = '62' OR id = 62;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80' WHERE id = '63' OR id = 63;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=600&q=80' WHERE id = '64' OR id = 64;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80' WHERE id = '65' OR id = 65;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?auto=format&fit=crop&w=600&q=80' WHERE id = '66' OR id = 66;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1526230427044-d092040d48dc?auto=format&fit=crop&w=600&q=80' WHERE id = '67' OR id = 67;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80' WHERE id = '68' OR id = 68;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=600&q=80' WHERE id = '69' OR id = 69;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=600&q=80' WHERE id = '70' OR id = 70;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80' WHERE id = '71' OR id = 71;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=600&q=80' WHERE id = '72' OR id = 72;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80' WHERE id = '73' OR id = 73;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80' WHERE id = '74' OR id = 74;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80' WHERE id = '75' OR id = 75;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1569864321398-34865fc2d744?auto=format&fit=crop&w=600&q=80' WHERE id = '76' OR id = 76;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80' WHERE id = '77' OR id = 77;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80' WHERE id = '78' OR id = 78;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80' WHERE id = '79' OR id = 79;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80' WHERE id = '80' OR id = 80;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=600&q=80' WHERE id = '81' OR id = 81;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80' WHERE id = '82' OR id = 82;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' WHERE id = '83' OR id = 83;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' WHERE id = '84' OR id = 84;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80' WHERE id = '85' OR id = 85;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1600555379765-f82335a7b1b0?auto=format&fit=crop&w=600&q=80' WHERE id = '86' OR id = 86;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80' WHERE id = '87' OR id = 87;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1515471204630-e60780ebd129?auto=format&fit=crop&w=600&q=80' WHERE id = '88' OR id = 88;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&w=600&q=80' WHERE id = '89' OR id = 89;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1608270170192-689c4d723565?auto=format&fit=crop&w=600&q=80' WHERE id = '90' OR id = 90;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80' WHERE id = '91' OR id = 91;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80' WHERE id = '92' OR id = 92;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80' WHERE id = '93' OR id = 93;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80' WHERE id = '94' OR id = 94;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=600&q=80' WHERE id = '95' OR id = 95;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80' WHERE id = '96' OR id = 96;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80' WHERE id = '97' OR id = 97;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80' WHERE id = '98' OR id = 98;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80' WHERE id = '99' OR id = 99;
UPDATE platos SET image = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80' WHERE id = '100' OR id = 100;

COMMIT;
