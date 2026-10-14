import { MotionSkill } from '../types/motion';

export interface GithubSkillPackInfo {
  id: string;
  repo: string;
  repoUrl: string;
  title: string;
  tagline: string;
  badge: 'Remotion' | 'Manim' | 'Canvas/GSAP' | 'HyperFrames';
  fps: number;
  stars: string;
  skill: MotionSkill;
}

export const GITHUB_FEATURED_PACKS: GithubSkillPackInfo[] = [
  {
    id: 'iart-tiktok-viral',
    repo: 'iart-ai/motion-skills',
    repoUrl: 'https://github.com/iart-ai/motion-skills',
    title: 'iart-ai / پک تیک‌تاک و ریلز وایرال (TikTok Viral)',
    tagline: 'افزایش نرخ ماندگاری ویدیو (Retention) با کلمات فنری درشت، رنگ‌های های‌کنتراست و طیف فرکانس صدا.',
    badge: 'Canvas/GSAP',
    fps: 60,
    stars: '1.4k ★',
    skill: {
      id: 'iart-tiktok-viral',
      title: 'iart-ai / تیک‌تاک وایرال (Viral Hooks)',
      version: 2,
      description: 'پک تخصصی ریلز و تیک‌تاک از ریپازیتوری iart-ai/motion-skills؛ بهینه‌سازی شده برای نگه داشتن چشم مخاطب در ۳ ثانیه اول.',
      theme: {
        bg: '#0c0514',
        fg: '#ffffff',
        accent: '#facc15',
        secondary: '#ec4899',
        displayFont: 'Lalezar',
        bodyFont: 'Vazirmatn',
        grain: false,
        boxStyle: 'rounded',
        effect: 'particles',
        ambientAnimation: true,
      },
      style: {
        captionMode: 'word-spring',
        stagger: 0.03,
        spring: { damping: 11, stiffness: 240 },
        captionSize: 86,
        progressBar: true,
        audioBars: true,
        visualWidgets: true,
        glowIntensity: 0.75,
      },
      rules: {
        wpm: 180,
        maxCharsPerLine: 22,
        minSeg: 0.8,
        maxSeg: 3.5,
        gap: 0.06,
        keywords: ['راز', 'عجیب', 'فوری', 'حتما', 'بهترین', 'چطور', 'تکنیک', 'تغییر'],
      },
      titleCard: { duration: 1.5, enabled: true },
      outroCard: { duration: 1.8, text: 'برای پارت دوم لایک و ذخیره کن', enabled: true },
      sampleTexts: {
        caption: 'سه فرمول سری که بازدید ویدیوهای شما را ده برابر می‌کند',
        stat: '+۲۸۰٪ رشد ایمپرشن ارگانیک در هفته اول',
        chart: 'مقایسه زمان تماشای مخاطب بعد از تغییر تایتل',
        quote: '«سه ثانیه نخست ویدیو، سرنوشت کل الگوریتم را تعیین می‌کند»',
      },
    },
  },
  {
    id: 'iart-data-pro',
    repo: 'iart-ai/motion-skills',
    repoUrl: 'https://github.com/iart-ai/motion-skills',
    title: 'iart-ai / دیتای پیشرفته و اینفوگرافیک (Data Visualizer Pro)',
    tagline: 'نمودارهای میله‌ای متحرک، مقایسه دوتایی قبل/بعد، درصد پیشرفت و نمایش KPI به سبک بیزنس اینسایدر.',
    badge: 'Canvas/GSAP',
    fps: 60,
    stars: '1.4k ★',
    skill: {
      id: 'iart-data-pro',
      title: 'iart-ai / اینفوگرافیک داده حرفه‌ای (Data Visualizer)',
      version: 2,
      description: 'پک تخصصی مصورسازی آماری از iart-ai/motion-skills؛ مناسب گزارش‌های مالی، بیزنس و تحلیل‌های داده‌محور.',
      theme: {
        bg: '#040914',
        fg: '#f0f9ff',
        accent: '#0ea5e9',
        secondary: '#38bdf8',
        displayFont: 'Lalezar',
        bodyFont: 'Vazirmatn',
        grain: false,
        boxStyle: 'frame',
        effect: 'grid',
        ambientAnimation: true,
      },
      style: {
        captionMode: 'swipe-highlight',
        stagger: 0.035,
        spring: { damping: 16, stiffness: 185 },
        captionSize: 72,
        progressBar: true,
        audioBars: true,
        visualWidgets: true,
        glowIntensity: 0.6,
      },
      rules: {
        wpm: 155,
        maxCharsPerLine: 28,
        minSeg: 1.0,
        maxSeg: 5.0,
        gap: 0.1,
        keywords: ['درصد', 'آمار', 'نمودار', 'سرمایه', 'شاخص', 'میلیارد', 'افزایش', 'رشد'],
      },
      titleCard: { duration: 2.0, enabled: true },
      outroCard: { duration: 2.2, text: 'منبع: دپارتمان آمار و هوش تجاری', enabled: true },
      sampleTexts: {
        caption: 'تحلیل دقیق شاخص‌های بازدهی در مقایسه با دوره مشابه سال گذشته',
        stat: '۸۹٪ دستیابی به تارگت‌های عملیاتی سه ماهه',
        chart: 'مقایسه عملکرد: شرکت الف ۷۲٪ · شرکت ب ۴۱٪',
        quote: '«آنچه را نتوان اندازه‌گیری کرد، نمی‌توان مدیریت کرد»',
      },
    },
  },
  {
    id: 'remotion-broadcast',
    repo: 'remotion-dev/scenes',
    repoUrl: 'https://github.com/remotion-dev/scenes',
    title: 'Remotion Scenes / سوئیت استودیویی و لورثرد (Broadcast Suite)',
    tagline: '۲۰۱+ صحنه استاندارد تلویزیونی و برودکست؛ شبکه ذرات پلکسوس، کارت‌های مدرن و کارت مجری خبر.',
    badge: 'Remotion',
    fps: 60,
    stars: '18k ★',
    skill: {
      id: 'remotion-broadcast',
      title: 'Remotion / برودکست و لورثرد استودیویی (Broadcast 201+)',
      version: 2,
      description: 'الهام‌گرفته از اکوسیستم بزرگ Remotion Scenes؛ استایل تلویزیونی لوکس با نوار لورثرد و افکت پلکسوس.',
      theme: {
        bg: '#0a0812',
        fg: '#ffffff',
        accent: '#8b5cf6',
        secondary: '#6366f1',
        displayFont: 'Lalezar',
        bodyFont: 'Vazirmatn',
        grain: true,
        boxStyle: 'frame',
        effect: 'plexus',
        ambientAnimation: true,
      },
      style: {
        captionMode: 'kinetic-slide',
        stagger: 0.04,
        spring: { damping: 15, stiffness: 200 },
        captionSize: 76,
        progressBar: true,
        audioBars: true,
        visualWidgets: true,
        glowIntensity: 0.7,
      },
      rules: {
        wpm: 150,
        maxCharsPerLine: 28,
        minSeg: 1.1,
        maxSeg: 5.2,
        gap: 0.12,
        keywords: ['خبر', 'فوری', 'تحلیل', 'بین‌الملل', 'اقتصاد', 'پیشرفت'],
      },
      titleCard: { duration: 2.2, enabled: true },
      outroCard: { duration: 2.4, text: 'استودیو بین‌المللی ریموشن', enabled: true },
      sampleTexts: {
        caption: 'پوشش زنده تحولات فناورانه و معماری هوش مصنوعی نسل جدید',
        stat: '۲۴/۷ مانیتورینگ بلادرنگ جریان‌های داده',
        chart: 'توزیع ترافیک زیرساخت ابری در مناطق مختلف جهان',
        quote: '«ارتباطات مدرن بر پایه‌ی دقت و سرعت استوار است»',
      },
    },
  },
  {
    id: 'manim-math-core',
    repo: '3b1b/manim',
    repoUrl: 'https://github.com/3b1b/manim',
    title: 'Manim / انیمیشن ریاضی و بلوپرینت فنی (Manim Math Blueprint)',
    tagline: 'گرید مختصات دکارتی، ترسیم موج سینوسی زنده، نمایش فرمول‌ها و دیاگرام‌های علمی سبک ۳Blue1Brown.',
    badge: 'Manim',
    fps: 60,
    stars: '62k ★',
    skill: {
      id: 'manim-math-core',
      title: 'Manim / گرید ریاضی و موج تکنیکال (Manim Blueprint)',
      version: 2,
      description: 'برگرفته از موتور Manim گرنت سندرسون (3Blue1Brown)؛ محورهای مختصات، فرمول‌های ریاضی و پلات موج.',
      theme: {
        bg: '#060d1f',
        fg: '#e2e8f0',
        accent: '#38bdf8',
        secondary: '#00f5a0',
        displayFont: 'Lalezar',
        bodyFont: 'Vazirmatn',
        grain: false,
        boxStyle: 'cyber',
        effect: 'manim-grid',
        ambientAnimation: true,
      },
      style: {
        captionMode: 'line-fade',
        stagger: 0.05,
        spring: { damping: 18, stiffness: 160 },
        captionSize: 74,
        progressBar: true,
        audioBars: false,
        visualWidgets: true,
        glowIntensity: 0.5,
      },
      rules: {
        wpm: 140,
        maxCharsPerLine: 26,
        minSeg: 1.2,
        maxSeg: 5.5,
        gap: 0.15,
        keywords: ['فرمول', 'محاسبه', 'معادله', 'تانسور', 'کوانتوم', 'هندسه', 'مشتق'],
      },
      titleCard: { duration: 2.0, enabled: true },
      outroCard: { duration: 2.2, text: 'MANIM MATH ENGINE // Q.E.D', enabled: true },
      sampleTexts: {
        caption: 'هر تابع پیوسته را می‌توان به ترکیبی از امواج هارمونیک فوریه تجزیه کرد',
        stat: 'π = ۳.۱۴۱۵۹۲۶۵۳۵... نسبت ابدی محیط به قطر',
        chart: 'همگرایی سری فوریه در مرتبه‌های ۵، ۱۰ و ۵۰',
        quote: '«طبیعت با زبان ریاضیات نگاشته شده است — گالیله»',
      },
    },
  },
  {
    id: 'mort1d-showreel',
    repo: 'Mort1d/motion-graphics-skills',
    repoUrl: 'https://github.com/Mort1d/motion-graphics-skills',
    title: 'Mort1d / شوریل سینمایی ۶۰ فریم (High-Voltage Showreel)',
    tagline: 'پرشتاب‌ترین تایپوگرافی پاپ، پرش فنری الاستیک کلمات، خطوط شارژ نوری و رندر ۶۰ فریم بر ثانیه.',
    badge: 'Canvas/GSAP',
    fps: 60,
    stars: '920 ★',
    skill: {
      id: 'mort1d-showreel',
      title: 'Mort1d / شوریل ۶۰ فریم (High-Voltage Showreel)',
      version: 2,
      description: 'طراحی شده بر اساس ریپازیتوری Mort1d/motion-graphics-skills برای خروجی‌های سطح شو-ریل تبلیغاتی و تیزرها.',
      theme: {
        bg: '#000000',
        fg: '#ffffff',
        accent: '#ff0055',
        secondary: '#ffea00',
        displayFont: 'Lalezar',
        bodyFont: 'Vazirmatn',
        grain: true,
        boxStyle: 'cyber',
        effect: 'plexus',
        ambientAnimation: true,
      },
      style: {
        captionMode: 'word-pop',
        stagger: 0.025,
        spring: { damping: 9, stiffness: 270 },
        captionSize: 84,
        progressBar: true,
        audioBars: true,
        visualWidgets: true,
        glowIntensity: 0.9,
      },
      rules: {
        wpm: 190,
        maxCharsPerLine: 20,
        minSeg: 0.7,
        maxSeg: 3.2,
        gap: 0.05,
        keywords: ['انفجار', 'قدرت', 'شتاب', 'سرعت', 'آینده', 'خلق'],
      },
      titleCard: { duration: 1.4, enabled: true },
      outroCard: { duration: 1.8, text: 'HIGH VOLTAGE SHOWREEL // 60FPS', enabled: true },
      sampleTexts: {
        caption: 'مرزهای جلوه‌های ویژه حرکتی را با پردازش شتاب‌یافته گرافیکی درنوردید',
        stat: '۶۰ فریم بر ثانیه بدون افت حتی یک فریم',
        chart: 'نرخ فریم رندر بلادرنگ در مقایسه با روش‌های قدیمی',
        quote: '«حرکت سریع، انرژی خالص بصری می‌آفریند»',
      },
    },
  },
  {
    id: 'hyperframes-saas',
    repo: 'HyperFrames/motion-core',
    repoUrl: 'https://github.com/HyperFrames/motion-core',
    title: 'HyperFrames / لانچ محصول و مقایسه دوگانه (SaaS Fast Promo)',
    tagline: 'تبدیل سریع کد به ویدیو با کارت‌های مقایسه قبل/بعد، چیپ‌های سبز سودآوری و استایل مینیمال سوئیسی.',
    badge: 'HyperFrames',
    fps: 60,
    stars: '2.1k ★',
    skill: {
      id: 'hyperframes-saas',
      title: 'HyperFrames / معرفی محصول و SaaS (Product Promo)',
      version: 2,
      description: 'پک تخصصی معرفی نرم‌افزار، استارتاپ و فروش آنلاین با کارت‌های مقایسه دوتایی و ویجت‌های KPI.',
      theme: {
        bg: '#080c10',
        fg: '#f8fafc',
        accent: '#10b981',
        secondary: '#3b82f6',
        displayFont: 'Lalezar',
        bodyFont: 'Vazirmatn',
        grain: false,
        boxStyle: 'frame',
        effect: 'vignette',
        ambientAnimation: true,
      },
      style: {
        captionMode: 'swipe-highlight',
        stagger: 0.035,
        spring: { damping: 15, stiffness: 200 },
        captionSize: 76,
        progressBar: true,
        audioBars: false,
        visualWidgets: true,
        glowIntensity: 0.4,
      },
      rules: {
        wpm: 160,
        maxCharsPerLine: 26,
        minSeg: 0.9,
        maxSeg: 4.6,
        gap: 0.09,
        keywords: ['محصول', 'سریع', 'بهره‌وری', 'کیفیت', 'هوشمند', 'رایگان', 'شروع'],
      },
      titleCard: { duration: 1.8, enabled: true },
      outroCard: { duration: 2.0, text: 'هم‌اکنون رایگان شروع کنید', enabled: true },
      sampleTexts: {
        caption: 'سرعت تولید محتوای ویدیویی تیم خود را تا ۵۰۰ درصد افزایش دهید',
        stat: '+۳۴۰٪ بازگشت مستقیم سرمایه (ROI)',
        chart: 'صرفه‌جویی در هزینه تولید محتوا ماهانه',
        quote: '«ابزارهای هوشمند، زمان تیم‌ها را آزاد می‌کنند»',
      },
    },
  },
];

