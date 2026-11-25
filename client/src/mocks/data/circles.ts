import type { PublicCircle } from "../../types/circle.ts";

export function createMockCircles(): PublicCircle[] {
  return [
    {
      id: "circle-marvel-dc",
      name: "Marvel & DC",
      slug: "marvel-dc",
      category: "movies",
      description:
        "Superhero films and shows: trailers, theories and post-credit scenes.",
      memberCount: 640,
      isMember: false,
    },
    {
      id: "circle-nollywood",
      name: "Nollywood",
      slug: "nollywood",
      category: "movies",
      description:
        "Nigerian films and series, from cinema releases to streaming premieres.",
      memberCount: 871,
      isMember: false,
    },
    {
      id: "circle-hollywood",
      name: "Hollywood",
      slug: "hollywood",
      category: "movies",
      description:
        "Big releases, award season and what is showing at the cinema.",
      memberCount: 520,
      isMember: false,
    },
    {
      id: "circle-bollywod",
      name: "Bollywood",
      slug: "bollywood",
      category: "movies",
      description: "Hindi cinema: new releases, songs and stars.",
      memberCount: 198,
      isMember: false,
    },
    {
      id: "circle-korean-drama",
      name: "Korean Drama",
      slug: "korean-drama",
      category: "movies",
      description:
        "Korean series and films: new episodes, binge picks and stars.",
      memberCount: 178,
      isMember: false,
    },
    {
      id: "circle-anime",
      name: "Anime",
      slug: "anime",
      category: "movies",
      description: "Series, films and the episode everyone is talking about.",
      memberCount: 455,
      isMember: false,
    },
    {
      id: "circle-african-literature",
      name: "African Literature",
      slug: "african-literature",
      category: "books",
      description:
        "Books by African writers, classic and new. Read along chapter by chapter.",
      memberCount: 302,
      isMember: false,
    },
    {
      id: "circle-fantasy-sci-fi",
      name: "Fantasy & Sci-Fi",
      slug: "fantasy-sci-fi",
      category: "books",
      description:
        "other worlds in print: series, standalones and what to read next.",
      memberCount: 177,
      isMember: false,
    },
    {
      id: "circle-premier-league",
      name: "Premier League",
      slug: "premier-league",
      category: "football",
      description:
        "Matchday talk, predictions and reactions from the English top flight.",
      memberCount: 1204,
      isMember: false,
    },
    {
      id: "circle-la-liga",
      name: "La Liga",
      slug: "la-liga",
      category: "football",
      description:
        "Spanish football: El Clásico, the title race and the rest of the table.",
      memberCount: 412,
      isMember: false,
    },
    {
      id: "circle-ucl",
      name: "UCL",
      slug: "ucl",
      category: "football",
      description: "Champions League nights, draws and knockout drama.",
      memberCount: 958,
      isMember: false,
    },
    {
      id: "circle-uel",
      name: "UEL",
      slug: "uel",
      category: "football",
      description: "Europa League fixtures, upsets and the road to the final.",
      memberCount: 233,
      isMember: false,
    },
    {
      id: "circle-npfl",
      name: "NPFL",
      slug: "npfl",
      category: "football",
      description:
        "The Nigeria Premier Football League, every matchday and every ground.",
      memberCount: 386,
      isMember: false,
    },
    {
      id: "circle-super-eagles",
      name: "Super Eagles",
      slug: "super-eagles",
      category: "football",
      description:
        "Nigeria's national team: qualifiers, tournaments and squad news.",
      memberCount: 1530,
      isMember: false,
    },
  ];
}
