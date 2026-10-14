import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Search,
  Upload,
  Link as LinkIcon,
  Check,
  Trash2,
  Key,
  Layers,
  Eye,
  Sliders,
  ExternalLink,
  RefreshCw,
  Zap,
  Info,
} from 'lucide-react';
import { MotionPlan, MotionSegment, StockImageItem } from '../types/motion';
import {
  searchStockImages,
  autoMatchSlideImages,
  getStoredUnsplashKey,
  saveStoredUnsplashKey,
  getLocalFallbackStock,
} from '../engine/stockService';

interface Props {
  plan: MotionPlan | null;
  onUpdatePlan: (plan: MotionPlan) => void;
  activeTime?: number;
}

const POPULAR_TOPICS = [
  { label: 'هوش مصنوعی', query: 'artificial intelligence neural technology' },
  { label: 'بورس و نمودار', query: 'stock market financial growth chart' },
  { label: 'ارز دیجیتال', query: 'cryptocurrency bitcoin blockchain' },
  { label: 'کد و سایبر', query: 'cyber matrix coding security' },
  { label: 'فضا و کیهان', query: 'space cosmos galaxy stars' },
  { label: 'طبیعت و جنگل', query: 'nature green forest mountains' },
  { label: 'تیم و استارتاپ', query: 'business startup modern office meeting' },
  { label: 'آسمان‌خراش', query: 'city modern skyscraper night architecture' },
  { label: 'انتزاعی دارک', query: 'dark luxury abstract minimal 3d' },
  { label: 'سینمایی', query: 'cinematic studio lighting dark film' },
];

