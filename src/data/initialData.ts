import type { AllyItem, BuilderSectionKey, BuilderState, BuilderUser, CloudflareConfig, CompetitiveEvent, CompetitivePlayer, CtaConfig, EventItem, HeroConfig, NewsArticle, SocialPlatform, TeamGroup, TickerConfig } from "../types/builder";



export const GRADIENT_PRESETS = [
  { id: "ember", name: "Naranja Ember", value: "from-orange-500 to-rose-600" },
  { id: "fire", name: "Fuego Carmesí", value: "from-rose-500 to-orange-600" },
  { id: "amber", name: "Ámbar Radiante", value: "from-amber-500 to-red-600" },
  { id: "sunset", name: "Atardecer", value: "from-orange-600 to-amber-500" },
  { id: "ruby", name: "Rubí Pasión", value: "from-red-500 to-rose-600" },
  { id: "blood", name: "Sangre Dragón", value: "from-orange-500 to-red-600" },
  { id: "violet", name: "Violeta Neon", value: "from-violet-500 to-fuchsia-600" },
  { id: "fuchsia", name: "Fucsia Cyber", value: "from-fuchsia-500 to-purple-600" },
  { id: "cyan", name: "Cyan Glaciar", value: "from-cyan-500 to-blue-600" },
  { id: "emerald", name: "Esmeralda", value: "from-emerald-500 to-teal-600" },
];

export const DEFAULT_MEMBER_SOCIALS: Record<SocialPlatform, { enabled: boolean; url: string }> = {
  x: { enabled: true, url: "https://x.com/OverplayEsports" },
  twitch: { enabled: true, url: "https://twitch.tv/OverplayEsports" },
  instagram: { enabled: true, url: "https://instagram.com/OverplayEsports" },
  youtube: { enabled: true, url: "https://youtube.com/@OverplayEsports" },
  discord: { enabled: true, url: "https://discord.gg/overplay" },
};

export const INITIAL_TEAM_GROUPS: TeamGroup[] = [
  {
    id: "staff",
    title: "Staff Overplay",
    description: "La cabina de mando: organización, producción y dirección de cada evento.",
    accent: "ember",
    members: [
      {
        id: "member-1",
        name: "Nosotros",
        role: "Dirección",
        avatarType: "monogram",
        gradient: "from-orange-500 to-rose-600",
        socials: { ...DEFAULT_MEMBER_SOCIALS },
      },
      {
        id: "member-2",
        name: "Aner",
        role: "Coordinación",
        avatarType: "monogram",
        gradient: "from-rose-500 to-orange-600",
        socials: { ...DEFAULT_MEMBER_SOCIALS },
      },
      {
        id: "member-3",
        name: "Sher",
        role: "Gestión de eventos",
        avatarType: "monogram",
        gradient: "from-amber-500 to-red-600",
        socials: { ...DEFAULT_MEMBER_SOCIALS },
      },
      {
        id: "member-4",
        name: "Zation",
        role: "Operaciones",
        avatarType: "monogram",
        gradient: "from-orange-600 to-amber-500",
        socials: { ...DEFAULT_MEMBER_SOCIALS },
      },
      {
        id: "member-5",
        name: "Yor",
        role: "Producción",
        avatarType: "monogram",
        gradient: "from-red-500 to-rose-600",
        socials: { ...DEFAULT_MEMBER_SOCIALS },
      },
      {
        id: "member-6",
        name: "Finis",
        role: "Staff",
        avatarType: "monogram",
        gradient: "from-orange-500 to-red-600",
        socials: { ...DEFAULT_MEMBER_SOCIALS },
      },
    ],
  },
  {
    id: "arte",
    title: "Apartado de Arte",
    description: "La identidad visual de Overplay: diseño, ilustración y gráficos de cada torneo.",
    accent: "violet",
    members: [
      {
        id: "member-7",
        name: "Pombetito",
        role: "Dirección de arte",
        avatarType: "monogram",
        gradient: "from-violet-500 to-fuchsia-600",
        socials: { ...DEFAULT_MEMBER_SOCIALS },
      },
      {
        id: "member-8",
        name: "Fran",
        role: "Diseño gráfico",
        avatarType: "monogram",
        gradient: "from-fuchsia-500 to-purple-600",
        socials: { ...DEFAULT_MEMBER_SOCIALS },
      },
    ],
  },
  {
    id: "moderacion",
    title: "Moderación",
    description: "Orden y fair play: la comunidad segura dentro y fuera de las partidas.",
    accent: "crimson",
    members: [
      {
        id: "member-9",
        name: "Ketos",
        role: "Moderador jefe",
        avatarType: "monogram",
        gradient: "from-red-600 to-orange-500",
        socials: { ...DEFAULT_MEMBER_SOCIALS },
      },
      {
        id: "member-10",
        name: "Ronet",
        role: "Moderador",
        avatarType: "monogram",
        gradient: "from-rose-600 to-red-500",
        socials: { ...DEFAULT_MEMBER_SOCIALS },
      },
      {
        id: "member-11",
        name: "Shadow",
        role: "Moderador",
        avatarType: "monogram",
        gradient: "from-red-500 to-purple-600",
        socials: { ...DEFAULT_MEMBER_SOCIALS },
      },
    ],
  },
];

