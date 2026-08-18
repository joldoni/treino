/* =====================================================================
   TREINO — app principal
   ===================================================================== */
'use strict';

/* ---------------------------------------------------------------
   ARMAZENAMENTO  (chaves separadas, conforme estrutura do plano)
   --------------------------------------------------------------- */
const K = {
  exercises: 'treino.exercises',   // exercícios personalizados
  workouts:  'treino.workouts',    // sessões
  sets:      'treino.sets',        // séries (registro plano)
  cardio:    'treino.cardio',
  equipment: 'treino.equipment',
  settings:  'treino.settings',
  current:   'treino.current'      // sessão em andamento
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e) { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); }
  catch (e) { alert('Não foi possível salvar. O armazenamento do navegador pode estar cheio ou bloqueado.'); }
}

const DB = {
  get exercises() { return read(K.exercises, {}); },
  set exercises(v) { write(K.exercises, v); },
  get workouts()  { return read(K.workouts, []); },
  set workouts(v) { write(K.workouts, v); },
  get sets()      { return read(K.sets, []); },
  set sets(v)     { write(K.sets, v); },
  get cardio()    { return read(K.cardio, []); },
  set cardio(v)   { write(K.cardio, v); },
  get equipment() { return read(K.equipment, null) || EQUIPMENT_DEFAULT.slice(); },
  set equipment(v){ write(K.equipment, v); },
  get settings()  {
    return Object.assign({
      mode: 'gym', timerEnabled: true, timerSeconds: 45,
      videos: {}, lastExportAt: null
    }, read(K.settings, {}));
  },
  set settings(v) { write(K.settings, v); },
  get current()   { return read(K.current, null); },
  set current(v)  { v === null ? localStorage.removeItem(K.current) : write(K.current, v); }
};

function setSetting(k, v) { const s = DB.settings; s[k] = v; DB.settings = s; }

/* ---------------------------------------------------------------
   DATAS
   --------------------------------------------------------------- */
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const DIAS  = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];

function today() { return isoDate(new Date()); }
function isoDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function parseISO(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function fmtLong(s) {
  const d = parseISO(s);
  const t = DIAS[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()];
  return t.charAt(0).toUpperCase() + t.slice(1);
}
function fmtShort(s) { const d = parseISO(s); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); }
function daysBetween(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }

function currentPhase(date) {
  const d = date || today();
  for (const p of PHASES) if (d >= p.start && d <= p.end) return p;
  return d < PROGRAM_START ? PHASES[0] : PHASES[PHASES.length - 1];
}
function programWeek(date) {
  const d = date || today();
  if (d < PROGRAM_START) return 1;
  return Math.floor(daysBetween(PROGRAM_START, d) / 7) + 1;
}
function totalWeeks() { return Math.floor(daysBetween(PROGRAM_START, PROGRAM_END) / 7) + 1; }

/* ---------------------------------------------------------------
   EXERCÍCIOS
   --------------------------------------------------------------- */
function getEx(id) {
  const custom = DB.exercises;
  return custom[id] || EXERCISES[id] || null;
}
function allExercises() {
  return Object.assign({}, EXERCISES, DB.exercises);
}
function videoOf(id) {
  const ov = DB.settings.videos || {};
  if (ov[id]) return ov[id];
  const ex = getEx(id);
  return (ex && ex.videoUrl) || null;
}
function hasEquip(ex) {
  if (!ex || !ex.equipment || ex.equipment.length === 0) return true;
  const owned = DB.equipment;
  return ex.equipmentAny
    ? ex.equipment.some(e => owned.includes(e))
    : ex.equipment.every(e => owned.includes(e));
}
function repLabel(ex, over) {
  const rr = over || ex.repRange;
  if (ex.duration) return ex.duration[0] + '–' + ex.duration[1] + ' seg';
  if (!rr) return '—';
  const base = rr[0] === rr[1] ? String(rr[0]) : rr[0] + '–' + rr[1];
  return base + (ex.perSide ? ' por lado' : '') + ' reps';
}

/* ---------------------------------------------------------------
   SEQUÊNCIA E ESTATÍSTICAS
   --------------------------------------------------------------- */
function doneSessions() { return DB.workouts.filter(w => w.status === 'done'); }

function nextWorkoutId() {
  const done = doneSessions();
  if (done.length === 0) return SEQUENCE[0];
  const last = done[done.length - 1].workoutId;
  const i = SEQUENCE.indexOf(last);
  return SEQUENCE[(i + 1) % SEQUENCE.length];
}

function plannedSoFar() {
  const d = today();
  if (d < PROGRAM_START) return 0;
  const end = d > PROGRAM_END ? PROGRAM_END : d;
  const weeks = daysBetween(PROGRAM_START, end) / 7;
  return Math.max(1, Math.round(weeks * SESSIONS_PER_WEEK) || 1);
}

function stats() {
  const done = doneSessions().length;
  const planned = plannedSoFar();
  return { done, planned, pct: planned ? Math.min(100, Math.round(done / planned * 100)) : 0 };
}

function setsOf(exerciseId) {
  return DB.sets.filter(s => s.exerciseId === exerciseId && s.done);
}
function lastRecord(exerciseId) {
  const rows = setsOf(exerciseId);
  if (!rows.length) return null;
  const lastSession = rows[rows.length - 1].sessionId;
  return rows.filter(r => r.sessionId === lastSession);
}
function bestRecord(exerciseId) {
  const rows = setsOf(exerciseId);
  if (!rows.length) return null;
  return rows.reduce((b, r) => {
    const rw = r.weight || 0, bw = b.weight || 0;
    if (rw > bw) return r;
    if (rw === bw && (r.reps || r.seconds || 0) > (b.reps || b.seconds || 0)) return r;
    return b;
  }, rows[0]);
}
function describeSet(r) {
  if (r.seconds) return (r.weight ? r.weight + ' kg · ' : '') + r.seconds + 's';
  const w = r.weight ? r.weight + ' kg × ' : '';
  return w + (r.reps || 0) + (r.reps ? ' reps' : '');
}

/* Regra de progressão (item 16 do plano) */
function progressionHint(exerciseId, repRange) {
  const last = lastRecord(exerciseId);
  if (!last || !repRange) return null;
  const reps = last.filter(r => r.reps != null).map(r => r.reps);
  if (reps.length < 2) return null;
  if (reps.every(r => r >= repRange[1]))
    return { type: 'ok', text: 'Você atingiu o topo da faixa na última sessão. Considere aumentar ligeiramente a carga hoje.' };
  if (reps.some(r => r < repRange[0]))
    return { type: 'warn', text: 'Na última sessão você ficou abaixo da faixa. Consolide esta carga antes de aumentar.' };
  return null;
}

/* ---------------------------------------------------------------
   NAVEGAÇÃO
   --------------------------------------------------------------- */
