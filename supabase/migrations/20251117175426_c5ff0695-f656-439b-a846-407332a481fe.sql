-- Atualizar policy de activity_logs para incluir tk_master
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view all activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'tk_master'::app_role)
);

-- Atualizar policy de profiles para incluir tk_master
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'tk_master'::app_role)
);

-- Atualizar todas as policies de documents para incluir tk_master
DROP POLICY IF EXISTS "Only admins can delete documents" ON public.documents;
CREATE POLICY "Only admins can delete documents" 
ON public.documents 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'tk_master'::app_role)
);

DROP POLICY IF EXISTS "Only admins can insert documents" ON public.documents;
CREATE POLICY "Only admins can insert documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'tk_master'::app_role)
);

DROP POLICY IF EXISTS "Only admins can update documents" ON public.documents;
CREATE POLICY "Only admins can update documents" 
ON public.documents 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'tk_master'::app_role)
);

DROP POLICY IF EXISTS "Only admins can view documents" ON public.documents;
CREATE POLICY "Only admins can view documents" 
ON public.documents 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'tk_master'::app_role)
);