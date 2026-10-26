export const colors = {
  blue: '#1455B8',
  navy: '#102D61',
  deepNavy: '#09224B',
  gold: '#F3B52B',
  green: '#168A5B',
  red: '#D84A4A',
  ink: '#182C4F',
  muted: '#71809A',
  line: '#E6EBF3',
  canvas: '#F4F7FC',
  white: '#FFFFFF',
  paleBlue: '#EAF2FF',
  paleGold: '#FFF6DE',
  paleGreen: '#E7F6EE',
} as const;

export type ColorName = keyof typeof colors;
