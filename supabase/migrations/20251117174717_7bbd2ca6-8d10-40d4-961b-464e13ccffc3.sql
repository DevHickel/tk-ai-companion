-- Adicionar a role 'tk_master' ao enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'tk_master';