'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { ResumePDF } from './ResumePDF';
import type { MasterResumeData, OptimizedBullet } from '@/lib/types';
import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  resume: MasterResumeData;
  optimizedBullets?: OptimizedBullet[];
  optimizedSummary?: string;
}

export default function PDFDownloadButton({ resume, optimizedBullets, optimizedSummary }: Props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <PDFDownloadLink
      document={<ResumePDF resume={resume} optimizedBullets={optimizedBullets} optimizedSummary={optimizedSummary} />}
      fileName={`Resume_${resume.name.replace(/\s+/g, '_')}.pdf`}
      className="btn btn-ghost btn-sm"
    >
      {({ loading }) => (
        <>
          <Download size={14} /> {loading ? 'Preparing...' : 'Download PDF'}
        </>
      )}
    </PDFDownloadLink>
  );
}
