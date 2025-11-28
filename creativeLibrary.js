/* ------------------------------------------------------------
   ERWEITERTE CREATIVE LIBRARY FUNKTIONEN
   Füge diese Funktionen zu deiner creativeLibrary.js hinzu
------------------------------------------------------------- */

import { AppState } from "./state.js";
import { demoCreatives, demoCreators, demoHookAnalysis } from "./demoData.js";
import { showToast, openModal } from "./uiCore.js";

/* -----------------------------------------------------------
    TOP PERFORMERS & BOTTOM PERFORMERS CARDS
    (Für Dashboard Integration)
----------------------------------------------------------- */

export function renderCreativePerformanceCards() {
    const isDemo = !!AppState.settings?.demoMode;
    
    if (!isDemo) return;

    // Top 3 Winners
    const topCreatives = [...demoCreatives]
        .filter(c => c.performance === "Winner" || c.performance === "Gut")
        .sort((a, b) => b.roas - a.roas)
        .slice(0, 3);

    // Bottom Performers
    const bottomCreatives = [...demoCreatives]
        .filter(c => c.performance === "Schwach")
        .slice(0, 2);

    return {
        topPerformers: renderTopPerformersHTML(topCreatives),
        bottomPerformers: renderBottomPerformersHTML(bottomCreatives)
    };
}

