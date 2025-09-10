import React, { useState } from 'react';
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
import GoogleLoginButton from '../components/ui/GoogleLoginButton';

const Login = () => {
  const navigate = useNavigate();
  const { login, isSupabaseConnected } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast({
        title: '¡Bienvenido!',
        description: 'Has iniciado sesión correctamente.',
      });
      navigate('/dashboard');
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
  };

  const { signInWithGoogle } = useAuth();
  const handleGoogleSuccess = async (googleUser) => {
    setLoading(true);
    try {
      const { sub: id, email, name, picture, accessToken } = googleUser;
      await signInWithGoogle({ id, email, name, picture, accessToken });
      toast({ title: '¡Bienvenido!', description: 'Has iniciado sesión correctamente con Google.' });
      navigate('/dashboard');
    } catch (error) {
      toast({ title: 'Error de Google Login', description: error.message || 'No se pudo iniciar sesión con Google.', variant: 'destructive' });
    }
    setLoading(false);
  };

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
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-12"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Tu contraseña"
                      className="pl-12 pr-12"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-transparent px-2 text-white/70 backdrop-blur-sm">O continúa con</span>
                </div>
              </div>

              <GoogleLoginButton onSuccess={handleGoogleSuccess} />

              <div className="text-center mt-6 text-sm">
                <span className="text-white/70">¿No tienes cuenta? </span>
                <Link
                  to="/register"
                  className="font-semibold text-vita-orange hover:text-vita-orange/80"
                >
                  Regístrate aquí
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Login;