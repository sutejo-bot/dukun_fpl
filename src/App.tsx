import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { BrainCircuit, Activity, CalendarDays, TrendingUp, TrendingDown, Star, Users, Info, X, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { cn } from './lib/utils';
import { Player, Fixture, AITacticsResponse } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stats' | 'tactics'>('dashboard');
  const [players, setPlayers] = useState<Player[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/fpl-data');
        const data = await res.json();
        setPlayers(data.players || []);
        setFixtures(data.fixtures || []);
      } catch (error) {
        console.error("Gagal memuat data FPL", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500/30 flex items-center justify-center shrink-0 bg-slate-900">
              <BrainCircuit className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Dukun FPL</h1>
          </div>
          
          <nav className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Ringkasan', icon: Activity },
              { id: 'stats', label: 'Data Pemain', icon: Users },
              { id: 'tactics', label: 'Saran Si Mbah', icon: BrainCircuit },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-slate-800 text-emerald-400 shadow-sm" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400">Mengambil data dari web resmi FPL...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard players={players} fixtures={fixtures} />}
            {activeTab === 'stats' && <Statistik players={players} />}
            {activeTab === 'tactics' && <AITactics />}
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
          <h3 className="font-bold text-emerald-400">Selamat datang di Dukun FPL!</h3>
          <p className="text-sm mt-1 text-emerald-200/80">
            Data yang disajikan tergantung dari kemenyan yang ditawarkan. Untuk saran strategi silahkan ke menu <strong>Saran Si Mbah</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart className="w-5 h-5 text-emerald-400" />
            Pemain Sedang Panas (Berdasarkan Form)
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
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-400" />
            Jadwal Pertandingan Terdekat
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {fixtures.length > 0 ? fixtures.map((fixture, idx) => (
              <div 
                key={fixture.id} 
                className={cn(
                  "flex items-center justify-between p-4",
                  idx !== fixtures.length - 1 && "border-b border-slate-800"
                )}
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-200 text-sm">{fixture.homeTeam} vs {fixture.awayTeam}</span>
                  <span className="text-xs text-slate-500">{fixture.date}</span>
                </div>
                <div className="flex gap-1" title={"Tingkat Kesulitan: " + fixture.difficulty}>
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-2 h-6 rounded-sm",
                        i < fixture.difficulty 
                          ? fixture.difficulty <= 2 ? "bg-emerald-500" : fixture.difficulty === 3 ? "bg-amber-500" : "bg-rose-500"
                          : "bg-slate-800"
                      )}
                    />
                  ))}
                </div>
              </div>
            )) : (
              <div className="p-4 text-slate-500 text-sm">Jadwal tidak tersedia.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Statistik({ players }: { players: Player[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [infoModal, setInfoModal] = useState<{ title: string; desc: string } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Player; direction: 'asc' | 'desc' } | null>(null);

  let processedPlayers = players.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (sortConfig !== null) {
    processedPlayers.sort((a, b) => {
      let aValue: any = a[sortConfig.key];
      let bValue: any = b[sortConfig.key];
      
      if (sortConfig.key === 'selectedByPercent') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const filteredPlayers = processedPlayers.slice(0, 50);

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold">Daftar Pemain FPL</h2>
        <input 
          type="text"
          placeholder="Cari pemain..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-slate-200 w-full sm:w-64"
        />
      </div>
      
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-950/50 border-b border-slate-800 text-slate-400">
            <tr>
              {renderHeader("name", "Pemain")}
              {renderHeader("team", "Tim")}
              {renderHeader("position", "Posisi", "Posisi Pemain", "Posisi bermain (GK = Kiper, DEF = Bek, MID = Gelandang, FWD = Penyerang). Berpengaruh pada jumlah poin yang didapat untuk aksi tertentu (misal: bek mendapat poin ekstra jika clean sheet atau mencetak gol).")}
              {renderHeader("price", "Harga (£)", "Harga Pemain", "Harga terkini pemain di bursa transfer FPL. Harga bisa naik atau turun setiap malamnya tergantung seberapa banyak manajer lain yang membelinya atau menjualnya.")}
              {renderHeader("points", "Total Poin", "Total Poin", "Akumulasi poin FPL yang telah dikumpulkan pemain ini semenjak awal musim sampai pertandingan terakhir yang dimainkan.")}
              {renderHeader("form", "Form", "Form (Performa)", "Rata-rata poin yang didapatkan pemain ini per pertandingan dalam 30 hari terakhir. Angka form yang tinggi berarti pemain tersebut sedang 'on-fire' atau rutin mencetak poin tinggi.")}
              {renderHeader("xG", "xG", "Expected Goals (xG)", "Harapan Gol. Metrik statistik canggih yang mengukur kualitas peluang mencetak gol. Semakin tinggi nilai xG, berarti pemain tersebut semakin sering mendapat peluang emas di depan gawang.")}
              {renderHeader("xA", "xA", "Expected Assists (xA)", "Harapan Assist. Mengukur kualitas umpan berbuah peluang gol yang diberikan ke rekan setimnya. Nilai xA tinggi berarti pemain ini rajin memberikan umpan kunci pemecah pertahanan lawan.")}
              {renderHeader("selectedByPercent", "Dimiliki Oleh", "Tingkat Kepemilikan", "Persentase seluruh manajer FPL di dunia yang memiliki pemain ini di skuad mereka. Pemain dengan persentase kepemilikan sangat tinggi (>40%) sering disebut 'template', sedangkan yang rendah (<10%) disebut diferensial.", "text-emerald-400")}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filteredPlayers.map(p => (
              <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-200">{p.name}</td>
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
                <td className="px-4 py-3 text-slate-300">{p.price}</td>
                <td className="px-4 py-3 font-bold text-slate-200">{p.points}</td>
                <td className="px-4 py-3 text-slate-300">{p.form}</td>
                <td className="px-4 py-3 text-slate-400">{p.xG}</td>
                <td className="px-4 py-3 text-slate-400">{p.xA}</td>
                <td className="px-4 py-3 text-emerald-400">{p.selectedByPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPlayers.length === 0 && (
          <div className="text-center py-8 text-slate-500">Pemain tidak ditemukan.</div>
        )}
      </div>
      <p className="text-xs text-slate-500 text-right">Menampilkan maksimal 50 pemain untuk performa.</p>

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
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
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
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
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
      if (!res.ok) throw new Error('Gagal mengambil data dari server');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat saran AI.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="text-center space-y-4 mb-8">
        <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
          <BrainCircuit className="w-6 h-6 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold">Terawangan Si Mbah</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Mbah akan membaca data FPL asli secara langsung (seperti harga, form, dan poin) lalu memberikan panduan bermain.
        </p>
        
        {!data && !loading && (
          <button 
            onClick={fetchAdvice}
            className="mt-4 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
          >
            Minta Saran Pekan Ini
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 animate-pulse">AI sedang menganalisis data pemain FPL...</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-center">
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-emerald-400">
              <Star className="w-5 h-5 fill-emerald-400 text-emerald-400" /> 
              Rekomendasi Kapten (Poin Digandakan)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.captainPicks.map((pick, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-lg relative overflow-hidden group">
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
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-emerald-400">
                <TrendingUp className="w-5 h-5" /> Rekomendasi Beli (Transfer In)
              </h3>
              <ul className="space-y-4">
                {data.transfersIn.map((t, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="mt-1 bg-emerald-500/20 p-1 rounded h-fit">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200">{t.name}</h4>
                      <p className="text-sm text-slate-400">{t.reasoning}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-rose-400">
                <TrendingDown className="w-5 h-5" /> Rekomendasi Jual (Transfer Out)
              </h3>
              <ul className="space-y-4">
                {data.transfersOut.map((t, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="mt-1 bg-rose-500/20 p-1 rounded h-fit">
                      <TrendingDown className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200">{t.name}</h4>
                      <p className="text-sm text-slate-400">{t.reasoning}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-amber-400">
              <Activity className="w-5 h-5" /> Tips Strategi Pekan Ini
            </h3>
            <p className="text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800">
              {data.oddsInsights}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
