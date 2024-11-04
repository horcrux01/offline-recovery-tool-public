import React from 'react';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import process from 'process';
import App from './App';

window.global = window;
window.Buffer = Buffer;
window.process = process;

const root = createRoot(document.querySelector('#root')!);
root.render(<App />);
