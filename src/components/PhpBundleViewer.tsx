import React, { useState } from 'react';
import { Download, FileCode, Check, Copy, Folder, Terminal, Server, Sparkles } from 'lucide-react';
import { PHP_BUNDLE_FILES, downloadPhpZipBundle, PhpFileItem } from '../data/phpBundle';

export const PhpBundleViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<PhpFileItem>(PHP_BUNDLE_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      await downloadPhpZipBundle();
    } catch (e) {
      console.error(e);
      alert('خطا در دانلود بسته فشرده');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Intro Header */}
      <div className="bg-neutral-900/80 border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Server className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-bold text-white">پکیج اسکریپت کامل PHP (نسخه مستقل برای سرور و هاست)</h2>
          </div>
          <p className="text-xs text-white/60 leading-relaxed max-w-2xl">
            تمام کدهای اسکریپت PHP بر اساس معماری درخواستی شما به صورت ساختاریافته آماده شده است. می‌توانید فایل‌ها را مرور و کپی کنید، یا با یک کلیک کل پروژه را به صورت فایل ZIP دانلود و روی هاست خود اجرا نمایید.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange-950/40 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>{isZipping ? 'در حال ایجاد فایل ZIP...' : 'دانلود پکیج کامل PHP (فایل ZIP)'}</span>
        </button>
      </div>

      {/* Terminal Command Quick Reference */}
      <div className="bg-black/50 border border-white/5 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-white/80">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>دستور اجرای محلی در لینوکس / مک / ویندوز بدون نیاز به Composer:</span>
        </div>
        <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-lg border border-white/10 font-mono text-emerald-400" dir="ltr">
          <code>php -S localhost:8080 -t public</code>
        </div>
      </div>

      {/* Main File Browser & Code Viewer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* File Tree */}
        <div className="md:col-span-1 bg-neutral-900/60 border border-white/10 rounded-2xl p-3 flex flex-col gap-1.5 max-h-[580px] overflow-y-auto">
          <div className="text-[11px] font-bold text-white/40 px-2 py-1 uppercase tracking-wider">
            ساختار پوشه‌ها و فایل‌ها
          </div>

          {PHP_BUNDLE_FILES.map((file) => {
            const isSelected = file.path === selectedFile.path;
            const isCore = file.category === 'core';
            const isSkill = file.category === 'skills';

            return (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all text-right ${
                  isSelected
                    ? 'bg-orange-600/20 text-orange-200 border border-orange-500/40 font-semibold'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-orange-400' : 'text-white/40'}`} />
                <span className="font-mono text-[11px] truncate" dir="ltr">{file.path}</span>
              </button>
            );
          })}
        </div>

        {/* Code Content Viewport */}
        <div className="md:col-span-3 bg-neutral-900/60 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10">
            <div>
              <span className="font-mono text-xs text-orange-400 font-bold" dir="ltr">
                {selectedFile.path}
              </span>
              <span className="text-xs text-white/50 mr-2">
                — {selectedFile.description}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-xs border border-white/5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'کپی شد' : 'کپی کد'}</span>
            </button>
          </div>

          {/* Code Body */}
          <pre
            dir="ltr"
            className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto overflow-y-auto max-h-[520px] bg-black/30 leading-relaxed selection:bg-orange-600/40"
          >
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
