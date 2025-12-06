function buildDemoSummary(DemoData) {
  const brands = DemoData.brands || [];

  const totalSpend = brands.reduce((sum, b) => sum + (b.spend30d || 0), 0);
  const totalRevenue = brands.reduce((sum, b) => sum + (b.revenue30d || 0), 0);
  const totalPurchases = brands.reduce((sum, b) => sum + (b.purchases30d || 0), 0);

  const avgRoas =
    brands.length > 0
      ? brands.reduce((sum, b) => sum + (b.roas30d || 0), 0) / brands.length
      : 0;

  const avgCtr =
    brands.length > 0
      ? brands.reduce((sum, b) => sum + (b.ctr30d || 0), 0) / brands.length
      : 0;

  const avgCpm =
    brands.length > 0
      ? brands.reduce((sum, b) => sum + (b.cpm30d || 0), 0) / brands.length
      : 0;

  const sortedByRoas = [...brands].sort((a, b) => (b.roas30d || 0) - (a.roas30d || 0));

  return {
    metrics: {
      spend30d: totalSpend,
      revenue30d: totalRevenue,
      roas30d: avgRoas,
      ctr30d: avgCtr,
      cpm30d: avgCpm,
      purchases30d: totalPurchases
    },
    alerts: {
      level: "good",
      items: [
        {
          severity: "info",
          title: "Demo-Modus aktiv",
          message: "Du siehst hochwertige Demo-Daten aus mehreren DTC-Brands."
        }
      ]
    },
    bestCampaign: sortedByRoas[0]
      ? {
          name: sortedByRoas[0].name,
          roas: sortedByRoas[0].roas30d,
          spend: sortedByRoas[0].spend30d
        }
      : null,
    worstCampaign: sortedByRoas[sortedByRoas.length - 1]
      ? {
          name: sortedByRoas[sortedByRoas.length - 1].name,
          roas: sortedByRoas[sortedByRoas.length - 1].roas30d,
          spend: sortedByRoas[sortedByRoas.length - 1].spend30d
        }
      : null,
    bestCreative: DemoData.creatives?.[0] || null,
    worstCreative:
      DemoData.creatives?.[DemoData.creatives.length - 1] || null
  };
}
