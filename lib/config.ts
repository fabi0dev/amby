/**
 * Configurações e constantes da aplicação.
 * Centraliza nome da marca, textos reutilizados e config de serviços (ex.: Groq).
 */

/** Chave da API Groq (sanitizada). Use GROQ.apiKey para chamadas. */
function getGroqApiKey(): string {
  const raw =
    process.env.GROQ_API_KEY ||
    process.env.NEXT_PUBLIC_GROQ_API_KEY ||
    (process.env as Record<string, string>).GROQ_API_KEY ||
    '';
  return raw.trim().replace(/\s+/g, '').replace(/\n/g, '').replace(/\r/g, '');
}

/** Modelo Groq para o chat principal (completion). */
function getGroqChatModel(): string {
  return process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
}

/** Modelo Groq para classificação de intenção (leve e rápido). */
function getGroqClassifyModel(): string {
  return process.env.GROQ_MODEL_CLASSIFY || 'llama-3.1-8b-instant';
}

export const GROQ = {
  get apiKey(): string {
    return getGroqApiKey();
  },
  get chatModel(): string {
    return getGroqChatModel();
  },
  get classifyModel(): string {
    return getGroqClassifyModel();
  },
} as const;

export const APP_NAME = 'Amby';

export const AUTH = {
  tagline: 'Plataforma self-hosted · Privacidade e controle',
  panel: {
    login: {
      title: 'Documentação colaborativa para sua equipe',
      description:
        'Crie, edite e organize documentos em workspaces. Tudo em um só lugar, com controle total.',
    },
    register: {
      title: 'Comece a documentar em minutos',
      description: 'Crie sua conta, organize documentos em workspaces e colabore com sua equipe.',
    },
  },
} as const;
