/* =====================================================================
   CATÁLOGO DE EXERCÍCIOS E PROGRAMA
   ---------------------------------------------------------------------
   Para adicionar um vídeo a um exercício, preencha o campo "videoUrl"
   com a URL completa (ex: "https://www.youtube.com/watch?v=XXXX").
   Enquanto estiver null, o app mostra "Vídeo ainda não configurado"
   e oferece uma busca no YouTube.
   Você também pode colar URLs direto pelo app, em Ajustes > Vídeos.
   ===================================================================== */

const EQUIPMENT_CATALOG = [
  { id: 'leg_press',        name: 'Leg press' },
  { id: 'maquina_supino',   name: 'Máquina de supino' },
  { id: 'halteres',         name: 'Halteres' },
  { id: 'barra',            name: 'Barra / anilhas' },
  { id: 'polia',            name: 'Polia (cross/tríceps)' },
  { id: 'puxada',           name: 'Puxada alta (pulldown)' },
  { id: 'remada',           name: 'Remada (máquina ou polia)' },
  { id: 'mesa_flexora',     name: 'Mesa flexora' },
  { id: 'cadeira_extensora',name: 'Cadeira extensora' },
  { id: 'banco_romano',     name: 'Banco romano / extensão lombar' },
  { id: 'banco',            name: 'Banco regulável' },
  { id: 'maquina_abdominal',name: 'Abdominal máquina' },
  { id: 'elastico',         name: 'Elástico / faixa' },
  { id: 'esteira',          name: 'Esteira' },
  { id: 'bicicleta',        name: 'Bicicleta' },
  { id: 'outros',           name: 'Outros' }
];

/* Equipamentos marcados por padrão na primeira abertura */
const EQUIPMENT_DEFAULT = ['leg_press','maquina_supino','halteres','polia','puxada','remada','mesa_flexora','banco_romano','banco','esteira','bicicleta'];

