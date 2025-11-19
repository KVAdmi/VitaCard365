import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import VitaCard365Logo from '../components/Vita365Logo';
import { loadRememberMe } from '../lib/rememberMe';

const Login = () => {
  const navigate = useNavigate();
  const { login, authLoading } = useAuth();
  const { toast } = useToast();

  // Estado de formulario
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberEmail, setRememberEmail] = useState(false);
  const [keepSession, setKeepSession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState(null);

  const formRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // Modal cambio de contraseña (lo dejamos como estaba)
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordLoading, setNewPasswordLoading] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState('');

  // Cargar rememberMe (solo para rellenar email y flags, NO auto-login)
  useEffect(() => {
    (async () => {
      try {
        const data = await loadRememberMe();
        if (data.rememberEmail && data.email) {
          setFormData(prev => ({ ...prev, email: data.email }));
          setRememberEmail(true);
        }
        if (data.keepSession) {
          setKeepSession(true);
        }
      } catch (e) {
        console.warn('[Login] Error cargando rememberMe', e);
      }
    })();
  }, []);

  useEffect(() => {
    console.log('[Login] renderizado');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    try {
      console.log('[Login] intento de login con', formData.email);
      await login(formData.email, formData.password);

      // Guardar flags de rememberMe si corresponde
      if (rememberEmail || keepSession) {
        import('../lib/rememberMe').then(({ saveRememberMe }) => {
          saveRememberMe({
            email: rememberEmail ? formData.email : '',
            rememberEmail,
            keepSession,
          });
        });
      }

      toast({
        title: '¡Bienvenido!',
        description: 'Has iniciado sesión correctamente.',
      });

      // De aquí te mando siempre al dashboard.
      // ProtectedRoute y AuthContext se encargan de mandarte a /mi-plan si tu acceso no está activo.
      navigate('/dashboard');
    } catch (error) {
      console.error('[Login] error de login:', error);
      let errorMessage = 'Credenciales incorrectas. Inténtalo de nuevo.';

      if (error?.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (error?.message?.includes('Email not confirmed')) {
        errorMessage = 'Por favor, confirma tu email antes de iniciar sesión';
      }

      setFormError(errorMessage);
      toast({
        title: 'Error de inicio de sesión',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // (Opcional) handler de cambio obligatorio de contraseña que ya tenías
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setNewPasswordError('');
    if (newPassword.length < 6) {
      setNewPasswordError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setNewPasswordLoading(true);
    try {
      const { error } = await window.supabase.auth.updateUser({
        password: newPassword,
        data: { must_change_password: false },
      });
      if (error) throw error;
      toast({
        title: 'Contraseña actualizada',
        description: 'Tu nueva contraseña ha sido guardada.',
      });
      setShowChangePassword(false);
      setTimeout(() => navigate('/dashboard'), 300);
    } catch (err) {
      setNewPasswordError('Error al actualizar la contraseña. Intenta de nuevo.');
    } finally {
      setNewPasswordLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Iniciar Sesión - VitaCard 365</title>
        <meta
          name="description"
          content="Inicia sesión en VitaCard 365 para acceder a tu cobertura médica, monitoreo de salud y herramientas de bienestar."
        />
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
                  <Label htmlFor="email" className="text-white">
                    Correo Electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80" />
                    <Input
                      id="email"
                      ref={emailRef}
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-12"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
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
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
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
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Controles de recordar y mantener sesión */}
                <div className="space-y-2 mt-4">
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={keepSession}
                      onChange={(e) => setKeepSession(e.target.checked)}
                      style={{ accentColor: '#FF6B00' }}
                    />
                    Mantener sesión iniciada en este dispositivo
                  </label>
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={rememberEmail}
                      onChange={(e) => setRememberEmail(e.target.checked)}
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
                  disabled={authLoading}
                >
                  {authLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>

                {formError && (
                  <div className="text-red-400 text-sm text-center mt-2">
                    {formError}
                  </div>
                )}
              </form>

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
                  <h3 className="text-xl font-bold text-white mb-4 text-center">
                    Configura tu nueva contraseña
                  </h3>
                  <p className="text-white/70 mb-4 text-center">
                    Por seguridad, debes establecer una nueva contraseña antes de
                    continuar.
                  </p>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <Input
                      type="password"
                      placeholder="Nueva contraseña (mínimo 6 caracteres)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      required
                      className="bg-white/10 text-white"
                    />
                    {newPasswordError && (
                      <div className="text-red-400 text-sm text-center">
                        {newPasswordError}
                      </div>
                    )}
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

Login.displayName = 'Login';