export const DEFAULT_EVENT_RULES: EventRulesData = {
  summary:
    "Normativa oficial aplicable a todos los participantes, capitanes y equipos de la competición Overplay. Diseñada para garantizar el juego limpio, el respeto mutuo y la máxima transparencia en cada partida.",
  rulesButtonText: "Reglas del Torneo",
  modalTitle: "Reglamento Oficial de Competición",
  modalSubtitle: "Normativas, código de conducta, formatos y penalizaciones oficiales de Overplay",
  rawText: "",
  sections: [
    {
      id: "rule-1",
      category: "Elegibilidad & Roster",
      title: "1. Requisitos de los Jugadores y Equipos",
      description: "Condiciones mínimas de registro y validación de cuentas.",
      points: [
        "Cada equipo debe contar con 5 jugadores titulares y hasta 2 suplentes registrados antes del cierre oficial de plazas.",
        "Todas las cuentas de juego deben estar verificadas en el Discord oficial de Overplay.",
        "Queda estrictamente prohibida la suplantación de identidad (ringing / smurfing). El uso no autorizado causará descalificación inmediata del equipo.",
      ],
    },
    {
      id: "rule-2",
      category: "Formato & Partidas",
      title: "2. Formato de Encuentros y Servidores",
      description: "Estructura del bracket, servidores de juego y pausas técnicas.",
      points: [
        "El torneo se disputa en formato de doble eliminación (Winners & Losers Brackets).",
        "Los enfrentamientos de rondas clasificatorias son al Mejor de 3 (Bo3), y la Gran Final al Mejor de 5 (Bo5).",
        "Se concede un tiempo máximo de cortesía de 10 minutos para presentarse en el lobby antes de declarar Walkover (W.O.).",
        "Cada equipo dispone de hasta 2 pausas tácticas/técnicas de 5 minutos por mapa en caso de desconexión fortuita.",
      ],
    },
    {
      id: "rule-3",
      category: "Conducta & Fair Play",
      title: "3. Código de Conducta y Anticheat",
      description: "Respeto hacia rivales, árbitros, casters y uso de software.",
      points: [
        "El uso de cualquier software externo o trampa (hacks, scripts, macros) causará baneo permanente e irrevocable.",
        "El comportamiento tóxico, insultos o faltas de respeto en el chat general o Discord resultará en advertencias o pérdida de mapas.",
        "Las decisiones tomadas por el equipo de Árbitros y Moderadores oficiales son definitivas e inapelables.",
      ],
    },
    {
      id: "rule-4",
      category: "Retransmisión & Premios",
      title: "4. Streaming, Casters y Premiación",
      description: "Directrices para stream personal y entrega de premios.",
      points: [
        "Los jugadores pueden transmitir sus partidas individuales manteniendo un delay mínimo obligatorio de 120 segundos.",
        "La premiación y reconocimientos oficiales del prize pool se entregarán a los capitanes en un plazo máximo de 7 días hábiles.",
      ],
    },
  ],
};

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: "tourney-4",
    title: "Overplay Tourney 4 (Principal)",
    statusBadge: "Inscripciones abiertas",
    titlePrefix: "Overplay",
    titleMain: "Tourney",
    edition: "4",
    description:
      "La cuarta edición del torneo insignia reúne a los mejores equipos de la comunidad en un bracket 5v5 de doble eliminación. Compite, demuestra y escribe tu nombre en la historia de Overplay.",
    bannerImage: "/images/tourney-banner.jpg",
    chips: ["5v5", "Doble eliminación", "Marzo 2026"],
    registerButton: {
      text: "Inscribirse",
      url: "#inscripcion",
    },
    rulesButton: {
      text: "Ver reglas",
      url: "#reglas",
    },
    infoItems: [
      { id: "info-1", icon: "Radio", label: "Estado", value: "Inscripciones abiertas" },
      { id: "info-2", icon: "CalendarDays", label: "Fecha", value: "21 – 22 Mar 2026" },
      { id: "info-3", icon: "Clock", label: "Horario", value: "18:00 CEST" },
      { id: "info-4", icon: "Swords", label: "Formato", value: "5v5 · Doble eliminación" },
      { id: "info-5", icon: "UserPlus", label: "Inscripción", value: "Por equipos · Gratuita" },
      { id: "info-6", icon: "Trophy", label: "Premios", value: "Prize pool + medallero" },
    ],
    processPhases: [
      {
        id: "phase-1",
        step: "01",
        icon: "FilePenLine",
        title: "Inscripción",
        text: "Registra a tu equipo de cinco a través del Discord oficial antes del cierre de plazas.",
      },
      {
        id: "phase-2",
        step: "02",
        icon: "BadgeCheck",
        title: "Confirmación",
        text: "El staff verifica el roster, confirma la plaza y asigna a tu equipo su llave del bracket.",
      },
      {
        id: "phase-3",
        step: "03",
        icon: "Swords",
        title: "Competencia",
        text: "Enfrentamientos 5v5 con formato de doble eliminación, casters en vivo y arbitraje oficial.",
      },
      {
        id: "phase-4",
        step: "04",
        icon: "Medal",
        title: "Resultados",
        text: "Clasificación final, medallero oficial y reconocimientos publicados para toda la comunidad.",
      },
    ],
    rules: DEFAULT_EVENT_RULES,
  },
];

