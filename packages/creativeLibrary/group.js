// packages/creativeLibrary/group.js
// ---------------------------------------------------------
//  P2.3 – Varianten-Gruppierung (Hybrid C)
//  Nutzt den variantKey aus compute.js, um Creatives in
//  sinnvolle Varianten-Gruppen zu clustern.
// ---------------------------------------------------------

/**
 * Gruppiert eine Liste von normalisierten Creatives
 * (aus compute.js) zu Varianten-Gruppen.
 *
 * Hybrid-Logik C:
 *   1) Primär: creative.variantKey (technische ID, falls vorhanden)
 *   2) Fallback: Creator + Hook + Format (bereits in variantKey enthalten)
 *
 * @param {Array<Object>} creatives
 * @returns {{
 *   groups: Array<{ key:string, main:Object, items:Array<Object>, variantCount:number }>,
 *   byCreativeId: Map<string, { key:string, main:Object, items:Array<Object>, variantCount:number }>
 * }}
 */
export function groupCreatives(creatives) {
  if (!Array.isArray(creatives) || !creatives.length) {
    return {
      groups: [],
      byCreativeId: new Map(),
    };
  }

  const groupsByKey = new Map();
  const byCreativeId = new Map();

  for (const c of creatives) {
    if (!c || !c.id) continue;

    const key = c.variantKey || c.id;
    let group = groupsByKey.get(key);

    if (!group) {
      group = {
        key,
        main: c,
        items: [],
        variantCount: 0,
      };
      groupsByKey.set(key, group);
    }

    group.items.push(c);

    // „Main“-Variante = höchste Score (Fallback: höchster Spend)
    const currentMain = group.main || c;
    const currentScore = currentMain.score ?? currentMain.metrics?.spend ?? 0;
    const candidateScore = c.score ?? c.metrics?.spend ?? 0;

    if (candidateScore > currentScore) {
      group.main = c;
    }
  }

  // Nachlauf: variantCount & Lookup per creativeId
  for (const group of groupsByKey.values()) {
    group.variantCount = group.items.length;
    for (const item of group.items) {
      byCreativeId.set(item.id, group);
    }
  }

  return {
    groups: Array.from(groupsByKey.values()),
    byCreativeId,
  };
}
