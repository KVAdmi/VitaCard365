import React from 'react';
    import { Helmet } from 'react-helmet';
    import { useNavigate } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import PageTransition from '@/components/PageTransition';
    import { useToast } from "@/components/ui/use-toast";

    const Onboarding = () => {
        const navigate = useNavigate();
        const { toast } = useToast();

        const handleLogin = (e) => {
            e.preventDefault();
            toast({
                title: "Inicio de Sesión Exitoso",
                description: "¡Bienvenido de nuevo a Vita365!",
            });
            setTimeout(() => navigate('/dashboard'), 1000);
        };
        
        const handleNotImplemented = () => {
            toast({
                title: "🚧 ¡Función en construcción!",
                description: "Esta opción aún no está disponible. ¡Pronto lo estará! 🚀",
                variant: "destructive"
            });
        };

        return (
            <PageTransition>
                <Helmet>
                    <title>Bienvenido a Vita365</title>
                    <meta name="description" content="Tu bienestar, simplificado. Inicia sesión o regístrate." />
                </Helmet>
                <div className="min-h-screen flex items-center justify-center p-4 bg-vita-background">
                    <motion.div
                        className="w-full max-w-md bg-vita-deepblue p-8 rounded-2xl shadow-2xl"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold text-vita-orange mb-2">Vita365</h1>
                            <p className="text-white">Tu bienestar, simplificado.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-white">Correo Electrónico</Label>
                                <Input id="email" type="email" placeholder="tu@correo.com" className="bg-vita-background border-vita-orange/30 text-white focus:ring-vita-orange" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-white">Contraseña</Label>
                                <Input id="password" type="password" placeholder="********" className="bg-vita-background border-vita-orange/30 text-white focus:ring-vita-orange" required />
                            </div>

                            <Button type="submit" className="w-full bg-vita-orange hover:bg-vita-orange/90 text-white font-bold text-lg py-6">
                                Iniciar Sesión
                            </Button>
                        </form>
                        
                        <div className="mt-4 text-center">
                            <a href="#" onClick={handleNotImplemented} className="text-sm text-vita-orange hover:underline">¿Olvidaste tu contraseña?</a>
                        </div>
                        
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-600" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-vita-deepblue px-2 text-gray-400">O continúa con</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Button variant="outline" className="w-full bg-transparent border-gray-600 hover:bg-white/10 text-white" onClick={handleNotImplemented}>
                                <img src="https://www.vectorlogo.zone/logos/google/google-icon.svg" alt="Google" className="mr-2 h-5 w-5"/>
                                Google
                            </Button>
                             <p className="text-center text-sm text-gray-400">
                                ¿No tienes una cuenta? <a href="#" onClick={handleNotImplemented} className="font-semibold text-vita-orange hover:underline">Regístrate</a>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </PageTransition>
        );
    };

    export default Onboarding;