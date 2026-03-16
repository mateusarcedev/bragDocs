import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { EntriesList } from '@/pages/EntriesList';
import { SettingsPage } from '@/pages/SettingsPage';
import { AIAnalysis } from '@/pages/AIAnalysis';
import { DocView } from '@/pages/DocView';
import { Layout } from '@/components/Layout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="entries" element={<EntriesList />} />
          <Route path="entries/:id" element={<DocView />} />
          <Route path="analysis" element={<AIAnalysis />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
