(function () {
  'use strict';

  var DB_KEY = 'assistente_serraria_local_v1';
  var page = 'inicio';
  var stockSearch = '';
  var stockFilter = 'Todos';
  var priceSearch = '';
  var priceFilter = 'Todos';
  var saleSearch = '';
  var saleShowAll = false;
  var toastTimer = null;

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }
  function asNum(value) {
    if (typeof value === 'number') return isFinite(value) ? value : 0;
    var txt = String(value == null ? '' : value).trim().replace(/\s/g, '');
    if (!txt) return 0;
    if (txt.indexOf(',') >= 0) txt = txt.replace(/\./g, '').replace(',', '.');
    var number = Number(txt);
    return isFinite(number) ? number : 0;
  }
  function money(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  }
  function qtyText(value) {
    if (value === null || value === undefined || value === '') return 'Não informado';
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(Number(value) || 0);
  }
  function dateText(value, withTime) {
    if (!value) return 'Sem data';
    var date = new Date(value);
    if (isNaN(date.getTime())) return 'Sem data';
    return date.toLocaleString('pt-BR', withTime ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' });
  }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  var stockSeeds = [
    ['s_par_01','Parafusos','PARAFUSO 1/4X3',1300,65,1235],
    ['s_par_02','Parafusos','PARAFUSO 2/4x2½',null,null,null],
    ['s_par_03','Parafusos','PARAFUSO 5/16x3',400,null,400],
    ['s_par_04','Parafusos','PARAFUSO 5/16x3½',1285,null,1285],
    ['s_par_05','Parafusos','PARAFUSO 5/16x2½',20,null,20],
    ['s_par_06','Parafusos','PARAFUSO 1/4x1½',126,12,114],
    ['s_par_07','Parafusos','PARAFUSO 3/8x5½',116,null,116],
    ['s_par_08','Parafusos','PARAFUSO 3/8x4½',40,1,39],
    ['s_par_09','Parafusos','PARAFUSO 3/4',13,null,13],
    ['s_par_10','Parafusos','PARAFUSO 1/4x2½',2000,67,1933],
    ['s_par_11','Parafusos','PARAFUSO 1/4x3 (2º registro)',1000,null,1000],
    ['s_par_12','Parafusos','PARAFUSO 1/4x3½',900,null,900],
    ['s_par_13','Parafusos','PARAFUSO 1/4x2',200,22,178],
    ['s_par_14','Parafusos','PARAFUSO 5/16x2¼',400,null,400],
    ['s_par_15','Parafusos','PARAFUSO 3/8X3',49,44,5],
    ['s_pre_01','Pregos','PREGO 2.½x10',11,null,11],
    ['s_pre_02','Pregos','PREGO 2x12',27,1,26],
    ['s_pre_03','Pregos','PREGO 1.¼x13',11,1,10],
    ['s_pre_04','Pregos','PREGO 2x10',40,null,40],
    ['s_pre_05','Pregos','PREGO 3x8',66,1,65],
    ['s_dis_01','Discos de corte','DISCO 180x1,6x22,2mm',34,null,34],
    ['s_dis_02','Discos de corte',"DISCO 12'x1/8'x1'",8,null,8],
    ['s_dis_03','Discos de corte','DISCO 180x6,4x22,2mm',5,null,5],
    ['s_por_01','Porcas','PORCA 12X8X12,8',500,null,500],
    ['s_cim_01','Cimento','CIMENTO MIZU',0,null,0],
    ['s_ara_01','Rolo de arame','ARAME 18 REFORÇADO',11,5,6],
    ['s_ara_02','Rolo de arame','ARAME 18 NORMAL',3,null,3],
    ['s_sol_01','Vareta de solda','VARETA DE SOLDA',50,40,10]
  ];
  var priceSeeds = [
    // Produtos da tabela anterior, corrigidos quando a tabela complementar esclareceu o registro.
    { id:'p_gua_01', category:'Madeira Guajará', name:'Linha Guajará — 1 m', price:33, mode:'meter', baseQty:1, unit:'m', note:'' },
    { id:'p_gua_02', category:'Madeira Guajará', name:'Caibro Guajará — 1 m', price:6, mode:'meter', baseQty:1, unit:'m', note:'' },
    { id:'p_gua_03', category:'Madeira Guajará', name:'Ripa Guajará — 1 m', price:3, mode:'meter', baseQty:1, unit:'m', note:'' },
    { id:'p_gua_04', category:'Forro de madeira', name:'Forro de Guajará (60/70/80; padrão 13?)', price:140, mode:'unknown', baseQty:1, unit:'?', note:'A anotação menciona 60, 70 e 80 e “padrão 13 (?)”. Unidade de cobrança não confirmada.' },
    { id:'p_gua_05', category:'Madeira Guajará', name:'Cocheira', price:750, mode:'unit', baseQty:1, unit:'un', note:'Registro da tabela anterior; manter e conferir quando possível.' },
    { id:'p_gua_06', category:'Portas', name:'Porta comum (60/70/80)', price:220, mode:'unit', baseQty:1, unit:'un', note:'Registro anterior; diferente de Porta Paraná.' },
    { id:'p_mas_01', category:'Madeira Maçaranduba', name:'Linha Maçaranduba — 1 m', price:48, mode:'meter', baseQty:1, unit:'m', note:'' },
    { id:'p_mas_02', category:'Madeira Maçaranduba', name:'Caibro Maçaranduba — 1 m', price:9, mode:'meter', baseQty:1, unit:'m', note:'' },
    { id:'p_mas_03', category:'Madeira Maçaranduba', name:'Ripa Maçaranduba — 1 m', price:4.5, mode:'meter', baseQty:1, unit:'m', note:'' },
    { id:'p_mas_04', category:'Forro de madeira', name:'Forro Maçaranduba — 60/70/80 (registro anterior)', price:160, mode:'unknown', baseQty:1, unit:'?', note:'Registro anterior: R$ 160,00 para 60/70/80. Pode ser diferente do forro sem medida especificada anotado por R$ 180,00; confirmar.' },
    { id:'p_mas_05', category:'Madeira Guajará', name:'Alisado Guajará — 1 m', price:8, mode:'meter', baseQty:1, unit:'m', note:'O preço de R$ 8,00 foi associado a Guajará na tabela complementar.' },
    { id:'p_mas_06', category:'Muiracatiara', name:'Muiracatiara — peça não identificada', price:15, mode:'unknown', baseQty:1, unit:'?', note:'A anotação informa R$ 15,00, mas não permite identificar a peça nem a unidade.' },
    { id:'p_pin_01', category:'Tábua de pinus', name:'Tábua de pinus 20 (3 m)', price:28, mode:'unit', baseQty:1, unit:'un', note:'Medida “20” preservada como anotada; unidade da medida não confirmada.' },
    { id:'p_pin_02', category:'Tábua de pinus', name:'Tábua de pinus 25 (3 m)', price:36, mode:'unit', baseQty:1, unit:'un', note:'Medida “25” preservada como anotada; unidade da medida não confirmada.' },
    { id:'p_pin_03', category:'Tábua de pinus', name:'Tábua de pinus 30 (3 m)', price:44, mode:'unit', baseQty:1, unit:'un', note:'Medida “30” preservada como anotada; unidade da medida não confirmada.' },
    { id:'p_pin_04', category:'Tábua de pinus', name:'Tábua grossa de pinus 30', price:70, mode:'unit', baseQty:1, unit:'un', note:'Registro da tabela anterior; medida/comprimento a confirmar.' },
    { id:'p_pin_05', category:'Tábua de pinus', name:'Tábua grossa de pinus 40', price:90, mode:'unit', baseQty:1, unit:'un', note:'Registro da tabela anterior; medida/comprimento a confirmar.' },
    { id:'p_pin_06', category:'Tábua de pinus', name:'Tábua de pinus 20 plainada (3 m)', price:30, mode:'unit', baseQty:1, unit:'un', note:'Medida “20” preservada como anotada; unidade da medida não confirmada.' },
    { id:'p_pin_07', category:'Tábua de pinus', name:'Tábua de pinus 25 plainada (3 m)', price:38, mode:'unit', baseQty:1, unit:'un', note:'Medida “25” preservada como anotada; unidade da medida não confirmada.' },
    { id:'p_pin_08', category:'Tábua de pinus', name:'Tábua de pinus 30 plainada (3 m)', price:46, mode:'unit', baseQty:1, unit:'un', note:'Medida “30” preservada como anotada; unidade da medida não confirmada.' },
    { id:'p_pin_09', category:'Tábua de pinus', name:'Tábua grossa de pinus 30 plainada', price:70, mode:'unit', baseQty:1, unit:'un', note:'Registro da tabela anterior; medida/comprimento a confirmar.' },
    { id:'p_pin_10', category:'Tábua de pinus', name:'Tábua grossa de pinus 40 plainada', price:90, mode:'unit', baseQty:1, unit:'un', note:'Registro da tabela anterior; medida/comprimento a confirmar.' },
    { id:'p_mui_01', category:'Tábuas especiais — registro anterior', name:'Tábua de Muiracatiara — registro anterior (1 m linear, 3,5)', price:280, mode:'unknown', baseQty:1, unit:'?', note:'O registro anterior menciona “1 m linear, 3,5”, mas a tabela complementar informa m². Confirmar se é o mesmo produto antes de usar.' },
    { id:'p_mui_02', category:'Preço antigo — identificar', name:'TANI BUQUÊ (nome a confirmar)', price:115, mode:'unknown', baseQty:1, unit:'?', note:'Registro antigo de nome incerto. Não confundir com a tábua para andaime sem confirmar.' },
    { id:'p_bar_01', category:'Barrote de pinus', name:'Barrote de pinus 6 × 6 cm (3 m)', price:28, mode:'unit', baseQty:1, unit:'un', note:'Dimensão e comprimento conforme a tabela complementar.' },
    { id:'p_bar_02', category:'Barrote de pinus', name:'Barrote de pinus 6 × 6 cm (3 m) plainado', price:30, mode:'unit', baseQty:1, unit:'un', note:'Dimensão e comprimento conforme a tabela complementar.' },
    { id:'p_mad_01', category:'Madeirite preto', name:'Madeirite preto — 10 mm', price:100, mode:'unknown', baseQty:1, unit:'?', note:'Espessura identificada; confirmar se o preço é por chapa ou outra unidade.' },
    { id:'p_mad_02', category:'Madeirite preto', name:'Madeirite preto — 12 mm', price:110, mode:'unknown', baseQty:1, unit:'?', note:'Espessura identificada; confirmar se o preço é por chapa ou outra unidade.' },

    // Complementos recebidos em 14/10/2026.
    { id:'p_mat_telha', category:'Materiais de construção', name:'Telha', price:950, mode:'thousand', baseQty:1000, unit:'unidades', note:'Preço confirmado por milheiro (1.000 unidades). Informe a quantidade em unidades, inclusive quantidades menores como 800.' },
    { id:'p_mat_tijolo', category:'Materiais de construção', name:'Tijolo (?) — tipo a confirmar', price:1200, mode:'thousand', baseQty:1000, unit:'unidades', note:'Preço confirmado por milheiro (1.000 unidades). O tipo de tijolo ainda precisa ser identificado.' },
    { id:'p_mat_areia', category:'Materiais de construção', name:'Areia — “1 m” (possivelmente m³)', price:100, mode:'unknown', baseQty:1, unit:'?', note:'A anotação pode significar 1 m³; confirmar antes de calcular vendas.' },
    { id:'p_mat_brita', category:'Materiais de construção', name:'Brita — “1 m” (possivelmente m³)', price:180, mode:'unknown', baseQty:1, unit:'?', note:'A anotação pode significar 1 m³; confirmar antes de calcular vendas.' },
    { id:'p_mat_cal', category:'Materiais de construção', name:'Cal', price:15, mode:'unknown', baseQty:1, unit:'?', note:'Unidade/embalagem não informada.' },
    { id:'p_mat_cimento', category:'Materiais de construção', name:'Cimento', price:50, mode:'unknown', baseQty:1, unit:'?', note:'Unidade/embalagem não informada.' },
    { id:'p_mat_prego', category:'Materiais de construção', name:'Prego — preço por kg', price:20, mode:'unit', baseQty:1, unit:'kg', note:'A anotação informa 1 kg por R$ 20,00.' },

    { id:'p_gua_07', category:'Madeira Guajará', name:'Barrote Guajará — 1 m', price:16.5, mode:'meter', baseQty:1, unit:'m', note:'' },
    { id:'p_mas_07', category:'Madeira Maçaranduba', name:'Barrote Maçaranduba — 1 m', price:24, mode:'meter', baseQty:1, unit:'m', note:'' },
    { id:'p_gua_08', category:'Madeira Guajará', name:'Madeira Guajará — nome da peça ilegível — 1 m', price:16, mode:'meter', baseQty:1, unit:'m', note:'O nome do tipo de peça não pôde ser identificado na anotação.' },
    { id:'p_mas_08', category:'Madeira Maçaranduba', name:'Madeira Maçaranduba — nome da peça ilegível — 1 m', price:28, mode:'meter', baseQty:1, unit:'m', note:'O nome do tipo de peça não pôde ser identificado na anotação.' },
    { id:'p_gua_09', category:'Madeira Guajará', name:'Assoalho Guajará — 1 m', price:58, mode:'meter', baseQty:1, unit:'m', note:'' },
    { id:'p_mas_09', category:'Madeira Maçaranduba', name:'Assoalho Maçaranduba — 1 m', price:75, mode:'meter', baseQty:1, unit:'m', note:'' },
    { id:'p_pin_11', category:'Barrote de pinus', name:'Barrote de pinus 5 × 5 cm (3 m)', price:26, mode:'unit', baseQty:1, unit:'un', note:'Dimensão e comprimento conforme a tabela complementar.' },
    { id:'p_pin_12', category:'Barrote de pinus', name:'Barrote de pinus 5 × 5 cm (3 m) plainado', price:28, mode:'unit', baseQty:1, unit:'un', note:'Dimensão e comprimento conforme a tabela complementar.' },
    { id:'p_mad_03', category:'Portas', name:'Porta Paraná — 60 cm', price:150, mode:'unit', baseQty:1, unit:'un', note:'Preço anotado em conjunto para os tamanhos 60, 70 e 80.' },
    { id:'p_mad_04', category:'Portas', name:'Porta Paraná — 70 cm', price:150, mode:'unit', baseQty:1, unit:'un', note:'Preço anotado em conjunto para os tamanhos 60, 70 e 80.' },
    { id:'p_mad_05', category:'Portas', name:'Porta Paraná — 80 cm', price:150, mode:'unit', baseQty:1, unit:'un', note:'Preço anotado em conjunto para os tamanhos 60, 70 e 80.' },
    { id:'p_andaime_01', category:'Tábuas especiais', name:'Tábua para andaime — m²', price:115, mode:'area', baseQty:1, unit:'m²', note:'Preço informado por metro quadrado; informe comprimento e largura de cada peça.' },
    { id:'p_mui_03', category:'Tábuas especiais', name:'Tábua de Muiracatiara — m²', price:280, mode:'area', baseQty:1, unit:'m²', note:'Preço da tabela complementar por metro quadrado; informe comprimento e largura de cada peça.' },
    { id:'p_forro_mas_01', category:'Forro de madeira', name:'Forro de Maçaranduba — medida não especificada', price:180, mode:'unknown', baseQty:1, unit:'?', note:'Registro da tabela complementar: R$ 180,00. Medida e unidade de cobrança não especificadas.' },
  ];

  function createSeedDb() {
    return {
      version: 1,
      schemaVersion: 4,
      business: { name: 'Serraria São Francisco', address: '', phone: '' },
      stocks: stockSeeds.map(function (item) {
        return { id: item[0], category: item[1], name: item[2], unit: 'un', initialQty: item[3], removedLegacy: item[4], currentQty: item[5], updatedAt: null };
      }),
      prices: priceSeeds.map(function (item) {
        return Object.assign({ baseQty: 1, unit: 'un', note: '', updatedAt: null }, item);
      }),
      movements: [],
      receipts: [],
      counter: 1,
      lastBackup: null,
      draft: { customer: { name: '', cpf: '', address: '', phone: '' }, lines: [], selectedPriceId: '', showCustom: false, showCustomerDetails: false, billingMode: 'unit' }
    };
  }
  function loadDb() {
    try {
      var raw = localStorage.getItem(DB_KEY);
      if (!raw) return createSeedDb();
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.stocks) || !Array.isArray(parsed.prices)) return createSeedDb();
      if (!parsed.business) parsed.business = { name: 'Serraria São Francisco', address: '', phone: '' };
      if (!Array.isArray(parsed.movements)) parsed.movements = [];
      if (!Array.isArray(parsed.receipts)) parsed.receipts = [];
      if (!parsed.draft) parsed.draft = { customer: { name: '', cpf: '', address: '', phone: '' }, lines: [], selectedPriceId: '', showCustom: false };
      if (!parsed.draft.customer) parsed.draft.customer = { name: '', cpf: '', address: '', phone: '' };
      if (!Array.isArray(parsed.draft.lines)) parsed.draft.lines = [];
      if (typeof parsed.draft.showCustomerDetails !== 'boolean') parsed.draft.showCustomerDetails = !!(parsed.draft.customer.name || parsed.draft.customer.cpf || parsed.draft.customer.address || parsed.draft.customer.phone);
      if (!parsed.counter) parsed.counter = parsed.receipts.length + 1;
      var seeds = createSeedDb();
      seeds.stocks.forEach(function (seed) {
        if (!parsed.stocks.some(function (item) { return item.id === seed.id; })) parsed.stocks.push(seed);
      });
      seeds.prices.forEach(function (seed) {
        if (!parsed.prices.some(function (item) { return item.id === seed.id; })) parsed.prices.push(seed);
      });
      // Garante compatibilidade de campos novos sem substituir os preços que o usuário já editou.
      parsed.prices.forEach(function (item) {
        if (!item.mode) item.mode = 'unit';
        if (!item.unit) item.unit = item.mode === 'meter' || item.mode === 'base' ? 'm' : item.mode === 'thousand' ? 'unidades' : 'un';
        if (item.note === undefined) item.note = '';
        if (item.baseQty === undefined) item.baseQty = 1;
      });
      if (!parsed.schemaVersion || parsed.schemaVersion < 2) {
        var oldAlisado = parsed.prices.find(function (item) { return item.id === 'p_mas_05'; });
        if (oldAlisado) { oldAlisado.mode = 'meter'; oldAlisado.baseQty = 1; oldAlisado.unit = 'm'; }
      }
      if (!parsed.schemaVersion || parsed.schemaVersion < 3) {
        var corrections = {
          'p_gua_01': { name: 'Linha Guajará — 1 m', category: 'Madeira Guajará', mode: 'meter', baseQty: 1, unit: 'm' },
          'p_gua_02': { name: 'Caibro Guajará — 1 m', category: 'Madeira Guajará', mode: 'meter', baseQty: 1, unit: 'm' },
          'p_gua_03': { name: 'Ripa Guajará — 1 m', category: 'Madeira Guajará', mode: 'meter', baseQty: 1, unit: 'm' },
          'p_mas_01': { name: 'Linha Maçaranduba — 1 m', category: 'Madeira Maçaranduba', mode: 'meter', baseQty: 1, unit: 'm' },
          'p_mas_02': { name: 'Caibro Maçaranduba — 1 m', category: 'Madeira Maçaranduba', mode: 'meter', baseQty: 1, unit: 'm' },
          'p_mas_03': { name: 'Ripa Maçaranduba — 1 m', category: 'Madeira Maçaranduba', mode: 'meter', baseQty: 1, unit: 'm' },
          'p_mas_04': { name: 'Forro Maçaranduba — 60/70/80 (registro anterior)', category: 'Forro de madeira', mode: 'unknown', unit: '?', note: 'Registro anterior: R$ 160,00 para 60/70/80. Pode ser diferente do forro sem medida especificada anotado por R$ 180,00; confirmar.' },
          'p_mas_05': { name: 'Alisado Guajará — 1 m', category: 'Madeira Guajará', mode: 'meter', baseQty: 1, unit: 'm', note: 'O preço de R$ 8,00 foi associado a Guajará na tabela complementar.' },
          'p_mas_06': { name: 'Muiracatiara — peça não identificada', category: 'Muiracatiara', mode: 'unknown', unit: '?', note: 'A anotação informa R$ 15,00, mas não permite identificar a peça nem a unidade.' },
          'p_gua_04': { name: 'Forro de Guajará (60/70/80; padrão 13?)', category: 'Forro de madeira', mode: 'unknown', unit: '?', note: 'A anotação menciona 60, 70 e 80 e “padrão 13 (?)”. Unidade de cobrança não confirmada.' },
          'p_pin_01': { name: 'Tábua de pinus 20 (3 m)' },
          'p_pin_02': { name: 'Tábua de pinus 25 (3 m)' },
          'p_pin_03': { name: 'Tábua de pinus 30 (3 m)' },
          'p_pin_06': { name: 'Tábua de pinus 20 plainada (3 m)' },
          'p_pin_07': { name: 'Tábua de pinus 25 plainada (3 m)' },
          'p_pin_08': { name: 'Tábua de pinus 30 plainada (3 m)' },
          'p_bar_01': { name: 'Barrote de pinus 6 × 6 cm (3 m)', category: 'Barrote de pinus', mode: 'unit', unit: 'un', note: 'Dimensão e comprimento conforme a tabela complementar.' },
          'p_bar_02': { name: 'Barrote de pinus 6 × 6 cm (3 m) plainado', category: 'Barrote de pinus', mode: 'unit', unit: 'un', note: 'Dimensão e comprimento conforme a tabela complementar.' },
          'p_mui_01': { name: 'Tábua de Muiracatiara — registro anterior (1 m linear, 3,5)', category: 'Tábuas especiais — registro anterior', mode: 'unknown', unit: '?', note: 'O registro anterior menciona “1 m linear, 3,5”, mas a tabela complementar informa m². Confirmar se é o mesmo produto antes de usar.' },
          'p_mui_02': { name: 'TANI BUQUÊ (nome a confirmar)', category: 'Preço antigo — identificar', mode: 'unknown', unit: '?', note: 'Registro antigo de nome incerto. Não confundir com a tábua para andaime sem confirmar.' },
          'p_mad_01': { name: 'Madeirite preto — 10 mm', category: 'Madeirite preto', mode: 'unknown', unit: '?', note: 'Espessura identificada; confirmar se o preço é por chapa ou outra unidade.' },
          'p_mad_02': { name: 'Madeirite preto — 12 mm', category: 'Madeirite preto', mode: 'unknown', unit: '?', note: 'Espessura identificada; confirmar se o preço é por chapa ou outra unidade.' }
        };
        Object.keys(corrections).forEach(function (id) {
          var existing = parsed.prices.find(function (item) { return item.id === id; });
          if (existing) Object.keys(corrections[id]).forEach(function (key) { existing[key] = corrections[id][key]; });
        });
        parsed.schemaVersion = 3;
      }
      // v4: as unidades de telha e tijolo foram confirmadas como milheiro.
      // Preserva o preço atual caso o usuário já o tenha editado.
      if (!parsed.schemaVersion || parsed.schemaVersion < 4) {
        var milheiroNotes = {
          'p_mat_telha': 'Preço confirmado por milheiro (1.000 unidades). Informe a quantidade em unidades, inclusive quantidades menores como 800.',
          'p_mat_tijolo': 'Preço confirmado por milheiro (1.000 unidades). O tipo de tijolo ainda precisa ser identificado.'
        };
        ['p_mat_telha', 'p_mat_tijolo'].forEach(function (id) {
          var material = parsed.prices.find(function (item) { return item.id === id; });
          if (material) {
            material.mode = 'thousand';
            material.baseQty = 1000;
            material.unit = 'unidades';
            material.note = milheiroNotes[id];
          }
        });
        parsed.schemaVersion = 4;
      }
      if (!parsed.draft.billingMode) {
        var draftProduct = parsed.prices.find(function (item) { return item.id === parsed.draft.selectedPriceId; });
        parsed.draft.billingMode = !draftProduct ? 'unit' : draftProduct.mode === 'thousand' ? 'thousand' : draftProduct.mode === 'area' ? 'area' : (draftProduct.mode === 'unit' || draftProduct.mode === 'unknown') ? 'unit' : 'length';
      }
      parsed.schemaVersion = 4;
      return parsed;
    } catch (error) {
      return createSeedDb();
    }
  }
  var db = loadDb();

  function persist(silent) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      return true;
    } catch (error) {
      if (!silent) showToast('Não consegui salvar. Faça uma cópia dos dados e libere espaço no navegador.');
      return false;
    }
  }
  persist(true);

  function showToast(message) {
    var region = document.getElementById('toast-region');
    if (!region) return;
    region.innerHTML = '<div class="toast">' + escapeHtml(message) + '</div>';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { region.innerHTML = ''; }, 3400);
  }
  function categoriesFor(list) {
    var values = [];
    list.forEach(function (item) { if (item.category && values.indexOf(item.category) === -1) values.push(item.category); });
    return values.sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); });
  }
  function priceDescription(item) {
    if (item.mode === 'unknown') return 'Unidade de cobrança a confirmar';
    if (item.mode === 'thousand') return money(item.price) + ' por milheiro (1.000 unidades)';
    if (item.mode === 'area') return money(item.price) + ' por m²';
    if (item.mode === 'meter') return money(item.price) + ' por metro';
    if (item.mode === 'base') return money(item.price) + ' a cada ' + qtyText(item.baseQty || 1) + ' m';
    return money(item.price) + ' por ' + (item.unit && item.unit !== 'un' ? item.unit : 'unidade/peça');
  }
  function chargedPriceDescription(item) {
    if (item.billingMode === 'area' || item.mode === 'area') return money(item.price) + ' por m²';
    if (item.mode === 'unknown') return 'unidade a confirmar';
    if (item.billingMode === 'thousand' || item.mode === 'thousand') return money(item.price) + ' por milheiro (1.000 unidades)';
    if (item.billingMode === 'length') {
      if (item.mode === 'base') return money(item.price) + ' a cada ' + qtyText(item.baseQty || 1) + ' m';
      return money(item.price) + ' por metro';
    }
    return money(item.price) + ' por ' + (item.unit && item.unit !== 'un' ? item.unit : 'peça/unidade');
  }
  function computeLineTotal(item, quantity, lengthPerPiece, billingMode, widthPerPiece) {
    var pieces = Number(quantity) || 0;
    var price = Number(item.price) || 0;
    var base = item.mode === 'base' ? (Number(item.baseQty) || 1) : 1;
    var raw;
    if (billingMode === 'thousand' || item.mode === 'thousand') {
      // Preço de milheiro: a quantidade digitada é número de unidades, não de milheiros.
      raw = pieces * price / 1000;
    } else if (billingMode === 'area' || item.mode === 'area') {
      raw = pieces * (Number(lengthPerPiece) || 0) * (Number(widthPerPiece) || 0) * price;
    } else if (billingMode === 'length') {
      // A quantidade é o número de peças; cada peça pode ter comprimento diferente.
      // mode=unit só vira preço por metro quando o atendente escolhe explicitamente comprimento.
      raw = pieces * (Number(lengthPerPiece) || 0) * price / base;
    } else {
      raw = pieces * price;
    }
    return Math.round(raw * 100) / 100;
  }
  function normalizeSearch(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }
  function pageHeading() {
    var titles = { inicio: 'Bom trabalho!', venda: 'Nova nota', estoque: 'Controle de estoque', precos: 'Tabela de preços', arquivos: 'Arquivos e cópias' };
    document.getElementById('page-title').textContent = titles[page] || 'Assistente da Serraria';
    var d = new Date();
    document.getElementById('today-label').textContent = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
    document.querySelectorAll('[data-page]').forEach(function (element) {
      var active = element.getAttribute('data-page') === page;
      element.classList.toggle('active', active);
      if (active) element.setAttribute('aria-current', 'page'); else element.removeAttribute('aria-current');
    });
  }
  function navigate(nextPage) {
    page = nextPage;
    pageHeading();
    renderPage();
    window.scrollTo(0, 0);
  }
  function renderPage() {
    var main = document.getElementById('main-content');
    if (page === 'inicio') main.innerHTML = renderHome();
    else if (page === 'venda') main.innerHTML = renderSale();
    else if (page === 'estoque') main.innerHTML = renderStock();
    else if (page === 'precos') main.innerHTML = renderPrices();
    else main.innerHTML = renderFiles();
    if (page === 'venda') {
      var selectedProduct = db.prices.find(function (item) { return item.id === db.draft.selectedPriceId; });
      if (selectedProduct && !db.draft.billingMode) db.draft.billingMode = selectedProduct.mode === 'thousand' ? 'thousand' : selectedProduct.mode === 'unit' ? 'unit' : 'length';
      updateSalePreview();
      var customMode = document.getElementById('custom-mode');
      var customBase = document.getElementById('custom-base-wrap');
      var customLength = document.getElementById('custom-length-wrap');
      if (customMode && customBase) customBase.style.display = customMode.value === 'base' ? 'grid' : 'none';
      if (customMode && customLength) customLength.style.display = customMode.value === 'unit' ? 'none' : 'grid';
    }
  }

  function renderHome() {
    var recent = db.receipts.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 3);
    var knownStock = db.stocks.filter(function (item) { return item.currentQty !== null && item.currentQty !== undefined; }).length;
    var lastNote = recent.length ? '<div class="history-row"><div><strong>Nota ' + escapeHtml(recent[0].number) + ' · ' + escapeHtml(recent[0].customer.name || 'Cliente não informado') + '</strong><small>' + dateText(recent[0].date, true) + '</small></div><div class="history-value">' + money(recent[0].total) + '<small><button class="text-button" data-action="print-note" data-id="' + escapeHtml(recent[0].id) + '">Abrir nota</button></small></div></div>' : '<div class="empty"><strong>Nenhuma nota por aqui ainda.</strong>Quando você terminar a primeira venda pelo site, ela aparecerá aqui.</div>';
    return '<div class="page-stack dashboard">' +
      '<section class="hero"><p class="eyebrow">SEU APOIO NO BALCÃO</p><h2>Vamos deixar as contas mais leves.</h2><p>Some os pedidos sem fazer conta de cabeça, registre o estoque e tenha a planilha pronta quando a dona pedir.</p><button class="button button-light" data-action="go-sale">＋&nbsp; Fazer uma nota agora</button></section>' +
      '<section class="metric-grid"><div class="metric"><span class="metric-icon">▤</span><strong class="metric-value">' + db.stocks.length + '</strong><span class="metric-label">itens cadastrados no estoque</span></div><div class="metric"><span class="metric-icon">R$</span><strong class="metric-value">' + db.prices.length + '</strong><span class="metric-label">preços na tabela</span></div><div class="metric"><span class="metric-icon">▧</span><strong class="metric-value">' + db.receipts.length + '</strong><span class="metric-label">notas registradas neste aparelho</span></div><div class="metric"><span class="metric-icon">✓</span><strong class="metric-value">' + knownStock + '</strong><span class="metric-label">itens com saldo conhecido</span></div></section>' +
      '<section class="card"><div class="section-head"><div><h2>O que você precisa fazer?</h2><p>Atalhos grandes para agilizar o serviço.</p></div></div><div class="quick-grid"><button class="quick-action" data-page="venda"><span class="quick-icon">＋</span><span><strong>Montar uma nota</strong><small>Adicionar itens e calcular o total</small></span><span class="arrow">›</span></button><button class="quick-action" data-page="estoque"><span class="quick-icon">▤</span><span><strong>Atualizar estoque</strong><small>Registrar entrada ou saída</small></span><span class="arrow">›</span></button><button class="quick-action" data-page="precos"><span class="quick-icon">R$</span><span><strong>Corrigir um preço</strong><small>Editar os valores quando mudarem</small></span><span class="arrow">›</span></button><button class="quick-action" data-page="arquivos"><span class="quick-icon">⇩</span><span><strong>Enviar a planilha</strong><small>Gerar Excel ou cópia de segurança</small></span><span class="arrow">›</span></button></div></section>' +
      '<section class="card"><div class="section-head"><div><h2>Notas recentes</h2><p>Toque em “Abrir nota” para imprimir ou salvar em PDF.</p></div><button class="button button-secondary button-small" data-page="arquivos">Ver todas</button></div>' + lastNote + (recent.length > 1 ? recent.slice(1).map(function (receipt) { return '<div class="history-row"><div><strong>Nota ' + escapeHtml(receipt.number) + ' · ' + escapeHtml(receipt.customer.name || 'Cliente não informado') + '</strong><small>' + dateText(receipt.date, true) + '</small></div><div class="history-value">' + money(receipt.total) + '<small><button class="text-button" data-action="print-note" data-id="' + escapeHtml(receipt.id) + '">Abrir nota</button></small></div></div>'; }).join('') : '') + '</section>' +
      '<div class="notice"><span class="notice-icon">i</span><div><strong>Importante: seus dados ficam neste navegador.</strong><br>Este site não sincroniza com outros aparelhos. Faça uma cópia de segurança em “Arquivos e cópias” regularmente. A planilha Excel é um arquivo para enviar à dona; ela não atualiza este site sozinha.</div></div>' +
      '</div>';
  }

  function customerField(key, label, placeholder, type) {
    var value = db.draft.customer[key] || '';
    return '<div class="field"><label for="customer-' + key + '">' + label + '</label><input id="customer-' + key + '" data-customer="' + key + '" type="' + (type || 'text') + '" value="' + escapeHtml(value) + '" placeholder="' + escapeHtml(placeholder || '') + '" autocomplete="off"></div>';
  }
  function sortedSalePrices() {
    return db.prices.slice().sort(function (a, b) {
      return (a.category + ' ' + a.name).localeCompare(b.category + ' ' + b.name, 'pt-BR');
    });
  }
  function saleProductResultsHtml() {
    var query = normalizeSearch(saleSearch);
    var terms = query ? query.split(/\s+/).filter(Boolean) : [];
    var items = sortedSalePrices().filter(function (item) {
      var searchable = normalizeSearch(item.name + ' ' + item.category);
      return !terms.length || terms.every(function (term) { return searchable.indexOf(term) >= 0; });
    });
    var totalMatches = items.length;
    if (!saleShowAll) items = items.slice(0, 6);
    if (!totalMatches) {
      return '<div class="sale-search-empty">Não encontrei esse produto. Confira a escrita ou use <b>Adicionar item sem cadastro</b>.</div>';
    }
    return '<div class="sale-results-list">' + items.map(function (item) {
      return '<button type="button" class="sale-product-option" data-price-pick="' + escapeHtml(item.id) + '"><span class="sale-option-text"><strong>' + escapeHtml(item.name) + '</strong><small>' + escapeHtml(item.category) + '</small></span><span class="sale-option-price"><strong>' + money(item.price) + '</strong><small>' + escapeHtml(item.mode === 'unknown' ? 'unidade a confirmar' : item.mode === 'thousand' ? 'por milheiro (1.000 un.)' : item.mode === 'area' ? 'por m²' : item.mode === 'meter' ? 'por metro' : item.mode === 'base' ? 'por ' + qtyText(item.baseQty || 1) + ' m' : 'por ' + (item.unit && item.unit !== 'un' ? item.unit : 'peça')) + '</small></span></button>';
    }).join('') + '</div>' + (!saleShowAll && totalMatches > 6 ? '<p class="sale-result-count">Mostrando 6 de ' + totalMatches + ' resultados.</p>' : '');
  }
  function renderSaleProductPicker() {
    var selected = db.prices.find(function (item) { return item.id === db.draft.selectedPriceId; });
    if (selected) {
      var defaultBilling = selected.mode === 'thousand' ? 'thousand' : selected.mode === 'area' ? 'area' : selected.mode === 'unknown' ? 'unit' : selected.mode !== 'unit' ? 'length' : (db.draft.billingMode || 'unit');
      var selectedCharge = { mode: selected.mode, price: selected.price, baseQty: selected.baseQty, unit: selected.unit, billingMode: defaultBilling };
      var selectedHtml = '<div class="selected-product"><div class="selected-product-mark">✓</div><div class="selected-product-copy"><strong>' + escapeHtml(selected.name) + '</strong><small>' + escapeHtml(selected.category) + ' · ' + escapeHtml(chargedPriceDescription(selectedCharge)) + '</small></div><button type="button" class="button button-secondary button-small" data-action="change-sale-product">Trocar</button></div>';
      if (selected.mode === 'unknown') {
        return selectedHtml + '<div class="notice" style="margin-top:12px"><span class="notice-icon">!</span><div><strong>Falta confirmar a unidade de cobrança.</strong><br>' + escapeHtml(selected.note || 'Edite o produto e escolha como ele é cobrado antes de calcular uma nota.') + '<div style="margin-top:10px"><button type="button" class="button button-secondary button-small" data-action="price-edit" data-id="' + escapeHtml(selected.id) + '">Confirmar em Preços</button></div></div></div>';
      }
      var canChooseLength = selected.mode === 'unit' && (!selected.unit || selected.unit === 'un');
      var billingHtml = selected.mode === 'area'
        ? '<div class="field sale-billing-field"><label>Como calcular o valor?</label><div class="selected-product"><div class="selected-product-copy"><strong>Por metro quadrado (m²)</strong><small>' + money(selected.price) + ' por m²</small></div></div><span class="help" id="sale-product-help">Informe comprimento e largura de cada peça. O total da área será multiplicado pelo preço por m².</span></div>'
        : (canChooseLength ? '<div class="field sale-billing-field"><label for="sale-billing">Como calcular o valor?</label><select id="sale-billing"><option value="unit" ' + (defaultBilling === 'unit' ? 'selected' : '') + '>Por peça / unidade</option><option value="length" ' + (defaultBilling === 'length' ? 'selected' : '') + '>Pelo comprimento de cada peça</option></select><span class="help" id="sale-product-help">' + (selected.mode === 'unit' ? 'Se escolher comprimento, o preço cadastrado será considerado como preço por 1 metro. Confira a tabela.' : 'O preço cadastrado será proporcional ao comprimento informado.') + '</span></div>' : '<div class="field sale-billing-field"><label>Forma de cobrança</label><p class="help" id="sale-product-help">' + escapeHtml(priceDescription(selected)) + '</p></div>');
      return selectedHtml + billingHtml;
    }
    return '<div class="field"><label for="sale-search">Buscar produto</label><input id="sale-search" type="search" inputmode="search" autocomplete="off" placeholder="Digite: alisado, caibro, tábua…" value="' + escapeHtml(saleSearch) + '"><span class="help">Digite só um pedaço do nome ou o tipo de madeira.</span></div>' +
      '<div id="sale-product-results">' + (saleSearch || saleShowAll ? saleProductResultsHtml() : '<div class="sale-search-empty">Comece digitando o nome do produto. A lista completa fica escondida para não atrapalhar no celular.</div>') + '</div>' +
      '<button type="button" class="text-button sale-all-toggle" data-action="show-all-sale-products">' + (saleShowAll ? 'Mostrar menos produtos' : 'Ver lista completa de produtos') + '</button>';
  }
  function renderSaleLines() {
    if (!db.draft.lines.length) return '<div class="empty"><strong>Sua nota está vazia.</strong>Escolha um produto acima. A conta será feita automaticamente.</div>';
    return db.draft.lines.map(function (line, index) {
      var detail;
      if (line.billingMode === 'thousand') {
        detail = qtyText(line.quantity) + ' unidades × ' + money(line.price) + ' por milheiro (1.000 unidades)';
      } else if (line.billingMode === 'area' && Number(line.lengthPerPiece) > 0 && Number(line.widthPerPiece) > 0) {
        detail = qtyText(line.quantity) + ' peça(s) × ' + qtyText(line.lengthPerPiece) + ' m × ' + qtyText(line.widthPerPiece) + ' m = ' + qtyText(line.totalArea || (Number(line.quantity) * Number(line.lengthPerPiece) * Number(line.widthPerPiece))) + ' m² · ' + chargedPriceDescription(line);
      } else if (line.billingMode === 'length' && Number(line.lengthPerPiece) > 0) {
        detail = qtyText(line.quantity) + ' peça(s) × ' + qtyText(line.lengthPerPiece) + ' m = ' + qtyText(line.totalLength || (Number(line.quantity) * Number(line.lengthPerPiece))) + ' m · ' + chargedPriceDescription(line);
      } else {
        detail = qtyText(line.quantity) + ' ' + escapeHtml(line.unit || 'un') + ' × ' + money(line.price) + ' por ' + escapeHtml(line.unit && line.unit !== 'un' ? line.unit : 'unidade');
      }
      return '<div class="draft-line"><div class="draft-line-main"><span class="draft-line-title">' + escapeHtml(line.name) + '</span><span class="draft-line-detail">' + detail + '</span></div><div class="draft-line-side"><strong>' + money(line.total) + '</strong><button class="text-button" data-action="remove-line" data-index="' + index + '">Remover</button></div></div>';
    }).join('');
  }
  function renderSale() {
    var selectedProduct = db.prices.find(function (item) { return item.id === db.draft.selectedPriceId; });
    var canCalculateSelected = !!selectedProduct && selectedProduct.mode !== 'unknown';
    var selectedBilling = !selectedProduct ? 'unit' : selectedProduct.mode === 'thousand' ? 'thousand' : selectedProduct.mode === 'area' ? 'area' : selectedProduct.mode === 'unknown' ? 'unit' : selectedProduct.mode !== 'unit' ? 'length' : (db.draft.billingMode || 'unit');
    var custom = db.draft.showCustom ? '<section class="card"><div class="section-head"><div><h2>Item sem cadastro</h2><p>Use quando o produto ainda não estiver na tabela.</p></div><button class="icon-button" data-action="toggle-custom" aria-label="Fechar">×</button></div><form id="custom-line-form" data-form="custom-line"><div class="form-grid two"><div class="field"><label for="custom-name">Descrição</label><input id="custom-name" name="name" required placeholder="Ex.: madeira cortada sob medida"></div><div class="field"><label for="custom-unit">Unidade</label><select id="custom-unit" name="unit"><option value="un">Unidade</option><option value="m">Metro</option><option value="kg">Quilo</option><option value="cx">Caixa</option><option value="saco">Saco</option><option value="outro">Outra</option></select></div><div class="field"><label for="custom-qty">Quantidade de peças/unidades</label><input id="custom-qty" name="quantity" type="number" inputmode="decimal" min="0.001" step="any" value="1" required></div><div class="field"><label for="custom-price">Preço cadastrado (R$)</label><input id="custom-price" name="price" type="number" inputmode="decimal" min="0" step="0.01" required placeholder="0,00"></div><div class="field"><label for="custom-mode">Como cobrar?</label><select id="custom-mode" name="mode"><option value="unit">Por unidade/peça</option><option value="meter">Por metro linear</option><option value="base">Por uma base de metros</option><option value="area">Por metro quadrado (m²)</option></select></div><div class="field" id="custom-base-wrap" style="display:none"><label for="custom-base">A base equivale a quantos metros?</label><input id="custom-base" name="baseQty" type="number" inputmode="decimal" min="0.001" step="any" value="1"><span class="help">Ex.: R$ 10 para cada 2 m: coloque 2.</span></div><div class="field" id="custom-length-wrap" style="display:none"><label for="custom-length">Comprimento de cada peça (m)</label><input id="custom-length" name="lengthPerPiece" type="text" inputmode="decimal" autocomplete="off" placeholder="1,25" value="1"><span class="help">Ex.: cinco peças de 1,25 m cada.</span></div><div class="field" id="custom-width-wrap" style="display:none"><label for="custom-width">Largura de cada peça (m)</label><input id="custom-width" name="widthPerPiece" type="text" inputmode="decimal" autocomplete="off" placeholder="0,30" value="1"></div></div><div class="modal-actions"><button type="button" class="button button-quiet" data-action="toggle-custom">Cancelar</button><button type="submit" class="button">Adicionar à nota</button></div></form></section>' : '';
    var qty = 1;
    return '<div class="page-stack"><section class="hero"><p class="eyebrow">VENDA SEM CONTA DE CABEÇA</p><h2>Calcule a venda sem fazer conta de cabeça.</h2><p>Escolha o produto, informe quantas peças e o comprimento de cada uma. O site faz a conta e soma a nota.</p></section>' +
      '<section class="card sale-builder"><div class="section-head"><div><h2>1. Escolha o produto</h2><p>Busque pelo nome. A lista completa só aparece quando você pedir.</p></div></div>' + renderSaleProductPicker() +
      (canCalculateSelected ? '<div class="sale-entry-fields"><div class="field"><label for="sale-quantity">' + (selectedBilling === 'thousand' ? 'Quantidade (unidades)' : selectedBilling === 'area' ? 'Quantas peças?' : (selectedProduct.unit && selectedProduct.unit !== 'un' && selectedBilling === 'unit' ? 'Quantidade (' + escapeHtml(selectedProduct.unit) + ')' : 'Quantas peças?')) + '</label><input id="sale-quantity" type="number" inputmode="' + (selectedBilling === 'thousand' ? 'numeric' : 'decimal') + '" min="' + (selectedBilling === 'thousand' ? '1' : '0.001') + '" step="' + (selectedBilling === 'thousand' ? '1' : 'any') + '" value="' + qty + '"><span class="help">' + (selectedBilling === 'thousand' ? 'Digite a quantidade em unidades. Ex.: 800. O preço cadastrado vale para 1.000 unidades.' : selectedBilling === 'area' ? 'Informe quantas peças serão cortadas.' : selectedBilling === 'unit' && selectedProduct.unit && selectedProduct.unit !== 'un' ? 'Informe a quantidade na unidade indicada.' : 'Ex.: 5 peças.') + '</span></div><div class="field" id="sale-length-wrap" style="display:' + (selectedBilling === 'length' || selectedBilling === 'area' ? 'grid' : 'none') + '"><label for="sale-length">Comprimento de cada peça (m)</label><input id="sale-length" type="text" inputmode="decimal" autocomplete="off" placeholder="1,25" value="1"><span class="help">' + (selectedBilling === 'area' ? 'Ex.: 2 m de comprimento.' : 'Ex.: 1,25 metro por peça.') + '</span></div><div class="field" id="sale-width-wrap" style="display:' + (selectedBilling === 'area' ? 'grid' : 'none') + '"><label for="sale-width">Largura de cada peça (m)</label><input id="sale-width" type="text" inputmode="decimal" autocomplete="off" placeholder="0,30" value="1"><span class="help">Para converter cm em metros: 30 cm = 0,30 m.</span></div></div><div class="sale-math-detail" id="sale-math-detail">Informe a quantidade e as medidas necessárias.</div><div class="price-preview sale-total-preview"><span>Total deste item</span><strong id="sale-preview">R$ 0,00</strong></div><button class="button button-full" style="margin-top:14px" data-action="add-line">＋&nbsp; Adicionar item à nota</button>' : '') +
      '<button class="button button-secondary button-full" style="margin-top:10px" data-action="toggle-custom">＋&nbsp; Adicionar item sem cadastro</button></section>' + custom +
      '<section class="card"><div class="section-head"><div><h2>2. Itens da nota</h2><p>' + db.draft.lines.length + (db.draft.lines.length === 1 ? ' item adicionado' : ' itens adicionados') + '</p></div>' + (db.draft.lines.length ? '<button class="text-button" data-action="clear-draft">Limpar itens</button>' : '') + '</div><div id="draft-lines">' + renderSaleLines() + '</div><div class="total-box"><span>Total da nota</span><strong id="draft-total">' + money(draftTotal()) + '</strong></div><div class="divider"></div><button class="button button-full" data-action="complete-note">Salvar nota e abrir para PDF</button><p class="small muted" style="margin:11px 2px 0">Depois, escolha “Salvar como PDF” ou transcreva os valores para a notinha física.</p></section>' +
      '<section class="card"><details id="customer-details" ' + (db.draft.showCustomerDetails ? 'open' : '') + '><summary class="customer-summary"><span><strong>3. Dados do cliente (opcional)</strong><small>Nome, CPF, telefone e endereço para entrega</small></span><span class="customer-chevron">⌄</span></summary><div class="form-grid two customer-fields">' + customerField('name','Nome','Nome do cliente') + customerField('cpf','CPF (opcional)','Somente se necessário') + customerField('phone','Telefone','Telefone para contato','tel') + customerField('address','Endereço','Preencha se for para entrega') + '</div></details></section></div>';
  }
  function draftTotal() { return db.draft.lines.reduce(function (sum, line) { return sum + (Number(line.total) || 0); }, 0); }
  function filteredStock() {
    return db.stocks.filter(function (item) {
      var searchMatch = (item.name + ' ' + item.category).toLowerCase().indexOf(stockSearch.toLowerCase()) >= 0;
      return searchMatch && (stockFilter === 'Todos' || item.category === stockFilter);
    }).sort(function (a, b) { return (a.category + a.name).localeCompare(b.category + b.name, 'pt-BR'); });
  }
  function stockItemCard(item) {
    var known = item.currentQty !== null && item.currentQty !== undefined && item.currentQty !== '';
    var inventoryValue = known ? qtyText(item.currentQty) + ' ' + escapeHtml(item.unit || 'un') : 'Saldo não informado';
    var status = !known ? '<span class="pill">Cadastrar saldo</span>' : Number(item.currentQty) <= 0 ? '<span class="pill" style="background:var(--danger-soft);color:var(--danger)">Zerado</span>' : '<span class="pill pill-green">Saldo registrado</span>';
    return '<article class="item-card"><span class="item-badge">▤</span><div class="item-main"><strong>' + escapeHtml(item.name) + '</strong><small>' + escapeHtml(item.category) + ' · ' + escapeHtml(item.unit || 'un') + '</small>' + status + '</div><div class="item-right"><strong>' + inventoryValue + '</strong><div class="item-controls"><button class="icon-button" data-action="stock-adjust" data-id="' + escapeHtml(item.id) + '" aria-label="Ajustar saldo de ' + escapeHtml(item.name) + '">± Ajustar</button><button class="icon-button" data-action="stock-edit" data-id="' + escapeHtml(item.id) + '" aria-label="Editar ' + escapeHtml(item.name) + '">✎</button></div></div></article>';
  }
  function renderStock() {
    var categories = categoriesFor(db.stocks);
    var chips = ['Todos'].concat(categories).map(function (category) { return '<button class="chip ' + (stockFilter === category ? 'active' : '') + '" data-stock-filter="' + escapeHtml(category) + '">' + escapeHtml(category) + '</button>'; }).join('');
    var items = filteredStock();
    return '<div class="page-stack"><section class="hero"><p class="eyebrow">ESTOQUE NA PALMA DA MÃO</p><h2>Saldo simples, sem perder tempo.</h2><p>Registre entradas, saídas ou corrija uma quantidade. O histórico ficará guardado para entrar no Excel.</p><button class="button button-light" data-action="stock-add">＋&nbsp; Cadastrar item de estoque</button></section>' +
      '<section class="card"><div class="section-head"><div><h2>Itens do estoque</h2><p>' + db.stocks.length + ' itens cadastrados. Os saldos vieram da planilha enviada quando estavam preenchidos.</p></div></div><div class="toolbar"><div class="search-wrap"><span class="search-symbol">⌕</span><input class="search-box" id="stock-search" type="search" placeholder="Procurar produto…" value="' + escapeHtml(stockSearch) + '"></div><button class="button button-secondary button-small" data-action="stock-add">＋ Novo item</button></div><div class="filter-row">' + chips + '</div><div id="stock-list" class="item-list">' + (items.length ? items.map(stockItemCard).join('') : '<div class="empty"><strong>Nenhum item encontrado.</strong>Tente mudar a busca ou o filtro.</div>') + '</div></section>' +
      '<div class="notice"><span class="notice-icon">i</span><div><strong>Atenção aos saldos em branco.</strong><br>Algumas linhas da planilha original não tinham quantidade preenchida. O site mantém esses saldos como “não informado”, em vez de inventar uma quantidade.</div></div></div>';
  }

  function filteredPrices() {
    return db.prices.filter(function (item) {
      return (item.name + ' ' + item.category).toLowerCase().indexOf(priceSearch.toLowerCase()) >= 0 && (priceFilter === 'Todos' || item.category === priceFilter);
    }).sort(function (a, b) { return (a.category + a.name).localeCompare(b.category + b.name, 'pt-BR'); });
  }
  function priceItemCard(item) {
    var modeLabel = item.mode === 'unknown' ? 'Unidade a confirmar' : item.mode === 'thousand' ? 'Por milheiro (1.000 unidades)' : item.mode === 'area' ? 'Por metro quadrado (m²)' : item.mode === 'meter' ? 'Por metro linear' : item.mode === 'base' ? 'Por ' + qtyText(item.baseQty || 1) + ' m' : 'Por ' + (item.unit && item.unit !== 'un' ? item.unit : 'unidade/peça');
    return '<article class="item-card price-card"><span class="item-badge">R$</span><div class="item-main"><strong>' + escapeHtml(item.name) + '</strong><small>' + escapeHtml(item.category) + '</small><span class="pill">' + escapeHtml(modeLabel) + '</span>' + (item.note ? '<small class="price-note">' + escapeHtml(item.note) + '</small>' : '') + '</div><div class="item-right"><strong>' + money(item.price) + '</strong><small>' + escapeHtml(priceDescription(item)) + '</small><div class="item-controls"><button class="icon-button" data-action="price-edit" data-id="' + escapeHtml(item.id) + '" aria-label="Editar preço de ' + escapeHtml(item.name) + '">✎ Editar</button></div></div></article>';
  }
  function renderPrices() {
    var categories = categoriesFor(db.prices);
    var chips = ['Todos'].concat(categories).map(function (category) { return '<button class="chip ' + (priceFilter === category ? 'active' : '') + '" data-price-filter="' + escapeHtml(category) + '">' + escapeHtml(category) + '</button>'; }).join('');
    var items = filteredPrices();
    return '<div class="page-stack"><section class="hero"><p class="eyebrow">TABELA EDITÁVEL</p><h2>Preço mudou? Atualize aqui.</h2><p>Os valores cadastrados são usados na hora de calcular a nota. Há cobrança por unidade, metro, base de metros e m². Itens incertos ficam bloqueados para evitar contas erradas.</p><button class="button button-light" data-action="price-add">＋&nbsp; Cadastrar um preço</button></section>' +
      '<section class="card"><div class="section-head"><div><h2>Produtos e valores</h2><p>Os valores conhecidos foram transcritos da planilha. Confira antes de usar no balcão.</p></div></div><div class="toolbar"><div class="search-wrap"><span class="search-symbol">⌕</span><input class="search-box" id="price-search" type="search" placeholder="Procurar produto…" value="' + escapeHtml(priceSearch) + '"></div><button class="button button-secondary button-small" data-action="price-add">＋ Novo preço</button></div><div class="filter-row">' + chips + '</div><div id="price-list" class="item-list">' + (items.length ? items.map(priceItemCard).join('') : '<div class="empty"><strong>Nenhum preço encontrado.</strong>Tente mudar a busca ou cadastre um item.</div>') + '</div></section>' +
      '<div class="notice"><span class="notice-icon">!</span><div><strong>Confira os itens marcados “Unidade a confirmar”.</strong><br>Esses produtos não entram no cálculo da nota até você confirmar se são vendidos por peça, kg, metro, m², embalagem ou outra medida. Toque em “Editar” para completar unidade e observações.</div></div></div>';
  }

  function renderFiles() {
    var receipts = db.receipts.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    var lastBackup = db.lastBackup ? 'Última cópia: ' + dateText(db.lastBackup, true) : 'Você ainda não fez uma cópia de segurança por este site.';
    var recentRows = receipts.length ? receipts.map(function (receipt) {
      return '<div class="history-row"><div><strong>Nota ' + escapeHtml(receipt.number) + ' · ' + escapeHtml(receipt.customer.name || 'Cliente não informado') + '</strong><small>' + dateText(receipt.date, true) + ' · ' + receipt.lines.length + (receipt.lines.length === 1 ? ' item' : ' itens') + '</small></div><div class="history-value">' + money(receipt.total) + '<small><button class="text-button" data-action="print-note" data-id="' + escapeHtml(receipt.id) + '">Abrir PDF / imprimir</button></small></div></div>';
    }).join('') : '<div class="empty"><strong>Seu histórico está vazio.</strong>As notas registradas pelo site aparecerão aqui.</div>';
    return '<div class="page-stack"><section class="hero"><p class="eyebrow">ARQUIVOS PRONTOS PARA COMPARTILHAR</p><h2>Quando pedirem o Excel, ele sai daqui.</h2><p>Gere uma planilha organizada com estoque, preços, movimentações e notas registradas. Também faça uma cópia de segurança para não perder seus dados.</p></section>' +
      '<section class="card"><div class="section-head"><div><h2>Exportar e guardar</h2><p>Os arquivos são criados no aparelho. Nenhum dado é enviado para um servidor.</p></div></div><div class="action-stack"><button class="button" data-action="share-xlsx">⇩&nbsp; Gerar / compartilhar Excel atualizado</button><button class="button button-secondary" data-action="backup-json">＋&nbsp; Salvar cópia de segurança (JSON)</button><button class="button button-secondary" data-action="restore-json">↥&nbsp; Restaurar uma cópia de segurança</button></div><div class="divider"></div><p class="small muted" id="backup-status">' + escapeHtml(lastBackup) + '</p><div class="notice" style="margin-top:15px"><span class="notice-icon">i</span><div><strong>Excel e backup são coisas diferentes.</strong><br>O Excel é para enviar à dona e consultar os dados. O arquivo JSON é uma cópia completa que permite restaurar este site neste navegador ou em outro aparelho.</div></div></section>' +
      '<section class="card"><div class="section-head"><div><h2>Dados que aparecem na nota</h2><p>Você pode ajustar o nome da madeireira, endereço e telefone impressos.</p></div></div><form id="business-form" data-form="business" class="business-settings"><div class="field"><label for="business-name">Nome da loja</label><input id="business-name" name="name" required value="' + escapeHtml(db.business.name || '') + '"></div><div class="field"><label for="business-address">Endereço (opcional)</label><input id="business-address" name="address" value="' + escapeHtml(db.business.address || '') + '"></div><div class="field"><label for="business-phone">Telefone (opcional)</label><input id="business-phone" name="phone" value="' + escapeHtml(db.business.phone || '') + '" inputmode="tel"></div><button type="submit" class="button">Salvar identificação</button></form></section>' +
      '<section class="card"><div class="section-head"><div><h2>Histórico de notas</h2><p>' + receipts.length + ' notas salvas neste navegador.</p></div></div>' + recentRows + '</section>' +
      '<div class="notice"><span class="notice-icon">!</span><div><strong>Cuide da cópia de segurança.</strong><br>Se você limpar os dados do navegador, trocar de celular ou abrir o site em outro navegador, os dados locais podem não estar mais disponíveis. Salve o JSON regularmente e guarde-o em um lugar seguro.</div></div><input type="file" id="restore-input" accept=".json,application/json" hidden></div>';
  }

  function openModal(title, subtitle, body) {
    document.getElementById('modal-root').innerHTML = '<div class="modal-backdrop" data-action="backdrop-close"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><h2 id="modal-title">' + escapeHtml(title) + '</h2><p>' + escapeHtml(subtitle || '') + '</p></div><button type="button" class="modal-close" data-action="close-modal" aria-label="Fechar">×</button></div>' + body + '</section></div>';
    var first = document.querySelector('#modal-root input, #modal-root select, #modal-root button');
    if (first) setTimeout(function () { first.focus(); }, 50);
  }
  function closeModal() { document.getElementById('modal-root').innerHTML = ''; }
  function stockForm(item) {
    var editing = !!item;
    var body = '<form id="stock-form" data-form="stock" data-id="' + escapeHtml(item ? item.id : '') + '"><div class="form-grid"><div class="field"><label for="stock-name">Nome do item</label><input id="stock-name" name="name" required value="' + escapeHtml(item ? item.name : '') + '" placeholder="Ex.: PARAFUSO 3/8X3"></div><div class="field"><label for="stock-category">Categoria</label><input id="stock-category" name="category" list="stock-categories" required value="' + escapeHtml(item ? item.category : '') + '" placeholder="Ex.: Parafusos"><datalist id="stock-categories">' + categoriesFor(db.stocks).map(function (cat) { return '<option value="' + escapeHtml(cat) + '">'; }).join('') + '</datalist></div><div class="row-fields"><div class="field"><label for="stock-unit">Unidade do saldo</label><select id="stock-unit" name="unit"><option value="un" ' + (!item || item.unit === 'un' ? 'selected' : '') + '>Unidade (un)</option><option value="m" ' + (item && item.unit === 'm' ? 'selected' : '') + '>Metro (m)</option><option value="kg" ' + (item && item.unit === 'kg' ? 'selected' : '') + '>Quilo (kg)</option><option value="saco" ' + (item && item.unit === 'saco' ? 'selected' : '') + '>Saco</option><option value="cx" ' + (item && item.unit === 'cx' ? 'selected' : '') + '>Caixa</option><option value="outro" ' + (item && item.unit === 'outro' ? 'selected' : '') + '>Outro</option></select></div><div class="field"><label for="stock-quantity">Saldo atual</label><input id="stock-quantity" name="quantity" type="number" inputmode="decimal" step="any" min="0" value="' + (item && item.currentQty !== null && item.currentQty !== undefined ? escapeHtml(item.currentQty) : '') + '" placeholder="Não informado"></div></div><span class="help">Deixe o saldo vazio se ainda não souber a quantidade.</span></div><div class="modal-actions"><button type="button" class="button button-quiet" data-action="close-modal">Cancelar</button><button type="submit" class="button">' + (editing ? 'Salvar alterações' : 'Cadastrar item') + '</button></div></form>';
    openModal(editing ? 'Editar item' : 'Novo item de estoque', editing ? 'Atualize nome, categoria ou saldo.' : 'Cadastre um item que não aparece na lista.', body);
  }
  function stockAdjustForm(item) {
    var known = item.currentQty !== null && item.currentQty !== undefined;
    var body = '<form id="stock-adjust-form" data-form="stock-adjust" data-id="' + escapeHtml(item.id) + '"><div class="notice" style="margin-bottom:15px"><span class="notice-icon">▤</span><div><strong>' + escapeHtml(item.name) + '</strong><br>Saldo atual: ' + (known ? qtyText(item.currentQty) + ' ' + escapeHtml(item.unit || 'un') : 'não informado') + '</div></div><div class="form-grid"><div class="field"><label for="adjust-operation">O que aconteceu?</label><select name="operation" id="adjust-operation"><option value="in">Entrada no estoque</option><option value="out">Saída do estoque</option><option value="set">Definir saldo atual</option></select></div><div class="field"><label for="adjust-quantity">Quantidade</label><input name="quantity" id="adjust-quantity" type="number" inputmode="decimal" min="0.001" step="any" required placeholder="Digite a quantidade"></div><div class="field"><label for="adjust-note">Observação ou destino (opcional)</label><input name="note" id="adjust-note" placeholder="Ex.: material retirado para entrega"></div></div><p class="small muted">O ajuste ficará registrado no histórico e será incluído no Excel exportado.</p><div class="modal-actions"><button type="button" class="button button-quiet" data-action="close-modal">Cancelar</button><button type="submit" class="button">Registrar movimentação</button></div></form>';
    openModal('Ajustar estoque', 'Registre o movimento para manter o saldo atualizado.', body);
  }
  function priceForm(item) {
    var editing = !!item;
    var mode = item ? item.mode : 'unit';
    var unit = item && item.unit ? item.unit : 'un';
    var body = '<form id="price-form" data-form="price" data-id="' + escapeHtml(item ? item.id : '') + '"><div class="form-grid"><div class="field"><label for="price-name">Nome do produto</label><input id="price-name" name="name" required value="' + escapeHtml(item ? item.name : '') + '" placeholder="Ex.: CAIBRO"></div><div class="field"><label for="price-category">Categoria / tipo de madeira</label><input id="price-category" name="category" list="price-categories" required value="' + escapeHtml(item ? item.category : '') + '" placeholder="Ex.: Maçaranduba"><datalist id="price-categories">' + categoriesFor(db.prices).map(function (cat) { return '<option value="' + escapeHtml(cat) + '">'; }).join('') + '</datalist></div><div class="field"><label for="price-value">Preço anotado (R$)</label><input id="price-value" name="price" type="number" inputmode="decimal" min="0" step="0.01" required value="' + (item ? escapeHtml(item.price) : '') + '" placeholder="0,00"></div><div class="field"><label for="price-mode">Como o cliente paga?</label><select id="price-mode" name="mode"><option value="unknown" ' + (mode === 'unknown' ? 'selected' : '') + '>Unidade ainda não confirmada</option><option value="unit" ' + (mode === 'unit' ? 'selected' : '') + '>Por unidade / peça / kg / embalagem</option><option value="thousand" ' + (mode === 'thousand' ? 'selected' : '') + '>Por milheiro (a cada 1.000 unidades)</option><option value="meter" ' + (mode === 'meter' ? 'selected' : '') + '>Por metro linear</option><option value="base" ' + (mode === 'base' ? 'selected' : '') + '>Preço por uma quantidade de metros</option><option value="area" ' + (mode === 'area' ? 'selected' : '') + '>Por metro quadrado (m²)</option></select></div><div class="field" id="price-unit-wrap"><label for="price-unit">Unidade cobrada (se for por unidade)</label><input id="price-unit" name="unit" value="' + escapeHtml(unit) + '" placeholder="Ex.: un, kg, saco, chapa"><span class="help">Ex.: R$ 20 por kg: modo “Por unidade” e unidade “kg”.</span></div><div class="field" id="price-base-wrap"><label for="price-base">A base equivale a quantos metros?</label><input id="price-base" name="baseQty" type="number" inputmode="decimal" min="0.001" step="any" value="' + (item ? escapeHtml(item.baseQty || 1) : '1') + '"><span class="help">Exemplo: R$ 10,00 por 2 metros → base 2.</span></div><div class="field"><label for="price-note">Observação / medida anotada</label><textarea id="price-note" name="note" rows="3" placeholder="Ex.: 10 mm; confirmar se é preço por chapa">' + escapeHtml(item && item.note ? item.note : '') + '</textarea><span class="help">Registre medidas incertas aqui para não perder a informação original.</span></div></div><div class="modal-actions"><button type="button" class="button button-quiet" data-action="close-modal">Cancelar</button><button type="submit" class="button">' + (editing ? 'Salvar preço' : 'Cadastrar preço') + '</button></div>' + (editing ? '<div class="divider"></div><button type="button" class="button button-danger button-full" data-action="price-delete" data-id="' + escapeHtml(item.id) + '">Excluir este preço</button>' : '') + '</form>';
    openModal(editing ? 'Editar preço' : 'Novo preço', 'Confirme a forma de cobrança antes de usar o produto em uma nota.', body);
    updatePriceBaseField();
  }
  function updatePriceBaseField() {
    var mode = document.getElementById('price-mode');
    var wrap = document.getElementById('price-base-wrap');
    var unitWrap = document.getElementById('price-unit-wrap');
    if (!mode) return;
    if (wrap) wrap.style.display = mode.value === 'base' ? 'grid' : 'none';
    if (unitWrap) unitWrap.style.display = mode.value === 'unit' ? 'grid' : 'none';
  }
  function saveStockForm(form) {
    var id = form.getAttribute('data-id');
    var data = new FormData(form);
    var name = String(data.get('name') || '').trim();
    var category = String(data.get('category') || '').trim();
    var unit = String(data.get('unit') || 'un');
    var qRaw = String(data.get('quantity') || '').trim();
    var quantity = qRaw === '' ? null : asNum(qRaw);
    if (!name || !category) return showToast('Preencha o nome e a categoria.');
    if (quantity !== null && quantity < 0) return showToast('O saldo não pode ser negativo.');
    var item = id ? db.stocks.find(function (row) { return row.id === id; }) : null;
    var now = new Date().toISOString();
    if (!item) {
      item = { id: uid('stock'), category: category, name: name, unit: unit, initialQty: quantity, removedLegacy: null, currentQty: quantity, updatedAt: now };
      db.stocks.push(item);
      if (quantity !== null) db.movements.push({ id: uid('mov'), date: now, type: 'Cadastro inicial', stockItemId: item.id, itemName: name, quantity: quantity, before: null, after: quantity, note: 'Saldo informado no cadastro.' });
    } else {
      var before = item.currentQty;
      item.name = name; item.category = category; item.unit = unit; item.currentQty = quantity; item.updatedAt = now;
      if (before !== quantity) db.movements.push({ id: uid('mov'), date: now, type: 'Ajuste manual', stockItemId: item.id, itemName: name, quantity: quantity === null ? null : Math.abs(quantity - (Number(before) || 0)), before: before, after: quantity, note: 'Saldo editado diretamente no cadastro.' });
    }
    persist(); closeModal(); stockSearch = ''; navigate('estoque'); showToast('Estoque salvo.');
  }
  function saveStockAdjust(form) {
    var id = form.getAttribute('data-id');
    var item = db.stocks.find(function (row) { return row.id === id; });
    if (!item) return showToast('Não encontrei esse item.');
    var data = new FormData(form);
    var operation = String(data.get('operation'));
    var quantity = asNum(data.get('quantity'));
    var note = String(data.get('note') || '').trim();
    if (!(quantity > 0)) return showToast('Digite uma quantidade maior que zero.');
    var before = item.currentQty;
    var after;
    var type;
    if (operation === 'set') { after = quantity; type = 'Ajuste manual'; }
    else if (operation === 'in') { after = (before === null || before === undefined) ? quantity : Number(before) + quantity; type = 'Entrada'; }
    else {
      if (before === null || before === undefined) return showToast('Defina um saldo conhecido antes de registrar uma saída.');
      if (quantity > Number(before)) return showToast('A saída é maior que o saldo atual. Confira a quantidade.');
      after = Number(before) - quantity; type = 'Saída';
    }
    var now = new Date().toISOString();
    item.currentQty = Math.round(after * 1000) / 1000;
    item.updatedAt = now;
    db.movements.push({ id: uid('mov'), date: now, type: type, stockItemId: item.id, itemName: item.name, quantity: quantity, before: before, after: item.currentQty, note: note });
    persist(); closeModal(); navigate('estoque'); showToast('Movimentação registrada.');
  }
  function savePriceForm(form) {
    var id = form.getAttribute('data-id');
    var data = new FormData(form);
    var name = String(data.get('name') || '').trim();
    var category = String(data.get('category') || '').trim();
    var price = asNum(data.get('price'));
    var mode = String(data.get('mode') || 'unit');
    var baseQty = mode === 'base' ? asNum(data.get('baseQty')) : 1;
    var unit = String(data.get('unit') || 'un').trim() || 'un';
    if (mode === 'unit' && unit === '?') unit = 'un';
    var note = String(data.get('note') || '').trim();
    if (!name || !category) return showToast('Preencha o produto e a categoria.');
    if (price < 0) return showToast('O preço não pode ser negativo.');
    if (mode === 'base' && !(baseQty > 0)) return showToast('A base precisa ser maior que zero.');
    if (mode === 'unknown') unit = '?';
    else if (mode === 'thousand') { unit = 'unidades'; baseQty = 1000; }
    else if (mode === 'area') unit = 'm²';
    else if (mode === 'meter' || mode === 'base') unit = 'm';
    var item = id ? db.prices.find(function (row) { return row.id === id; }) : null;
    if (!item) { item = { id: uid('price'), name: name, category: category, price: price, mode: mode, baseQty: baseQty, unit: unit, note: note, updatedAt: new Date().toISOString() }; db.prices.push(item); }
    else { item.name = name; item.category = category; item.price = price; item.mode = mode; item.baseQty = baseQty; item.unit = unit; item.note = note; item.updatedAt = new Date().toISOString(); }
    if (db.draft.selectedPriceId === id && mode !== 'unknown') db.draft.billingMode = mode === 'thousand' ? 'thousand' : mode === 'area' ? 'area' : (mode === 'unit' ? 'unit' : 'length');
    persist(); closeModal(); priceSearch = ''; navigate('precos'); showToast(mode === 'unknown' ? 'Preço salvo. Confirme a unidade antes de usar em uma nota.' : 'Preço salvo para as próximas notas.');
  }
  function addPricedLine() {
    var quantityInput = document.getElementById('sale-quantity');
    var billingInput = document.getElementById('sale-billing');
    var lengthInput = document.getElementById('sale-length');
    var widthInput = document.getElementById('sale-width');
    var product = db.prices.find(function (item) { return item.id === db.draft.selectedPriceId; });
    if (!quantityInput || !product) return showToast('Escolha um produto primeiro.');
    if (product.mode === 'unknown') return showToast('Confirme a unidade de cobrança do produto em Preços antes de adicioná-lo.');
    var quantity = asNum(quantityInput.value);
    var billingMode = product.mode === 'thousand' ? 'thousand' : product.mode === 'area' ? 'area' : (billingInput ? billingInput.value : (product.mode === 'unit' ? 'unit' : 'length'));
    var lengthPerPiece = (billingMode === 'length' || billingMode === 'area') && lengthInput ? asNum(lengthInput.value) : null;
    var widthPerPiece = billingMode === 'area' && widthInput ? asNum(widthInput.value) : null;
    if (!(quantity > 0)) return showToast('Digite a quantidade.');
    if ((billingMode === 'length' || billingMode === 'area') && !(lengthPerPiece > 0)) return showToast('Digite o comprimento de cada peça.');
    if (billingMode === 'area' && !(widthPerPiece > 0)) return showToast('Digite a largura de cada peça.');
    var line = {
      id: uid('line'), priceId: product.id, name: product.name, category: product.category,
      quantity: quantity, unit: billingMode === 'thousand' ? 'unidades' : billingMode === 'length' ? 'peças' : billingMode === 'area' ? 'peças' : (product.unit || 'un'),
      price: Number(product.price), mode: product.mode, baseQty: Number(product.baseQty) || 1,
      billingMode: billingMode, lengthPerPiece: lengthPerPiece, widthPerPiece: widthPerPiece,
      totalLength: billingMode === 'length' ? Math.round(quantity * lengthPerPiece * 1000) / 1000 : null,
      totalArea: billingMode === 'area' ? Math.round(quantity * lengthPerPiece * widthPerPiece * 10000) / 10000 : null,
      total: computeLineTotal(product, quantity, lengthPerPiece, billingMode, widthPerPiece)
    };
    db.draft.lines.push(line);
    db.draft.selectedPriceId = product.id;
    db.draft.billingMode = billingMode;
    persist(); renderPage(); showToast('Item adicionado. Pode informar o próximo.');
  }
  function addCustomLine(form) {
    var data = new FormData(form);
    var name = String(data.get('name') || '').trim();
    var unit = String(data.get('unit') || 'un');
    var quantity = asNum(data.get('quantity'));
    var price = asNum(data.get('price'));
    var mode = String(data.get('mode') || 'unit');
    var baseQty = mode === 'base' ? asNum(data.get('baseQty')) : 1;
    var billingMode = mode === 'unit' ? 'unit' : mode === 'area' ? 'area' : 'length';
    var lengthPerPiece = billingMode !== 'unit' ? asNum(data.get('lengthPerPiece')) : null;
    var widthPerPiece = billingMode === 'area' ? asNum(data.get('widthPerPiece')) : null;
    if (!name || !(quantity > 0)) return showToast('Preencha a descrição e uma quantidade válida.');
    if (price < 0 || (mode === 'base' && !(baseQty > 0)) || (billingMode !== 'unit' && !(lengthPerPiece > 0)) || (billingMode === 'area' && !(widthPerPiece > 0))) return showToast('Confira o preço e as medidas.');
    var priceItem = { price: price, mode: mode, baseQty: baseQty };
    db.draft.lines.push({ id: uid('line'), priceId: null, name: name, category: 'Item avulso', quantity: quantity, unit: billingMode === 'length' || billingMode === 'area' ? 'peças' : unit, price: price, mode: mode, baseQty: baseQty, billingMode: billingMode, lengthPerPiece: lengthPerPiece, widthPerPiece: widthPerPiece, totalLength: billingMode === 'length' ? quantity * lengthPerPiece : null, totalArea: billingMode === 'area' ? quantity * lengthPerPiece * widthPerPiece : null, total: computeLineTotal(priceItem, quantity, lengthPerPiece, billingMode, widthPerPiece) });
    db.draft.showCustom = false;
    persist(); renderPage(); showToast('Item avulso adicionado.');
  }
  function captureCustomerFields() {
    document.querySelectorAll('[data-customer]').forEach(function (input) { db.draft.customer[input.getAttribute('data-customer')] = input.value; });
  }
  function completeNote() {
    captureCustomerFields();
    if (!db.draft.lines.length) return showToast('Adicione pelo menos um item antes de salvar.');
    var receipt = {
      id: uid('note'),
      number: String(db.counter).padStart(5, '0'),
      date: new Date().toISOString(),
      customer: clone(db.draft.customer),
      lines: clone(db.draft.lines),
      total: Math.round(draftTotal() * 100) / 100
    };
    db.counter += 1;
    db.receipts.push(receipt);
    db.draft = { customer: { name: '', cpf: '', address: '', phone: '' }, lines: [], selectedPriceId: '', showCustom: false, showCustomerDetails: false, billingMode: 'unit' };
    persist();
    openPrintReceipt(receipt);
    navigate('arquivos');
    showToast('Nota ' + receipt.number + ' salva. Escolha “Salvar como PDF” na tela de impressão.');
  }

  function receiptHtml(receipt) {
    var business = db.business || {};
    var customer = receipt.customer || {};
    var rows = (receipt.lines || []).map(function (line) {
      var quantityLabel = line.billingMode === 'thousand'
        ? qtyText(line.quantity) + ' unidades'
        : line.billingMode === 'area' && Number(line.lengthPerPiece) > 0 && Number(line.widthPerPiece) > 0
        ? qtyText(line.quantity) + ' peça(s)'
        : line.billingMode === 'length' && Number(line.lengthPerPiece) > 0
          ? qtyText(line.quantity) + ' peça(s) × ' + qtyText(line.lengthPerPiece) + ' m'
          : qtyText(line.quantity) + ' ' + (line.unit || 'un');
      var detailLabel = line.billingMode === 'area' && Number(line.lengthPerPiece) > 0 && Number(line.widthPerPiece) > 0
        ? 'Medida: ' + qtyText(line.lengthPerPiece) + ' m × ' + qtyText(line.widthPerPiece) + ' m; área total: ' + qtyText(line.totalArea || (Number(line.quantity) * Number(line.lengthPerPiece) * Number(line.widthPerPiece))) + ' m² · ' + chargedPriceDescription(line)
        : line.billingMode === 'length' && Number(line.lengthPerPiece) > 0
          ? 'Total: ' + qtyText(line.totalLength || (Number(line.quantity) * Number(line.lengthPerPiece))) + ' m · ' + chargedPriceDescription(line)
          : priceDescription(line);
      return '<tr><td class="qty">' + escapeHtml(quantityLabel) + '</td><td><strong>' + escapeHtml(line.name) + '</strong><small>' + escapeHtml(detailLabel) + '</small></td><td class="money">' + money(line.total) + '</td></tr>';
    }).join('');
    var details = [];
    if (customer.name) details.push('<span><b>Nome:</b> ' + escapeHtml(customer.name) + '</span>');
    if (customer.cpf) details.push('<span><b>CPF:</b> ' + escapeHtml(customer.cpf) + '</span>');
    if (customer.address) details.push('<span><b>Endereço:</b> ' + escapeHtml(customer.address) + '</span>');
    if (customer.phone) details.push('<span><b>Telefone:</b> ' + escapeHtml(customer.phone) + '</span>');
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Nota ' + escapeHtml(receipt.number) + '</title><style>' +
      'body{font:14px Arial,sans-serif;color:#222;margin:0;background:#fff}main{max-width:760px;margin:0 auto;padding:28px}header{text-align:center;border-bottom:2px solid #1d5b4d;padding-bottom:16px;margin-bottom:17px}h1{font-size:24px;margin:0 0 4px;color:#1d5b4d}header p{margin:3px 0;color:#555;font-size:12px}.note-meta{display:flex;justify-content:space-between;gap:10px;margin:12px 0 18px;font-size:12px}.customer{display:grid;gap:7px;padding:12px;border:1px solid #ccc;border-radius:8px;margin-bottom:16px}.customer span{overflow-wrap:anywhere}.tag{font-size:10px;letter-spacing:.08em;color:#666}table{border-collapse:collapse;width:100%;margin-top:8px}th,td{padding:10px 7px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}th{background:#f2f5f0;font-size:12px}td strong{display:block}td small{display:block;margin-top:4px;color:#666;font-size:11px}.qty{white-space:nowrap;width:22%}.money{text-align:right;white-space:nowrap;width:25%}.total{display:flex;justify-content:space-between;gap:12px;padding:16px 4px;margin-top:8px;border-top:2px solid #1d5b4d;font-size:16px;font-weight:bold}.total strong{font-size:23px}.disclaimer{margin-top:18px;text-align:center;color:#777;font-size:10px}.signature{margin-top:54px;border-top:1px solid #999;padding-top:8px;width:70%;text-align:center;margin-left:auto;margin-right:auto;font-size:11px}@media print{main{padding:8mm;max-width:none}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none}}@media(max-width:500px){main{padding:16px}.note-meta{display:block}.note-meta span{display:block;margin-top:4px}h1{font-size:21px}th,td{padding:8px 5px;font-size:12px}}' +
      '</style></head><body><main><header><h1>' + escapeHtml(business.name || 'Serraria São Francisco') + '</h1>' + (business.address ? '<p>' + escapeHtml(business.address) + '</p>' : '') + (business.phone ? '<p>Telefone: ' + escapeHtml(business.phone) + '</p>' : '') + '<p>Resumo da compra</p></header><div class="note-meta"><span><b>Nota:</b> ' + escapeHtml(receipt.number) + '</span><span><b>Data:</b> ' + escapeHtml(dateText(receipt.date, true)) + '</span></div>' + (details.length ? '<section class="customer">' + details.join('') + '</section>' : '') + '<div class="tag">ITENS DA COMPRA</div><table><thead><tr><th>Quantidade</th><th>Descrição</th><th class="money">Valor</th></tr></thead><tbody>' + rows + '</tbody></table><div class="total"><span>TOTAL</span><strong>' + money(receipt.total) + '</strong></div><p class="disclaimer">Resumo para conferência e transcrição na notinha física. Não é documento fiscal.</p><div class="signature">Assinatura (opcional)</div></main><script>window.addEventListener("load",function(){setTimeout(function(){window.print();},350);});</script></body></html>';
  }
  function openPrintReceipt(receipt) {
    var win = window.open('', '_blank');
    if (!win) { showToast('A nota foi salva. Abra-a no histórico para imprimir ou salvar em PDF.'); return; }
    win.document.open();
    win.document.write(receiptHtml(receipt));
    win.document.close();
  }
  function printReceipt(id) {
    var receipt = db.receipts.find(function (row) { return row.id === id; });
    if (!receipt) return showToast('Não encontrei essa nota.');
    openPrintReceipt(receipt);
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }
  function backupJson() {
    db.lastBackup = new Date().toISOString();
    persist();
    var blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, 'backup-serraria-' + new Date().toISOString().slice(0,10) + '.json');
    renderPage(); showToast('Cópia de segurança criada. Guarde esse arquivo.');
  }
  function restoreJsonFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var restored = JSON.parse(String(reader.result || ''));
        if (!restored || !Array.isArray(restored.stocks) || !Array.isArray(restored.prices) || !Array.isArray(restored.receipts)) throw new Error('Formato incompatível');
        if (!window.confirm('Restaurar esta cópia vai substituir os dados atuais neste aparelho. Deseja continuar?')) return;
        restored.version = 1;
        if (!restored.business) restored.business = { name: 'Serraria São Francisco', address: '', phone: '' };
        if (!Array.isArray(restored.movements)) restored.movements = [];
        if (!restored.draft) restored.draft = { customer: { name: '', cpf: '', address: '', phone: '' }, lines: [], selectedPriceId: '', showCustom: false };
        if (!restored.draft.customer) restored.draft.customer = { name: '', cpf: '', address: '', phone: '' };
        if (!Array.isArray(restored.draft.lines)) restored.draft.lines = [];
        restored.prices.forEach(function (item) { if (item.note === undefined) item.note = ''; if (!item.unit) item.unit = item.mode === 'meter' || item.mode === 'base' ? 'm' : item.mode === 'thousand' ? 'unidades' : 'un'; });
        if (!restored.schemaVersion || restored.schemaVersion < 3) {
          var migratedSeedDb = createSeedDb();
          migratedSeedDb.prices.forEach(function (seed) {
            var existing = restored.prices.find(function (item) { return item.id === seed.id; });
            if (!existing) restored.prices.push(seed);
          });
          var edits = {
            'p_gua_01': { name:'Linha Guajará — 1 m', category:'Madeira Guajará', mode:'meter', baseQty:1, unit:'m' },
            'p_gua_02': { name:'Caibro Guajará — 1 m', category:'Madeira Guajará', mode:'meter', baseQty:1, unit:'m' },
            'p_gua_03': { name:'Ripa Guajará — 1 m', category:'Madeira Guajará', mode:'meter', baseQty:1, unit:'m' },
            'p_mas_01': { name:'Linha Maçaranduba — 1 m', category:'Madeira Maçaranduba', mode:'meter', baseQty:1, unit:'m' },
            'p_mas_02': { name:'Caibro Maçaranduba — 1 m', category:'Madeira Maçaranduba', mode:'meter', baseQty:1, unit:'m' },
            'p_mas_03': { name:'Ripa Maçaranduba — 1 m', category:'Madeira Maçaranduba', mode:'meter', baseQty:1, unit:'m' },
            'p_mas_04': { name:'Forro Maçaranduba — 60/70/80 (registro anterior)', category:'Forro de madeira', mode:'unknown', unit:'?', note:'Registro anterior: R$ 160,00 para 60/70/80. Pode ser diferente do forro sem medida especificada anotado por R$ 180,00; confirmar.' },
            'p_mas_05': { name:'Alisado Guajará — 1 m', category:'Madeira Guajará', mode:'meter', baseQty:1, unit:'m', note:'O preço de R$ 8,00 foi associado a Guajará na tabela complementar.' },
            'p_mas_06': { name:'Muiracatiara — peça não identificada', category:'Muiracatiara', mode:'unknown', unit:'?', note:'A anotação informa R$ 15,00, mas não permite identificar a peça nem a unidade.' },
            'p_gua_04': { name:'Forro de Guajará (60/70/80; padrão 13?)', category:'Forro de madeira', mode:'unknown', unit:'?', note:'A anotação menciona 60, 70 e 80 e “padrão 13 (?)”. Unidade de cobrança não confirmada.' },
            'p_bar_01': { name:'Barrote de pinus 6 × 6 cm (3 m)', category:'Barrote de pinus', mode:'unit', unit:'un', note:'Dimensão e comprimento conforme a tabela complementar.' },
            'p_bar_02': { name:'Barrote de pinus 6 × 6 cm (3 m) plainado', category:'Barrote de pinus', mode:'unit', unit:'un', note:'Dimensão e comprimento conforme a tabela complementar.' },
            'p_mui_01': { name:'Tábua de Muiracatiara — registro anterior (1 m linear, 3,5)', category:'Tábuas especiais — registro anterior', mode:'unknown', unit:'?', note:'O registro anterior menciona “1 m linear, 3,5”, mas a tabela complementar informa m². Confirmar se é o mesmo produto antes de usar.' },
            'p_mui_02': { name:'TANI BUQUÊ (nome a confirmar)', category:'Preço antigo — identificar', mode:'unknown', unit:'?', note:'Registro antigo de nome incerto. Não confundir com a tábua para andaime sem confirmar.' },
            'p_mad_01': { name:'Madeirite preto — 10 mm', category:'Madeirite preto', mode:'unknown', unit:'?', note:'Espessura identificada; confirmar se o preço é por chapa ou outra unidade.' },
            'p_mad_02': { name:'Madeirite preto — 12 mm', category:'Madeirite preto', mode:'unknown', unit:'?', note:'Espessura identificada; confirmar se o preço é por chapa ou outra unidade.' }
          };
          Object.keys(edits).forEach(function (id) { var row = restored.prices.find(function (item) { return item.id === id; }); if (row) Object.keys(edits[id]).forEach(function (key) { row[key] = edits[id][key]; }); });
        }
        if (!restored.schemaVersion || restored.schemaVersion < 4) {
          var restoredMilheiro = {
            'p_mat_telha': 'Preço confirmado por milheiro (1.000 unidades). Informe a quantidade em unidades, inclusive quantidades menores como 800.',
            'p_mat_tijolo': 'Preço confirmado por milheiro (1.000 unidades). O tipo de tijolo ainda precisa ser identificado.'
          };
          ['p_mat_telha', 'p_mat_tijolo'].forEach(function (id) {
            var material = restored.prices.find(function (item) { return item.id === id; });
            if (material) {
              material.mode = 'thousand'; material.baseQty = 1000; material.unit = 'unidades'; material.note = restoredMilheiro[id];
            }
          });
        }
        if (typeof restored.draft.showCustomerDetails !== 'boolean') restored.draft.showCustomerDetails = false;
        if (!restored.draft.billingMode) {
          var draftProduct = restored.prices.find(function (item) { return item.id === restored.draft.selectedPriceId; });
          restored.draft.billingMode = !draftProduct ? 'unit' : draftProduct.mode === 'thousand' ? 'thousand' : draftProduct.mode === 'area' ? 'area' : (draftProduct.mode === 'unit' || draftProduct.mode === 'unknown') ? 'unit' : 'length';
        }
        restored.schemaVersion = 4;
        db = restored; persist(); navigate('inicio'); showToast('Cópia restaurada com sucesso.');
      } catch (error) { showToast('Esse arquivo não parece ser uma cópia válida do Assistente da Serraria.'); }
    };
    reader.readAsText(file);
  }

  function colLetter(number) {
    var result = '';
    while (number > 0) { var remainder = (number - 1) % 26; result = String.fromCharCode(65 + remainder) + result; number = Math.floor((number - 1) / 26); }
    return result;
  }
  function xmlEscape(text) { return String(text == null ? '' : text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }
  function sheetXml(sheet) {
    var rows = sheet.rows || [];
    var maxCols = rows.reduce(function (max, row) { return Math.max(max, row.length); }, 1);
    var widths = [];
    for (var col = 0; col < maxCols; col++) {
      var width = 12;
      rows.slice(0, 100).forEach(function (row) { var v = row[col]; if (v !== null && v !== undefined) width = Math.max(width, Math.min(38, String(v).length + 2)); });
      widths.push(Math.min(38, width));
    }
    var colXml = '<cols>' + widths.map(function (width, index) { return '<col min="' + (index+1) + '" max="' + (index+1) + '" width="' + width + '" customWidth="1"/>'; }).join('') + '</cols>';
    var rowXml = rows.map(function (row, rowIndex) {
      var rowNumber = rowIndex + 1;
      var cells = row.map(function (value, colIndex) {
        if (value === null || value === undefined || value === '') return '';
        var reference = colLetter(colIndex + 1) + rowNumber;
        var style = rowIndex === 0 ? 1 : (sheet.currencyCols && sheet.currencyCols.indexOf(colIndex) !== -1 ? 2 : (typeof value === 'number' ? 3 : 4));
        if (typeof value === 'number' && isFinite(value)) return '<c r="' + reference + '" s="' + style + '"><v>' + value + '</v></c>';
        return '<c r="' + reference + '" s="' + style + '" t="inlineStr"><is><t xml:space="preserve">' + xmlEscape(value) + '</t></is></c>';
      }).join('');
      return '<row r="' + rowNumber + '"' + (rowIndex === 0 ? ' ht="30" customHeight="1"' : '') + '>' + cells + '</row>';
    }).join('');
    var lastCell = colLetter(maxCols) + Math.max(rows.length,1);
    var filter = rows.length > 1 ? '<autoFilter ref="A1:' + lastCell + '"/>' : '';
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="21"/>' + colXml + '<sheetData>' + rowXml + '</sheetData>' + filter + '</worksheet>';
  }
  function makeCrcTable() {
    var table = [];
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    return table;
  }
  var crcTable = makeCrcTable();
  function crc32(bytes) {
    var crc = 0 ^ (-1);
    for (var i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xFF];
    return (crc ^ (-1)) >>> 0;
  }
  function u16(view, offset, value) { view.setUint16(offset, value, true); }
  function u32(view, offset, value) { view.setUint32(offset, value >>> 0, true); }
  function zipFiles(files) {
    var encoder = new TextEncoder();
    var localParts = [];
    var centralParts = [];
    var offset = 0;
    var now = new Date();
    var dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
    var dosDate = (((now.getFullYear() - 1980) & 127) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    files.forEach(function (file) {
      var nameBytes = encoder.encode(file.name);
      var dataBytes = encoder.encode(file.content);
      var crc = crc32(dataBytes);
      var localBuffer = new ArrayBuffer(30);
      var localView = new DataView(localBuffer);
      u32(localView,0,0x04034b50); u16(localView,4,20); u16(localView,6,0x0800); u16(localView,8,0); u16(localView,10,dosTime); u16(localView,12,dosDate); u32(localView,14,crc); u32(localView,18,dataBytes.length); u32(localView,22,dataBytes.length); u16(localView,26,nameBytes.length); u16(localView,28,0);
      localParts.push(new Uint8Array(localBuffer), nameBytes, dataBytes);
      var centralBuffer = new ArrayBuffer(46);
      var centralView = new DataView(centralBuffer);
      u32(centralView,0,0x02014b50); u16(centralView,4,20); u16(centralView,6,20); u16(centralView,8,0x0800); u16(centralView,10,0); u16(centralView,12,dosTime); u16(centralView,14,dosDate); u32(centralView,16,crc); u32(centralView,20,dataBytes.length); u32(centralView,24,dataBytes.length); u16(centralView,28,nameBytes.length); u16(centralView,30,0); u16(centralView,32,0); u16(centralView,34,0); u16(centralView,36,0); u32(centralView,38,0); u32(centralView,42,offset);
      centralParts.push(new Uint8Array(centralBuffer), nameBytes);
      offset += 30 + nameBytes.length + dataBytes.length;
    });
    var centralSize = centralParts.reduce(function (sum, part) { return sum + part.length; }, 0);
    var eocdBuffer = new ArrayBuffer(22);
    var eocdView = new DataView(eocdBuffer);
    u32(eocdView,0,0x06054b50); u16(eocdView,4,0); u16(eocdView,6,0); u16(eocdView,8,files.length); u16(eocdView,10,files.length); u32(eocdView,12,centralSize); u32(eocdView,16,offset); u16(eocdView,20,0);
    return new Blob(localParts.concat(centralParts, [new Uint8Array(eocdBuffer)]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function workbookBlob() {
    var stockRows = [['Categoria','Item','Unidade','Estoque atual','Estoque inicial anotado','Saídas antigas anotadas na planilha','Última atualização']];
    db.stocks.forEach(function (item) { stockRows.push([item.category, item.name, item.unit || 'un', item.currentQty === undefined ? null : item.currentQty, item.initialQty === undefined ? null : item.initialQty, item.removedLegacy === undefined ? null : item.removedLegacy, item.updatedAt ? dateText(item.updatedAt, true) : '']); });
    var priceRows = [['Categoria','Item','Preço (R$)','Forma de cobrança','Base de quantidade','Unidade da quantidade','Observação / medida','Última atualização']];
    db.prices.forEach(function (item) { priceRows.push([item.category, item.name, Number(item.price) || 0, item.mode === 'unknown' ? 'Unidade a confirmar' : item.mode === 'thousand' ? 'Por milheiro (1.000 unidades)' : item.mode === 'area' ? 'Metro quadrado' : item.mode === 'meter' ? 'Metro linear' : item.mode === 'base' ? 'Preço por base de metros' : 'Por unidade (' + (item.unit || 'un') + ')', Number(item.baseQty) || 1, item.unit || 'un', item.note || '', item.updatedAt ? dateText(item.updatedAt, true) : '']); });
    var movementRows = [['Data e hora','Tipo','Item','Quantidade movimentada','Saldo antes','Saldo depois','Observação / destino']];
    db.movements.slice().sort(function (a,b) { return new Date(a.date)-new Date(b.date); }).forEach(function (item) { movementRows.push([dateText(item.date, true), item.type, item.itemName, item.quantity === undefined ? null : item.quantity, item.before === undefined ? null : item.before, item.after === undefined ? null : item.after, item.note || '']); });
    var receiptRows = [['Número','Data e hora','Cliente','CPF','Endereço','Telefone','Quantidade de linhas','Total (R$)']];
    var lineRows = [['Nota','Data e hora','Cliente','Item','Categoria','Quantidade de peças/unidades','Unidade','Comprimento por peça (m)','Largura por peça (m)','Comprimento total (m)','Área total (m²)','Cobrança aplicada','Preço cadastrado (R$)','Modo/base do preço','Base de metros','Total da linha (R$)']];
    db.receipts.slice().sort(function (a,b) { return new Date(a.date)-new Date(b.date); }).forEach(function (receipt) {
      var c = receipt.customer || {};
      receiptRows.push([receipt.number, dateText(receipt.date, true), c.name || '', c.cpf || '', c.address || '', c.phone || '', receipt.lines.length, Number(receipt.total) || 0]);
      receipt.lines.forEach(function (line) { lineRows.push([receipt.number, dateText(receipt.date, true), c.name || '', line.name, line.category || '', Number(line.quantity) || 0, line.unit || 'un', line.lengthPerPiece == null ? null : Number(line.lengthPerPiece), line.widthPerPiece == null ? null : Number(line.widthPerPiece), line.totalLength == null ? null : Number(line.totalLength), line.totalArea == null ? null : Number(line.totalArea), line.billingMode === 'thousand' ? 'Por milheiro (1.000 unidades)' : line.billingMode === 'area' ? 'Por área (m²)' : line.billingMode === 'length' ? 'Por comprimento' : 'Por peça/unidade', Number(line.price) || 0, line.mode === 'thousand' ? 'Preço por milheiro' : line.mode === 'area' ? 'Preço por m²' : line.mode === 'meter' ? 'Preço por metro' : line.mode === 'base' ? 'Preço por base' : 'Preço por unidade', Number(line.baseQty) || 1, Number(line.total) || 0]); });
    });
    var sheets = [
      { name: 'Estoque', rows: stockRows },
      { name: 'Preços', rows: priceRows, currencyCols: [2] },
      { name: 'Movimentações', rows: movementRows },
      { name: 'Notas', rows: receiptRows, currencyCols: [7] },
      { name: 'Itens das notas', rows: lineRows, currencyCols: [12,15] }
    ];
    var files = [];
    files.push({ name: '[Content_Types].xml', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + sheets.map(function (s,i) { return '<Override PartName="/xl/worksheets/sheet' + (i+1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>' });
    files.push({ name: '_rels/.rels', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' });
    files.push({ name: 'xl/workbook.xml', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>' + sheets.map(function (s,i) { return '<sheet name="' + xmlEscape(s.name) + '" sheetId="' + (i+1) + '" r:id="rId' + (i+1) + '"/>'; }).join('') + '</sheets></workbook>' });
    files.push({ name: 'xl/_rels/workbook.xml.rels', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map(function (s,i) { return '<Relationship Id="rId' + (i+1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i+1) + '.xml"/>'; }).join('') + '<Relationship Id="rId' + (sheets.length+1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' });
    files.push({ name: 'xl/styles.xml', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="&quot;R$&quot; #,##0.00"/><numFmt numFmtId="165" formatCode="#,##0.###"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1D5B4D"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFE2E8E0"/></left><right style="thin"><color rgb="FFE2E8E0"/></right><top style="thin"><color rgb="FFE2E8E0"/></top><bottom style="thin"><color rgb="FFE2E8E0"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" horizontal="center" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' });
    sheets.forEach(function (sheet,i) { files.push({ name: 'xl/worksheets/sheet' + (i+1) + '.xml', content: sheetXml(sheet) }); });
    return zipFiles(files);
  }
  function generateExcel(share) {
    var blob;
    try { blob = workbookBlob(); }
    catch (error) { showToast('Não consegui montar o Excel. Faça uma cópia JSON e tente novamente.'); return; }
    var filename = 'serraria-sao-francisco-' + new Date().toISOString().slice(0,10) + '.xlsx';
    if (share && navigator.share && typeof File !== 'undefined') {
      var file = new File([blob], filename, { type: blob.type });
      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Planilha atualizada da serraria', text: 'Estoque, preços, movimentações e notas.' }).then(function () { showToast('Planilha preparada para compartilhar.'); }).catch(function (error) { if (error && error.name !== 'AbortError') { downloadBlob(blob, filename); showToast('O Excel foi baixado para o aparelho.'); } });
        return;
      }
    }
    downloadBlob(blob, filename);
    showToast('Excel gerado. Procure o arquivo na pasta Downloads para enviar.');
  }

  document.addEventListener('click', function (event) {
    var nav = event.target.closest('[data-page]');
    if (nav) { event.preventDefault(); navigate(nav.getAttribute('data-page')); return; }
    var button = event.target.closest('[data-action]');
    if (!button) return;
    var action = button.getAttribute('data-action');
    var id = button.getAttribute('data-id');
    if (action === 'go-sale') navigate('venda');
    else if (action === 'show-all-sale-products') { saleShowAll = !saleShowAll; updateSaleProductResults(); }
    else if (action === 'change-sale-product') { db.draft.selectedPriceId = ''; saleSearch = ''; saleShowAll = false; persist(true); renderPage(); var saleSearchInput = document.getElementById('sale-search'); if (saleSearchInput) saleSearchInput.focus(); }
    else if (action === 'add-line') addPricedLine();
    else if (action === 'toggle-custom') { captureCustomerFields(); db.draft.showCustom = !db.draft.showCustom; persist(); renderPage(); }
    else if (action === 'remove-line') { captureCustomerFields(); db.draft.lines.splice(Number(button.getAttribute('data-index')),1); persist(); renderPage(); showToast('Item removido da nota.'); }
    else if (action === 'complete-note') completeNote();
    else if (action === 'close-modal') closeModal();
    else if (action === 'backdrop-close' && event.target === button) closeModal();
    else if (action === 'stock-add') stockForm(null);
    else if (action === 'stock-edit') { var stock = db.stocks.find(function (row) { return row.id === id; }); if (stock) stockForm(stock); }
    else if (action === 'stock-adjust') { var stockItem = db.stocks.find(function (row) { return row.id === id; }); if (stockItem) stockAdjustForm(stockItem); }
    else if (action === 'price-add') priceForm(null);
    else if (action === 'price-edit') { var price = db.prices.find(function (row) { return row.id === id; }); if (price) priceForm(price); }
    else if (action === 'price-delete') { var deletePrice = db.prices.find(function (row) { return row.id === id; }); if (deletePrice && window.confirm('Excluir o preço de “' + deletePrice.name + '”? As notas antigas continuarão salvas.')) { db.prices = db.prices.filter(function (row) { return row.id !== id; }); persist(); closeModal(); navigate('precos'); showToast('Preço excluído.'); } }
    else if (action === 'print-note') printReceipt(id);
    else if (action === 'share-xlsx') generateExcel(true);
    else if (action === 'export-xlsx') generateExcel(false);
    else if (action === 'backup-json') backupJson();
    else if (action === 'restore-json') { var restore = document.getElementById('restore-input'); if (restore) { restore.value = ''; restore.click(); } }
    else if (action === 'price-delete') return;
    else if (action === 'clear-draft') { if (window.confirm('Apagar os itens desta nota em andamento?')) { db.draft.lines = []; persist(); renderPage(); } }
  });

  document.addEventListener('submit', function (event) {
    var form = event.target;
    var type = form.getAttribute('data-form');
    if (!type) return;
    event.preventDefault();
    if (type === 'stock') saveStockForm(form);
    else if (type === 'stock-adjust') saveStockAdjust(form);
    else if (type === 'price') savePriceForm(form);
    else if (type === 'custom-line') addCustomLine(form);
    else if (type === 'business') {
      var data = new FormData(form);
      db.business.name = String(data.get('name') || '').trim() || 'Serraria São Francisco';
      db.business.address = String(data.get('address') || '').trim();
      db.business.phone = String(data.get('phone') || '').trim();
      persist(); renderPage(); showToast('Identificação da loja atualizada.');
    }
  });

  document.addEventListener('input', function (event) {
    var target = event.target;
    if (target.hasAttribute('data-customer')) {
      db.draft.customer[target.getAttribute('data-customer')] = target.value;
      persist(true);
    }
    if (target.id === 'sale-search') {
      saleSearch = target.value;
      saleShowAll = false;
      updateSaleProductResults();
    }
    if (target.id === 'stock-search') {
      stockSearch = target.value;
      var list = document.getElementById('stock-list');
      if (list) { var items = filteredStock(); list.innerHTML = items.length ? items.map(stockItemCard).join('') : '<div class="empty"><strong>Nenhum item encontrado.</strong>Tente mudar a busca ou o filtro.</div>'; }
    }
    if (target.id === 'price-search') {
      priceSearch = target.value;
      var priceList = document.getElementById('price-list');
      if (priceList) { var itemsPrice = filteredPrices(); priceList.innerHTML = itemsPrice.length ? itemsPrice.map(priceItemCard).join('') : '<div class="empty"><strong>Nenhum preço encontrado.</strong>Tente mudar a busca ou cadastre um item.</div>'; }
    }
    if (target.id === 'sale-quantity' || target.id === 'sale-length' || target.id === 'sale-width' || target.id === 'sale-billing') updateSalePreview();
  });
  document.addEventListener('change', function (event) {
    var target = event.target;
    if (target.id === 'sale-quantity' || target.id === 'sale-length' || target.id === 'sale-width' || target.id === 'sale-billing') updateSalePreview();
    if (target.id === 'price-mode') updatePriceBaseField();
    if (target.id === 'custom-mode') {
      var base = document.getElementById('custom-base-wrap');
      var length = document.getElementById('custom-length-wrap');
      if (base) base.style.display = target.value === 'base' ? 'grid' : 'none';
      if (length) length.style.display = target.value === 'unit' ? 'none' : 'grid';
      var width = document.getElementById('custom-width-wrap');
      if (width) width.style.display = target.value === 'area' ? 'grid' : 'none';
    }
    if (target.id === 'restore-input' && target.files && target.files[0]) restoreJsonFile(target.files[0]);
  });
  document.addEventListener('toggle', function (event) {
    if (event.target && event.target.id === 'customer-details') {
      db.draft.showCustomerDetails = event.target.open;
      persist(true);
    }
  }, true);

  function updateSaleProductResults() {
    var results = document.getElementById('sale-product-results');
    if (results) results.innerHTML = saleProductResultsHtml();
    var toggle = document.querySelector('[data-action="show-all-sale-products"]');
    if (toggle) toggle.textContent = saleShowAll ? 'Mostrar menos produtos' : 'Ver lista completa de produtos';
  }
  function updateSalePreview() {
    var quantityInput = document.getElementById('sale-quantity');
    var lengthInput = document.getElementById('sale-length');
    var widthInput = document.getElementById('sale-width');
    var billingInput = document.getElementById('sale-billing');
    var preview = document.getElementById('sale-preview');
    var help = document.getElementById('sale-product-help');
    var lengthWrap = document.getElementById('sale-length-wrap');
    var widthWrap = document.getElementById('sale-width-wrap');
    var mathDetail = document.getElementById('sale-math-detail');
    if (!quantityInput || !preview) return;
    var item = db.prices.find(function (row) { return row.id === db.draft.selectedPriceId; });
    if (!item || item.mode === 'unknown') return;
    var billingMode = item.mode === 'thousand' ? 'thousand' : item.mode === 'area' ? 'area' : item.mode === 'unknown' ? 'unit' : item.mode !== 'unit' ? 'length' : (billingInput ? billingInput.value : (db.draft.billingMode || 'unit'));
    var quantity = asNum(quantityInput.value);
    var length = lengthInput ? asNum(lengthInput.value) : 1;
    var width = widthInput ? asNum(widthInput.value) : 1;
    if (lengthWrap) lengthWrap.style.display = billingMode === 'length' || billingMode === 'area' ? 'grid' : 'none';
    if (widthWrap) widthWrap.style.display = billingMode === 'area' ? 'grid' : 'none';
    var total = computeLineTotal(item, quantity, length, billingMode, width);
    preview.textContent = money(total);
    if (billingMode === 'thousand') {
      if (mathDetail) mathDetail.textContent = (quantity > 0 ? qtyText(quantity) : '0') + ' unidades ÷ 1.000 × ' + money(item.price) + ' por milheiro = ' + money(total) + '.';
      if (help) help.textContent = 'Digite a quantidade de telhas/tijolos em unidades. A cada 1.000 unidades, o preço é ' + money(item.price) + '.';
    } else if (billingMode === 'area') {
      var totalArea = quantity * length * width;
      if (mathDetail) mathDetail.textContent = (quantity > 0 ? qtyText(quantity) : '0') + ' peça(s) × ' + (length > 0 ? qtyText(length) : '0') + ' m × ' + (width > 0 ? qtyText(width) : '0') + ' m = ' + qtyText(totalArea) + ' m². Preço: ' + money(item.price) + '/m².';
      if (help) help.textContent = 'O cálculo usa quantidade × comprimento × largura × preço por m².';
    } else if (billingMode === 'length') {
      var totalLength = quantity * length;
      if (mathDetail) mathDetail.textContent = (quantity > 0 ? qtyText(quantity) : '0') + ' peça(s) × ' + (length > 0 ? qtyText(length) : '0') + ' m = ' + qtyText(totalLength) + ' m no total.';
      if (help && item.mode === 'unit') help.textContent = 'Atenção: o preço cadastrado está por ' + (item.unit || 'unidade') + '. Ao calcular por comprimento, será interpretado como preço por 1 metro. Confirme antes de usar.';
      else if (help) help.textContent = priceDescription(item) + '. O cálculo usa a quantidade de peças × o comprimento de cada peça.';
    } else {
      if (mathDetail) mathDetail.textContent = (quantity > 0 ? qtyText(quantity) : '0') + ' × ' + money(item.price) + ' por ' + (item.unit && item.unit !== 'un' ? item.unit : 'unidade') + ' = ' + money(total) + '.';
      if (help) help.textContent = priceDescription(item) + '. O valor será cobrado por unidade informada.';
    }
  }
  document.addEventListener('click', function (event) {
    var picked = event.target.closest('[data-price-pick]');
    if (picked) {
      var product = db.prices.find(function (item) { return item.id === picked.getAttribute('data-price-pick'); });
      if (!product) return;
      db.draft.selectedPriceId = product.id;
      db.draft.billingMode = product.mode === 'thousand' ? 'thousand' : product.mode === 'area' ? 'area' : (product.mode === 'unit' || product.mode === 'unknown') ? 'unit' : 'length';
      saleSearch = '';
      saleShowAll = false;
      persist(true);
      renderPage();
      var quantityInput = document.getElementById('sale-quantity');
      if (quantityInput) quantityInput.focus();
      return;
    }
    var stockChip = event.target.closest('[data-stock-filter]');
    if (stockChip) { stockFilter = stockChip.getAttribute('data-stock-filter'); renderPage(); return; }
    var priceChip = event.target.closest('[data-price-filter]');
    if (priceChip) { priceFilter = priceChip.getAttribute('data-price-filter'); renderPage(); return; }
  });

  // Registra o app para instalação e funcionamento offline depois da primeira visita.
  if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('./sw.js').catch(function () {}); });
  }
  pageHeading();
  renderPage();
})();