export const DEFAULT_CLOUDFLARE_CONFIG: CloudflareConfig = {
  accountId:
    import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID || "a7d64e57350dbbddcc2b65f7d8ede3a0",
  bucketName:
    import.meta.env.VITE_CLOUDFLARE_BUCKET_NAME || "imagenesoverplay",
  accessKeyId:
    import.meta.env.VITE_CLOUDFLARE_ACCESS_KEY_ID || "cbce2ec53f08bc186b64d463df8325f0",
  secretAccessKey:
    import.meta.env.VITE_CLOUDFLARE_SECRET_ACCESS_KEY ||
    "aaf8802d017d1da21588dc44e4bb886e5ed1cfddad234900faa874fe1ff0e780",
  publicUrl:
    import.meta.env.VITE_CLOUDFLARE_PUBLIC_URL ||
    "https://pub-def6d9ceb4ef4e8f84ee8a391d2b0b27.r2.dev",
};


export const INITIAL_NEWS: NewsArticle[] = [
  {
    id: "tourney-4-inscripciones",
    category: "overwatch",
    title: "Overplay Tourney 4 abre sus inscripciones a todos los equipos",
    subtitle: "La cuarta edición del torneo insignia eleva el nivel con formato de doble eliminación y transmisión oficial.",
    excerpt:
      "La cuarta edición del torneo insignia ya tiene fecha. Registra tu roster de cinco, asegura tu plaza en el bracket y compite por el título de la comunidad.",
    author: "Staff Overplay",
    date: "12 Mar 2026",
    image: "/images/tourney-banner.jpg",
    readTime: "3 min",
    content: `## El Escenario Principal de la Comunidad

La cuarta edición del torneo insignia de Overplay ya está en marcha. Tras el rotundo éxito de las ediciones anteriores, volvemos con un formato renovado, mayor nivel organizativo y retransmisión completa con casters oficiales.

### Estructura y Formato de Competencia

Los enfrentamientos se llevarán a cabo en un bracket de **Doble Eliminación (5v5)**, lo que garantiza que cada equipo tenga una segunda oportunidad en el Losers Bracket para alcanzar la Gran Final.

> "El objetivo de esta edición es brindar una experiencia profesional tanto para jugadores consolidados como para nuevas escuadras emergentes."

### ¿Cómo Inscribirse?

1. Reúne a tu quinteto titular y hasta dos suplentes.
2. Ingresa al servidor oficial de Discord y valida los Riot / Battle.net IDs de todos los integrantes.
3. Completa el formulario de confirmación antes del cierre de plazas oficiales.

Las partidas comenzarán el fin de semana del 21 y 22 de marzo a partir de las 18:00 CEST. ¡Prepara a tu escuadra y compite por la gloria!`,
    attachedImages: ["/images/tourney-banner.jpg"],
  },
  {
    id: "meta-guia-temporada",
    category: "overwatch",
    title: "Guía de meta: los héroes clave de la nueva temporada",
    subtitle: "Desglose técnico de las mejores composiciones y selecciones prioritarias para escalar en el ladder.",
    excerpt:
      "Analizamos las composiciones que están dominando el competitivo y qué picks priorizar si quieres escalar en el ladder antes del Tourney 4.",
    author: "Dirección Técnica",
    date: "08 Mar 2026",
    image: "/images/news-overwatch.jpg",
    readTime: "6 min",
    content: `## Análisis del Estado Actual del Juego

Con los últimos ajustes de balance, el ritmo de las partidas se ha transformado notablemente. Las composiciones de dive coordinado y poke de larga distancia han ganado terreno sobre los planteamientos estáticos de brawl.

### Selecciones Prioritarias por Rol

- **Tanques**: Flexibilidad de movilidad y control de espacio vertical.
- **DPS**: Héroes con capacidad de castigo instantáneo en rotaciones abiertas.
- **Soportes**: Prioridad de utilidad de supervivencia y habilitación de iniciaciones rápidas.

Revisa los replays de los mejores jugadores y adapta el pool de tu equipo antes de que arranque la jornada de torneos.`,
    attachedImages: ["/images/news-overwatch.jpg"],
  },
  {
    id: "valorant-amistoso",
    category: "valorant",
    title: "La comunidad se expande: primer evento amistoso de VALORANT",
    subtitle: "Overplay incursiona en el shooter táctico con su primer torneo abierto para toda la comunidad.",
    excerpt:
      "Overplay abre su primer evento fuera de Overwatch: un torneo comunitario de VALORANT con formato rápido, casters en directo y brackets abiertos.",
    author: "Comunidad Esports",
    date: "27 Feb 2026",
    image: "/images/news-valorant.jpg",
    readTime: "2 min",
    content: `## Nuevos Horizontes Competitivos

Atendiendo a la demanda de nuestros miembros, Overplay expande sus actividades competitivas organizando el primer torneo relámpago de VALORANT.

### Detalles del Encuentro

- **Modo**: 5v5 Modo Competitivo en servidores oficiales de Madrid / Frankfurt.
- **Map Pool**: Ascent, Haven, Bind, Split y Sunset.
- **Transmisión**: En vivo por el canal oficial de Twitch con sorteos para el chat.`,
    attachedImages: ["/images/news-valorant.jpg"],
  },
  {
    id: "fortnite-capitulo",
    category: "fortnite",
    title: "Análisis del nuevo capítulo: mapa, armas y rotaciones",
    subtitle: "Todo lo que necesitas saber sobre el nuevo mapa, cambios en el loot pool y estrategias de rotación.",
    excerpt:
      "Todo lo que cambió en la isla: puntos de interés, loot pool y las rotaciones que están marcando el early game en el competitivo de Fortnite.",
    author: "Área de Análisis",
    date: "20 Feb 2026",
    image: "/images/news-fortnite.jpg",
    readTime: "5 min",
    content: `## La Evolución de la Isla

El nuevo capítulo introduce modificaciones sustanciales en el terreno y la distribución de recursos clave. Las zonas elevadas y los nuevos medios de transporte definen las rutas más eficientes para el late game en partidas clasificatorias.`,
    attachedImages: ["/images/news-fortnite.jpg"],
  },
  {
    id: "marvel-rivals-ranked",
    category: "marvel-rivals",
    title: "Marvel Rivals: las mejores composiciones para ranked",
    subtitle: "Team-ups sinérgicos y estructura de escuadras de seis para dominar la escalera clasificatoria.",
    excerpt:
      "Team-ups que rompen el meta, counters imprescindibles y cómo estructurar tu equipo de seis para ganar consistencia en la escalera clasificatoria.",
    author: "Redacción Esports",
    date: "14 Feb 2026",
    image: "/images/news-marvel.jpg",
    readTime: "4 min",
    content: `## El Poder de las Sinergias

En Marvel Rivals, los efectos de Team-Up son el factor decisivo que puede voltear cualquier combate en punto de captura. Descubre cómo combinar habilidades definitivas para maximizar el daño en área y control de masas.`,
    attachedImages: ["/images/news-marvel.jpg"],
  },
];

