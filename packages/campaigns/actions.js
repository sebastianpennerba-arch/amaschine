// packages/campaigns/campaigns.actions.js
// Kampagnen-Aktionen (aktuell Demo-Stubs)

export function pauseCampaign(id) {
    alert(
        `Kampagne ${id} wird pausiert...\n\n(Demo-Modus – hier würde ein Meta API Call abgesetzt werden.)`
    );
}

export function increaseCampaignBudget(id, amount = 10) {
    alert(
        `Budget von Kampagne ${id} wird um ${amount}€ erhöht...\n\n(Demo-Modus – hier würde ein Meta API Call abgesetzt werden.)`
    );
}