export const StockStudioTab: React.FC<Props> = ({ plan, onUpdatePlan }) => {
  const [activeSegmentId, setActiveSegmentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('artificial intelligence');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait' | 'squarish'>('landscape');
  const [searchResults, setSearchResults] = useState<StockImageItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isAutoMatching, setIsAutoMatching] = useState<boolean>(false);
  const [sourceName, setSourceName] = useState<string>('');
  const [customKey, setCustomKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'unsplash' | 'custom' | 'slides'>('unsplash');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Default selected segment
  useEffect(() => {
    if (plan && plan.segments.length > 0 && !activeSegmentId) {
      setActiveSegmentId(plan.segments[0].id);
    }
  }, [plan, activeSegmentId]);

  // Load stored unsplash key
  useEffect(() => {
    setCustomKey(getStoredUnsplashKey());
    handleSearch('artificial intelligence');
  }, []);

  const handleSearch = async (queryToUse?: string) => {
    const q = (queryToUse !== undefined ? queryToUse : searchQuery).trim();
    if (!q) return;

    setIsSearching(true);
    try {
      const resp = await searchStockImages({
        query: q,
        orientation,
        apiKey: customKey,
      });
      setSearchResults(resp.results || []);
      setSourceName(resp.source || 'Unsplash');
    } catch (e) {
      console.warn('Search error:', e);
      const fallback = getLocalFallbackStock(q, orientation);
      setSearchResults(fallback.results);
      setSourceName(fallback.source);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveApiKey = () => {
    saveStoredUnsplashKey(customKey.trim());
    setShowKeyModal(false);
    setStatusMessage('کلید API با موفقیت ذخیره شد');
    setTimeout(() => setStatusMessage(''), 3000);
    handleSearch();
  };

  const handleApplyImageToSegment = (segId: string, image: StockImageItem) => {
    if (!plan) return;

    const newSegments = plan.segments.map((seg) => {
      if (seg.id === segId) {
        return {
          ...seg,
          backgroundImage: image.fullUrl,
          backgroundDim: seg.backgroundDim !== undefined ? seg.backgroundDim : 0.62,
          kenBurns: seg.kenBurns !== undefined ? seg.kenBurns : true,
          imageKeywords: image.alt,
          imageCredit: {
            author: image.author.name,
            authorUrl: image.author.portfolioUrl,
            source: image.source,
            photoUrl: image.fullUrl,
          },
        };
      }
      return seg;
    });

    onUpdatePlan({ ...plan, segments: newSegments });
    setStatusMessage(`تصویر روی اسلاید انتخاب‌شده اعمال شد`);
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const handleApplyImageToAllSegments = (image: StockImageItem) => {
    if (!plan) return;

    const newSegments = plan.segments.map((seg) => ({
      ...seg,
      backgroundImage: image.fullUrl,
      backgroundDim: seg.backgroundDim !== undefined ? seg.backgroundDim : 0.62,
      kenBurns: seg.kenBurns !== undefined ? seg.kenBurns : true,
      imageCredit: {
        author: image.author.name,
        authorUrl: image.author.portfolioUrl,
        source: image.source,
        photoUrl: image.fullUrl,
      },
    }));

    onUpdatePlan({ ...plan, segments: newSegments });
    setStatusMessage('تصویر به عنوان پس‌زمینه تمام اسلایدها تنظیم شد');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleRemoveImageFromSegment = (segId: string) => {
    if (!plan) return;
    const newSegments = plan.segments.map((seg) => {
      if (seg.id === segId) {
        const copy = { ...seg };
        delete copy.backgroundImage;
        delete copy.imageCredit;
        delete copy.imageKeywords;
        return copy;
      }
      return seg;
    });
    onUpdatePlan({ ...plan, segments: newSegments });
  };

  const handleRemoveAllImages = () => {
    if (!plan) return;
    const newSegments = plan.segments.map((seg) => {
      const copy = { ...seg };
      delete copy.backgroundImage;
      delete copy.imageCredit;
      delete copy.imageKeywords;
      return copy;
    });
    onUpdatePlan({ ...plan, segments: newSegments });
    setStatusMessage('تمامی تصاویر پس‌زمینه حذف شدند');
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const handleAutoMatchAll = async () => {
    if (!plan || plan.segments.length === 0) return;

    setIsAutoMatching(true);
    setStatusMessage('در حال تحلیل متن اسلایدها و استخراج تصاویر مرتبط از Unsplash...');

    try {
      const resp = await autoMatchSlideImages(plan.segments, orientation, customKey);

      if (resp && resp.matches && resp.matches.length > 0) {
        const matchMap = new Map<string, { image: StockImageItem; query: string }>();
        resp.matches.forEach((m) => matchMap.set(m.segmentId, m));

        const updatedSegments = plan.segments.map((seg) => {
          const match = matchMap.get(seg.id);
          if (match && match.image) {
            return {
              ...seg,
              backgroundImage: match.image.fullUrl,
              backgroundDim: 0.62,
              kenBurns: true,
              imageKeywords: match.query,
              imageCredit: {
                author: match.image.author.name,
                authorUrl: match.image.author.portfolioUrl,
                source: match.image.source,
                photoUrl: match.image.fullUrl,
              },
            };
          }
          return seg;
        });

        onUpdatePlan({ ...plan, segments: updatedSegments });
        setStatusMessage(`تطبیق هوشمند برای تمام ${resp.matches.length} اسلاید با موفقیت انجام شد!`);
      } else {
        setStatusMessage('پاسخی از سرویس تطبیق دریافت نشد.');
      }
    } catch (err: any) {
      console.error('Auto match failed:', err);
      setStatusMessage('خطا در تطبیق خودکار هوش مصنوعی.');
    } finally {
      setIsAutoMatching(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl && activeSegmentId) {
        handleApplyImageToSegment(activeSegmentId, {
          id: `custom-${Date.now()}`,
          thumbUrl: dataUrl,
          fullUrl: dataUrl,
          alt: file.name,
          author: { name: 'فایل آپلود شده' },
          source: 'Custom',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim() || !activeSegmentId) return;
    handleApplyImageToSegment(activeSegmentId, {
      id: `url-${Date.now()}`,
      thumbUrl: customUrl.trim(),
      fullUrl: customUrl.trim(),
      alt: 'تصویر سفارشی اینترنتی',
      author: { name: 'آدرس مستقیم اینترنتی' },
      source: 'Custom',
    });
    setCustomUrl('');
  };

  const handleUpdateDimming = (segId: string, dim: number) => {
    if (!plan) return;
    const newSegments = plan.segments.map((s) => (s.id === segId ? { ...s, backgroundDim: dim } : s));
    onUpdatePlan({ ...plan, segments: newSegments });
  };

  const handleToggleKenBurns = (segId: string) => {
    if (!plan) return;
    const newSegments = plan.segments.map((s) =>
      s.id === segId ? { ...s, kenBurns: s.kenBurns === false ? true : false } : s
    );
    onUpdatePlan({ ...plan, segments: newSegments });
  };

  const activeSegment = plan?.segments.find((s) => s.id === activeSegmentId);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-600/20 border border-orange-500/30 text-orange-400">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">ماژول تصاویر استوک و پس‌زمینه هوشمند</h2>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Unsplash Ready
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                اتصال مستقیم به APIهای رایگان تصاویر استوک برای قرار دادن تصاویر مرتبط در لایه پس‌زمینه اسلایدها
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowKeyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-xs transition-all border border-white/10"
              title="تنظیم کلید دسترسی Unsplash"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{customKey ? 'کلید اختصاصی فعال' : 'تنظیم کلید API (اختیاری)'}</span>
            </button>

            <button
              onClick={handleAutoMatchAll}
              disabled={isAutoMatching || !plan || plan.segments.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold transition-all shadow-lg shadow-orange-950/50 disabled:opacity-50"
            >
              {isAutoMatching ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isAutoMatching ? 'در حال تطبیق با هوش مصنوعی...' : 'تطبیق خودکار تمام اسلایدها (AI Auto-Match)'}</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-3 py-1.5 px-3 rounded-lg bg-orange-950/60 border border-orange-500/30 text-orange-200 text-xs flex items-center gap-2 animate-fadeIn">
            <Info className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* 2. Main Studio Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Top (5 cols): Slide Timeline & Assigned Image Inspector */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white">اسلایدهای پروژه ({plan?.segments.length || 0})</h3>
              </div>

              {plan && plan.segments.some((s) => s.backgroundImage) && (
                <button
                  onClick={handleRemoveAllImages}
                  className="text-[11px] text-white/50 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>حذف تمام تصاویر</span>
                </button>
              )}
            </div>

            {/* List of Segments */}
            <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">
              {plan?.segments.map((seg, idx) => {
                const isSelected = seg.id === activeSegmentId;
                const hasImage = !!seg.backgroundImage;

                return (
                  <div
                    key={seg.id}
                    onClick={() => setActiveSegmentId(seg.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-orange-950/30 border-orange-500/60 shadow-md shadow-orange-950/30'
                        : 'bg-black/30 border-white/5 hover:border-white/15'
                    }`}
                  >
                    {/* Thumbnail / Status */}
                    <div className="w-14 h-10 rounded-lg overflow-hidden bg-neutral-800 border border-white/10 shrink-0 relative flex items-center justify-center">
                      {hasImage ? (
                        <img
                          src={seg.backgroundImage}
                          alt="Slide BG"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-white/20" />
                      )}
                      <span className="absolute bottom-0 right-0 bg-black/70 text-[9px] font-mono px-1 rounded-tl text-white/70">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Segment Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono" dir="ltr">
                        <span>
                          {seg.from.toFixed(1)}s - {seg.to.toFixed(1)}s
                        </span>
                        <span>·</span>
                        <span className="capitalize">{seg.kind}</span>
                      </div>
                      <p className="text-xs text-white/90 truncate font-medium mt-0.5">{seg.text}</p>
                      {seg.imageCredit && (
                        <span className="text-[10px] text-orange-300/70 block truncate">
                          📷 {seg.imageCredit.author} ({seg.imageCredit.source})
                        </span>
                      )}
                    </div>

                    {/* Remove individual image button */}
                    {hasImage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImageFromSegment(seg.id);
                        }}
                        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-all"
                        title="حذف تصویر این اسلاید"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Active Segment Adjustment Controls */}
            {activeSegment && (
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">تنظیمات اسلاید #{plan?.segments.findIndex((s) => s.id === activeSegment.id)! + 1}:</span>
                  <span className="text-orange-400 font-mono text-[11px] truncate max-w-[200px]">
                    {activeSegment.text}
                  </span>
                </div>

                {activeSegment.backgroundImage ? (
                  <>
                    {/* Dimming Slider */}
                    <div className="flex flex-col gap-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/70 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-orange-400" />
                          <span>تیرگی پس‌زمینه (خوانایی متن):</span>
                        </span>
                        <span className="font-mono text-white/90">
                          {Math.round((activeSegment.backgroundDim !== undefined ? activeSegment.backgroundDim : 0.62) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.05"
                        value={activeSegment.backgroundDim !== undefined ? activeSegment.backgroundDim : 0.62}
                        onChange={(e) => handleUpdateDimming(activeSegment.id, parseFloat(e.target.value))}
                        className="w-full accent-orange-500 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                      />
                    </div>

                    {/* Ken Burns Toggle */}
                    <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5 text-xs">
                      <span className="text-white/70">زوم متحرک سینمایی (Ken Burns 60fps):</span>
                      <button
                        onClick={() => handleToggleKenBurns(activeSegment.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          activeSegment.kenBurns !== false
                            ? 'bg-orange-600 text-white'
                            : 'bg-white/10 text-white/50'
                        }`}
                      >
                        {activeSegment.kenBurns !== false ? 'فعال' : 'غیرفعال'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-white/40 text-center py-2 bg-black/20 rounded-xl border border-white/5">
                    هنوز تصویری برای این اسلاید انتخاب نشده است. از گالری مقابل یک تصویر را انتخاب کنید.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right (7 cols): Unsplash Stock Search & Gallery */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-md">
            {/* Gallery Tabs */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('unsplash')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'unsplash'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-white/60 hover:text-white bg-white/5'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>جستجوی استوک (Unsplash)</span>
                </button>

                <button
                  onClick={() => setActiveTab('custom')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'custom'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-white/60 hover:text-white bg-white/5'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>آپلود یا لینک مستقیم</span>
                </button>
              </div>

              {/* Source Tag */}
              {sourceName && (
                <span className="text-[11px] text-white/40 font-mono hidden sm:inline">
                  منبع: {sourceName}
                </span>
              )}
            </div>

            {activeTab === 'unsplash' && (
              <>
                {/* Search Bar & Aspect Selector */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="جستجوی موضوعی (مثال: هوش مصنوعی، بورس، کهکشان، طبیعت...)"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 pl-9 text-xs text-white placeholder-white/40 focus:border-orange-500 focus:outline-none"
                    />
                    <Search className="w-4 h-4 text-white/30 absolute left-3 top-2.5" />
                  </div>

                  {/* Orientation Switcher */}
                  <select
                    value={orientation}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setOrientation(val);
                      handleSearch();
                    }}
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="landscape">افقی (16:9)</option>
                    <option value="portrait">عمودی (9:16)</option>
                    <option value="squarish">مربع (1:1)</option>
                  </select>

                  <button
                    onClick={() => handleSearch()}
                    disabled={isSearching}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>جستجو</span>
                  </button>
                </div>

                {/* Popular Query Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none text-xs">
                  {POPULAR_TOPICS.map((topic, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSearchQuery(topic.label);
                        handleSearch(topic.query);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white/70 hover:text-white text-[11px] whitespace-nowrap transition-all active:scale-95"
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>

                {/* Image Results Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[540px] overflow-y-auto pr-1">
                  {searchResults.map((img) => {
                    const isCurrentlyActiveOnSegment = activeSegment?.backgroundImage === img.fullUrl;

                    return (
                      <div
                        key={img.id}
                        className="group relative rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-video flex flex-col justify-end transition-all hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-950/30"
                      >
                        <img
                          src={img.thumbUrl}
                          alt={img.alt}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Top Gradient & Badge */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

                        {/* Current Active Indicator */}
                        {isCurrentlyActiveOnSegment && (
                          <div className="absolute top-2 right-2 bg-orange-600 text-white p-1 rounded-full shadow-md">
                            <Check className="w-3 h-3" />
                          </div>
                        )}

                        {/* Actions Overlay */}
                        <div className="relative p-2.5 flex flex-col gap-1.5 z-10">
                          <p className="text-[11px] text-white/90 font-medium truncate drop-shadow">
                            {img.alt}
                          </p>
                          <span className="text-[9px] text-white/50 truncate">
                            📷 {img.author.name}
                          </span>

                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              onClick={() => activeSegmentId && handleApplyImageToSegment(activeSegmentId, img)}
                              disabled={!activeSegmentId}
                              className="flex-1 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-bold transition-all text-center shadow-sm"
                            >
                              اعمال روی اسلاید
                            </button>

                            <button
                              onClick={() => handleApplyImageToAllSegments(img)}
                              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 text-[10px] transition-all"
                              title="اعمال روی تمامی اسلایدهای پروژه"
                            >
                              همه
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Custom Upload or URL Tab */}
            {activeTab === 'custom' && (
              <div className="flex flex-col gap-4 py-2">
                {/* Upload Local File */}
                <div className="border-2 border-dashed border-white/15 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 bg-black/20 hover:bg-black/40 transition-colors cursor-pointer text-center relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="p-3 rounded-full bg-orange-600/20 text-orange-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">کلیک یا کشیدن فایل تصویر برای آپلود</p>
                    <p className="text-[11px] text-white/40 mt-0.5">پشتیبانی از JPG، PNG، WebP با کیفیت بالا</p>
                  </div>
                </div>

                {/* Direct Image URL */}
                <div className="bg-black/30 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                  <label className="text-xs text-white/70">آدرس مستقیم تصویر (Image URL):</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="url"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 pl-8 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                      />
                      <LinkIcon className="w-3.5 h-3.5 text-white/30 absolute left-2.5 top-2.5" />
                    </div>
                    <button
                      onClick={handleApplyCustomUrl}
                      disabled={!customUrl.trim() || !activeSegmentId}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all whitespace-nowrap"
                    >
                      اعمال روی اسلاید
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. API Key Config Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white">تنظیم کلید دسترسی Unsplash (اختیاری)</h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-white/40 hover:text-white text-xs"
              >
                بستن
              </button>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              سامانه به‌صورت پیش‌فرض دارای مخزن غنی و بدون محدودیت از تصاویر باکیفیت Unsplash است. در صورت تمایل به جستجوی نامحدود با کلید اختصاصی اکانت توسعه‌دهنده Unsplash خود، کلید Access Key را اینجا وارد کنید.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/80">Unsplash Access Key:</label>
              <input
                type="text"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="YOUR_UNSPLASH_ACCESS_KEY"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href="https://unsplash.com/developers"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-orange-400 hover:underline flex items-center gap-1"
              >
                <span>دریافت رایگان کلید از Unsplash</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all"
                >
                  ذخیره کلید
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
