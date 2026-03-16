import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export function EntriesList() {
  const { entries, fetchData, loading } = useStore();
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    project: ''
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilter = () => {
    fetchData(filters);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Registros</h1>
        <div className="flex gap-2">
          <Input 
            type="date" 
            placeholder="De" 
            value={filters.from}
            onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
            className="w-40"
          />
          <Input 
            type="date" 
            placeholder="Até" 
            value={filters.to}
            onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
            className="w-40"
          />
          <Input 
            type="text" 
            placeholder="Projeto" 
            value={filters.project}
            onChange={(e) => setFilters(prev => ({ ...prev, project: e.target.value }))}
            className="w-40"
          />
          <Button onClick={handleFilter}>Filtrar</Button>
        </div>
      </div>

      {loading ? (
        <div>Carregando registros...</div>
      ) : (
        <div className="grid gap-6">
          {entries.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">Nenhum registro encontrado.</div>
          ) : (
            entries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    <span>{format(new Date(entry.date), 'PPP', { locale: ptBR })}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-normal text-muted-foreground">{entry.week}</span>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/entries/${entry.id}`}>DocView</Link>
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {entry.tasks && entry.tasks.map((task) => (
                      <div key={task.id} className="border-l-4 border-primary pl-4 py-1">
                        <div className="flex items-center gap-2">
                          {task.ticket_id && (
                            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                              {task.ticket_id}
                            </span>
                          )}
                          <span className="font-semibold">{task.title}</span>
                          <span className="text-xs text-muted-foreground">({task.project})</span>
                        </div>
                        {task.activities && task.activities.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {task.activities.map((activity) => (
                              <li key={activity.id} className="text-sm flex gap-2">
                                <span className="text-muted-foreground">•</span>
                                <span>
                                  {activity.type === 'evidence' ? (
                                    <a href={activity.description} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">
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
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
