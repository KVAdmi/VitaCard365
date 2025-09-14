
import { useState, useEffect } from 'react';

const INDIVIDUAL_PRICE = 199;

const PAYMENT_FREQUENCIES = {
  monthly: { months: 1, discount: 0, label: 'Mensual' }, // Individual: 199, Familiar: titular + 1, Desc 10%
  quarterly: { months: 3, discount: 10, label: 'Trimestral' }, // Individual: desc 10%, Familiar: hasta 3, Desc 15%
  semiannually: { months: 6, discount: 15, label: 'Semestral' }, // Individual: desc 15%, Familiar: más de 3, Desc 20%
  annually: { months: 12, discount: 20, label: 'Anual' }, // Individual: desc 20%
};

export const usePayment = () => {
  const [planType, setPlanType] = useState('individual'); // 'individual' or 'familiar'
  const [familySize, setFamilySize] = useState(2);
  const [frequency, setFrequency] = useState('monthly');
  
  const [totalAmount, setTotalAmount] = useState(INDIVIDUAL_PRICE);
  const [familyDiscount, setFamilyDiscount] = useState(0);
  const [frequencyDiscount, setFrequencyDiscount] = useState(0);

  useEffect(() => {
    let currentFamilySize = planType === 'individual' ? 1 : (familySize < 2 ? 2 : familySize);
    if (planType === 'individual') {
      currentFamilySize = 1;
      if (familySize !== 1) setFamilySize(1);
    } else {
      if (familySize < 2) setFamilySize(2);
    }

    // 1) Descuento familiar por número de integrantes
    let currentFamilyDiscount = 0;
    if (planType === 'familiar') {
      if (currentFamilySize === 2) {
        currentFamilyDiscount = 10;
      } else if (currentFamilySize === 3 || currentFamilySize === 4) {
        currentFamilyDiscount = 15;
      } else if (currentFamilySize >= 5) {
        currentFamilyDiscount = 20;
      }
    }
    setFamilyDiscount(currentFamilyDiscount);

  // 2) Descuento por frecuencia
  let { months, discount: currentFrequencyDiscount, label } = PAYMENT_FREQUENCIES[frequency];
  // Si es familiar y no es mensual, el descuento por tiempo es 5%
  if (planType === 'familiar' && frequency !== 'monthly') {
    currentFrequencyDiscount = 5;
  }
  setFrequencyDiscount(currentFrequencyDiscount);

  // 3) Cálculo final
  const baseTotal = INDIVIDUAL_PRICE * currentFamilySize * months;
  const afterFamily = baseTotal * (1 - currentFamilyDiscount / 100);
  const finalPrice = afterFamily * (1 - currentFrequencyDiscount / 100);

  // Ahorros
  const familySavings = baseTotal - afterFamily;
  const freqSavings = afterFamily - finalPrice;
  const totalSavings = baseTotal - finalPrice;

  // Estado principal (string para UI actual)
  const safePrice = isNaN(finalPrice) || finalPrice <= 0 ? INDIVIDUAL_PRICE : finalPrice;
  setTotalAmount(safePrice.toFixed(2));

    // Guarda breakdown en refs/estado si lo prefieres; aquí lo exponemos por return
    // (no setState adicional para evitar renders extra)
  }, [planType, familySize, frequency]);

  const handleFamilySizeChange = (newSize) => {
    if (planType === 'familiar') {
      setFamilySize(newSize < 2 ? 2 : newSize);
    } else {
      setFamilySize(1);
    }
  };

  return {
    planType,
    setPlanType,
    familySize,
    setFamilySize: handleFamilySizeChange,
    frequency,
    setFrequency,
    totalAmount,                    // string con 2 decimales (como ya lo usas)
    familyDiscount,                 // %
    frequencyDiscount,              // %
    individualPrice: INDIVIDUAL_PRICE,
    paymentFrequencies: PAYMENT_FREQUENCIES,

    // NUEVO: datos para mostrar ahorro/desglose
    get breakdown() {
      let { months, discount: freqDiscount } = PAYMENT_FREQUENCIES[frequency];
      if (planType === 'familiar' && frequency !== 'monthly') {
        freqDiscount = 5;
      }
      const currentFamilySize = planType === 'individual' ? 1 : (familySize < 2 ? 2 : familySize);
      const baseTotal = INDIVIDUAL_PRICE * currentFamilySize * months;
      let familyDiscount = 0;
      if (planType === 'familiar') {
        if (currentFamilySize === 2) familyDiscount = 10;
        else if (currentFamilySize === 3 || currentFamilySize === 4) familyDiscount = 15;
        else if (currentFamilySize >= 5) familyDiscount = 20;
      }
      const afterFamily = baseTotal * (1 - familyDiscount / 100);
      const finalPrice = afterFamily * (1 - freqDiscount / 100);
      const familySavings = baseTotal - afterFamily;
      const freqSavings = afterFamily - finalPrice;
      const totalSavings = baseTotal - finalPrice;
      return {
        months,
        baseTotal: baseTotal.toFixed(2),
        afterFamily: afterFamily.toFixed(2),
        familySavings: familySavings.toFixed(2),
        freqSavings: freqSavings.toFixed(2),
        totalSavings: totalSavings.toFixed(2),
      };
    },
  };
};
