// This file sets up the PDF.js worker for the application (Vite-friendly)
// Serve the worker from the same origin via bundler to avoid CORS issues.
import { pdfjs } from 'react-pdf';
// Ask Vite to bundle the worker and return its URL string
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Point pdf.js to the local, bundled worker URL
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export default pdfjs;