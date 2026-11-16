import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download, Share2, Star, Link2, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, FileText } from 'lucide-react';
import { FilesService } from '@/services';
import { useI18n } from '@/i18n/I18nContext';
import { FileIcon } from './FileIcon';
import { formatBytes, formatDate, getFileIconName } from '@/utils/format';
import type { FileEntity } from '@/types';

interface FilePreviewerProps {
  file: FileEntity | null;
  onClose: () => void;
  onShowLinked?: (file: FileEntity) => void;
  onPrev?: () => FileEntity | null;
  onNext?: () => FileEntity | null;
}

export function FilePreviewer({ file, onClose, onShowLinked, onPrev, onNext }: FilePreviewerProps) {
  const { t, lang, dir } = useI18n();
  const [linkedFile, setLinkedFile] = useState<FileEntity | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!file) return;
    FilesService.markOpened(file.id);
    FilesService.getLinkedFile(file.id).then(setLinkedFile);
  }, [file]);

  const goPrev = useCallback(() => {
    if (onPrev) {
      const prev = onPrev();
      if (prev) onShowLinked?.(prev);
    }
  }, [onPrev, onShowLinked]);

  const goNext = useCallback(() => {
    if (onNext) {
      const next = onNext();
      if (next) onShowLinked?.(next);
    }
  }, [onNext, onShowLinked]);

  useEffect(() => {
    if (!file) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (dir === 'rtl') {
        if (e.key === 'ArrowLeft') goNext();
        if (e.key === 'ArrowRight') goPrev();
      } else {
        if (e.key === 'ArrowLeft') goPrev();
        if (e.key === 'ArrowRight') goNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [file, dir, goPrev, goNext, onClose]);

  if (!file) return null;

  const type = getFileIconName(file.mimeType);
  const hasNav = !!(onPrev || onNext);

  const onTouchStart = (e: React.TouchEvent) => {
    if (!hasNav) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!hasNav || touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 60) return;
    if (dir === 'rtl') {
      delta < 0 ? goNext() : goPrev();
    } else {
      delta < 0 ? goPrev() : goNext();
    }
  };

  const download = () => {
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        const fileToShare = new File([file.blob], file.name, { type: file.mimeType });
        await navigator.share({ files: [fileToShare], title: file.name });
      } catch { /* user cancelled */ }
    } else {
      download();
    }
  };

  const toggleFav = () => {
    FilesService.toggleFavorite(file.id);
  };

  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col animate-fade-in"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 h-14 bg-slate-900 text-white safe-top shrink-0">
        {onPrev && (
          <button onClick={goPrev} className="p-2 -ms-2 rounded-lg hover:bg-slate-700 transition-colors shrink-0" title="Prev">
            <PrevIcon size={20} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{file.name}</p>
          <p className="text-xs text-slate-400">{formatBytes(file.size)} · {formatDate(file.createdAt, lang)}</p>
        </div>
        {linkedFile && (
          <button
            onClick={() => onShowLinked?.(linkedFile)}
            className="flex items-center gap-1 bg-primary-600 hover:bg-primary-700 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors shrink-0"
          >
            <Link2 size={14} />
            {t('showAnswer')}
          </button>
        )}
        <button onClick={toggleFav} className="p-2 rounded-lg hover:bg-slate-700 transition-colors shrink-0">
          <Star size={20} fill={file.favorite ? '#f59e0b' : 'none'} color={file.favorite ? '#f59e0b' : 'currentColor'} />
        </button>
        <button onClick={share} className="p-2 rounded-lg hover:bg-slate-700 transition-colors shrink-0 hidden sm:block">
          <Share2 size={20} />
        </button>
        <button onClick={download} className="p-2 rounded-lg hover:bg-slate-700 transition-colors shrink-0">
          <Download size={20} />
        </button>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-700 transition-colors shrink-0">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 relative">
        <PreviewContent key={file.id} file={file} type={type} />
        {onPrev && (
          <button
            onClick={goPrev}
            className="absolute top-1/2 -translate-y-1/2 start-2 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
            aria-label="prev"
          >
            <PrevIcon size={22} />
          </button>
        )}
        {onNext && (
          <button
            onClick={goNext}
            className="absolute top-1/2 -translate-y-1/2 end-2 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
            aria-label="next"
          >
            <NextIcon size={22} />
          </button>
        )}
      </div>
    </div>
  );
}

