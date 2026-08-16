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

/**
 * Computes Wright's coefficient of inbreeding (as a percentage) for a
 * hypothetical mating between two goats, by finding every common
 * ancestor and summing (1/2)^(n1+n2+1) across every pair of paths
 * from each parent to that ancestor. This ignores the common
 * ancestors' own inbreeding coefficients (F_A = 0 assumption), which
 * is the standard simplification when full ancestor history isn't
 * available — it slightly underestimates true F but is the right
 * order of magnitude for a farm-management warning, not a breeding
 * registry calculation.
 */
export async function computeInbreedingCoefficient(maleId: string, femaleId: string, maxDepth = 6): Promise<number> {
  if (!maleId || !femaleId || maleId === femaleId) return 0;

  const map = await loadAncestorMap([maleId, femaleId], maxDepth);

  // For a given starting goat, find every ancestor and every path-length
  // (in generations) by which that ancestor can be reached.
  function pathLengthsToAncestors(startId: string): Map<string, number[]> {
    const result = new Map<string, number[]>();
    function walk(id: string, depth: number, visited: Set<string>) {
      if (depth > maxDepth) return;
      const g = map.get(id);
      if (!g) return;
      for (const parentId of [g.fatherId, g.motherId]) {
        if (!parentId) continue;
        if (visited.has(parentId)) continue; // avoid infinite loops on bad data
        const nextDepth = depth + 1;
        const arr = result.get(parentId) || [];
        arr.push(nextDepth);
        result.set(parentId, arr);
        walk(parentId, nextDepth, new Set(visited).add(parentId));
      }
    }
    walk(startId, 0, new Set([startId]));
    return result;
  }

  const malePaths = pathLengthsToAncestors(maleId);
  const femalePaths = pathLengthsToAncestors(femaleId);

  let F = 0;
  for (const [ancestorId, maleLengths] of malePaths) {
    const femaleLengths = femalePaths.get(ancestorId);
    if (!femaleLengths) continue;
    for (const n1 of maleLengths) {
      for (const n2 of femaleLengths) {
        F += Math.pow(0.5, n1 + n2 + 1);
      }
    }
  }

  return Math.round(F * 10000) / 100; // percentage, 2 decimal places
}

/**
 * Combined check used by the breeding form: categorical warning text
 * (for the clear, plain-language cases) plus the numeric coefficient
 * (which also catches subtler relations like first cousins that don't
 * fit a short warning sentence).
 */
export async function checkInbreedingWithCoefficient(maleId: string, femaleId: string) {
  const [warning, coefficientPercent] = await Promise.all([
    checkInbreeding(maleId, femaleId),
    computeInbreedingCoefficient(maleId, femaleId),
  ]);
  return { warning, coefficientPercent };
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
