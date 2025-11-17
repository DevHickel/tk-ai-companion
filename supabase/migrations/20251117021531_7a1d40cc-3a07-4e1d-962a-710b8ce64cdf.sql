-- ========================================
-- CORREÇÕES CRÍTICAS DE SEGURANÇA
-- ========================================

-- 1. CORRIGIR RLS NA TABELA DOCUMENTS
-- Habilitar RLS (estava completamente exposta)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem visualizar documentos
CREATE POLICY "Only admins can view documents"
ON public.documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Apenas admins podem inserir documentos
CREATE POLICY "Only admins can insert documents"
ON public.documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Apenas admins podem atualizar documentos
CREATE POLICY "Only admins can update documents"
ON public.documents FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Apenas admins podem deletar documentos
CREATE POLICY "Only admins can delete documents"
ON public.documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ========================================
-- 2. RESTRINGIR ACESSO A EMAILS EM PROFILES
-- ========================================

-- Remover policy que expõe todos os perfis
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Usuários veem apenas o próprio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ========================================
-- 3. CORRIGIR ACTIVITY LOGS (evitar forjamento)
-- ========================================

-- Remover policy insegura
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;

-- Permitir apenas inserção por usuários autenticados
CREATE POLICY "Authenticated users can insert activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- ========================================
-- 4. ADICIONAR search_path NAS FUNÇÕES (evitar SQL injection)
-- ========================================

-- Função: increment_user_points
CREATE OR REPLACE FUNCTION public.increment_user_points(p_user_id uuid, p_points integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles
  SET points = points + p_points
  WHERE id = p_user_id;
END;
$function$;

-- Função: insert_document_chunk
CREATE OR REPLACE FUNCTION public.insert_document_chunk(
  p_content text, 
  p_embedding vector, 
  p_source text, 
  p_page integer, 
  p_uploader_id uuid
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.documents (content, embedding, metadata)
  VALUES (
    p_content, 
    p_embedding, 
    jsonb_build_object(
      'source', p_source,
      'page', p_page,
      'uploader_id', p_uploader_id
    )
  );
END;
$function$;

-- Função: insert_document_embedding
CREATE OR REPLACE FUNCTION public.insert_document_embedding(
  p_content text, 
  p_metadata jsonb, 
  p_embedding vector
)
RETURNS void
LANGUAGE sql
SET search_path = public
AS $function$
  INSERT INTO public.documents (content, metadata, embedding)
  VALUES (p_content, p_metadata, p_embedding);
$function$;

-- ========================================
-- 5. CRIAR ÍNDICES DE PERFORMANCE
-- ========================================

-- Índice para busca de mensagens por conversa (muito usado no chat)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON public.messages(conversation_id, created_at DESC);

-- Índice para busca de roles de usuários (usado em TODAS as policies)
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup 
ON public.user_roles(user_id, role);

-- Índice para busca de activity logs por usuário
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_timestamp 
ON public.activity_logs(user_id, timestamp DESC);

-- Índice para busca de conversas por usuário
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated 
ON public.conversations(user_id, updated_at DESC);

-- Índice para busca de profiles por email (usado no login)
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON public.profiles(email);

-- ========================================
-- 6. ADICIONAR CONSTRAINT PARA EVITAR NULL EM user_id DE ACTIVITY_LOGS
-- ========================================

-- Alterar coluna user_id para NOT NULL (prevenir logs anônimos)
ALTER TABLE public.activity_logs 
ALTER COLUMN user_id SET NOT NULL;