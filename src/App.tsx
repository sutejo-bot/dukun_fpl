import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  Activity, 
  CalendarDays, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Users, 
  Info, 
  X, 
  ChevronUp, 
  ChevronDown, 
  ArrowUpDown, 
  MapPin, 
  Sparkles, 
  Clock, 
  Newspaper, 
  Flame, 
  ShieldAlert, 
  Radio, 
  Quote, 
  Zap,
  Skull,
  Volleyball,
  RefreshCw,
  HeartCrack,
  CheckCircle2,
  Filter,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { cn } from './lib/utils';
import { Player, Fixture, AITacticsResponse, MbahNews } from './types';
import { mbahNewsData } from './data/news';
import BukuPasien from './components/BukuPasien';

// Helper deteksi dan format waktu sesuai lokasi/zona waktu tamu yang mengakses aplikasi
function getUserTimeZoneLabel(): string {
  try {
    const tzPart = new Intl.DateTimeFormat('id-ID', { timeZoneName: 'short' })
      .formatToParts(new Date())
      .find(p => p.type === 'timeZoneName')?.value;
    return tzPart ? `Waktu Lokal (${tzPart})` : 'Waktu Lokal';
  } catch {
    return 'Waktu Lokal';
  }
}

function formatFixtureLocalTime(rawDate?: string): string {
  if (!rawDate) return '';
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return rawDate;
    const formatted = new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(d).replace('.', ':');
    
    const tzName = new Intl.DateTimeFormat('id-ID', {
      timeZoneName: 'short'
    }).formatToParts(d).find(p => p.type === 'timeZoneName')?.value;

    return `${formatted} ${tzName || ''}`.trim();
  } catch {
    return rawDate;
  }
}

