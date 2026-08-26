import { useState, FormEvent } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  AlertCircle, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Briefcase,
  UserPlus,
  LogIn
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { JpbSrlLogo } from './JpbSrlLogo';
import { UserRole } from '../types';

export const AuthScreen = () => {
  const { currentUser, userProfile, login, register, logout, isLoading } = useAuth();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [requestedRole, setRequestedRole] = useState<UserRole>('administrativo');
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is logged in but pending approval
  if (currentUser && userProfile && userProfile.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center backdrop-blur-xl">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5 text-amber-400 shadow-inner">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">
            Cuenta Pendiente de Aprobación
          </h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Hola <span className="font-semibold text-slate-200">{userProfile.displayName || currentUser.email}</span>. Tu cuenta ha sido registrada con éxito. Por motivos de seguridad y auditoría, todo nuevo usuario requiere <strong className="text-amber-300">autorización previa</strong> de la administración de JPB SRL antes de acceder a los datos financieros.
          </p>

          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 mb-6 text-left text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Correo Electrónico:</span>
              <span className="font-mono text-slate-300 font-semibold">{userProfile.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Rol Solicitado:</span>
              <span className="font-semibold text-amber-400 uppercase tracking-wider text-[11px]">{userProfile.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Estado Actual:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Pendiente de Aprobación
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-6">
            El Superadministrador (<strong className="text-slate-400">Fernando Laso</strong>) te asignará los permisos y obras correspondientes.
          </p>

          <button
            onClick={() => logout()}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition border border-slate-700 cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // If user is rejected or inactive
  if (currentUser && userProfile && userProfile.status === 'rejected') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-900/30 rounded-3xl p-8 shadow-2xl text-center backdrop-blur-xl">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5 text-rose-400">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">
            Acceso No Autorizado
          </h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Tu acceso al sistema no fue autorizado o ha sido revocado. Contacta al Administrador Maestro de JPB SRL (<span className="text-slate-200">fernandoj.laso@gmail.com</span>).
          </p>
          <button
            onClick={() => logout()}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition border border-slate-700 cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        if (!name.trim()) {
          setError('Por favor ingresa tu nombre y apellido.');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres.');
          setIsSubmitting(false);
          return;
        }
        await register(email, password, name, requestedRole);
        setRegisteredSuccess(true);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Ocurrió un error al procesar el ingreso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-slate-950">
      <div className="max-w-md w-full">
        {/* Brand Header with JPB SRL Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <JpbSrlLogo variant="card" size="md" />
          </div>
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Sistema Integral de Control Financiero de Obras & Gestión de Fondos
          </p>
        </div>

        {/* Login/Register Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
              <span>{isRegistering ? 'Crear Cuenta & Solicitar Acceso' : 'Ingreso al Sistema'}</span>
            </h1>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Motor Propio Seguro
            </span>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {registeredSuccess && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>Cuenta registrada correctamente. Tu acceso ha sido enviado para aprobación.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name input for registration */}
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre y Apellido
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Ing. Juan Pérez"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400 transition placeholder:text-slate-600"
                  />
                </div>
              </div>
            )}

            {/* Email input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Correo Electrónico
                </label>
                {!isRegistering && email !== 'fernandoj.laso@gmail.com' && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('fernandoj.laso@gmail.com');
                      setError(null);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-medium cursor-pointer transition hover:underline"
                  >
                    👑 Autocompletar Superadmin
                  </button>
                )}
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@jpbsrl.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400 transition placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  {isRegistering ? 'Crear Contraseña' : 'Contraseña'}
                </label>
                {isRegistering && (
                  <span className="text-[11px] text-slate-500">Mínimo 6 caracteres</span>
                )}
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegistering ? 'Elige tu clave de acceso' : '••••••••'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400 transition placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Role selector during registration */}
            {isRegistering && (
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Rol / Función Solicitada:</span>
                  <span className="text-[10px] text-amber-400 font-normal">Requiere Aprobación</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <select
                    value={requestedRole}
                    onChange={(e) => setRequestedRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 transition cursor-pointer appearance-none"
                  >
                    <option value="administrativo">💼 Administrativo (Carga de Ingresos, Egresos y Liquidaciones)</option>
                    <option value="comitente">🏢 Comitente / Cliente (Solo Lectura de sus Obras Asignadas)</option>
                    <option value="director">📋 Director de Proyecto (Administración y Control)</option>
                  </select>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  * El Superadministrador asignará las obras y confirmará el rol final.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {isSubmitting ? (
                <span>Procesando acceso...</span>
              ) : isRegistering ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Crear Cuenta y Solicitar Aprobación</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between login and registration */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
                setRegisteredSuccess(false);
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium transition cursor-pointer flex items-center justify-center gap-1.5 mx-auto hover:underline"
            >
              {isRegistering ? (
                <>
                  <LogIn className="h-3.5 w-3.5" />
                  <span>¿Ya tienes una cuenta registrada? Iniciar Sesión</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>¿No tienes cuenta? Regístrate y solicita acceso</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Superadmin note */}
        <div className="mt-5 text-center">
          <p className="text-[11px] text-slate-500">
            👑 Superadministrador Maestro: <span className="text-slate-400 font-medium">fernandoj.laso@gmail.com</span>
          </p>
        </div>
      </div>
    </div>
  );
};
