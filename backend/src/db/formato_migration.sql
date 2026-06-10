-- ============================================================
-- STREETPLAYER — Agregar formato 6v6 (fulbito)
-- El CHECK original omitía el 6, pero es un formato real que
-- el frontend ofrece. Alinea la BD con la app.
-- ============================================================

ALTER TABLE eventos DROP CONSTRAINT IF EXISTS eventos_formato_check;
ALTER TABLE eventos ADD CONSTRAINT eventos_formato_check CHECK (formato IN (5,6,7,8,9,10,11));

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_formato_preferido_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_formato_preferido_check CHECK (formato_preferido IN (5,6,7,8,9,10,11));
