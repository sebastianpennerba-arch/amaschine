function buildDemoTestingLog(DemoData) {
  const creatives = DemoData.creatives || [];
  if (creatives.length < 2) return [];

  // simple pairing in twos
  const entries = [];
  for (let i = 0; i < creatives.length - 1; i += 2) {
    const A = creatives[i];
    const B = creatives[i + 1];
    const winner =
      (A.roas || 0) > (B.roas || 0) ? "A" : (B.roas || 0) > (A.roas || 0) ? "B" : "tie";

    entries.push({
      id: `demo_${A.id}_${B.id}`,
      createdAt: new Date().toISOString(),
      creativeA: A,
      creativeB: B,
      winner,
      metricsA: { roas: A.roas, ctr: A.ctr, cpm: A.cpm, spend: A.spend, purchases: A.purchases },
      metricsB: { roas: B.roas, ctr: B.ctr, cpm: B.cpm, spend: B.spend, purchases: B.purchases }
    });
  }
  return entries;
}