const VIEWS = { home: renderHome, cardio: renderCardio, history: renderHistory, progress: renderProgress, settings: renderSettings };
let activeTab = 'home';

function go(tab) {
  activeTab = tab;
  document.body.classList.remove('focus');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('v-' + tab).classList.add('active');
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  if (VIEWS[tab]) VIEWS[tab]();
  window.scrollTo(0, 0);
}
document.getElementById('tabs').addEventListener('click', e => {
  const b = e.target.closest('button[data-tab]');
  if (b) go(b.dataset.tab);
});

function openWorkoutView() {
  activeTab = 'workout';
  document.body.classList.add('focus');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('v-workout').classList.add('active');
  renderWorkout();
  window.scrollTo(0, 0);
}

/* ---------------------------------------------------------------
   MODAL
   --------------------------------------------------------------- */
const modal = document.getElementById('modal');
const sheet = document.getElementById('sheet');
function openSheet(html) {
  sheet.innerHTML = '<div class="grab"></div>' + html;
  modal.classList.add('open');
}
function closeSheet() { modal.classList.remove('open'); }
modal.addEventListener('click', e => { if (e.target === modal) closeSheet(); });

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* =====================================================================
   TELA INICIAL
   ===================================================================== */
function renderHome() {
  const s = DB.settings;
  const st = stats();
  const phase = currentPhase();
  const wid = nextWorkoutId();
  const w = WORKOUTS[wid];
  const cur = DB.current;
  const all = DB.workouts;
  const lastW = all.length ? all[all.length - 1] : null;
  const lastC = DB.cardio.length ? DB.cardio[DB.cardio.length - 1] : null;
  const d = today();

  let html = `
  <div class="top">
    <div class="date">${fmtLong(d)}</div>
    <h1>${d > PROGRAM_END ? 'Programa concluído' : 'Próximo: ' + w.name}</h1>
  </div>`;

  if (needsBackup()) html += `<div class="note warn" style="margin-bottom:12px">Faz tempo que você não exporta seus dados. Os registros ficam só neste aparelho — vá em Ajustes e toque em Exportar.</div>`;

  if (cur) {
    html += `<div class="card"><div class="between">
      <div><div class="label">Em andamento</div><div style="font-weight:650;margin-top:2px">${WORKOUTS[cur.workoutId].name} · ${cur.mode === 'gym' ? 'Academia' : 'Viagem'}</div></div>
      </div>
      <div style="height:10px"></div>
      <button class="btn primary" onclick="openWorkoutView()">CONTINUAR TREINO</button>
      <div style="height:8px"></div>
      <button class="btn ghost small" onclick="discardSession()">Descartar sessão</button>
    </div>`;
  } else {
    html += `<div class="card">
      <div class="between" style="margin-bottom:6px">
        <div><div class="label">Hoje</div><div style="font-weight:650;font-size:18px;margin-top:2px">${w.name} — ${w.focus}</div></div>
      </div>
      <div class="muted small">${w.gym.length} exercícios · ${phase.name} · 25–30 min</div>
      <div style="height:14px"></div>
      <button class="btn primary" onclick="chooseMode()">COMEÇAR TREINO</button>
      <div style="height:8px"></div>
      <div class="row" style="justify-content:center">
        <span class="chip ${s.mode === 'gym' ? 'on' : ''}" onclick="setMode('gym')">Academia</span>
        <span class="chip ${s.mode === 'travel' ? 'on' : ''}" onclick="setMode('travel')">Viagem</span>
      </div>
    </div>`;
  }

  html += `<div class="stats">
    <div class="stat"><div class="v">${st.done}</div><div class="k">Realizados</div></div>
    <div class="stat"><div class="v">${st.planned}</div><div class="k">Planejados</div></div>
    <div class="stat"><div class="v">${st.pct}%</div><div class="k">Consistência</div></div>
  </div>
  <div class="bar" style="margin-bottom:12px"><i style="width:${st.pct}%"></i></div>`;

  html += `<div class="card tight">
    <div class="between"><div class="label">Fase ${phase.id} — ${phase.name}</div>
      <div class="muted small">Semana ${Math.min(programWeek(), totalWeeks())} de ${totalWeeks()}</div></div>
    <div class="muted small" style="margin-top:6px">${phase.goal}</div>
    <button class="btn ghost sm" style="margin-top:10px;width:100%" onclick="showPhase()">Ver regras da fase</button>
  </div>`;

  html += `<div class="card tight">
    <div class="label" style="margin-bottom:8px">Últimos registros</div>
    <div class="muted small" style="margin-bottom:5px">Treino: ${lastW
      ? (lastW.status === 'done'
          ? `${WORKOUTS[lastW.workoutId].name} em ${fmtShort(lastW.date)} · ${lastW.mode === 'gym' ? 'academia' : 'viagem'}`
          : `não realizado em ${fmtShort(lastW.date)}`)
      : 'nenhum ainda'}</div>
    <div class="muted small">Cardio: ${lastC ? `${cardioName(lastC)} em ${fmtShort(lastC.date)}${lastC.minutes ? ' · ' + lastC.minutes + ' min' : ''}` : 'nenhum ainda'}</div>
  </div>`;

  document.getElementById('v-home').innerHTML = html;
}

function setMode(m) { setSetting('mode', m); renderHome(); }

function showPhase() {
  const p = currentPhase();
  openSheet(`<h2>Fase ${p.id} — ${p.name}</h2>
    <div class="muted small">${fmtShort(p.start)} a ${fmtShort(p.end)}</div>
    <p class="muted" style="font-size:15px">${p.goal}</p>
    <ul>${p.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
    <button class="btn" onclick="closeSheet()">Fechar</button>`);
}

function needsBackup() {
  const s = DB.settings;
  if (DB.workouts.length < 6) return false;
  if (!s.lastExportAt) return true;
  return daysBetween(s.lastExportAt, today()) > 21;
}

/* =====================================================================
   ESCOLHA DE MODO
   ===================================================================== */
function chooseMode() {
  const wid = nextWorkoutId();
  openSheet(`<h2>${WORKOUTS[wid].name}</h2>
    <div class="muted small" style="margin-bottom:14px">Como vai ser hoje?</div>
    <button class="opt" onclick="startSession('gym')">
      <div class="t">Academia</div><div class="d">Tenho acesso aos equipamentos.</div></button>
    <button class="opt" onclick="startSession('travel')">
      <div class="t">Viagem</div><div class="d">Sem academia.</div></button>
    <button class="opt" onclick="skipFlow()">
      <div class="t">Não consegui treinar</div><div class="d">Hoje não consegui realizar o treino.</div></button>
    <button class="btn ghost" onclick="closeSheet()">Cancelar</button>`);
}

