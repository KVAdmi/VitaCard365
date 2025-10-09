import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { wellnessData } from '../../data/wellness-data';
import { Star, CheckCircle } from 'lucide-react';
import AudioPlayer from '../../components/wellness/AudioPlayer';
import BreathingPlayer from '../../components/wellness/BreathingPlayer';

const WellnessDetailPage = () => {
  const { category, slug } = useParams();

  const item = wellnessData[category]?.items.find(i => i.slug === slug);

  const [favorites, setFavorites] = useLocalStorage('vita365_wellness_favorites', []);
  const [completed, setCompleted] = useLocalStorage('vita365_wellness_completed', []);
  
  const isFavorite = favorites.some(fav => fav.id === item?.id && fav.category === category);
  const isCompleted = completed.includes(item?.id);
  
  if (!item) {
    return <Layout title="Error"><p className="p-6 text-center">Contenido no encontrado.</p></Layout>;
  }

  const toggleFavorite = () => {
    if (isFavorite) {
      setFavorites(favorites.filter(fav => fav.id !== item.id));
    } else {
      setFavorites([...favorites, { id: item.id, category: category, title: item.title, summary: item.summary, duration: item.duration, slug: item.slug }]);
    }
  };

  const toggleCompleted = () => {
    if (isCompleted) {
      setCompleted(completed.filter(id => id !== item.id));
    } else {
      setCompleted([...completed, item.id]);
    }
  };
  
  const renderContent = () => {
    switch(item.type) {
      case 'breathing':
        // mapear slug a variantes sugeridas
  const variant = item.slug.includes('cuadrada') ? 'foco' : item.slug.includes('478') ? 'sueño' : item.slug.includes('suspiro') ? 'antiestres' : 'calma';
  return <BreathingPlayer pattern={item.pattern} variant={variant} withSound={true} />;
      case 'audio':
        return <AudioPlayer src={item.audioSrc} />;
      default:
        return <p className="text-white/90 whitespace-pre-line">{item.content}</p>;
    }
  };

  return (
    <>
      <Helmet>
        <title>{item.title} - Vita365</title>
      </Helmet>
      
      <Layout title={item.title} showBackButton>
        <div className="p-4 md:p-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-vita-white mb-2">{item.title}</CardTitle>
                  <CardDescription>{item.summary}</CardDescription>
                </div>
                 <span className="text-sm text-white/70">{item.duration}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderContent()}
              
              <div className="flex justify-start space-x-4 pt-4 border-t border-white/10">
                <Button variant="ghost" onClick={toggleFavorite} className="text-vita-white">
                  <Star className={`mr-2 h-5 w-5 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                  {isFavorite ? 'Favorito' : 'Guardar'}
                </Button>
                <Button variant="ghost" onClick={toggleCompleted} className="text-vita-white">
                  <CheckCircle className={`mr-2 h-5 w-5 ${isCompleted ? 'text-green-400' : ''}`} />
                  {isCompleted ? 'Completado' : 'Marcar hecho'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </>
  );
};

export default WellnessDetailPage;