function renderTopPerformersHTML(creatives) {
    if (!creatives.length) return "";

    return `
        <div class="performance-cards-section top-performers">
            <h3 class="section-title">🏆 Top Performers (letzte 7 Tage)</h3>
            <div class="performance-cards-grid">
                ${creatives.map((c, idx) => `
                    <div class="performance-card top-performer" data-creative-id="${c.id}">
                        <div class="performance-rank">${["🥇", "🥈", "🥉"][idx]}</div>
                        <div class="performance-thumbnail">
                            <img src="${c.thumbnail}" alt="${c.name}" />
                            <div class="performance-score">Score: ${c.score}/100</div>
                        </div>
                        <div class="performance-content">
                            <div class="performance-name">${c.name}</div>
                            <div class="performance-meta">
                                ${c.creator ? `👤 ${c.creator}` : "📸 Static"} • 
                                ${c.hook} • 
                                ${c.days_running} Tage
                            </div>
                            <div class="performance-metrics">
                                <div class="metric-chip roas">
                                    <span class="metric-label">ROAS</span>
                                    <span class="metric-value">${c.roas.toFixed(1)}x</span>
                                </div>
                                <div class="metric-chip spend">
                                    <span class="metric-label">Spend</span>
                                    <span class="metric-value">€${formatNumber(c.spend)}</span>
                                </div>
                                <div class="metric-chip ctr">
                                    <span class="metric-label">CTR</span>
                                    <span class="metric-value">${c.ctr.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div class="performance-badges">
                                <span class="badge winner">✨ ${c.performance}</span>
                                <span class="badge hook">${c.hook}</span>
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}

function renderBottomPerformersHTML(creatives) {
    if (!creatives.length) return "";

    return `
        <div class="performance-cards-section bottom-performers">
            <h3 class="section-title danger">💀 Bottom Performers — Immediate Action Needed</h3>
            <div class="performance-cards-grid">
                ${creatives.map(c => `
                    <div class="performance-card bottom-performer" data-creative-id="${c.id}">
                        <div class="danger-badge">❌ LOSER</div>
                        <div class="performance-thumbnail faded">
                            <img src="${c.thumbnail}" alt="${c.name}" />
                        </div>
                        <div class="performance-content">
                            <div class="performance-name">${c.name}</div>
                            <div class="performance-metrics danger">
                                <span>ROAS ${c.roas.toFixed(1)}x</span>
                                <span>€${formatNumber(c.spend)} verschwendet</span>
                                <span>CTR ${c.ctr.toFixed(1)}%</span>
                            </div>
                            <div class="sensei-recommendation-box">
                                <div class="sensei-icon-small">🧠</div>
                                <div class="recommendation-text">
                                    <strong>SENSEI EMPFEHLUNG:</strong><br>
                                    Pausiere sofort. Ersetze durch Hook-Based UGC. 
                                    Teste Variante mit Creator Mia (historisch +180% besser).
                                </div>
                            </div>
                            <div class="action-buttons-compact">
                                <button class="btn-danger btn-sm" onclick="pauseCreative('${c.id}')">
                                    ⏸️ Pausieren
                                </button>
                                <button class="btn-secondary btn-sm" onclick="showCreativeDetails('${c.id}')">
                                    📊 Details
                                </button>
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}

/* -----------------------------------------------------------
    CREATOR LEADERBOARD
----------------------------------------------------------- */

export function renderCreatorLeaderboard() {
    const container = document.getElementById("creatorLeaderboardContainer");
    if (!container) return;

    const isDemo = !!AppState.settings?.demoMode;

    if (!isDemo) {
        container.innerHTML = "";
        return;
    }

    const creators = demoCreators || [];

    container.innerHTML = `
        <div class="creator-leaderboard-section">
            <h3 class="section-title">👤 Creator Leaderboard (Top Performers)</h3>
            <div class="creator-leaderboard-grid">
                ${creators.map((creator, idx) => `
                    <div class="creator-card ${creator.trend}" data-creator-id="${creator.id}">
                        <div class="creator-rank">${idx + 1}</div>
                        <div class="creator-avatar">
                            <img src="${creator.avatar}" alt="${creator.name}" />
                            ${creator.trend === "up" ? '<div class="trend-badge up">📈</div>' : ""}
                            ${creator.trend === "down" ? '<div class="trend-badge down">📉</div>' : ""}
                        </div>
                        <div class="creator-content">
                            <div class="creator-name">${creator.name}</div>
                            <div class="creator-stats">
                                <div class="stat-row">
                                    <span class="stat-label">Performance Score</span>
                                    <span class="stat-value score">${creator.performance_score}/100</span>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-label">Avg ROAS</span>
                                    <span class="stat-value">${creator.avg_roas.toFixed(1)}x</span>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-label">Avg CTR</span>
                                    <span class="stat-value">${creator.avg_ctr.toFixed(1)}%</span>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-label">Total Spend</span>
                                    <span class="stat-value">€${formatNumber(creator.total_spend)}</span>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-label">Win Rate</span>
                                    <span class="stat-value">${creator.win_rate}%</span>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-label">Creatives</span>
                                    <span class="stat-value">${creator.total_creatives} (${creator.active_creatives} aktiv)</span>
                                </div>
                            </div>
                            <button class="btn-secondary btn-sm btn-creator-profile" data-creator-id="${creator.id}">
                                👤 Profil ansehen
                            </button>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;

    // Event Listeners
    document.querySelectorAll(".btn-creator-profile").forEach(btn => {
        btn.addEventListener("click", function() {
            const creatorId = this.getAttribute("data-creator-id");
            showCreatorProfile(creatorId);
        });
    });
}

/* -----------------------------------------------------------
    CREATOR PROFILE MODAL
----------------------------------------------------------- */

function showCreatorProfile(creatorId) {
    const creator = demoCreators.find(c => c.id === creatorId);
    if (!creator) return;

    // Get creatives by this creator
    const creatorCreatives = demoCreatives.filter(c => c.creator === creator.name);

    const html = `
        <div class="creator-profile-modal">
            <!-- Header -->
            <div class="profile-header">
                <div class="profile-avatar-large">
                    <img src="${creator.avatar}" alt="${creator.name}" />
                </div>
                <div class="profile-header-content">
                    <h3 class="profile-name">${creator.name}</h3>
                    <div class="profile-score">
                        Performance Score: <strong>${creator.performance_score}/100</strong>
                        ${creator.trend === "up" ? "📈" : creator.trend === "down" ? "📉" : ""}
                    </div>
                </div>
            </div>

            <!-- Lifetime Stats -->
            <div class="modal-section">
                <h4 class="modal-section-title">📊 Lifetime Stats</h4>
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-label">Creatives</div>
                        <div class="stat-value-large">${creator.total_creatives}</div>
                        <div class="stat-sub">${creator.active_creatives} aktiv</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Total Spend</div>
                        <div class="stat-value-large">€${formatNumber(creator.total_spend)}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Total Revenue</div>
                        <div class="stat-value-large">€${formatNumber(creator.total_revenue)}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Avg ROAS</div>
                        <div class="stat-value-large">${creator.avg_roas.toFixed(1)}x</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Win Rate</div>
                        <div class="stat-value-large">${creator.win_rate}%</div>
                        <div class="stat-sub">${Math.round(creator.total_creatives * creator.win_rate / 100)} Winners</div>
                    </div>
                </div>
            </div>

            <!-- Strengths & Weaknesses -->
            <div class="modal-section">
                <h4 class="modal-section-title">🎯 Stärken & Schwächen</h4>
                ${creator.strengths.length > 0 ? `
                    <div class="strengths-box">
                        <div class="box-label">✅ Stärken:</div>
                        <ul class="strengths-list">
                            ${creator.strengths.map(s => `<li>${s}</li>`).join("")}
                        </ul>
                    </div>
                ` : ""}
                ${creator.weaknesses.length > 0 ? `
                    <div class="weaknesses-box">
                        <div class="box-label">⚠️ Schwächen:</div>
                        <ul class="weaknesses-list">
                            ${creator.weaknesses.map(w => `<li>${w}</li>`).join("")}
                        </ul>
                    </div>
                ` : ""}
            </div>

            <!-- Sensei Recommendation -->
            <div class="sensei-recommendation-large">
                <div class="sensei-icon-large">🧠</div>
                <div class="sensei-content-large">
                    <h4>SENSEI EMPFEHLUNG:</h4>
                    <p>
                        ${creator.name} ist ${creator.performance_score >= 85 ? "einer deiner Top-Performer" : creator.performance_score >= 70 ? "ein solider Performer" : "unter Benchmark"}.
                        ${creator.performance_score >= 85 ? `Produziere sofort 5 weitere Varianten mit ${creator.name}. Fokus: ${creator.strengths[0]}. Erwarteter zusätzlicher Revenue: €${formatNumber(Math.round(creator.total_revenue * 0.35))}/Monat bei gleichem Budget.` : ""}
                    </p>
                </div>
            </div>

            <!-- All Creatives by this Creator -->
            <div class="modal-section">
                <h4 class="modal-section-title">🎬 Alle Creatives von ${creator.name} (${creatorCreatives.length})</h4>
                <div class="creatives-mini-grid">
                    ${creatorCreatives.map(c => `
                        <div class="creative-mini-card" onclick="showCreativeDetails('${c.id}')">
                            <img src="${c.thumbnail}" alt="${c.name}" />
                            <div class="mini-card-overlay">
                                <div class="mini-card-metric">ROAS: ${c.roas.toFixed(1)}x</div>
                                <div class="mini-card-metric">CTR: ${c.ctr.toFixed(1)}%</div>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>

            <!-- Actions -->
            <div class="modal-actions">
                <button class="btn-primary" onclick="orderNewCreatives('${creator.id}')">
                    🎨 Neue Creatives bestellen
                </button>
                <button class="btn-secondary" onclick="contactCreator('${creator.id}')">
                    📧 Kontakt
                </button>
            </div>
        </div>
    `;

    openModal(`👤 Creator Profil: ${creator.name}`, html);
}

/* -----------------------------------------------------------
    HOOK ANALYSIS VIEW
----------------------------------------------------------- */

export function renderHookAnalysis() {
    const container = document.getElementById("hookAnalysisContainer");
    if (!container) return;

    const isDemo = !!AppState.settings?.demoMode;

    if (!isDemo) {
        container.innerHTML = "";
        return;
    }

    const hooks = demoHookAnalysis || [];

    container.innerHTML = `
        <div class="hook-analysis-section">
            <h3 class="section-title">🎬 Hook Performance Analysis</h3>
            <p class="section-description">
                Analysiere, welche Hook-Typen am besten performen und optimiere deine Creative-Strategie.
            </p>
            
            <div class="hook-cards-grid">
                ${hooks.map((hook, idx) => {
                    const rankEmoji = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
                    const performanceClass = hook.avg_roas >= 6 ? "excellent" : hook.avg_roas >= 4 ? "good" : hook.avg_roas >= 3 ? "medium" : "poor";
                    
                    return `
                        <div class="hook-card ${performanceClass}">
                            <div class="hook-card-header">
                                <div class="hook-rank">${rankEmoji}</div>
                                <div class="hook-title">${hook.hook_type}</div>
                            </div>
                            
                            <div class="hook-metrics-grid">
                                <div class="hook-metric">
                                    <span class="hook-metric-label">Avg ROAS</span>
                                    <span class="hook-metric-value">${hook.avg_roas.toFixed(1)}x</span>
                                </div>
                                <div class="hook-metric">
                                    <span class="hook-metric-label">Avg CTR</span>
                                    <span class="hook-metric-value">${hook.avg_ctr.toFixed(1)}%</span>
                                </div>
                                <div class="hook-metric">
                                    <span class="hook-metric-label">Win Rate</span>
                                    <span class="hook-metric-value">${hook.win_rate}%</span>
                                </div>
                                <div class="hook-metric">
                                    <span class="hook-metric-label">Creatives</span>
                                    <span class="hook-metric-value">${hook.total_creatives}</span>
                                </div>
                            </div>

                            <div class="hook-spend-bar">
                                <div class="hook-spend-label">Total Spend:</div>
                                <div class="hook-spend-value">€${formatNumber(hook.total_spend)}</div>
                                <div class="hook-progress-bar">
                                    <div class="hook-progress-fill ${performanceClass}" 
                                         style="width: ${Math.min(hook.avg_roas * 15, 100)}%"></div>
                                </div>
                            </div>

                            <div class="hook-message ${performanceClass}">
                                ${hook.message}
                            </div>

                            ${hook.best_example ? `
                                <div class="hook-best-example">
                                    <div class="example-label">🌟 Best Example:</div>
                                    <div class="example-text">${hook.best_example}</div>
                                </div>
                            ` : ""}
                        </div>
                    `;
                }).join("")}
            </div>

            <!-- Sensei Strategic Recommendation -->
            <div class="hook-sensei-box">
                <div class="sensei-icon-large">🧠</div>
                <div class="sensei-content-large">
                    <h4>SENSEI STRATEGISCHE EMPFEHLUNG</h4>
                    <p>
                        <strong>"${hooks[0].hook_type}"</strong> ist dein Winner-Format mit 
                        ${hooks[0].avg_roas.toFixed(1)}x ROAS und ${hooks[0].win_rate}% Win-Rate.
                    </p>
                    <p>
                        Produziere <strong>80% deiner neuen Creatives</strong> in diesem Stil. 
                        Erwarteter ROAS Uplift: <strong>+1.2x über 30 Tage</strong>.
                    </p>
                    <div class="sensei-action-steps">
                        <h5>Nächste Schritte:</h5>
                        <ul>
                            <li>✅ 5 neue ${hooks[0].hook_type} Varianten produzieren</li>
                            <li>❌ Alle ${hooks[hooks.length - 1].hook_type} Creatives pausieren</li>
                            <li>🧪 A/B Test: ${hooks[0].hook_type} vs ${hooks[1].hook_type}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/* -----------------------------------------------------------
    HELPER FUNCTIONS
----------------------------------------------------------- */

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "k";
    }
    return num.toFixed(0);
}

window.pauseCreative = function(creativeId) {
    alert(`Creative ${creativeId} wird pausiert...\n\n(Demo-Modus — keine echte Aktion)`);
};

window.showCreativeDetails = function(creativeId) {
    const creative = demoCreatives.find(c => c.id === creativeId);
    if (!creative) return;
    
    alert(`📊 Creative Details\n\n${creative.name}\n\nROAS: ${creative.roas.toFixed(1)}x\nSpend: €${creative.spend}\n\n(Detailansicht kommt in Phase 2)`);
};

window.orderNewCreatives = function(creatorId) {
    alert(`Neue Creatives werden bestellt...\n\n(Demo-Modus — Feature kommt in Phase 2)`);
};

window.contactCreator = function(creatorId) {
    alert(`Kontakt zu Creator wird hergestellt...\n\n(Demo-Modus — Feature kommt in Phase 2)`);
};

console.log("✅ Enhanced Creative Library Functions loaded!");