function skipFlow() {
  openSheet(`<h2>Não consegui treinar</h2>
    <div class="muted small" style="margin-bottom:14px">Qual foi o motivo?</div>
    ${[['viagem', 'Viagem'], ['tempo', 'Falta de tempo'], ['indisposicao', 'Indisposição'], ['outro', 'Outro']]
      .map(([v, t]) => `<button class="opt" onclick="saveSkip('${v}')"><div class="t">${t}</div></button>`).join('')}
    <button class="btn ghost" onclick="closeSheet()">Cancelar</button>`);
}

function saveSkip(reason) {
  const wid = nextWorkoutId();
  const ws = DB.workouts;
  ws.push({ id: 's' + Date.now(), date: today(), workoutId: wid, mode: DB.settings.mode, status: 'skipped', reason, exercises: [] });
  DB.workouts = ws;
  closeSheet();
  renderHome();
  openSheet(`<h2>Registrado</h2>
    <p class="muted" style="font-size:15px">Sessão marcada como não realizada. Sem compensação e sem treino dobrado —
    seu próximo treino continua sendo o <b style="color:var(--text)">${WORKOUTS[wid].name}</b>.</p>
    <button class="btn" onclick="closeSheet()">Ok</button>`);
}

/* =====================================================================
   SESSÃO DE TREINO
   ===================================================================== */
function startSession(mode) {
  setSetting('mode', mode);
  const wid = nextWorkoutId();
  const phase = currentPhase();
  const list = WORKOUTS[wid][mode];

  const exercises = list.map((item, i) => {
    let ex = getEx(item.exerciseId);
    let swapped = null;
    if (mode === 'gym' && !hasEquip(ex)) {
      const alt = (ex.substitutions || []).map(getEx).find(a => a && hasEquip(a));
      if (alt) { swapped = ex.exerciseId; ex = alt; }
    }
    const rr = item.repRange || ex.repRange;
    return {
      exerciseId: ex.exerciseId,
      name: ex.name,
      plannedSets: phase.setsFor(i),
      repRange: rr || null,
      duration: ex.duration || null,
      autoSwappedFrom: swapped,
      substitutedFrom: null,
      isCustom: false,
      note: null
    };
  });

  expandedEx = {};
  DB.current = {
    id: 's' + Date.now(), date: today(), workoutId: wid, mode,
    startedAt: Date.now(), phase: phase.id, exercises, sets: {}
  };
  closeSheet();
  openWorkoutView();
}

function discardSession() {
  if (!confirm('Descartar a sessão em andamento? Os registros dela serão perdidos.')) return;
  DB.current = null;
  renderHome();
}

function renderWorkout() {
  const cur = DB.current;
  if (!cur) { go('home'); return; }
  const w = WORKOUTS[cur.workoutId];
  const mins = Math.floor((Date.now() - cur.startedAt) / 60000);

  let html = `<div class="top between" style="align-items:flex-end">
    <div><div class="date">${cur.mode === 'gym' ? 'Academia' : 'Viagem'} · ${mins} min</div><h1>${w.name}</h1></div>
    <button class="btn sm" onclick="go('home')">Sair</button>
  </div>`;

  cur.exercises.forEach((it, i) => { html += exerciseCard(it, i); });

  html += `<div style="height:70px"></div>
    <div class="sticky-bot"><button class="btn primary" onclick="finishFlow()">FINALIZAR TREINO</button></div>`;

  document.getElementById('v-workout').innerHTML = html;
}

let expandedEx = {};
function toggleEx(i) { expandedEx[i] = !expandedEx[i]; renderWorkout(); }

function exerciseCard(it, i) {
  const ex = getEx(it.exerciseId) || { name: it.name, muscleGroup: '', instructions: [], commonMistakes: [] };
  const cur = DB.current;
  const logged = cur.sets[i] || [];
  const total = Math.max(it.plannedSets, logged.length);
  const doneCount = logged.filter(s => s && s.done).length;
  const allDone = doneCount >= it.plannedSets && doneCount > 0;

  const last = lastRecord(it.exerciseId);
  const best = bestRecord(it.exerciseId);
  const hint = progressionHint(it.exerciseId, it.repRange);
  const isTime = !!it.duration;

  /* exercício concluído recolhe para encurtar a rolagem durante o treino */
  if (allDone && !expandedEx[i]) {
    const summary = logged.filter(s => s && s.done).map(describeSet).join(' · ');
    return `<div class="ex done" id="ex-${i}">
      <div class="ex-head" onclick="toggleEx(${i})">
        <div class="ex-num">✓</div>
        <div class="grow"><div class="ex-name">${esc(it.name)}</div>
          <div class="ex-meta">${esc(summary)}</div></div>
        <div style="color:var(--dim);font-size:13px;margin-top:3px">editar</div>
      </div></div>`;
  }

  let html = `<div class="ex ${allDone ? 'done' : ''}" id="ex-${i}">
    <div class="ex-head" ${allDone ? `onclick="toggleEx(${i})"` : ''}>
      <div class="ex-num">${allDone ? '✓' : i + 1}</div>
      <div class="grow">
        <div class="ex-name">${esc(it.name)}</div>
        <div class="ex-meta">${esc(ex.muscleGroup || '')} · ${it.plannedSets} séries × ${isTime ? it.duration[0] + '–' + it.duration[1] + ' seg' : repLabel(ex, it.repRange)}</div>
      </div>
    </div>
    <div class="ex-body">`;

  if (it.autoSwappedFrom) {
    const orig = getEx(it.autoSwappedFrom);
    html += `<div class="note info">Substituído automaticamente: você não marcou <b>${esc(orig ? orig.name : '')}</b> nos seus equipamentos.</div>`;
  }
  if (it.substitutedFrom) {
    const orig = getEx(it.substitutedFrom);
    html += `<div class="note info">Substituindo <b>${esc(orig ? orig.name : it.substitutedFrom)}</b> nesta sessão.</div>`;
  }
  if (ex.stimulusNote) html += `<div class="note warn">${esc(ex.stimulusNote)}</div>`;
  if (ex.techniqueNote) html += `<div class="note warn">${esc(ex.techniqueNote)}</div>`;
  if (hint) html += `<div class="note ${hint.type}">${esc(hint.text)}</div>`;

  if (last || best) {
    html += `<div class="hist">`;
    if (last) html += `Última vez: <b>${last.map(describeSet).join(' · ')}</b>`;
    if (best) html += `${last ? '<br>' : ''}Melhor: <b>${describeSet(best)}</b>`;
    html += `</div>`;
  } else {
    html += `<div class="hist">Primeira vez registrando este exercício.</div>`;
  }

  html += `<div class="setheads"><span>kg</span><span>${isTime ? 'segundos' : 'repetições'}</span><i></i></div>`;
  for (let s = 0; s < total; s++) html += setRow(i, s, it, isTime);

  html += `<button class="addset" onclick="addSet(${i})">+ adicionar série</button>
    <div class="btnrow" style="margin-top:6px">
      <button class="btn sm" onclick="showHow('${it.exerciseId}')">Como fazer?</button>
      <button class="btn sm" onclick="showSwap(${i})">Substituir</button>
    </div>
  </div></div>`;
  return html;
}