const EXERCISES = {

  /* ---------- ACADEMIA: PERNAS ---------- */
  leg_press: {
    exerciseId: 'leg_press',
    name: 'Leg press',
    category: 'gym',
    muscleGroup: 'Pernas (quadríceps e glúteo)',
    movementPattern: 'Empurrar com as pernas',
    equipment: ['leg_press'],
    repRange: [10, 12],
    instructions: [
      'Apoie os pés na plataforma, um pouco mais largos que os ombros, e mantenha as costas e o quadril colados no encosto.',
      'Desça controlado até os joelhos formarem cerca de 90°, sem deixar o quadril descolar do banco.',
      'Empurre com a planta inteira do pé, sem travar o joelho no final.',
      'Descida em 2 segundos, subida em 1 segundo. Respire ao subir.'
    ],
    commonMistakes: [
      'Descer demais e arredondar a lombar (quadril sai do encosto).',
      'Travar/estalar os joelhos no fim do movimento.',
      'Empurrar com a ponta do pé em vez do pé inteiro.',
      'Joelhos caindo para dentro na subida.'
    ],
    videoUrl: null,
    searchQuery: 'leg press técnica execução correta',
    substitutions: ['agachamento_gym', 'cadeira_extensora', 'agachamento_bw']
  },

  agachamento_gym: {
    exerciseId: 'agachamento_gym',
    name: 'Agachamento (livre ou goblet)',
    category: 'gym',
    muscleGroup: 'Pernas (quadríceps e glúteo)',
    movementPattern: 'Agachamento',
    equipment: ['halteres'],
    repRange: [10, 12],
    instructions: [
      'Pés na largura dos ombros, pontas levemente para fora. Se for goblet, segure um halter junto ao peito.',
      'Desça empurrando o quadril para trás e para baixo, mantendo o tronco firme e o peito aberto.',
      'Desça até onde conseguir manter a lombar neutra — não force profundidade.',
      'Suba empurrando o chão com o pé inteiro.'
    ],
    commonMistakes: [
      'Calcanhar saindo do chão.',
      'Arredondar a lombar no fundo do movimento.',
      'Joelhos colapsando para dentro.',
      'Descer rápido demais e perder o controle.'
    ],
    videoUrl: null,
    searchQuery: 'agachamento goblet técnica execução',
    substitutions: ['leg_press', 'agachamento_bw', 'cadeira_extensora']
  },

  cadeira_extensora: {
    exerciseId: 'cadeira_extensora',
    name: 'Cadeira extensora',
    category: 'gym',
    muscleGroup: 'Quadríceps',
    movementPattern: 'Extensão de joelho',
    equipment: ['cadeira_extensora'],
    repRange: [10, 12],
    instructions: [
      'Ajuste o encosto para que o joelho fique alinhado com o eixo da máquina.',
      'Estenda os joelhos de forma controlada, sem dar solavanco.',
      'Pause meio segundo no topo e volte devagar.'
    ],
    commonMistakes: [
      'Usar impulso do tronco.',
      'Soltar o peso de volta sem controle.',
      'Carga alta demais com amplitude curta.'
    ],
    videoUrl: null,
    searchQuery: 'cadeira extensora execução correta',
    substitutions: ['leg_press', 'agachamento_gym']
  },

  mesa_flexora: {
    exerciseId: 'mesa_flexora',
    name: 'Mesa flexora',
    category: 'gym',
    muscleGroup: 'Posterior de coxa',
    movementPattern: 'Flexão de joelho',
    equipment: ['mesa_flexora'],
    repRange: [10, 12],
    instructions: [
      'Deite com o rolo apoiado logo acima do tendão de Aquiles e o joelho alinhado ao eixo da máquina.',
      'Puxe os calcanhares em direção ao glúteo sem levantar o quadril do apoio.',
      'Volte controlado, sem deixar o peso bater.'
    ],
    commonMistakes: [
      'Levantar o quadril para ganhar amplitude.',
      'Fase de volta rápida demais.',
      'Rolo posicionado alto demais na panturrilha.'
    ],
    videoUrl: null,
    searchQuery: 'mesa flexora execução correta',
    substitutions: ['romeno', 'glute_bridge']
  },

  romeno: {
    exerciseId: 'romeno',
    name: 'Levantamento romeno leve',
    category: 'gym',
    muscleGroup: 'Posterior de coxa e glúteo',
    movementPattern: 'Dobradiça de quadril',
    equipment: ['halteres'],
    repRange: [8, 10],
    technique: true,
    techniqueNote: 'Exercício de progressão técnica. O objetivo aqui é aprender a dobradiça de quadril com a lombar neutra — não é para buscar carga alta. Só aumente o peso quando o movimento estiver realmente automático.',
    instructions: [
      'Em pé, halteres à frente das coxas, joelhos levemente flexionados (e assim permanecem).',
      'Empurre o quadril para trás deslizando os halteres rente às pernas. O tronco desce porque o quadril foi para trás, não porque você se curvou.',
      'Desça até sentir o alongamento na parte de trás da coxa, mantendo a lombar reta.',
      'Volte empurrando o quadril para frente e contraindo o glúteo.'
    ],
    commonMistakes: [
      'Arredondar a lombar — sinal de que desceu além da sua amplitude atual.',
      'Transformar em agachamento (dobrar muito o joelho).',
      'Afastar os halteres do corpo.',
      'Usar carga alta antes de dominar o padrão.'
    ],
    videoUrl: null,
    searchQuery: 'levantamento terra romeno halteres técnica iniciante',
    substitutions: ['mesa_flexora', 'glute_bridge']
  },

  /* ---------- ACADEMIA: COSTAS ---------- */
  puxada_frontal: {
    exerciseId: 'puxada_frontal',
    name: 'Puxada frontal',
    category: 'gym',
    muscleGroup: 'Costas (dorsais) e bíceps',
    movementPattern: 'Puxar vertical',
    equipment: ['puxada'],
    repRange: [8, 12],
    instructions: [
      'Pegada um pouco mais larga que os ombros, coxas travadas no apoio.',
      'Comece o movimento puxando os ombros para baixo, depois traga a barra até a altura do queixo/clavícula.',
      'Peito aberto, tronco quase vertical (inclinação leve para trás é normal).',
      'Volte controlado deixando os braços esticarem por completo.'
    ],
    commonMistakes: [
      'Jogar o tronco muito para trás para vencer a carga.',
      'Puxar só com os braços, sem baixar as escápulas.',
      'Puxar atrás da nuca.',
      'Amplitude curta na volta.'
    ],
    videoUrl: null,
    searchQuery: 'puxada frontal pulldown técnica correta',
    substitutions: ['remada_sentada', 'remada_halter', 'prone_yt']
  },

  remada_sentada: {
    exerciseId: 'remada_sentada',
    name: 'Remada sentada na polia',
    category: 'gym',
    muscleGroup: 'Costas (meio) e bíceps',
    movementPattern: 'Puxar horizontal',
    equipment: ['remada', 'polia'],
    equipmentAny: true,
    repRange: [8, 12],
    instructions: [
      'Sentado, joelhos levemente flexionados, tronco ereto.',
      'Puxe o punho em direção ao umbigo, levando os cotovelos rente ao corpo e juntando as escápulas.',
      'Não balance o tronco para frente e para trás.',
      'Volte deixando as escápulas se afastarem, sem arredondar demais a lombar.'
    ],
    commonMistakes: [
      'Usar o tronco como alavanca (remar com o corpo todo).',
      'Encolher os ombros durante a puxada.',
      'Amplitude curta na volta.'
    ],
    videoUrl: null,
    searchQuery: 'remada sentada polia técnica correta',
    substitutions: ['remada_halter', 'puxada_frontal', 'prone_yt']
  },

  remada_halter: {
    exerciseId: 'remada_halter',
    name: 'Remada unilateral com halter',
    category: 'gym',
    muscleGroup: 'Costas (meio) e bíceps',
    movementPattern: 'Puxar horizontal',
    equipment: ['halteres'],
    repRange: [8, 12],
    instructions: [
      'Apoie joelho e mão no banco, tronco quase paralelo ao chão, coluna neutra.',
      'Puxe o halter em direção ao quadril, cotovelo rente ao corpo.',
      'Desça controlado até esticar o braço.',
      'Faça todas as repetições de um lado, depois troque.'
    ],
    commonMistakes: [
      'Girar o tronco para ajudar na puxada.',
      'Puxar com o cotovelo aberto para fora.',
      'Arredondar a lombar.'
    ],
    videoUrl: null,
    searchQuery: 'remada unilateral halter serrote técnica',
    substitutions: ['remada_sentada', 'puxada_frontal']
  },

  extensao_lombar: {
    exerciseId: 'extensao_lombar',
    name: 'Extensão lombar (banco romano)',
    category: 'gym',
    muscleGroup: 'Lombar, glúteo e posterior',
    movementPattern: 'Extensão de quadril',
    equipment: ['banco_romano'],
    repRange: [8, 10],
    instructions: [
      'Ajuste o apoio logo abaixo do osso do quadril, pés firmes.',
      'Desça dobrando pelo quadril, com a coluna em linha reta.',
      'Suba até o corpo ficar alinhado — não hiperestenda a lombar.',
      'Comece só com o peso do corpo.'
    ],
    commonMistakes: [
      'Subir demais e forçar a lombar para trás.',
      'Movimento rápido e balanceado.',
      'Adicionar carga cedo demais.'
    ],
    videoUrl: null,
    searchQuery: 'extensão lombar banco romano hiperextensão técnica',
    substitutions: ['glute_bridge', 'bird_dog', 'romeno']
  },

  /* ---------- ACADEMIA: PEITO / BRAÇOS ---------- */
  supino: {
    exerciseId: 'supino',
    name: 'Supino (máquina ou halteres)',
    category: 'gym',
    muscleGroup: 'Peito, ombro anterior e tríceps',
    movementPattern: 'Empurrar horizontal',
    equipment: ['maquina_supino', 'halteres'],
    equipmentAny: true,
    repRange: [8, 12],
    instructions: [
      'Ajuste o banco/assento para que as mãos fiquem na altura do meio do peito.',
      'Escápulas encaixadas para trás e para baixo durante todo o movimento.',
      'Empurre sem travar bruscamente o cotovelo.',
      'Volte controlado até sentir um alongamento confortável no peito.'
    ],
    commonMistakes: [
      'Ombros subindo em direção às orelhas.',
      'Cotovelos totalmente abertos a 90° do tronco.',
      'Descer rápido demais e quicar.',
      'Amplitude curta.'
    ],
    videoUrl: null,
    searchQuery: 'supino halteres técnica correta iniciante',
    substitutions: ['flexao', 'flexao_inclinada']
  },

  triceps_polia: {
    exerciseId: 'triceps_polia',
    name: 'Tríceps na polia',
    category: 'gym',
    muscleGroup: 'Tríceps',
    movementPattern: 'Extensão de cotovelo',
    equipment: ['polia'],
    repRange: [10, 12],
    instructions: [
      'Em pé, próximo à polia, cotovelos colados ao tronco.',
      'Estenda os cotovelos até esticar os braços, mantendo os cotovelos parados.',
      'Volte controlado até cerca de 90°.',
      'Tronco levemente inclinado à frente e firme.'
    ],
    commonMistakes: [
      'Cotovelos abrindo ou subindo.',
      'Usar o tronco para empurrar a barra.',
      'Amplitude curta.'
    ],
    videoUrl: null,
    searchQuery: 'tríceps polia pulley técnica correta',
    substitutions: ['triceps_halter', 'flexao_fechada']
  },

  triceps_halter: {
    exerciseId: 'triceps_halter',
    name: 'Tríceps testa ou francês com halter',
    category: 'gym',
    muscleGroup: 'Tríceps',
    movementPattern: 'Extensão de cotovelo',
    equipment: ['halteres'],
    repRange: [10, 12],
    instructions: [
      'Deitado ou sentado, cotovelos apontando para cima e parados.',
      'Desça o halter flexionando só o cotovelo.',
      'Estenda sem travar bruscamente.'
    ],
    commonMistakes: [
      'Cotovelos abrindo para os lados.',
      'Mover o ombro em vez do cotovelo.',
      'Carga alta demais.'
    ],
    videoUrl: null,
    searchQuery: 'tríceps francês halter técnica',
    substitutions: ['triceps_polia', 'flexao_fechada']
  },

  rosca_halteres: {
    exerciseId: 'rosca_halteres',
    name: 'Rosca bíceps com halteres',
    category: 'gym',
    muscleGroup: 'Bíceps',
    movementPattern: 'Flexão de cotovelo',
    equipment: ['halteres'],
    repRange: [10, 12],
    instructions: [
      'Em pé, braços ao lado do corpo, cotovelos colados ao tronco.',
      'Suba o halter girando a palma para cima, sem mover o cotovelo para frente.',
      'Desça devagar até esticar o braço.'
    ],
    commonMistakes: [
      'Balançar o tronco para dar impulso.',
      'Cotovelos indo para frente (vira exercício de ombro).',
      'Descer o peso sem controle.'
    ],
    videoUrl: null,
    searchQuery: 'rosca bíceps halteres técnica correta',
    substitutions: ['rosca_polia', 'biceps_isometrico']
  },

  rosca_polia: {
    exerciseId: 'rosca_polia',
    name: 'Rosca bíceps na polia',
    category: 'gym',
    muscleGroup: 'Bíceps',
    movementPattern: 'Flexão de cotovelo',
    equipment: ['polia'],
    repRange: [10, 12],
    instructions: [
      'De frente para a polia baixa, cotovelos junto ao tronco.',
      'Flexione até o topo sem mover o cotovelo.',
      'Volte controlado.'
    ],
    commonMistakes: [
      'Recuar o corpo para ajudar.',
      'Cotovelos deslocando.',
      'Amplitude curta.'
    ],
    videoUrl: null,
    searchQuery: 'rosca bíceps polia técnica',
    substitutions: ['rosca_halteres']
  },

  /* ---------- CORE ---------- */
  prancha: {
    exerciseId: 'prancha',
    name: 'Prancha',
    category: 'both',
    muscleGroup: 'Core (anti-extensão)',
    movementPattern: 'Isometria de core',
    equipment: [],
    duration: [20, 30],
    instructions: [
      'Antebraços no chão, cotovelos abaixo dos ombros, pés na largura do quadril.',
      'Corpo em linha reta: contraia o glúteo e leve o umbigo levemente para dentro.',
      'Olhar para o chão, pescoço neutro.',
      'Respire normalmente durante todo o tempo.'
    ],
    commonMistakes: [
      'Quadril alto demais (vira uma barraca) ou baixo demais (lombar cede).',
      'Prender a respiração.',
      'Segurar mais tempo do que consegue manter a posição correta.'
    ],
    videoUrl: null,
    searchQuery: 'prancha abdominal execução correta',
    substitutions: ['dead_bug', 'bird_dog']
  },

  dead_bug: {
    exerciseId: 'dead_bug',
    name: 'Dead bug',
    category: 'both',
    muscleGroup: 'Core (anti-extensão)',
    movementPattern: 'Estabilização de core',
    equipment: [],
    repRange: [8, 10],
    perSide: true,
    instructions: [
      'Deitado de costas, braços apontando para o teto, joelhos e quadris a 90°.',
      'Pressione a lombar contra o chão e mantenha assim.',
      'Estenda o braço direito e a perna esquerda ao mesmo tempo, indo até onde a lombar não descolar.',
      'Volte e alterne. Movimento lento.'
    ],
    commonMistakes: [
      'Deixar a lombar arquear ao estender a perna.',
      'Fazer rápido demais.',
      'Prender a respiração.'
    ],
    videoUrl: null,
    searchQuery: 'dead bug exercício core execução',
    substitutions: ['prancha', 'bird_dog']
  },

  abdominal_maquina: {
    exerciseId: 'abdominal_maquina',
    name: 'Abdominal máquina',
    category: 'gym',
    muscleGroup: 'Core (flexão de tronco)',
    movementPattern: 'Flexão de tronco',
    equipment: ['maquina_abdominal'],
    repRange: [10, 15],
    instructions: [
      'Ajuste o assento para alinhar o apoio com o meio do tronco.',
      'Flexione o tronco encurtando a distância entre costelas e quadril.',
      'Volte controlado sem deixar o peso bater.'
    ],
    commonMistakes: [
      'Puxar com os braços em vez do abdômen.',
      'Carga alta e amplitude curta.',
      'Movimento com solavanco.'
    ],
    videoUrl: null,
    searchQuery: 'abdominal máquina execução correta',
    substitutions: ['dead_bug', 'prancha']
  },

  bird_dog: {
    exerciseId: 'bird_dog',
    name: 'Bird dog',
    category: 'both',
    muscleGroup: 'Core e lombar',
    movementPattern: 'Estabilização de core',
    equipment: [],
    repRange: [8, 8],
    perSide: true,
    instructions: [
      'Em quatro apoios, mãos abaixo dos ombros e joelhos abaixo do quadril.',
      'Estenda o braço direito e a perna esquerda até a linha do tronco.',
      'Mantenha o quadril nivelado — sem rodar para o lado.',
      'Pause 1 a 2 segundos e troque.'
    ],
    commonMistakes: [
      'Rodar o quadril ao estender a perna.',
      'Levantar a perna acima da linha das costas.',
      'Movimento rápido, sem pausa.'
    ],
    videoUrl: null,
    searchQuery: 'bird dog exercício execução correta',
    substitutions: ['dead_bug', 'prancha']
  },

  /* ---------- VIAGEM ---------- */
  agachamento_bw: {
    exerciseId: 'agachamento_bw',
    name: 'Agachamento livre (peso corporal)',
    category: 'travel',
    muscleGroup: 'Pernas (quadríceps e glúteo)',
    movementPattern: 'Agachamento',
    equipment: [],
    repRange: [10, 15],
    instructions: [
      'Pés na largura dos ombros, pontas levemente para fora, braços à frente para equilíbrio.',
      'Desça empurrando o quadril para trás, peito aberto e calcanhares no chão.',
      'Desça até onde a lombar permanecer neutra.',
      'Suba empurrando o chão. Para deixar mais difícil, desça em 3 segundos e pause 1 segundo embaixo.'
    ],
    commonMistakes: [
      'Calcanhar saindo do chão.',
      'Joelhos caindo para dentro.',
      'Descer rápido sem controle.'
    ],
    videoUrl: null,
    searchQuery: 'agachamento peso corporal técnica correta',
    substitutions: ['glute_bridge', 'leg_press']
  },

  flexao: {
    exerciseId: 'flexao',
    name: 'Flexão de braço',
    category: 'travel',
    muscleGroup: 'Peito, ombro anterior e tríceps',
    movementPattern: 'Empurrar horizontal',
    equipment: [],
    repRange: [6, 12],
    instructions: [
      'Mãos um pouco mais largas que os ombros, corpo em linha reta do calcanhar à cabeça.',
      'Desça até o peito ficar próximo do chão, cotovelos a cerca de 45° do tronco.',
      'Empurre mantendo o quadril firme (glúteo e abdômen contraídos).',
      'Se estiver difícil, apoie as mãos em uma superfície elevada.'
    ],
    commonMistakes: [
      'Quadril cedendo ou empinado.',
      'Cotovelos totalmente abertos para os lados.',
      'Amplitude curta.',
      'Pescoço projetado à frente.'
    ],
    videoUrl: null,
    searchQuery: 'flexão de braço técnica correta',
    substitutions: ['flexao_inclinada', 'supino']
  },

  flexao_inclinada: {
    exerciseId: 'flexao_inclinada',
    name: 'Flexão inclinada (mãos elevadas)',
    category: 'travel',
    muscleGroup: 'Peito, ombro anterior e tríceps',
    movementPattern: 'Empurrar horizontal',
    equipment: [],
    repRange: [6, 12],
    instructions: [
      'Apoie as mãos numa bancada, mesa ou cama firme.',
      'Corpo em linha reta, desça o peito até perto do apoio.',
      'Quanto mais alto o apoio, mais fácil. Vá baixando o apoio ao longo das semanas.'
    ],
    commonMistakes: [
      'Apoio instável.',
      'Quadril cedendo.',
      'Descer só um pouco.'
    ],
    videoUrl: null,
    searchQuery: 'flexão inclinada apoio elevado execução',
    substitutions: ['flexao', 'supino']
  },

  flexao_fechada: {
    exerciseId: 'flexao_fechada',
    name: 'Flexão com mãos fechadas (foco tríceps)',
    category: 'travel',
    muscleGroup: 'Tríceps e peito',
    movementPattern: 'Extensão de cotovelo',
    equipment: [],
    repRange: [6, 12],
    instructions: [
      'Mãos na largura dos ombros ou um pouco mais estreitas.',
      'Cotovelos rente ao tronco durante toda a descida.',
      'Pode ser feita com as mãos elevadas para facilitar.'
    ],
    commonMistakes: [
      'Abrir os cotovelos (perde o foco no tríceps).',
      'Quadril cedendo.',
      'Descer pouco.'
    ],
    videoUrl: null,
    searchQuery: 'flexão diamante mãos fechadas tríceps execução',
    substitutions: ['triceps_polia', 'triceps_halter']
  },

  prone_yt: {
    exerciseId: 'prone_yt',
    name: 'Prone Y/T raise',
    category: 'travel',
    muscleGroup: 'Costas altas e ombro posterior',
    movementPattern: 'Puxar / retração escapular',
    equipment: [],
    repRange: [8, 12],
    stimulusNote: 'Sem carga, isso trabalha principalmente a musculatura estabilizadora das escápulas. Não substitui a puxada frontal em estímulo de dorsal — trate como manutenção enquanto estiver viajando.',
    instructions: [
      'Deitado de barriga para baixo, testa apoiada ou olhar para o chão.',
      'Y: braços à frente formando um Y, polegares para cima. Levante os braços do chão.',
      'T: braços abertos na linha dos ombros. Levante juntando as escápulas.',
      'Alterne Y e T ou faça metade das repetições de cada. Movimento lento, pausa de 1 segundo no topo.'
    ],
    commonMistakes: [
      'Levantar o tronco em vez dos braços.',
      'Encolher os ombros em direção às orelhas.',
      'Usar impulso.'
    ],
    videoUrl: null,
    searchQuery: 'prone Y T raise exercise form',
    substitutions: ['reverse_snow_angel', 'remada_sentada']
  },

  reverse_snow_angel: {
    exerciseId: 'reverse_snow_angel',
    name: 'Reverse snow angel',
    category: 'travel',
    muscleGroup: 'Costas altas e ombro posterior',
    movementPattern: 'Retração escapular',
    equipment: [],
    repRange: [8, 12],
    stimulusNote: 'Exercício de mobilidade e estabilidade escapular. O estímulo de costas é bem menor que o de uma puxada ou remada com carga. Serve para manter, não para progredir força de costas.',
    instructions: [
      'Deitado de barriga para baixo, braços ao lado do corpo, palmas para baixo.',
      'Levante os braços alguns centímetros do chão e deslize-os em arco até acima da cabeça.',
      'Volte pelo mesmo caminho sem deixar as mãos tocarem o chão.',
      'Movimento lento e contínuo.'
    ],
    commonMistakes: [
      'Deixar os braços tocarem o chão e descansarem.',
      'Levantar o tronco.',
      'Fazer rápido demais.'
    ],
    videoUrl: null,
    searchQuery: 'reverse snow angel exercise form',
    substitutions: ['prone_yt', 'remada_sentada']
  },

  glute_bridge: {
    exerciseId: 'glute_bridge',
    name: 'Glute bridge (elevação de quadril)',
    category: 'travel',
    muscleGroup: 'Glúteo e posterior de coxa',
    movementPattern: 'Extensão de quadril',
    equipment: [],
    repRange: [12, 15],
    instructions: [
      'Deitado de costas, joelhos dobrados, pés apoiados na largura do quadril.',
      'Empurre o chão com os calcanhares e suba o quadril até o corpo ficar alinhado.',
      'Contraia o glúteo no topo por 1 segundo — não hiperestenda a lombar.',
      'Desça controlado. Para dificultar, faça com uma perna só.'
    ],
    commonMistakes: [
      'Subir usando a lombar em vez do glúteo.',
      'Pés longe demais do corpo (vira exercício de posterior).',
      'Movimento rápido sem pausa no topo.'
    ],
    videoUrl: null,
    searchQuery: 'glute bridge elevação de quadril execução',
    substitutions: ['romeno', 'extensao_lombar']
  },

  biceps_isometrico: {
    exerciseId: 'biceps_isometrico',
    name: 'Bíceps sem equipamento (autorresistência)',
    category: 'travel',
    muscleGroup: 'Bíceps',
    movementPattern: 'Flexão de cotovelo',
    equipment: [],
    repRange: [8, 12],
    stimulusNote: 'Sem peso, elástico ou mochila, não existe substituto honesto para a rosca com halteres. Isso mantém o padrão de movimento e alguma tensão, mas não gera o mesmo estímulo. Se tiver uma mochila com peso ou um elástico, use e registre a carga.',
    instructions: [
      'Opção A (mochila): coloque livros ou garrafas em uma mochila e faça a rosca segurando as alças.',
      'Opção B (elástico): pise no elástico e faça a rosca normalmente.',
      'Opção C (autorresistência): faça a rosca com um braço enquanto a outra mão empurra o punho para baixo, resistindo. Suba em 3 segundos e desça em 3 segundos.',
      'Cotovelo sempre parado junto ao tronco.'
    ],
    commonMistakes: [
      'Tratar como equivalente à rosca com halteres.',
      'Resistência inconsistente ao longo da série.',
      'Movimento rápido demais.'
    ],
    videoUrl: null,
    searchQuery: 'bíceps sem equipamento mochila autorresistência',
    substitutions: ['rosca_halteres']
  }
};

