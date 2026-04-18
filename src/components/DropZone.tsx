'use client';

import { useCallback, useState } from 'react';

interface DropZoneProps {
  onParsed: (text: string, name: string) => void;
  onError: (msg: string) => void;
  fileName: string;
  maxSize: number;
}

async function extractTextFromPDF(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/parse-pdf', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to parse PDF');
  }

  const data = (await res.json()) as { text: string };
  return data.text;
}

export default function DropZone({ onParsed, onError, fileName, maxSize }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        onError('Only PDF files are supported. For other formats, use the "Paste text" option.');
        return;
      }

      if (file.size > maxSize) {
        onError(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`);
        return;
      }

      setIsProcessing(true);
      try {
        const text = await extractTextFromPDF(file);
        if (!text || text.trim().length < 50) {
          onError(
            'Could not extract text from this PDF — it may be a scanned image. Please use the "Paste text" option instead.'
          );
          return;
        }
        onParsed(text, file.name);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to read PDF';
        onError(msg);
      } finally {
        setIsProcessing(false);
      }
    },
    [maxSize, onError, onParsed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = '';
    },
    [processFile]
  );

  return (
    <label
      className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all duration-200
        ${isDragging
          ? 'border-accent bg-accent-glow scale-[1.01]'
          : fileName
            ? 'border-success-border bg-success-bg'
            : 'border-border bg-surface hover:border-border-bright hover:bg-elevated'
        }
        ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
      style={isDragging ? { boxShadow: '0 0 32px rgba(64,128,255,0.12)' } : {}}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        onChange={handleChange}
        disabled={isProcessing}
      />

      {isProcessing ? (
        <>
          <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-display font-semibold text-primary">Extracting text…</p>
          <p className="text-xs text-secondary mt-1.5">Analysing your resume content</p>
        </>
      ) : fileName ? (
        <>
          <div className="w-14 h-14 bg-success-bg border border-success-border rounded-2xl flex items-center justify-center mb-4">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M4 13L10 19L22 7" stroke="#10D98A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="font-display font-semibold text-primary truncate max-w-xs">{fileName}</p>
          <p className="text-sm text-secondary mt-1.5">Ready to score · Click to change file</p>
        </>
      ) : (
        <>
          <div className="w-14 h-14 bg-elevated border border-border-bright rounded-2xl flex items-center justify-center mb-4">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M15 3H7a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z"
                stroke="#8096BC" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M15 3v6h6M13 13v6M10 16l3-3 3 3"
                stroke="#8096BC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="font-display font-semibold text-primary text-base">Drop your PDF here</p>
          <p className="text-sm text-secondary mt-1.5">or click to browse · Max 5MB</p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-dim bg-elevated border border-border rounded-lg px-4 py-2">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1" />
              <path d="M6 5.5V8M6 4h.01" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
            Scanned PDF? Use the &quot;Paste text&quot; tab instead
          </div>
        </>
      )}
    </label>
  );
}
