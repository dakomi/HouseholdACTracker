import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { StatsPage } from './pages/StatsPage';
import { SessionsPage } from './pages/SessionsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SelectUserPage } from './pages/SelectUserPage';
import { AdminPage } from './pages/AdminPage';

function App() {
  return (
    <div className="app">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/select-user" element={<SelectUserPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  );
}

export default App;
