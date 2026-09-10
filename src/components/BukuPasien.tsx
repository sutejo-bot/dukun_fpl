import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Send, 
  Flame, 
  Lightbulb, 
  MessageSquareWarning, 
  Heart, 
  User, 
  Clock, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { GuestbookEntry } from '../types';

interface BukuPasienProps {
  formatLocalTime: (isoStr: string) => string;
}

export default function BukuPasien({ formatLocalTime }: BukuPasienProps) {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'cacian' | 'makian' | 'nasehat'>('all');
  
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'cacian' | 'makian' | 'nasehat'>('cacian');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Liked IDs stored in localStorage to prevent duplicate clicks
  const [likedIds, setLikedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('dukun_fpl_liked_entries');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/guestbook');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.entries)) {
          setEntries(data.entries);
          return;
        }
      }
    } catch (err) {
      console.warn('Gagal memuat buku pasien dari server, memakai data cadangan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setFormError('Sila isi nama manajer / pasien terlebih dahulu.');
      return;
    }
    if (!trimmedMessage) {
      setFormError('Sila tuangkan cacian, makian, atau nasehat Anda.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          type,
          message: trimmedMessage
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.entries && Array.isArray(data.entries)) {
          setEntries(data.entries);
        } else if (data.entry) {
          setEntries(prev => [data.entry, ...prev]);
        }
        setMessage('');
        setFormSuccess(true);
        setTimeout(() => setFormSuccess(false), 4000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setFormError(errData.error || 'Gagal menyimpan catatan pasien.');
      }
    } catch (err) {
      // Offline fallback
      const localEntry: GuestbookEntry = {
        id: `gb-local-${Date.now()}`,
        name: trimmedName,
        type,
        message: trimmedMessage,
        timestamp: new Date().toISOString(),
        likes: 0
      };
      setEntries(prev => [localEntry, ...prev]);
      setMessage('');
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (id: string) => {
    if (likedIds.includes(id)) return;

    // Optimistic update
    setEntries(prev => prev.map(item => item.id === id ? { ...item, likes: (item.likes || 0) + 1 } : item));
    const nextLiked = [...likedIds, id];
    setLikedIds(nextLiked);
    try {
      localStorage.setItem('dukun_fpl_liked_entries', JSON.stringify(nextLiked));
      await fetch('/api/guestbook/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch (e) {
      // Ignored for optimistic UI
    }
  };

  const filteredEntries = entries.filter(item => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  const countCacian = entries.filter(e => e.type === 'cacian').length;
  const countMakian = entries.filter(e => e.type === 'makian').length;
  const countNasehat = entries.filter(e => e.type === 'nasehat').length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header Banner Buku Pasien */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-medium">
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>Kitab Curahan Pasien Dukun FPL</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-100">
              Buku Pasien & Keluh Kesah
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
              Ruang terbuka untuk menumpahkan cacian pedas, makian kekesalan akibat kapten blunder atau minus poin, 
              hingga nasehat bijak untuk Si Mbah dan sesama manajer FPL se-Indonesia.
            </p>
          </div>

          {/* Statistik Pasien Ringkas */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="bg-slate-950/80 border border-slate-800 px-3 py-2 rounded-xl text-center min-w-[75px]">
              <span className="text-[10px] sm:text-xs text-slate-400 block">Total Suara</span>
              <span className="text-base sm:text-lg font-bold text-slate-100">{entries.length}</span>
            </div>
            <div className="bg-rose-950/30 border border-rose-900/40 px-3 py-2 rounded-xl text-center min-w-[75px]">
              <span className="text-[10px] sm:text-xs text-rose-300 block">🔥 Cacian</span>
              <span className="text-base sm:text-lg font-bold text-rose-400">{countCacian}</span>
            </div>
            <div className="bg-amber-950/30 border border-amber-900/40 px-3 py-2 rounded-xl text-center min-w-[75px]">
              <span className="text-[10px] sm:text-xs text-amber-300 block">🤬 Makian</span>
              <span className="text-base sm:text-lg font-bold text-amber-400">{countMakian}</span>
            </div>
            <div className="bg-emerald-950/30 border border-emerald-900/40 px-3 py-2 rounded-xl text-center min-w-[75px]">
              <span className="text-[10px] sm:text-xs text-emerald-300 block">💡 Nasehat</span>
              <span className="text-base sm:text-lg font-bold text-emerald-400">{countNasehat}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Form Input di Kiri/Atas & Feed Catatan di Kanan/Bawah */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Form Tulis Pesan Pasien (5 Kolom pada desktop, full pada mobile/tablet) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-100 leading-snug">
                Torehkan Catatan Pasien
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Pesanmu akan langsung terbaca oleh seluruh manajer lain.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Nama Pasien */}
            <div className="space-y-1.5">
              <label htmlFor="patient-name" className="block text-xs sm:text-sm font-medium text-slate-300">
                Nama Pasien / Julukan Manajer <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="patient-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Tejo Boncos FC, Rangga Minus Empat"
                  maxLength={50}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Pilihan Jenis Ungkapan: Cacian, Makian, Nasehat */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-slate-300">
                Jenis Ungkapan Hati <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={() => setType('cacian')}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border text-center transition-all cursor-pointer min-h-[44px]",
                    type === 'cacian'
                      ? "bg-rose-500/20 border-rose-500/80 text-rose-300 shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  )}
                >
                  <Flame className={cn("w-4 h-4 sm:w-5 sm:h-5 mb-1", type === 'cacian' ? "text-rose-400" : "text-slate-500")} />
                  <span className="text-xs sm:text-sm font-semibold">Cacian</span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">Kritik Dukun</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('makian')}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border text-center transition-all cursor-pointer min-h-[44px]",
                    type === 'makian'
                      ? "bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  )}
                >
                  <MessageSquareWarning className={cn("w-4 h-4 sm:w-5 sm:h-5 mb-1", type === 'makian' ? "text-amber-400" : "text-slate-500")} />
                  <span className="text-xs sm:text-sm font-semibold">Makian</span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">Umpat Boncos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('nasehat')}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border text-center transition-all cursor-pointer min-h-[44px]",
                    type === 'nasehat'
                      ? "bg-emerald-500/20 border-emerald-500/80 text-emerald-300 shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  )}
                >
                  <Lightbulb className={cn("w-4 h-4 sm:w-5 sm:h-5 mb-1", type === 'nasehat' ? "text-emerald-400" : "text-slate-500")} />
                  <span className="text-xs sm:text-sm font-semibold">Nasehat</span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">Saran Bijak</span>
                </button>
              </div>
            </div>

            {/* Isi Pesan / Curahan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <label htmlFor="patient-message" className="font-medium text-slate-300">
                  {type === 'cacian' && 'Tumpahkan Cacian Anda:'}
                  {type === 'makian' && 'Tumpahkan Makian / Keluhan Anda:'}
                  {type === 'nasehat' && 'Tuliskan Nasehat / Doa Anda:'}
                  <span className="text-rose-400 ml-1">*</span>
                </label>
                <span className="text-slate-500 text-[11px] sm:text-xs">
                  {message.length}/500
                </span>
              </div>
              <textarea
                id="patient-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder={
                  type === 'cacian'
                    ? "Contoh: Mbah dukun parah banget, kapten yang diramalkan sakti malah ditarik keluar menit awal..."
                    : type === 'makian'
                    ? "Contoh: Apes banget pekan ini minus 8 gara-gara nafsu ganti kiper, amsyong..."
                    : "Contoh: Mbah, kalau bisa ramalannya ditambah analisis rotasi piala domestik ya biar makin top..."
                }
                className="w-full p-3 sm:p-3.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors leading-relaxed resize-none"
              />
            </div>

            {/* Error & Success Messages */}
            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Catatanmu telah berhasil dicatat di Kitab Pasien Si Mbah!</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer min-h-[44px]"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mencatat ke Kitab...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Torehkan ke Buku Pasien</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Daftar Catatan Pasien (7 Kolom pada desktop) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Baris Filter Kategori & Tombol Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2.5 sm:p-3 rounded-2xl">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <span className="text-xs text-slate-400 px-2 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter:</span>
              </span>
              {[
                { id: 'all', label: 'Semua', count: entries.length },
                { id: 'cacian', label: 'Cacian', count: countCacian, color: 'text-rose-400' },
                { id: 'makian', label: 'Makian', count: countMakian, color: 'text-amber-400' },
                { id: 'nasehat', label: 'Nasehat', count: countNasehat, color: 'text-emerald-400' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
                    activeFilter === tab.id
                      ? "bg-slate-800 text-slate-100 shadow-sm border border-slate-700 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  )}
                >
                  <span>{tab.label}</span>
                  <span className={cn("text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-950/60", tab.color || "text-slate-400")}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={fetchEntries}
              disabled={loading}
              title="Segarkan data catatan pasien"
              className="self-end sm:self-auto p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-emerald-400")} />
            </button>
          </div>

          {/* Daftar Kartu Catatan Pasien */}
          <div className="space-y-3.5">
            {loading && entries.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <RefreshCw className="w-8 h-8 mx-auto text-emerald-400 animate-spin" />
                <p className="text-sm sm:text-base text-slate-400">Membuka kitab catatan pasien...</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <BookOpen className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-sm sm:text-base text-slate-300 font-medium">Belum ada catatan untuk kategori ini.</p>
                <p className="text-xs sm:text-sm text-slate-500">Jadilah pasien pertama yang menuliskan pesan di kategori ini!</p>
              </div>
            ) : (
              filteredEntries.map((item) => {
                const isCacian = item.type === 'cacian';
                const isMakian = item.type === 'makian';
                const isNasehat = item.type === 'nasehat';
                const isLiked = likedIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl p-4 sm:p-5.5 space-y-3 transition-colors shadow-sm"
                  >
                    {/* Header Catatan: Nama Pasien, Badge Kategori, Waktu */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-sm sm:text-base shrink-0 border",
                          isCacian ? "bg-rose-500/15 border-rose-500/30 text-rose-300" :
                          isMakian ? "bg-amber-500/15 border-amber-500/30 text-amber-300" :
                          "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                        )}>
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-100 text-sm sm:text-base leading-snug">
                              {item.name}
                            </span>
                            <span className={cn(
                              "text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border",
                              isCacian ? "bg-rose-500/10 text-rose-300 border-rose-500/20" :
                              isMakian ? "bg-amber-500/10 text-amber-300 border-amber-500/20" :
                              "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            )}>
                              {isCacian && '🔥 Cacian'}
                              {isMakian && '🤬 Makian'}
                              {isNasehat && '💡 Nasehat'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400">
                            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{formatLocalTime(item.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Tombol Respon / Like */}
                      <button
                        type="button"
                        onClick={() => handleLike(item.id)}
                        disabled={isLiked}
                        title={isLiked ? "Sudah Anda respon" : "Beri respon / Aamiin"}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer min-h-[36px]",
                          isLiked
                            ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900/50"
                        )}
                      >
                        <Heart className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isLiked ? "fill-rose-400 text-rose-400" : "text-slate-500")} />
                        <span className="font-mono">{item.likes || 0}</span>
                      </button>
                    </div>

                    {/* Isi Pesan Pasien */}
                    <div className="pl-1 sm:pl-2">
                      <p className="text-sm sm:text-base text-slate-200 leading-relaxed break-words whitespace-pre-wrap font-normal">
                        "{item.message}"
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
