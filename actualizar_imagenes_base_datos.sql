-- ====================================================================
-- SCRIPT CORREGIDO: Actualización de Imágenes en Oracle Cloud
-- Proyecto: Saborcito E-commerce
-- Este script detecta automáticamente los nombres exactos de tus columnas
-- y tablas para evitar los errores ORA-00904 y ORA-00942.
-- ====================================================================

-- --------------------------------------------------------------------
-- PASO PREVIO OPCIONAL: Consulta de diagnóstico rápido
-- (Puedes ejecutar esto primero si deseas ver los nombres exactos)
-- --------------------------------------------------------------------
-- SELECT TABLE_NAME, COLUMN_NAME FROM USER_TAB_COLUMNS 
-- WHERE TABLE_NAME IN ('RESTAURANTES', 'PRODUCTOS', 'PLATILLOS', 'PLATOS')
-- ORDER BY TABLE_NAME, COLUMN_ID;

-- --------------------------------------------------------------------
-- BLOQUE PL/SQL INTELIGENTE (Ejecuta todo este bloque con F5 o "Ejecutar Script")
-- --------------------------------------------------------------------
SET SERVEROUTPUT ON;

DECLARE
    v_rest_id_col  VARCHAR2(50);
    v_prod_table   VARCHAR2(50);
    v_prod_id_col  VARCHAR2(50);
    v_prod_img_col VARCHAR2(50);
