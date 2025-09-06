
import { useState, useEffect } from 'react';

const INDIVIDUAL_PRICE = 199;

const PAYMENT_FREQUENCIES = {
  monthly: { months: 1, discount: 0, label: 'Mensual' },
  quarterly: { months: 3, discount: 5, label: 'Trimestral' },
  semiannually: { months: 6, discount: 10, label: 'Semestral' },
  annually: { months: 12, discount: 15, label: 'Anual' },
};

export const usePayment = () => {
  const [planType, setPlanType] = useState('individual'); // 'individual' or 'familiar'
  const [familySize, setFamilySize] = useState(1);
  const [frequency, setFrequency] = useState('monthly');
  
  const [totalAmount, setTotalAmount] = useState(INDIVIDUAL_PRICE);
  const [familyDiscount, setFamilyDiscount] = useState(0);
  const [frequencyDiscount, setFrequencyDiscount] = useState(0);

  useEffect(() => {
    const currentFamilySize = planType === 'individual' ? 1 : (familySize < 2 ? 2 : familySize);
    if (planType === 'individual') {
        setFamilySize(1);
    }

    // 1. Calculate family discount
    let currentFamilyDiscount = 0;
    if (planType === 'familiar') {
      if (currentFamilySize >= 2 && currentFamilySize <= 3) {
        currentFamilyDiscount = 15;
      } else if (currentFamilySize >= 4 && currentFamilySize <= 5) {
        currentFamilyDiscount = 30;
      } else if (currentFamilySize > 5) {
        currentFamilyDiscount = 30; // Max discount
      }
    }
    setFamilyDiscount(currentFamilyDiscount);

    // 2. Get frequency details
    const { months, discount: currentFrequencyDiscount } = PAYMENT_FREQUENCIES[frequency];
    setFrequencyDiscount(currentFrequencyDiscount);

    // 3. Calculate total
    const pricePerMemberPerMonth = INDIVIDUAL_PRICE * (1 - currentFamilyDiscount / 100);
    const totalBeforeFrequencyDiscount = pricePerMemberPerMonth * currentFamilySize * months;
    const finalPrice = totalBeforeFrequencyDiscount * (1 - currentFrequencyDiscount / 100);

  // Si el precio calculado es menor o igual a 0, usar el precio individual por defecto
  const safePrice = isNaN(finalPrice) || finalPrice <= 0 ? INDIVIDUAL_PRICE : finalPrice;
  setTotalAmount(safePrice.toFixed(2));

  }, [planType, familySize, frequency]);

  const handleFamilySizeChange = (newSize) => {
    if (planType === 'familiar') {
      setFamilySize(newSize < 2 ? 2 : newSize);
    }
  };

  return {
    planType,
    setPlanType,
    familySize,
    setFamilySize: handleFamilySizeChange,
    frequency,
    setFrequency,
    totalAmount,
    familyDiscount,
    frequencyDiscount,
    individualPrice: INDIVIDUAL_PRICE,
    paymentFrequencies: PAYMENT_FREQUENCIES,
  };
};