export const INITIAL_COMPETITIVE_ROSTER: CompetitivePlayer[] = [
  {
    id: "player-1",
    tag: "01",
    name: "KRON",
    role: "Main Tank",
    position: "Capitán",
    avatarType: "monogram",
    events: ["Tourney 1", "Tourney 2", "Tourney 3", "Clash Cup"],
    socials: {
      x: { enabled: true, url: "https://x.com/OverplayEsports" },
      twitch: { enabled: true, url: "https://twitch.tv/OverplayEsports" },
      instagram: { enabled: false, url: "#" },
      youtube: { enabled: false, url: "#" },
      discord: { enabled: false, url: "#" },
    },
    gradient: "from-orange-500 to-rose-600",
  },
  {
    id: "player-2",
    tag: "02",
    name: "VIPER",
    role: "DPS Hitscan",
    position: "Titular",
    avatarType: "monogram",
    events: ["Tourney 2", "Tourney 3", "Clash Cup"],
    socials: {
      x: { enabled: true, url: "https://x.com/OverplayEsports" },
      twitch: { enabled: true, url: "https://twitch.tv/OverplayEsports" },
      instagram: { enabled: false, url: "#" },
      youtube: { enabled: false, url: "#" },
      discord: { enabled: false, url: "#" },
    },
    gradient: "from-rose-500 to-red-600",
  },
  {
    id: "player-3",
    tag: "03",
    name: "NOVA",
    role: "DPS Proyectil",
    position: "Titular",
    avatarType: "monogram",
    events: ["Tourney 3", "Clash Cup"],
    socials: {
      x: { enabled: true, url: "https://x.com/OverplayEsports" },
      youtube: { enabled: true, url: "https://youtube.com/@OverplayEsports" },
      twitch: { enabled: false, url: "#" },
      instagram: { enabled: false, url: "#" },
      discord: { enabled: false, url: "#" },
    },
    gradient: "from-violet-500 to-fuchsia-600",
  },
  {
    id: "player-4",
    tag: "04",
    name: "SAIT",
    role: "Flex Tank",
    position: "Titular",
    avatarType: "monogram",
    events: ["Tourney 1", "Tourney 3", "Clash Cup"],
    socials: {
      x: { enabled: true, url: "https://x.com/OverplayEsports" },
      twitch: { enabled: true, url: "https://twitch.tv/OverplayEsports" },
      instagram: { enabled: false, url: "#" },
      youtube: { enabled: false, url: "#" },
      discord: { enabled: false, url: "#" },
    },
    gradient: "from-amber-500 to-orange-600",
  },
  {
    id: "player-5",
    tag: "05",
    name: "LUNAR",
    role: "Main Support",
    position: "Titular",
    avatarType: "monogram",
    events: ["Tourney 2", "Tourney 3", "Clash Cup"],
    socials: {
      x: { enabled: true, url: "https://x.com/OverplayEsports" },
      twitch: { enabled: true, url: "https://twitch.tv/OverplayEsports" },
      instagram: { enabled: false, url: "#" },
      youtube: { enabled: false, url: "#" },
      discord: { enabled: false, url: "#" },
    },
    gradient: "from-fuchsia-500 to-purple-600",
  },
  {
    id: "player-6",
    tag: "06",
    name: "ORBE",
    role: "Flex Support",
    position: "Titular",
    avatarType: "monogram",
    events: ["Tourney 3", "Clash Cup"],
    socials: {
      x: { enabled: true, url: "https://x.com/OverplayEsports" },
      twitch: { enabled: false, url: "#" },
      instagram: { enabled: false, url: "#" },
      youtube: { enabled: false, url: "#" },
      discord: { enabled: false, url: "#" },
    },
    gradient: "from-red-500 to-rose-600",
  },
  {
    id: "player-7",
    tag: "07",
    name: "DASH",
    role: "DPS",
    position: "Suplente",
    avatarType: "monogram",
    events: ["Tourney 3"],
    socials: {
      x: { enabled: true, url: "https://x.com/OverplayEsports" },
      twitch: { enabled: true, url: "https://twitch.tv/OverplayEsports" },
      instagram: { enabled: false, url: "#" },
      youtube: { enabled: false, url: "#" },
      discord: { enabled: false, url: "#" },
    },
    gradient: "from-orange-600 to-red-600",
  },
  {
    id: "player-8",
    tag: "08",
    name: "FEROZ",
    role: "Tank",
    position: "Suplente",
    avatarType: "monogram",
    events: ["Tourney 3", "Clash Cup"],
    socials: {
      x: { enabled: true, url: "https://x.com/OverplayEsports" },
      twitch: { enabled: false, url: "#" },
      instagram: { enabled: false, url: "#" },
      youtube: { enabled: false, url: "#" },
      discord: { enabled: false, url: "#" },
    },
    gradient: "from-purple-500 to-violet-600",
  },
  {
    id: "player-9",
    tag: "09",
    name: "MIRKO",
    role: "Head Coach",
    position: "Cuerpo técnico",
    avatarType: "monogram",
    events: ["Tourney 2", "Tourney 3", "Clash Cup"],
    socials: {
      x: { enabled: true, url: "https://x.com/OverplayEsports" },
      youtube: { enabled: true, url: "https://youtube.com/@OverplayEsports" },
      twitch: { enabled: false, url: "#" },
      instagram: { enabled: false, url: "#" },
      discord: { enabled: false, url: "#" },
    },
    gradient: "from-rose-600 to-violet-600",
  },
];

