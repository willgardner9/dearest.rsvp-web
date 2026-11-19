import { createTheme, MantineColorsTuple } from "@mantine/core";

// Base: Tailwind stone (warm neutral) for text, borders and surfaces.
const stone: MantineColorsTuple = [
  "#fafaf9",
  "#f5f5f4",
  "#e7e5e4",
  "#d6d3d1",
  "#a8a29e",
  "#78716c",
  "#57534e",
  "#44403c",
  "#292524",
  "#1c1917",
];

// Accent: Tailwind rose for buttons, links and brand surfaces.
const rose: MantineColorsTuple = [
  "#fff1f2",
  "#ffe4e6",
  "#fecdd3",
  "#fda4af",
  "#fb7185",
  "#f43f5e",
  "#e11d48",
  "#be123c",
  "#9f1239",
  "#881337",
];

export const theme = createTheme({
  colors: { stone, rose },
  primaryColor: "rose",
  primaryShade: 6,
  black: "#1c1917",
  defaultRadius: "md",
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headings: {
    fontFamily: '"Abhaya Libre", Georgia, "Times New Roman", serif',
    fontWeight: "700",
    sizes: {
      h1: { fontSize: "2.75rem", lineHeight: "1.15" },
      h2: { fontSize: "2.125rem", lineHeight: "1.2" },
      h3: { fontSize: "1.75rem", lineHeight: "1.25" },
      h4: { fontSize: "1.375rem", lineHeight: "1.3" },
      h5: { fontSize: "1.125rem", lineHeight: "1.4" },
      h6: { fontSize: "1rem", lineHeight: "1.4" },
    },
  },
});
