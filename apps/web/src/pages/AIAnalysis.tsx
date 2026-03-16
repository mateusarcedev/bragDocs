import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ReactMarkdown from 'react-markdown';
import type { AnalysisType, AIModel } from '@brag-docs/shared';

export function AIAnalysis() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [period, setPeriod] = useState({ from: '', to: '' });
  const [type, setType] = useState<AnalysisType>('weekly-summary');
  const [result, setResult] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    api.getAIModels().then((data) => {
      setModels(data);
      if (data.length > 0) setSelectedModel(data[0].id);
    }).catch(console.error);
  }, []);

  const handleAnalyze = async () => {
    if (!period.from || !period.to || !selectedModel) return;

    setAnalyzing(true);
    try {
      const response = await api.analyze({
        period,
        type,
        model: selectedModel
      });
      setResult(response.result);
    } catch (e: any) {
      console.error(e);
      setResult(`Error: ${e.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Análise de IA</h1>

      <Card>
        <CardHeader>
          <CardTitle>Configuração</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Período</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={period.from}
                onChange={(e) => setPeriod(prev => ({ ...prev, from: e.target.value }))}
              />
              <span className="self-center">até</span>
              <Input
                type="date"
                value={period.to}
                onChange={(e) => setPeriod(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo de análise</Label>
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={type}
              onChange={(e) => setType(e.target.value as AnalysisType)}
            >
              <option value="weekly-summary">Resumo semanal</option>
              <option value="impact-highlight">Destaques de impacto</option>
              <option value="performance-review">Autoavaliação</option>
              <option value="pattern-detection">Detecção de padrões</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Model</Label>
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name || model.id}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleAnalyze} disabled={analyzing || !selectedModel}>
            {analyzing ? 'Analisando...' : 'Gerar análise'}
          </Button>
        </CardFooter>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
