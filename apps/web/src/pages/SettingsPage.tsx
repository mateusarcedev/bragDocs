import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/utils';

export function SettingsPage() {
  const { settings, fetchSettings, updateSetting, syncVault, importVault, loading, error } = useStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [aiToken, setAiToken] = useState('');
  const [importing, setImporting] = useState(false);
  const [importInfo, setImportInfo] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: 'vault_path' | 'ai_host') => {
    const value = typeof localSettings[key] === 'string' ? localSettings[key] : '';
    await updateSetting(key, value);
  };

  const handleSaveToken = async () => {
    await updateSetting('ai_token', aiToken);
    setAiToken('');
  };

  const handlePickFolder = () => {
    setImportInfo(null);
    importInputRef.current?.click();
  };

  const handleImportSelected = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;

    setImporting(true);
    setImportInfo('Lendo arquivos...');
    try {
      const files = Array.from(filesList)
        .filter((f) => f.name.toLowerCase().endsWith('.md'));

      const payload: Array<{ file_path: string; raw_content: string }> = [];
      for (const f of files) {
        const filePath = f.webkitRelativePath || f.name;
        const raw = await f.text();
        payload.push({ file_path: filePath, raw_content: raw });
      }

      setImportInfo(`Importando ${payload.length} arquivos...`);
      await importVault(payload);
      setImportInfo('Importação concluída. O vault foi salvo no caminho absoluto da aplicação.');
    } catch (e: unknown) {
      setImportInfo(getErrorMessage(e) ?? 'Falha ao importar.');
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle>Configuração do Vault</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vault_path">Caminho do Vault (absoluto)</Label>
            <div className="flex gap-2">
              <Input
                id="vault_path"
                value={localSettings.vault_path || ''}
                onChange={(e) => handleChange('vault_path', e.target.value)}
                placeholder="/path/to/obsidian/vault"
              />
              <Button onClick={() => handleSave('vault_path')} disabled={loading}>
                Salvar
              </Button>
            </div>
            {settings.vault_path ? (
              <p className="text-sm text-muted-foreground break-all">
                Vault atual: {settings.vault_path}
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              Caminho para a raiz do seu vault do Obsidian contendo 'daily/Week XX/DD-MM-YYYY.md'
            </p>
          </div>
          <div className="space-y-2">
            <Label>Importar via seletor de pasta</Label>
            <div className="flex gap-2">
              <input
                ref={importInputRef}
                type="file"
                multiple
                {...({ webkitdirectory: '', directory: '' } as unknown as Record<string, string>)}
                className="hidden"
                onChange={(e) => handleImportSelected(e.target.files)}
              />
              <Button variant="outline" onClick={handlePickFolder} disabled={loading || importing}>
                {importing ? 'Importando...' : 'Selecionar pasta do vault'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Alternativa ao caminho absoluto: você escolhe a pasta, o navegador lê os .md e envia para o backend.
            </p>
            {importInfo ? (
              <p className="text-sm text-muted-foreground">{importInfo}</p>
            ) : null}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => syncVault()} disabled={loading}>
            {loading ? 'Sincronizando...' : 'Sincronizar agora'}
          </Button>
          {error && <p className="ml-4 text-red-500 text-sm">{error}</p>}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integração com IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai_host">Open WebUI Host</Label>
            <div className="flex gap-2">
              <Input
                id="ai_host"
                value={localSettings.ai_host || ''}
                onChange={(e) => handleChange('ai_host', e.target.value)}
                placeholder="http://localhost:8080"
              />
              <Button onClick={() => handleSave('ai_host')} disabled={loading}>
                Salvar
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai_token">Token da API</Label>
            <div className="flex gap-2">
              <Input
                id="ai_token"
                type="password"
                value={aiToken}
                onChange={(e) => setAiToken(e.target.value)}
                placeholder="sk-..."
              />
              <Button onClick={handleSaveToken} disabled={loading || !aiToken}>
                Salvar
              </Button>
            </div>
            {settings.ai_token_set ? (
              <p className="text-sm text-muted-foreground">Token salvo.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
