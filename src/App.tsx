import React, { useState } from 'react';
import Layout from './components/Layout/Layout';
import OneDScene from './pages/OneDScene/OneDScene';
import TwoDScene from './pages/TwoDScene/TwoDScene';

const App: React.FC = () => {
  const [page, setPage] = useState<'1d' | '2d'>('1d');
  return (
    <Layout>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={() => setPage('1d')}>1D</button>
        <button onClick={() => setPage('2d')}>2D</button>
      </div>
      {page === '1d' ? <OneDScene /> : <TwoDScene />}
    </Layout>
  );
};

export default App;