function PreviewContent({ file, type }: { file: FileEntity; type: string }) {
  const url = URL.createObjectURL(file.blob);
  const [pdfPages, setPdfPages] = useState<number>(0);
  const [textContent, setTextContent] = useState<string>('');
  const [sheetData, setSheetData] = useState<string[][]>([]);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pdfPageNum, setPdfPageNum] = useState(1);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  useEffect(() => {
    setZoom(1);
    if (type === 'word') {
      file.blob.arrayBuffer().then(buf => {
        import('mammoth').then(mammoth => {
          mammoth.convertToHtml({ arrayBuffer: buf })
            .then((r: { value: string }) => setTextContent(r.value))
            .catch(() => setError('preview_failed'));
        });
      });
    } else if (type === 'excel') {
      file.blob.arrayBuffer().then(buf => {
        import('xlsx').then(XLSX => {
          const wb = XLSX.read(buf, { type: 'array' });
          setSheetNames(wb.SheetNames);
          const ws = wb.Sheets[wb.SheetNames[0]];
          const html = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: false });
          setSheetData(html.map(r => (r ?? []).map(c => String(c ?? ''))));
        });
      });
    } else if (type === 'pdf') {
      loadPdf();
    }
  }, [file, type]);

  const switchSheet = (idx: number) => {
    setActiveSheet(idx);
    file.blob.arrayBuffer().then(buf => {
      import('xlsx').then(XLSX => {
        const wb = XLSX.read(buf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[idx]];
        const html = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: false });
        setSheetData(html.map(r => (r ?? []).map(c => String(c ?? ''))));
      });
    });
  };

  const loadPdf = async () => {
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const buf = await file.blob.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buf }).promise;
      setPdfPages(pdf.numPages);
      renderPdfPage(pdf, 1);
    } catch {
      setError('preview_failed');
    }
  };

  const renderPdfPage = async (pdf: any, pageNum: number) => {
    const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;
  };

  const goToPdfPage = async (n: number) => {
    setPdfPageNum(n);
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    const buf = await file.blob.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    renderPdfPage(pdf, n);
  };

  if (type === 'image') {
    return (
      <div className="flex flex-col items-center min-h-full p-4">
        {zoom > 1 ? (
          <img
            src={url}
            alt={file.name}
            className="max-w-none rounded-lg shadow-lg"
            style={{ width: `${zoom * 100}%`, transform: 'translateZ(0)' }}
          />
        ) : (
          <img src={url} alt={file.name} className="max-w-full max-h-full rounded-lg shadow-lg" />
        )}
        <div className="sticky bottom-4 mt-4 flex items-center gap-2 bg-slate-900/90 text-white rounded-full px-3 py-2 shadow-lg">
          <button onClick={() => setZoom(z => Math.max(1, z - 0.5))} className="p-1.5 rounded-full hover:bg-slate-700" disabled={zoom <= 1}>
            <ZoomOut size={18} />
          </button>
          <span className="text-xs font-semibold w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.5))} className="p-1.5 rounded-full hover:bg-slate-700" disabled={zoom >= 3}>
            <ZoomIn size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div className="flex items-center justify-center min-h-full p-4">
        <video src={url} controls className="max-w-full max-h-full rounded-lg" />
      </div>
    );
  }

  if (type === 'audio') {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 gap-4">
        <FileIcon mimeType={file.mimeType} size={80} />
        <p className="text-slate-700 dark:text-slate-300 font-semibold">{file.name}</p>
        <audio src={url} controls className="w-full max-w-md" />
      </div>
    );
  }

  if (type === 'pdf') {
    if (error) return <FallbackPreview file={file} url={url} />;
    return (
      <div className="flex flex-col items-center min-h-full">
        <canvas id="pdf-canvas" className="shadow-lg bg-white" />
        {pdfPages > 1 && (
          <div className="sticky bottom-4 flex items-center gap-3 my-4 bg-white dark:bg-slate-800 rounded-full px-4 py-2 shadow-lg">
            <button
              onClick={() => goToPdfPage(Math.max(1, pdfPageNum - 1))}
              disabled={pdfPageNum <= 1}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {pdfPageNum} / {pdfPages}
            </span>
            <button
              onClick={() => goToPdfPage(Math.min(pdfPages, pdfPageNum + 1))}
              disabled={pdfPageNum >= pdfPages}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (type === 'word') {
    if (error) return <FallbackPreview file={file} url={url} />;
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div
          className="bg-white dark:bg-slate-100 rounded-xl shadow-lg p-8 min-h-[60vh] prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: textContent || `<p class="text-slate-400">${'...'}</p>` }}
        />
      </div>
    );
  }

  if (type === 'excel') {
    if (error) return <FallbackPreview file={file} url={url} />;
    return (
      <div className="p-4 space-y-3">
        {sheetNames.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sheetNames.map((name, i) => (
              <button
                key={i}
                onClick={() => switchSheet(i)}
                className={`shrink-0 text-xs font-semibold rounded-full px-3 py-1.5 transition-colors ${
                  i === activeSheet
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
        <div className="overflow-auto">
          <table className="border-collapse bg-white dark:bg-slate-800 mx-auto text-sm rounded-xl overflow-hidden shadow">
            <tbody>
              {sheetData.map((row, i) => (
                <tr key={i} className={i === 0 ? 'font-bold bg-slate-100 dark:bg-slate-700 sticky top-0' : ''}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-slate-800 dark:text-slate-200 whitespace-nowrap"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return <FallbackPreview file={file} url={url} />;
}

function FallbackPreview({ file, url }: { file: FileEntity; url: string }) {
  const { t, lang } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8 gap-4">
      <FileIcon mimeType={file.mimeType} size={80} />
      <p className="text-slate-700 dark:text-slate-300 font-semibold text-center">{file.name}</p>
      <p className="text-sm text-slate-500">{formatBytes(file.size)} · {formatDate(file.createdAt, lang)}</p>
      <p className="text-sm text-slate-400 text-center max-w-xs flex items-center gap-2">
        <FileText size={16} />
        {t('preview')} — {t('download')}
      </p>
      <a href={url} download={file.name} className="btn-primary">
        <Download size={18} />
        {t('download')}
      </a>
    </div>
  );
}
