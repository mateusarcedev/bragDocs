import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Entry } from '@brag-docs/shared';

export function DocView() {
  const params = useParams();
  const entryId = useMemo(() => Number(params.id), [params.id]);

  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setEntry(null);

      if (!Number.isFinite(entryId) || entryId <= 0) {
        setError('Entry inválida.');
        setLoading(false);
        return;
      }

      try {
        const data = await api.getEntry(entryId);
        if (!cancelled) setEntry(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Falha ao carregar a entry.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [entryId]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">DocView</h1>
          <Button asChild variant="outline">
            <Link to="/entries">Voltar</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-red-600">{error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!entry) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{format(new Date(entry.date), 'PPP', { locale: ptBR })}</h1>
          <div className="text-sm text-muted-foreground">{entry.week}</div>
        </div>
        <Button asChild variant="outline">
          <Link to="/entries">Voltar</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Markdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactMarkdown className="prose dark:prose-invert max-w-none">{entry.raw_content}</ReactMarkdown>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {entry.tasks?.map((task) => (
                  <div key={task.id} className="border-l-4 border-primary pl-4 py-1">
                    <div className="flex items-center gap-2">
                      {task.ticket_id ? (
                        <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                          {task.ticket_id}
                        </span>
                      ) : null}
                      <span className="font-semibold">{task.title}</span>
                      <span className="text-xs text-muted-foreground">({task.project})</span>
                    </div>
                    {task.activities && task.activities.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {task.activities.map((activity) => (
                          <li key={activity.id} className="text-sm flex gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>
                              {activity.type === 'evidence' ? (
                                <a
                                  href={activity.description}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline break-all"
                                >
                                  {activity.description}
                                </a>
                              ) : (
                                <span className={activity.type === 'impact' ? 'font-medium text-amber-600' : ''}>
                                  {activity.description}
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
                {!entry.tasks || entry.tasks.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhuma task parseada para esta entry.</div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Raw</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap break-words rounded bg-muted p-4 text-sm">
                {entry.raw_content}
              </pre>
              <div className="mt-2 text-xs text-muted-foreground break-all">{entry.file_path}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
