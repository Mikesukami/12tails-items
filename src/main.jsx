import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { client, configurationError } from './client.js';
import { createRepository } from './repository.js';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode><App client={client} repository={client ? createRepository(client) : null} configurationError={configurationError} /></React.StrictMode>
);