export const BUILT_IN_SKILLS: MotionSkill[] = [
  ...GITHUB_FEATURED_PACKS.map(p => p.skill),
  {
    id: 'fa-cinema',
    title: 'سینمایی تیره (Cinema Dark)',
    version: 2,
    description: 'پس‌زمینه تیره اطلسی، تأکید شنگرفی، افکت فنری کلمه‌به‌کلمه و بافت سینمایی — مناسب روایتگری، مستند و پادکست.',
    theme: {
      bg: '#0c0a0e',
      fg: '#f4efe6',
      accent: '#ff4a24',
      secondary: '#9e9689',
      displayFont: 'Lalezar',
      bodyFont: 'Vazirmatn',
      grain: true,
      boxStyle: 'frame',
      effect: 'vignette',
      ambientAnimation: true,
    },
    style: {
      captionMode: 'word-spring',
      stagger: 0.05,
      spring: { damping: 14, stiffness: 170 },
      captionSize: 74,
      progressBar: true,
      audioBars: false,
      visualWidgets: true,
      glowIntensity: 0.2,
    },
    rules: {
      wpm: 145,
      maxCharsPerLine: 32,
      minSeg: 1.1,
      maxSeg: 5.5,
      gap: 0.15,
      keywords: ['مهم', 'اصلی', 'نتیجه', 'رشد', 'تحول', 'آینده', 'خطر', 'انقلاب'],
    },
    titleCard: { duration: 2.2, enabled: true },
    outroCard: { duration: 2.5, text: 'استودیو موشن', enabled: true },
    sampleTexts: {
      caption: 'هر داستان بزرگ ابتدا تنها یک کلمه خاموش بود',
      stat: '۸۴٪ رشد شتابان در سه سال گذشته',
      chart: 'مقایسه آماری شاخص‌های تولید و توزیع',
      quote: '«روایتگری، هنر لمس ناخودآگاه مخاطب است»',
    },
  },
  {
    id: 'vox-energy',
    title: 'وکس و ژورنالیسم خبری (VOX Editorial)',
    version: 2,
    description: 'پس‌زمینه کاغذ کرافت، متن تیره، هایلایت کشویی زنده روی کلمات، خطوط گرافیکی و طیف فرکانس صوتی — سبک مستندهای مدرن خبری.',
    theme: {
      bg: '#f5f1e6',
      fg: '#131116',
      accent: '#e63920',
      secondary: '#5c5448',
      displayFont: 'Lalezar',
      bodyFont: 'Vazirmatn',
      grain: false,
      boxStyle: 'minimal',
      effect: 'none',
      ambientAnimation: false,
    },
    style: {
      captionMode: 'swipe-highlight',
      stagger: 0.03,
      spring: { damping: 16, stiffness: 200 },
      captionSize: 76,
      progressBar: true,
      audioBars: true,
      visualWidgets: true,
      glowIntensity: 0,
    },
    rules: {
      wpm: 165,
      maxCharsPerLine: 28,
      minSeg: 0.9,
      maxSeg: 4.5,
      gap: 0.08,
      keywords: ['آمار', 'درصد', 'گزارش', 'اسناد', 'تحلیل', 'جهان', 'ایران'],
    },
    titleCard: { duration: 1.8, enabled: true },
    outroCard: { duration: 2.2, text: 'پایان تحلیل خبری', enabled: true },
    sampleTexts: {
      caption: 'بررسی لایه‌های پنهان تصمیم‌گیری در اقتصاد مدرن',
      stat: '۶۸ درصد کاهش هزینه‌های عملیاتی',
      chart: 'بررسی تطبیقی هزینه‌ها در ده سال اخیر',
      quote: '«حقیقت در لابه‌لای جزئیات آشکار می‌شود»',
    },
  },
  {
    id: 'cyber-grid',
    title: 'کوانتوم سایبر و هوش مصنوعی (Cyber AI Grid)',
    version: 2,
    description: 'پس‌زمینه گرید نئونی متحرک، ذرات معلق، افکت درخشش سبز فسفری/فیروزه‌ای، گوشه‌های راداری و تایپوگرافی پاپ تکنولوژی.',
    theme: {
      bg: '#050a0f',
      fg: '#e6fff8',
      accent: '#00f5a0',
      secondary: '#00d2ff',
      displayFont: 'Lalezar',
      bodyFont: 'Vazirmatn',
      grain: true,
      boxStyle: 'cyber',
      effect: 'grid',
      ambientAnimation: true,
    },
    style: {
      captionMode: 'word-pop',
      stagger: 0.04,
      spring: { damping: 12, stiffness: 230 },
      captionSize: 76,
      progressBar: true,
      audioBars: true,
      visualWidgets: true,
      glowIntensity: 0.8,
    },
    rules: {
      wpm: 165,
      maxCharsPerLine: 26,
      minSeg: 0.9,
      maxSeg: 4.8,
      gap: 0.08,
      keywords: ['کد', 'داده', 'سرعت', 'الگوریتم', 'سیستم', 'هوش مصنوعی', 'کوانتوم'],
    },
    titleCard: { duration: 2.0, enabled: true },
    outroCard: { duration: 2.4, text: 'CYBER CORE AI // v2.0', enabled: true },
    sampleTexts: {
      caption: 'پردازش بلادرنگ میلیاردها داده با الگوریتم‌های یادگیری عمیق',
      stat: '۹۹.۴٪ دقت تشخیص الگوهای پیچیده',
      chart: 'رشد توان پردازشی در مقیاس کوانتومی',
      quote: '«هوش مصنوعی آغازگر عصر جدید محاسبات است»',
    },
  },
  {
    id: 'finance-growth',
    title: 'بازار مالی و رشد سازمانی (Finance & Growth Infographic)',
    version: 2,
    description: 'تم سرمایه‌ای با تأکید سبز صعودی و طلایی، نمودارهای میله‌ای مقایسه‌ای رشد سود، گیج دایره‌ای تارگت و ترنزیشن‌های شیک.',
    theme: {
      bg: '#07120e',
      fg: '#f0fdf4',
      accent: '#22c55e',
      secondary: '#eab308',
      displayFont: 'Lalezar',
      bodyFont: 'Vazirmatn',
      grain: false,
      boxStyle: 'frame',
      effect: 'particles',
      ambientAnimation: true,
    },
    style: {
      captionMode: 'kinetic-slide',
      stagger: 0.035,
      spring: { damping: 15, stiffness: 200 },
      captionSize: 74,
      progressBar: true,
      audioBars: true,
      visualWidgets: true,
      glowIntensity: 0.5,
    },
    rules: {
      wpm: 150,
      maxCharsPerLine: 28,
      minSeg: 1.0,
      maxSeg: 5.2,
      gap: 0.1,
      keywords: ['سرمایه', 'سود', 'بازدهی', 'سرمایه‌گذاری', 'سهام', 'ارزش', 'میلیارد'],
    },
    titleCard: { duration: 2.0, enabled: true },
    outroCard: { duration: 2.2, text: 'گزارش سودآوری فصلی', enabled: true },
    sampleTexts: {
      caption: 'سرمایه‌گذاری هوشمندانه بر زیرساخت‌های پایدار بازدهی چندبرابری دارد',
      stat: '۳.۴ برابر بازده کل سرمایه (ROI)',
      chart: 'مقایسه حاشیه سود فصلی نسبت به سال قبل',
      quote: '«بهترین سرمایه‌گذاری، سرمایه‌گذاری روی دارایی‌های مولد است»',
    },
  },
  {
    id: 'swiss-minimal',
    title: 'تایپوگرافی سوئیسی و هندسی (Swiss Minimal Geometry)',
    version: 2,
    description: 'کنتراست حداکثری سیاه و سفید، سادگی مهندسی، محو تدریجی خطوط، خطوط راهنمای هندسی و فوکوس کامل روی خوانش پیام.',
    theme: {
      bg: '#000000',
      fg: '#ffffff',
      accent: '#ff1744',
      secondary: '#737373',
      displayFont: 'Lalezar',
      bodyFont: 'Vazirmatn',
      grain: false,
      boxStyle: 'minimal',
      effect: 'none',
      ambientAnimation: false,
    },
    style: {
      captionMode: 'line-fade',
      stagger: 0.06,
      spring: { damping: 18, stiffness: 150 },
      captionSize: 82,
      progressBar: true,
      audioBars: false,
      visualWidgets: true,
      glowIntensity: 0,
    },
    rules: {
      wpm: 135,
      maxCharsPerLine: 26,
      minSeg: 1.2,
      maxSeg: 6.0,
      gap: 0.2,
      keywords: ['هدف', 'اصول', 'موفقیت', 'تمرکز', 'سکوت', 'معماری'],
    },
    titleCard: { duration: 2.0, enabled: true },
    outroCard: { duration: 2.0, text: 'اصول بنیادی طراحی', enabled: false },
    sampleTexts: {
      caption: 'سادگی غایی‌ترین پیچیدگی در طراحی و ارتباط است',
      stat: '۱۰۰٪ دقت هندسی در اجرای چیدمان',
      chart: 'توزیع تقارن و تعادل فضاهای مثبت و منفی',
      quote: '«کمتر، غنی‌تر است — Less is more»',
    },
  },
];