export const INITIAL_COMPETITIVE_EVENTS: CompetitiveEvent[] = [
  {
    id: "event-1",
    name: "Overplay Tourney 1",
    year: "2024",
    result: "Cuartos de final",
    tier: "neutral",
    blurb: "El debut del roster ante la comunidad. Primer contacto con el escenario.",
  },
  {
    id: "event-2",
    name: "Overplay Tourney 2",
    year: "2025",
    result: "Semifinales",
    tier: "bronze",
    blurb: "Salto de nivel: el equipo empieza a competir contra los brackets altos.",
  },
  {
    id: "event-3",
    name: "Overplay Tourney 3",
    year: "2025",
    result: "Subcampeones",
    tier: "silver",
    blurb: "A un mapa del título. La final más reñida en la historia de Overplay.",
  },
  {
    id: "event-4",
    name: "Community Clash Cup",
    year: "2025",
    result: "Campeones",
    tier: "gold",
    blurb: "Primer título oficial de UL. Invictos durante todo el bracket.",
  },
];

export const INITIAL_ALLIES: AllyItem[] = [
  {
    id: "ally-1",
    name: "MKimada",
    badge: "Creador de contenido",
    description: "Estrategia, guías y análisis de Overwatch. Su comunidad respira competitivo en cada directo.",
    link: "https://twitch.tv",
    avatarType: "monogram",
    gradient: "from-orange-500 to-rose-600",
    socials: {
      x: { enabled: true, url: "https://x.com" },
      twitch: { enabled: true, url: "https://twitch.tv" },
      youtube: { enabled: true, url: "https://youtube.com" },
      instagram: { enabled: false, url: "#" },
      discord: { enabled: false, url: "#" },
    },
  },
  {
    id: "ally-2",
    name: "EvilTokki",
    badge: "Streamer",
    description: "Energía y variedad en directo. Voz habitual de los watch parties de los torneos de Overplay.",
    link: "https://twitch.tv",
    avatarType: "monogram",
    gradient: "from-violet-500 to-fuchsia-600",
    socials: {
      x: { enabled: true, url: "https://x.com" },
      twitch: { enabled: true, url: "https://twitch.tv" },
      instagram: { enabled: false, url: "#" },
      youtube: { enabled: false, url: "#" },
      discord: { enabled: false, url: "#" },
    },
  },
  {
    id: "ally-3",
    name: "Finiscat",
    badge: "Arte & Clips",
    description: "Ilustración, clips y edición. Detrás de gran parte del contenido visual de la comunidad.",
    link: "https://youtube.com",
    avatarType: "monogram",
    gradient: "from-fuchsia-500 to-purple-600",
    socials: {
      x: { enabled: true, url: "https://x.com" },
      youtube: { enabled: true, url: "https://youtube.com" },
      twitch: { enabled: false, url: "#" },
      instagram: { enabled: false, url: "#" },
      discord: { enabled: false, url: "#" },
    },
  },
  {
    id: "ally-4",
    name: "Lordotox",
    badge: "Caster & Análisis",
    description: "Narración y análisis en vivo. La voz que pone emoción a las finales del Tourney.",
    link: "https://twitch.tv",
    avatarType: "monogram",
    gradient: "from-rose-500 to-red-600",
    socials: {
      x: { enabled: true, url: "https://x.com" },
      twitch: { enabled: true, url: "https://twitch.tv" },
      instagram: { enabled: false, url: "#" },
      youtube: { enabled: false, url: "#" },
      discord: { enabled: false, url: "#" },
    },
  },
];

