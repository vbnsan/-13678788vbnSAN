import React, { useState } from 'react';
import {
  Star,
  Sliders,
  CheckCircle2,
  Plus,
  Download,
  Sparkles,
  Play,
  Github,
  Upload,
  BarChart3,
  Trash2,
  Eye,
  Check,
} from 'lucide-react';
import { MotionPlan, MotionSkill } from '../types/motion';
import { getAllSkills, saveCustomSkill, deleteCustomSkill, BUILT_IN_SKILLS } from '../engine/skills';
import { getLessons, getSkillStats, recordFeedback } from '../engine/learning';
import { SkillPreviewModal } from './SkillPreviewModal';
import { SkillImportModal } from './SkillImportModal';

interface Props {
  currentPlan?: MotionPlan | null;
  onSkillSelected?: (skill: MotionSkill) => void;
}

export const SkillManagerTab: React.FC<Props> = ({ currentPlan, onSkillSelected }) => {
  const [skills, setSkills] = useState<MotionSkill[]>(getAllSkills());
  const [selectedSkill, setSelectedSkill] = useState<MotionSkill>(skills[0]);

  // Modal states
  const [previewSkill, setPreviewSkill] = useState<MotionSkill | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [isEditingSkill, setIsEditingSkill] = useState<boolean>(false);
  const [editSkillState, setEditSkillState] = useState<MotionSkill>(skills[0]);

  // Feedback Form State
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [feedbackNote, setFeedbackNote] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [applySuccess, setApplySuccess] = useState<boolean>(false);

  const activeSkillStats = getSkillStats(selectedSkill.id);
  const allLessons = getLessons();
  const isCustomSkill = !BUILT_IN_SKILLS.some(b => b.id === selectedSkill.id);

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlan) return;

    recordFeedback(
      currentPlan.meta.skillId,
      ratingScore,
      currentPlan.meta.title,
      feedbackNote
    );

    setFeedbackSubmitted(true);
    setSkills(getAllSkills());
    setTimeout(() => {
      setFeedbackSubmitted(false);
      setFeedbackNote('');
    }, 3000);
  };

  const handleCreateNewSkill = () => {
    const newSkill: MotionSkill = {
      id: `skill-custom-${Date.now().toString().slice(-4)}`,
      title: 'اسکیل سفارشی من',
      version: 1,
      description: 'اسکیل اختصاصی ساخته شده با تنظیمات و فیزیک دلخواه.',
      extends: selectedSkill.id,
      theme: { ...selectedSkill.theme, accent: '#00f2a9' },
      style: { ...selectedSkill.style },
      rules: { ...selectedSkill.rules },
      titleCard: { ...selectedSkill.titleCard },
      outroCard: { ...selectedSkill.outroCard },
    };
    setEditSkillState(newSkill);
    setIsEditingSkill(true);
  };

  const handleSaveSkill = () => {
    saveCustomSkill(editSkillState);
    const updated = getAllSkills();
    setSkills(updated);
    setSelectedSkill(editSkillState);
    setIsEditingSkill(false);
  };

  const handleDeleteSkill = (skillId: string) => {
    if (confirm('آیا از حذف این اسکیل سفارشی اطمینان دارید؟')) {
      deleteCustomSkill(skillId);
      const updated = getAllSkills();
      setSkills(updated);
      setSelectedSkill(updated[0]);
    }
  };

  const downloadSkillJson = (skill: MotionSkill) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(skill, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${skill.id}.skill.json`;
    a.click();
  };

  const handleApplyToProject = (skillToApply: MotionSkill) => {
    if (onSkillSelected) {
      onSkillSelected(skillToApply);
      setApplySuccess(true);
      setTimeout(() => setApplySuccess(false), 2500);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Feedback & Training Unit */}
      {currentPlan && (
        <div className="bg-neutral-900/80 border border-orange-500/30 rounded-2xl p-4 md:p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-bold text-white">آموزش و بهبود کیفیت اسکیل جاری (Training & Feedback)</h3>
            </div>
            <span className="text-xs text-orange-300 font-medium">
              اسکیل فعال: {currentPlan.meta.skillTitle}
            </span>
          </div>

          <p className="text-xs text-white/60 mb-3">
            با امتیاز دادن به خروجی موشن، الگوریتم به طور خودکار پارامترهای ریتم، سرعت WPM و نرمی فنرها را بهینه‌سازی می‌کند.
          </p>

          {feedbackSubmitted ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>بازخورد شما با موفقیت ثبت شد و در مدل آموزشی اسکیل اعمال گردید!</span>
            </div>
          ) : (
            <form onSubmit={handleRatingSubmit} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/70 ml-2">کیفیت موشن را چطور دیدید؟</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingScore(star)}
                    className="p-1 text-white hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= ratingScore ? 'fill-orange-400 text-orange-400' : 'text-white/20'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  placeholder="نکته برای بهبود کیفیت (مثلاً: ریتم کلمات کمی تند بود، یا نمودارها بسیار روان بودند)..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
                >
                  ثبت بازخورد آموزشی
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Skill Library Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Column: Skill List (5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-2">
          {/* Header & Quick Action Buttons */}
          <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
            <span className="text-xs font-bold text-white">اسکیل‌های موجود ({skills.length})</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white/90 rounded-lg text-[11px] font-semibold transition-all border border-white/10 shadow-sm"
              >
                <Github className="w-3 h-3 text-orange-400" />
                <span>افزودن از گیت‌هاب / فایل</span>
              </button>

              <button
                onClick={handleCreateNewSkill}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-600/80 hover:bg-orange-600 text-white rounded-lg text-[11px] font-semibold transition-all shadow-sm"
              >
                <Plus className="w-3 h-3" />
                <span>اسکیل جدید</span>
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="flex flex-col gap-2 max-h-[640px] overflow-y-auto pr-1">
            {skills.map((s) => {
              const isSelected = s.id === selectedSkill.id;
              const stats = getSkillStats(s.id);
              const hasVisualWidgets = s.style.visualWidgets;

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedSkill(s);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-orange-950/25 border-orange-500/70 shadow-md ring-1 ring-orange-500/30'
                      : 'bg-neutral-900/50 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: s.theme.accent }}
                      />
                      {s.title}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Live preview button on card */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSkill(s);
                          setPreviewSkill(s);
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-orange-600 text-white text-[10px] font-medium transition-all"
                        title="پیش‌نمایش زنده حرکت متن و نمودارها"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>پیش‌نمایش</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed mb-2">
                    {s.description}
                  </p>

                  {/* Feature Tags (Badges) */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-white/40 pt-1.5 border-t border-white/5">
                    <span className="bg-white/5 px-1.5 py-0.5 rounded font-mono">
                      {s.style.captionMode}
                    </span>

                    {s.theme.effect && s.theme.effect !== 'none' && (
                      <span className="bg-orange-950/40 text-orange-300 border border-orange-500/30 px-1.5 py-0.5 rounded">
                        افکت {s.theme.effect}
                      </span>
                    )}

                    {hasVisualWidgets && (
                      <span className="bg-sky-950/40 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <BarChart3 className="w-2.5 h-2.5" />
                        <span>نمودار و دیتا</span>
                      </span>
                    )}

                    {stats.totalRatings > 0 && (
                      <span className="text-orange-400 font-semibold mr-auto">
                        ★ {stats.averageScore} ({stats.totalRatings})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Skill Details & Fast Preview (7 cols) */}
        <div className="md:col-span-7 bg-neutral-900/60 border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-md flex flex-col gap-4">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{selectedSkill.title}</h3>
                {isCustomSkill && (
                  <span className="text-[10px] bg-orange-600/20 text-orange-300 border border-orange-500/30 px-1.5 py-0.5 rounded">
                    اسکیل سفارشی / وارد شده
                  </span>
                )}
              </div>
              <p className="text-xs text-white/60 mt-0.5">{selectedSkill.description}</p>
            </div>

            {/* Top actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewSkill(selectedSkill)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>پیش‌نمایش زنده انیمیشن</span>
              </button>

              <button
                onClick={() => handleApplyToProject(selectedSkill)}
                disabled={applySuccess}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
              >
                {applySuccess ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{applySuccess ? 'اعمال شد!' : 'اعمال روی پروژه'}</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-black/30 border border-white/5 rounded-xl p-3">
              <div className="text-[11px] text-white/40">میانگین رضایت</div>
              <div className="text-lg font-bold text-orange-400 mt-1">
                {activeSkillStats.totalRatings > 0 ? `★ ${activeSkillStats.averageScore}` : '—'}
              </div>
            </div>

            <div className="bg-black/30 border border-white/5 rounded-xl p-3">
              <div className="text-[11px] text-white/40">تعداد ارزیابی‌ها</div>
              <div className="text-lg font-bold text-white mt-1">
                {activeSkillStats.totalRatings} <span className="text-xs text-white/50 font-normal">رأی</span>
              </div>
            </div>

            <div className="bg-black/30 border border-white/5 rounded-xl p-3">
              <div className="text-[11px] text-white/40">سرعت خوانش (WPM)</div>
              <div className="text-lg font-bold text-white mt-1 font-mono">
                {selectedSkill.rules.wpm} <span className="text-xs text-white/50 font-normal">WPM</span>
              </div>
            </div>

            <div className="bg-black/30 border border-white/5 rounded-xl p-3">
              <div className="text-[11px] text-white/40">افکت پس‌زمینه</div>
              <div className="text-sm font-bold text-white mt-1.5 truncate">
                {selectedSkill.theme.effect || 'استاندارد'}
              </div>
            </div>
          </div>

          {/* Detailed Skill Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2">
              <div className="font-semibold text-white/80">پالت رنگی و استایل:</div>
              <div className="flex items-center justify-between text-white/60">
                <span>رنگ پس‌زمینه (BG):</span>
                <span className="font-mono flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: selectedSkill.theme.bg }} />
                  {selectedSkill.theme.bg}
                </span>
              </div>
              <div className="flex items-center justify-between text-white/60">
                <span>رنگ متن (FG):</span>
                <span className="font-mono flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: selectedSkill.theme.fg }} />
                  {selectedSkill.theme.fg}
                </span>
              </div>
              <div className="flex items-center justify-between text-white/60">
                <span>رنگ تأکید (Accent):</span>
                <span className="font-mono flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: selectedSkill.theme.accent }} />
                  {selectedSkill.theme.accent}
                </span>
              </div>
              <div className="flex items-center justify-between text-white/60">
                <span>فونت نمایشی / بدنه:</span>
                <span className="text-white/80">{selectedSkill.theme.displayFont} / {selectedSkill.theme.bodyFont}</span>
              </div>
            </div>

            <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2">
              <div className="font-semibold text-white/80">قواعد و المان‌های موشن:</div>
              <div className="flex items-center justify-between text-white/60">
                <span>روش ترنزیشن کپشن:</span>
                <span className="font-mono text-orange-300">{selectedSkill.style.captionMode}</span>
              </div>
              <div className="flex items-center justify-between text-white/60">
                <span>نمودار و ویجت‌های آماری:</span>
                <span className="text-emerald-400 font-semibold">پشتیبانی کامل</span>
              </div>
              <div className="flex items-center justify-between text-white/60">
                <span>فیزیک فنر (Damp/Stiff):</span>
                <span className="font-mono">{selectedSkill.style.spring.damping} / {selectedSkill.style.spring.stiffness}</span>
              </div>
              <div className="flex items-center justify-between text-white/60">
                <span>طیف فرکانس صوتی:</span>
                <span>{selectedSkill.style.audioBars ? 'فعال' : 'غیرفعال'}</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadSkillJson(selectedSkill)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-xs border border-white/5"
                title="دانلود فایل اسکیل برای استفاده در PHP یا اشتراک‌گذاری"
              >
                <Download className="w-3.5 h-3.5" />
                <span>دانلود JSON اسکیل</span>
              </button>

              <button
                onClick={() => {
                  setEditSkillState({ ...selectedSkill });
                  setIsEditingSkill(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-xs border border-white/5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>ویرایش پارامترها</span>
              </button>

              {isCustomSkill && (
                <button
                  onClick={() => handleDeleteSkill(selectedSkill.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/40 text-red-300 text-xs border border-red-500/20"
                  title="حذف این اسکیل سفارشی"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              )}
            </div>
          </div>

          {/* Recent feedback history */}
          <div className="border-t border-white/5 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white/80">تاریخچه بازخوردهای ثبت‌شده برای این اسکیل</span>
              <span className="text-[11px] text-white/40 font-mono">
                {allLessons.filter(l => l.skillId === selectedSkill.id).length} ردیف
              </span>
            </div>

            <div className="flex flex-col gap-1.5 max-h-[130px] overflow-y-auto pr-1">
              {allLessons.filter(l => l.skillId === selectedSkill.id).length === 0 ? (
                <div className="text-center py-4 text-xs text-white/30">
                  هنوز بازخوردی برای این اسکیل ثبت نشده است. پس از اجرای موشن به آن امتیاز دهید تا کیفیت خودکار بهبود یابد.
                </div>
              ) : (
                allLessons
                  .filter(l => l.skillId === selectedSkill.id)
                  .map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-orange-400 font-bold">★ {l.score}</span>
                        <span className="text-white/80">{l.motionTitle}</span>
                        {l.feedbackNote && (
                          <span className="text-white/40 italic truncate max-w-[200px]">({l.feedbackNote})</span>
                        )}
                      </div>
                      <span className="text-[11px] text-white/30 font-mono" dir="ltr">
                        {new Date(l.timestamp).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Skill Modal */}
      {isEditingSkill && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 max-w-lg w-full flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-white">تنظیم و ذخیره اسکیل موشن</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-white/70 mb-1">نام اسکیل:</label>
                <input
                  type="text"
                  value={editSkillState.title}
                  onChange={(e) => setEditSkillState({ ...editSkillState, title: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-white/70 mb-1">رنگ پس‌زمینه:</label>
                  <input
                    type="color"
                    value={editSkillState.theme.bg}
                    onChange={(e) =>
                      setEditSkillState({
                        ...editSkillState,
                        theme: { ...editSkillState.theme, bg: e.target.value },
                      })
                    }
                    className="w-full h-8 rounded bg-transparent cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white/70 mb-1">رنگ متن:</label>
                  <input
                    type="color"
                    value={editSkillState.theme.fg}
                    onChange={(e) =>
                      setEditSkillState({
                        ...editSkillState,
                        theme: { ...editSkillState.theme, fg: e.target.value },
                      })
                    }
                    className="w-full h-8 rounded bg-transparent cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white/70 mb-1">رنگ تأکید:</label>
                  <input
                    type="color"
                    value={editSkillState.theme.accent}
                    onChange={(e) =>
                      setEditSkillState({
                        ...editSkillState,
                        theme: { ...editSkillState.theme, accent: e.target.value },
                      })
                    }
                    className="w-full h-8 rounded bg-transparent cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 mb-1">افکت پس‌زمینه بصری:</label>
                <select
                  value={editSkillState.theme.effect || 'none'}
                  onChange={(e) =>
                    setEditSkillState({
                      ...editSkillState,
                      theme: { ...editSkillState.theme, effect: e.target.value as any },
                    })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white"
                >
                  <option value="none">بدون افکت اضافی (ساده)</option>
                  <option value="plexus">شبکه ذرات متصل پلکسوس (Plexus Constellation)</option>
                  <option value="manim-grid">گرید بلوپرینت و موج ریاضی Manim</option>
                  <option value="grid">گرید سایبری متحرک (Cyber Grid)</option>
                  <option value="particles">ذرات معلق نوری (Particles / Bokeh)</option>
                  <option value="vignette">وینیت سینمایی (Vignette)</option>
                </select>
              </div>

              <div>
                <label className="block text-white/70 mb-1">حالت انیمیشن کپشن:</label>
                <select
                  value={editSkillState.style.captionMode}
                  onChange={(e) =>
                    setEditSkillState({
                      ...editSkillState,
                      style: { ...editSkillState.style, captionMode: e.target.value as any },
                    })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white"
                >
                  <option value="word-spring">فنر کلمه‌به‌کلمه (Word Spring)</option>
                  <option value="swipe-highlight">هایلایت کشویی وکس (VOX Highlight)</option>
                  <option value="word-pop">پرش پاپ (Word Pop)</option>
                  <option value="line-fade">محو ملایم خطی (Line Fade)</option>
                  <option value="kinetic-slide">اسلاید کینتیک ریلز (Kinetic Slide)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 mb-1">سرعت خوانش (WPM):</label>
                  <input
                    type="number"
                    value={editSkillState.rules.wpm}
                    onChange={(e) =>
                      setEditSkillState({
                        ...editSkillState,
                        rules: { ...editSkillState.rules, wpm: parseInt(e.target.value, 10) || 150 },
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/70 mb-1">اندازه پایه فونت (px):</label>
                  <input
                    type="number"
                    value={editSkillState.style.captionSize}
                    onChange={(e) =>
                      setEditSkillState({
                        ...editSkillState,
                        style: { ...editSkillState.style, captionSize: parseInt(e.target.value, 10) || 74 },
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsEditingSkill(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveSkill}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold"
              >
                ذخیره اسکیل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Interactive Skill Preview Modal */}
      {previewSkill && (
        <SkillPreviewModal
          skill={previewSkill}
          isOpen={Boolean(previewSkill)}
          onClose={() => setPreviewSkill(null)}
          onApplySkill={(s) => {
            handleApplyToProject(s);
          }}
        />
      )}

      {/* GitHub & File Import Modal */}
      <SkillImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSkillImported={(newSkill) => {
          setSkills(getAllSkills());
          setSelectedSkill(newSkill);
          setPreviewSkill(newSkill);
        }}
        onPreviewSkill={(skillToPreview) => {
          setSelectedSkill(skillToPreview);
          setPreviewSkill(skillToPreview);
        }}
      />
    </div>
  );
};
