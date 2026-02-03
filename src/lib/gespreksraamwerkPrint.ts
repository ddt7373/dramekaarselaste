/**
 * Generates a standalone HTML document for printing the gespreksraamwerk.
 * Uses the same format as info.html for consistent, print-friendly output.
 */

const esc = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export interface FrameworkPrintContext {
  fw: any;
  t: Record<string, string>;
  language: 'af' | 'en';
  klasNaam: string;
  leerders: { naam: string; van: string }[];
  catNames: { knowledge: string; attitude: string; skill: string; values: string };
  kgvwCounts: { knowledge: number; attitude: number; skill: number; values: number };
  kgvwPersentasies: { knowledge: number; attitude: number; skill: number; values: number };
  sterkste: string;
  swakste: string;
  defaultGroupTips: string[];
  defaultPrepChecklist: string[];
}

function renderVraagHtml(vraag: any, t: Record<string, string>): string {
  const v = typeof vraag === 'object' ? vraag : { vraag };
  let html = `<div class="vraag-kaart"><p class="vraag-tekst">${esc(v.vraag || vraag)}</p>`;
  if (v.doel) html += `<p class="vraag-meta">${esc(t.goal)}: ${esc(v.doel)}</p>`;
  if (v.opvolg) html += `<p class="vraag-opvolg">${esc(t.followUp)}: "${esc(v.opvolg)}"</p>`;
  if (v.benadering) html += `<p class="vraag-benadering">${esc(t.approach)}: ${esc(v.benadering)}</p>`;
  if (v.groep_wenk) html += `<p class="vraag-wenk">${esc(t.groupTip)}: ${esc(v.groep_wenk)}</p>`;
  html += '</div>';
  return html;
}

