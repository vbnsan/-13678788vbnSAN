import React, { useState } from 'react';
import { Plus, Trash2, Clock, Type, Tag, Code, Eye, Sparkles, Image as ImageIcon, Sliders } from 'lucide-react';
import { MotionPlan, MotionSegment, SegmentKind } from '../types/motion';

interface Props {
  plan: MotionPlan;
  onUpdatePlan: (plan: MotionPlan) => void;
  activeTime?: number;
  onOpenStockPicker?: (segmentId: string) => void;
}

export const PlanInspector: React.FC<Props> = ({ plan, onUpdatePlan, activeTime = 0, onOpenStockPicker }) => {
  const [showJson, setShowJson] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleUpdateSegment = (idx: number, updated: Partial<MotionSegment>) => {
    const newSegments = [...plan.segments];
    newSegments[idx] = { ...newSegments[idx], ...updated };
    onUpdatePlan({ ...plan, segments: newSegments });
  };

  const handleToggleWordEmphasis = (segIdx: number, wordIdx: number) => {
    const seg = plan.segments[segIdx];
    const currentEm = seg.em || [];
    const newEm = currentEm.includes(wordIdx)
      ? currentEm.filter(i => i !== wordIdx)
      : [...currentEm, wordIdx];

    handleUpdateSegment(segIdx, { em: newEm });
  };

  const handleRemoveSegment = (idx: number) => {
    const newSegments = plan.segments.filter((_, i) => i !== idx);
    onUpdatePlan({ ...plan, segments: newSegments });
  };

  const handleAddSegment = () => {
    const last = plan.segments[plan.segments.length - 1];
    const from = last ? last.to + 0.2 : 0;
    const to = from + 3.0;
    const newSeg: MotionSegment = {
      id: `seg-${Date.now()}`,
      from: Math.round(from * 10) / 10,
      to: Math.round(to * 10) / 10,
      text: 'سطر جدید برای موشن',
      kind: 'caption',
      em: [],
    };
    onUpdatePlan({ ...plan, segments: [...plan.segments, newSeg] });
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 bg-neutral-900/60 border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-orange-400" />
          <h2 className="text-sm font-bold text-white">بازبینی و ویرایش سگمنت‌های موشن (Plan Timeline)</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-xs transition-all border border-white/5"
          >
            {showJson ? <Eye className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
            <span>{showJson ? 'نمایش تایم‌لاین' : 'مشاهده JSON'}</span>
          </button>

          <button
            onClick={handleAddSegment}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600/80 hover:bg-orange-600 text-white text-xs font-semibold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن سطر</span>
          </button>
        </div>
      </div>

      {showJson ? (
        <div className="relative">
          <button
            onClick={copyJson}
            className="absolute top-3 left-3 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-md font-mono"
          >
            {copySuccess ? 'کپی شد!' : 'کپی JSON'}
          </button>
          <pre
            dir="ltr"
            className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[460px]"
          >
            {JSON.stringify(plan, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-1">
          {plan.segments.map((seg, idx) => {
            const isActive = activeTime >= seg.from && activeTime <= seg.to;
            const words = seg.text.split(' ');

            return (
              <div
                key={seg.id || idx}
                className={`p-3 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-orange-950/20 border-orange-500/50 shadow-md shadow-orange-950/30'
                    : 'bg-black/30 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-white/40">#{idx + 1}</span>

                    {/* Kind Selector */}
                    <select
                      value={seg.kind}
                      onChange={(e) => handleUpdateSegment(idx, { kind: e.target.value as SegmentKind })}
                      className="bg-neutral-800 text-[11px] text-white/90 border border-white/10 rounded-md px-2 py-1 outline-none cursor-pointer"
                    >
                      <option value="caption">کپشن معمولی (Caption)</option>
                      <option value="chart">نمودار میله‌ای متحرک (Bar Chart)</option>
                      <option value="gauge">گیج دایره‌ای درصد (Radial Gauge)</option>
                      <option value="stat">شاخص عددی و دلتا KPI</option>
                      <option value="comparison">مقایسه دوگانه قبل/بعد (Comparison)</option>
                      <option value="math">فرمول Manim و موج (Math Formula)</option>
                      <option value="lower-third">نوار لورثرد برودکست (Lower-Third)</option>
                      <option value="quote">جمله قصار و نقل‌قول (Quote)</option>
                      <option value="title">کارت تیتر (Title)</option>
                      <option value="outro">پایان‌بندی (Outro)</option>
                    </select>
                  </div>

                  {/* Timing Inputs */}
                  <div className="flex items-center gap-2 text-xs font-mono" dir="ltr">
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                      <Clock className="w-3 h-3 text-white/40" />
                      <input
                        type="number"
                        step="0.1"
                        value={seg.from}
                        onChange={(e) => handleUpdateSegment(idx, { from: parseFloat(e.target.value) || 0 })}
                        className="w-12 bg-transparent text-white text-xs outline-none text-center"
                      />
                      <span className="text-white/30">تا</span>
                      <input
                        type="number"
                        step="0.1"
                        value={seg.to}
                        onChange={(e) => handleUpdateSegment(idx, { to: parseFloat(e.target.value) || 0 })}
                        className="w-12 bg-transparent text-white text-xs outline-none text-center"
                      />
                      <span className="text-white/40 text-[10px]">ثانیه</span>
                    </div>

                    <button
                      onClick={() => handleRemoveSegment(idx)}
                      className="text-white/30 hover:text-red-400 p-1 transition-colors"
                      title="حذف سطر"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Text Field */}
                <input
                  type="text"
                  value={seg.text}
                  onChange={(e) => handleUpdateSegment(idx, { text: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none mb-2"
                />

                {/* Clickable Words for Emphasis Highlights */}
                <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-white/5">
                  <span className="text-[10px] text-white/40 ml-1">کلیک برای تأکید رنگی کلمه:</span>
                  {words.map((word, wIdx) => {
                    const isEm = (seg.em || []).includes(wIdx);
                    return (
                      <button
                        key={wIdx}
                        type="button"
                        onClick={() => handleToggleWordEmphasis(idx, wIdx)}
                        className={`text-xs px-2 py-0.5 rounded border transition-all ${
                          isEm
                            ? 'bg-orange-600/30 border-orange-500 text-orange-200 font-bold'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>

                {/* Background Image Preview & Stock Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-white/5 text-[11px]">
                  <div className="flex items-center gap-2">
                    {seg.backgroundImage ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={seg.backgroundImage}
                          alt="Slide BG"
                          className="w-9 h-6 rounded object-cover border border-white/10"
                        />
                        <span className="text-white/60 truncate max-w-[140px]">
                          {seg.imageCredit ? `📷 ${seg.imageCredit.author}` : 'تصویر فعال'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const copy = { ...seg };
                            delete copy.backgroundImage;
                            delete copy.imageCredit;
                            handleUpdateSegment(idx, copy);
                          }}
                          className="text-white/30 hover:text-red-400 text-[10px] transition-colors"
                          title="حذف تصویر پس‌زمینه"
                        >
                          حذف
                        </button>
                      </div>
                    ) : (
                      <span className="text-white/30 text-[11px]">بدون تصویر پس‌زمینه</span>
                    )}
                  </div>

                  {onOpenStockPicker && (
                    <button
                      type="button"
                      onClick={() => onOpenStockPicker(seg.id)}
                      className="px-2 py-1 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-300 text-[10px] font-semibold flex items-center gap-1 transition-all"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>{seg.backgroundImage ? 'تغییر تصویر (Unsplash)' : 'انتخاب تصویر استوک (Unsplash)'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
