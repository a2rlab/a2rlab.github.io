import {createRoot} from 'react-dom/client';
import Editor from './app/edit/editor';
import './app/globals.css';
import './app/expansion.css';
createRoot(document.getElementById('root')!).render(<Editor/>);
