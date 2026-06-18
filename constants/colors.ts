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

  parentBg:     '#fdf7ff',
  parentCard:   '#ffffff',
  parentBorder: '#cbc4d2',

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

  // ── Child / Kid mode — dark gamified ─────────────────────────────────────
  kidBg:         '#1A0A3C',   // main dark background
  kidCard:       '#2D1B69',   // card surfaces
  kidCardBorder: 'rgba(255,255,255,0.10)',
  kidText:       '#FFFFFF',   // primary text
  kidMuted:      'rgba(255,255,255,0.55)',  // secondary text
  kidAccent:     '#00D4FF',   // gem cyan accent
  kidHeader:     '#130830',   // slightly darker header bar
  kidTab:        '#0F0628',   // bottom tab bar
  kidSegBg:      'rgba(255,255,255,0.08)',  // segmented control track
  kidSegOn:      'rgba(255,255,255,0.18)',  // segmented control active
  kidIconBg:     'rgba(0,212,255,0.15)',    // icon container in kid card

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
