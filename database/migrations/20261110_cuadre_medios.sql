ALTER TABLE turnos_caja
    ADD COLUMN IF NOT EXISTS tarjeta_reportada NUMERIC(10, 2) CHECK (tarjeta_reportada >= 0),
    ADD COLUMN IF NOT EXISTS bitcoin_reportado NUMERIC(10, 2) CHECK (bitcoin_reportado >= 0);
