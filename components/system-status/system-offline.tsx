export function SystemOffline() {
  return (
    <main className="flex min-h-[60vh] w-full items-center justify-center px-4">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Sistema temporariamente indisponível
        </h1>
        <p className="text-sm text-muted-foreground">
          Não foi possível estabelecer comunicação com o banco de dados neste momento. Por favor,
          verifique sua conexão ou tente novamente em alguns instantes.
        </p>
      </div>
    </main>
  );
}
