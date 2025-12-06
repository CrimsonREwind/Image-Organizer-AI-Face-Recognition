import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AllImages from './pages/AllImages';
import Unidentified from './pages/Unidentified';
import People from './pages/People';
import PersonDetail from './pages/PersonDetail';
import Upload from './pages/Upload';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f3f4f6',
            borderRadius: '0.75rem',
            border: '1px solid #374151',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#1e293b',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#1e293b',
            },
          },
        }}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/images" element={<AllImages />} />
          <Route path="/unidentified" element={<Unidentified />} />
          <Route path="/people" element={<People />} />
          <Route path="/people/:id" element={<PersonDetail />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
