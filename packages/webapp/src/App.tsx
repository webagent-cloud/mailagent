import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { VibeKanbanWebCompanion } from 'vibe-kanban-web-companion';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { EmailAccount } from './pages/EmailAccount';
import { Agents } from './pages/Agents';

function App() {
  return (
    <>
      <VibeKanbanWebCompanion />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/email-account" element={<EmailAccount />} />
            <Route path="/agents" element={<Agents />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </>
  );
}

export default App;
