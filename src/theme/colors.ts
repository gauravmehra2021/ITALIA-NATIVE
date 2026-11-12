export const colors = {
  blue: '#0F4BB5',
  navy: '#0C2B64',
  deepNavy: '#071E48',
  gold: '#E8AC24',
  green: '#0F8A4B',
  red: '#CE2B37',
  ink: '#13264A',
  muted: '#6A7A96',
  line: '#E4EAF4',
  canvas: '#F5F8FD',
  white: '#FFFFFF',
  paleBlue: '#EBF2FF',
  paleGold: '#FFF6DF',
  paleGreen: '#E7F6EE',
} as const;

export type ColorName = keyof typeof colors;
