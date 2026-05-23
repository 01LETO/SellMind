import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiUrl } from '@/lib/api';

export default function PublicPage() {
  const { id } = useParams();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(apiUrl(`/api/pages/public/${id}`))
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(({ html }) => {
        document.open();
        document.write(html);
        document.close();
      })
      .catch(() => setNotFound(true));
  }, [id]);

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#0d1117',
    fontFamily: 'system-ui, sans-serif',
    color: '#fff',
  };

  if (notFound) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '5rem', margin: 0, fontWeight: 700 }}>404</p>
          <p style={{ color: '#8b8fa3', marginTop: '0.5rem' }}>Página não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '2rem', height: '2rem',
          border: '2px solid rgba(139,92,246,0.3)',
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#8b8fa3', fontSize: '0.875rem' }}>Carregando...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