function setRow(i, s, it, isTime) {
  const rec = (DB.current.sets[i] || [])[s] || {};
  const done = !!rec.done;
  const lastW = suggestWeight(it, i, s);
  const wv = rec.weight != null ? rec.weight : (lastW != null ? lastW : '');
  const rv = isTime ? (rec.seconds != null ? rec.seconds : '') : (rec.reps != null ? rec.reps : '');
  const rph = isTime ? String(it.duration[0]) : (it.repRange ? (it.repRange[0] === it.repRange[1] ? String(it.repRange[0]) : it.repRange[0] + '–' + it.repRange[1]) : '—');

  return `<div class="set ${done ? 'done' : ''}" id="set-${i}-${s}">
    <div class="set-n">${s + 1}</div>
    <div class="field">
      <button onclick="step(${i},${s},'w',-2.5)" ${done ? 'tabindex="-1"' : ''}>−</button>
      <input id="w-${i}-${s}" type="text" inputmode="decimal" placeholder="—" value="${wv}" ${done ? 'readonly' : ''}>
      <button onclick="step(${i},${s},'w',2.5)" ${done ? 'tabindex="-1"' : ''}>+</button>
    </div>
    <div class="field">
      <button onclick="step(${i},${s},'r',-1)" ${done ? 'tabindex="-1"' : ''}>−</button>
      <input id="r-${i}-${s}" type="text" inputmode="numeric" placeholder="${rph}" value="${rv}" ${done ? 'readonly' : ''}>
      <button onclick="step(${i},${s},'r',1)" ${done ? 'tabindex="-1"' : ''}>+</button>
    </div>
    <button class="tick" onclick="toggleSet(${i},${s})">${done ? '✓' : '○'}</button>
  </div>`;
}

/* Sugere a carga do campo: primeiro o que já foi usado nesta sessão,
   depois a carga da última vez que este exercício foi feito. */
function suggestWeight(it, i, setIndex) {
  const inSession = (DB.current.sets[i] || []).filter(s => s && s.done && s.weight != null);
  if (inSession.length) return inSession[inSession.length - 1].weight;
  if (it.initialWeight != null) return it.initialWeight;
  const last = lastRecord(it.exerciseId);
  if (!last || !last.length) return null;
  const r = last[Math.min(setIndex, last.length - 1)];
  return r && r.weight != null ? r.weight : null;
}

function num(v) {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(',', '.').trim());
  return isNaN(n) ? null : n;
}

function step(i, s, which, delta) {
  const el = document.getElementById((which === 'w' ? 'w-' : 'r-') + i + '-' + s);
  if (!el || el.readOnly) return;
  let v = num(el.value);
  if (v == null) v = which === 'w' ? 0 : 0;
  v = Math.max(0, Math.round((v + delta) * 10) / 10);
  el.value = which === 'w' ? (v % 1 === 0 ? v : v.toFixed(1)) : Math.round(v);
  if (navigator.vibrate) navigator.vibrate(8);
}

function addSet(i) {
  const cur = DB.current;
  cur.exercises[i].plannedSets += 1;
  DB.current = cur;
  renderWorkout();
}

function toggleSet(i, s) {
  const cur = DB.current;
  const isTime = !!cur.exercises[i].duration;
  if (!cur.sets[i]) cur.sets[i] = [];
  const existing = cur.sets[i][s];

  if (existing && existing.done) {
    cur.sets[i][s] = Object.assign({}, existing, { done: false });
    DB.current = cur;
    renderWorkout();
    return;
  }

  const w = num((document.getElementById('w-' + i + '-' + s) || {}).value);
  const r = num((document.getElementById('r-' + i + '-' + s) || {}).value);
  if (r == null) {
    const el = document.getElementById('r-' + i + '-' + s);
    if (el) { el.focus(); el.style.borderColor = 'var(--warn)'; }
    return;
  }
  cur.sets[i][s] = isTime
    ? { done: true, weight: w, seconds: Math.round(r), ts: Date.now() }
    : { done: true, weight: w, reps: Math.round(r), ts: Date.now() };
  DB.current = cur;
  if (navigator.vibrate) navigator.vibrate(24);
  renderWorkout();
  if (DB.settings.timerEnabled) startRest();
}

/* ---------------------------------------------------------------
   COMO FAZER
   --------------------------------------------------------------- */
