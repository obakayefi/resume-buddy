'use client';

import { pdf } from '@react-pdf/renderer';
import { ResumePDF } from './ResumePDF';
import type { MasterResumeData, OptimizedBullet } from '@/lib/types';
import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { registerInterFont } from '@/lib/registerFonts';
import { createElement } from 'react';

interface Props {
  resume: MasterResumeData;
  optimizedBullets?: OptimizedBullet[];
  optimizedSummary?: string;
}

export default function PDFDownloadButton({ resume, optimizedBullets, optimizedSummary }: Props) {
  const [isClient, setIsClient] = useState(false);
  const [fontReady, setFontReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsClient(true);
    registerInterFont()
      .then(() => setFontReady(true))
      .catch((err) => {
        console.error('Font registration failed:', err);
        // Still allow download — react-pdf will fall back to its default font
        setFontReady(true);
      });
  }, []);

  const handleDownload = async () => {
    if (downloading) return;

    setDownloading(true);
    setError('');
    try {
      const pdfDocument = createElement(ResumePDF, {
        resume,
        optimizedBullets,
        optimizedSummary,
      }) as NonNullable<Parameters<typeof pdf>[0]>;
      const blob = await pdf(pdfDocument).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Resume_${(resume.name || 'Resume').trim().replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Resume PDF generation failed:', err);
      setError('Could not create the PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (!isClient || !fontReady) {
    return <button className="btn btn-ghost btn-sm" disabled><Download size={14} /> Preparing PDF…</button>;
  }

  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm" onClick={handleDownload} disabled={downloading}>
        <Download size={14} /> {downloading ? 'Preparing…' : 'Download PDF'}
      </button>
      {error && <span role="alert" style={{ color: 'var(--accent-red)', fontSize: 12 }}>{error}</span>}
    </>
  );
}
