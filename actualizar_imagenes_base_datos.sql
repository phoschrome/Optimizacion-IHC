-- ====================================================================
-- SCRIPT: Actualización de Imágenes en la Base de Datos (Oracle Cloud)
-- Proyecto: Saborcito E-commerce
-- Descripción: 
--   1. Agrega las columnas de imagen/banner si no existen.
--   2. Registra las URLs y rutas de las imágenes para cada restaurante y plato.
--   3. Configura/documenta los Handlers ORDS para que los endpoints 
--      GET /restaurants y GET /dishes devuelvan 'banner' e 'image'.
-- ====================================================================

-- --------------------------------------------------------------------
-- PASO 1: Asegurar que existan las columnas en las tablas
-- --------------------------------------------------------------------

-- En la tabla RESTAURANTES (columna BANNER para almacenar la imagen de cabecera)
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE RESTAURANTES ADD (BANNER VARCHAR2(500))';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -01430 THEN -- ORA-01430: column being added already exists in table
            RAISE;
        END IF;
END;
/

-- En la tabla PLATOS (columna IMAGE para la foto del platillo)
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE PLATOS ADD (IMAGE VARCHAR2(500))';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -01430 THEN
            RAISE;
        END IF;
END;
/

-- --------------------------------------------------------------------
-- PASO 2: Actualizar las URLs de las imágenes de los 10 Restaurantes
-- --------------------------------------------------------------------
-- Puedes usar rutas relativas locales ('Imagenes/banner_...') o URLs públicas de tu GitHub Pages:
-- https://phoschrome.github.io/ihc-web/Imagenes/banner_...

UPDATE RESTAURANTES SET BANNER = 'Imagenes/banner_pizzeria_roma.jpg' WHERE ID = 1 OR ID = '1';
UPDATE RESTAURANTES SET BANNER = 'Imagenes/banner_burger_king.jpg'   WHERE ID = 2 OR ID = '2';
UPDATE RESTAURANTES SET BANNER = 'Imagenes/banner_sushi_zen.jpg'     WHERE ID = 3 OR ID = '3';
UPDATE RESTAURANTES SET BANNER = 'Imagenes/banner_taco_loco.jpg'     WHERE ID = 4 OR ID = '4';
UPDATE RESTAURANTES SET BANNER = 'Imagenes/banner_kfc.jpg'           WHERE ID = 5 OR ID = '5';
UPDATE RESTAURANTES SET BANNER = 'Imagenes/banner_wok_express.jpg'   WHERE ID = 6 OR ID = '6';
UPDATE RESTAURANTES SET BANNER = 'Imagenes/banner_veggie_life.jpg'   WHERE ID = 7 OR ID = '7';
UPDATE RESTAURANTES SET BANNER = 'Imagenes/banner_sweet_bakery.jpg'  WHERE ID = 8 OR ID = '8';
UPDATE RESTAURANTES SET BANNER = 'Imagenes/banner_steakhouse.jpg'    WHERE ID = 9 OR ID = '9';
UPDATE RESTAURANTES SET BANNER = 'Imagenes/banner_gelato_mio.jpg'    WHERE ID = 10 OR ID = '10';

-- --------------------------------------------------------------------
-- PASO 3: Actualizar las URLs de imágenes de los Platillos Principales
-- --------------------------------------------------------------------

-- Plato destacado de Pizzería Roma (ID 1: Pizza Margherita)
UPDATE PLATOS SET IMAGE = 'Imagenes/plato_pizza_margarita.jpg', ALT = 'Pizza Margherita recién horneada'
WHERE ID = 1 OR ID = '1';

-- Plato destacado de Burger King (ID 11: Whopper Clásica / Smash)
UPDATE PLATOS SET IMAGE = 'Imagenes/plato_hamburguesa_smash.jpg', ALT = 'Hamburguesa clásica smash con queso'
WHERE ID = 11 OR ID = '11';

-- Plato destacado de Wok Express (ID 51 / Ramen / Arroz Frito)
UPDATE PLATOS SET IMAGE = 'Imagenes/plato_ramen_casa.jpg', ALT = 'Tazón de ramen tradicional'
WHERE ID = 51 OR ID = '51';

-- Plato destacado de Veggie Life (ID 61 / Bowl Saludable)
UPDATE PLATOS SET IMAGE = 'Imagenes/plato_bowl_arcoiris.jpg', ALT = 'Bowl de quinoa y vegetales frescos'
WHERE ID = 61 OR ID = '61';

COMMIT;

-- --------------------------------------------------------------------
-- PASO 4: Consulta SQL que debe tener el Handler ORDS (GET /restaurants)
-- --------------------------------------------------------------------
-- En Oracle Cloud -> Database Actions -> Módulos REST -> v1 -> restaurants:
-- El query SELECT debe incluir la columna BANNER:

/*
SELECT 
    ID,
    NAME,
    CATEGORY,
    ICON,
    RATING,
    TIME,
    DESCRIPTION,
    BANNER
FROM RESTAURANTES
ORDER BY TO_NUMBER(ID);
*/

-- --------------------------------------------------------------------
-- PASO 5: Consulta SQL que debe tener el Handler ORDS (GET /dishes)
-- --------------------------------------------------------------------
-- En Oracle Cloud -> Database Actions -> Módulos REST -> v1 -> dishes:
-- Asegúrate de que el query SELECT proyecte la columna IMAGE:

/*
SELECT 
    ID,
    RESTAURANTID,
    NAME,
    CATEGORY,
    DESCRIPTION,
    PRICE,
    IMAGE,
    ALT,
    ISPROMOTION
FROM PLATOS
ORDER BY TO_NUMBER(ID);
*/

-- --------------------------------------------------------------------
-- PASO 6: Verificación de datos guardados
-- --------------------------------------------------------------------
SELECT ID, NAME, BANNER FROM RESTAURANTES ORDER BY TO_NUMBER(ID);
SELECT ID, NAME, IMAGE FROM PLATOS WHERE IMAGE IS NOT NULL ORDER BY TO_NUMBER(ID);
