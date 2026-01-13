import { useState, useEffect } from 'react';
import { greet } from '@webagent/core';

function App() {
  const [message, setMessage] = useState<string>('');
  const [apiMessage, setApiMessage] = useState<string>('');

  useEffect(() => {
    setMessage(greet('React'));

    fetch('/api/')
      .then(res => res.json())
      .then(data => setApiMessage(data.message))
      .catch(err => console.error('API Error:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-indigo-400 mb-6">Emailagent App</h1>
        <p className="text-gray-300 mb-2">Core package: {message}</p>
        <p className="text-gray-300">API response: {apiMessage || 'Loading...'}</p>
      </div>
    </div>
  );
}

export default App;