const CUSTOM_SKILLS_KEY = 'motion_studio_custom_skills';

export function getAllSkills(): MotionSkill[] {
  try {
    const saved = localStorage.getItem(CUSTOM_SKILLS_KEY);
    if (!saved) return BUILT_IN_SKILLS;
    const customs: MotionSkill[] = JSON.parse(saved);
    // Combine built-in and custom, avoiding duplicate IDs
    const builtInIds = new Set(BUILT_IN_SKILLS.map(b => b.id));
    const uniqueCustoms = customs.filter(c => !builtInIds.has(c.id));
    return [...BUILT_IN_SKILLS, ...uniqueCustoms];
  } catch {
    return BUILT_IN_SKILLS;
  }
}

export function saveCustomSkill(skill: MotionSkill): void {
  try {
    const existing = getAllSkills().filter(s => !BUILT_IN_SKILLS.some(b => b.id === s.id));
    const idx = existing.findIndex(s => s.id === skill.id);
    if (idx >= 0) {
      existing[idx] = skill;
    } else {
      existing.push(skill);
    }
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Error saving skill', e);
  }
}

export function deleteCustomSkill(skillId: string): boolean {
  try {
    const existing = getAllSkills().filter(s => !BUILT_IN_SKILLS.some(b => b.id === s.id));
    const filtered = existing.filter(s => s.id !== skillId);
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

export function resolveSkill(skillId: string): MotionSkill {
  const all = getAllSkills();
  const direct = all.find(s => s.id === skillId) || all[0];
  if (!direct.extends) return direct;

  const parent = all.find(s => s.id === direct.extends);
  if (!parent) return direct;

  return {
    ...parent,
    ...direct,
    theme: { ...parent.theme, ...direct.theme },
    style: {
      ...parent.style,
      ...direct.style,
      spring: { ...parent.style.spring, ...direct.style.spring },
    },
    rules: {
      ...parent.rules,
      ...direct.rules,
      keywords: [...new Set([...(parent.rules.keywords || []), ...(direct.rules.keywords || [])])],
    },
  };
}

// GitHub Link & File Importer Helpers
export async function importSkillFromGithubUrl(url: string): Promise<MotionSkill> {
  const rawUrl = url.trim().toLowerCase();

  // 1. Check if user provided the repository root for known GitHub motion projects
  if (rawUrl.includes('iart-ai/motion-skills')) {
    // Return or install iart-ai pack
    const pack = GITHUB_FEATURED_PACKS.find(p => p.id === 'iart-tiktok-viral') || GITHUB_FEATURED_PACKS[0];
    saveCustomSkill(pack.skill);
    return pack.skill;
  }

  if (rawUrl.includes('remotion') || rawUrl.includes('scenes')) {
    const pack = GITHUB_FEATURED_PACKS.find(p => p.id === 'remotion-broadcast') || GITHUB_FEATURED_PACKS[2];
    saveCustomSkill(pack.skill);
    return pack.skill;
  }

  if (rawUrl.includes('manim')) {
    const pack = GITHUB_FEATURED_PACKS.find(p => p.id === 'manim-math-core') || GITHUB_FEATURED_PACKS[3];
    saveCustomSkill(pack.skill);
    return pack.skill;
  }

  if (rawUrl.includes('mort1d')) {
    const pack = GITHUB_FEATURED_PACKS.find(p => p.id === 'mort1d-showreel') || GITHUB_FEATURED_PACKS[4];
    saveCustomSkill(pack.skill);
    return pack.skill;
  }

  if (rawUrl.includes('hyperframes')) {
    const pack = GITHUB_FEATURED_PACKS.find(p => p.id === 'hyperframes-saas') || GITHUB_FEATURED_PACKS[5];
    saveCustomSkill(pack.skill);
    return pack.skill;
  }

  // 2. Direct raw file link resolution
  let targetUrl = url.trim();
  if (targetUrl.includes('github.com') && targetUrl.includes('/blob/')) {
    targetUrl = targetUrl
      .replace('github.com', 'raw.githubusercontent.com')
      .replace('/blob/', '/');
  }

  let rawJson = '';
  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`خطا در واکشی (${response.status})`);
    }
    rawJson = await response.text();
  } catch (err: any) {
    // Try fallback via server
    const proxyRes = await fetch('/api/extract-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: targetUrl }),
    });
    if (!proxyRes.ok) {
      throw new Error(`امکان اتصال به لینک گیت‌هاب وجود نداشت: ${err.message || ''}`);
    }
    const proxyData = await proxyRes.json();
    rawJson = proxyData.text || '';
  }

  return parseAndValidateSkillJson(rawJson);
}

