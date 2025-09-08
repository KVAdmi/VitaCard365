
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Layout from '../../components/Layout';
import { Card, CardContent } from '../../components/ui/card';
import { wellnessData } from '../../data/wellness-data.js';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const WellnessCategoryPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  
  const categoryData = wellnessData[category];

  if (!categoryData) {
    return (
      <Layout title="Error" showBackButton>
        <div className="p-6 text-center">
          <p>Categoría no encontrada.</p>
        </div>
      </Layout>
    );
  }
  
  const handleCardClick = (item) => {
    if (category === 'nutricion') {
      navigate(`/bienestar/nutricion/${item.slug}`);
    } else {
      navigate(`/bienestar/${category}/${item.slug}`);
    }
  };

  return (
    <>
      <Helmet>
        <title>{categoryData.name} - Bienestar - Vita365</title>
        <meta name="description" content={`Contenido sobre ${categoryData.name} en Vita365.`} />
      </Helmet>

      <Layout title={categoryData.name} showBackButton>
        <div className="p-4 md:p-6 space-y-4">
          {categoryData.items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card 
                className="cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleCardClick(item)}
              >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1 pr-4">
                       <h3 className="text-vita-white mb-1 font-semibold">{item.title}</h3>
                        <p className="text-white/80 text-sm">{item.subtitle || item.summary}</p>
                       {item.duration && <span className="text-sm text-white/70 block mt-2">{item.duration}</span>}
                    </div>
                    <ArrowRight className="h-5 w-5 text-vita-orange flex-shrink-0" />
                  </CardContent>
              </Card>
            </motion.div>
          ))}
          {category === 'favoritos' && (!categoryData?.items || categoryData.items.length === 0) && (
             <Card className="text-center p-10 bg-white/5 border-white/10">
                <p className="text-white">Aún no tienes favoritos.</p>
                <p className="text-sm text-white/70 mt-1">Guarda contenido para verlo aquí más tarde.</p>
              </Card>
          )}
        </div>
      </Layout>
    </>
  );
};

export default WellnessCategoryPage;
