import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { prisma } from '@/lib/prisma';
import { getMarkdownFromContent } from '@/lib/document-content';
import { Button } from '@/components/ui/button';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface PageProps {
  params: { token: string };
}

export default async function SharedDocumentPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  const share = await prisma.documentShare.findFirst({
    where: {
      token: params.token,
      document: {
        deletedAt: null,
      },
    },
    include: {
      document: {
        include: {
          workspace: true,
        },
      },
    },
  });

  if (!share || !share.document) {
    notFound();
  }

  const { document, permission } = share;
  const markdown = getMarkdownFromContent(document.content as any);
  const canEdit = permission === 'WRITE';
  const editUrl = `/workspace/${document.workspaceId}/${document.id}?mode=edit`;
  const loginUrl = `/login?callback=${encodeURIComponent(editUrl)}`;
  const editHref = canEdit ? (session?.user?.id ? editUrl : loginUrl) : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
        <header className="flex flex-col gap-2 border-b pb-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Link de compartilhamento
          </div>
          <h1 className="text-2xl font-bold leading-tight">
            {document.title || 'Documento sem título'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Espaço: <span className="font-medium">{document.workspace.name}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {permission === 'WRITE' ? 'Pode editar (mediante login)' : 'Somente leitura'}
            </span>
            {canEdit && editHref && (
              <Button asChild size="sm">
                <a href={editHref}>Entrar para editar</a>
              </Button>
            )}
          </div>
        </header>

        <main className="prose prose-slate max-w-none dark:prose-invert">
          {markdown ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          ) : (
            <p className="text-sm text-muted-foreground">(documento vazio)</p>
          )}
        </main>
      </div>
    </div>
  );
}