/* =====================================================================
   TREINOS A / B / C
   ===================================================================== */
const WORKOUTS = {
  A: {
    id: 'A',
    name: 'Treino A',
    focus: 'Pernas, costas e core',
    gym: [
      { exerciseId: 'leg_press' },
      { exerciseId: 'puxada_frontal' },
      { exerciseId: 'remada_sentada' },
      { exerciseId: 'triceps_polia' },
      { exerciseId: 'extensao_lombar' },
      { exerciseId: 'prancha' }
    ],
    travel: [
      { exerciseId: 'agachamento_bw' },
      { exerciseId: 'prone_yt' },
      { exerciseId: 'reverse_snow_angel' },
      { exerciseId: 'flexao_inclinada' },
      { exerciseId: 'bird_dog' },
      { exerciseId: 'prancha' }
    ]
  },
  B: {
    id: 'B',
    name: 'Treino B',
    focus: 'Peito, costas e braços',
    gym: [
      { exerciseId: 'supino' },
      { exerciseId: 'puxada_frontal' },
      { exerciseId: 'mesa_flexora' },
      { exerciseId: 'rosca_halteres' },
      { exerciseId: 'triceps_polia' },
      { exerciseId: 'dead_bug' }
    ],
    travel: [
      { exerciseId: 'flexao' },
      { exerciseId: 'reverse_snow_angel' },
      { exerciseId: 'glute_bridge' },
      { exerciseId: 'biceps_isometrico' },
      { exerciseId: 'flexao_fechada' },
      { exerciseId: 'dead_bug' }
    ]
  },
  C: {
    id: 'C',
    name: 'Treino C',
    focus: 'Pernas, costas e técnica de quadril',
    gym: [
      { exerciseId: 'agachamento_gym' },
      { exerciseId: 'remada_sentada' },
      { exerciseId: 'romeno' },
      { exerciseId: 'triceps_polia' },
      { exerciseId: 'rosca_halteres' },
      { exerciseId: 'prancha' }
    ],
    travel: [
      { exerciseId: 'agachamento_bw', repRange: [12, 12] },
      { exerciseId: 'reverse_snow_angel' },
      { exerciseId: 'glute_bridge' },
      { exerciseId: 'flexao' },
      { exerciseId: 'bird_dog' },
      { exerciseId: 'prancha' }
    ]
  }
};

