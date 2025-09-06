import React from 'react';
import Layout from '@/components/Layout';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

const MeasureLayout = ({ title, subtitle, children }) => {
  return (
    <>
      <Helmet>
        <title>{title} - Mi Chequeo | VitaCard 365</title>
        <meta name="description" content={subtitle} />
      </Helmet>
      <Layout title={title} showBackButton={true}>
        <div className="p-4 md:p-6">
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-vita-muted-foreground mb-6 text-center"
          >
            {subtitle}
          </motion.p>
          {children}
        </div>
      </Layout>
    </>
  );
};

export default MeasureLayout;