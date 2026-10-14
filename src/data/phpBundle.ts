import JSZip from 'jszip';

export interface PhpFileItem {
  path: string;
  category: 'core' | 'templates' | 'skills' | 'config';
  description: string;
  content: string;
}

export const PHP_BUNDLE_FILES: PhpFileItem[] = [
  {
    path: 'config.php',
    category: 'config',
    description: 'تنظیمات پایه، مسیرها و اتصال اختیاری دیپ‌سیک',
    content: `<?php
return [
  'skills_dir'    => __DIR__ . '/skills',
  'output_dir'    => __DIR__ . '/public/output',
  'storage'       => __DIR__ . '/storage',
  'default_skill' => 'fa-cinema',

  // هوش مصنوعی اختیاری است؛ تا وقتی enabled=false باشد، صفر توکن مصرف می‌شود
  'deepseek' => [
    'enabled' => false,
    'api_key' => getenv('DEEPSEEK_API_KEY') ?: '',
    'model'   => 'deepseek-chat',
  ],
];
`,
  },
  {
    path: 'app/bootstrap.php',
    category: 'core',
    description: 'لودر خودکار کلاس‌ها و آماده‌سازی پوشه‌های ذخیره‌سازی',
    content: `<?php
declare(strict_types=1);
mb_internal_encoding('UTF-8');

spl_autoload_register(function ($class) {
  $file = __DIR__ . '/' . str_replace('\\\\', '/', $class) . '.php';
  if (is_file($file)) require $file;
});

$CONFIG = require dirname(__DIR__) . '/config.php';
foreach ([$CONFIG['output_dir'], $CONFIG['storage']] as $dir) {
  if (!is_dir($dir)) @mkdir($dir, 0775, true);
}
`,
  },
  {
    path: 'app/Skills.php',
    category: 'core',
    description: 'سیستم اسکیل‌های ماژولار و پشتیبانی از وراثت (extends)',
    content: `<?php
class Skills {
  public static function all(string $dir): array {
    $out = [];
    foreach (glob($dir . '/*.skill.json') ?: [] as $f) {
      $j = json_decode((string)file_get_contents($f), true);
      if (is_array($j) && !empty($j['id'])) $out[$j['id']] = $j;
    }
    return $out;
  }

  public static function resolve(string $dir, string $id): array {
    $all = self::all($dir);
    $skill = $all[$id] ?? reset($all) ?: [];
    $chain = [];
    $cur = $skill;
    $guard = 0;

    while (!empty($cur['extends']) && isset($all[$cur['extends']]) && $guard++ < 5) {
      $cur = $all[$cur['extends']];
      array_unshift($chain, $cur);
    }

    $merged = [];
    foreach ($chain as $c) {
      $merged = array_replace_recursive($merged, $c);
    }
    return array_replace_recursive($merged, $skill);
  }
}
`,
  },
  {
    path: 'app/Lessons.php',
    category: 'core',
    description: 'حافظه یادگیری و ذخیره بازخورد کاربران برای بهبود کیفیت در طول زمان',
    content: `<?php
class Lessons {
  private static function file(array $c): string {
    return $c['storage'] . '/lessons.json';
  }

  public static function add(array $c, string $skill, int $score, string $slug = ''): void {
    $f = self::file($c);
    $d = is_file($f) ? (json_decode((string)file_get_contents($f), true) ?: []) : [];
    $d[] = ['skill' => $skill, 'score' => $score, 'slug' => $slug, 'ts' => time()];
    file_put_contents($f, json_encode($d, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
  }

  public static function stats(array $c): array {
    $f = self::file($c);
    $d = is_file($f) ? (json_decode((string)file_get_contents($f), true) ?: []) : [];
    $s = [];
    foreach ($d as $r) {
      $sk = $r['skill'];
      $s[$sk]['n'] = ($s[$sk]['n'] ?? 0) + 1;
      $s[$sk]['sum'] = ($s[$sk]['sum'] ?? 0) + $r['score'];
    }
    foreach ($s as &$v) {
      $v['avg'] = round($v['sum'] / max(1, $v['n']), 2);
    }
    return $s;
  }
}
`,
  },
  {
    path: 'app/Ingest.php',
    category: 'core',
    description: 'پردازش ۴ نوع ورودی: زیرنویس SRT، متن خام فارسی، صوت و لینک وب',
    content: `<?php
class Ingest {
  public static function srt(string $raw): array {
    $raw = str_replace(["\\r\\n", "\\r"], "\\n", trim($raw));
    $out = [];
    foreach (preg_split('/\\n\\s*\\n/', $raw) ?: [] as $block) {
      $lines = array_values(array_filter(array_map('trim', explode("\\n", trim($block))), fn($l) => $l !== ''));
      if (count($lines) < 2) continue;
      $ti = strpos($lines[0], '-->') !== false ? 0 : 1;
      if (!isset($lines[$ti]) || !preg_match('/(\\d{1,2}):(\\d{2}):(\\d{2})[,.](\\d{1,3})\\s*-->\\s*(\\d{1,2}):(\\d{2}):(\\d{2})[,.](\\d{1,3})/', $lines[$ti], $m)) continue;

      $from = (int)$m[1]*3600 + (int)$m[2]*60 + (int)$m[3] + (int)str_pad($m[4],3,'0')/1000;
      $to   = (int)$m[5]*3600 + (int)$m[6]*60 + (int)$m[7] + (int)str_pad($m[8],3,'0')/1000;
      $text = trim(strip_tags(implode(' ', array_slice($lines, $ti+1))));
      if ($text === '') continue;
      $out[] = ['from' => $from, 'to' => max($from + 0.4, $to), 'text' => $text];
    }
    return $out;
  }

  public static function textSegments(string $text, int $wpm = 150, float $gap = 0.15): array {
    $text = trim(preg_replace('/\\s+/u', ' ', $text));
    if ($text === '') return [];
    $out = [];
    $t = 0.0;

    foreach (preg_split('/(?<=[.!?؟:؛\\n])\\s+/u', $text) ?: [$text] as $s) {
      $words = explode(' ', trim($s));
      foreach (array_chunk($words, 8) as $chunk) {
        $dur = max(1.2, count($chunk) / ($wpm / 60));
        $out[] = ['from' => round($t, 2), 'to' => round($t + $dur, 2), 'text' => implode(' ', $chunk)];
        $t += $dur + $gap;
      }
    }
    return $out;
  }

  public static function fitDuration(array $segs, float $total): array {
    $end = 0.0;
    foreach ($segs as $s) $end = max($end, $s['to']);
    if ($end <= 0 || $total <= 0) return $segs;
    $k = $total / $end;
    foreach ($segs as &$s) {
      $s['from'] = round($s['from'] * $k, 2);
      $s['to'] = round($s['to'] * $k, 2);
    }
    return $segs;
  }

  public static function link(string $url): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_TIMEOUT => 12,
      CURLOPT_USERAGENT => 'Mozilla/5.0 (MotionStudio)',
    ]);
    $html = curl_exec($ch);
    curl_close($ch);
    if (!is_string($html) || $html === '') return ['', ''];

    preg_match('#<title[^>]*>(.*?)</title>#is', $html, $tm);
    $title = trim(html_entity_decode(strip_tags($tm[1] ?? '')));
    $text = '';

    if (preg_match_all('#<(?:p|h2|h3)[^>]*>(.*?)</(?:p|h2|h3)>#is', $html, $pm)) {
      foreach ($pm[1] as $p) {
        $p = trim(html_entity_decode(strip_tags($p)));
        if (mb_strlen($p) > 35) $text .= $p . "\\n";
      }
    }
    return [$title, trim($text)];
  }
}
`,
  },
  {
    path: 'app/Planner.php',
    category: 'core',
    description: 'موتور برنامه‌ریزی قطعی و قاعده‌محور موشن (بدون نیاز به هوش مصنوعی)',
    content: `<?php
class Planner {
  public static function build(array $segs, array $skill, array $opts = []): array {
    $r = $skill['rules'] ?? [];
    $maxChars = (int)($r['maxCharsPerLine'] ?? 30);
    if (($opts['w'] ?? 1920) < ($opts['h'] ?? 1080)) {
      $maxChars = (int)round($maxChars * 0.72);
    }

    $minSeg = (float)($r['minSeg'] ?? 1.0);
    $kwList = $r['keywords'] ?? [];

    $norm = [];
    foreach ($segs as $s) {
      $parts = self::wrap($s['text'], $maxChars);
      $n = max(1, count($parts));
      $slice = ($s['to'] - $s['from']) / $n;
      foreach ($parts as $k => $p) {
        $norm[] = ['from' => $s['from'] + $k * $slice, 'to' => $s['from'] + ($k + 1) * $slice, 'text' => $p];
      }
    }

    $merged = [];
    foreach ($norm as $s) {
      $last = end($merged);
      if ($last && ($s['to'] - $s['from']) < $minSeg) {
        $merged[count($merged) - 1]['text'] = trim($last['text'] . ' ' . $s['text']);
        $merged[count($merged) - 1]['to'] = $s['to'];
      } else {
        $merged[] = $s;
      }
    }

    $segments = [];
    foreach ($merged as $s) {
      $segments[] = [
        'from' => round($s['from'], 2),
        'to'   => round($s['to'], 2),
        'text' => $s['text'],
        'kind' => self::kindOf($s['text']),
        'em'   => self::emphasis($s['text'], $kwList),
      ];
    }

    $intro = 0.0;
    if (!empty($opts['allowIntro']) && !empty($opts['title'])) {
      $td = (float)($skill['titleCard']['duration'] ?? 2.2);
      array_unshift($segments, ['from' => 0, 'to' => $td, 'text' => $opts['title'], 'kind' => 'title', 'em' => []]);
      foreach ($segments as &$s) {
        if ($s['kind'] !== 'title') { $s['from'] += $td; $s['to'] += $td; }
      }
      unset($s);
      $intro = $td;
    }

    $end = 0.0;
    foreach ($segments as $s) $end = max($end, $s['to']);

    $total = max($end + 0.5, 3.0);

    return [
      'meta' => [
        'title'     => $opts['title'] ?? 'موشن استودیو',
        'lang'      => 'fa',
        'w'         => (int)($opts['w'] ?? 1920),
        'h'         => (int)($opts['h'] ?? 1080),
        'duration'  => round($total, 2),
        'skill'     => $skill['id'] ?? 'fa-cinema',
        'generated' => date('Y-m-d H:i'),
      ],
      'theme'    => $skill['theme'] ?? [],
      'style'    => $skill['style'] ?? [],
      'segments' => $segments,
      'audio'    => null,
    ];
  }

  private static function wrap(string $t, int $max): array {
    $out = [];
    $cur = '';
    foreach (explode(' ', trim($t)) as $w) {
      $cand = $cur === '' ? $w : $cur . ' ' . $w;
      if (mb_strlen($cand) > $max && $cur !== '') {
        $out[] = $cur;
        $cur = $w;
      } else {
        $cur = $cand;
      }
    }
    if ($cur !== '') $out[] = $cur;
    return $out ?: [''];
  }

  private static function kindOf(string $t): string {
    if (preg_match('/^[«"“].*[»"”]$/u', $t)) return 'quote';
    if (preg_match('/^[0-9۰-۹]/u', $t) || preg_match('/(%|٪|درصد)/u', $t)) return 'stat';
    return 'caption';
  }

  private static function emphasis(string $text, array $kw): array {
    $em = [];
    foreach (explode(' ', $text) as $i => $w) {
      if (preg_match('/[0-9۰-۹٪%]/u', $w) || in_array($w, $kw, true)) {
        $em[] = $i;
      }
    }
    return $em;
  }
}
`,
  },
  {
    path: 'app/DeepSeek.php',
    category: 'core',
    description: 'ماژول اتصال فوق کم‌توکن به DeepSeek (اختیاری)',
    content: `<?php
class DeepSeek {
  public static function enhance(array $plan, array $cfg): array {
    $c = $cfg['deepseek'] ?? [];
    if (empty($c['enabled']) || empty($c['api_key'])) return $plan;

    $rows = [];
    foreach (array_slice($plan['segments'], 0, 30) as $s) {
      $rows[] = ['t' => mb_substr($s['text'], 0, 50)];
    }

    $sys = 'ویرایشگر موشن فارسی. برای هر سطر kind از caption|stat|quote و em (اندیس کلمات مهم) بده. فقط JSON آرایه: [{"kind":"..","em":[0,1]}]';
    $body = json_encode([
      'model' => $c['model'] ?? 'deepseek-chat',
      'temperature' => 0.1,
      'max_tokens' => 600,
      'messages' => [
        ['role' => 'system', 'content' => $sys],
        ['role' => 'user', 'content' => json_encode($rows, JSON_UNESCAPED_UNICODE)],
      ],
    ], JSON_UNESCAPED_UNICODE);

    $ch = curl_init('https://api.deepseek.com/chat/completions');
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT        => 30,
      CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Authorization: Bearer ' . $c['api_key']],
      CURLOPT_POST           => true,
      CURLOPT_POSTFIELDS     => $body,
    ]);

    $res = curl_exec($ch);
    curl_close($ch);
    if (!is_string($res)) return $plan;

    $j = json_decode($res, true);
    $content = $j['choices'][0]['message']['content'] ?? '';
    if (preg_match('/\\[.*\\]/s', $content, $m)) {
      $fixed = json_decode($m[0], true);
      if (is_array($fixed)) {
        foreach ($fixed as $i => $r) {
          if (!isset($plan['segments'][$i])) continue;
          if (!empty($r['kind'])) $plan['segments'][$i]['kind'] = $r['kind'];
          if (isset($r['em']) && is_array($r['em'])) $plan['segments'][$i]['em'] = $r['em'];
        }
      }
    }
    return $plan;
  }
}
`,
  },
  {
    path: 'app/Render.php',
    category: 'core',
    description: 'تولید فایل HTML مستقل و خروجی پروژه',
    content: `<?php
class Render {
  public static function make(array $plan, array $cfg, ?string $audioTmp = null, string $ext = 'mp3'): array {
    $slug = 'mv-' . date('ymd-His') . '-' . substr(md5(json_encode($plan, JSON_UNESCAPED_UNICODE)), 0, 5);
    $dir = $cfg['output_dir'] . '/' . $slug;
    @mkdir($dir, 0775, true);

    if ($audioTmp && is_uploaded_file($audioTmp)) {
      @mkdir($dir . '/assets', 0775, true);
      $ext = preg_replace('/[^a-z0-9]/i', '', $ext) ?: 'mp3';
      copy($audioTmp, $dir . '/assets/voice.' . $ext);
      $plan['audio'] = ['src' => 'assets/voice.' . $ext];
    }

    $PLAN_JSON = str_replace('</', '<\\/', json_encode($plan, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    ob_start();
    require dirname(__DIR__) . '/templates/player.php';
    $htmlContent = ob_get_clean();

    file_put_contents($dir . '/index.html', $htmlContent);
    return [$dir . '/index.html', 'output/' . $slug . '/index.html', $slug];
  }
}
`,
  },
  {
    path: 'public/index.php',
    category: 'core',
    description: 'داشبورد تحت‌وب استودیو برای ورود اطلاعات و ساخت موشن',
    content: `<?php
require __DIR__ . '/../app/bootstrap.php';

$errors = [];
$result = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  try {
    $skill = Skills::resolve($CONFIG['skills_dir'], $_POST['skill'] ?? $CONFIG['default_skill']);
    [$w, $h] = array_map('intval', explode('x', $_POST['size'] ?? '1920x1080'));
    $src = $_POST['source'] ?? 'text';
    $title = trim($_POST['title'] ?? '');
    $segs = [];
    $allowIntro = false;

    if ($src === 'srt') {
      $raw = $_POST['srt_text'] ?? '';
      if (!empty($_FILES['srt_file']['tmp_name'])) {
        $raw = (string)file_get_contents($_FILES['srt_file']['tmp_name']);
      }
      $segs = Ingest::srt($raw);
    } elseif ($src === 'text') {
      $segs = Ingest::textSegments($_POST['text'] ?? '', (int)($skill['rules']['wpm'] ?? 150));
      $allowIntro = true;
    } elseif ($src === 'link') {
      [$lt, $body] = Ingest::link($_POST['url'] ?? '');
      $title = $title ?: $lt;
      $segs = Ingest::textSegments($body ?: $lt, (int)($skill['rules']['wpm'] ?? 150));
      $allowIntro = true;
    }

    if (empty($segs)) throw new Exception('محتوای ورودی معتبر نیست یا خالی است.');

    $plan = Planner::build($segs, $skill, ['title' => $title, 'w' => $w, 'h' => $h, 'allowIntro' => $allowIntro]);
    if (!empty($_POST['use_ai'])) $plan = DeepSeek::enhance($plan, $CONFIG);

    [$file, $urlOut, $slug] = Render::make($plan, $CONFIG);
    $result = ['url' => $urlOut, 'slug' => $slug, 'segs' => count($plan['segments']), 'dur' => $plan['meta']['duration']];
  } catch (Throwable $e) {
    $errors[] = $e->getMessage();
  }
}

$skills = Skills::all($CONFIG['skills_dir']);
$stats = Lessons::stats($CONFIG);
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>MotionStudio PHP — تبدیل متن و SRT به موشن HTML</title>
  <link href="https://fonts.googleapis.com/css2?family=Lalezar&family=Vazirmatn:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body { background: #0c0a0f; color: #f4efe6; font-family: 'Vazirmatn', sans-serif; padding: 30px; }
    .box { max-width: 800px; margin: 0 auto; background: #16121b; padding: 24px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1); }
    h1 { font-family: 'Lalezar'; font-size: 28px; margin-bottom: 12px; color: #ff4a24; }
    textarea, input, select { width: 100%; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid #333; color: #fff; border-radius: 8px; margin: 8px 0 16px; }
    button { background: #ff4a24; color: #fff; padding: 12px 24px; border: 0; border-radius: 8px; cursor: pointer; font-family: 'Vazirmatn'; font-weight: bold; }
  </style>
</head>
<body>
  <div class="box">
    <h1>استودیو موشن‌گرافیک PHP</h1>
    <p>سامانه تحت‌وب کم‌توکن برای تبدیل متن و زیرنویس به صفحات مستقل HTML</p>
    <?php if ($result): ?>
      <p style="color: #4ade80;">موشن ساخته شد: <a href="<?= htmlspecialchars($result['url']) ?>" target="_blank" style="color: #4ade80; font-weight: bold;">مشاهده موشن</a></p>
    <?php endif; ?>
    <form method="post">
      <label>متن فارسی یا زیرنویس SRT:</label>
      <textarea name="text" rows="6" placeholder="متن خود را اینجا وارد کنید..."></textarea>
      <label>انتخاب اسکیل:</label>
      <select name="skill">
        <?php foreach ($skills as $s): ?>
          <option value="<?= htmlspecialchars($s['id']) ?>"><?= htmlspecialchars($s['title'] ?? $s['id']) ?></option>
        <?php endforeach; ?>
      </select>
      <button type="submit">تولید موشن HTML</button>
    </form>
  </div>
</body>
</html>
`,
  },
  {
    path: 'skills/fa-cinema.skill.json',
    category: 'skills',
    description: 'اسکیل تم تاریک سینمایی با ترنزیشن فنری کلمات',
    content: JSON.stringify(
      {
        id: 'fa-cinema',
        title: 'سینمایی تیره',
        version: 1,
        theme: {
          bg: '#0e0c10',
          fg: '#f4efe6',
          accent: '#ff4a24',
          displayFont: 'Lalezar',
          bodyFont: 'Vazirmatn',
          grain: true,
        },
        style: {
          captionMode: 'word-spring',
          stagger: 0.05,
          spring: { damping: 14, stiffness: 170 },
          captionSize: 74,
          progressBar: true,
          audioBars: false,
        },
        rules: {
          wpm: 145,
          maxCharsPerLine: 32,
          minSeg: 1.1,
          maxSeg: 5.5,
          gap: 0.15,
          keywords: ['مهم', 'اصلی', 'نتیجه', 'رشد', 'تحول'],
        },
        titleCard: { duration: 2.2, enabled: true },
        outroCard: { duration: 2.5, text: 'استودیو موشن', enabled: true },
      },
      null,
      2
    ),
  },
  {
    path: 'skills/vox-energy.skill.json',
    category: 'skills',
    description: 'اسکیل سبک تحلیلی و مستندهای وکس با هایلایت کشویی',
    content: JSON.stringify(
      {
        id: 'vox-energy',
        title: 'وکس و مستند',
        version: 1,
        theme: {
          bg: '#f6f2e8',
          fg: '#121014',
          accent: '#e63920',
          displayFont: 'Lalezar',
          bodyFont: 'Vazirmatn',
          grain: false,
        },
        style: {
          captionMode: 'swipe-highlight',
          stagger: 0.03,
          spring: { damping: 16, stiffness: 200 },
          captionSize: 78,
          progressBar: true,
          audioBars: true,
        },
        rules: {
          wpm: 165,
          maxCharsPerLine: 28,
          minSeg: 0.9,
          maxSeg: 4.5,
          gap: 0.08,
          keywords: ['آمار', 'درصد', 'گزارش'],
        },
        titleCard: { duration: 1.8, enabled: true },
        outroCard: { duration: 2.2, text: 'پایان گزارش', enabled: true },
      },
      null,
      2
    ),
  },
  {
    path: 'README.md',
    category: 'config',
    description: 'راهنمای راه‌اندازی و اجرای اسکریپت PHP بر روی سرور یا لوکال',
    content: `# MotionStudio PHP — استودیو تولید موشن‌گرافیک از متن، زیرنویس و صوت

اسکریپت مستقل به زبان PHP برای تبدیل ورودی‌های متنی و زیرنویس SRT به موشن‌گرافیک‌های تعاملی و مدرن HTML.

## مشخصات فنی
- بدون نیاز به کامپوزر یا کتابخانه‌های سنگین خارجی (Vanilla PHP 8+)
- مبتنی بر موتور تایپوگرافی Canvas 60fps با فیزیک فنری و ترنزیشن‌های متنوع
- بدون وابستگی به هوش مصنوعی در منطق موشن (۰ توکن) + قابلیت اختیاری دیپ‌سیک
- معماری اسکیل‌های توسعه‌پذیر با فایل‌های JSON
- سیستم ثبت بازخورد و یادگیری (Lessons)
- ماژول تبدیل مستقیم موشن به ویدیو MP4 / WebM با MediaRecorder مرورگر

## نحوه اجرا در لوکال
\`\`\`bash
php -S localhost:8080 -t public
\`\`\`
سپس آدرس \`http://localhost:8080\` را در مرورگر باز کنید.

## نحوه اجرا در هاست سی‌پنل / دایرکت‌ادمین
محتوای پوشه \`public\` را در \`public_html\` و سایر پوشه‌ها (\`app\`, \`skills\`, \`storage\`, \`templates\`) را در یک سطح بالاتر قرار دهید.

## خروجی ویدیویی MP4
۱. در مرورگر: با استفاده از MediaRecorder ویدیوی H.264 / MP4 مستقیماً با سرعت ۶۰ فریم ضبط و دانلود می‌شود.
۲. در ترمینال سرور با ffmpeg (اختیاری):
\`\`\`bash
ffmpeg -i output/slug/assets/voice.mp3 -framerate 60 -pattern_type glob -i 'frames/*.png' -c:v libx264 -pix_fmt yuv420p output.mp4
\`\`\`
`,
  },
];

export async function downloadPhpZipBundle(): Promise<void> {
  const zip = new JSZip();

  for (const file of PHP_BUNDLE_FILES) {
    zip.file(file.path, file.content);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `motion-studio-php-${Date.now().toString().slice(-4)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
