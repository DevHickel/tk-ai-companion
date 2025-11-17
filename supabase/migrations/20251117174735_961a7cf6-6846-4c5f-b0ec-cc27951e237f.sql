-- Atualizar as policies da tabela user_roles para permitir apenas tk_master gerenciar roles
DROP POLICY IF EXISTS "Only admins can manage roles" ON user_roles;

-- TK Masters podem fazer tudo com roles
CREATE POLICY "TK Masters can manage all roles"
ON user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'tk_master'::app_role))
WITH CHECK (has_role(auth.uid(), 'tk_master'::app_role));

-- Admins podem apenas visualizar todas as roles (não modificar)
CREATE POLICY "Admins can view all roles"
ON user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Atualizar policies de profiles para admins visualizarem
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'tk_master'::app_role)
);