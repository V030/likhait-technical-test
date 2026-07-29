/**
 * Vibes Color System
 * Color palette from freee/vibes design system
 */

export const COLORS = {
  // Primary colors (Blue)
  primary: {
    p01: "#ebf3ff",
    p02: "#dce8ff",
    p03: "#aac8ff",
    p04: "#73a5ff",
    p05: "#2864f0",
    p06: "#3264dc",
    p07: "#285ac8",
    p08: "#1e46aa",
    p09: "#23418c",
    p10: "#143278",
  },
  // Secondary colors (Gray)
  secondary: {
    s01: "#f7f5f5",
    s02: "#f0eded",
    s03: "#e9e7e7",
    s04: "#e1dcdc",
    s05: "#d7d2d2",
    s06: "#bebaba",
    s07: "#aaa7a7",
    s08: "#8c8989",
    s09: "#6e6b6b",
    s10: "#464343",
  },
  // Red
  red: {
    re02: "#fad2d7",
    re04: "#f07882",
    re05: "#dc1e32",
    re07: "#a51428",
    re10: "#6e0f19",
  },
  // Orange
  orange: {
    or02: "#ffe1d2",
    or04: "#ffaa78",
    or05: "#fa6414",
    or07: "#be4b0f",
    or10: "#7d320a",
  },
  // Yellow
  yellow: {
    ye02: "#fff0d2",
    ye04: "#ffd278",
    ye05: "#ffb91e",
    ye07: "#be8c14",
    ye10: "#825a0f",
  },
  // Yellow Green
  yellowGreen: {
    yg02: "#e6f0d2",
    yg04: "#b4dc7d",
    yg05: "#82c31e",
    yg07: "#50961e",
    yg10: "#3c5f14",
  },
  // Green
  green: {
    gr02: "#cdebd7",
    gr04: "#64be8c",
    gr05: "#00963c",
    gr07: "#006e2d",
    gr10: "#004b1e",
  },
  // Blue Green
  blueGreen: {
    bg02: "#cdf0f0",
    bg04: "#64d2d2",
    bg05: "#00b9b9",
    bg07: "#008c8c",
    bg10: "#146464",
  },
  // Backwards compatible mappings
  accent: {
    a01: "#dc1e32", // Maps to red.re05
    a02: "#f07882", // Maps to red.re04
    a03: "#a51428", // Maps to red.re07
  },
  success: "#00963c", // Maps to green.gr05
  warning: "#ffb91e", // Maps to yellow.ye05
  danger: "#dc1e32", // Maps to red.re05
  info: "#00b9b9", // Maps to blueGreen.bg05
  text: {
    primary: "#464343", // Maps to secondary.s10
    secondary: "#6e6b6b", // Maps to secondary.s09
    light: "#aaa7a7", // Maps to secondary.s07
  },
  border: "#e1dcdc", // Maps to secondary.s04
  background: {
    main: "#ffffff",
    card: "#f7f5f5", // Maps to secondary.s01
    hover: "#f0eded", // Maps to secondary.s02
  },
} as const;
