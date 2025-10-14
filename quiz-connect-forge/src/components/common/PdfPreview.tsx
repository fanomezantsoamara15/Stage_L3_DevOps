import React, { useEffect, useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfPreviewProps {
  url: string;
  onError?: (err: any) => void;
  disableContextMenu?: boolean;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({ url, onError, disableContextMenu = true }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  // Prevent right click if needed
  const handleContextMenu = (e: React.MouseEvent) => {
    if (disableContextMenu) e.preventDefault();
  };

  const onLoadSuccess = ({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages);
  };

  const onLoadError = (err: any) => {
    if (onError) onError(err);
  };

  const zoomIn = () => setScale((s) => Math.min(3, s + 0.1));
  const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.1));

  const prevPage = () => setPageNumber((p) => Math.max(1, p - 1));
  const nextPage = () => setPageNumber((p) => Math.min(numPages, p + 1));

  useEffect(() => {
    setPageNumber(1);
    setScale(1);
  }, [url]);

  return (
    <div className="w-full h-[75vh] bg-black text-white flex flex-col" onContextMenu={handleContextMenu}>
      <div className="flex items-center justify-between p-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={zoomOut}><Minus className="h-4 w-4" /></Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button size="sm" variant="outline" onClick={zoomIn}><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={prevPage} disabled={pageNumber <= 1}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm">{pageNumber} / {numPages || '-'}</span>
          <Button size="sm" variant="outline" onClick={nextPage} disabled={pageNumber >= numPages}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto flex items-start justify-center p-4 select-none">
        <Document file={url} onLoadSuccess={onLoadSuccess} onLoadError={onLoadError} loading={<div className="text-center text-sm">Chargement du PDF...</div>}>
          {numPages > 0 && (
            <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
          )}
        </Document>
      </div>
    </div>
  );
};
