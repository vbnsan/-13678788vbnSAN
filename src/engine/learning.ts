import { MotionSkill, SkillLesson } from '../types/motion';
import { getAllSkills, saveCustomSkill } from './skills';

const LESSONS_STORAGE_KEY = 'motion_studio_lessons';

export function getLessons(): SkillLesson[] {
  try {
    const raw = localStorage.getItem(LESSONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordFeedback(
  skillId: string,
  score: number,
  motionTitle: string,
  feedbackNote?: string
): SkillLesson {
  const lesson: SkillLesson = {
    id: `lesson-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    skillId,
    score: Math.min(5, Math.max(1, score)),
    feedbackNote: feedbackNote?.trim() || '',
    motionTitle: motionTitle || 'بدون عنوان',
    timestamp: Date.now(),
  };

  const all = getLessons();
  all.unshift(lesson);
  try {
    localStorage.setItem(LESSONS_STORAGE_KEY, JSON.stringify(all.slice(0, 200)));
  } catch (e) {
    console.error('Failed to store lesson', e);
  }

  // Auto-tune skill parameters if enough feedback accumulated
  maybeAutoTuneSkill(skillId, all);

  return lesson;
}

export interface SkillStats {
  skillId: string;
  totalRatings: number;
  averageScore: number;
  positiveCount: number;
  negativeCount: number;
  lastTrainedAt?: number;
}

export function getSkillStats(skillId: string): SkillStats {
  const lessons = getLessons().filter(l => l.skillId === skillId);
  if (lessons.length === 0) {
    return {
      skillId,
      totalRatings: 0,
      averageScore: 0,
      positiveCount: 0,
      negativeCount: 0,
    };
  }

  const sum = lessons.reduce((acc, l) => acc + l.score, 0);
  const positiveCount = lessons.filter(l => l.score >= 4).length;
  const negativeCount = lessons.filter(l => l.score <= 2).length;

  return {
    skillId,
    totalRatings: lessons.length,
    averageScore: Math.round((sum / lessons.length) * 10) / 10,
    positiveCount,
    negativeCount,
    lastTrainedAt: lessons[0]?.timestamp,
  };
}

function maybeAutoTuneSkill(skillId: string, allLessons: SkillLesson[]): void {
  const skillLessons = allLessons.filter(l => l.skillId === skillId);
  if (skillLessons.length < 3) return; // Need at least 3 ratings to auto-tune

  const recent = skillLessons.slice(0, 10);
  const avg = recent.reduce((sum, l) => sum + l.score, 0) / recent.length;

  const allSkills = getAllSkills();
  const target = allSkills.find(s => s.id === skillId);
  if (!target) return;

  let tuned = false;
  const newRules = { ...target.rules };
  const newStyle = { ...target.style };

  // If score is low (< 3.0), users find it hard to read:
  if (avg < 3.0) {
    // 1. Slow down words per minute by 8%
    newRules.wpm = Math.max(120, Math.round(newRules.wpm * 0.92));
    // 2. Shorten line length for higher legibility
    newRules.maxCharsPerLine = Math.max(20, newRules.maxCharsPerLine - 2);
    // 3. Relax spring stiffness
    newStyle.spring = {
      damping: Math.max(12, newStyle.spring.damping + 1),
      stiffness: Math.max(140, newStyle.spring.stiffness - 15),
    };
    tuned = true;
  } else if (avg >= 4.5 && skillLessons.length >= 5) {
    // Highly rated: refine spacing and responsiveness
    newRules.gap = Math.max(0.08, newRules.gap * 0.95);
    tuned = true;
  }

  if (tuned) {
    const updatedSkill: MotionSkill = {
      ...target,
      rules: newRules,
      style: newStyle,
      version: (target.version || 1) + 1,
    };
    saveCustomSkill(updatedSkill);
  }
}
