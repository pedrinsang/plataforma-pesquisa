import type { Metadata } from "next";
import { Cormorant_Garamond, Lora, Caveat, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Cormorant Garamond — títulos (serifada de display, corte 400–600).
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Lora — corpo (serifada transicional, x-height alto).
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// Caveat — caligrafia (notas de margem na landing).
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

// IBM Plex Sans/Mono — chrome do editor de Escrita em tela cheia ("instrumento").
// Fora dessa tela a interface segue Cormorant/Lora; aqui a sans e a mono dão a
// leitura de painel técnico prevista no design.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Folium — plataforma de pesquisa científica",
  description:
    "Folium reúne escrita, referências e estatística do seu projeto científico em uma plataforma só — segura, colaborativa e com cuidado editorial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${cormorant.variable} ${lora.variable} ${caveat.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        <script
          // Aplica o tema salvo antes do primeiro paint, evitando flash de tema errado.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