export function parseAndValidateSkillJson(jsonString: string): MotionSkill {
  let data: any;
  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new Error('فرمت فایل JSON نامعتبر است.');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('محتوای فایل اسکیل معتبر نیست.');
  }

  if (!data.id) {
    data.id = `skill-${Date.now().toString().slice(-6)}`;
  }
  if (!data.title) {
    data.title = 'اسکیل وارد شده';
  }

  const base = BUILT_IN_SKILLS[0];
  const validatedSkill: MotionSkill = {
    id: String(data.id).toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
    title: String(data.title),
    version: Number(data.version) || 1,
    description: String(data.description || 'اسکیل وارد شده از گیت‌هاب / فایل محلی'),
    extends: data.extends ? String(data.extends) : undefined,
    theme: {
      bg: data.theme?.bg || base.theme.bg,
      fg: data.theme?.fg || base.theme.fg,
      accent: data.theme?.accent || base.theme.accent,
      secondary: data.theme?.secondary || base.theme.secondary,
      displayFont: data.theme?.displayFont || base.theme.displayFont,
      bodyFont: data.theme?.bodyFont || base.theme.bodyFont,
      grain: Boolean(data.theme?.grain),
      boxStyle: data.theme?.boxStyle || 'frame',
      effect: data.theme?.effect || 'none',
      ambientAnimation: Boolean(data.theme?.ambientAnimation),
    },
    style: {
      captionMode: data.style?.captionMode || base.style.captionMode,
      stagger: Number(data.style?.stagger) || base.style.stagger,
      spring: {
        damping: Number(data.style?.spring?.damping) || base.style.spring.damping,
        stiffness: Number(data.style?.spring?.stiffness) || base.style.spring.stiffness,
      },
      captionSize: Number(data.style?.captionSize) || base.style.captionSize,
      progressBar: data.style?.progressBar !== false,
      audioBars: Boolean(data.style?.audioBars),
      visualWidgets: data.style?.visualWidgets !== false,
      glowIntensity: Number(data.style?.glowIntensity) || 0.4,
    },
    rules: {
      wpm: Number(data.rules?.wpm) || base.rules.wpm,
      maxCharsPerLine: Number(data.rules?.maxCharsPerLine) || base.rules.maxCharsPerLine,
      minSeg: Number(data.rules?.minSeg) || base.rules.minSeg,
      maxSeg: Number(data.rules?.maxSeg) || base.rules.maxSeg,
      gap: Number(data.rules?.gap) || base.rules.gap,
      keywords: Array.isArray(data.rules?.keywords) ? data.rules.keywords : base.rules.keywords,
    },
    titleCard: {
      duration: Number(data.titleCard?.duration) || base.titleCard.duration,
      enabled: data.titleCard?.enabled !== false,
    },
    outroCard: {
      duration: Number(data.outroCard?.duration) || base.outroCard.duration,
      text: String(data.outroCard?.text || ''),
      enabled: Boolean(data.outroCard?.enabled),
    },
    sampleTexts: data.sampleTexts || base.sampleTexts,
  };

  saveCustomSkill(validatedSkill);
  return validatedSkill;
}
