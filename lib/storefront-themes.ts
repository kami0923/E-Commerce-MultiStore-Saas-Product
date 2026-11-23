export const storefrontThemes = {
  atelier: { label: "Editorial Atelier", description: "Quiet luxury, generous whitespace and fashion-led storytelling.", accent: "#173f31", surface: "#f7f3ea", ink: "#16221c", radius: "2rem", highlight: "#dce8d7" },
  kinetic: { label: "Kinetic Footwear", description: "Technical grids, bold motion and energetic product presentation.", accent: "#063f49", surface: "#edf7f5", ink: "#082a30", radius: "1.35rem", highlight: "#7de7dc" },
  noir: { label: "Jewellery Noir", description: "Cinematic contrast, luminous details and gallery-like framing.", accent: "#201611", surface: "#f4ede3", ink: "#211914", radius: ".35rem", highlight: "#d8bc91" },
  canvas: { label: "Beauty Canvas", description: "Soft editorial colour, sculptural cards and refined beauty rituals.", accent: "#6e344b", surface: "#fbf2f4", ink: "#3f1c29", radius: "2.4rem", highlight: "#f0bdcb" },
  market: { label: "Modern Market", description: "Clear discovery, asymmetric merchandising and broad catalogues.", accent: "#143d46", surface: "#eef5f3", ink: "#102d32", radius: "1rem", highlight: "#c8eee5" },
  gallery: { label: "Minimal Gallery", description: "Museum-like space, restrained typography and image-first commerce.", accent: "#252525", surface: "#f5f4ef", ink: "#141414", radius: ".2rem", highlight: "#d9d7cf" },
  bold: { label: "Bold Commerce", description: "High-energy colour, oversized type and youth-culture movement.", accent: "#4a25d7", surface: "#f1efff", ink: "#171032", radius: "1.75rem", highlight: "#c9ff4f" },
  heritage: { label: "Heritage House", description: "Craft-led warmth, traditional detail and timeless editorial rhythm.", accent: "#653a24", surface: "#f6efe4", ink: "#342116", radius: ".8rem", highlight: "#d8ae7a" },
  forge: { label: "Forge Industrial", description: "Precision hardware, smoked steel surfaces and electric amber guidance.", accent: "#0b1014", surface: "#090d10", ink: "#f4f7f8", radius: ".75rem", highlight: "#ffb43f" },
  velvet: { label: "Velvet Beauty", description: "Midnight plum, luminous rose accents and sculptural cosmetic presentation.", accent: "#180d19", surface: "#100a13", ink: "#fff5fb", radius: "2.6rem", highlight: "#ff8fbd" },
  midnight: { label: "Midnight Outfitters", description: "Technical navy, vivid trail accents and cinematic outerwear stories.", accent: "#071426", surface: "#07101d", ink: "#f3f7ff", radius: "1.25rem", highlight: "#94ff72" },
  luxe: { label: "Legacy Luxe", description: "Original Meridian cinematic theme, retained for existing stores.", accent: "#35261d", surface: "#f4ede3", ink: "#211914", radius: ".25rem", highlight: "#d8bc91" },
} as const;

export type StorefrontThemeKey = keyof typeof storefrontThemes;
export const storefrontThemeKeys = Object.keys(storefrontThemes) as StorefrontThemeKey[];
export const darkDefaultThemeKeys = ["forge", "velvet", "midnight"] as const satisfies readonly StorefrontThemeKey[];

export function getStorefrontTheme(themeKey: string) {
  return storefrontThemes[themeKey as StorefrontThemeKey] ?? storefrontThemes.atelier;
}

export function recommendedTheme(vertical: string, seed = 0): StorefrontThemeKey {
  const choices: Record<string, StorefrontThemeKey[]> = {
    CLOTHING: ["atelier", "gallery", "heritage", "bold"],
    SHOES: ["kinetic", "bold", "gallery", "market"],
    JEWELLERY: ["noir", "heritage", "gallery", "atelier"],
    COSMETICS: ["canvas", "gallery", "atelier", "bold"],
    HARDWARE: ["forge", "market", "kinetic", "gallery"],
    MULTI_CATEGORY: ["market", "bold", "kinetic", "atelier"],
  };
  const available = choices[vertical] ?? choices.MULTI_CATEGORY;
  return available[Math.abs(seed) % available.length];
}

export function isDarkDefaultTheme(themeKey: string) {
  return (darkDefaultThemeKeys as readonly string[]).includes(themeKey);
}
