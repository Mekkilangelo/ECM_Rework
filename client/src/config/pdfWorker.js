/**
 * Centralized PDF.js Worker Configuration
 * This file should be imported early in the app (in index.js or App.js)
 * to ensure the worker is configured before any PDF components render
 */

import { pdfjs } from 'react-pdf';
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker for react-pdf (which re-exports pdfjs from pdfjs-dist)
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Also configure pdfjs-dist directly (used by pdfToImageHelper)
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

// Export for verification if needed
export const getPDFWorkerSrc = () => pdfjs.GlobalWorkerOptions.workerSrc;

// Verify worker is configured
if (process.env.NODE_ENV === 'development') {
  console.log('✅ PDF Worker configured:', pdfjs.GlobalWorkerOptions.workerSrc);
}
