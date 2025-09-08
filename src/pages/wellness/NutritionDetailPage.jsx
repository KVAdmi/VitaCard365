import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Lightbulb, Star, Leaf, CupSoda, Moon, HeartPulse } from 'lucide-react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/use-toast';
import { wellnessData } from '../../data/wellness-data';
import { useUser } from '../../contexts/UserContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "../../components/ui/dialog";

const iconMap = {
  'herbal-jamaica': { icon: HeartPulse },
  'herbal-manzanilla': { icon: Leaf },
  'herbal-jengibre': { icon: Leaf },
  'herbal-canela-ceylan': { icon: Leaf },
  'herbal-menta': { icon: Leaf },
  'herbal-toronjil': { icon: Moon },
  'herbal-desconocidas': { icon: CupSoda },
  'herbal-mezclas-milagrosas': { icon: CupSoda },
  'herbal-altas-dosis': { icon: CupSoda },
};

const HerbalDialogContent = ({ item, onToggleFavorite, isFavorite }) => (
  <DialogContent className="bg-vita-blue-deep/90 backdrop-blur-md border-vita-orange/20 text-white">
    <DialogHeader>
      <DialogTitle className="text-2xl text-vita-orange">{item.title.split('(')[0].trim()}</DialogTitle>
      <DialogDescription className="text-white/80">{item.summary}</DialogDescription>
    </DialogHeader>
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {item.detail.map((section, index) => (
        <div key={index}>
          <h4 className="font-semibold text-white/90 mb-1">{section.title}</h4>
          <ul className="list-disc list-inside text-white/80 space-y-1 text-sm">
            {section.items.map((point, i) => <li key={i}>{point}</li>)}
          </ul>
        </div>
      ))}
    </div>
    <div className="pt-4 border-t border-white/20">
      <Button onClick={(e) => onToggleFavorite(item, e)} variant="ghost" className="hover:bg-white/10 text-white">
        <Star className={`mr-2 h-4 w-4 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : ''}`} />
        {isFavorite ? 'En Favoritos' : 'Añadir a Favoritos'}
      </Button>
    </div>
  </DialogContent>
);

const BulletPointSection = ({ section }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-vita-orange">{section.title}</h3>
      <ul className="space-y-3 list-disc list-inside pl-2">
        {section.items.map((item, index) => (
          <motion.li 
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="text-base text-white"
          >
            {item}
          </motion.li>
        ))}
      </ul>
    </div>
  );
};