function getLocalClockString(): string {
  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
    const tzName = new Intl.DateTimeFormat('id-ID', { timeZoneName: 'short' }).formatToParts(now).find(p => p.type === 'timeZoneName')?.value;
    return `${timeStr} ${tzName || ''}`.trim();
  } catch {
    return new Date().toLocaleTimeString();
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stats' | 'tactics' | 'guestbook'>('dashboard');
  const [players, setPlayers] = useState<Player[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const hasRecordedRef = useRef(false);

  // Hitungan tamu yang sudah berkunjung (Data Real)
  const [visitorCount, setVisitorCount] = useState<number>(() => {
    const local = localStorage.getItem('dukun_fpl_visitor_count');
    return local ? parseInt(local, 10) : 0;
  });

  // Hitung setiap aplikasi ini dibuka (Real counter, guard against React StrictMode double count)
  useEffect(() => {
    if (hasRecordedRef.current) return;
    hasRecordedRef.current = true;

    const recordVisit = async () => {
      try {
        const res = await fetch('/api/visit', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.count === 'number') {
            setVisitorCount(data.count);
            localStorage.setItem('dukun_fpl_visitor_count', data.count.toString());
            return;
          }
        }
      } catch (err) {
        console.warn('Fallback ke counter lokal:', err);
      }
      const stored = localStorage.getItem('dukun_fpl_visitor_count');
      const next = (stored ? parseInt(stored, 10) : 1) + 1;
      setVisitorCount(next);
      localStorage.setItem('dukun_fpl_visitor_count', next.toString());
    };

    recordVisit();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/fpl-data');
        if (!res.ok) {
           throw new Error('Gagal terhubung ke server backend (Error ' + res.status + ')');
        }
        const data = await res.json();
        setPlayers(data.players || []);
        setFixtures(data.fixtures || []);
      } catch (error) {
        console.error("Gagal memuat data FPL", error);
        setGlobalError('Gagal terhubung ke server backend FPL. Jika Anda meng-hosting aplikasi ini di Netlify (statis) atau GitHub Pages, API tidak akan berfungsi karena aplikasi ini membutuhkan backend Node.js (server.ts) yang aktif berjalan.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 pb-12">
      {/* Header: Tamu yang sudah berkunjung dan Made by Maspras HANYA ada di atas dan selalu tampil di semua halaman */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-2 sm:py-0 sm:h-16 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Logo Brand */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-emerald-500/40 bg-slate-900 flex items-center justify-center shrink-0 relative group shadow-sm shadow-emerald-500/20">
                <Volleyball className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 group-hover:rotate-45 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-1.5">
                  <span>Dukun FPL</span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                    Wangsit Sakti
                  </span>
                </h1>
              </div>
            </div>
            {/* Mobile counter strip moved here for better alignment */}
            <div className="sm:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400">
              <Users className="w-3 h-3 text-emerald-400" />
              <span className="font-mono font-bold text-emerald-400">{visitorCount.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            {/* Visitor Counter & Made By Maspras (HANYA di atas & tampil di semua tab/halaman) */}
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-400 shadow-sm">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tamu:</span>
              <span className="font-mono font-bold text-emerald-400">{visitorCount.toLocaleString('id-ID')}</span>
            </div>
            <span className="text-slate-700">•</span>
            <div className="flex items-center gap-1">
              <span>Diracik Oleh</span>
              <span className="text-emerald-300 font-semibold tracking-wide">maspras</span>
            </div>
          </div>
          
            {/* Navigation Tabs */}
            <nav className="flex items-center w-full sm:w-auto gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800 overflow-x-auto scrollbar-none snap-x snap-mandatory">
              {[
                { id: 'dashboard', label: 'Ruang Tamu', shortLabel: 'Tamu', icon: Activity },
                { id: 'stats', label: 'Data Pemain', shortLabel: 'Data', icon: Users },
                { id: 'tactics', label: 'Wangsit Si Mbah', shortLabel: 'Wangsit', icon: Sparkles },
                { id: 'guestbook', label: 'Buku Pasien', shortLabel: 'Buku', icon: BookOpen },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "snap-center flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer",
                    activeTab === tab.id 
                      ? "bg-slate-800 text-emerald-400 shadow-sm" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="inline sm:hidden">{tab.shortLabel}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {globalError ? (
          <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl flex flex-col items-center justify-center text-center max-w-lg mx-auto mt-10 animate-in fade-in zoom-in-95 duration-500">
            <X className="w-12 h-12 text-rose-500 mb-4 bg-rose-500/10 p-2 rounded-full" />
            <h2 className="text-xl font-bold text-rose-400 mb-2">Gagal Terhubung</h2>
            <p className="text-slate-300 text-sm mb-4 leading-relaxed">{globalError}</p>
            <p className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded border border-slate-800">
              Jika ini di Netlify, pastikan fungsi (Netlify Functions) sudah ter-deploy dan <strong>GEMINI_API_KEY</strong> sudah dimasukkan ke Environment Variables di dashboard Netlify.
            </p>
          </div>
        ) : loading && activeTab !== 'guestbook' ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400">Mengambil data dari web resmi FPL...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard players={players} fixtures={fixtures} />}
            {activeTab === 'stats' && <Statistik players={players} />}
            {activeTab === 'tactics' && <AITactics />}
            {activeTab === 'guestbook' && <BukuPasien formatLocalTime={formatFixtureLocalTime} />}
          </>
        )}
      </main>
    </div>
  );
}

function Dashboard({ players, fixtures }: { players: Player[], fixtures: Fixture[] }) {
  // Ambil 5 pemain terbaik berdasarkan form
  const topPerformers = [...players].sort((a, b) => b.form - a.form).slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-100 flex gap-4">
        <Activity className="w-6 h-6 text-emerald-400 shrink-0" />
        <div>
          <h3 className="font-bold text-emerald-400">Siapa yang menyarankan datang ke Dukun FPL ???</h3>
          <p className="text-sm mt-1 text-emerald-200/80">
            Data yang disajikan tergantung dari kemenyan yang ditawarkan. Untuk wangsit silahkan menuju kamar wangsit si mbah. Segala bentuk wangsit menjadi tanggungan sendiri.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart className="w-5 h-5 text-emerald-400" />
            Yang Masuk Radar Mbah (Wangsit dari Orang Dalam)
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPerformers} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" />
                <YAxis dataKey="name" type="category" stroke="#64748b" width={100} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="form" fill="#34d399" name="Form (Poin per Laga)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-400" />
              Pertempuran Minggu Ini
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {getUserTimeZoneLabel()}
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-y-auto max-h-[300px] divide-y divide-slate-800/80 pr-1 scrollbar-thin">
            {fixtures.length > 0 ? fixtures.map((fixture) => (
              <div 
                key={fixture.id} 
                className="p-4 space-y-2.5 hover:bg-slate-800/30 transition-colors"
              >
                {/* Match Header: Teams & Difficulty */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-100 text-sm leading-snug">
                      <span className="text-emerald-300">{fixture.homeTeam}</span>
                      <span className="mx-1.5 text-xs text-slate-500 font-normal">vs</span>
                      <span className="text-slate-200">{fixture.awayTeam}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {formatFixtureLocalTime(fixture.kickoffTime || fixture.date)}
                      </span>
                      {fixture.venue && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {fixture.venue}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0" title={"Tingkat Kesulitan: " + fixture.difficulty}>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Tingkat Kesulitan</span>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "w-2 h-4 rounded-xs",
                            i < fixture.difficulty 
                              ? fixture.difficulty <= 2 ? "bg-emerald-500" : fixture.difficulty === 3 ? "bg-amber-500" : "bg-rose-500"
                              : "bg-slate-800"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Prediksi Si Mbah & Estimasi Skor Akhir */}
                <div className="bg-slate-950/80 border border-emerald-500/20 rounded-lg p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Prediksi Si Mbah</span>
                    </div>
                    {fixture.predictedScore && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Skor: {fixture.predictedScore}
                      </span>
                    )}
                  </div>
                  {fixture.predictionComment && (
                    <p className="text-xs text-slate-300 italic leading-relaxed">
                      "{fixture.predictionComment}"
                    </p>
                  )}
                </div>
              </div>
            )) : (
              <div className="p-4 text-slate-500 text-sm">Jadwal tidak tersedia.</div>
            )}
          </div>
        </div>
      </div>

      {/* Warta Resmi & Gosip Panas Liga Inggris Ala Si Mbah */}
      <WartaSiMbah />
    </div>
  );
}

function WartaSiMbah() {
  const [newsList, setNewsList] = useState<MbahNews[]>(mbahNewsData);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeModalNews, setActiveModalNews] = useState<MbahNews | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>(() => `Baru saja (${getLocalClockString()})`);

  // Auto fetch latest dynamic news on mount
  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        const res = await fetch('/api/fpl-news');
        if (res.ok) {
          const data = await res.json();
          if (data.news && Array.isArray(data.news) && data.news.length > 0) {
            setNewsList(data.news);
            setLastRefreshedTime(getLocalClockString());
          }
        }
      } catch (err) {
        console.warn('Menggunakan warta lokal Si Mbah:', err);
      }
    };
    fetchLatestNews();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/fpl-news');
      if (res.ok) {
        const data = await res.json();
        if (data.news && Array.isArray(data.news) && data.news.length > 0) {
          setNewsList(data.news);
          setLastRefreshedTime(getLocalClockString());
        }
      }
    } catch (err) {
      console.error('Gagal menyegarkan warta:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const categories = [
    { id: 'all', label: 'Semua Warta', icon: Newspaper },
    { id: 'official', label: 'Info Resmi Klub', icon: Radio },
    { id: 'transfer', label: 'Gosip Transfer', icon: Flame },
    { id: 'injury', label: 'Medis & Cedera', icon: ShieldAlert },
    { id: 'dressing_room', label: 'Kamar Ganti', icon: Zap },
  ];

  const filteredNews = selectedCategory === 'all' 
    ? newsList 
    : newsList.filter(item => item.sourceType === selectedCategory);

  return (
    <div className="space-y-4 pt-6 border-t border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-slate-100">
              <Newspaper className="w-6 h-6 text-emerald-400" />
              Warta Resmi & Gosip Panas Liga Inggris
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Selalu Update
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kumpulan berita dari sumber resmi & jurnalis terpercaya (Premier League, BBC, Sky Sports, The Athletic, Fabrizio Romano) yang diterawang lewat dupa dan kemenyan Si Mbah.
          </p>
        </div>

        {/* Action Button: Refresh Kemenyan & Status */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            title="Segarkan warta dengan membakar kemenyan baru"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-amber-400")} />
            <span>{isRefreshing ? 'Menerawang Warta...' : 'Bakar Kemenyan (Update Warta)'}</span>
          </button>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Update: {lastRefreshedTime}
          </span>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                isActive 
                  ? "bg-emerald-500 text-slate-950 font-semibold shadow-sm shadow-emerald-500/20" 
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid of News Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNews.map((news) => (
          <div
            key={news.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all hover:shadow-lg hover:shadow-black/40 group"
          >
            <div className="space-y-2.5">
              {/* Card Meta Top: Source & Category */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[11px] font-medium border",
                  news.sourceType === 'transfer' ? "bg-amber-500/15 text-amber-300 border-amber-500/30" :
                  news.sourceType === 'injury' ? "bg-rose-500/15 text-rose-300 border-rose-500/30" :
                  news.sourceType === 'dressing_room' ? "bg-purple-500/15 text-purple-300 border-purple-500/30" :
                  "bg-blue-500/15 text-blue-300 border-blue-500/30"
                )}>
                  {news.category}
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {news.timeAgo}
                </span>
              </div>

              {/* Source attribution */}
              <div className="text-[11px] font-medium text-emerald-400/90 flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">Sumber: {news.source}</span>
              </div>

              {/* Headline */}
              <h3 className="font-bold text-slate-100 text-sm leading-snug group-hover:text-emerald-300 transition-colors">
                {news.title}
              </h3>

              {/* Official Summary */}
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {news.officialSummary}
              </p>

              {/* Mbah's Mystical Commentary */}
              <div className="bg-slate-950 border border-amber-500/20 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Terawangan Gaib Si Mbah</span>
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  "{news.mbahCommentary}"
                </p>
              </div>
            </div>

            {/* Card Footer: FPL Impact & Action */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded border",
                  news.fplImpact.action === 'Beli Segera' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" :
                  news.fplImpact.action === 'Wajib Kapten' ? "bg-amber-500/20 text-amber-300 border-amber-500/40" :
                  news.fplImpact.action === 'Lepas / Jual' ? "bg-rose-500/20 text-rose-300 border-rose-500/40" :
                  "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                )}>
                  Fatwa: {news.fplImpact.action}
                </span>
                <span className="text-[11px] text-slate-400 truncate max-w-[130px]">
                  {news.fplImpact.affectedPlayers.join(', ')}
                </span>
              </div>

              <button
                onClick={() => setActiveModalNews(news)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium shrink-0 flex items-center gap-0.5 hover:underline"
              >
                Detail
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detail Berita & Fatwa Mbah */}
      {activeModalNews && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={cn(
                  "px-2.5 py-0.5 rounded text-xs font-semibold border",
                  activeModalNews.sourceType === 'transfer' ? "bg-amber-500/15 text-amber-300 border-amber-500/30" :
                  activeModalNews.sourceType === 'injury' ? "bg-rose-500/15 text-rose-300 border-rose-500/30" :
                  activeModalNews.sourceType === 'dressing_room' ? "bg-purple-500/15 text-purple-300 border-purple-500/30" :
                  "bg-blue-500/15 text-blue-300 border-blue-500/30"
                )}>
                  {activeModalNews.category}
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-2">
                  {activeModalNews.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span className="text-emerald-400 font-medium">Sumber: {activeModalNews.source}</span>
                  <span>•</span>
                  <span>{activeModalNews.timeAgo}</span>
                </div>
              </div>
              <button 
                onClick={() => setActiveModalNews(null)}
                className="text-slate-400 hover:text-slate-200 p-1 bg-slate-800 rounded-full shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Kabar Resmi</h4>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                  {activeModalNews.officialSummary}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Wejangan & Fatwa Spiritual Si Mbah
                </h4>
                <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-lg space-y-2">
                  <p className="text-sm text-amber-100/90 italic leading-relaxed">
                    "{activeModalNews.mbahCommentary}"
                  </p>
                  <div className="pt-2 border-t border-amber-500/20 text-xs text-amber-200/80">
                    <strong>Pemain Terkait:</strong> {activeModalNews.fplImpact.affectedPlayers.join(', ')}
                    <br />
                    <strong>Rekomendasi Taktis FPL:</strong> {activeModalNews.fplImpact.advice}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveModalNews(null)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
              >
                Siap, Laksanakan Mbah!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Statistik({ players }: { players: Player[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'fit' | 'injured'>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [infoModal, setInfoModal] = useState<{ title: string; desc: string } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Player; direction: 'asc' | 'desc' } | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(50);

  // Extract unique teams for dropdown
  const uniqueTeams = Array.from(new Set(players.map(p => p.team))).filter(Boolean).sort();

  // Counts for status pills
  const totalCount = players.length;
  const injuredCount = players.filter(p => p.isInjured).length;
  const fitCount = totalCount - injuredCount;

  // Filter pipeline
  let processedPlayers = players.filter(p => {
    // Search
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.news && p.news.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    // Status (Fit vs Tumbang)
    if (statusFilter === 'fit' && p.isInjured) return false;
    if (statusFilter === 'injured' && !p.isInjured) return false;

    // Position
    if (positionFilter !== 'all' && p.position !== positionFilter) return false;

    // Team
    if (teamFilter !== 'all' && p.team !== teamFilter) return false;

    return true;
  });

  // Sorting
  if (sortConfig !== null) {
    processedPlayers.sort((a, b) => {
      let aValue: any = a[sortConfig.key];
      let bValue: any = b[sortConfig.key];
      
      if (sortConfig.key === 'selectedByPercent') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Pagination calculation
  const totalItems = processedPlayers.length;
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / (pageSize as number)) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPlayers = pageSize === 'all' 
    ? processedPlayers 
    : processedPlayers.slice((safeCurrentPage - 1) * (pageSize as number), safeCurrentPage * (pageSize as number));

  const handleSort = (key: keyof Player) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === 'desc') direction = 'asc';
      else {
        setSortConfig(null);
        return;
      }
    }
    setSortConfig({ key, direction });
  };

  const renderHeader = (key: keyof Player, label: string, title?: string, desc?: string, className?: string) => {
    const isSorted = sortConfig?.key === key;
    return (
      <th className={cn("px-4 py-3 font-medium", className)}>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => handleSort(key)}
            className="flex items-center gap-1 hover:text-emerald-400 transition-colors group cursor-pointer"
            title={`Urutkan berdasarkan ${label}`}
          >
            {label}
            {isSorted ? (
              sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400" />
            )}
          </button>
          {title && desc && (
            <button 
              onClick={() => setInfoModal({ title, desc })}
              className="text-slate-500 hover:text-emerald-400 transition-colors shrink-0 ml-1"
              title="Klik untuk penjelasan"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* Header and Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>Data Lengkap Pemain FPL</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">
                {totalCount} Total Terdata
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Semua pemain Premier League tercatat lengkap, termasuk pemain berstatus <strong>TUMBANG</strong> (cedera/absen).
            </p>
          </div>

          {/* Search box */}
          <div className="w-full sm:w-72">
            <input 
              type="text"
              placeholder="Cari nama pemain, klub, atau cedera..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-slate-200 placeholder-slate-500 shadow-sm"
            />
          </div>
        </div>

        {/* Filter bar: Status pills, Position pills, Club selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filters */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer",
                  statusFilter === 'all' 
                    ? "bg-slate-800 text-emerald-400 shadow-sm" 
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                Semua ({totalCount})
              </button>
              <button
                onClick={() => { setStatusFilter('fit'); setCurrentPage(1); }}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                  statusFilter === 'fit' 
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Bugar ({fitCount})
              </button>
              <button
                onClick={() => { setStatusFilter('injured'); setCurrentPage(1); }}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                  statusFilter === 'injured' 
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" 
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <HeartCrack className="w-3 h-3 text-rose-400" />
                TUMBANG ({injuredCount})
              </button>
            </div>

            {/* Position Filter */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
              {[
                { id: 'all', label: 'Semua Posisi' },
                { id: 'GK', label: 'GK' },
                { id: 'DEF', label: 'DEF' },
                { id: 'MID', label: 'MID' },
                { id: 'FWD', label: 'FWD' },
              ].map(pos => (
                <button
                  key={pos.id}
                  onClick={() => { setPositionFilter(pos.id); setCurrentPage(1); }}
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer",
                    positionFilter === pos.id
                      ? "bg-slate-800 text-slate-100 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {pos.label}
                </button>
              ))}
            </div>

            {/* Team Dropdown Filter */}
            <select
              value={teamFilter}
              onChange={(e) => { setTeamFilter(e.target.value); setCurrentPage(1); }}
              aria-label="Filter berdasarkan Klub"
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Semua Klub ({uniqueTeams.length})</option>
              {uniqueTeams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Tampilkan per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
                setPageSize(val);
                setCurrentPage(1);
              }}
              aria-label="Jumlah pemain per halaman"
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="all">Semua ({totalItems})</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Players Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400">
            <tr>
              {renderHeader("name", "Pemain & Status")}
              {renderHeader("team", "Tim")}
              {renderHeader("position", "Posisi", "Posisi Pemain", "Posisi bermain (GK = Kiper, DEF = Bek, MID = Gelandang, FWD = Penyerang).")}
              <th className="px-4 py-3 font-medium text-slate-400">
                <div className="flex items-center gap-1">
                  <span>Kondisi Medis / Catatan</span>
                  <button 
                    onClick={() => setInfoModal({ 
                      title: "Kondisi Medis & Status Tumbang", 
                      desc: "Pemain dengan tanda TUMBANG sedang mengalami cedera, sakit, atau terkena sanksi larangan tanding resmi dari Premier League. Hindari memasang pemain bertanda TUMBANG di susunan starter pekan ini." 
                    })}
                    className="text-slate-500 hover:text-emerald-400 transition-colors ml-0.5"
                    title="Penjelasan kondisi medis"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
              </th>
              {renderHeader("price", "Harga (£)", "Harga Pemain", "Harga terkini pemain di bursa transfer FPL.")}
              {renderHeader("points", "Total Poin", "Total Poin", "Akumulasi poin FPL yang telah dikumpulkan pemain ini.")}
              {renderHeader("form", "Form", "Form (Performa)", "Rata-rata poin yang didapatkan pemain dalam beberapa laga terakhir.")}
              {renderHeader("xG", "xG", "Expected Goals (xG)", "Harapan Gol. Metrik statistik kualitas peluang mencetak gol.")}
              {renderHeader("xA", "xA", "Expected Assists (xA)", "Harapan Assist. Mengukur kualitas umpan berbuah peluang gol.")}
              {renderHeader("selectedByPercent", "Dimiliki Oleh", "Tingkat Kepemilikan", "Persentase manajer FPL yang memiliki pemain ini di skuad.", "text-emerald-400")}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {paginatedPlayers.map(p => (
              <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                {/* Pemain & Status */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{p.name}</span>
                    {p.isInjured && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider shrink-0 animate-pulse">
                        <HeartCrack className="w-3 h-3 text-rose-400" />
                        TUMBANG
                      </span>
                    )}
                  </div>
                  {p.news && (
                    <p className="text-[11px] text-rose-400/90 font-normal mt-0.5 max-w-xs truncate" title={p.news}>
                      Catatan: {p.news}
                    </p>
                  )}
                </td>

                <td className="px-4 py-3 text-slate-400">{p.team}</td>
                
                <td className="px-4 py-3">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium",
                    p.position === 'FWD' ? "bg-rose-500/10 text-rose-400" :
                    p.position === 'MID' ? "bg-blue-500/10 text-blue-400" :
                    p.position === 'DEF' ? "bg-emerald-500/10 text-emerald-400" :
                    "bg-amber-500/10 text-amber-400"
                  )}>
                    {p.position}
                  </span>
                </td>

                {/* Kondisi Medis / Catatan Column */}
                <td className="px-4 py-3">
                  {p.isInjured ? (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                        <HeartCrack className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        TUMBANG
                        {p.chanceOfPlaying !== null && p.chanceOfPlaying !== undefined && (
                          <span className="text-amber-300 font-semibold ml-1">({p.chanceOfPlaying}% main)</span>
                        )}
                      </span>
                      <span className="text-[11px] text-slate-400 max-w-[240px] truncate" title={p.news || 'Cedera / Absen'}>
                        {p.news || 'Cedera / Absen dari Skuad'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Bugar 100%</span>
                    </div>
                  )}
                </td>

                <td className="px-4 py-3 text-slate-300">£{p.price}m</td>
                <td className="px-4 py-3 font-bold text-slate-200">{p.points}</td>
                <td className="px-4 py-3 text-slate-300">{p.form}</td>
                <td className="px-4 py-3 text-slate-400">{p.xG}</td>
                <td className="px-4 py-3 text-slate-400">{p.xA}</td>
                <td className="px-4 py-3 text-emerald-400">{p.selectedByPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedPlayers.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <HeartCrack className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Pemain dengan kriteria tersebut tidak ditemukan.</p>
            <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter status.</p>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 pt-2">
        <div>
          Menampilkan <strong>{paginatedPlayers.length}</strong> dari <strong>{totalItems}</strong> pemain tersaring 
          {injuredCount > 0 && <span> ({processedPlayers.filter(p => p.isInjured).length} pemain berstatus <strong>TUMBANG</strong>)</span>}.
        </div>

        {pageSize !== 'all' && totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={safeCurrentPage === 1}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>
            <span className="px-2 py-1 text-slate-300 font-semibold bg-slate-900 border border-slate-800 rounded">
              Hal {safeCurrentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={safeCurrentPage === totalPages}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Info Modal */}
      {infoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setInfoModal(null)}>
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
              <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-400" />
                {infoModal.title}
              </h3>
              <button 
                onClick={() => setInfoModal(null)}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-slate-300 leading-relaxed text-sm">
                {infoModal.desc}
              </p>
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
              <button 
                onClick={() => setInfoModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AITactics() {
  const [data, setData] = useState<AITacticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAdvice = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/fpl-advice', { method: 'POST' });
      if (!res.ok) throw new Error('Gagal mengambil wangsit dari Si Mbah (Server Error)');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Terjadi gangguan gaib saat memohon wangsit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="text-center space-y-4 mb-8">
        <div className="mx-auto w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/30 relative shadow-lg shadow-amber-500/10">
          <Skull className="w-7 h-7 text-amber-400" />
          <Flame className="w-4 h-4 text-emerald-400 absolute -top-1.5 -right-1 animate-pulse" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center justify-center gap-2">
            <span>Kamar Wangsit Si Mbah</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm mt-1.5">
            Bakar kemenyan dan konsultasikan skuad FPL dengan Si Mbah. Wangsit langsung diturunkan dari terawangan data resmi FPL terkini!
          </p>
        </div>
        
        {!data && !loading && (
          <button 
            onClick={fetchAdvice}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer flex items-center gap-2 mx-auto"
          >
            <Flame className="w-4 h-4 text-slate-950" />
            <span>Minta Wangsit Pekan Ini</span>
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <div className="relative">
            <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <Skull className="w-5 h-5 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-emerald-300 font-semibold">Si Mbah sedang bertapa dan menerawang data pemain FPL...</p>
            <p className="text-xs text-slate-500 mt-1">Membakar dupa, menganalisis statistik xG, jadwal, dan pemain tumbang.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-center text-sm">
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-amber-400">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" /> 
              Wangsit Kapten (Poin Digandakan)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.captainPicks.map((pick, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-lg relative overflow-hidden group hover:border-amber-500/40 transition-colors">
                  <div className="absolute top-0 right-0 p-2 opacity-10 font-bold text-6xl italic group-hover:scale-110 transition-transform">
                    {i+1}
                  </div>
                  <h4 className="font-bold text-lg mb-2 text-slate-200">{pick.name}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{pick.reasoning}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-emerald-400">
                <TrendingUp className="w-5 h-5" /> Wangsit Beli (Transfer In)
              </h3>
              <ul className="space-y-4">
                {data.transfersIn.map((t, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="mt-1 bg-emerald-500/20 p-1.5 rounded-lg h-fit">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200">{t.name}</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">{t.reasoning}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-rose-400">
                <TrendingDown className="w-5 h-5" /> Wangsit Jual (Transfer Out)
              </h3>
              <ul className="space-y-4">
                {data.transfersOut.map((t, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="mt-1 bg-rose-500/20 p-1.5 rounded-lg h-fit">
                      <TrendingDown className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200">{t.name}</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">{t.reasoning}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-amber-400">
              <Sparkles className="w-5 h-5 text-amber-400" /> Petuah & Strategi Pekan Ini
            </h3>
            <p className="text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800 text-sm">
              {data.oddsInsights}
            </p>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={fetchAdvice}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Terawang Ulang (Kocok Ulang Wangsit)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
