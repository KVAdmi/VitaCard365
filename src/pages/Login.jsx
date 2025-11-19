import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { loadRememberMe } from '../lib/rememberMe';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import VitaCard365Logo from '../components/Vita365Logo';

const Login = () => {
  const [checkingSession, setCheckingSession] = useState(true);
  useEffect(() => {
    (async () => {
      const data = await loadRememberMe();
      if (data.rememberEmail && data.email) {
        setFormData((prev) => ({ ...prev, email: data.email }));
        setRememberEmail(true);
      }
      if (data.keepSession) {
        setKeepSession(true);
        console.log('[rememberMe] keepSession desde storage:', data.keepSession);
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('[rememberMe] resultado getSession():', sessionData.session);
        const session = sessionData.session;
        if (session) {
          // Consultar acceso y redirigir
          const { data: perfil } = await supabase
            .from('profiles_certificado_v2')
            .select('acceso_activo')
            .eq('user_id', session.user.id)
            .maybeSingle();
          const accesoActivo = !!perfil?.acceso_activo;
          if (accesoActivo) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/mi-plan', { replace: true });
          }
          return; // No mostrar login
        }
      }
      setCheckingSession(false);
    })();
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isSupabaseConnected, session, access } = useAuth();
  const [rememberEmail, setRememberEmail] = useState(false);
  const [keepSession, setKeepSession] = useState(false);
  // Eliminado segundo useEffect de redirección para evitar saltos entre rutas
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  // Debounce para auto-login
  const debounceRef = useRef(null);

  // Validación de email
  const isValidEmail = (email) => {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  };

  // Auto-submit cuando el usuario termina de escribir password
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Solo dispara si ambos campos tienen valor
    if (!formData.email || !formData.password) return;
    debounceRef.current = setTimeout(() => {
      if (
        isValidEmail(formData.email) &&
        formData.password.length >= 8
      ) {
        // Simula un evento submit para handleSubmit
        if (!loading) {
          const fakeEvent = { preventDefault: () => {} };
          handleSubmit(fakeEvent);
        }
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [formData.email, formData.password]);
  const formRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordLoading, setNewPasswordLoading] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Intentando login con:', formData.email);
      const result = await login(formData.email, formData.password);
      // Verificar metadata must_change_password
      const user = result?.data?.user;
      if (user?.user_metadata?.must_change_password) {
        setShowChangePassword(true);
        return;
      }
      // Guardar flags locales si corresponde
      if (rememberEmail || keepSession) {
        // Importar dinámicamente el helper para evitar romper el build
        import('../lib/rememberMe').then(({ saveRememberMe }) => {
          saveRememberMe({
            email: rememberEmail ? formData.email : '',
            rememberEmail,
            keepSession
          });
        });
      }
      toast({
        title: '¡Bienvenido!',
        description: 'Has iniciado sesión correctamente.',
      });
      setTimeout(() => {
        navigate('/dashboard');
      }, 200);
    } catch (error) {
      console.error('Error de login:', error);
      let errorMessage = 'Credenciales incorrectas. Inténtalo de nuevo.';
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Por favor, confirma tu email antes de iniciar sesión';
      }
      toast({
        title: 'Error de inicio de sesión',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  // Modal para cambio de contraseña obligatorio
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setNewPasswordError('');
    if (newPassword.length < 6) {
      setNewPasswordError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setNewPasswordLoading(true);
    try {
      // Actualiza la contraseña y elimina el flag en metadata
      const { error } = await window.supabase.auth.updateUser({
        password: newPassword,
        data: { must_change_password: false }
      });
      if (error) throw error;
      toast({ title: 'Contraseña actualizada', description: 'Tu nueva contraseña ha sido guardada.' });
      setShowChangePassword(false);
      setTimeout(() => navigate('/dashboard'), 300);
    } catch (err) {
      setNewPasswordError('Error al actualizar la contraseña. Intenta de nuevo.');
    } finally {
      setNewPasswordLoading(false);
    }
  };
  };

  // Auto-submit si el gestor autollenó (Android/iOS pueden no disparar eventos clásicos)
  // Eliminado auto-submit por autollenado para evitar múltiples intentos y rate limit

  const { signInWithGoogle } = useAuth();
  const handleGoogleSuccess = async (googleUser) => {
    setLoading(true);
    try {
      const { sub: id, email, name, picture, accessToken } = googleUser;
      await signInWithGoogle({ id, email, name, picture, accessToken });
      // Consultar perfil certificado por email
      const { data, error } = await window.supabase
        .from('profiles_certificado_v2')
        .select('*')
        .eq('email', email)
        .single();
      if (error || !data) {
        toast({ title: 'No registrado', description: 'No existe un perfil con ese correo. Completa tu registro.', variant: 'destructive' });
        navigate('/register');
        return;
      }
      if (data.acceso_activo) {
        toast({ title: '¡Bienvenido!', description: 'Acceso activo. Ingresando...' });
        navigate('/dashboard');
      } else {
        let msg = 'Tu acceso está restringido.';
        if (data.estado_pago === 'vencido') msg = 'Tu membresía está vencida.';
        else if (data.estado_pago === 'pendiente') msg = 'Tu pago está pendiente.';
        else if (data.estado_pago === 'pagado') msg = 'Tu membresía está activa, pero el acceso está restringido.';
        toast({ title: 'Acceso restringido', description: msg, variant: 'destructive' });
        navigate('/payment-gateway');
      }
    } catch (error) {
      toast({ title: 'Error de Google Login', description: error.message || 'No se pudo iniciar sesión con Google.', variant: 'destructive' });
    }
    setLoading(false);
  };

  useEffect(() => {
    console.log("[Login] renderizado");
  }, []);

  if (checkingSession) return null;
  return (
    <>
      <Helmet>
        <title>Iniciar Sesión - VitaCard 365</title>
        <meta name="description" content="Inicia sesión en VitaCard 365 para acceder a tu cobertura médica, monitoreo de salud y herramientas de bienestar." />
      </Helmet>

      <div className="min-h-screen bg-deep-blue-gradient flex flex-col p-6 relative overflow-hidden">
        <header className="w-full max-w-7xl mx-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </header>

        <div className="flex-1 flex items-center justify-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="glass-card rounded-3xl p-8 md:p-12 shadow-2xl">
              <div className="text-center mb-8">
                <VitaCard365Logo className="h-48 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white">Iniciar Sesión</h2>
                <p className="text-white/70 mt-2">Accede a tu cuenta VitaCard 365</p>
              </div>
              <form id="loginForm" ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80" />
                    <Input
                      id="email"
                      ref={emailRef}
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-12"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      autoComplete="username email"
                      inputMode="email"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80" />
                    <Input
                      id="password"
                      ref={passwordRef}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Tu contraseña"
                      className="pl-12 pr-12"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      autoComplete="current-password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-white/80 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
                {/* Controles de recordar y mantener sesión */}
                <div className="space-y-2 mt-4">
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={keepSession}
                      onChange={e => setKeepSession(e.target.checked)}
                      style={{ accentColor: '#FF6B00' }}
                    />
                    Mantener sesión iniciada en este dispositivo
                  </label>
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={rememberEmail}
                      onChange={e => setRememberEmail(e.target.checked)}
                      style={{ accentColor: '#FF6B00' }}
                    />
                    Recordar mi correo para la próxima vez
                  </label>
                </div>
                <div className="flex justify-end items-center text-sm">
                    <Link
                        to="/reset-password"
                        className="font-semibold text-vita-orange hover:text-vita-orange/80"
                    >
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-vita-orange text-white font-bold text-base"
                  disabled={loading}
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>
              {/* Eliminado GoogleLoginButton */}
              <div className="text-center mt-6 text-sm">
                <span className="text-white/70">¿No tienes cuenta? </span>
                <Link
                  to="/register"
                  className="font-semibold text-vita-orange hover:text-vita-orange/80"
                >
                  Crea tu cuenta aquí
                </Link>
              </div>
            </div>
            {/* Modal de cambio de contraseña obligatorio */}
            {showChangePassword && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <div className="glass-card rounded-2xl p-8 shadow-2xl w-full max-w-md">
                  <h3 className="text-xl font-bold text-white mb-4 text-center">Configura tu nueva contraseña</h3>
                  <p className="text-white/70 mb-4 text-center">Por seguridad, debes establecer una nueva contraseña antes de continuar.</p>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <Input
                      type="password"
                      placeholder="Nueva contraseña (mínimo 6 caracteres)"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      minLength={6}
                      required
                      className="bg-white/10 text-white"
                    />
                    {newPasswordError && <div className="text-red-400 text-sm text-center">{newPasswordError}</div>}
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-vita-orange text-white font-bold"
                      disabled={newPasswordLoading}
                    >
                      {newPasswordLoading ? 'Guardando...' : 'Guardar nueva contraseña'}
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Login;

// Auto-submit con autocompletar del sistema/gestores de contraseñas
// Implementado dentro del componente usando refs y efectos
// Sin romper el flujo existente
Login.displayName = 'Login';