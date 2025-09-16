import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { LogOut, Save, Copy, Info, Camera, Edit } from 'lucide-react';

const Perfil = () => {
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    alias: '',
    email: '',
    phone: '',
    curp: '',
    birthDate: '',
    avatarUrl: ''
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
        avatarUrl: user.user_metadata.avatarUrl || ''
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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1050 * 1050 * 5) { // Approx 5MB limit
        toast({
          title: "Imagen muy grande",
          description: "Por favor, elige una imagen de menos de 5MB.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, avatarUrl: reader.result }));
        // Guardar en Supabase
        updateUser({ ...profileData, avatarUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const currentErrors = Object.values(errors).filter(e => e !== '');
    if (currentErrors.length > 0) {
      toast({
        title: 'Datos inválidos',
        description: 'Por favor, corrige los errores antes de guardar.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await updateUser(profileData);
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
        accept="image/png, image/jpeg"
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
                <p className="text-sm text-vita-orange font-semibold mt-1">Folio VitaCard: {user.user_metadata?.vita_card_id}</p>
              </div>
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