const SEQUENCE = ['A', 'B', 'C'];

/* =====================================================================
   FASES DO PROGRAMA
   ===================================================================== */
const PHASES = [
  {
    id: 1,
    name: 'Adaptação',
    start: '2026-08-18',
    end: '2026-09-13',
    goal: 'Aprender os movimentos e criar consistência.',
    rules: [
      '2 séries por exercício',
      '8–12 repetições na maioria dos exercícios',
      'Intensidade moderada — não treine até a falha',
      'Prioridade é a execução, não a carga'
    ],
    setsFor: () => 2
  },
  {
    id: 2,
    name: 'Construção',
    start: '2026-09-14',
    end: '2026-10-25',
    goal: 'Começar a aumentar força.',
    rules: [
      '2 séries na maioria dos exercícios',
      'O primeiro exercício do treino pode ir para 3 séries',
      'Aumente a carga quando atingir o topo da faixa com boa execução',
      'Continue sem treinar até a falha'
    ],
    setsFor: (index) => (index === 0 ? 3 : 2)
  },
  {
    id: 3,
    name: 'Consolidação',
    start: '2026-10-26',
    end: '2026-12-31',
    goal: 'Consolidar a rotina e manter a progressão.',
    rules: [
      '2 a 3 séries por exercício',
      'Os dois primeiros exercícios podem ir para 3 séries',
      'Progressão gradual de carga e repetições',
      'Não aumente volume só para o treino ficar mais difícil'
    ],
    setsFor: (index) => (index <= 1 ? 3 : 2)
  }
];

const PROGRAM_START = '2026-08-18';
const PROGRAM_END = '2026-12-31';
const SESSIONS_PER_WEEK = 3;
