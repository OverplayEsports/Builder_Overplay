export const R2_HEROES_CDN = "https://pub-def6d9ceb4ef4e8f84ee8a391d2b0b27.r2.dev/heroes";

export function getHeroImageUrl(heroName: string): string {
  if (!heroName || typeof heroName !== "string") return "";
  const clean = heroName.trim();
  return `${R2_HEROES_CDN}/${encodeURIComponent(clean)}.png`;
}

export function getLocalHeroImageUrl(heroName: string): string {
  if (!heroName || typeof heroName !== "string") return "";
  return `./images/Overwatch/${heroName.trim()}.png`;
}

export interface OverwatchHero {
  name: string;
  image: string;
}

export const OVERWATCH_HEROES: OverwatchHero[] = [
  { name: "Ana", image: `${R2_HEROES_CDN}/Ana.png` },
  { name: "Anran", image: `${R2_HEROES_CDN}/Anran.png` },
  { name: "Ashe", image: `${R2_HEROES_CDN}/Ashe.png` },
  { name: "Baptiste", image: `${R2_HEROES_CDN}/Baptiste.png` },
  { name: "Bastion", image: `${R2_HEROES_CDN}/Bastion.png` },
  { name: "Brigitte", image: `${R2_HEROES_CDN}/Brigitte.png` },
  { name: "Cassidy", image: `${R2_HEROES_CDN}/Cassidy.png` },
  { name: "D.Mon", image: `${R2_HEROES_CDN}/D.Mon.png` },
  { name: "D.va", image: `${R2_HEROES_CDN}/D.va.png` },
  { name: "Doctrine", image: `${R2_HEROES_CDN}/Doctrine.png` },
  { name: "Domina", image: `${R2_HEROES_CDN}/Domina.png` },
  { name: "Doomfist", image: `${R2_HEROES_CDN}/Doomfist.png` },
  { name: "Echo", image: `${R2_HEROES_CDN}/Echo.png` },
  { name: "Emre", image: `${R2_HEROES_CDN}/Emre.png` },
  { name: "Freja", image: `${R2_HEROES_CDN}/Freja.png` },
  { name: "Genji", image: `${R2_HEROES_CDN}/Genji.png` },
  { name: "Hanzo", image: `${R2_HEROES_CDN}/Hanzo.png` },
  { name: "Hazard", image: `${R2_HEROES_CDN}/Hazard.png` },
  { name: "Illari", image: `${R2_HEROES_CDN}/Illari.png` },
  { name: "JetPackCat", image: `${R2_HEROES_CDN}/JetPackCat.png` },
  { name: "JunkerQueen", image: `${R2_HEROES_CDN}/JunkerQueen.png` },
  { name: "Junkrat", image: `${R2_HEROES_CDN}/Junkrat.png` },
  { name: "Juno", image: `${R2_HEROES_CDN}/Juno.png` },
  { name: "Kiriko", image: `${R2_HEROES_CDN}/Kiriko.png` },
  { name: "Lifeweaver", image: `${R2_HEROES_CDN}/Lifeweaver.png` },
  { name: "Lucio", image: `${R2_HEROES_CDN}/Lucio.png` },
  { name: "Mauga", image: `${R2_HEROES_CDN}/Mauga.png` },
  { name: "Mei", image: `${R2_HEROES_CDN}/Mei.png` },
  { name: "Mercy", image: `${R2_HEROES_CDN}/Mercy.png` },
  { name: "Mizuki", image: `${R2_HEROES_CDN}/Mizuki.png` },
  { name: "Moira", image: `${R2_HEROES_CDN}/Moira.png` },
  { name: "Orisa", image: `${R2_HEROES_CDN}/Orisa.png` },
  { name: "Pharah", image: `${R2_HEROES_CDN}/Pharah.png` },
  { name: "Ramatra", image: `${R2_HEROES_CDN}/Ramatra.png` },
  { name: "Reaper", image: `${R2_HEROES_CDN}/Reaper.png` },
  { name: "Reinhardt", image: `${R2_HEROES_CDN}/Reinhardt.png` },
  { name: "RoadHog", image: `${R2_HEROES_CDN}/RoadHog.png` },
  { name: "Sierra", image: `${R2_HEROES_CDN}/Sierra.png` },
  { name: "Sigma", image: `${R2_HEROES_CDN}/Sigma.png` },
  { name: "Sojourn", image: `${R2_HEROES_CDN}/Sojourn.png` },
  { name: "Soldado76", image: `${R2_HEROES_CDN}/Soldado76.png` },
  { name: "Sombra", image: `${R2_HEROES_CDN}/Sombra.png` },
  { name: "Symmetra", image: `${R2_HEROES_CDN}/Symmetra.png` },
  { name: "Torbjörn", image: `${R2_HEROES_CDN}/Torbj%C3%B6rn.png` },
  { name: "Tracer", image: `${R2_HEROES_CDN}/Tracer.png` },
  { name: "Vendeta", image: `${R2_HEROES_CDN}/Vendeta.png` },
  { name: "Venture", image: `${R2_HEROES_CDN}/Venture.png` },
  { name: "Widowmaker", image: `${R2_HEROES_CDN}/Widowmaker.png` },
  { name: "Winston", image: `${R2_HEROES_CDN}/Winston.png` },
  { name: "WreckingBall", image: `${R2_HEROES_CDN}/WreckingBall.png` },
  { name: "Wuyang", image: `${R2_HEROES_CDN}/Wuyang.png` },
  { name: "Zarya", image: `${R2_HEROES_CDN}/Zarya.png` },
  { name: "Zenyatta", image: `${R2_HEROES_CDN}/Zenyatta.png` },
];
