// Stitch MD3 token set — both parent and child use the same light surface (#fdf7ff).
// Legacy keys (childBg, purple, etc.) kept so existing screens compile during transition.
export const Colors = {
  // ── New semantic tokens ────────────────────────────────────────────────────
  surface:                 '#fdf7ff',
  surfaceContainerLow:     '#f8f2fa',
  surfaceContainer:        '#f2ecf4',
  surfaceContainerHigh:    '#ece6ee',
  surfaceContainerHighest: '#e6e0e9',
  white:                   '#ffffff',

  primary:          '#4f378a',
  primaryContainer: '#6750a4',
  primaryFixed:     '#e9ddff',
  primaryFixedDim:  '#cfbcff',

  secondary:          '#63597c',
  secondaryContainer: '#e1d4fd',
  onSecondaryFixed:   '#1f1635',

  tertiary:               '#765b00',
  tertiaryFixed:          '#ffdf93',
  onTertiaryFixed:        '#241a00',
  onTertiaryFixedVariant: '#594400',
  radiantAmber:           '#FFB800',

  onSurface:        '#1d1b20',
  onSurfaceVariant: '#494551',
  outline:          '#7a7582',
  outlineVariant:   '#cbc4d2',

  error:            '#ba1a1a',
  errorContainer:   '#ffdad6',
  success:          '#1a7a4a',
  successContainer: '#d4f7e1',
  warning:          '#b45309',
  warningContainer: '#ffdf93',

  // ── Legacy keys — existing screens reference these; keep until Plans B & C replace them ──
  purple:       '#4f378a',
  purpleLight:  '#6750a4',
  purpleDark:   '#4f378a',

  childBg:      '#fdf7ff',
  childCard:    '#ffffff',
  childBorder:  '#cbc4d2',
  childAccent:  '#4f378a',
  childAccent2: '#FFB800',
  childText:    '#1d1b20',
  childMuted:   '#494551',

  gem:     '#4f378a',
  gemGlow: '#6750a4',

  pending: '#b45309',
  danger:  '#ba1a1a',

  textDark:  '#1d1b20',
  textMid:   '#494551',
  textLight: '#ffffff',
  textMuted: '#494551',

  border:      '#cbc4d2',
  surfaceSoft: '#e9ddff',

  // ── Child (kid) dark gaming ──────────────────────────────────────────────
  kidBg:          '#1a0b2e',
  kidCard:        '#231437',
  kidCardHigh:    '#3d2e52',
  kidBorder:      '#bc13fe',
  kidBorderSoft:  'rgba(188,19,254,0.3)',
  kidText:        '#eddcff',
  kidMuted:       '#d4c0d7',
  kidAccent:      '#ebb2ff',
  kidGreen:       '#2ff801',
  kidGreenText:   '#053900',
  kidGreenDim:    '#2ae500',
  kidActionGreen: '#39ff14',
  kidTabBg:       '#3d2e52',
  kidDark:        '#150629',
  kidErrorBg:     '#93000a',

  // Legacy kid aliases (kept for components that still reference them)
  kidHeader:     '#1a0b2e',
  kidTab:        '#3d2e52',
  kidCardBorder: 'rgba(188,19,254,0.3)',
  kidSegBg:      'rgba(188,19,254,0.12)',
  kidSegOn:      'rgba(188,19,254,0.35)',
  kidIconBg:     'rgba(235,178,255,0.15)',

  // ── Parent light professional ─────────────────────────────────────────────
  parentBg:       '#f8f7f4',
  parentCard:     '#ffffff',
  parentSurface:  '#f0efed',
  parentBorder:   'rgba(157,139,160,0.15)',
  parentText:     '#1a0b2e',
  parentMuted:    '#9d8ba0',
  parentAccent:   '#7ca982',
  parentSecondary:'#e8f0e9',
  parentSecText:  '#254f30',

  // ── Challenge category colours (unchanged) ────────────────────────────────
  cat: {
    phone:    '#FF8E8E',
    outdoor:  '#7DCC8F',
    social:   '#F5A8D8',
    family:   '#FFB07A',
    morning:  '#FFD66B',
    sibling:  '#9DBFE8',
    chores:   '#8FD9C2',
    room:     '#C2DE85',
    garden:   '#94D89E',
    cooking:  '#FFA0A0',
    math:     '#A4B0F0',
    homework: '#C99CE2',
    behavior: '#F0A0BC',
  },
} as const;
