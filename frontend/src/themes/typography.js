// ==============================|| DEFAULT THEME - TYPOGRAPHY ||============================== //

export default function Typography(fontFamily, fontSize = 12) {
  // Tajawal Font - Primary font for Arabic-only system
  // Falls back to system Arabic fonts if Tajawal fails to load
  const activeFont = fontFamily === 'Cairo'
    ? `'Cairo', 'Segoe UI Arabic', sans-serif`
    : `'Tajawal', 'Segoe UI Arabic', sans-serif`;

  // Base Header Size (User requested Titles to be +2 from Base)
  const baseHeaderSize = fontSize + 2;

  return {
    htmlFontSize: 16, // Fixed root ensures rems scale predictably relative to browser default
    fontFamily: activeFont,
    fontSize: fontSize,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    // Titles (Start at Base + 2 for H6, scale up)
    h1: { fontSize: baseHeaderSize + 12, fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: baseHeaderSize + 8, fontWeight: 700, lineHeight: 1.3 },
    h3: { fontSize: baseHeaderSize + 6, fontWeight: 600, lineHeight: 1.35 },
    h4: { fontSize: baseHeaderSize + 4, fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: baseHeaderSize + 2, fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: baseHeaderSize, fontWeight: 600, lineHeight: 1.6 }, // Exactly Base + 2
    // Body & Subtitles
    subtitle1: { fontSize: fontSize + 1, fontWeight: 600, lineHeight: 1.6 }, // Medium emphasis
    subtitle2: { fontSize: fontSize, fontWeight: 500, lineHeight: 1.65 }, // Table Headers often use this
    body1: { fontSize: fontSize, lineHeight: 1.6 }, // Primary Text
    body2: { fontSize: fontSize - 1, lineHeight: 1.65 }, // Secondary Text
    button: { fontSize: fontSize, fontWeight: 500, textTransform: 'none' },
    caption: { fontSize: fontSize - 2, lineHeight: 1.7 }
  };
}
