import { prisma } from "./prisma";

type LiteGoat = { id: string; name: string; motherId: string | null; fatherId: string | null };

/**
 * Loads a goat and its ancestors up to `depth` generations back
 * (default 4: parents, grandparents, great-grandparents, gg-grandparents)
 * as a flat map keyed by goat id, so relationship checks don't need
 * to hit the database repeatedly.
 */
async function loadAncestorMap(rootIds: string[], depth = 4): Promise<Map<string, LiteGoat>> {
  const map = new Map<string, LiteGoat>();
  let frontier = rootIds.filter(Boolean);

  for (let gen = 0; gen <= depth && frontier.length > 0; gen++) {
    const rows = await prisma.goat.findMany({
      where: { id: { in: frontier } },
      select: { id: true, name: true, motherId: true, fatherId: true },
    });
    const nextFrontier: string[] = [];
    for (const r of rows) {
      if (!map.has(r.id)) map.set(r.id, r);
      if (r.motherId && !map.has(r.motherId)) nextFrontier.push(r.motherId);
      if (r.fatherId && !map.has(r.fatherId)) nextFrontier.push(r.fatherId);
    }
    frontier = [...new Set(nextFrontier)];
  }
  return map;
}

function grandparentsOf(id: string | null, map: Map<string, LiteGoat>): string[] {
  if (!id) return [];
  const g = map.get(id);
  if (!g) return [];
  return [g.fatherId, g.motherId].filter((x): x is string => !!x);
}

/**
 * Checks a proposed male x female mating for close-relative breeding.
 * Returns a human-readable warning string, or null if no concern found.
 * Covers: parent x offspring, full siblings, half siblings,
 * grandparent x grandchild, and shared-grandparent (first cousins).
 */
export async function checkInbreeding(maleId: string, femaleId: string): Promise<string | null> {
  if (!maleId || !femaleId) return null;

  const map = await loadAncestorMap([maleId, femaleId], 3);
  const male = map.get(maleId);
  const female = map.get(femaleId);
  if (!male || !female) return null;

  // Direct parent/offspring
  if (male.fatherId === female.id || male.motherId === female.id) {
    return `WARNING: ${female.name} is a parent of ${male.name}. This mating is not recommended.`;
  }
  if (female.fatherId === male.id || female.motherId === male.id) {
    return `WARNING: ${male.name} is the father of ${female.name}. This mating is not recommended.`;
  }

  // Full siblings
  if (male.fatherId && female.fatherId && male.fatherId === female.fatherId && male.motherId && female.motherId && male.motherId === female.motherId) {
    return `WARNING: ${male.name} and ${female.name} are full siblings (same mother and father).`;
  }

  // Half siblings
  const halfSibling =
    (male.fatherId && male.fatherId === female.fatherId) ||
    (male.motherId && male.motherId === female.motherId);
  if (halfSibling) {
    return `WARNING: ${male.name} and ${female.name} are half-siblings (share one parent).`;
  }

  // Grandparent x grandchild
  const maleGrandparents = [...grandparentsOf(male.fatherId, map), ...grandparentsOf(male.motherId, map)];
  const femaleGrandparents = [...grandparentsOf(female.fatherId, map), ...grandparentsOf(female.motherId, map)];

  if (maleGrandparents.includes(female.id)) {
    return `WARNING: ${female.name} is a grandparent of ${male.name}. Closely related — not recommended.`;
  }
  if (femaleGrandparents.includes(male.id)) {
    return `WARNING: ${male.name} is a grandparent of ${female.name}. Closely related — not recommended.`;
  }

  // Shared grandparent (first cousins)
  const shared = maleGrandparents.some((gp) => femaleGrandparents.includes(gp));
  if (shared) {
    return `WARNING: ${male.name} and ${female.name} share a grandparent (closely related).`;
  }

  return null;
}

/** Returns { father, mother, paternalGrandfather, paternalGrandmother, maternalGrandfather, maternalGrandmother } for display. */
export async function getPedigreeTree(goatId: string) {
  const goat = await prisma.goat.findUnique({ where: { id: goatId } });
  if (!goat) return null;
  const map = await loadAncestorMap([goatId], 3);

  const father = goat.fatherId ? map.get(goat.fatherId) ?? null : null;
  const mother = goat.motherId ? map.get(goat.motherId) ?? null : null;
  const pgf = father?.fatherId ? map.get(father.fatherId) ?? null : null;
  const pgm = father?.motherId ? map.get(father.motherId) ?? null : null;
  const mgf = mother?.fatherId ? map.get(mother.fatherId) ?? null : null;
  const mgm = mother?.motherId ? map.get(mother.motherId) ?? null : null;

  return { goat, father, mother, pgf, pgm, mgf, mgm };
}
