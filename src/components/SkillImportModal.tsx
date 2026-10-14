import React, { useState } from 'react';
import {
  X,
  Upload,
  Code2,
  CheckCircle2,
  AlertCircle,
  Download,
  Sparkles,
  Github,
  ExternalLink,
  Flame,
  Play,
  Check,
  Layers,
} from 'lucide-react';
import { MotionSkill } from '../types/motion';
import {
  importSkillFromGithubUrl,
  parseAndValidateSkillJson,
  GITHUB_FEATURED_PACKS,
  GithubSkillPackInfo,
  saveCustomSkill,
} from '../engine/skills';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSkillImported: (skill: MotionSkill) => void;
  onPreviewSkill?: (skill: MotionSkill) => void;
}

export const SkillImportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSkillImported,
  onPreviewSkill,
}) => {
  const [tab, setTab] = useState<'featured' | 'url' | 'file' | 'json'>('featured');
  const [urlInput, setUrlInput] = useState('https://github.com/iart-ai/motion-skills');
  const [jsonText, setJsonText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successSkill, setSuccessSkill] = useState<MotionSkill | null>(null);
  const [installedPackIds, setInstalledPackIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleInstallFeaturedPack = (pack: GithubSkillPackInfo) => {
    saveCustomSkill(pack.skill);
    setSuccessSkill(pack.skill);
    setInstalledPackIds(prev => [...prev, pack.id]);
    onSkillImported(pack.skill);
  };

  const handleImportFromUrl = async () => {
    if (!urlInput.trim()) {
      setErrorMsg('لطفاً آدرس لینک اسکیل از گیت‌هاب را وارد کنید.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      const imported = await importSkillFromGithubUrl(urlInput);
      setSuccessSkill(imported);
      onSkillImported(imported);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در بارگیری اسکیل از گیت‌هاب');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = parseAndValidateSkillJson(text);
        setSuccessSkill(imported);
        onSkillImported(imported);
      } catch (err: any) {
        setErrorMsg(err.message || 'فایل نامعتبر است.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg('خطا در خواندن فایل.');
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleImportFromJsonText = () => {
    if (!jsonText.trim()) {
      setErrorMsg('لطفاً کدهای JSON اسکیل را وارد کنید.');
      return;
    }
    setErrorMsg('');
    try {
      const imported = parseAndValidateSkillJson(jsonText);
      setSuccessSkill(imported);
      onSkillImported(imported);
    } catch (err: any) {
      setErrorMsg(err.message || 'کد JSON نامعتبر است.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-white">افزودن اسکیل‌های حرفه‌ای از گیت‌هاب (GitHub Motion Skills)</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                  60 FPS
                </span>
              </div>
              <p className="text-[11px] text-white/50">
                پک‌های اختصاصی Remotion Scenes، iart-ai، Manim و HyperFrames با قابلیت رندر نمودار، پلکسوس و انیمیشن افترافکت
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-white/10 bg-black/20 px-5 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('featured')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              tab === 'featured'
                ? 'border-orange-500 text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>پک‌های منتخب گیت‌هاب ({GITHUB_FEATURED_PACKS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('url')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              tab === 'url'
                ? 'border-orange-500 text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>لینک مستقیم گیت‌هاب</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('file')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              tab === 'file'
                ? 'border-orange-500 text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>آپلود فایل (.json)</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('json')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              tab === 'json'
                ? 'border-orange-500 text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>ویرایشگر JSON</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-500/30 text-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successSkill && (
            <div className="flex items-center justify-between p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 rounded-xl">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">اسکیل «{successSkill.title}» با موفقیت نصب و فعال شد!</div>
                  <div className="text-[11px] text-emerald-300/70 mt-0.5">
                    المان‌های گرافیکی، پالت رنگ و قواعد فیزیک این اسکیل هم‌اکنون در پروژه جاری فعال هستند.
                  </div>
                </div>
              </div>

              {onPreviewSkill && (
                <button
                  type="button"
                  onClick={() => onPreviewSkill(successSkill)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>تست پیش‌نمایش</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 1: FEATURED GITHUB PACKS */}
          {tab === 'featured' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                <span>انتخاب و نصب سریع از بهترین ریپازیتوری‌های اوپن‌سورس موشن‌گرافیک بر پایه کد:</span>
                <span className="font-mono text-[11px] text-orange-400">بدون نیاز به افترافکت</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {GITHUB_FEATURED_PACKS.map((pack) => {
                  const isInstalled = installedPackIds.includes(pack.id);

                  return (
                    <div
                      key={pack.id}
                      className="bg-black/40 border border-white/10 hover:border-orange-500/50 rounded-xl p-3.5 flex flex-col justify-between transition-all group"
                    >
                      <div>
                        {/* Top row */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                              style={{ backgroundColor: pack.skill.theme.accent }}
                            />
                            {pack.title}
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] bg-white/10 text-white/80 px-1.5 py-0.5 rounded font-mono">
                              {pack.badge}
                            </span>
                            <span className="text-[10px] text-orange-400 font-mono">
                              {pack.stars}
                            </span>
                          </div>
                        </div>

                        {/* Tagline & repo */}
                        <p className="text-[11px] text-white/60 leading-relaxed mb-3">
                          {pack.tagline}
                        </p>

                        <div className="flex items-center gap-2 text-[10px] text-white/40 mb-3 font-mono">
                          <a
                            href={pack.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 hover:text-white transition-colors"
                          >
                            <Github className="w-3 h-3" />
                            <span>{pack.repo}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          <span>·</span>
                          <span>افکت: {pack.skill.theme.effect || 'استاندارد'}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                        {onPreviewSkill && (
                          <button
                            type="button"
                            onClick={() => onPreviewSkill(pack.skill)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 text-[11px] font-medium transition-all"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>پیش‌نمایش سریع</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleInstallFeaturedPack(pack)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm ${
                            isInstalled
                              ? 'bg-emerald-600 text-white'
                              : 'bg-orange-600 hover:bg-orange-500 text-white active:scale-95'
                          }`}
                        >
                          {isInstalled ? <Check className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                          <span>{isInstalled ? 'نصب شد' : 'نصب و فعال‌سازی'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Direct GitHub URL */}
          {tab === 'url' && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-white/80 font-semibold block mb-1">
                  آدرس ریپازیتوری یا فایل اسکیل در گیت‌هاب:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    dir="ltr"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://github.com/iart-ai/motion-skills"
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-orange-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleImportFromUrl}
                    disabled={isLoading}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 whitespace-nowrap shadow-md"
                  >
                    {isLoading ? 'در حال واکشی...' : 'واکشی اسکیل'}
                  </button>
                </div>
              </div>

              {/* Quick links to click */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-white/60">
                <span>نمونه‌های آماده:</span>
                <button
                  type="button"
                  onClick={() => setUrlInput('https://github.com/iart-ai/motion-skills')}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-orange-400 font-mono transition-all"
                >
                  iart-ai/motion-skills
                </button>
                <button
                  type="button"
                  onClick={() => setUrlInput('https://github.com/remotion-dev/scenes')}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-orange-400 font-mono transition-all"
                >
                  remotion-dev/scenes
                </button>
                <button
                  type="button"
                  onClick={() => setUrlInput('https://github.com/3b1b/manim')}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-orange-400 font-mono transition-all"
                >
                  3b1b/manim
                </button>
              </div>

              <div className="p-3 bg-black/30 border border-white/5 rounded-xl text-[11px] text-white/50 leading-relaxed">
                💡 با وارد کردن آدرس هر ریپازیتوری یا فایل خام (`raw.githubusercontent.com`)، سیستم ساختار رنگ‌ها، افکت‌های بصری، ترنزیشن‌ها و نمودارهای اسکیل را استخراج و در استودیو اضافه می‌کند.
              </div>
            </div>
          )}

          {/* TAB 3: File Upload */}
          {tab === 'file' && (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/20 rounded-2xl bg-black/20 hover:bg-black/30 cursor-pointer transition-all">
                <Upload className="w-8 h-8 text-orange-400 mb-2" />
                <span className="font-semibold text-white text-xs">انتخاب فایل اسکیل</span>
                <span className="text-[11px] text-white/50 mt-0.5">فرمت‌های قابل قبول: .skill.json یا .json</span>
                <input
                  type="file"
                  accept=".json,.skill.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* TAB 4: JSON Text */}
          {tab === 'json' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-white/80 font-semibold">محتوای ساختار اسکیل (JSON):</span>
              </div>

              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={10}
                dir="ltr"
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:border-orange-500 focus:outline-none"
                placeholder='{\n  "id": "my-custom-skill",\n  "title": "اسکیل اختصاصی",\n  "theme": { "bg": "#0c0a0e", "accent": "#ff4a24", "effect": "plexus" },\n  "style": { "captionMode": "word-spring" }\n}'
              />

              <button
                type="button"
                onClick={handleImportFromJsonText}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                بررسی و ثبت اسکیل
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-black/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs transition-all"
          >
            {successSkill ? 'تأیید و بازگشت' : 'بستن'}
          </button>
        </div>
      </div>
    </div>
  );
};
