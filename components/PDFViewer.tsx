
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'https://esm.sh/pdfjs-dist@4.10.38';

// Initialize the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  onLoadSuccess?: (numPages: number) => void;
  children?: React.ReactNode;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl, onLoadSuccess, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const renderPDF = async () => {
      if (!fileUrl) return;
      setLoading(true);
      setError(null);

      try {
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        
        if (onLoadSuccess) onLoadSuccess(pdf.numPages);

        // For this implementation, we render the first page as the main workspace
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(canvas);
          canvas.className = "w-full h-auto shadow-lg rounded-sm";
          setLoading(false);
        }
      } catch (err) {
        console.error("PDF Render Error:", err);
        if (isMounted) {
          setError("לא ניתן היה לטעון את הקובץ. וודא שמדובר בקובץ PDF תקין.");
          setLoading(false);
        }
      }
    };

    renderPDF();
    return () => { isMounted = false; };
  }, [fileUrl]);

  return (
    <div className="relative w-full flex flex-col items-center">
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-bold text-blue-600 animate-pulse">מכין את המסמך לעריכה...</p>
        </div>
      )}
      
      {error && (
        <div className="p-8 text-center bg-red-50 rounded-2xl border-2 border-red-100 max-w-md">
          <p className="text-red-600 font-bold mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold">נסה שוב</button>
        </div>
      )}

      <div ref={containerRef} className="relative z-0 w-full overflow-hidden rounded-sm border shadow-md bg-white">
        {/* PDF Canvas will be injected here */}
      </div>
      
      {/* Overlay for fields */}
      {!loading && !error && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
