// Ficha do paciente: textos da anamnese.
export const ANAMNESIS_CONDITIONS = [
  ['diabetes', 'Diabetes'], ['hypertension', 'Hipertensão'], ['heart', 'Problema cardíaco'], ['bleeding', 'Problema de coagulação / sangramento'],
  ['anticoagulant', 'Usa anticoagulante'], ['asthma', 'Asma / problema respiratório'], ['hepatitis', 'Hepatite'], ['hiv', 'HIV'],
  ['epilepsy', 'Epilepsia'], ['kidney', 'Problema renal'],
];

export const emptyAnamnesis = () => ({ allergies: '', medications: '', conditions: [], smoker: false, pregnant: false, notes: '' });
export const readAnamnesis = (raw) => ({ ...emptyAnamnesis(), ...(raw && typeof raw === 'object' ? raw : {}) });
export const conditionLabels = (keys = []) => keys.map((k) => ANAMNESIS_CONDITIONS.find(([id]) => id === k)?.[1] ?? k);