export const BUILDER_SECTIONS_LIST: {
  id: BuilderSectionKey;
  title: string;
  description: string;
  tag: string;
}[] = [
  {
    id: "about",
    title: "Sobre Nosotros (Equipo)",
    description: "Gestor de integrantes, apartados, fotos en R2 y 5 redes sociales.",
    tag: "Integrantes",
  },
  {
    id: "events",
    title: "Eventos & Torneos",
    description: "Edición del torneo activo, banner, 6 casillas técnicas, botones y fases.",
    tag: "Torneos",
  },
  {
    id: "competitive",
    title: "Competitivo (Roster UL)",
    description: "Alineación de jugadores oficiales, roles, fotos en R2 y torneos.",
    tag: "Roster UL",
  },
  {
    id: "news",
    title: "Noticias & Anuncios",
    description: "Creación y publicación de artículos, cabeceras e imágenes.",
    tag: "Noticias",
  },
  {
    id: "allies",
    title: "Nuestros Aliados",
    description: "Creadores de contenido, casters, fotos R2 y 5 redes sociales.",
    tag: "Comunidad",
  },
  {
    id: "hero",
    title: "Hero (Portada)",
    description: "Cabecera principal, título y subtítulo en portada.",
    tag: "Portada",
  },
  {
    id: "ticker",
    title: "Display Deslizante (Banner)",
    description: "Cinta horizontal con loop de titulares y logotipos.",
    tag: "Marquee",
  },
  {
    id: "cta",
    title: "Recuadro para Participar",
    description: "Tarjeta de llamada a la acción y enlaces de Discord.",
    tag: "Conversión",
  },
  {
    id: "registrations",
    title: "Inscripciones al Torneo",
    description: "Visualización de participantes, rangos, perfiles de carrera en R2 y aprobación.",
    tag: "Inscripciones",
  },
];

