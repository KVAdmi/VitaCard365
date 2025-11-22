import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
const isIOS = Capacitor.getPlatform() === 'ios';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../components/ui/use-toast';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Ticket } from 'lucide-react';
import { validateSellerCode, PromoStorage } from '@/lib/codes';
import VitaCard365Logo from '../components/Vita365Logo';
              {/* Eliminado GoogleLoginButton para evitar error de referencia */}

const Register = () => {
  const navigate = useNavigate();
  const { register, isSupabaseConnected } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    activationCode: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });
      if (error) {
        toast({
          title: 'Error de Registro',
          description: error.message,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      // Asegurar sesión activa
      if (!data.session) {
        const { error: e2 } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        if (e2) {
          toast({
            title: 'Error de Registro',
            description: e2.message,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      // Si proporcionó un código de activación, verificar en Supabase si está pagado/activo
      // Si proporcionó un código de activación, verificar en Supabase si está pagado/activo
      if (code) {
        try {
          // Buscar el código en profiles_certificado_v2
          const { data: folio, error: qErr } = await supabase
            .from('profiles_certificado_v2')
            .select('codigo_vita, estado_pago, acceso_activo, membresia')
            .eq('codigo_vita', code)
            .maybeSingle();

          if (!qErr && folio && (folio.acceso_activo || (folio.estado_pago || '').toLowerCase() === 'pagado')) {
            // Asociar este folio al usuario actual y activar acceso (si políticas lo permiten)
            const { data: u } = await supabase.auth.getUser();
            const uid = u?.user?.id;
            if (uid) {
              await supabase
                .from('profiles_certificado_v2')
                .upsert({ user_id: uid, codigo_vita: code, acceso_activo: true, estado_pago: folio.estado_pago || 'pagado', membresia: folio.membresia || 'individual' }, { onConflict: 'user_id' });
            }
            toast({ title: '¡Registro exitoso!', description: 'Tu folio fue validado. Completa tu perfil.' });
            if (folio.acceso_activo) {
              navigate('/dashboard');
            } else {
              navigate('/payment-gateway');
            }
            navigate('/perfil');
            return;
          }

          // Si no es un folio pagado, intentamos validarlo como código de vendedor (AA999)
          const v = await validateSellerCode(code);
          if (v.valid) {
            PromoStorage.save(code);
            toast({ title: 'Código aplicado', description: `Se aplicará precio preferencial: $${v.discount_price} por persona/mes.` });
            navigate('/payment-gateway');
            return;
          }
        } catch (e) {
          // Si algo falla, seguirá el flujo normal a pago
          console.warn('[register] Validación de folio falló o no aplica:', e);
        }
      }

      // Sin código válido pagado: ir a pasarela de pago
      toast({
        title: '¡Cuenta creada!',
        description: 'Continúa con el pago para activar tu membresía.',
      });
      navigate('/payment-gateway');
    } catch (error) {
      toast({
        title: 'Error de Registro',
        description: error.message || 'Hubo un problema al crear tu cuenta. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (googleUser) => {
    setLoading(true);
    try {
      const { sub: id, email, name, picture, accessToken } = googleUser;
      toast({ title: '¡Registro exitoso!', description: 'Tu cuenta ha sido creada con Google.' });
      navigate('/perfil');
    } catch (error) {
      toast({ title: 'Error de Google Registro', description: error.message || 'No se pudo registrar con Google.', variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Registrarse - VitaCard 365</title>
        <meta name="description" content="Crea tu cuenta en VitaCard 365 y comienza a disfrutar de cobertura médica integral." />
      </Helmet>

      <div className="min-h-screen bg-deep-blue-gradient flex flex-col p-6 relative overflow-hidden">
  <header className={`w-full ${isIOS ? 'pt-6' : 'pt-2'} pb-2 z-50 max-w-7xl mx-auto z-10`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </header>

        <div className="flex-1 flex items-center justify-center z-10 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="glass-card rounded-3xl p-8 md:p-12 shadow-2xl">
              <div className="text-center mb-8">
                <VitaCard365Logo className="h-48 mx-auto mb-6" /> {/* Aumentado el tamaño */}
                <h2 className="text-3xl font-bold text-white">Crear Cuenta</h2>
                <p className="text-white/70 mt-2">Únete a la familia VitaCard 365</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80" />
                    <Input id="name" type="text" placeholder="Tu nombre completo" className="pl-12" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80" />
                    <Input id="email" type="email" placeholder="tu@email.com" className="pl-12" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" className="pl-12 pr-12" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-white/80 hover:text-white" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80" />
                    <Input id="confirmPassword" type="password" placeholder="Confirma tu contraseña" className="pl-12" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activationCode">¿Tienes folio VITA o código de descuento? Ingrésalo aquí</Label>
                  <div className="relative">
                    <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80" />
                    <Input id="activationCode" type="text" placeholder="Ej: VITAFAM-XXXX o AA999" className="pl-12" value={formData.activationCode} onChange={(e) => setFormData({ ...formData, activationCode: e.target.value.toUpperCase() })} />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full bg-vita-orange text-white font-bold text-base mt-6" disabled={loading}>
                  {loading ? 'Creando cuenta...' : 'Continuar'}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/20" /></div>
                <div className="relative flex justify-center text-sm"><span className="bg-transparent px-2 text-white/70 backdrop-blur-sm">O continúa con</span></div>
              </div>

              <GoogleLoginButton context="register" />

              <div className="text-center mt-6 text-sm">
                <span className="text-white/70">¿Ya tienes cuenta? </span>
                <Link to="/login" className="font-semibold text-vita-orange hover:text-vita-orange/80">
                  Inicia sesión aquí
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Register;