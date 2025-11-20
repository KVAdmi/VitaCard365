
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { uploadUserAvatar, uploadAvatarBlob, getAvatarUrlCached, clearAvatarUrlCache } from '@/lib/avatar';
import AvatarCropper from '../components/AvatarCropper';
import { useToast } from '../components/ui/use-toast';
import { LogOut, Save, Copy, Info, Camera, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Estado para mostrar la tarjeta de instrucciones tras compra familiar

const Perfil = () => {
  // Detectar si se perdió la sesión tras MercadoPago
  const sessionLost = typeof window !== 'undefined' && window.history && window.history.state && window.history.state.sessionLost;

  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  // Estado para familiares
  const [familyForms, setFamilyForms] = useState([]); // [{name, apellidoPaterno, apellidoMaterno, birthDate, sexo, ...}]
  const [savingFamilia, setSavingFamilia] = useState(false);
  // Estado para mostrar formularios familiares tras pago
  const [showFamiliaForm, setShowFamiliaForm] = useState(false);
  const [showFamiliaInstr, setShowFamiliaInstr] = useState(false);

  // Cargar cantidad de familiares desde user_metadata.familyMembersCount o similar
  useEffect(() => {
    if (showFamiliaForm && user && user.user_metadata && user.user_metadata.familyMembersCount) {
      const count = user.user_metadata.familyMembersCount;
      setFamilyForms(Array(count).fill().map(() => ({
        name: '', apellidoPaterno: '', apellidoMaterno: '', birthDate: '', sexo: ''
      })));
    }
  }, [showFamiliaForm, user]);

  // Manejar cambios en formularios de familiares
  const handleFamilyInputChange = (idx, e) => {
    const { name, value } = e.target;
    setFamilyForms(prev => prev.map((f, i) => i === idx ? { ...f, [name]: value } : f));
  };

  // Guardar todos los familiares en Supabase
  const handleSaveFamiliares = async () => {
    setSavingFamilia(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) throw new Error('Usuario no autenticado');
      // familyId para vincular familiares
      const familyId = user && user.user_metadata ? user.user_metadata.familyId : null;
      // Insertar cada familiar
      for (let fam of familyForms) {
        await supabase.from('family_members').upsert({
          user_id: uid,
          family_id: familyId,
          name: fam.name,
          apellido_paterno: fam.apellidoPaterno,
          apellido_materno: fam.apellidoMaterno,
          birthdate: fam.birthDate,
          sexo: fam.sexo
        }, { onConflict: 'user_id, name, apellido_paterno, apellido_materno' });
      }
      setShowFamiliaForm(false);
      toast({ title: 'Familiares guardados', description: 'Todos los datos han sido registrados correctamente.' });
    } catch (err) {
      toast({ title: 'Error al guardar familiares', description: err.message || 'Intenta de nuevo', variant: 'destructive' });
    }
    setSavingFamilia(false);
  };
  
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
    apellidoPaterno: '',
    apellidoMaterno: '',
    alias: '',
    email: '',
    phone: '',
    curp: '',
    birthDate: '',
    avatarUrl: '',
    bloodType: '',
    sexo: ''
  });
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const [cropperSrc, setCropperSrc] = useState(null);

  useEffect(() => {
    // Cargar datos reales desde Supabase primero
    (async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('name,apellido_paterno,apellido_materno,alias,email,phone,curp,birthdate,avatar_url,blood_type,sexo')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!error && data) {
        setProfileData({
          name: data.name || user.user_metadata.name || '',
          apellidoPaterno: data.apellido_paterno || user.user_metadata.apellidoPaterno || user.user_metadata.apellido_paterno || '',
          apellidoMaterno: data.apellido_materno || user.user_metadata.apellidoMaterno || user.user_metadata.apellido_materno || '',
          alias: data.alias || user.user_metadata.alias || '',
          email: data.email || user.email || '',
          phone: data.phone || user.user_metadata.phone || '',
          curp: data.curp || user.user_metadata.curp || '',
          birthDate: data.birthdate || user.user_metadata.birthDate || '',
          avatarUrl: data.avatar_url || user.user_metadata.avatarUrl || '',
          bloodType: data.blood_type || user.user_metadata.bloodType || '',
          sexo: data.sexo || user.user_metadata.sexo || ''
        });
      } else if (user && user.user_metadata) {
        setProfileData({
          name: user.user_metadata.name || '',
          apellidoPaterno: user.user_metadata.apellidoPaterno || user.user_metadata.apellido_paterno || '',
          apellidoMaterno: user.user_metadata.apellidoMaterno || user.user_metadata.apellido_materno || '',
          alias: user.user_metadata.alias || '',
          email: user.email || '',
          phone: user.user_metadata.phone || '',
          curp: user.user_metadata.curp || '',
          birthDate: user.user_metadata.birthDate || '',
          avatarUrl: user.user_metadata.avatarUrl || '',
          bloodType: user.user_metadata.bloodType || '',
          sexo: user.user_metadata.sexo || ''
        });
      }
      if (user.user_metadata.planStatus === 'active' && (!user.user_metadata.phone || !user.user_metadata.curp || !user.user_metadata.birthDate)) {
        setIsEditing(true);
        toast({
          title: 'Completa tu perfil',
          description: 'Ingresa tus datos reales y correctos para que tu póliza se genere perfectamente.',
        });
      }
    })();
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
          const signed = await getAvatarUrlCached(data.avatar_url);
          if (signed) setProfileData(prev => ({ ...prev, avatarUrl: signed }));
        } catch {}
      }
    } finally {
      setLoadingAccess(false);
    }
  };

  useEffect(()=>{ fetchMembership(); }, []);

  // Cargar datos básicos del perfil desde public.profiles (incluye "sexo")
  useEffect(() => {
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        const uid = u?.user?.id;
        if (!uid) return;
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id,name,apellido_paterno,apellido_materno,birthdate,phone,sexo,codigo_vita,plan_status')
          .eq('user_id', uid)
          .maybeSingle();
        if (!error && data) {
          setProfileData(prev => ({
            ...prev,
            // Prefiere valores del servidor si existen
            name: prev.name || data.name || '',
            apellidoPaterno: prev.apellidoPaterno || data.apellido_paterno || '',
            apellidoMaterno: prev.apellidoMaterno || data.apellido_materno || '',
            phone: data.phone ?? prev.phone ?? '',
            birthDate: (data.birthdate ?? prev.birthDate ?? ''),
            sexo: (data.sexo ?? prev.sexo ?? ''),
          }));
          setMembership(prev => ({
            ...prev,
            codigo_vita: prev.codigo_vita ?? data.codigo_vita ?? prev.codigo_vita,
          }));
        }
      } catch {
        // Silenciar errores de carga inicial
      }
    })();
  }, []);

  const validateField = (name, value) => {
    let error = '';
    if ((name === 'name' || name === 'apellidoPaterno') && isEditing && !value) {
      error = 'Este campo es obligatorio.';
    }
    if (name === 'phone' && value && value.length !== 10) {
      error = 'El teléfono debe tener 10 dígitos.';
    }
    if (name === 'curp' && value && value.length !== 18) {
      error = 'El CURP debe tener 18 caracteres.';
    }
    if (name === 'sexo' && value && !['Masculino','Femenino'].includes(value)) {
      error = 'Selecciona Masculino o Femenino.';
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
    // Abrir cropper con la imagen seleccionada
    const reader = new FileReader();
    reader.onload = () => setCropperSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    let validationErrors = { ...errors };
    if (!profileData.name) {
      validationErrors.name = 'Requerido';
    } else {
      validationErrors.name = '';
    }
    if (!profileData.apellidoPaterno) {
      validationErrors.apellidoPaterno = 'Requerido';
    } else {
      validationErrors.apellidoPaterno = '';
    }
    if (!profileData.phone || profileData.phone.length !== 10) {
      validationErrors.phone = 'El teléfono debe tener 10 dígitos.';
    } else {
      validationErrors.phone = '';
    }
    if (!profileData.bloodType || profileData.bloodType.trim().length < 2) {
      validationErrors.bloodType = 'El tipo de sangre es obligatorio';
    } else {
      validationErrors.bloodType = '';
    }
    if (!profileData.sexo || !['Masculino','Femenino'].includes(profileData.sexo)) {
      validationErrors.sexo = 'Selecciona Masculino o Femenino.';
    } else {
      validationErrors.sexo = '';
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
      // 2) Persistir en tabla profiles (incluye sexo)
      try {
        const { data: u } = await supabase.auth.getUser();
        const uid = u?.user?.id;
        if (uid) {
          const { error: updErr, status } = await supabase.from('profiles').update({
            phone: profileData.phone || null,
            curp: profileData.curp || null,
            birthdate: profileData.birthDate || null,
            blood_type: profileData.bloodType || null,
            name: profileData.name || null,
            apellido_paterno: profileData.apellidoPaterno || null,
            apellido_materno: profileData.apellidoMaterno || null,
            alias: profileData.alias || null,
            sexo: profileData.sexo || null,
          }).eq('user_id', uid);

          // Si no existe el registro, realizar upsert mínimo para crear sexo (sin tocar otras columnas)
          if (updErr && status === 406 /* Not Acceptable from PostgREST on update without match */) {
            await supabase.from('profiles').upsert({
              user_id: uid,
              name: profileData.name || null,
              apellido_paterno: profileData.apellidoPaterno || null,
              apellido_materno: profileData.apellidoMaterno || null,
              birthdate: profileData.birthDate || null,
              sexo: profileData.sexo || null
            }, { onConflict: 'user_id' });
          }
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

  if (sessionLost) {
    return (
      <Layout title="Mi Perfil" showBackButton>
        <div className="p-8 flex flex-col items-center justify-center">
          <Card className="max-w-md w-full p-6 text-center">
            <CardTitle className="text-red-500 mb-2">¡Sesión perdida tras pago!</CardTitle>
            <CardDescription className="mb-4">No pudimos restaurar tu sesión automáticamente después de regresar de MercadoPago. Por favor, inicia sesión nuevamente para ver tu perfil y confirmar tu pago.</CardDescription>
            <Button variant="destructive" onClick={() => navigate('/login', { replace: true })}>Iniciar sesión</Button>
          </Card>
        </div>
      </Layout>
    );
  }
  if (!user) return null;

  const Avatar = () => (
    <div className="relative w-24 h-24">
      <div className="w-24 h-24 bg-vita-orange rounded-full flex items-center justify-center overflow-hidden">
        {(profileData.avatarUrl && /^https?:\/\//i.test(profileData.avatarUrl)) ? (
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
      {showFamiliaInstr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="glass-card rounded-2xl p-6 shadow-2xl max-w-md w-full relative border border-orange-400/30 backdrop-blur-lg">
            <button
              className="absolute top-3 right-3 bg-orange-500/80 hover:bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
              onClick={() => { setShowFamiliaInstr(false); setShowFamiliaForm(true); }}
              aria-label="Cerrar"
            >
              ×
            </button>
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                <Info className="h-8 w-8 text-orange-500" />
              </div>
              <h2 className="text-xl font-bold text-orange-500 mb-2">Completa los datos de tus familiares</h2>
              <p className="text-base text-white/90 text-center mb-2">
                Ingresa los datos completos de cada familiar que agregaste.<br />
                Es importante que la información sea correcta para generar sus certificados y activar la cobertura.
              </p>
              <p className="text-xs text-white/60 text-center">Puedes cerrar esta ventana cuando termines.</p>
            </div>
          </div>
        </div>
      )}
      {showFamiliaForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="glass-card rounded-2xl p-6 shadow-2xl max-w-lg w-full relative border border-orange-400/30 backdrop-blur-lg">
            <button
              className="absolute top-3 right-3 bg-orange-500/80 hover:bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
              onClick={() => setShowFamiliaForm(false)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <div className="flex flex-col items-center gap-3">
              <h2 className="text-xl font-bold text-orange-500 mb-2">Datos de familiares</h2>
              <p className="text-base text-white/90 text-center mb-2">Captura los datos completos de cada familiar.</p>
              <div className="w-full mt-4">
                {familyForms.length === 0 && (
                  <p className="text-white/80 text-center">No hay familiares para capturar. Verifica tu plan familiar.</p>
                )}
                {familyForms.map((fam, idx) => (
                  <Card className="mb-4" key={idx}>
                    <CardHeader>
                      <CardTitle>Familiar {idx + 1}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label htmlFor={`fam_name_${idx}`}>Nombre</Label>
                        <Input id={`fam_name_${idx}`} name="name" value={fam.name} onChange={e => handleFamilyInputChange(idx, e)} placeholder="Nombre(s)" />
                        <Label htmlFor={`fam_apellidoPaterno_${idx}`}>Apellido Paterno</Label>
                        <Input id={`fam_apellidoPaterno_${idx}`} name="apellidoPaterno" value={fam.apellidoPaterno} onChange={e => handleFamilyInputChange(idx, e)} placeholder="Apellido Paterno" />
                        <Label htmlFor={`fam_apellidoMaterno_${idx}`}>Apellido Materno</Label>
                        <Input id={`fam_apellidoMaterno_${idx}`} name="apellidoMaterno" value={fam.apellidoMaterno} onChange={e => handleFamilyInputChange(idx, e)} placeholder="Apellido Materno" />
                        <Label htmlFor={`fam_birthDate_${idx}`}>Fecha de Nacimiento</Label>
                        <Input id={`fam_birthDate_${idx}`} name="birthDate" type="date" value={fam.birthDate} onChange={e => handleFamilyInputChange(idx, e)} />
                        <Label htmlFor={`fam_sexo_${idx}`}>Sexo</Label>
                        <select id={`fam_sexo_${idx}`} name="sexo" value={fam.sexo} onChange={e => handleFamilyInputChange(idx, e)} className="w-full rounded-xl px-4 py-2 bg-white/10 text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-vita-orange border border-vita-orange/40">
                          <option value="">Selecciona…</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Femenino">Femenino</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {familyForms.length > 0 && (
                  <Button className="mt-4 w-full bg-vita-orange text-white" onClick={handleSaveFamiliares} disabled={savingFamilia}>
                    {savingFamilia ? 'Guardando…' : 'Guardar Familiares'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <Helmet>
        <title>Perfil - VitaCard 365</title>
        <meta name="description" content="Gestiona tu perfil, miembros familiares y preferencias en Vita365." />
      </Helmet>

      <Layout title="Mi Perfil" showBackButton>
        <div className="p-4 space-y-6">
          {cropperSrc && (
            <AvatarCropper
              src={cropperSrc}
              onCancel={() => { setCropperSrc(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              onConfirm={async (blob) => {
                try {
                  const res = await uploadAvatarBlob(blob, { table: 'profiles' });
                  clearAvatarUrlCache();
                  const url = await getAvatarUrlCached(res.path);
                  setProfileData(prev => ({ ...prev, avatarUrl: url || prev.avatarUrl }));
                  toast({ title: 'Avatar actualizado' });
                  setCropperSrc(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  fetchMembership();
                } catch (err) {
                  toast({ title: 'Error al subir', description: err.message || 'Intenta de nuevo', variant: 'destructive' });
                }
              }}
            />
          )}
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <Avatar />
              <div>
                <h2 className="text-xl font-bold text-vita-white">{[profileData.name, profileData.apellidoPaterno, profileData.apellidoMaterno].filter(Boolean).join(' ') || profileData.name}</h2>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <FieldLabel htmlFor="name">Nombre(s)</FieldLabel>
                  <Input id="name" name="name" value={profileData.name} onChange={handleInputChange} disabled={!isEditing} required />
                  {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="apellidoPaterno">Apellido Paterno</FieldLabel>
                  <Input id="apellidoPaterno" name="apellidoPaterno" value={profileData.apellidoPaterno} onChange={handleInputChange} disabled={!isEditing} required />
                  {errors.apellidoPaterno && <p className="text-xs text-red-400">{errors.apellidoPaterno}</p>}
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="apellidoMaterno">Apellido Materno</FieldLabel>
                  <Input id="apellidoMaterno" name="apellidoMaterno" value={profileData.apellidoMaterno} onChange={handleInputChange} disabled={!isEditing} />
                </div>
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
                <FieldLabel htmlFor="sexo">Sexo</FieldLabel>
                <select
                  id="sexo"
                  name="sexo"
                  value={profileData.sexo}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full rounded-xl px-4 py-2 bg-white/10 text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-vita-orange border border-vita-orange/40"
                  required
                >
                  <option value="" className="text-black">Selecciona…</option>
                  <option value="Masculino" className="text-black">Masculino</option>
                  <option value="Femenino" className="text-black">Femenino</option>
                </select>
                {errors.sexo && <p className="text-xs text-red-400">{errors.sexo}</p>}
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
          {/* Wallet card removida del Perfil: ahora solo se accede desde el Dashboard */}
        </div>
      </Layout>
    </>
  );
};

export default Perfil;