function showHow(id) {
  const ex = getEx(id);
  if (!ex) return;
  const url = videoOf(id);
  const search = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(ex.searchQuery || ex.name);
  let html = `<h2>${esc(ex.name)}</h2><div class="muted small">${esc(ex.muscleGroup || '')}</div>`;
  if (ex.stimulusNote) html += `<div class="note warn" style="margin-top:12px">${esc(ex.stimulusNote)}</div>`;
  if (ex.techniqueNote) html += `<div class="note warn" style="margin-top:12px">${esc(ex.techniqueNote)}</div>`;
  html += `<div class="label" style="margin-top:16px">Execução</div><ul>${(ex.instructions || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
  html += `<div class="label" style="margin-top:8px">Erros comuns</div><ul>${(ex.commonMistakes || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
  html += `<div class="label" style="margin-top:14px">Vídeo</div>`;
  if (url) {
    html += `<a class="btn" style="margin-top:8px;text-decoration:none" href="${esc(url)}" target="_blank" rel="noopener">Abrir vídeo</a>`;
  } else {
    html += `<div class="muted small" style="margin:8px 0">Vídeo ainda não configurado.</div>
      <a class="btn" style="text-decoration:none" href="${esc(search)}" target="_blank" rel="noopener">Buscar no YouTube</a>
      <button class="btn ghost sm" style="width:100%;margin-top:8px" onclick="setVideo('${id}')">Salvar URL de um vídeo</button>`;
  }
  html += `<div style="height:10px"></div><button class="btn" onclick="closeSheet()">Fechar</button>`;
  openSheet(html);
}

function setVideo(id) {
  const cur = videoOf(id) || '';
  const url = prompt('Cole a URL do vídeo para "' + getEx(id).name + '":', cur);
  if (url === null) return;
  const s = DB.settings;
  s.videos = s.videos || {};
  if (url.trim()) s.videos[id] = url.trim(); else delete s.videos[id];
  DB.settings = s;
  showHow(id);
}

/* ---------------------------------------------------------------
   SUBSTITUIÇÃO
   --------------------------------------------------------------- */
function showSwap(i) {
  const cur = DB.current;
  const it = cur.exercises[i];
  const ex = getEx(it.exerciseId);
  const mode = cur.mode;

  const cands = (ex.substitutions || []).map(getEx).filter(Boolean);
  const usable = cands.filter(c => mode === 'travel' ? (!c.equipment || c.equipment.length === 0) : hasEquip(c));
  const others = cands.filter(c => !usable.includes(c));
  const rec = usable[0];

  let html = `<h2>Substituir</h2>
    <div class="muted small" style="margin-bottom:14px">${esc(it.name)} — ${esc(ex.movementPattern || '')}</div>`;

  if (rec) {
    html += `<div class="label">Recomendada</div>
      <button class="opt" style="border-color:#2f5fa8" onclick="doSwap(${i},'${rec.exerciseId}')">
        <div class="t">${esc(rec.name)}</div><div class="d">${esc(rec.muscleGroup)} · mesmo padrão de movimento</div></button>`;
  }
  if (usable.length > 1) {
    html += `<div class="label" style="margin-top:12px">Alternativas</div>` +
      usable.slice(1).map(c => `<button class="opt" onclick="doSwap(${i},'${c.exerciseId}')">
        <div class="t">${esc(c.name)}</div><div class="d">${esc(c.muscleGroup)}</div></button>`).join('');
  }
  if (others.length) {
    html += `<div class="label" style="margin-top:12px">Precisam de equipamento que você não marcou</div>` +
      others.map(c => `<button class="opt" style="opacity:.6" onclick="doSwap(${i},'${c.exerciseId}')">
        <div class="t">${esc(c.name)}</div><div class="d">${esc(c.muscleGroup)}</div></button>`).join('');
  }
  html += `<div class="label" style="margin-top:12px">Outro</div>
    <button class="opt" onclick="customSwap(${i})"><div class="t">Outro exercício</div>
      <div class="d">Registrar um exercício que não está na lista</div></button>
    <button class="btn ghost" onclick="closeSheet()">Cancelar</button>`;
  openSheet(html);
}

function doSwap(i, newId) {
  const cur = DB.current;
  const it = cur.exercises[i];
  const nx = getEx(newId);
  it.substitutedFrom = it.substitutedFrom || it.exerciseId;
  it.exerciseId = nx.exerciseId;
  it.name = nx.name;
  it.repRange = nx.repRange || null;
  it.duration = nx.duration || null;
  it.autoSwappedFrom = null;
  it.initialWeight = null;
  cur.sets[i] = [];
  DB.current = cur;
  closeSheet();
  renderWorkout();
}

function customSwap(i) {
  openSheet(`<h2>Outro exercício</h2>
    <div class="stack" style="margin-top:12px">
      <div><div class="label">Nome</div><input class="inp" id="c-name" placeholder="Ex: Remada cavalinho"></div>
      <div class="row">
        <div class="grow"><div class="label">Séries</div><input class="inp" id="c-sets" inputmode="numeric" value="2"></div>
        <div class="grow"><div class="label">Repetições</div><input class="inp" id="c-reps" placeholder="8–12"></div>
      </div>
      <div><div class="label">Carga inicial (kg, opcional)</div><input class="inp" id="c-load" inputmode="decimal" placeholder="—"></div>
      <div><div class="label">Observação</div><textarea class="inp" id="c-note" placeholder="Por que substituiu, como foi..."></textarea></div>
    </div>
    <div style="height:14px"></div>
    <button class="btn primary" onclick="saveCustom(${i})">Usar este exercício</button>
    <div style="height:8px"></div>
    <button class="btn ghost" onclick="showSwap(${i})">Voltar</button>`);
}

function saveCustom(i) {
  const name = document.getElementById('c-name').value.trim();
  if (!name) { document.getElementById('c-name').focus(); return; }
  const nsets = Math.max(1, parseInt(document.getElementById('c-sets').value, 10) || 2);
  const repsRaw = document.getElementById('c-reps').value.trim();
  const load = num(document.getElementById('c-load').value);
  const note = document.getElementById('c-note').value.trim();

  const m = repsRaw.match(/(\d+)\s*[-–—a]?\s*(\d+)?/);
  const rr = m ? [parseInt(m[1], 10), parseInt(m[2] || m[1], 10)] : null;

  const cur = DB.current;
  const it = cur.exercises[i];
  const prev = getEx(it.exerciseId);
  const id = 'custom_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  const customs = DB.exercises;
  customs[id] = {
    exerciseId: id, name, category: 'custom',
    muscleGroup: (prev && prev.muscleGroup) || 'Personalizado',
    movementPattern: (prev && prev.movementPattern) || '',
    equipment: [], repRange: rr, instructions: note ? [note] : [],
    commonMistakes: [], videoUrl: null, searchQuery: name + ' execução',
    substitutions: prev ? [prev.exerciseId] : []
  };
  DB.exercises = customs;

  it.substitutedFrom = it.substitutedFrom || it.exerciseId;
  it.exerciseId = id;
  it.name = name;
  it.plannedSets = nsets;
  it.repRange = rr;
  it.duration = null;
  it.isCustom = true;
  it.note = note || null;
  it.initialWeight = load;
  cur.sets[i] = [];
  DB.current = cur;
  closeSheet();
  renderWorkout();
}

/* ---------------------------------------------------------------
   TIMER DE DESCANSO
   --------------------------------------------------------------- */
let restTimer = null;
const restEl = document.getElementById('rest');
const restT = document.getElementById('rest-t');
document.getElementById('rest-x').onclick = stopRest;

function startRest() {
  stopRest();
  let left = DB.settings.timerSeconds || 45;
  restEl.classList.add('on'); restEl.classList.remove('done');
  restT.textContent = 'Descanso · ' + left + 's';
  restTimer = setInterval(() => {
    left--;
    if (left <= 0) {
      clearInterval(restTimer); restTimer = null;
      restT.textContent = 'Pode ir para a próxima série';
      restEl.classList.add('done');
      if (navigator.vibrate) navigator.vibrate([90, 60, 90]);
      setTimeout(stopRest, 5000);
    } else {
      restT.textContent = 'Descanso · ' + left + 's';
    }
  }, 1000);
}
function stopRest() {
  if (restTimer) { clearInterval(restTimer); restTimer = null; }
  restEl.classList.remove('on', 'done');
}

/* ---------------------------------------------------------------
   FINALIZAR
   --------------------------------------------------------------- */
function finishFlow() {
  const cur = DB.current;
  let setsDone = 0, exDone = 0, planned = 0;
  cur.exercises.forEach((it, i) => {
    planned += it.plannedSets;
    const d = (cur.sets[i] || []).filter(s => s && s.done).length;
    setsDone += d;
    if (d > 0) exDone++;
  });
  const mins = Math.max(1, Math.round((Date.now() - cur.startedAt) / 60000));
  const pct = planned ? Math.round(setsDone / planned * 100) : 0;

  openSheet(`<h2>Treino concluído</h2>
    <div class="stats" style="margin:14px 0">
      <div class="stat"><div class="v">${mins}</div><div class="k">minutos</div></div>
      <div class="stat"><div class="v">${setsDone}</div><div class="k">séries</div></div>
      <div class="stat"><div class="v">${pct}%</div><div class="k">conclusão</div></div>
    </div>
    <div class="muted small" style="margin-bottom:14px">${exDone} de ${cur.exercises.length} exercícios registrados.</div>
    <div class="label">Como foi o treino?</div>
    <div style="height:8px"></div>
    <button class="opt" onclick="saveSession('facil')"><div class="t">Fácil</div></button>
    <button class="opt" onclick="saveSession('adequado')"><div class="t">Adequado</div></button>
    <button class="opt" onclick="saveSession('dificil')"><div class="t">Difícil</div></button>
    <button class="btn ghost" onclick="closeSheet()">Voltar ao treino</button>`);
}

function saveSession(feedback) {
  const cur = DB.current;
  const durationSec = Math.round((Date.now() - cur.startedAt) / 1000);

  const exercises = cur.exercises.map((it, i) => {
    const rows = (cur.sets[i] || []).filter(s => s && s.done);
    return {
      exerciseId: it.exerciseId, name: it.name,
      plannedSets: it.plannedSets, completedSets: rows.length,
      repRange: it.repRange, substitutedFrom: it.substitutedFrom,
      autoSwappedFrom: it.autoSwappedFrom, isCustom: it.isCustom, note: it.note
    };
  });

  const setRows = DB.sets;
  cur.exercises.forEach((it, i) => {
    (cur.sets[i] || []).forEach((s, si) => {
      if (!s || !s.done) return;
      setRows.push({
        id: 'st' + s.ts + '_' + i + '_' + si,
        sessionId: cur.id, date: cur.date, workoutId: cur.workoutId, mode: cur.mode,
        exerciseId: it.exerciseId, exerciseName: it.name, setIndex: si,
        weight: s.weight != null ? s.weight : null,
        reps: s.reps != null ? s.reps : null,
        seconds: s.seconds != null ? s.seconds : null,
        done: true, ts: s.ts
      });
    });
  });
  DB.sets = setRows;

  const ws = DB.workouts;
  ws.push({
    id: cur.id, date: cur.date, workoutId: cur.workoutId, mode: cur.mode,
    status: 'done', phase: cur.phase, startedAt: cur.startedAt, endedAt: Date.now(),
    durationSec, feedback, exercises
  });
  DB.workouts = ws;
  DB.current = null;
  stopRest();
  closeSheet();
  go('home');
}

/* =====================================================================
   CARDIO
   ===================================================================== */
function cardioName(c) {
  if (c.type === 'beach_tennis') return 'Beach tennis';
  if (c.type === 'walk') return 'Caminhada';
  return c.note ? c.note : 'Outra atividade';
}

function renderCardio() {
  const list = DB.cardio.slice().reverse();
  const wk = list.filter(c => c.status !== 'missed' && daysBetween(c.date, today()) < 7).length;

  let html = `<div class="top"><div class="date">Cardio</div><h1>Atividade aeróbica</h1></div>
    <div class="card">
      <div class="between"><div class="label">Últimos 7 dias</div><div style="font-weight:700">${wk} sessões</div></div>
      <div class="muted small" style="margin-top:6px">Meta de referência: 3–4 vezes por semana. Cardio é acompanhado separado do treino de força e não tem meta de calorias.</div>
    </div>
    <button class="btn primary" onclick="logCardio('beach_tennis')">Registrar beach tennis</button>
    <div style="height:8px"></div>
    <button class="btn" onclick="logCardio('walk')">Registrar caminhada</button>
    <div style="height:8px"></div>
    <button class="btn ghost" onclick="logCardio('other')">Outra atividade / não fiz</button>
    <div style="height:20px"></div>
    <div class="label" style="margin-bottom:8px">Histórico</div>`;

  if (!list.length) html += `<div class="empty">Nenhum registro ainda.</div>`;
  list.slice(0, 40).forEach(c => {
    html += `<div class="hitem ${c.status === 'missed' ? 'skip' : ''}">
      <div class="between"><div style="font-weight:650">${cardioName(c)}</div><div class="muted small">${fmtShort(c.date)}</div></div>
      <div class="muted small" style="margin-top:3px">
        ${c.status === 'done' ? 'Realizado' : c.status === 'partial' ? 'Parcialmente realizado' : 'Não realizado'}
        ${c.minutes ? ' · ' + c.minutes + ' min' : ''}${c.intensity ? ' · intensidade ' + c.intensity + '/5' : ''}
      </div>${c.note ? `<div class="muted small" style="margin-top:3px">${esc(c.note)}</div>` : ''}
    </div>`;
  });
  document.getElementById('v-cardio').innerHTML = html;
}

function logCardio(type) {
  const title = type === 'beach_tennis' ? 'Beach tennis' : type === 'walk' ? 'Caminhada' : 'Atividade';
  const tip = type === 'walk' ? '<div class="muted small" style="margin-bottom:12px">Sugestão em viagem: 30–60 minutos de caminhada ou atividade equivalente. A duração é opcional.</div>' : '';
  openSheet(`<h2>${title}</h2>${tip}
    <div class="stack" style="margin-top:10px">
      <div><div class="label">Status</div>
        <select class="inp" id="cd-status">
          <option value="done">Realizado</option>
          <option value="partial">Parcialmente realizado</option>
          <option value="missed">Não realizado</option>
        </select></div>
      <div><div class="label">Duração em minutos (opcional)</div><input class="inp" id="cd-min" inputmode="numeric" placeholder="—"></div>
      <div><div class="label">Intensidade percebida (opcional)</div>
        <select class="inp" id="cd-int">
          <option value="">—</option><option value="1">1 · muito leve</option><option value="2">2 · leve</option>
          <option value="3">3 · moderada</option><option value="4">4 · forte</option><option value="5">5 · muito forte</option>
        </select></div>
      ${type === 'other' ? '<div><div class="label">O que foi</div><input class="inp" id="cd-note" placeholder="Ex: bicicleta"></div>' : ''}
    </div>
    <div style="height:14px"></div>
    <button class="btn primary" onclick="saveCardio('${type}')">Salvar</button>
    <div style="height:8px"></div><button class="btn ghost" onclick="closeSheet()">Cancelar</button>`);
}

function saveCardio(type) {
  const status = document.getElementById('cd-status').value;
  const min = parseInt(document.getElementById('cd-min').value, 10);
  const intEl = document.getElementById('cd-int');
  const noteEl = document.getElementById('cd-note');
  const list = DB.cardio;
  list.push({
    id: 'c' + Date.now(), date: today(), type, status,
    minutes: isNaN(min) ? null : min,
    intensity: intEl && intEl.value ? parseInt(intEl.value, 10) : null,
    note: noteEl ? noteEl.value.trim() : null
  });
  DB.cardio = list;
  closeSheet();
  renderCardio();
}

/* =====================================================================
   HISTÓRICO
   ===================================================================== */
let histFilter = '';

function renderHistory() {
  const ws = DB.workouts.slice().reverse();
  const names = {};
  DB.sets.forEach(s => { names[s.exerciseId] = s.exerciseName; });

  let html = `<div class="top"><div class="date">Histórico</div><h1>Sessões</h1></div>`;
  html += `<select class="inp" style="margin-bottom:14px" onchange="histFilter=this.value;renderHistory()">
      <option value="">Todas as sessões</option>
      ${Object.keys(names).map(id => `<option value="${id}" ${histFilter === id ? 'selected' : ''}>${esc(names[id])}</option>`).join('')}
    </select>`;

  if (histFilter) {
    const rows = DB.sets.filter(s => s.exerciseId === histFilter).slice().reverse();
    if (!rows.length) html += `<div class="empty">Sem registros.</div>`;
    const byS = {};
    rows.forEach(r => { (byS[r.sessionId] = byS[r.sessionId] || []).push(r); });
    Object.keys(byS).forEach(sid => {
      const g = byS[sid].slice().reverse();
      html += `<div class="hitem"><div class="between">
        <div style="font-weight:650">${esc(g[0].exerciseName)}</div>
        <div class="muted small">${fmtShort(g[0].date)} · ${g[0].mode === 'gym' ? 'academia' : 'viagem'}</div></div>
        <div class="muted small" style="margin-top:4px">${g.map(describeSet).join(' · ')}</div></div>`;
    });
  } else {
    if (!ws.length) html += `<div class="empty">Nenhuma sessão registrada ainda.</div>`;
    ws.forEach(w => {
      if (w.status === 'skipped') {
        const motivo = { viagem: 'viagem', tempo: 'falta de tempo', indisposicao: 'indisposição', outro: 'outro' }[w.reason] || w.reason;
        html += `<div class="hitem skip"><div class="between">
          <div style="font-weight:650">${WORKOUTS[w.workoutId].name} · não realizado</div>
          <div class="muted small">${fmtShort(w.date)}</div></div>
          <div class="muted small" style="margin-top:3px">Motivo: ${esc(motivo)}</div></div>`;
        return;
      }
      const sets = DB.sets.filter(s => s.sessionId === w.id);
      const fb = { facil: 'Fácil', adequado: 'Adequado', dificil: 'Difícil' }[w.feedback] || '—';
      html += `<div class="hitem" onclick="this.querySelector('.hdetail').style.display=this.querySelector('.hdetail').style.display==='none'?'block':'none'">
        <div class="between">
          <div style="font-weight:650">${WORKOUTS[w.workoutId].name} · ${w.mode === 'gym' ? 'Academia' : 'Viagem'}</div>
          <div class="muted small">${fmtShort(w.date)}</div></div>
        <div class="muted small" style="margin-top:3px">${Math.round((w.durationSec || 0) / 60)} min · ${sets.length} séries · ${fb}</div>
        <div class="hdetail" style="display:none">
          ${w.exercises.map(e => {
            const rows = sets.filter(s => s.exerciseId === e.exerciseId);
            return `<div><b style="color:var(--text)">${esc(e.name)}</b>${e.substitutedFrom ? ' <span class="small">(substituído)</span>' : ''}: ${rows.length ? rows.map(describeSet).join(' · ') : 'não registrado'}</div>`;
          }).join('')}
        </div></div>`;
    });
  }
  document.getElementById('v-history').innerHTML = html;
}

/* =====================================================================
   EVOLUÇÃO
   ===================================================================== */
let progExercise = '';

function renderProgress() {
  const names = {};
  DB.sets.forEach(s => { names[s.exerciseId] = s.exerciseName; });
  const ids = Object.keys(names);
  if (!progExercise || !names[progExercise]) progExercise = ids[0] || '';

  let html = `<div class="top"><div class="date">Evolução</div><h1>Progressão</h1></div>`;
  if (!ids.length) {
    html += `<div class="empty">Registre algumas séries e a evolução aparece aqui.</div>`;
    document.getElementById('v-progress').innerHTML = html;
    return;
  }

  html += `<select class="inp" style="margin-bottom:14px" onchange="progExercise=this.value;renderProgress()">
    ${ids.map(id => `<option value="${id}" ${progExercise === id ? 'selected' : ''}>${esc(names[id])}</option>`).join('')}</select>`;

  const rows = DB.sets.filter(s => s.exerciseId === progExercise);
  const bySession = [];
  rows.forEach(r => {
    let g = bySession.find(x => x.sessionId === r.sessionId);
    if (!g) { g = { sessionId: r.sessionId, date: r.date, sets: [] }; bySession.push(g); }
    g.sets.push(r);
  });

  const isTime = rows.some(r => r.seconds != null);
  const val = g => isTime
    ? Math.max.apply(null, g.sets.map(s => s.seconds || 0))
    : Math.max.apply(null, g.sets.map(s => s.weight || 0));

  const best = bestRecord(progExercise);
  const last = lastRecord(progExercise);

  html += `<div class="stats" style="margin-bottom:12px">
    <div class="stat"><div class="v">${bySession.length}</div><div class="k">sessões</div></div>
    <div class="stat"><div class="v">${rows.length}</div><div class="k">séries</div></div>
    <div class="stat"><div class="v">${best ? (isTime ? best.seconds + 's' : (best.weight || 0) + 'kg') : '—'}</div><div class="k">melhor</div></div>
  </div>`;

  if (bySession.length >= 2) {
    html += `<div class="card">${chartSVG(bySession.map(g => ({ x: g.date, y: val(g) })), isTime ? 's' : 'kg')}</div>`;
  } else {
    html += `<div class="card"><div class="muted small">O gráfico aparece a partir de duas sessões registradas.</div></div>`;
  }

  html += `<div class="label" style="margin:16px 0 8px">Registros</div>`;
  bySession.slice().reverse().forEach(g => {
    html += `<div class="hitem"><div class="between">
      <div class="muted small">${fmtShort(g.date)}</div>
      <div style="font-weight:650">${g.sets.map(describeSet).join(' · ')}</div></div></div>`;
  });

  if (last) html += `<div class="muted small" style="margin-top:12px">Último registro: ${last.map(describeSet).join(' · ')}</div>`;

  document.getElementById('v-progress').innerHTML = html;
}

function chartSVG(points, unit) {
  const W = 320, H = 150, PL = 34, PR = 10, PT = 14, PB = 24;
  const ys = points.map(p => p.y);
  let min = Math.min.apply(null, ys), max = Math.max.apply(null, ys);
  if (min === max) { min = Math.max(0, min - 1); max = max + 1; }
  const pad = (max - min) * 0.15; min = Math.max(0, min - pad); max = max + pad;
  const x = i => PL + (points.length === 1 ? (W - PL - PR) / 2 : i * (W - PL - PR) / (points.length - 1));
  const y = v => PT + (H - PT - PB) * (1 - (v - min) / (max - min));

  const line = points.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.y).toFixed(1)).join(' ');
  const ticks = [min, (min + max) / 2, max];
  const step = Math.max(1, Math.ceil(points.length / 5));

  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    ${ticks.map(t => `<line class="grid" x1="${PL}" x2="${W - PR}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/>
      <text x="0" y="${(y(t) + 3.5).toFixed(1)}">${t.toFixed(t % 1 ? 1 : 0)}</text>`).join('')}
    <path class="ln" d="${line}"/>
    ${points.map((p, i) => `<circle class="pt" cx="${x(i).toFixed(1)}" cy="${y(p.y).toFixed(1)}" r="3.2"/>`).join('')}
    ${points.map((p, i) => (i % step === 0 || i === points.length - 1)
      ? `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle">${fmtShort(p.x)}</text>` : '').join('')}
    <text x="${W - PR}" y="10" text-anchor="end">${unit}</text>
  </svg>`;
}

/* =====================================================================
   AJUSTES
   ===================================================================== */
function renderSettings() {
  const s = DB.settings;
  const owned = DB.equipment;

  let html = `<div class="top"><div class="date">Ajustes</div><h1>Configurações</h1></div>

  <div class="card">
    <div class="label" style="margin-bottom:10px">Timer de descanso</div>
    <div class="row wrap">
      <span class="chip ${s.timerEnabled && s.timerSeconds === 45 ? 'on' : ''}" onclick="setTimer(true,45)">45 segundos</span>
      <span class="chip ${s.timerEnabled && s.timerSeconds === 60 ? 'on' : ''}" onclick="setTimer(true,60)">60 segundos</span>
      <span class="chip ${!s.timerEnabled ? 'on' : ''}" onclick="setTimer(false,45)">Desligado</span>
    </div>
  </div>

  <div class="card">
    <div class="label" style="margin-bottom:10px">Equipamentos disponíveis</div>
    <div class="muted small" style="margin-bottom:12px">Só o que existe na sua academia. O app usa isso para sugerir substituições.</div>
    ${EQUIPMENT_CATALOG.map(e => `<div class="check ${owned.includes(e.id) ? 'on' : ''}" onclick="toggleEquip('${e.id}')">
      <div class="box">✓</div><div class="grow">${esc(e.name)}</div></div>`).join('')}
  </div>

  <div class="card">
    <div class="label" style="margin-bottom:10px">Vídeos dos exercícios</div>
    <div class="muted small" style="margin-bottom:12px">Nenhuma URL vem preenchida — cole aqui os vídeos que você validar.</div>
    ${Object.values(allExercises()).map(ex => {
      const u = videoOf(ex.exerciseId);
      return `<div class="check" onclick="setVideoFromSettings('${ex.exerciseId}')">
        <div class="grow"><div>${esc(ex.name)}</div>
        <div class="muted small">${u ? esc(u.slice(0, 42)) + (u.length > 42 ? '…' : '') : 'Vídeo ainda não configurado'}</div></div></div>`;
    }).join('')}
  </div>

  <div class="card">
    <div class="label" style="margin-bottom:10px">Dados</div>
    <div class="muted small" style="margin-bottom:12px">Tudo fica salvo apenas neste aparelho. Exporte de vez em quando — é o seu único backup.${s.lastExportAt ? '<br>Última exportação: ' + fmtShort(s.lastExportAt) : ''}</div>
    <button class="btn" onclick="exportData()">Exportar JSON</button>
    <div style="height:8px"></div>
    <button class="btn" onclick="document.getElementById('imp').click()">Importar JSON</button>
    <input type="file" id="imp" accept="application/json,.json" style="display:none" onchange="importData(this)">
    <div style="height:8px"></div>
    <button class="btn danger" onclick="wipe()">Apagar todos os dados</button>
  </div>

  <div class="card tight">
    <div class="label">Programa</div>
    <div class="muted small" style="margin-top:6px">${fmtShort(PROGRAM_START)} a ${fmtShort(PROGRAM_END)} · 3 treinos por semana · sequência A → B → C.
    Perder um treino não gera compensação: o próximo da sequência continua sendo o mesmo.</div>
  </div>
  <div style="height:20px"></div>`;

  document.getElementById('v-settings').innerHTML = html;
}

function setTimer(on, sec) { const s = DB.settings; s.timerEnabled = on; s.timerSeconds = sec; DB.settings = s; renderSettings(); }
function toggleEquip(id) {
  const owned = DB.equipment;
  const i = owned.indexOf(id);
  if (i >= 0) owned.splice(i, 1); else owned.push(id);
  DB.equipment = owned;
  renderSettings();
}
function setVideoFromSettings(id) {
  const cur = videoOf(id) || '';
  const url = prompt('URL do vídeo para "' + getEx(id).name + '":', cur);
  if (url === null) return;
  const s = DB.settings;
  s.videos = s.videos || {};
  if (url.trim()) s.videos[id] = url.trim(); else delete s.videos[id];
  DB.settings = s;
  renderSettings();
}

/* ---------------------------------------------------------------
   EXPORT / IMPORT / APAGAR
   --------------------------------------------------------------- */
function exportData() {
  const payload = {
    app: 'treino', version: 1, exportedAt: new Date().toISOString(),
    EXERCISES: DB.exercises, WORKOUTS: DB.workouts, SETS: DB.sets,
    CARDIO: DB.cardio, EQUIPMENT: DB.equipment, SETTINGS: DB.settings,
    CURRENT: DB.current
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'treino-' + today() + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  setSetting('lastExportAt', today());
  renderSettings();
}

function importData(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d || d.app !== 'treino') throw new Error('Arquivo não reconhecido');
      if (!confirm('Isto substitui todos os dados atuais pelos do arquivo. Continuar?')) { input.value = ''; return; }
      DB.exercises = d.EXERCISES || {};
      DB.workouts  = d.WORKOUTS  || [];
      DB.sets      = d.SETS      || [];
      DB.cardio    = d.CARDIO    || [];
      DB.equipment = d.EQUIPMENT || EQUIPMENT_DEFAULT.slice();
      DB.settings  = d.SETTINGS  || {};
      DB.current   = d.CURRENT   || null;
      input.value = '';
      alert('Dados importados: ' + (d.WORKOUTS || []).length + ' sessões e ' + (d.SETS || []).length + ' séries.');
      go('home');
    } catch (e) {
      alert('Não foi possível importar: ' + e.message);
      input.value = '';
    }
  };
  r.readAsText(file);
}

function wipe() {
  if (!confirm('Apagar TODOS os dados de treino, cardio e configurações deste aparelho?')) return;
  if (!confirm('Esta ação não pode ser desfeita. Confirmar?')) return;
  Object.values(K).forEach(k => localStorage.removeItem(k));
  alert('Dados apagados.');
  go('home');
}

/* ---------------------------------------------------------------
   INÍCIO
   --------------------------------------------------------------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
go('home');
if (DB.current) openWorkoutView();