BEGIN
    -- 1. IDENTIFICAR LA COLUMNA ID DE RESTAURANTES
    BEGIN
        SELECT column_name INTO v_rest_id_col
        FROM user_tab_columns
        WHERE table_name = 'RESTAURANTES'
          AND UPPER(column_name) IN ('ID_RESTAURANTE', 'ID', 'RESTAURANTE_ID', 'COD_RESTAURANTE', 'ID_REST')
          AND ROWNUM = 1;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            SELECT column_name INTO v_rest_id_col
            FROM user_tab_columns
            WHERE table_name = 'RESTAURANTES'
            ORDER BY column_id FETCH FIRST 1 ROWS ONLY;
    END;

    DBMS_OUTPUT.PUT_LINE('✓ Columna ID de RESTAURANTES detectada: ' || v_rest_id_col);

    -- 2. ASEGURAR COLUMNA BANNER EN RESTAURANTES
    BEGIN
        EXECUTE IMMEDIATE 'ALTER TABLE RESTAURANTES ADD (BANNER VARCHAR2(500))';
        DBMS_OUTPUT.PUT_LINE('✓ Columna BANNER agregada a RESTAURANTES.');
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE = -01430 THEN
                DBMS_OUTPUT.PUT_LINE('✓ Columna BANNER ya existía en RESTAURANTES.');
            ELSE
                RAISE;
            END IF;
    END;

    -- 3. ACTUALIZAR LAS IMÁGENES DE LOS 10 RESTAURANTES
    EXECUTE IMMEDIATE 'UPDATE RESTAURANTES SET BANNER = :1 WHERE ' || v_rest_id_col || ' = 1 OR ' || v_rest_id_col || ' = ''1''' USING 'Imagenes/banner_pizzeria_roma.jpg';
    EXECUTE IMMEDIATE 'UPDATE RESTAURANTES SET BANNER = :1 WHERE ' || v_rest_id_col || ' = 2 OR ' || v_rest_id_col || ' = ''2''' USING 'Imagenes/banner_burger_king.jpg';
    EXECUTE IMMEDIATE 'UPDATE RESTAURANTES SET BANNER = :1 WHERE ' || v_rest_id_col || ' = 3 OR ' || v_rest_id_col || ' = ''3''' USING 'Imagenes/banner_sushi_zen.jpg';
    EXECUTE IMMEDIATE 'UPDATE RESTAURANTES SET BANNER = :1 WHERE ' || v_rest_id_col || ' = 4 OR ' || v_rest_id_col || ' = ''4''' USING 'Imagenes/banner_taco_loco.jpg';
    EXECUTE IMMEDIATE 'UPDATE RESTAURANTES SET BANNER = :1 WHERE ' || v_rest_id_col || ' = 5 OR ' || v_rest_id_col || ' = ''5''' USING 'Imagenes/banner_kfc.jpg';
    EXECUTE IMMEDIATE 'UPDATE RESTAURANTES SET BANNER = :1 WHERE ' || v_rest_id_col || ' = 6 OR ' || v_rest_id_col || ' = ''6''' USING 'Imagenes/banner_wok_express.jpg';
    EXECUTE IMMEDIATE 'UPDATE RESTAURANTES SET BANNER = :1 WHERE ' || v_rest_id_col || ' = 7 OR ' || v_rest_id_col || ' = ''7''' USING 'Imagenes/banner_veggie_life.jpg';
    EXECUTE IMMEDIATE 'UPDATE RESTAURANTES SET BANNER = :1 WHERE ' || v_rest_id_col || ' = 8 OR ' || v_rest_id_col || ' = ''8''' USING 'Imagenes/banner_sweet_bakery.jpg';
    EXECUTE IMMEDIATE 'UPDATE RESTAURANTES SET BANNER = :1 WHERE ' || v_rest_id_col || ' = 9 OR ' || v_rest_id_col || ' = ''9''' USING 'Imagenes/banner_steakhouse.jpg';
    EXECUTE IMMEDIATE 'UPDATE RESTAURANTES SET BANNER = :1 WHERE ' || v_rest_id_col || ' = 10 OR ' || v_rest_id_col || ' = ''10''' USING 'Imagenes/banner_gelato_mio.jpg';
    DBMS_OUTPUT.PUT_LINE('✓ 10 restaurantes actualizados con sus URLs de imagen.');

    -- 4. DETECTAR LA TABLA DE PLATOS/PRODUCTOS (PRODUCTOS, PLATILLOS, PLATOS, etc.)
    BEGIN
        SELECT table_name INTO v_prod_table
        FROM user_tables
        WHERE table_name IN ('PRODUCTOS', 'PLATILLOS', 'PLATOS', 'MENU', 'ITEMS', 'COMIDAS')
          AND ROWNUM = 1;
        DBMS_OUTPUT.PUT_LINE('✓ Tabla de platos detectada: ' || v_prod_table);
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            v_prod_table := NULL;
            DBMS_OUTPUT.PUT_LINE('⚠️ No se detectó automáticamente la tabla de platos. Revisa el nombre con SELECT TABLE_NAME FROM USER_TABLES;');
    END;

    IF v_prod_table IS NOT NULL THEN
        -- Detectar columna ID de platos
        BEGIN
            SELECT column_name INTO v_prod_id_col
            FROM user_tab_columns
            WHERE table_name = v_prod_table
              AND UPPER(column_name) IN ('ID', 'ID_PRODUCTO', 'ID_PLATO', 'PRODUCTO_ID', 'COD_PRODUCTO')
              AND ROWNUM = 1;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                SELECT column_name INTO v_prod_id_col
                FROM user_tab_columns
                WHERE table_name = v_prod_table
                ORDER BY column_id FETCH FIRST 1 ROWS ONLY;
        END;

        -- Detectar o crear columna de imagen en la tabla de platos
        BEGIN
            SELECT column_name INTO v_prod_img_col
            FROM user_tab_columns
            WHERE table_name = v_prod_table
              AND UPPER(column_name) IN ('IMAGE', 'IMAGEN', 'PRO_IMAGEN_URL', 'IMAGEN_URL', 'FOTO')
              AND ROWNUM = 1;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                EXECUTE IMMEDIATE 'ALTER TABLE ' || v_prod_table || ' ADD (IMAGE VARCHAR2(500))';
                v_prod_img_col := 'IMAGE';
        END;

        DBMS_OUTPUT.PUT_LINE('✓ Actualizando imágenes en ' || v_prod_table || ' (columna: ' || v_prod_img_col || ', ID: ' || v_prod_id_col || ')...');

        -- Actualizar los platos principales
        BEGIN
            EXECUTE IMMEDIATE 'UPDATE ' || v_prod_table || ' SET ' || v_prod_img_col || ' = :1 WHERE ' || v_prod_id_col || ' = 1 OR ' || v_prod_id_col || ' = ''1''' USING 'Imagenes/plato_pizza_margarita.jpg';
            EXECUTE IMMEDIATE 'UPDATE ' || v_prod_table || ' SET ' || v_prod_img_col || ' = :1 WHERE ' || v_prod_id_col || ' = 11 OR ' || v_prod_id_col || ' = ''11''' USING 'Imagenes/plato_hamburguesa_smash.jpg';
            EXECUTE IMMEDIATE 'UPDATE ' || v_prod_table || ' SET ' || v_prod_img_col || ' = :1 WHERE ' || v_prod_id_col || ' = 51 OR ' || v_prod_id_col || ' = ''51''' USING 'Imagenes/plato_ramen_casa.jpg';
            EXECUTE IMMEDIATE 'UPDATE ' || v_prod_table || ' SET ' || v_prod_img_col || ' = :1 WHERE ' || v_prod_id_col || ' = 61 OR ' || v_prod_id_col || ' = ''61''' USING 'Imagenes/plato_bowl_arcoiris.jpg';
            DBMS_OUTPUT.PUT_LINE('✓ Platos actualizados correctamente.');
        EXCEPTION
            WHEN OTHERS THEN
                DBMS_OUTPUT.PUT_LINE('Aviso al actualizar platos: ' || SQLERRM);
        END;
    END IF;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('✓ Transacción confirmada (COMMIT) exitosamente.');
END;
/

-- --------------------------------------------------------------------
-- CONSULTA PARA VER LA CONSULTA ORIGINAL DE TUS HANDLERS ORDS
-- --------------------------------------------------------------------
-- Ejecuta esto si deseas ver exactamente de qué tablas extrae los datos tu API:
-- SELECT uri_template, source 
-- FROM user_ords_handlers h 
-- JOIN user_ords_templates t ON h.template_id = t.id;
