import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { uploadUserAvatar, getAvatarUrl } from '@/lib/avatar';
import { useToast } from '../components/ui/use-toast';
import { LogOut, Save, Copy, Info, Camera, Edit } from 'lucide-react';

const Perfil = () => {
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [membership, setMembership] = useState({
    acceso_activo: null,
    membresia: null,
    periodicidad: null,
    estado_pago: null,
    codigo_vita: null,
  });
  const [profileData, setProfileData] = useState({
    name: '',
    alias: '',
    email: '',
    phone: '',
    curp: '',
    birthDate: '',
    avatarUrl: '',
    bloodType: ''
  });
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user && user.user_metadata) {
      setProfileData({
        name: user.user_metadata.name || '',
        alias: user.user_metadata.alias || '',
        email: user.email || '',
        phone: user.user_metadata.phone || '',
        curp: user.user_metadata.curp || '',
        birthDate: user.user_metadata.birthDate || '',
        avatarUrl: user.user_metadata.avatarUrl || '',
        bloodType: user.user_metadata.bloodType || ''
      });
      if (user.user_metadata.planStatus === 'active' && (!user.user_metadata.phone || !user.user_metadata.curp || !user.user_metadata.birthDate)) {
        setIsEditing(true);
        toast({
          title: 'Completa tu perfil',
          description: 'Ingresa tus datos reales y correctos para que tu póliza se genere perfectamente.',
        });
      }
    }
  }, [user, toast]);

  // Cargar estado real de membresía desde Supabase (profiles_certificado_v2)
  const fetchMembership = async () => {
    try {
      setLoadingAccess(true);
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) { setLoadingAccess(false); return; }
      const { data, error } = await supabase
        .from('profiles_certificado_v2')
        .select('acceso_activo,membresia,periodicidad,estado_pago,codigo_vita,avatar_url')
        .eq('user_id', uid)
        .limit(1)
        .single();
      if (!error && data) setMembership({
        acceso_activo: data.acceso_activo ?? null,
        membresia: data.membresia ?? null,
        periodicidad: data.periodicidad ?? null,
        estado_pago: data.estado_pago ?? null,
        codigo_vita: data.codigo_vita ?? null,
      });
      // Traer avatar firmado si existe
      if (!error && data?.avatar_url) {
        try {
          const signed = await getAvatarUrl(data.avatar_url);
          if (signed) setProfileData(prev => ({ ...prev, avatarUrl: signed }));
        } catch {}
      }
    } finally {
      setLoadingAccess(false);
    }
  };

  useEffect(()=>{ fetchMembership(); }, []);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'phone' && value && value.length !== 10) {
      error = 'El teléfono debe tener 10 dígitos.';
    }
    if (name === 'curp' && value && value.length !== 18) {
      error = 'El CURP debe tener 18 caracteres.';
    }
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    if (isEditing) {
      validateField(name, value);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast({ title: 'Imagen muy grande', description: 'Máximo 1MB.', variant: 'destructive' });
      return;
    }
    try {
      const res = await uploadUserAvatar(file, { table: 'profiles' });
      const url = await getAvatarUrl(res.path);
      setProfileData(prev => ({ ...prev, avatarUrl: url || prev.avatarUrl }));
      toast({ title: 'Avatar actualizado' });
      // Refrescar para que la vista y cache locales se sincronicen
      fetchMembership();
    } catch (err) {
      toast({ title: 'Error al subir', description: err.message || 'Intenta de nuevo', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    let validationErrors = { ...errors };
    if (!profileData.bloodType || profileData.bloodType.trim().length < 2) {
      validationErrors.bloodType = 'El tipo de sangre es obligatorio';
    } else {
      validationErrors.bloodType = '';
    }
    const hasErrors = Object.values(validationErrors).some(e => e !== '');
    if (hasErrors) {
      setErrors(validationErrors);
      toast({
        title: 'Datos inválidos',
        description: 'Por favor, corrige los errores antes de guardar.',
        variant: 'destructive'
      });
      return;
    }
    setErrors(validationErrors);

    try {
      // 1) Persistir en auth.user_metadata para mantener consistencia en cliente
      await updateUser(profileData);
      // 2) Persistir en tabla profiles (si existe columna blood_type)
      try {
        const { data: u } = await supabase.auth.getUser();
        const uid = u?.user?.id;
        if (uid) {
          await supabase.from('profiles').update({
            phone: profileData.phone || null,
            curp: profileData.curp || null,
            birth_date: profileData.birthDate || null,
            blood_type: profileData.bloodType || null,
            name: profileData.name || null,
            alias: profileData.alias || null,
          }).eq('user_id', uid);
        }
      } catch {}
      setIsEditing(false);
      toast({
        title: '¡Éxito!',
        description: 'Tu perfil ha sido actualizado.',
      });
    } catch (error) {
       toast({
        title: 'Error al actualizar',
        description: 'No se pudo guardar tu perfil. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  };
  
  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado', description: 'El código ha sido copiado al portapapeles.' });
  };

  if (!user) return null;

  const Avatar = () => (
    <div className="relative w-24 h-24">
      <div className="w-24 h-24 bg-vita-orange rounded-full flex items-center justify-center overflow-hidden">
        {profileData.avatarUrl ? (
          <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white text-4xl font-bold">{(profileData.alias || profileData.name)?.charAt(0)?.toUpperCase() || 'U'}</span>
        )}
      </div>
      {isEditing && (
        <Button
          size="icon"
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-vita-blue border-2 border-vita-orange"
          onClick={() => fileInputRef.current.click()}
        >
          <Camera className="h-4 w-4 text-vita-orange" />
        </Button>
      )}
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />
    </div>
  );
  
  const FieldLabel = ({ htmlFor, children }) => (
    <Label htmlFor={htmlFor}>
      {children} <span className="text-red-400">*</span>
    </Label>
  );

  return (
    <>
      <Helmet>
        <title>Perfil - VitaCard 365</title>
        <meta name="description" content="Gestiona tu perfil, miembros familiares y preferencias en Vita365." />
      </Helmet>

      <Layout title="Mi Perfil" showBackButton>
        <div className="p-4 space-y-6">
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <Avatar />
              <div>
                <h2 className="text-xl font-bold text-vita-white">{profileData.name}</h2>
                <p className="text-vita-muted-foreground">{profileData.email}</p>
                <p className="text-sm text-vita-orange font-semibold mt-1">
                  Folio VitaCard: {membership.codigo_vita || user.user_metadata?.vita_card_id || '—'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Estado de Membresía (datos reales de Supabase) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>Membresía</CardTitle>
                <CardDescription>Estado real de tu acceso</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchMembership} disabled={loadingAccess}>
                {loadingAccess ? 'Actualizando…' : 'Refrescar'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-white/90">
              <p>
                Acceso: {membership.acceso_activo === null ? '—' : membership.acceso_activo ? '✅ Activo' : '❌ Inactivo'}
              </p>
              <p>
                Plan: {(membership.membresia || '—')} · {(membership.periodicidad || '—')} · {(membership.estado_pago || '—')}
              </p>
              <p>
                Folio: <span className="font-semibold">{membership.codigo_vita || user.user_metadata?.vita_card_id || '—'}</span>
              </p>
            </CardContent>
          </Card>

          {user.user_metadata?.planStatus === 'active' && user.user_metadata?.paymentDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Información del Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-white/90">
                <p>Próximo pago: <span className="font-bold">{new Date(user.user_metadata.paymentDetails.nextPaymentDate).toLocaleDateString()}</span></p>
                <p>Monto: <span className="font-bold">${user.user_metadata.paymentDetails.totalAmount} MXN</span></p>
                {user.user_metadata.familyId && (
                  <div className="pt-2">
                    <Label>Código Familiar para compartir</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={user.user_metadata.familyId} readOnly />
                      <Button size="icon" onClick={() => copyToClipboard(user.user_metadata.familyId)}><Copy className="h-4 w-4"/></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription className="flex items-center gap-2 text-yellow-400">
                <Info className="h-4 w-4"/>
                {isEditing ? 'Ingresa tus datos reales para generar tu póliza.' : 'Tus datos personales.'}
              </CardDescription>
              {isEditing && <p className="text-xs text-vita-muted-foreground pt-2"><span className="text-red-400">*</span> Campo obligatorio</p>}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alias">Alias (cómo te saludamos)</Label>
                <Input id="alias" name="alias" value={profileData.alias} onChange={handleInputChange} disabled={!isEditing} placeholder="Ej: Paty" />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="name">Nombre Completo</FieldLabel>
                <Input id="name" name="name" value={profileData.name} onChange={handleInputChange} disabled={!isEditing} required />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="email">Correo Electrónico</FieldLabel>
                <Input id="email" name="email" value={profileData.email} disabled required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
                  <Input id="phone" name="phone" value={profileData.phone} onChange={handleInputChange} disabled={!isEditing} placeholder="10 dígitos" maxLength="10" required />
                  {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="curp">CURP</FieldLabel>
                  <Input id="curp" name="curp" value={profileData.curp} onChange={handleInputChange} disabled={!isEditing} placeholder="18 caracteres" maxLength="18" required />
                  {errors.curp && <p className="text-xs text-red-400">{errors.curp}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="birthDate">Fecha de Nacimiento</FieldLabel>
                <Input id="birthDate" name="birthDate" type="date" value={profileData.birthDate} onChange={handleInputChange} disabled={!isEditing} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodType">Tipo de Sangre</Label>
                <Input
                  id="bloodType"
                  name="bloodType"
                  type="text"
                  value={profileData.bloodType || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Ejemplo: A+"
                  className="w-full rounded-xl px-4 py-2 bg-white/10 text-white font-bold text-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-vita-orange border border-vita-orange/40"
                  required
                  minLength={2}
                />
                {errors.bloodType && <p className="text-xs text-red-400">{errors.bloodType}</p>}
              </div>
              
              {isEditing ? (
                <Button onClick={handleSave} className="w-full"><Save className="mr-2 h-4 w-4" /> Guardar Cambios</Button>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full"><Edit className="mr-2 h-4 w-4" />Editar Perfil</Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Button variant="destructive" className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </>
  );
};

export default Perfil;