import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GROQ } from '@/lib/config';

const SUGGESTIONS_SYSTEM = `Você é um assistente que sugere frases para o usuário adicionar a um documento.
Com base na descrição do workspace e no título/conteúdo do documento atual, sugira de 3 a 5 frases curtas e objetivas que façam sentido como continuação ou melhoria do texto.
As sugestões devem ser em português do Brasil e prontas para colar no documento (não inclua numeração, bullets ou prefixos).
Retorne APENAS um JSON válido: um array de strings. Exemplo: ["Primeira sugestão.", "Segunda sugestão."]
Nada mais além do array.`;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const apiKey = GROQ.apiKey;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'GROQ_API_KEY não configurada',
          message: 'Configure GROQ_API_KEY no .env.local para usar sugestões de IA.',
        },
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      workspaceDescription = '',
      documentTitle = '',
      documentContent = '',
    } = body as {
      workspaceDescription?: string;
      documentTitle?: string;
      documentContent?: string;
    };

    const contextParts: string[] = [];
    if (workspaceDescription?.trim()) {
      contextParts.push(
        `Descrição do workspace:\n${String(workspaceDescription).trim().slice(0, 2000)}`,
      );
    }
    if (documentTitle?.trim()) {
      contextParts.push(`Título do documento: ${String(documentTitle).trim().slice(0, 500)}`);
    }
    if (documentContent?.trim()) {
      contextParts.push(
        `Conteúdo atual do documento (resumo ou trecho):\n${String(documentContent).trim().slice(0, 4000)}`,
      );
    }

    const userContent =
      contextParts.length > 0
        ? contextParts.join('\n\n---\n\n')
        : 'Não há contexto específico. Sugira frases genéricas úteis para documentação (ex.: objetivos, próximos passos, referências).';

    const client = new Groq({ apiKey });
    const completion = await client.chat.completions.create({
      model: GROQ.chatModel,
      messages: [
        { role: 'system', content: SUGGESTIONS_SYSTEM },
        { role: 'user', content: userContent },
      ],
      temperature: 0.6,
      max_tokens: 512,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';
    const jsonStr = raw.replace(/^```json?\s*|\s*```$/g, '').trim();
    let suggestions: string[] = [];

    try {
      const parsed = JSON.parse(jsonStr);
      suggestions = Array.isArray(parsed)
        ? parsed
            .filter((s): s is string => typeof s === 'string')
            .map((s) => String(s).trim())
            .filter(Boolean)
        : [];
    } catch {
      const lines = raw
        .split('\n')
        .map((l) => l.replace(/^[\d\-*.]\s*/, '').trim())
        .filter(Boolean);
      suggestions = lines.slice(0, 5);
    }

    return NextResponse.json({
      suggestions: suggestions.slice(0, 5),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao gerar sugestões';
    return NextResponse.json({ error: 'Erro interno', message }, { status: 500 });
  }
}
