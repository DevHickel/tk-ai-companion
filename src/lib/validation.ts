import { z } from 'zod';

/**
 * Schema de validação para autenticação (login/signup)
 * - Email: válido, max 255 caracteres
 * - Password: min 8 caracteres, max 100, deve conter maiúscula e número
 */
export const authSchema = z.object({
  email: z.string()
    .trim()
    .min(1, { message: "E-mail é obrigatório" })
    .email({ message: "E-mail inválido" })
    .max(255, { message: "E-mail muito longo (máx. 255 caracteres)" }),
  password: z.string()
    .min(8, { message: "Senha deve ter no mínimo 8 caracteres" })
    .max(100, { message: "Senha muito longa (máx. 100 caracteres)" })
    .regex(/[A-Z]/, { message: "Senha deve conter pelo menos uma letra maiúscula" })
    .regex(/[0-9]/, { message: "Senha deve conter pelo menos um número" })
});

/**
 * Schema de validação para recuperação de senha
 */
export const passwordRecoverySchema = z.object({
  email: z.string()
    .trim()
    .min(1, { message: "E-mail é obrigatório" })
    .email({ message: "E-mail inválido" })
    .max(255, { message: "E-mail muito longo (máx. 255 caracteres)" })
});

/**
 * Schema de validação para mensagens de chat
 * - Conteúdo: não vazio, max 5000 caracteres
 */
export const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, { message: "Mensagem não pode estar vazia" })
    .max(5000, { message: "Mensagem excede limite de 5000 caracteres" })
});

/**
 * Schema de validação para atualização de perfil
 */
export const profileUpdateSchema = z.object({
  full_name: z.string()
    .trim()
    .max(100, { message: "Nome muito longo (máx. 100 caracteres)" })
    .optional(),
  avatar_url: z.string()
    .url({ message: "URL de avatar inválida" })
    .max(500, { message: "URL muito longa" })
    .optional()
    .or(z.literal('')),
});

/**
 * Schema de validação para mudança de senha
 */
export const passwordChangeSchema = z.object({
  newPassword: z.string()
    .min(8, { message: "Senha deve ter no mínimo 8 caracteres" })
    .max(100, { message: "Senha muito longa (máx. 100 caracteres)" })
    .regex(/[A-Z]/, { message: "Senha deve conter pelo menos uma letra maiúscula" })
    .regex(/[0-9]/, { message: "Senha deve conter pelo menos um número" }),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

/**
 * Schema de validação para bug reports
 */
export const bugReportSchema = z.object({
  description: z.string()
    .trim()
    .min(10, { message: "Descrição deve ter no mínimo 10 caracteres" })
    .max(2000, { message: "Descrição muito longa (máx. 2000 caracteres)" })
});