export const SUPER_ADMIN_EMAIL = "pamacheyt@gmail.com";
export const SUPER_ADMIN_USERNAME = "Pamache";

export const INITIAL_BUILDER_USERS: BuilderUser[] = [
  {
    id: "user-superadmin-pamache",
    email: SUPER_ADMIN_EMAIL,
    username: SUPER_ADMIN_USERNAME,
    role: "superadmin",
    status: "approved",
    allowedSections: [
      "about",
      "events",
      "competitive",
      "news",
      "allies",
      "hero",
      "ticker",
      "cta",
      "registrations",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
  },
];


export const DEFAULT_HERO_CONFIG: HeroConfig = {
  eyebrow: "Organización de Esports — Overwatch",
  titlePrefix: "Over",
  titleHighlight: "play",
  tagline: "Donde la competencia comienza.",
  subtitle: "Eventos competitivos, comunidad y talento unidos en un mismo lugar.",
  primaryButtonText: "Ver Overplay Tourney 4",
  primaryButtonUrl: "#/eventos",
  secondaryButtonText: "Sobre Nosotros",
  secondaryButtonUrl: "#/nosotros",
  editionNumber: "04",
  playersCount: "+300",
  communityCount: "+1.2K",
  backgroundImage: "/images/hero-bg.jpg",
};

export const DEFAULT_TICKER_CONFIG: TickerConfig = {
  items: [
    "Overplay Tourney 4",
    "Inscripciones abiertas",
    "Formato 5v5",
    "Doble eliminación",
    "Comunidad Overplay",
    "Donde la competencia comienza",
  ],
};

export const DEFAULT_CTA_CONFIG: CtaConfig = {
  eyebrow: "Overplay Tourney 4 te espera",
  titleMain: "¿Listo para ",
  titleHighlight: "competir?",
  description: "Inscribe a tu equipo, enfréntate a los mejores y sé parte de la mayor comunidad competitiva de Overwatch.",
  buttonText: "Inscribirse al Torneo",
  buttonUrl: "#eventos",
  bannerImage: "/images/tourney-banner.jpg",
};

export const INITIAL_BUILDER_STATE: BuilderState = {
  teamGroups: INITIAL_TEAM_GROUPS,
  events: INITIAL_EVENTS,
  selectedEventId: "tourney-4",
  news: INITIAL_NEWS,
  cloudflareConfig: DEFAULT_CLOUDFLARE_CONFIG,
  siteInfo: {
    name: "Overplay",
    tagline: "Donde la competencia comienza.",
    heroSubtitle: "Eventos competitivos, comunidad y talento unidos en un mismo lugar.",
    footerNote: "Donde la competencia comienza y nace la comunidad.",
    editionNumber: "04",
    playersCount: "+300",
    communityCount: "+1.2K",
  },
  tickerItems: [
    "Overplay Tourney 4",
    "Inscripciones abiertas",
    "Formato 5v5",
    "Doble eliminación",
    "Comunidad Overplay",
    "Donde la competencia comienza",
  ],
  competitiveRoster: INITIAL_COMPETITIVE_ROSTER,
  competitiveEvents: INITIAL_COMPETITIVE_EVENTS,
  allies: INITIAL_ALLIES,
  heroConfig: DEFAULT_HERO_CONFIG,
  tickerConfig: DEFAULT_TICKER_CONFIG,
  ctaConfig: DEFAULT_CTA_CONFIG,
  currentUser: null,
  usersList: INITIAL_BUILDER_USERS,
};


