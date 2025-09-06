import React, { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser debe ser usado dentro de UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [coverageUsage, setCoverageUsage] = useLocalStorage('vita365_coverage', {});
  const [healthData, setHealthData] = useLocalStorage('vita365_health', {
    bloodPressure: [],
    symptoms: [],
    healthDiary: [],
    testResults: []
  });
  const [medications, setMedications] = useLocalStorage('vita365_medications', []);
  const [appointments, setAppointments] = useLocalStorage('vita365_appointments', []);
  const [wellnessPreferences, setWellnessPreferences] = useLocalStorage('vita365_wellness_preferences', {});
  const [groceryList, setGroceryList] = useLocalStorage('vita365_grocery_list', []);
  const [savedPlans, setSavedPlans] = useLocalStorage('vita365_plans_saved', []);
  const [checkedItems, setCheckedItems] = useLocalStorage('vita365_wellness_checked', {});
  const [favorites, setFavorites] = useLocalStorage('vita365_favorites', []);
  const [completed, setCompleted] = useLocalStorage('vita365_completed', []);

  const trackCoverageUsage = useCallback((serviceId) => {
    setCoverageUsage(prevUsage => ({
      ...prevUsage,
      [serviceId]: (prevUsage[serviceId] || 0) + 1
    }));
  }, [setCoverageUsage]);

  const addHealthData = (type, data) => {
    setHealthData(prevHealthData => ({
      ...prevHealthData,
      [type]: [...(prevHealthData[type] || []), { ...data, id: Date.now(), date: new Date().toISOString() }]
    }));
  };

  const addMedication = (medication) => {
    setMedications(prevMeds => [...prevMeds, { ...medication, id: Date.now() }]);
  };

  const addAppointment = (appointment) => {
    setAppointments(prevApps => [...prevApps, { ...appointment, id: Date.now() }]);
  };

  const toggleCheckedItem = (slug, item) => {
    setCheckedItems(prev => {
      const currentItems = prev[slug] || [];
      const newItems = currentItems.includes(item)
        ? currentItems.filter(i => i !== item)
        : [...currentItems, item];
      return { ...prev, [slug]: newItems };
    });
  };

  const addFavorite = (item) => {
    setFavorites(prev => [...(prev || []).filter(fav => fav.slug !== item.slug), item]);
  };

  const removeFavorite = (slug) => {
    setFavorites(prev => (prev || []).filter(fav => fav.slug !== slug));
  };
  
  const addCompleted = (slug) => {
    setCompleted(prev => [...new Set([...(prev || []), slug])]);
  };

  const value = {
    coverageUsage,
    healthData,
    medications,
    appointments,
    trackCoverageUsage,
    addHealthData,
    addMedication,
    addAppointment,
    wellnessPreferences,
    setWellnessPreferences,
    groceryList,
    setGroceryList,
    savedPlans,
    setSavedPlans,
    checkedItems,
    toggleCheckedItem,
    favorites,
    addFavorite,
    removeFavorite,
    completed,
    addCompleted
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};