export function generateFrameworkPrintHtml(ctx: FrameworkPrintContext): string {
  const { fw, t, language, klasNaam, leerders, catNames, kgvwCounts, kgvwPersentasies, sterkste, swakste, defaultGroupTips, defaultPrepChecklist } = ctx;

  const sections: string[] = [];

  // Header
  sections.push(`
    <h1>${esc(fw.inleiding?.titel || t.groupFramework)}</h1>
    ${fw.inleiding?.subtitel ? `<p class="subtitle">${esc(fw.inleiding.subtitel)}</p>` : ''}
    <div class="info-box">
      <p><strong>${esc(t.group)}:</strong> ${esc(klasNaam)} · ${leerders.length} ${esc(t.learners)}</p>
      <p class="leerders">${esc(leerders.map(l => `${l.naam} ${l.van}`).join(', '))}</p>
    </div>
  `);

  // KGVW summary (if available)
  const total = kgvwCounts.knowledge + kgvwCounts.attitude + kgvwCounts.skill + kgvwCounts.values;
  if (total > 0 || fw.skav_opsomming) {
    sections.push(`
      <div class="kgvw-box">
        <h3>KGVW Opsomming</h3>
        <ul>
          <li>${esc(catNames.knowledge)}: ${kgvwCounts.knowledge} (${kgvwPersentasies.knowledge}%)</li>
          <li>${esc(catNames.attitude)}: ${kgvwCounts.attitude} (${kgvwPersentasies.attitude}%)</li>
          <li>${esc(catNames.skill)}: ${kgvwCounts.skill} (${kgvwPersentasies.skill}%)</li>
          <li>${esc(catNames.values)}: ${kgvwCounts.values} (${kgvwPersentasies.values}%)</li>
        </ul>
      </div>
    `);
  }

  // Voorbereiding
  const prepTips = fw.inleiding?.groepsdinamika_wenke || defaultGroupTips;
  const prepChecklist = fw.inleiding?.voorbereiding || defaultPrepChecklist;
  sections.push(`
    <h2>${esc(t.preparation)}</h2>
    <div class="section-card">
      <h3>${esc(t.goalOfDiscussion)}</h3>
      <p>${esc(fw.inleiding?.doel)}</p>
      <div class="highlight-box">
        <p><strong>${esc(t.tone)}:</strong> ${esc(fw.inleiding?.toon)}</p>
      </div>
      <p class="meta">${esc(t.timeframe)}: ${esc(fw.inleiding?.tydsraamwerk)} · ${esc(t.groupSize)}: ${leerders.length} ${esc(t.learners)}</p>
    </div>
    <div class="section-card">
      <h3>${esc(t.groupDynamicsTips)}</h3>
      <ul>${prepTips.map((item: string) => `<li>${esc(item)}</li>`).join('')}</ul>
    </div>
    <div class="section-card">
      <h3>${esc(t.preparationChecklist)}</h3>
      <ul>${prepChecklist.map((item: string) => `<li>${esc(item)}</li>`).join('')}</ul>
    </div>
  `);

  // 1. Opening
  if (fw.fase1_opening) {
    const fase = fw.fase1_opening;
    let html = `<h2>1. ${esc(t.opening)}</h2><div class="phase-card">`;
    html += `<div class="phase-header"><h3>${esc(fase.titel)}</h3><p>${esc(fase.doel)}</p></div>`;
    html += `<h4>${esc(fase.begin_so?.titel || t.startDiscussion)}</h4>`;
    html += (fase.begin_so?.voorbeelde || []).map((v: string) => `<div class="voorbeeld">${esc(v)}</div>`).join('');
    html += `<h4>${esc(t.icebreakers)}</h4><p class="tip">${esc(t.icebreakerTip)}</p>`;
    (fase.ysbreker_vrae || []).forEach((vraag: any) => { html += renderVraagHtml(vraag, t); });
    html += `<h4>${esc(fase.oorgang_na_les?.titel || t.transitionToLesson)}</h4>`;
    html += (fase.oorgang_na_les?.voorbeelde || []).map((v: string) => `<div class="voorbeeld">${esc(v)}</div>`).join('');
    html += '</div>';
    sections.push(html);
  }

  // 2. Erkenning
  if (fw.fase2_erkenning) {
    const fase = fw.fase2_erkenning;
    const sterkpunte = Array.isArray(fase.sterkpunte_om_te_erken) ? fase.sterkpunte_om_te_erken : (typeof fase.sterkpunte_om_te_erken === 'string' ? [fase.sterkpunte_om_te_erken] : []);
    const hoeOmTeErken = Array.isArray(fase.hoe_om_te_erken) ? fase.hoe_om_te_erken : (typeof fase.hoe_om_te_erken === 'string' ? [fase.hoe_om_te_erken] : []);
    const vermyDit = Array.isArray(fase.vermy_dit) ? fase.vermy_dit : (typeof fase.vermy_dit === 'string' ? [fase.vermy_dit] : []);
    let html = `<h2>2. ${esc(t.recognition)}</h2><div class="phase-card">`;
    html += `<div class="phase-header"><h3>${esc(fase.titel)}</h3><p>${esc(fase.doel)}</p></div>`;
    html += `<div class="highlight-box"><p><strong>${esc(t.whyImportant)}:</strong> ${esc(fase.waarom_belangrik)}</p></div>`;
    html += `<h4>${esc(t.strengthsToRecognize)}</h4><ul>${sterkpunte.map((p: string) => `<li>${esc(p)}</li>`).join('')}</ul>`;
    html += `<h4>${esc(t.howToRecognize)}</h4>`;
    hoeOmTeErken.forEach((item: any) => {
      const txt = typeof item === 'object' ? (item.voorbeeld || item) : item;
      html += `<div class="voorbeeld">"${esc(txt)}"</div>`;
    });
    html += `<h4>${esc(t.avoidInGroup)}</h4><ul>${vermyDit.map((item: string) => `<li>${esc(item)}</li>`).join('')}</ul>`;
    html += '</div>';
    sections.push(html);
  }

  // 3. Verdieping
  if (fw.fase3_verdieping) {
    const fase = fw.fase3_verdieping;
    let html = `<h2>3. ${esc(t.deepening)}</h2><div class="phase-card">`;
    html += `<div class="phase-header"><h3>${esc(fase.titel)}</h3><p>${esc(fase.doel)}</p></div>`;
    html += `<div class="highlight-box"><p><strong>${esc(t.groupStrategy)}:</strong> ${esc(fase.strategie)}</p></div>`;
    if (fase.vrae_per_area?.sterkste) {
      html += `<h4>${esc(t.strongArea)}: ${esc(fase.vrae_per_area.sterkste.area)}</h4>`;
      (fase.vrae_per_area.sterkste.vrae || []).forEach((vraag: any) => { html += renderVraagHtml(vraag, t); });
    }
    if (fase.vrae_per_area?.swakste) {
      html += `<h4>${esc(t.developArea)}: ${esc(fase.vrae_per_area.swakste.area)}</h4>`;
      html += `<p>${esc(fase.vrae_per_area.swakste.benadering)}</p>`;
      (fase.vrae_per_area.swakste.vrae || []).forEach((vraag: any) => { html += renderVraagHtml(vraag, t); });
    }
    if (fase.luister_tegnieke?.length) {
      html += `<h4>${esc(t.discussionTechniques)}</h4>`;
      fase.luister_tegnieke.forEach((tegniek: any) => {
        html += `<div class="tegniek"><p><strong>${esc(tegniek.tegniek)}</strong></p><p class="voorbeeld">"${esc(tegniek.voorbeeld)}"</p></div>`;
      });
    }
    html += '</div>';
    sections.push(html);
  }

  // 4. Verhouding
  if (fw.fase4_verhouding) {
    const fase = fw.fase4_verhouding;
    let html = `<h2>4. ${esc(t.relationship)}</h2><div class="phase-card">`;
    html += `<div class="phase-header"><h3>${esc(fase.titel)}</h3><p>${esc(fase.doel)}</p></div>`;
    html += `<div class="highlight-box"><p><strong>${esc(t.coreMessage)}:</strong> ${esc(fase.kernboodskap)}</p></div>`;
    html += `<h4>${esc(t.relationshipQuestions)}</h4>`;
    (fase.verhouding_vrae || []).forEach((vraag: any) => { html += renderVraagHtml(vraag, t); });
    html += `<h4>${esc(t.groupPrayerOptions)}</h4>`;
    (fase.gebed_opsies || []).forEach((opsie: any) => {
      html += `<div class="voorbeeld"><strong>${esc(opsie.tipe)}</strong>: ${esc(opsie.beskrywing)} — "${esc(opsie.voorbeeld)}"</div>`;
    });
    html += `<h4>${esc(t.scriptureReferences)}</h4>`;
    (fase.skrifverwysings || []).forEach((skrif: any) => {
      html += `<div class="skrif"><p><strong>${esc(skrif.vers)}</strong></p><p>"${esc(skrif.teks)}"</p><p class="meta">${esc(t.application)}: ${esc(skrif.toepassing)}</p></div>`;
    });
    html += '</div>';
    sections.push(html);
  }

  // 5. Afsluiting
  if (fw.fase5_afsluiting) {
    const fase = fw.fase5_afsluiting;
    let html = `<h2>5. ${esc(t.closing)}</h2><div class="phase-card">`;
    html += `<div class="phase-header"><h3>${esc(fase.titel)}</h3><p>${esc(fase.doel)}</p></div>`;
    html += `<h4>${esc(fase.opsomming?.titel || t.groupSummary)}</h4><p>${esc(fase.opsomming?.voorbeeld)}</p>`;
    html += `<h4>${esc(t.groupChallenge)}</h4>`;
    (fase.praktiese_stappe || []).forEach((stap: any, i: number) => {
      html += `<div class="stap"><strong>${i + 1}.</strong> ${esc(stap.stap)} — ${esc(stap.beskrywing)} "${esc(stap.voorbeeld)}"</div>`;
    });
    html += `<h4>${esc(t.closingWords)}</h4>`;
    (fase.afsluitingswoorde || []).forEach((woord: string) => { html += `<div class="voorbeeld">"${esc(woord)}"</div>`; });
    html += `<h4>${esc(fase.opvolg_plan?.titel || t.followUpPlan)}</h4><ul>`;
    (fase.opvolg_plan?.aksies || []).forEach((aksie: string) => { html += `<li>${esc(aksie)}</li>`; });
    html += '</ul></div>';
    sections.push(html);
  }

  // Hulp
  sections.push(`
    <h2>${esc(t.help)}</h2>
    <div class="section-card">
      <h3>${esc(t.difficultSituations)}</h3>
      ${(fw.moeilike_situasies?.situasies || []).map((sit: any) => `
        <div class="situasie">
          <p><strong>${esc(sit.situasie)}</strong></p>
          ${sit.tekens ? `<p>${esc(t.signs)}: ${(sit.tekens || []).map((teken: string) => esc(teken)).join(', ')}</p>` : ''}
          ${sit.benadering ? `<ul>${(sit.benadering || []).map((b: string) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
          ${sit.noodlyne ? `<p>${esc(t.emergencyLines)}: ${(sit.noodlyne || []).map((n: any) => `${esc(n.naam)}: ${esc(n.nommer)}`).join(', ')}</p>` : ''}
        </div>
      `).join('')}
    </div>
    <div class="section-card">
      <h3>${esc(t.facilitationNotes)}</h3>
      <h4>${esc(t.remember)}</h4>
      <ul>${(fw.mentor_notas?.onthou || []).map((item: string) => `<li>${esc(item)}</li>`).join('')}</ul>
      <h4>${esc(t.boundaries)}</h4>
      <ul>${(fw.mentor_notas?.grense || []).map((item: string) => `<li>${esc(item)}</li>`).join('')}</ul>
      <h4>${esc(t.resources)}</h4>
      <ul>${(fw.mentor_notas?.hulpbronne || []).map((item: string) => `<li>${esc(item)}</li>`).join('')}</ul>
    </div>
  `);

  const content = sections.join('\n');

  return `<!DOCTYPE html>
<html lang="${language === 'af' ? 'af' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Groep Gespreksraamwerk - Dra Mekaar</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; color: #1e293b; line-height: 1.6; }
    .container { max-width: 900px; margin: 0 auto; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    h1 { color: #002855; font-size: 2rem; margin-top: 0; border-bottom: 3px solid #D4A84B; padding-bottom: 12px; }
    h2 { color: #002855; font-size: 1.35rem; margin-top: 28px; }
    h3 { color: #003d7a; font-size: 1.1rem; margin-top: 20px; }
    h4 { font-size: 1rem; margin-top: 16px; color: #475569; }
    ul { padding-left: 24px; }
    li { margin: 8px 0; }
    .info-box, .kgvw-box, .section-card, .phase-card, .highlight-box { margin: 16px 0; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .phase-header { background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 16px; border-radius: 8px 8px 0 0; margin: -16px -16px 16px -16px; }
    .phase-header h3 { margin: 0; color: white; }
    .phase-header p { margin: 4px 0 0; opacity: 0.9; font-size: 0.9rem; }
    .vraag-kaart { margin: 12px 0; padding: 12px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; }
    .vraag-tekst { font-weight: 500; margin: 0; }
    .vraag-meta, .vraag-opvolg, .vraag-benadering, .vraag-wenk { font-size: 0.85rem; color: #64748b; margin: 4px 0 0; }
    .voorbeeld { margin: 8px 0; padding: 8px 12px; background: #eff6ff; border-radius: 6px; color: #1e40af; }
    .meta { font-size: 0.9rem; color: #64748b; }
    .subtitle { color: #64748b; margin-top: 4px; }
    .leerders { font-size: 0.9rem; color: #475569; }
    .tegniek, .skrif, .stap, .situasie { margin: 12px 0; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; }
    @media print {
      @page { margin: 2cm; }
      body { padding: 0; background: white; }
      .container { box-shadow: none; border-radius: 0; max-width: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <p style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 0.9rem;">
      Dra Mekaar – NHKA Pastorale Sorg · ${new Date().toLocaleDateString(language === 'af' ? 'af-ZA' : 'en-US')}
    </p>
  </div>
</body>
</html>`;
}