const MealPlanSection = ({ section }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-vita-orange">{section.title}</h3>
      <Tabs defaultValue="day-1" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/5">
          {section.days.map(day => (
            <TabsTrigger key={day.day} value={`day-${day.day}`}>Día {day.day}</TabsTrigger>
          ))}
        </TabsList>
        {section.days.map(day => (
          <TabsContent key={day.day} value={`day-${day.day}`}>
            <Card className="bg-transparent border-none">
              <CardContent className="space-y-4 text-sm p-0 pt-4">
                <div>
                  <p className="font-bold text-white/90">Desayuno:</p>
                  <p className="text-white/70">{day.breakfast}</p>
                </div>
                <div>
                  <p className="font-bold text-white/90">Comida:</p>
                  <p className="text-white/70">{day.lunch}</p>
                </div>
                <div>
                  <p className="font-bold text-white/90">Cena:</p>
                  <p className="text-white/70">{day.dinner}</p>
                </div>
                 {day.snack && (
                    <div>
                        <p className="font-bold text-white/90">Snack:</p>
                        <p className="text-white/70">{day.snack}</p>
                    </div>
                 )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

const TipsSection = ({ section }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-xl font-bold text-vita-orange flex items-center">
        <Lightbulb className="mr-2 h-5 w-5" />
        {section.title}
      </h3>
      <ul className="list-disc list-inside space-y-2 pl-2">
        {section.items.map((item, index) => (
          <li key={index} className="text-white/90">{item}</li>
        ))}
      </ul>
    </div>
  );
};

const NutritionCard = ({ item }) => {
  const { toast } = useToast();
  const { favorites, addFavorite, removeFavorite } = useUser();
  const isFavorite = favorites && favorites.some(fav => fav.slug === item.slug);

  const handleToggleFavorite = (itemToToggle, e) => {
    if (e) e.stopPropagation();
    const isCurrentlyFavorite = favorites && favorites.some(fav => fav.slug === itemToToggle.slug);
    if (isCurrentlyFavorite) {
      removeFavorite(itemToToggle.slug);
      toast({ title: 'Eliminado de favoritos' });
    } else {
      addFavorite({ ...itemToToggle, category: 'herbolaria' });
      toast({ title: '¡Guardado en favoritos!', description: 'Podrás encontrarlo en la sección de Bienestar.' });
    }
  };

  if (item.slug === 'herbolaria') {
    return (
      <div className="space-y-4">
        <p className="text-white/80 mb-4 px-2">{item.horizons_tip}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {item.sections.map((herb) => {
            const IconComponent = iconMap[herb.slug]?.icon || Leaf;
            const isHerbFavorite = favorites && favorites.some(fav => fav.slug === herb.slug);
            return (
              <Dialog key={herb.slug}>
                <DialogTrigger asChild>
                  <motion.button
                    className="w-full text-left bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-xl hover:bg-white/15 transition transform hover:-translate-y-0.5 active:scale-[0.99]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-7 w-7 text-[#f06340] flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-base">{herb.title.split('(')[0].trim()}</h3>
                        <p className="text-white/80 text-sm font-normal">{herb.summary}</p>
                      </div>
                    </div>
                  </motion.button>
                </DialogTrigger>
                <HerbalDialogContent item={herb} onToggleFavorite={handleToggleFavorite} isFavorite={isHerbFavorite} />
              </Dialog>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-transparent border-none shadow-none text-white">
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-3xl font-bold">{item.title}</CardTitle>
        <CardDescription className="text-lg text-white/80">{item.subtitle}</CardDescription>
      </CardHeader>

      <CardContent className="p-0 space-y-8">
        {item.horizons_tip && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-vita-blue-deep/30 border border-vita-orange/20 p-4 rounded-xl"
            >
                <p className="text-sm text-white/90 italic">
                    <span className="font-bold text-vita-orange">Mi Tip:</span> {item.horizons_tip}
                </p>
            </motion.div>
        )}

        {item.sections.map((section, index) => {
          switch (section.type) {
            case 'bullets':
              return <BulletPointSection key={index} section={section} />;
            case 'plan':
              return <MealPlanSection key={index} section={section} />;
            case 'tips':
              return <TipsSection key={index} section={section} />;
            default:
              return null;
          }
        })}
      </CardContent>
      
      {item.cta && item.cta.some(c => c.action === 'add_favorite') && (
        <div className="mt-8">
          <Button
            onClick={(e) => handleToggleFavorite(item, e)}
            className="w-full bg-vita-orange hover:bg-vita-orange/90 text-white font-bold text-base"
          >
            <Star className={`mr-2 h-4 w-4 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : ''}`} />
            {isFavorite ? 'En Favoritos' : 'Añadir a Favoritos'}
          </Button>
        </div>
      )}
       <p className="text-center text-xs text-white/50 pt-8">
            Contenido educativo. No sustituye indicaciones médicas.
        </p>
    </Card>
  );
};

const NutritionDetailPage = () => {
  const { slug } = useParams();
  const item = wellnessData.nutricion.items.find(i => i.slug === slug);

  if (!item) {
    return <Navigate to="/bienestar" />;
  }

  return (
    <>
      <Helmet>
        <title>{item.title} - Nutrición - Vita365</title>
        <meta name="description" content={item.subtitle} />
      </Helmet>
      <Layout title={item.title} showBackButton>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="p-4 md:p-6"
        >
          <NutritionCard item={item} />
        </motion.div>
      </Layout>
    </>
  );
};

export default NutritionDetailPage;