'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ShieldAlert, Copy, CheckCheck, FileText, CheckSquare, Clipboard } from 'lucide-react';
import { saveSession } from '@/lib/auth';
import AppLogo from '@/components/ui/AppLogo';

type LoginFormValues = {
  username: string;
  password: string;
  remember: boolean;
};

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    defaultValues: { username: '', password: '', remember: false }
  });

  function onSubmit(data: LoginFormValues) {
    setLoginError('');
    return new Promise<void>((resolve) => {
      // Call backend API which authenticates via Supabase
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: data.username, password: data.password }),
      })
        .then(async (res) => {
          if (res.ok) {
            const { user } = await res.json();
            // Save session locally for UI state
            saveSession(user);
            router.replace('/');
          } else {
            setLoginError(
              'Kredensial tidak valid — gunakan akun demo di bawah untuk masuk.'
            );
          }
        })
        .catch(() => {
          setLoginError('Gagal terhubung ke server. Silakan coba lagi.');
        })
        .finally(() => resolve());
    });
  }

  function handleCopy(text: string, fieldId: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    });
  }

  function handleUseCredential(username: string, password: string) {
    setValue('username', username);
    setValue('password', password);
  }

  const ADMIN_CREDENTIALS = [
    { username: 'admin.cyclecount', password: 'CC@dmin2026', user: { role: 'Administrator' } },
    { username: 'supervisor.cc', password: 'Sup3rv1sor!', user: { role: 'Supervisor' } },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-10 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute bottom-10 -left-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/3" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <AppLogo size={40} />
          <span className="font-bold text-xl text-white tracking-tight">Cycle Count Tracker</span>
        </div>

        {/* Center content */}
        <div className="relative flex-1 flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Sistem Pendataan<br />
              Hasil Scan Berkas
            </h1>
            <p className="text-white/70 text-base leading-relaxed">
              Platform khusus Divisi Cycle Count untuk mencatat, melacak, dan mengelola hasil scan berkas SO, Approval, dan Form Pickup secara terpusat.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            {[
            { icon: <FileText size={18} />, label: 'Tracker Hasil SO', desc: 'Pantau status scan per perusahaan' },
            { icon: <CheckSquare size={18} />, label: 'Tracker Approval', desc: 'Kelola approval per week & tanggal' },
            { icon: <Clipboard size={18} />, label: 'Form Scan Pickup', desc: 'Lacak status scan & adjust pickup' }].
            map((f) =>
            <div key={`feature-${f.label}`} className="flex items-center gap-4 bg-white/10 rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.label}</p>
                  <p className="text-white/60 text-xs">{f.desc}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer note */}
        <div className="relative flex items-center gap-2 text-white/40 text-xs">
          <ShieldAlert size={13} />
          <span>Akses terbatas — hanya untuk admin yang berwenang</span>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <AppLogo size={36} />
            <span className="font-bold text-xl text-primary tracking-tight">CycleTracker</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Masuk ke Dashboard</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Masukkan username dan password admin untuk melanjutkan.
            </p>
          </div>

          {/* Admin-only notice */}
          <div className="flex items-start gap-3 bg-warning-bg border border-warning/20 rounded-xl px-4 py-3 mb-6">
            <ShieldAlert size={16} className="text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-warning font-medium">
              Halaman ini hanya dapat diakses oleh admin yang telah terdaftar. Akses tidak sah akan dicatat.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Username
              </label>
              <input
                {...register('username', { required: 'Username wajib diisi' })}
                type="text"
                placeholder="Masukkan username admin"
                autoComplete="username"
                className="input-field" />

              {errors.username &&
              <p className="mt-1 text-xs text-danger">{errors.username.message}</p>
              }
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password', { required: 'Password wajib diisi' })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  className="input-field pr-10" />

                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>

                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password &&
              <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
              }
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                {...register('remember')}
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-border text-primary focus:ring-ring" />

              <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                Ingat saya di perangkat ini
              </label>
            </div>

            {/* Error message */}
            {loginError &&
            <div className="flex items-start gap-3 bg-danger-bg border border-danger/20 rounded-xl px-4 py-3">
                <ShieldAlert size={15} className="text-danger flex-shrink-0 mt-0.5" />
                <p className="text-xs text-danger font-medium">{loginError}</p>
              </div>
            }

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary w-full justify-center py-3 text-base"
              disabled={isSubmitting}>

              {isSubmitting ?
              <span className="flex items-center gap-2 justify-center">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Memverifikasi...
                </span> :
              'Masuk'}
            </button>
          </form>

          {/* Demo credentials box */}
          <div className="mt-6 card-base p-4 border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">PILIH AKUN

            </p>
            <div className="space-y-2">
              {ADMIN_CREDENTIALS.map((cred) =>
              <div
                key={`demo-${cred.username}`}
                className="flex items-center justify-between gap-3 bg-muted/60 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors">

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{cred.user.role}</p>
                    <p className="text-xs text-muted-foreground font-tabular truncate">{cred.username}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                    type="button"
                    onClick={() => handleCopy(cred.username, `user-${cred.username}`)}
                    className="p-1.5 rounded hover:bg-border transition-colors text-muted-foreground hover:text-foreground"
                    title="Salin username">

                      {copiedField === `user-${cred.username}` ?
                    <CheckCheck size={13} className="text-success" /> :

                    <Copy size={13} />
                    }
                    </button>
                    <button
                    type="button"
                    onClick={() => handleUseCredential(cred.username, cred.password)}
                    className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg hover:bg-primary/20 transition-colors">

                      Gunakan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            CycleTracker v1.0 — Divisi Cycle Count · 2026
          </p>
        </div>
      </div>
    </div>);

}