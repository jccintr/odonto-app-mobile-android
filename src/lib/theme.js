// Mesmas cores do app web (claro e escuro).
export const LIGHT = {
  bg: '#f4f7f8', surface: '#ffffff', surface2: '#eef3f4', border: '#dbe4e7', text: '#14232b', muted: '#5b7079',
  primary: '#0f766e', primarySoft: '#ccf1ec', primaryFg: '#ffffff',
  danger: '#c2362b', dangerSoft: '#fde4e1', warning: '#a8620a', warningSoft: '#fdeccc', success: '#17803d', successSoft: '#d8f3e1', info: '#1d6fb8', infoSoft: '#dcecfa',
};
export const DARK = {
  bg: '#0c1519', surface: '#131f25', surface2: '#1a2a31', border: '#29393f', text: '#e6eff2', muted: '#93a8b0',
  primary: '#2dd4bf', primarySoft: '#0f3a37', primaryFg: '#04201d',
  danger: '#f2877c', dangerSoft: '#3b1a17', warning: '#f0b45a', warningSoft: '#3a2a0d', success: '#6fd392', successSoft: '#10301c', info: '#7cbcf0', infoSoft: '#11283b',
};

/** 'light' | 'dark' | 'system' + o que o aparelho prefere → paleta */
export const paletteFor = (preference, system) => ((preference === 'system' ? system : preference) === 'dark' ? DARK : LIGHT);

/** tom (info, success…) → { bg, fg } */
export const toneColors = (c, tone) => ({
  neutral: { bg: c.surface2, fg: c.muted }, primary: { bg: c.primarySoft, fg: c.primary }, success: { bg: c.successSoft, fg: c.success },
  warning: { bg: c.warningSoft, fg: c.warning }, danger: { bg: c.dangerSoft, fg: c.danger }, info: { bg: c.infoSoft, fg: c.info },
}[tone] ?? { bg: c.surface2, fg: c.muted });

/** Tablet = tela larga (a partir de 720 dp): lista e detalhe lado a lado */
export const isTabletWidth = (width) => width >= 720;
