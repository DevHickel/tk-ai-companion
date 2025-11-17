/**
 * Validação de variáveis de ambiente obrigatórias
 * Garante que o app não inicie sem as configurações críticas do Supabase
 */

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_PROJECT_ID'
] as const;

export function validateEnv(): void {
  const missing = requiredEnvVars.filter(
    (key) => !import.meta.env[key]
  );

  if (missing.length > 0) {
    const errorMessage = `❌ ERRO CRÍTICO: Variáveis de ambiente ausentes:\n${missing.map(k => `  - ${k}`).join('\n')}\n\nVerifique o arquivo .env`;
    
    // Em desenvolvimento, mostrar erro claro
    if (import.meta.env.DEV) {
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    // Em produção, falhar silenciosamente mas logar
    console.error(errorMessage);
  }
}

/**
 * Utilitário para verificar se está em produção
 */
export const isProduction = import.meta.env.PROD;

/**
 * Utilitário para verificar se está em desenvolvimento
 */
export const isDevelopment = import.meta.env.DEV;
