(() => {
  "use strict";

  const PERFIL = {
    comum:    { nome: "Comum",     percentual: 53.75,  prefixo: "COM" },
    incomum:  { nome: "Incomum",   percentual: 24.375, prefixo: "INC" },
    rara:     { nome: "Rara",       percentual: 13.5,   prefixo: "RAR" },
    epica:    { nome: "Épica",      percentual: 4.25,   prefixo: "EPI" },
    lendaria: { nome: "Lendária",   percentual: 4.125,  prefixo: "LEN" },
  };

  const TOTAL_ARTES_PROJETO = 1000;

  const ORDEM_RARIDADES = Object.keys(PERFIL);
  const STORAGE_KEY = "destiny_gerador_producao_v1";
  const RARIDADE_OVERRIDES_KEY = "destiny_raridade_overrides_v1";
  const DB_NAME = "destiny_producao_persistente_v1";
  const DB_VERSION = 1;
  const DB_STORE_ARTES = "artes";

  const $ = seletor => document.querySelector(seletor);

  const el = {
    nomeProjeto: $("#nomeProjeto"),
    codigoProjeto: $("#codigoProjeto"),
    totalProducao: $("#totalProducao"),
    urlValidacao: $("#urlValidacao"),
    qrSecret: $("#qrSecret"),
    btnMostrarSecret: $("#btnMostrarSecret"),
    btnSalvarConfig: $("#btnSalvarConfig"),

    tabelaDistribuicao: $("#tabelaDistribuicao"),
    rodapeArtes: $("#rodapeArtes"),
    rodapeTotal: $("#rodapeTotal"),
    statusDistribuicao: $("#statusDistribuicao"),

    raridadeUpload: $("#raridadeUpload"),
    inputArtes: $("#inputArtes"),
    inputPasta: $("#inputPasta"),
    modoEstritoPasta: $("#modoEstritoPasta"),
    relatorioImportacao: $("#relatorioImportacao"),
    avisoModoLocal: $("#avisoModoLocal"),
    contadorArtes: $("#contadorArtes"),
    completude: $("#completude"),
    arteEditarSelect: $("#arteEditarSelect"),
    filtroTimeSelect: $("#filtroTimeSelect"),
    filtroRaridadeAtualSelect: $("#filtroRaridadeAtualSelect"),
    novaRaridadeSelect: $("#novaRaridadeSelect"),
    btnSelecionarFiltradas: $("#btnSelecionarFiltradas"),
    btnLimparSelecaoArtes: $("#btnLimparSelecaoArtes"),
    btnAlterarRaridade: $("#btnAlterarRaridade"),
    btnExcluirArte: $("#btnExcluirArte"),
    raridadeAtualInfo: $("#raridadeAtualInfo"),
    selectedArtePreviewInfo: $("#selectedArtePreviewInfo"),
    selectedArtePreview: $("#selectedArtePreview"),
    selectedArtePreviewPlaceholder: $("#selectedArtePreviewPlaceholder"),
    btnLimparArtes: $("#btnLimparArtes"),
    btnExportarPlano: $("#btnExportarPlano"),
    progressoImportacao: $("#progressoImportacao"),
    textoImportacao: $("#textoImportacao"),
    percentualImportacao: $("#percentualImportacao"),
    barraImportacao: $("#barraImportacao"),
    persistenciaIndicador: $("#persistenciaIndicador"),
    statusPersistencia: $("#statusPersistencia"),
    detalhePersistencia: $("#detalhePersistencia"),
    btnSalvarAgora: $("#btnSalvarAgora"),
    btnBackupProjeto: $("#btnBackupProjeto"),
    btnRestaurarBackup: $("#btnRestaurarBackup"),
    inputRestaurarBackup: $("#inputRestaurarBackup"),

    previewArteSelect: $("#previewArteSelect"),
    btnPreviewAnterior: $("#btnPreviewAnterior"),
    btnPreviewProxima: $("#btnPreviewProxima"),
    previewInfo: $("#previewInfo"),
    previewFigurinha: $("#previewFigurinha"),
    previewPlaceholder: $("#previewPlaceholder"),
    previewQr: $("#previewQr"),
    previewQrInner: $("#previewQrInner"),
    qrTamanho: $("#qrTamanho"),
    qrRespiro: $("#qrRespiro"),
    qrX: $("#qrX"),
    qrY: $("#qrY"),
    qrPresetVisual: $("#qrPresetVisual"),
    qrRaio: $("#qrRaio"),
    qrCorEscura: $("#qrCorEscura"),
    qrCorEscuraTexto: $("#qrCorEscuraTexto"),
    qrCorClara: $("#qrCorClara"),
    qrCorClaraTexto: $("#qrCorClaraTexto"),
    qrCorMoldura: $("#qrCorMoldura"),
    qrCorMolduraTexto: $("#qrCorMolduraTexto"),
    qrCorBorda: $("#qrCorBorda"),
    qrCorBordaTexto: $("#qrCorBordaTexto"),
    qrEspessuraBorda: $("#qrEspessuraBorda"),

    formatoPapel: $("#formatoPapel"),
    larguraFigurinha: $("#larguraFigurinha"),
    alturaFigurinha: $("#alturaFigurinha"),
    espacoFigurinhas: $("#espacoFigurinhas"),
    qualidadeImagem: $("#qualidadeImagem"),
    marcasCorte: $("#marcasCorte"),
    capacidadePagina: $("#capacidadePagina"),

    modoOrdem: $("#modoOrdem"),
    tamanhoLote: $("#tamanhoLote"),
    numeroLote: $("#numeroLote"),
    intervaloLote: $("#intervaloLote"),
    totalLotes: $("#totalLotes"),
    paginasLote: $("#paginasLote"),
    itensLote: $("#itensLote"),
    btnLoteAnterior: $("#btnLoteAnterior"),
    btnProximoLote: $("#btnProximoLote"),
    avisoModo: $("#avisoModo"),
    statusProducao: $("#statusProducao"),
    btnTestarToken: $("#btnTestarToken"),
    btnCsvLote: $("#btnCsvLote"),
    btnPdfTeste: $("#btnPdfTeste"),
    btnGerarPdf: $("#btnGerarPdf"),
    resultadoTeste: $("#resultadoTeste"),
    progressoGeracao: $("#progressoGeracao"),
    textoGeracao: $("#textoGeracao"),
    percentualGeracao: $("#percentualGeracao"),
    barraGeracao: $("#barraGeracao"),

    toast: $("#toast"),
  };

  let artes = [];
  let ultimoPlano = null;
  let gerando = false;

  let arrastandoQr = false;
  let offsetQr = { x: 0, y: 0 };
  let previewArteId = "";
  let previewObjectUrl = "";
  let selectedArtePreviewUrl = "";
  let raridadeOverrides = carregarOverridesRaridade();
  let dbPromise = null;
  let salvandoPersistencia = false;

  function abrirBancoPersistente() {
    if (!('indexedDB' in window)) {
      return Promise.reject(new Error('Este navegador não oferece IndexedDB.'));
    }

    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DB_STORE_ARTES)) {
          const store = db.createObjectStore(DB_STORE_ARTES, { keyPath: 'persistKey' });
          store.createIndex('caminho', 'caminho', { unique: false });
          store.createIndex('raridade', 'raridade', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Falha ao abrir o armazenamento persistente.'));
      request.onblocked = () => reject(new Error('O armazenamento está bloqueado por outra aba do sistema.'));
    });

    return dbPromise;
  }

  function chavePersistencia(fileOuArte) {
    const caminho = String(fileOuArte.caminho || fileOuArte.webkitRelativePath || fileOuArte.name || fileOuArte.nome || '');
    const tamanho = Number(fileOuArte.tamanho ?? fileOuArte.size ?? 0);
    const modificado = Number(fileOuArte.lastModified ?? fileOuArte.file?.lastModified ?? 0);
    return `${caminho}|${tamanho}|${modificado}`;
  }

  function registroPersistenteDaArte(arte) {
    return {
      persistKey: arte.persistKey || chavePersistencia(arte),
      id: arte.id,
      nome: arte.nome,
      caminho: arte.caminho,
      tamanho: arte.tamanho,
      tipo: arte.tipo,
      raridade: arte.raridade,
      lastModified: Number(arte.file?.lastModified || arte.lastModified || 0),
      blob: arte.file,
      salvoEm: new Date().toISOString(),
    };
  }

  async function salvarArtePersistente(arte) {
    const db = await abrirBancoPersistente();
    const registro = registroPersistenteDaArte(arte);
    arte.persistKey = registro.persistKey;

    await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE_ARTES, 'readwrite');
      tx.objectStore(DB_STORE_ARTES).put(registro);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Falha ao salvar a arte.'));
      tx.onabort = () => reject(tx.error || new Error('O salvamento da arte foi cancelado.'));
    });
  }

  async function salvarTodasArtesPersistentes() {
    if (salvandoPersistencia) return;
    salvandoPersistencia = true;
    atualizarStatusPersistencia('salvando');

    try {
      const db = await abrirBancoPersistente();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE_ARTES, 'readwrite');
        const store = tx.objectStore(DB_STORE_ARTES);
        for (const arte of artes) {
          const registro = registroPersistenteDaArte(arte);
          arte.persistKey = registro.persistKey;
          store.put(registro);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error('Falha ao salvar o projeto.'));
        tx.onabort = () => reject(tx.error || new Error('O salvamento do projeto foi cancelado.'));
      });
      await atualizarStatusPersistencia('ok');
    } finally {
      salvandoPersistencia = false;
    }
  }

  async function removerArtePersistente(arte) {
    if (!arte?.persistKey) return;
    const db = await abrirBancoPersistente();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE_ARTES, 'readwrite');
      tx.objectStore(DB_STORE_ARTES).delete(arte.persistKey);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Falha ao remover a arte persistida.'));
    });
  }

  async function limparArtesPersistentes() {
    const db = await abrirBancoPersistente();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE_ARTES, 'readwrite');
      tx.objectStore(DB_STORE_ARTES).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Falha ao limpar o armazenamento persistente.'));
    });
  }

  async function carregarArtesPersistentes() {
    const db = await abrirBancoPersistente();
    const registros = await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE_ARTES, 'readonly');
      const request = tx.objectStore(DB_STORE_ARTES).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error('Falha ao recuperar as artes salvas.'));
    });

    artes = registros.map(registro => {
      const blob = registro.blob;
      let file = blob;
      if (!(blob instanceof File)) {
        file = new File([blob], registro.nome, {
          type: registro.tipo || blob?.type || 'application/octet-stream',
          lastModified: registro.lastModified || Date.now(),
        });
      }

      return {
        id: registro.id,
        nome: registro.nome,
        caminho: registro.caminho,
        tamanho: registro.tamanho,
        tipo: registro.tipo,
        raridade: registro.raridade,
        lastModified: registro.lastModified,
        persistKey: registro.persistKey,
        file,
      };
    });

    return artes.length;
  }

  async function solicitarPersistenciaArmazenamento() {
    try {
      if (!navigator.storage?.persist) return false;
      const jaPersistente = navigator.storage.persisted
        ? await navigator.storage.persisted()
        : false;
      if (jaPersistente) return true;
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }

  function formatarBytes(bytes) {
    const valor = Number(bytes || 0);
    if (valor < 1024) return `${valor} B`;
    const unidades = ['KB', 'MB', 'GB', 'TB'];
    let n = valor / 1024;
    let i = 0;
    while (n >= 1024 && i < unidades.length - 1) {
      n /= 1024;
      i += 1;
    }
    return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${unidades[i]}`;
  }

  async function atualizarStatusPersistencia(estado = 'ok') {
    if (!el.statusPersistencia) return;

    el.persistenciaIndicador.className = 'persistencia-indicador';
    if (estado === 'ok') el.persistenciaIndicador.classList.add('ok');
    if (estado === 'erro') el.persistenciaIndicador.classList.add('erro');

    if (estado === 'salvando') {
      el.statusPersistencia.textContent = 'Salvando projeto automaticamente...';
      el.detalhePersistencia.textContent = `${formatarNumero(artes.length)} arte(s) na sessão.`;
      return;
    }

    try {
      const estimativa = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
      const persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : false;
      const uso = estimativa?.usage ? formatarBytes(estimativa.usage) : 'uso não informado';
      const quota = estimativa?.quota ? formatarBytes(estimativa.quota) : 'limite não informado';

      el.statusPersistencia.textContent = estado === 'erro'
        ? 'Falha no salvamento automático'
        : `Salvamento automático ativo · ${formatarNumero(artes.length)} arte(s)`;
      el.detalhePersistencia.textContent = `Armazenamento: ${uso} de ${quota}${persisted ? ' · protegido contra limpeza automática' : ' · faça backup periódico por segurança'}.`;
    } catch {
      el.statusPersistencia.textContent = `Salvamento automático ativo · ${formatarNumero(artes.length)} arte(s)`;
      el.detalhePersistencia.textContent = 'As artes são recuperadas automaticamente ao reabrir este sistema no mesmo navegador.';
    }
  }

  function montarBackupProjeto() {
    const config = (() => {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
      catch { return {}; }
    })();

    return {
      formato: 'DESTINY_PROJECT_BACKUP_V1',
      criadoEm: new Date().toISOString(),
      observacao: 'Backup de metadados. As imagens continuam armazenadas no navegador e nos arquivos originais do computador.',
      config,
      raridadeOverrides,
      artes: artes.map(arte => ({
        id: arte.id,
        nome: arte.nome,
        caminho: arte.caminho,
        tamanho: arte.tamanho,
        tipo: arte.tipo,
        raridade: arte.raridade,
        persistKey: arte.persistKey || chavePersistencia(arte),
      })),
    };
  }

  function baixarBackupProjeto() {
    salvarConfigSilencioso();
    salvarOverridesRaridade();
    const backup = JSON.stringify(montarBackupProjeto(), null, 2);
    baixarTexto(
      `${sanitizarNome(el.nomeProjeto.value)}_backup_projeto.json`,
      backup,
      'application/json;charset=utf-8'
    );
    mostrarToast('Backup do projeto baixado. Guarde junto das artes originais.');
  }

  async function restaurarBackupProjeto(file) {
    if (!file) return;

    const texto = await file.text();
    let backup;
    try {
      backup = JSON.parse(texto);
    } catch {
      throw new Error('O arquivo selecionado não é um backup JSON válido.');
    }

    if (backup?.formato !== 'DESTINY_PROJECT_BACKUP_V1') {
      throw new Error('Este arquivo não é um backup reconhecido do projeto Destiny.');
    }

    if (backup.config && typeof backup.config === 'object') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(backup.config));
    }

    const overrides = backup.raridadeOverrides && typeof backup.raridadeOverrides === 'object'
      ? { ...backup.raridadeOverrides }
      : {};

    if (Array.isArray(backup.artes)) {
      for (const item of backup.artes) {
        if (item?.caminho && PERFIL[item.raridade]) {
          overrides[String(item.caminho)] = item.raridade;
        }
      }
    }

    raridadeOverrides = overrides;
    salvarOverridesRaridade();
    carregarConfig();

    // Se as imagens ainda estiverem no IndexedDB, aplica também as raridades do backup.
    if (artes.length && Array.isArray(backup.artes)) {
      const porCaminho = new Map(
        backup.artes
          .filter(item => item?.caminho && PERFIL[item.raridade])
          .map(item => [String(item.caminho), item])
      );

      for (const arte of artes) {
        const salvo = porCaminho.get(String(arte.caminho));
        if (salvo && arte.raridade !== salvo.raridade) {
          arte.raridade = salvo.raridade;
          arte.id = await idEstavelArte(arte, arte.raridade);
        }
      }
      await salvarTodasArtesPersistentes();
    }

    atualizarTudo();
    await atualizarStatusPersistencia('ok');
    mostrarToast(
      artes.length
        ? 'Backup restaurado e aplicado às artes salvas.'
        : 'Backup restaurado. Reimporte as pastas originais para recuperar as imagens; as raridades serão reaplicadas automaticamente.'
    );
  }

  function carregarOverridesRaridade() {
    try {
      const dados = JSON.parse(localStorage.getItem(RARIDADE_OVERRIDES_KEY) || "{}");
      return dados && typeof dados === "object" ? dados : {};
    } catch {
      return {};
    }
  }

  function salvarOverridesRaridade() {
    try {
      localStorage.setItem(RARIDADE_OVERRIDES_KEY, JSON.stringify(raridadeOverrides));
    } catch {}
  }

  function chaveOverride(fileOuArte) {
    return String(fileOuArte.webkitRelativePath || fileOuArte.caminho || fileOuArte.name || fileOuArte.nome || "");
  }

  function numero(campo, padrao = 0) {
    const valor = Number(campo.value);
    return Number.isFinite(valor) ? valor : padrao;
  }

  function inteiro(campo, padrao = 0) {
    return Math.trunc(numero(campo, padrao));
  }

  function formatarNumero(valor) {
    return new Intl.NumberFormat("pt-BR").format(Math.round(Number(valor) || 0));
  }

  function formatarMm(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }

  function escapeHtml(texto) {
    return String(texto).replace(/[&<>"']/g, caractere => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[caractere]);
  }

  function sanitizarNome(texto) {
    return String(texto || "destiny")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase();
  }

  function normalizarHexCor(valor, fallback = "#000000") {
    const texto = String(valor || "").trim().toUpperCase();
    if (/^#[0-9A-F]{6}$/.test(texto)) return texto;
    return fallback.toUpperCase();
  }

  function sincronizarCampoCor(inputCor, inputTexto, fallback) {
    const hex = normalizarHexCor(inputCor.value || inputTexto.value, fallback);
    inputCor.value = hex;
    inputTexto.value = hex;
    return hex;
  }

  function obterEstiloQr() {
    const corEscura = sincronizarCampoCor(el.qrCorEscura, el.qrCorEscuraTexto, '#000000');
    const corClara = sincronizarCampoCor(el.qrCorClara, el.qrCorClaraTexto, '#FFFFFF');
    const corMoldura = sincronizarCampoCor(el.qrCorMoldura, el.qrCorMolduraTexto, '#FFFFFF');
    const corBorda = sincronizarCampoCor(el.qrCorBorda, el.qrCorBordaTexto, '#5A8CFF');

    return {
      preset: el.qrPresetVisual.value,
      corEscura,
      corClara,
      corMoldura,
      corBorda,
      raio: Math.max(0, numero(el.qrRaio, 2.8)),
      espessuraBorda: Math.max(0, numero(el.qrEspessuraBorda, 0.6)),
    };
  }

  function rgbHexParaArray(hex) {
    const v = normalizarHexCor(hex, '#000000').slice(1);
    return [
      parseInt(v.slice(0, 2), 16),
      parseInt(v.slice(2, 4), 16),
      parseInt(v.slice(4, 6), 16),
    ];
  }

  function aplicarPresetQr(nomePreset) {
    const presets = {
      padrao: {
        corEscura: '#000000',
        corClara: '#FFFFFF',
        corMoldura: '#FFFFFF',
        corBorda: '#FFFFFF',
        raio: 0,
        espessuraBorda: 0,
      },
      clean: {
        corEscura: '#111111',
        corClara: '#FFFFFF',
        corMoldura: '#FFFFFF',
        corBorda: '#D7DEEF',
        raio: 2.2,
        espessuraBorda: 0.3,
      },
      destiny: {
        corEscura: '#0B1B52',
        corClara: '#FFFFFF',
        corMoldura: '#FFFFFF',
        corBorda: '#5A8CFF',
        raio: 2.8,
        espessuraBorda: 0.6,
      },
      gold: {
        corEscura: '#2A2208',
        corClara: '#FFF8E8',
        corMoldura: '#FFF8E8',
        corBorda: '#C9A227',
        raio: 2.8,
        espessuraBorda: 0.6,
      },
    };

    const preset = presets[nomePreset] || presets.padrao;
    el.qrCorEscura.value = preset.corEscura;
    el.qrCorEscuraTexto.value = preset.corEscura;
    el.qrCorClara.value = preset.corClara;
    el.qrCorClaraTexto.value = preset.corClara;
    el.qrCorMoldura.value = preset.corMoldura;
    el.qrCorMolduraTexto.value = preset.corMoldura;
    el.qrCorBorda.value = preset.corBorda;
    el.qrCorBordaTexto.value = preset.corBorda;
    el.qrRaio.value = preset.raio;
    el.qrEspessuraBorda.value = preset.espessuraBorda;
  }

  function normalizarTexto(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
  }

  function mostrarToast(mensagem, erro = false) {
    el.toast.textContent = mensagem;
    el.toast.classList.toggle("erro", erro);
    el.toast.classList.add("visivel");
    clearTimeout(mostrarToast.timer);
    mostrarToast.timer = setTimeout(() => {
      el.toast.classList.remove("visivel");
    }, 3000);
  }

  function mostrarProgresso(tipo, texto, atual, total) {
    const container = tipo === "importacao"
      ? el.progressoImportacao
      : el.progressoGeracao;

    const textoEl = tipo === "importacao"
      ? el.textoImportacao
      : el.textoGeracao;

    const percentualEl = tipo === "importacao"
      ? el.percentualImportacao
      : el.percentualGeracao;

    const barraEl = tipo === "importacao"
      ? el.barraImportacao
      : el.barraGeracao;

    const percentual = total > 0
      ? Math.min(100, Math.round((atual / total) * 100))
      : 0;

    container.hidden = false;
    textoEl.textContent = texto;
    percentualEl.textContent = `${percentual}%`;
    barraEl.style.width = `${percentual}%`;
  }

  function esconderProgresso(tipo) {
    (tipo === "importacao"
      ? el.progressoImportacao
      : el.progressoGeracao
    ).hidden = true;
  }

  function hashEstavelArte(texto) {
    const valor = String(texto || "");
    const sementes = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b];
    const partes = sementes.map(semente => {
      let hash = semente >>> 0;
      for (let i = 0; i < valor.length; i += 1) {
        hash ^= valor.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
      }
      return hash.toString(16).padStart(8, "0");
    });
    return partes.join("");
  }

  async function idEstavelArte(file, raridade) {
    const caminho = file.webkitRelativePath || file.caminho || file.name || file.nome;
    const hash = hashEstavelArte(`${raridade}|${normalizarTexto(caminho)}`);
    return `${PERFIL[raridade].prefixo}-${hash.slice(0, 12).toUpperCase()}`;
  }

  function detectarRaridadePeloCaminho(file) {
    const texto = normalizarTexto(file.webkitRelativePath || file.name);

    const partes = texto
      .split(/[\\/]/)
      .map(parte => parte.replace(/[^A-Z0-9]/g, ""));

    if (partes.some(parte => parte === "COMUM" || parte === "COMUNS")) return "comum";
    if (partes.some(parte => parte === "INCOMUM" || parte === "INCOMUNS")) return "incomum";
    if (partes.some(parte => parte === "RARA" || parte === "RARAS")) return "rara";
    if (partes.some(parte => parte === "EPICA" || parte === "EPICAS")) return "epica";
    if (partes.some(parte => parte === "LENDARIA" || parte === "LENDARIAS")) return "lendaria";

    return null;
  }

  function partesCaminhoArquivo(fileOuArte) {
    const caminho = String(
      fileOuArte?.webkitRelativePath ||
      fileOuArte?.caminho ||
      fileOuArte?.name ||
      fileOuArte?.nome ||
      ""
    );

    return caminho
      .split(/[\\/]/)
      .map(parte => parte.trim())
      .filter(Boolean);
  }

  function nomePastaEhRaridade(nome) {
    const token = normalizarTexto(nome).replace(/[^A-Z0-9]/g, "");
    return [
      "COMUM", "COMUNS",
      "INCOMUM", "INCOMUNS",
      "RARA", "RARAS",
      "EPICA", "EPICAS",
      "LENDARIA", "LENDARIAS"
    ].includes(token);
  }

  function detectarTimePeloCaminho(fileOuArte) {
    const partes = partesCaminhoArquivo(fileOuArte);
    if (!partes.length) return "SEM_TIME";

    // Procura a pasta imediatamente anterior à pasta de raridade.
    for (let i = 0; i < partes.length; i += 1) {
      if (nomePastaEhRaridade(partes[i]) && i > 0) {
        return partes[i - 1];
      }
    }

    // Estrutura típica: PASTA_RAIZ/TIME/arquivo.png
    if (partes.length >= 3) {
      return partes[partes.length - 2];
    }

    // Se só existir TIME/arquivo.png.
    if (partes.length === 2) {
      return partes[0];
    }

    return "SEM_TIME";
  }

  function esconderRelatorioImportacao() {
    if (!el.relatorioImportacao) return;
    el.relatorioImportacao.hidden = true;
    el.relatorioImportacao.innerHTML = "";
  }

  function mostrarRelatorioImportacao(relatorio) {
    if (!el.relatorioImportacao || !relatorio) return;

    const cardsRaridade = ORDEM_RARIDADES.map(chave => `
      <div class="card">
        <strong>${PERFIL[chave].nome}</strong><br>
        ${formatarNumero(relatorio.porRaridade?.[chave] || 0)} arquivo(s)
      </div>
    `).join("");

    const times = Object.entries(relatorio.porTime || {})
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR", { numeric: true, sensitivity: "base" }))
      .slice(0, 15)
      .map(([time, quantidade]) => `<li><strong>${escapeHtml(time)}</strong>: ${formatarNumero(quantidade)}</li>`)
      .join("");

    const arquivosSemRaridade = (relatorio.ignoradasSemRaridade || [])
      .slice(0, 10)
      .map(caminho => `<li><code>${escapeHtml(caminho)}</code></li>`)
      .join("");

    el.relatorioImportacao.innerHTML = `
      <h3>Relatório da importação</h3>
      <p>
        <strong>Encontradas:</strong> ${formatarNumero(relatorio.totalArquivos || 0)} ·
        <strong>Adicionadas:</strong> ${formatarNumero(relatorio.adicionadas || 0)} ·
        <strong>Repetidas:</strong> ${formatarNumero(relatorio.ignoradasRepetidas || 0)} ·
        <strong>Sem raridade reconhecida:</strong> ${formatarNumero(relatorio.importadasSemRaridade || 0)}
      </p>
      <div class="relatorio-grid">${cardsRaridade}</div>
      ${times ? `<p><strong>Times/pastas identificados:</strong></p><ul>${times}</ul>` : ""}
      ${arquivosSemRaridade ? `<p><strong>Arquivos sem raridade reconhecida (foram importados usando a raridade padrão):</strong></p><ul>${arquivosSemRaridade}</ul>` : ""}
    `;
    el.relatorioImportacao.hidden = false;
  }

  async function importarArquivos(files, porPasta = false) {
    const extensaoImagem = /\.(png|jpe?g|webp|bmp|gif|avif|jfif)$/i;
    const validos = [...files].filter(file =>
      String(file.type || "").startsWith("image/") || extensaoImagem.test(file.name || "")
    );
    solicitarPersistenciaArmazenamento().catch(() => false);

    if (!validos.length) {
      mostrarToast("Nenhuma imagem válida foi selecionada.", true);
      return;
    }

    if (!porPasta) {
      esconderRelatorioImportacao();
    }

    const existentes = new Set(
      artes.map(arte => `${arte.raridade}|${arte.caminho}`)
    );

    let adicionadas = 0;
    let ignoradas = 0;
    let falhasPersistencia = 0;
    let persistenciaDisponivelDuranteImportacao = true;
    const relatorio = porPasta ? {
      totalArquivos: validos.length,
      adicionadas: 0,
      ignoradasRepetidas: 0,
      ignoradasSemRaridade: [],
      importadasSemRaridade: 0,
      porRaridade: Object.fromEntries(ORDEM_RARIDADES.map(chave => [chave, 0])),
      porTime: {},
    } : null;

    mostrarProgresso("importacao", porPasta ? "Lendo pasta completa..." : "Preparando artes...", 0, validos.length);

    for (let i = 0; i < validos.length; i += 1) {
      const file = validos[i];
      const caminho = file.webkitRelativePath || file.name;
      const overrideSalvo = raridadeOverrides[chaveOverride(file)];
      const raridadeDetectada = porPasta ? detectarRaridadePeloCaminho(file) : null;

      if (porPasta && !raridadeDetectada && !overrideSalvo && relatorio) {
        relatorio.importadasSemRaridade += 1;
        if (el.modoEstritoPasta.checked) {
          relatorio.ignoradasSemRaridade.push(caminho);
        }
      }

      const raridadeBase = porPasta
        ? (raridadeDetectada || el.raridadeUpload.value)
        : el.raridadeUpload.value;
      const raridade = PERFIL[overrideSalvo] ? overrideSalvo : raridadeBase;
      const chave = `${raridade}|${caminho}`;

      if (existentes.has(chave)) {
        ignoradas += 1;
        if (relatorio) relatorio.ignoradasRepetidas += 1;
        mostrarProgresso("importacao", `Conferindo ${i + 1}/${validos.length}`, i + 1, validos.length);
        continue;
      }

      const id = await idEstavelArte(file, raridade);

      const arteNova = {
        id,
        nome: file.name,
        caminho,
        tamanho: file.size,
        tipo: file.type,
        lastModified: file.lastModified || 0,
        raridade,
        file,
      };
      arteNova.persistKey = chavePersistencia(arteNova);
      artes.push(arteNova);

      existentes.add(chave);
      adicionadas += 1;
      if (relatorio) {
        relatorio.adicionadas += 1;
        relatorio.porRaridade[raridade] = (relatorio.porRaridade[raridade] || 0) + 1;
        const time = detectarTimePeloCaminho(file);
        relatorio.porTime[time] = (relatorio.porTime[time] || 0) + 1;
      }

      mostrarProgresso("importacao", porPasta ? `Importando pasta ${i + 1}/${validos.length}` : `Importando e salvando ${i + 1}/${validos.length}`, i + 1, validos.length);
      if (persistenciaDisponivelDuranteImportacao) {
        try {
          await salvarArtePersistente(arteNova);
        } catch (erro) {
          console.error("Falha no salvamento persistente durante a importação:", erro);
          falhasPersistencia += 1;
          persistenciaDisponivelDuranteImportacao = false;
        }
      }

      if (i % 30 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    esconderProgresso("importacao");
    atualizarTudo();

    if (falhasPersistencia) {
      await atualizarStatusPersistencia('erro').catch(() => {});
      if (el.statusPersistencia) {
        el.statusPersistencia.textContent = "Artes carregadas, mas o navegador local bloqueou o salvamento automático";
      }
      if (el.detalhePersistencia) {
        el.detalhePersistencia.textContent = "Você pode testar as artes normalmente. No Netlify/localhost o IndexedDB deve funcionar; não feche esta página se quiser manter este teste local.";
      }
    } else {
      await atualizarStatusPersistencia('ok');
    }

    if (relatorio) {
      mostrarRelatorioImportacao(relatorio);
    }

    const extras = [];
    if (ignoradas) extras.push(`${ignoradas} repetida(s) ignorada(s)`);
    if (relatorio?.importadasSemRaridade) extras.push(`${relatorio.importadasSemRaridade} importada(s) com a raridade padrão`);
    if (falhasPersistencia) extras.push(`salvamento local indisponível, mas as artes foram carregadas`);

    mostrarToast(
      `${adicionadas} arte(s) adicionada(s)` +
      (extras.length ? ` · ${extras.join(' · ')}` : "")
    );
  }

  function contagemPorRaridade() {
    const contagem = Object.fromEntries(
      ORDEM_RARIDADES.map(chave => [chave, 0])
    );

    for (const arte of artes) {
      if (contagem[arte.raridade] !== undefined) {
        contagem[arte.raridade] += 1;
      }
    }

    return contagem;
  }

  function maiorResto(total, pesos) {
    const soma = pesos.reduce((acc, item) => acc + item.peso, 0);

    const itens = pesos.map(item => {
      const exato = soma > 0 ? total * (item.peso / soma) : 0;
      const base = Math.floor(exato);

      return {
        ...item,
        exato,
        quantidade: base,
        resto: exato - base,
      };
    });

    let faltam = total - itens.reduce(
      (acc, item) => acc + item.quantidade,
      0
    );

    [...itens]
      .sort((a, b) => {
        if (b.resto !== a.resto) return b.resto - a.resto;
        return ORDEM_RARIDADES.indexOf(a.chave) - ORDEM_RARIDADES.indexOf(b.chave);
      })
      .slice(0, faltam)
      .forEach(item => {
        item.quantidade += 1;
      });

    return itens;
  }

  function calcularPlano() {
    const total = Math.max(0, inteiro(el.totalProducao, 200000));

    const totaisRaridade = maiorResto(
      total,
      ORDEM_RARIDADES.map(chave => ({
        chave,
        peso: PERFIL[chave].percentual,
      }))
    );

    const mapaTotal = Object.fromEntries(
      totaisRaridade.map(item => [item.chave, item.quantidade])
    );

    const contagem = contagemPorRaridade();

    const raridades = ORDEM_RARIDADES.map(chave => {
      const totalRaridade = mapaTotal[chave] || 0;
      const qtdArtesParaDistribuir = contagem[chave];
      const base = qtdArtesParaDistribuir > 0
        ? Math.floor(totalRaridade / qtdArtesParaDistribuir)
        : 0;
      const extras = qtdArtesParaDistribuir > 0
        ? totalRaridade % qtdArtesParaDistribuir
        : 0;

      return {
        chave,
        ...PERFIL[chave],
        importadas: contagem[chave],
        totalRaridade,
        base,
        extras,
        minimo: qtdArtesParaDistribuir > 0 ? base : 0,
        maximo: qtdArtesParaDistribuir > 0 && extras > 0 ? base + 1 : base,
      };
    });

    const planoPorArte = [];

    for (const raridade of raridades) {
      const grupo = artes
        .filter(arte => arte.raridade === raridade.chave)
        .slice()
        .sort((a, b) =>
          a.id.localeCompare(b.id, "pt-BR", { numeric: true })
        );

      grupo.forEach((arte, indice) => {
        const recebeExtra = indice < raridade.extras;

        planoPorArte.push({
          ...arte,
          ordemNaRaridade: indice + 1,
          copias: raridade.base + (recebeExtra ? 1 : 0),
          extra: recebeExtra,
          excedente: false,
        });
      });
    }

    const completo = artes.length === TOTAL_ARTES_PROJETO &&
      raridades.every(item => item.importadas > 0);

    return {
      total,
      raridades,
      planoPorArte,
      completo,
      totalImportadas: artes.length,
      totalCalculado: raridades.reduce(
        (acc, item) => acc + item.totalRaridade,
        0
      ),
    };
  }

  function renderDistribuicao(plano) {
    el.tabelaDistribuicao.innerHTML = "";

    for (const item of plano.raridades) {
      const faixa = item.minimo === item.maximo
        ? `${formatarNumero(item.minimo)}`
        : `${formatarNumero(item.minimo)}–${formatarNumero(item.maximo)}`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="raridade raridade-${item.chave}">${item.nome}</span></td>
        <td>${String(item.percentual).replace(".", ",")}%</td>
        <td>Variável</td>
        <td><strong>${formatarNumero(item.importadas)}</strong></td>
        <td><strong>${formatarNumero(item.totalRaridade)}</strong></td>
        <td>${formatarNumero(item.base)}</td>
        <td>${formatarNumero(item.extras)}</td>
        <td>${faixa}</td>
      `;
      el.tabelaDistribuicao.appendChild(tr);
    }

    el.rodapeArtes.textContent = formatarNumero(plano.totalImportadas);
    el.rodapeTotal.textContent = formatarNumero(plano.totalCalculado);

    el.statusDistribuicao.textContent =
      plano.totalCalculado === plano.total
        ? "100% fechado"
        : "Diferença encontrada";

    el.statusDistribuicao.className =
      `status-pill ${plano.totalCalculado === plano.total ? "status-ok" : "status-erro"}`;
  }

  function renderCompletude(plano) {
    el.completude.innerHTML = "";

    for (const item of plano.raridades) {
      const pct = plano.totalImportadas > 0
        ? Math.min(100, (item.importadas / plano.totalImportadas) * 100)
        : 0;

      const linha = document.createElement("div");
      linha.className = "completude-linha";
      linha.innerHTML = `
        <span>${item.nome}</span>
        <div class="barra"><span style="width:${pct}%"></span></div>
        <small>${formatarNumero(item.importadas)}</small>
      `;
      el.completude.appendChild(linha);
    }

    el.contadorArtes.textContent =
      `${formatarNumero(plano.totalImportadas)} / ${formatarNumero(TOTAL_ARTES_PROJETO)}`;
  }

  function revogarPreviewEdicaoAnterior() {
    if (selectedArtePreviewUrl) {
      try { URL.revokeObjectURL(selectedArtePreviewUrl); } catch {}
      selectedArtePreviewUrl = "";
    }
  }

  function primeiraArteSelecionadaEdicao() {
    const primeiroId = idsSelecionadosEdicao()[0] || "";
    return artes.find(arte => arte.id === primeiroId) || null;
  }

  function atualizarPreviewEdicaoRaridade() {
    if (!el.selectedArtePreview || !el.selectedArtePreviewInfo || !el.selectedArtePreviewPlaceholder) {
      return;
    }

    const arte = primeiraArteSelecionadaEdicao();
    const quantidadeSelecionadas = idsSelecionadosEdicao().length;

    if (!arte) {
      revogarPreviewEdicaoAnterior();
      el.selectedArtePreview.style.backgroundImage = '';
      el.selectedArtePreviewPlaceholder.hidden = false;
      el.selectedArtePreviewInfo.textContent = artes.length
        ? 'Clique em uma figurinha da lista para visualizar melhor.'
        : 'Importe artes para habilitar a pré-visualização de edição.';
      return;
    }

    const time = detectarTimePeloCaminho(arte);
    const extras = quantidadeSelecionadas > 1
      ? ` · ${formatarNumero(quantidadeSelecionadas)} selecionadas (mostrando a primeira)`
      : '';

    el.selectedArtePreviewInfo.textContent = `Time: ${time} · Arquivo: ${arte.nome} · Atual: ${PERFIL[arte.raridade].nome}${extras}`;

    revogarPreviewEdicaoAnterior();
    selectedArtePreviewUrl = URL.createObjectURL(arte.file);
    const imagem = new Image();

    imagem.onload = () => {
      el.selectedArtePreview.style.backgroundImage = `url("${selectedArtePreviewUrl}")`;
      el.selectedArtePreviewPlaceholder.hidden = true;
    };

    imagem.onerror = () => {
      revogarPreviewEdicaoAnterior();
      el.selectedArtePreview.style.backgroundImage = '';
      el.selectedArtePreviewPlaceholder.hidden = false;
      el.selectedArtePreviewInfo.textContent = `Não foi possível carregar a pré-visualização de ${arte.nome}.`;
    };

    imagem.src = selectedArtePreviewUrl;
  }

  function obterTimesImportados() {
    return [...new Set(artes.map(arte => detectarTimePeloCaminho(arte)).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' }));
  }

  function artesFiltradasParaEdicao() {
    const time = el.filtroTimeSelect?.value || '';
    const raridadeAtual = el.filtroRaridadeAtualSelect?.value || '';

    return artes
      .filter(arte => !time || detectarTimePeloCaminho(arte) === time)
      .filter(arte => !raridadeAtual || arte.raridade === raridadeAtual)
      .sort((a, b) => {
        const timeA = detectarTimePeloCaminho(a);
        const timeB = detectarTimePeloCaminho(b);
        return timeA.localeCompare(timeB, 'pt-BR', { numeric: true, sensitivity: 'base' })
          || a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true, sensitivity: 'base' });
      });
  }

  function idsSelecionadosEdicao() {
    if (!el.arteEditarSelect) return [];
    return [...el.arteEditarSelect.options]
      .filter(opcao => opcao.selected)
      .map(opcao => opcao.value)
      .filter(Boolean);
  }

  function atualizarEditorRaridade() {
    if (!el.arteEditarSelect) return;

    const timeAnterior = el.filtroTimeSelect.value;
    const raridadeAnterior = el.filtroRaridadeAtualSelect.value;
    const selecionadasAntes = new Set(idsSelecionadosEdicao());

    const times = obterTimesImportados();
    el.filtroTimeSelect.innerHTML = '<option value="">Todos os times</option>' +
      times.map(time => `<option value="${escapeHtml(time)}">${escapeHtml(time)}</option>`).join('');
    if (times.includes(timeAnterior)) {
      el.filtroTimeSelect.value = timeAnterior;
    } else {
      el.filtroTimeSelect.value = '';
    }
    el.filtroRaridadeAtualSelect.value = PERFIL[raridadeAnterior] ? raridadeAnterior : '';

    const lista = artesFiltradasParaEdicao();

    el.arteEditarSelect.innerHTML = lista.length
      ? lista.map(arte => {
          const time = detectarTimePeloCaminho(arte);
          return `<option value="${arte.id}">${escapeHtml(time)} · ${escapeHtml(arte.nome)} · ${PERFIL[arte.raridade].nome}</option>`;
        }).join('')
      : '<option value="">Nenhuma figurinha encontrada no filtro</option>';

    [...el.arteEditarSelect.options].forEach(opcao => {
      if (selecionadasAntes.has(opcao.value)) {
        opcao.selected = true;
      }
    });

    if (!idsSelecionadosEdicao().length && previewArteId && [...el.arteEditarSelect.options].some(opcao => opcao.value === previewArteId)) {
      const opcaoPreview = [...el.arteEditarSelect.options].find(opcao => opcao.value === previewArteId);
      if (opcaoPreview) opcaoPreview.selected = true;
    }

    atualizarInfoEditorRaridade();
    atualizarPreviewEdicaoRaridade();
  }

  function atualizarInfoEditorRaridade() {
    const ids = idsSelecionadosEdicao();
    const visiveis = artesFiltradasParaEdicao();

    el.btnSelecionarFiltradas.disabled = !visiveis.length;
    el.btnLimparSelecaoArtes.disabled = !ids.length;
    el.btnAlterarRaridade.disabled = !ids.length;
    el.btnExcluirArte.disabled = !ids.length;

    if (!artes.length) {
      el.raridadeAtualInfo.textContent = 'Importe artes para editar em lote.';
      atualizarPreviewEdicaoRaridade();
      return;
    }

    if (!visiveis.length) {
      el.raridadeAtualInfo.textContent = 'Nenhuma figurinha encontrada com os filtros atuais.';
      atualizarPreviewEdicaoRaridade();
      return;
    }

    if (!ids.length) {
      el.raridadeAtualInfo.textContent = `${formatarNumero(visiveis.length)} figurinha(s) no filtro. Selecione uma ou várias para alterar em lote.`;
      atualizarPreviewEdicaoRaridade();
      return;
    }

    const selecionadas = artes.filter(arte => ids.includes(arte.id));
    const porRaridade = Object.fromEntries(ORDEM_RARIDADES.map(chave => [chave, 0]));
    selecionadas.forEach(arte => { porRaridade[arte.raridade] += 1; });
    const resumo = ORDEM_RARIDADES
      .filter(chave => porRaridade[chave] > 0)
      .map(chave => `${PERFIL[chave].nome}: ${formatarNumero(porRaridade[chave])}`)
      .join(' · ');

    if (selecionadas.length === 1) {
      const arte = selecionadas[0];
      el.novaRaridadeSelect.value = arte.raridade;
      el.raridadeAtualInfo.textContent = `1 selecionada · ${detectarTimePeloCaminho(arte)} · ${arte.nome} · Atual: ${PERFIL[arte.raridade].nome} · ${arte.id}`;
      atualizarPreviewEdicaoRaridade();
      return;
    }

    el.raridadeAtualInfo.textContent = `${formatarNumero(selecionadas.length)} selecionada(s) de ${formatarNumero(visiveis.length)} no filtro · ${resumo}`;
    atualizarPreviewEdicaoRaridade();
  }

  async function alterarRaridadeSelecionada() {
    const ids = idsSelecionadosEdicao();
    if (!ids.length) {
      mostrarToast('Selecione ao menos uma figurinha para alterar.', true);
      return;
    }

    const novaRaridade = el.novaRaridadeSelect.value;
    if (!PERFIL[novaRaridade]) {
      mostrarToast('Raridade inválida.', true);
      return;
    }

    const selecionadas = artes.filter(arte => ids.includes(arte.id));
    const paraAlterar = selecionadas.filter(arte => arte.raridade !== novaRaridade);

    if (!paraAlterar.length) {
      mostrarToast(`Todas as selecionadas já estão como ${PERFIL[novaRaridade].nome}.`);
      return;
    }

    const chavesFixas = new Set(
      artes
        .filter(arte => !ids.includes(arte.id))
        .map(arte => `${arte.raridade}|${arte.caminho}`)
    );
    const chavesNovas = new Set();
    for (const arte of paraAlterar) {
      const chave = `${novaRaridade}|${arte.caminho}`;
      if (chavesFixas.has(chave) || chavesNovas.has(chave)) {
        mostrarToast(`Conflito de duplicidade ao mover ${arte.nome}.`, true);
        return;
      }
      chavesNovas.add(chave);
    }

    let alteradas = 0;
    const novosIdsSelecionados = [];

    for (const arte of selecionadas) {
      if (arte.raridade === novaRaridade) {
        novosIdsSelecionados.push(arte.id);
        continue;
      }

      const idAntigo = arte.id;
      const novoId = await idEstavelArte(arte, novaRaridade);
      arte.raridade = novaRaridade;
      arte.id = novoId;

      raridadeOverrides[chaveOverride(arte)] = novaRaridade;
      await salvarArtePersistente(arte);

      if (previewArteId === idAntigo) {
        previewArteId = novoId;
      }

      novosIdsSelecionados.push(novoId);
      alteradas += 1;
    }

    salvarOverridesRaridade();
    await atualizarStatusPersistencia('ok');

    if (el.filtroRaridadeAtualSelect.value) {
      el.filtroRaridadeAtualSelect.value = '';
    }

    atualizarTudo();

    [...el.arteEditarSelect.options].forEach(opcao => {
      opcao.selected = novosIdsSelecionados.includes(opcao.value);
    });
    atualizarInfoEditorRaridade();

    mostrarToast(`${formatarNumero(alteradas)} figurinha(s) alterada(s) para ${PERFIL[novaRaridade].nome}.`);
  }

  async function excluirArteSelecionada() {
    const ids = idsSelecionadosEdicao();
    if (!ids.length) {
      mostrarToast('Selecione ao menos uma figurinha para excluir.', true);
      return;
    }

    const selecionadas = artes.filter(arte => ids.includes(arte.id));
    const nomes = selecionadas.slice(0, 6).map(arte => `${arte.nome} (${PERFIL[arte.raridade].nome})`).join('\n');
    const resumoExtra = selecionadas.length > 6 ? `\n...e mais ${selecionadas.length - 6} figurinha(s).` : '';

    const confirmou = confirm(
      `Excluir ${selecionadas.length} figurinha(s) do projeto?\n\n${nomes}${resumoExtra}\n\nElas também serão removidas do salvamento automático.`
    );

    if (!confirmou) return;

    let removeuOverride = false;
    for (const arte of selecionadas) {
      await removerArtePersistente(arte);
      const chave = chaveOverride(arte);
      if (raridadeOverrides[chave] !== undefined) {
        delete raridadeOverrides[chave];
        removeuOverride = true;
      }
    }

    artes = artes.filter(arte => !ids.includes(arte.id));

    if (removeuOverride) {
      salvarOverridesRaridade();
    }

    if (!artes.some(arte => arte.id === previewArteId)) {
      previewArteId = artes[0]?.id || '';
    }

    atualizarTudo();
    await atualizarStatusPersistencia('ok');

    mostrarToast(`${formatarNumero(selecionadas.length)} figurinha(s) removida(s) do projeto.`);
  }

  function obterArtePreviewAtual() {
    if (!artes.length) return null;

    if (!previewArteId || !artes.some(arte => arte.id === previewArteId)) {
      previewArteId = artes[0].id;
    }

    return artes.find(arte => arte.id === previewArteId) || artes[0] || null;
  }

  function revogarPreviewAnterior() {
    if (previewObjectUrl) {
      try { URL.revokeObjectURL(previewObjectUrl); } catch {}
      previewObjectUrl = "";
    }
  }

  function atualizarOpcoesPreview(plano = ultimoPlano || calcularPlano()) {
    const atual = obterArtePreviewAtual();

    el.previewArteSelect.innerHTML = artes.length
      ? artes
          .slice()
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true, sensitivity: 'base' }))
          .map(arte => {
            const detalhe = plano.planoPorArte.find(item => item.id === arte.id);
            const etiqueta = `${arte.nome} · ${PERFIL[arte.raridade].nome}` + (detalhe ? ` · ${detalhe.copias} cópias` : '');
            return `<option value="${arte.id}">${escapeHtml(etiqueta)}</option>`;
          })
          .join("")
      : '<option value="">Selecione uma arte importada</option>';

    el.previewArteSelect.value = atual ? atual.id : "";
    el.btnPreviewAnterior.disabled = artes.length <= 1;
    el.btnPreviewProxima.disabled = artes.length <= 1;
  }

  function atualizarInfoPreview(plano = ultimoPlano || calcularPlano()) {
    const arte = obterArtePreviewAtual();

    if (!arte) {
      el.previewInfo.textContent = 'Importe uma arte para visualizar.';
      return;
    }

    const detalhe = plano.planoPorArte.find(item => item.id === arte.id);
    const partes = [
      `Arquivo: ${arte.nome}`,
      `Raridade: ${PERFIL[arte.raridade].nome}`,
      `ID: ${arte.id}`,
    ];

    if (detalhe) {
      partes.push(`Ordem: #${detalhe.ordemNaRaridade}`);
      partes.push(`Cópias: ${formatarNumero(detalhe.copias)}`);
      if (detalhe.extra) partes.push('Recebe +1');
      if (detalhe.excedente) partes.push('Excedente');
    }

    el.previewInfo.textContent = partes.join(' · ');
  }

  function mostrarPrimeiraArte() {
    const arte = obterArtePreviewAtual();
    atualizarOpcoesPreview();
    atualizarInfoPreview();

    if (!arte) {
      revogarPreviewAnterior();
      el.previewFigurinha.style.backgroundImage = '';
      el.previewPlaceholder.hidden = false;
      return;
    }

    revogarPreviewAnterior();
    previewObjectUrl = URL.createObjectURL(arte.file);
    const imagem = new Image();

    imagem.onload = () => {
      el.previewFigurinha.style.backgroundImage = `url("${previewObjectUrl}")`;
      el.previewPlaceholder.hidden = true;
    };

    imagem.onerror = () => {
      revogarPreviewAnterior();
      el.previewFigurinha.style.backgroundImage = '';
      el.previewPlaceholder.hidden = false;
    };

    imagem.src = previewObjectUrl;
  }

  function navegarPreview(direcao) {
    if (!artes.length) return;

    const ordenadas = artes
      .slice()
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true, sensitivity: 'base' }));

    const atual = obterArtePreviewAtual();
    let indice = ordenadas.findIndex(arte => arte.id === (atual && atual.id));
    if (indice < 0) indice = 0;

    indice += direcao;
    if (indice < 0) indice = ordenadas.length - 1;
    if (indice >= ordenadas.length) indice = 0;

    previewArteId = ordenadas[indice].id;
    mostrarPrimeiraArte();
  }

  function limitesQr() {
    const largura = Math.max(1, numero(el.larguraFigurinha, 49));
    const altura = Math.max(1, numero(el.alturaFigurinha, 69));
    const qr = Math.max(1, numero(el.qrTamanho, 12));
    const respiro = Math.max(0, numero(el.qrRespiro, .8));
    const totalQr = qr + (respiro * 2);

    return {
      largura,
      altura,
      qr,
      respiro,
      totalQr,
      maxX: Math.max(0, largura - totalQr),
      maxY: Math.max(0, altura - totalQr),
    };
  }

  function limitarQr() {
    const l = limitesQr();

    const x = Math.min(
      l.maxX,
      Math.max(0, numero(el.qrX, 0))
    );

    const y = Math.min(
      l.maxY,
      Math.max(0, numero(el.qrY, 0))
    );

    el.qrX.value = Math.round(x * 10) / 10;
    el.qrY.value = Math.round(y * 10) / 10;
  }

  async function renderPreviewQrVisual() {
    if (!el.previewQrInner) return;

    const estilo = obterEstiloQr();
    const amostraBase = String(el.urlValidacao.value || 'https://destinyshow.netlify.app').trim() || 'https://destinyshow.netlify.app';
    const textoQr = `${amostraBase.replace(/\/+$/, '')}?token=PREVIEW_DESTINY_QR`;

    el.previewQrInner.innerHTML = '';

    if (!window.QRCode) return;

    new window.QRCode(el.previewQrInner, {
      text: textoQr,
      width: 256,
      height: 256,
      colorDark: estilo.corEscura,
      colorLight: estilo.corClara,
      correctLevel: window.QRCode.CorrectLevel.H,
    });

    await new Promise(resolve => setTimeout(resolve, 0));

    const img = el.previewQrInner.querySelector('img');
    const canvas = el.previewQrInner.querySelector('canvas');

    if (img) {
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.display = 'block';
    }

    if (canvas) {
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
    }
  }

  function atualizarPreviewQr() {
    limitarQr();

    const l = limitesQr();
    const x = numero(el.qrX, 0);
    const y = numero(el.qrY, 0);
    const estilo = obterEstiloQr();

    el.previewFigurinha.style.aspectRatio = `${l.largura}/${l.altura}`;

    const larguraPct = (l.totalQr / l.largura) * 100;
    const alturaPct = (l.totalQr / l.altura) * 100;
    const xPct = (x / l.largura) * 100;
    const yPct = (y / l.altura) * 100;
    const paddingPct = (l.respiro / l.totalQr) * 100;

    Object.assign(el.previewQr.style, {
      left: `${xPct}%`,
      top: `${yPct}%`,
      width: `${larguraPct}%`,
      height: `${alturaPct}%`,
      padding: `${paddingPct}%`,
      background: estilo.corMoldura,
      borderRadius: `${(estilo.raio / l.totalQr) * 100}%`,
      border: `${Math.max(0, (estilo.espessuraBorda / l.totalQr) * 100)} solid ${estilo.corBorda}`,
    });

    renderPreviewQrVisual();
  }

  function aplicarPreset(posicao) {
    const l = limitesQr();
    const margem = 1.5;

    let x = margem;
    let y = margem;

    if (posicao.includes("direito")) {
      x = l.maxX - margem;
    }

    if (posicao.includes("inferior")) {
      y = l.maxY - margem;
    }

    el.qrX.value = Math.max(0, Math.round(x * 10) / 10);
    el.qrY.value = Math.max(0, Math.round(y * 10) / 10);
    atualizarPreviewQr();
    salvarConfigSilencioso();
  }

  function calcularLayout() {
    const formatos = {
      a4: { largura: 210, altura: 297 },
      a3: { largura: 297, altura: 420 },
    };

    const papel = formatos[el.formatoPapel.value] || formatos.a4;
    const figW = Math.max(1, numero(el.larguraFigurinha, 49));
    const figH = Math.max(1, numero(el.alturaFigurinha, 69));
    const gap = Math.max(0, numero(el.espacoFigurinhas, 2));

    const colunas = Math.max(
      1,
      Math.floor((papel.largura + gap) / (figW + gap))
    );

    const linhas = Math.max(
      1,
      Math.floor((papel.altura + gap) / (figH + gap))
    );

    const usadoW = colunas * figW + (colunas - 1) * gap;
    const usadoH = linhas * figH + (linhas - 1) * gap;

    return {
      ...papel,
      figW,
      figH,
      gap,
      colunas,
      linhas,
      capacidade: colunas * linhas,
      inicioX: (papel.largura - usadoW) / 2,
      inicioY: (papel.altura - usadoH) / 2,
    };
  }

  function atualizarLayout() {
    const layout = calcularLayout();
    el.capacidadePagina.textContent =
      `${layout.capacidade} por página`;
    atualizarResumoLote();
  }

  function atualizarStatusProducao(plano) {
    if (plano.completo) {
      el.statusProducao.textContent = "Pronto para produção";
      el.statusProducao.className = "status-pill status-ok";
      return;
    }

    const diferenca = TOTAL_ARTES_PROJETO - plano.totalImportadas;

    if (diferenca > 0) {
      el.statusProducao.textContent = `Faltam ${formatarNumero(diferenca)} arte(s)`;
      el.statusProducao.className = "status-pill status-pendente";
    } else if (diferenca < 0) {
      el.statusProducao.textContent = `Remover ${formatarNumero(Math.abs(diferenca))} arte(s)`;
      el.statusProducao.className = "status-pill status-erro";
    } else {
      const vazias = plano.raridades.filter(item => item.importadas === 0);
      el.statusProducao.textContent = vazias.length
        ? "Há raridade sem nenhuma arte"
        : "Conferir configuração";
      el.statusProducao.className = "status-pill status-erro";
    }
  }

  function atualizarResumoLote() {
    const plano = ultimoPlano || calcularPlano();
    const tamanho = Math.max(1, inteiro(el.tamanhoLote, 1000));
    const totalLotes = Math.max(1, Math.ceil(plano.total / tamanho));

    let lote = Math.max(1, inteiro(el.numeroLote, 1));
    lote = Math.min(totalLotes, lote);
    el.numeroLote.value = lote;

    const inicio = ((lote - 1) * tamanho) + 1;
    const fim = Math.min(plano.total, inicio + tamanho - 1);
    const itens = Math.max(0, fim - inicio + 1);
    const layout = calcularLayout();
    const paginas = Math.ceil(itens / layout.capacidade);

    el.intervaloLote.textContent =
      `${formatarNumero(inicio)}–${formatarNumero(fim)}`;

    el.totalLotes.textContent =
      `${formatarNumero(totalLotes)} lote${totalLotes === 1 ? "" : "s"}`;

    el.paginasLote.textContent = formatarNumero(paginas);
    el.itensLote.textContent =
      `${formatarNumero(itens)} figurinhas`;

    el.btnLoteAnterior.disabled = lote <= 1;
    el.btnProximoLote.disabled = lote >= totalLotes;
  }

  function salvarConfigSilencioso() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          nomeProjeto: el.nomeProjeto.value,
          codigoProjeto: el.codigoProjeto.value,
          totalProducao: inteiro(el.totalProducao, 200000),
          urlValidacao: el.urlValidacao.value,
          qrTamanho: numero(el.qrTamanho, 12),
          qrRespiro: numero(el.qrRespiro, .8),
          qrX: numero(el.qrX, 33.9),
          qrY: numero(el.qrY, 53.9),
          qrPresetVisual: el.qrPresetVisual.value,
          qrRaio: numero(el.qrRaio, 2.8),
          qrCorEscura: el.qrCorEscura.value,
          qrCorClara: el.qrCorClara.value,
          qrCorMoldura: el.qrCorMoldura.value,
          qrCorBorda: el.qrCorBorda.value,
          qrEspessuraBorda: numero(el.qrEspessuraBorda, .6),
          formatoPapel: el.formatoPapel.value,
          larguraFigurinha: numero(el.larguraFigurinha, 49),
          alturaFigurinha: numero(el.alturaFigurinha, 69),
          espacoFigurinhas: numero(el.espacoFigurinhas, 2),
          qualidadeImagem: el.qualidadeImagem.value,
          marcasCorte: el.marcasCorte.checked,
          modoOrdem: el.modoOrdem.value,
          tamanhoLote: inteiro(el.tamanhoLote, 1000),
          numeroLote: inteiro(el.numeroLote, 1),
        })
      );
    } catch {}
  }

  function carregarConfig() {
    try {
      const dados = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!dados) return;

      const campos = [
        "nomeProjeto",
        "codigoProjeto",
        "totalProducao",
        "urlValidacao",
        "qrTamanho",
        "qrRespiro",
        "qrX",
        "qrY",
        "qrPresetVisual",
        "qrRaio",
        "qrCorEscura",
        "qrCorClara",
        "qrCorMoldura",
        "qrCorBorda",
        "qrEspessuraBorda",
        "formatoPapel",
        "larguraFigurinha",
        "alturaFigurinha",
        "espacoFigurinhas",
        "qualidadeImagem",
        "modoOrdem",
        "tamanhoLote",
        "numeroLote",
      ];

      for (const campo of campos) {
        if (dados[campo] !== undefined && el[campo]) {
          el[campo].value = dados[campo];
        }
      }

      if (dados.marcasCorte !== undefined) {
        el.marcasCorte.checked = Boolean(dados.marcasCorte);
      }
      if (dados.modoEstritoPasta !== undefined) {
        el.modoEstritoPasta.checked = Boolean(dados.modoEstritoPasta);
      }
    } catch {}
  }

  function atualizarTudo() {
    ultimoPlano = calcularPlano();
    renderDistribuicao(ultimoPlano);
    renderCompletude(ultimoPlano);
    atualizarEditorRaridade();
    atualizarStatusProducao(ultimoPlano);
    atualizarPreviewQr();
    atualizarLayout();
    mostrarPrimeiraArte();
    salvarConfigSilencioso();
  }

  function bytesParaBase64Url(bytes) {
    let binario = "";
    for (const byte of bytes) {
      binario += String.fromCharCode(byte);
    }

    return btoa(binario)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  function textoParaBase64Url(texto) {
    return bytesParaBase64Url(
      new TextEncoder().encode(texto)
    );
  }

  function secretHexParaBytes(secret) {
    const valor = String(secret || "").trim().toLowerCase();

    if (!/^[0-9a-f]{64}$/.test(valor)) {
      throw new Error(
        "O QR_SECRET precisa ter exatamente 64 caracteres hexadecimais."
      );
    }

    const bytes = new Uint8Array(32);

    for (let i = 0; i < valor.length; i += 2) {
      bytes[i / 2] = Number.parseInt(valor.slice(i, i + 2), 16);
    }

    return bytes;
  }

  async function criarToken(arteId, copiaNumero) {
    const projeto = String(el.codigoProjeto.value || "").trim();

    if (!projeto) {
      throw new Error("Informe o código do projeto.");
    }

    const payload = {
      p: projeto,
      a: arteId,
      c: copiaNumero,
    };

    const payloadBase64 =
      textoParaBase64Url(JSON.stringify(payload));

    const chave = await crypto.subtle.importKey(
      "raw",
      secretHexParaBytes(el.qrSecret.value),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const assinatura = new Uint8Array(
      await crypto.subtle.sign(
        "HMAC",
        chave,
        new TextEncoder().encode(payloadBase64)
      )
    );

    return `${payloadBase64}.${bytesParaBase64Url(assinatura)}`;
  }

  function urlDeValidacao(token) {
    const base = String(el.urlValidacao.value || "")
      .trim()
      .replace(/\/+$/, "");

    if (!/^https:\/\//i.test(base)) {
      throw new Error(
        "Informe a URL HTTPS da página de validação do Netlify."
      );
    }

    const separador = base.includes("?") ? "&" : "?";

    return `${base}${separador}token=${encodeURIComponent(token)}`;
  }

  function hash32(texto) {
    let hash = 2166136261;

    for (let i = 0; i < texto.length; i += 1) {
      hash ^= texto.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  function mdc(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);

    while (y) {
      const resto = x % y;
      x = y;
      y = resto;
    }

    return x;
  }

  function indiceEmbaralhado(posicao, tamanho, semente) {
    if (tamanho <= 1) return 0;

    let multiplicador =
      (hash32(`${semente}|a`) % tamanho) || 1;

    if (multiplicador % 2 === 0) {
      multiplicador += 1;
    }

    let tentativas = 0;

    while (
      mdc(multiplicador, tamanho) !== 1 &&
      tentativas < tamanho + 2
    ) {
      multiplicador = (multiplicador + 2) % tamanho;
      if (multiplicador === 0) multiplicador = 1;
      tentativas += 1;
    }

    const deslocamento =
      hash32(`${semente}|b`) % tamanho;

    return (
      (multiplicador * posicao) + deslocamento
    ) % tamanho;
  }

  function prepararOrdemAgrupada(plano) {
    const lista = plano.planoPorArte
      .slice()
      .sort((a, b) => {
        const r =
          ORDEM_RARIDADES.indexOf(a.raridade) -
          ORDEM_RARIDADES.indexOf(b.raridade);

        if (r !== 0) return r;
        return a.id.localeCompare(b.id);
      });

    let acumulado = 0;

    return lista.map(arte => {
      const item = {
        arte,
        inicio: acumulado,
        quantidade: arte.copias,
      };

      acumulado += arte.copias;
      return item;
    });
  }

  function localizarAgrupado(estrutura, indiceZero) {
    let esquerda = 0;
    let direita = estrutura.length - 1;

    while (esquerda <= direita) {
      const meio = Math.floor(
        (esquerda + direita) / 2
      );

      const item = estrutura[meio];
      const fim = item.inicio + item.quantidade;

      if (indiceZero < item.inicio) {
        direita = meio - 1;
      } else if (indiceZero >= fim) {
        esquerda = meio + 1;
      } else {
        return {
          arte: item.arte,
          copiaNumero:
            indiceZero - item.inicio + 1,
        };
      }
    }

    return null;
  }

  function prepararOrdemBalanceada(plano) {
    const ordenadas = plano.planoPorArte
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id));

    const maxCopias = ordenadas.reduce(
      (max, arte) => Math.max(max, arte.copias),
      0
    );

    const rodadas = [];
    let acumulado = 0;

    for (let rodada = 1; rodada <= maxCopias; rodada += 1) {
      const ativas = ordenadas.filter(
        arte => arte.copias >= rodada
      );

      if (!ativas.length) continue;

      rodadas.push({
        rodada,
        inicio: acumulado,
        quantidade: ativas.length,
        ativas,
      });

      acumulado += ativas.length;
    }

    return rodadas;
  }

  function localizarBalanceado(
    rodadas,
    indiceZero
  ) {
    let esquerda = 0;
    let direita = rodadas.length - 1;

    while (esquerda <= direita) {
      const meio = Math.floor(
        (esquerda + direita) / 2
      );

      const rodada = rodadas[meio];
      const fim = rodada.inicio + rodada.quantidade;

      if (indiceZero < rodada.inicio) {
        direita = meio - 1;
      } else if (indiceZero >= fim) {
        esquerda = meio + 1;
      } else {
        const posicao =
          indiceZero - rodada.inicio;

        const indiceArte = indiceEmbaralhado(
          posicao,
          rodada.quantidade,
          `${el.codigoProjeto.value}|${el.totalProducao.value}|rodada-${rodada.rodada}`
        );

        return {
          arte: rodada.ativas[indiceArte],
          copiaNumero: rodada.rodada,
        };
      }
    }

    return null;
  }

  function obterIntervaloAtual(total = null) {
    const plano = ultimoPlano || calcularPlano();
    const totalReal = total ?? plano.total;
    const tamanho = Math.max(
      1,
      inteiro(el.tamanhoLote, 1000)
    );

    const totalLotes = Math.max(
      1,
      Math.ceil(totalReal / tamanho)
    );

    const lote = Math.min(
      totalLotes,
      Math.max(1, inteiro(el.numeroLote, 1))
    );

    const inicio = ((lote - 1) * tamanho) + 1;
    const fim = Math.min(
      totalReal,
      inicio + tamanho - 1
    );

    return {
      lote,
      tamanho,
      totalLotes,
      inicio,
      fim,
      quantidade: Math.max(0, fim - inicio + 1),
    };
  }

  async function gerarItensIntervalo(
    plano,
    inicio,
    quantidade,
    callback
  ) {
    if (!plano.completo) {
      throw new Error(
        "Para gerar produção definitiva, importe exatamente as 1.000 artes nas raridades corretas."
      );
    }

    const inicioZero = Math.max(0, inicio - 1);
    const fimZero = Math.min(
      plano.total,
      inicioZero + quantidade
    );

    const agrupado =
      el.modoOrdem.value === "agrupado";

    const estrutura = agrupado
      ? prepararOrdemAgrupada(plano)
      : prepararOrdemBalanceada(plano);

    const itens = [];

    for (
      let indice = inicioZero;
      indice < fimZero;
      indice += 1
    ) {
      const localizado = agrupado
        ? localizarAgrupado(estrutura, indice)
        : localizarBalanceado(estrutura, indice);

      if (!localizado) {
        throw new Error(
          `Não foi possível localizar a figurinha global ${indice + 1}.`
        );
      }

      const token = await criarToken(
        localizado.arte.id,
        localizado.copiaNumero
      );

      itens.push({
        indiceGlobal: indice + 1,
        arte: localizado.arte,
        copiaNumero: localizado.copiaNumero,
        token,
        url: urlDeValidacao(token),
      });

      callback?.(
        itens.length,
        fimZero - inicioZero
      );

      if (itens.length % 40 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return itens;
  }

  async function gerarQrDataUrl(texto) {
    if (!window.QRCode) {
      throw new Error(
        "A biblioteca de QR Code não foi carregada."
      );
    }

    const estilo = obterEstiloQr();

    const suporte = document.createElement("div");
    suporte.style.cssText =
      "position:fixed;left:-10000px;top:-10000px;width:256px;height:256px";

    document.body.appendChild(suporte);

    try {
      new window.QRCode(suporte, {
        text: texto,
        width: 256,
        height: 256,
        colorDark: estilo.corEscura,
        colorLight: estilo.corClara,
        correctLevel:
          window.QRCode.CorrectLevel.H,
      });

      await new Promise(resolve =>
        setTimeout(resolve, 0)
      );

      const canvas =
        suporte.querySelector("canvas");

      if (canvas) {
        return canvas.toDataURL("image/png");
      }

      const img = suporte.querySelector("img");

      if (img) {
        if (!img.complete) {
          await new Promise(
            (resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            }
          );
        }

        return img.src;
      }

      throw new Error(
        "Não foi possível renderizar o QR."
      );
    } finally {
      suporte.remove();
    }
  }

  async function prepararImagemArte(arte) {
    const url = URL.createObjectURL(arte.file);
    const img = new Image();

    try {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      const largura =
        Math.max(300, inteiro(el.qualidadeImagem, 650));

      const proporcao =
        numero(el.alturaFigurinha, 69) /
        numero(el.larguraFigurinha, 49);

      const altura =
        Math.round(largura * proporcao);

      const canvas =
        document.createElement("canvas");

      canvas.width = largura;
      canvas.height = altura;

      const ctx = canvas.getContext("2d", {
        alpha: false,
      });

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(
        0,
        0,
        largura,
        altura
      );

      /*
        A arte final já deve estar no formato 49x69.
        Usamos preenchimento total para manter o tamanho exato.
      */
      ctx.drawImage(
        img,
        0,
        0,
        largura,
        altura
      );

      return canvas.toDataURL(
        "image/jpeg",
        .92
      );
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function desenharMarcasCorte(
    pdf,
    x,
    y,
    w,
    h
  ) {
    const t = 1.4;
    const afast = .45;

    pdf.setDrawColor(70);
    pdf.setLineWidth(.12);

    pdf.line(
      x - afast - t,
      y,
      x - afast,
      y
    );

    pdf.line(
      x,
      y - afast - t,
      x,
      y - afast
    );

    pdf.line(
      x + w + afast,
      y,
      x + w + afast + t,
      y
    );

    pdf.line(
      x + w,
      y - afast - t,
      x + w,
      y - afast
    );

    pdf.line(
      x - afast - t,
      y + h,
      x - afast,
      y + h
    );

    pdf.line(
      x,
      y + h + afast,
      x,
      y + h + afast + t
    );

    pdf.line(
      x + w + afast,
      y + h,
      x + w + afast + t,
      y + h
    );

    pdf.line(
      x + w,
      y + h + afast,
      x + w,
      y + h + afast + t
    );
  }

  async function gerarPdfComItens(
    itens,
    nomeArquivo
  ) {
    if (!window.jspdf?.jsPDF) {
      throw new Error(
        "A biblioteca de PDF não carregou. Verifique sua internet e atualize a página."
      );
    }

    const { jsPDF } = window.jspdf;
    const layout = calcularLayout();

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: el.formatoPapel.value,
      compress: true,
    });

    const cacheArte = new Map();
    const lqr = limitesQr();

    for (let i = 0; i < itens.length; i += 1) {
      if (
        i > 0 &&
        i % layout.capacidade === 0
      ) {
        pdf.addPage(
          el.formatoPapel.value,
          "portrait"
        );
      }

      const posicao =
        i % layout.capacidade;

      const coluna =
        posicao % layout.colunas;

      const linha =
        Math.floor(
          posicao / layout.colunas
        );

      const x =
        layout.inicioX +
        coluna * (layout.figW + layout.gap);

      const y =
        layout.inicioY +
        linha * (layout.figH + layout.gap);

      const item = itens[i];

      let arteData =
        cacheArte.get(item.arte.id);

      if (!arteData) {
        mostrarProgresso(
          "geracao",
          `Preparando arte ${item.arte.nome}`,
          i,
          itens.length
        );

        arteData =
          await prepararImagemArte(item.arte);

        cacheArte.set(
          item.arte.id,
          arteData
        );
      }

      pdf.addImage(
        arteData,
        "JPEG",
        x,
        y,
        layout.figW,
        layout.figH,
        `ART-${item.arte.id}`,
        "FAST"
      );

      const qrData =
        await gerarQrDataUrl(item.url);

      const qrX =
        x + numero(el.qrX, 0);

      const qrY =
        y + numero(el.qrY, 0);

      const estiloQr = obterEstiloQr();
      const [fillR, fillG, fillB] = rgbHexParaArray(estiloQr.corMoldura);
      const [borderR, borderG, borderB] = rgbHexParaArray(estiloQr.corBorda);
      const temBorda = estiloQr.espessuraBorda > 0;
      const temRaio = estiloQr.raio > 0;

      pdf.setFillColor(fillR, fillG, fillB);
      if (temBorda) {
        pdf.setDrawColor(borderR, borderG, borderB);
        pdf.setLineWidth(estiloQr.espessuraBorda);
      }

      if (temRaio) {
        pdf.roundedRect(
          qrX,
          qrY,
          lqr.totalQr,
          lqr.totalQr,
          estiloQr.raio,
          estiloQr.raio,
          temBorda ? 'FD' : 'F'
        );
      } else {
        if (temBorda) {
          pdf.rect(
            qrX,
            qrY,
            lqr.totalQr,
            lqr.totalQr,
            'FD'
          );
        } else {
          pdf.rect(
            qrX,
            qrY,
            lqr.totalQr,
            lqr.totalQr,
            'F'
          );
        }
      }

      pdf.addImage(
        qrData,
        "PNG",
        qrX + lqr.respiro,
        qrY + lqr.respiro,
        lqr.qr,
        lqr.qr,
        undefined,
        "FAST"
      );

      if (el.marcasCorte.checked) {
        desenharMarcasCorte(
          pdf,
          x,
          y,
          layout.figW,
          layout.figH
        );
      }

      mostrarProgresso(
        "geracao",
        `Montando PDF ${i + 1}/${itens.length}`,
        i + 1,
        itens.length
      );

      if (i % 10 === 0) {
        await new Promise(resolve =>
          setTimeout(resolve, 0)
        );
      }
    }

    pdf.save(nomeArquivo);
  }

  function csvCampo(valor) {
    const texto = String(valor ?? "");

    if (/[;"\r\n]/.test(texto)) {
      return `"${texto.replace(/"/g, '""')}"`;
    }

    return texto;
  }

  function baixarTexto(
    nome,
    conteudo,
    tipo
  ) {
    const blob = new Blob(
      [conteudo],
      { type: tipo }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download = nome;
    link.click();

    URL.revokeObjectURL(url);
  }

  function exportarPlanoCsv() {
    const plano =
      ultimoPlano || calcularPlano();

    const linhas = [
      [
        "arte_id",
        "arquivo",
        "caminho",
        "raridade",
        "ordem_na_raridade",
        "copias_planejadas",
        "recebeu_mais_1",
      ],
      ...plano.planoPorArte.map(
        arte => [
          arte.id,
          arte.nome,
          arte.caminho,
          PERFIL[arte.raridade].nome,
          arte.ordemNaRaridade,
          arte.copias,
          arte.extra ? "SIM" : "NAO",
        ]
      ),
    ];

    const csv =
      "\uFEFF" +
      linhas
        .map(linha =>
          linha
            .map(csvCampo)
            .join(";")
        )
        .join("\r\n");

    baixarTexto(
      `destiny_plano_${plano.total}.csv`,
      csv,
      "text/csv;charset=utf-8"
    );
  }

  async function baixarCsvLote() {
    if (gerando) return;

    try {
      validarConfiguracaoProducao();

      const plano =
        ultimoPlano || calcularPlano();

      const intervalo =
        obterIntervaloAtual();

      gerando = true;
      bloquearBotoes(true);

      const itens =
        await gerarItensIntervalo(
          plano,
          intervalo.inicio,
          intervalo.quantidade,
          (atual, total) =>
            mostrarProgresso(
              "geracao",
              "Criando tokens do lote",
              atual,
              total
            )
        );

      const linhas = [
        [
          "indice_global",
          "arte_id",
          "arquivo",
          "raridade",
          "copia_da_arte",
          "token",
          "url_validacao",
        ],
        ...itens.map(item => [
          item.indiceGlobal,
          item.arte.id,
          item.arte.nome,
          PERFIL[item.arte.raridade].nome,
          item.copiaNumero,
          item.token,
          item.url,
        ]),
      ];

      const csv =
        "\uFEFF" +
        linhas
          .map(linha =>
            linha
              .map(csvCampo)
              .join(";")
          )
          .join("\r\n");

      baixarTexto(
        `${sanitizarNome(el.nomeProjeto.value)}_lote_${intervalo.lote}_${intervalo.inicio}_a_${intervalo.fim}.csv`,
        csv,
        "text/csv;charset=utf-8"
      );

      mostrarToast("CSV do lote gerado.");
    } catch (erro) {
      mostrarToast(
        erro.message || "Falha ao gerar CSV.",
        true
      );
    } finally {
      gerando = false;
      bloquearBotoes(false);
      esconderProgresso("geracao");
    }
  }

  function validarConfiguracaoProducao() {
    if (!window.crypto?.subtle) {
      throw new Error(
        "Este navegador não oferece a criptografia necessária."
      );
    }

    if (!/^[0-9a-fA-F]{64}$/.test(
      String(el.qrSecret.value || "").trim()
    )) {
      throw new Error(
        "Informe o mesmo QR_SECRET de 64 caracteres usado no Worker."
      );
    }

    if (!String(el.codigoProjeto.value || "").trim()) {
      throw new Error(
        "Informe o código do projeto."
      );
    }

    urlDeValidacao("TESTE");
  }

  function bloquearBotoes(bloquear) {
    [
      el.btnTestarToken,
      el.btnCsvLote,
      el.btnPdfTeste,
      el.btnGerarPdf,
    ].forEach(botao => {
      botao.disabled = bloquear;
    });
  }

  async function gerarPdfLote() {
    if (gerando) return;

    try {
      validarConfiguracaoProducao();

      const plano =
        ultimoPlano || calcularPlano();

      if (!plano.completo) {
        throw new Error(
          "A produção definitiva exige exatamente 1.000 artes no total, com pelo menos uma arte em cada raridade."
        );
      }

      const intervalo =
        obterIntervaloAtual();

      if (
        el.modoOrdem.value === "balanceado" &&
        intervalo.quantidade > 600
      ) {
        const continuar = confirm(
          "No modo balanceado este lote pode incluir muitas artes diferentes e gerar um PDF pesado. Continuar?"
        );

        if (!continuar) return;
      }

      gerando = true;
      bloquearBotoes(true);

      const itens =
        await gerarItensIntervalo(
          plano,
          intervalo.inicio,
          intervalo.quantidade,
          (atual, total) =>
            mostrarProgresso(
              "geracao",
              "Assinando QR Codes",
              atual,
              total
            )
        );

      const nome =
        `${sanitizarNome(el.nomeProjeto.value)}_lote_${String(intervalo.lote).padStart(3, "0")}_${intervalo.inicio}_a_${intervalo.fim}.pdf`;

      await gerarPdfComItens(
        itens,
        nome
      );

      mostrarToast(
        `Lote ${intervalo.lote} gerado com ${formatarNumero(itens.length)} figurinhas.`
      );
    } catch (erro) {
      console.error(erro);
      mostrarToast(
        erro.message || "Falha ao gerar PDF.",
        true
      );
    } finally {
      gerando = false;
      bloquearBotoes(false);
      esconderProgresso("geracao");
    }
  }

  async function gerarPdfTeste() {
    if (gerando) return;

    try {
      validarConfiguracaoProducao();

      if (!artes.length) {
        throw new Error(
          "Importe pelo menos uma arte."
        );
      }

      gerando = true;
      bloquearBotoes(true);

      const primeiras =
        artes.slice(0, 16);

      const itens = [];

      for (
        let i = 0;
        i < primeiras.length;
        i += 1
      ) {
        const arte = primeiras[i];

        const arteIdTeste = `TESTE-${arte.id}`;

        const token =
          await criarToken(
            arteIdTeste,
            1
          );

        itens.push({
          indiceGlobal: i + 1,
          arte: {
            ...arte,
            idTokenTeste: arteIdTeste,
          },
          copiaNumero: 1,
          token,
          url: urlDeValidacao(token),
        });
      }

      await gerarPdfComItens(
        itens,
        `${sanitizarNome(el.nomeProjeto.value)}_TESTE_QR.pdf`
      );

      mostrarToast(
        "PDF de teste gerado."
      );
    } catch (erro) {
      mostrarToast(
        erro.message || "Falha ao gerar teste.",
        true
      );
    } finally {
      gerando = false;
      bloquearBotoes(false);
      esconderProgresso("geracao");
    }
  }

  async function testarPrimeiroQr() {
    try {
      validarConfiguracaoProducao();

      if (!artes.length) {
        throw new Error(
          "Importe pelo menos uma arte."
        );
      }

      const arte =
        [...artes].sort(
          (a, b) => a.id.localeCompare(b.id)
        )[0];

      const arteIdTeste = `TESTE-${arte.id}`;

      const token =
        await criarToken(
          arteIdTeste,
          1
        );

      const url =
        urlDeValidacao(token);

      el.resultadoTeste.hidden = false;
      el.resultadoTeste.textContent =
        JSON.stringify(
          {
            arte_id_teste: arteIdTeste,
            arquivo: arte.nome,
            copia: 1,
            token,
            url,
            observacao: "Token de teste separado da produção real.",
          },
          null,
          2
        );

      mostrarToast(
        "Primeiro QR criado. Abra a URL exibida para conferir."
      );
    } catch (erro) {
      el.resultadoTeste.hidden = false;
      el.resultadoTeste.textContent =
        erro.message;
      mostrarToast(
        erro.message,
        true
      );
    }
  }

  function atualizarAvisoModo() {
    if (el.modoOrdem.value === "agrupado") {
      el.avisoModo.innerHTML =
        "<strong>Agrupado por arte:</strong> PDFs menores e mais rápidos, pois cada imagem de fundo pode ser reutilizada muitas vezes e somente o QR muda.";
    } else {
      el.avisoModo.innerHTML =
        "<strong>Balanceado por rodadas:</strong> alterna as artes ao longo da produção. É útil para sequência misturada, mas cada lote pode ficar bem mais pesado.";
    }

    salvarConfigSilencioso();
  }

  function iniciarArrastoQr(event) {
    const rect =
      el.previewQr.getBoundingClientRect();

    offsetQr = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    arrastandoQr = true;
    el.previewQr.setPointerCapture?.(
      event.pointerId
    );

    event.preventDefault();
  }

  function moverQr(event) {
    if (!arrastandoQr) return;

    const rect =
      el.previewFigurinha.getBoundingClientRect();

    const l = limitesQr();

    const xPx =
      Math.min(
        rect.width -
          (l.totalQr / l.largura) * rect.width,
        Math.max(
          0,
          event.clientX -
            rect.left -
            offsetQr.x
        )
      );

    const yPx =
      Math.min(
        rect.height -
          (l.totalQr / l.altura) * rect.height,
        Math.max(
          0,
          event.clientY -
            rect.top -
            offsetQr.y
        )
      );

    el.qrX.value =
      Math.round(
        ((xPx / rect.width) * l.largura) * 10
      ) / 10;

    el.qrY.value =
      Math.round(
        ((yPx / rect.height) * l.altura) * 10
      ) / 10;

    atualizarPreviewQr();
    event.preventDefault();
  }

  function fimArrastoQr(event) {
    if (!arrastandoQr) return;

    arrastandoQr = false;

    el.previewQr.releasePointerCapture?.(
      event.pointerId
    );

    salvarConfigSilencioso();
  }

  el.btnMostrarSecret.addEventListener(
    "click",
    () => {
      const mostrando =
        el.qrSecret.type === "text";

      el.qrSecret.type =
        mostrando ? "password" : "text";

      el.btnMostrarSecret.textContent =
        mostrando ? "Mostrar" : "Ocultar";
    }
  );

  el.btnSalvarConfig.addEventListener(
    "click",
    () => {
      salvarConfigSilencioso();
      mostrarToast(
        "Configurações salvas neste navegador. O QR_SECRET não foi salvo."
      );
    }
  );

  el.modoEstritoPasta.addEventListener(
    "change",
    () => salvarConfigSilencioso()
  );

  el.inputArtes.addEventListener(
    "change",
    event => {
      importarArquivos(
        event.target.files,
        false
      ).catch(erro => {
        console.error(erro);
        esconderProgresso("importacao");
        atualizarTudo();
        mostrarToast(`Erro ao importar: ${erro.message || erro}`, true);
      }).finally(() => {
        el.inputArtes.value = "";
      });
    }
  );

  el.inputPasta.addEventListener(
    "change",
    event => {
      importarArquivos(
        event.target.files,
        true
      ).catch(erro => {
        console.error(erro);
        esconderProgresso("importacao");
        atualizarTudo();
        mostrarToast(`Erro ao importar pasta: ${erro.message || erro}`, true);
      }).finally(() => {
        el.inputPasta.value = "";
      });
    }
  );

  el.filtroTimeSelect.addEventListener(
    "change",
    () => atualizarEditorRaridade()
  );

  el.filtroRaridadeAtualSelect.addEventListener(
    "change",
    () => atualizarEditorRaridade()
  );

  el.arteEditarSelect.addEventListener(
    "change",
    () => {
      atualizarInfoEditorRaridade();
      const primeiroId = idsSelecionadosEdicao()[0] || '';
      if (primeiroId) {
        previewArteId = primeiroId;
        mostrarPrimeiraArte();
      }
    }
  );

  el.btnSelecionarFiltradas.addEventListener(
    "click",
    () => {
      [...el.arteEditarSelect.options].forEach(opcao => {
        if (opcao.value) opcao.selected = true;
      });
      atualizarInfoEditorRaridade();
      const primeiroId = idsSelecionadosEdicao()[0] || '';
      if (primeiroId) {
        previewArteId = primeiroId;
        mostrarPrimeiraArte();
      }
    }
  );

  el.btnLimparSelecaoArtes.addEventListener(
    "click",
    () => {
      [...el.arteEditarSelect.options].forEach(opcao => {
        opcao.selected = false;
      });
      atualizarInfoEditorRaridade();
    }
  );

  el.btnAlterarRaridade.addEventListener(
    "click",
    () => alterarRaridadeSelecionada().catch(erro => {
      console.error(erro);
      mostrarToast(erro.message || "Não foi possível alterar a raridade.", true);
    })
  );

  el.btnExcluirArte.addEventListener(
    "click",
    () => excluirArteSelecionada().catch(erro => {
      console.error(erro);
      mostrarToast(erro.message || "Não foi possível excluir a figurinha.", true);
    })
  );

  el.btnLimparArtes.addEventListener(
    "click",
    async () => {
      if (!artes.length) return;

      if (!confirm(
        "Remover TODAS as artes da sessão e também do salvamento automático? Essa ação não pode ser desfeita."
      )) return;

      try {
        await limparArtesPersistentes();
        artes = [];
        previewArteId = "";
        revogarPreviewAnterior();
        atualizarTudo();
        await atualizarStatusPersistencia('ok');
        mostrarToast("Artes removidas da sessão e do salvamento persistente.");
      } catch (erro) {
        console.error(erro);
        mostrarToast(erro.message || "Não foi possível limpar o projeto salvo.", true);
      }
    }
  );

  el.btnSalvarAgora.addEventListener(
    "click",
    async () => {
      try {
        salvarConfigSilencioso();
        salvarOverridesRaridade();
        await solicitarPersistenciaArmazenamento();
        await salvarTodasArtesPersistentes();
        mostrarToast(`Projeto salvo: ${formatarNumero(artes.length)} arte(s).`);
      } catch (erro) {
        console.error(erro);
        atualizarStatusPersistencia('erro');
        mostrarToast(erro.message || "Não foi possível salvar o projeto.", true);
      }
    }
  );

  el.btnBackupProjeto.addEventListener(
    "click",
    baixarBackupProjeto
  );

  el.btnRestaurarBackup.addEventListener(
    "click",
    () => el.inputRestaurarBackup.click()
  );

  el.inputRestaurarBackup.addEventListener(
    "change",
    event => {
      const file = event.target.files?.[0];
      restaurarBackupProjeto(file).catch(erro => {
        console.error(erro);
        mostrarToast(erro.message || "Não foi possível restaurar o backup.", true);
      }).finally(() => {
        el.inputRestaurarBackup.value = "";
      });
    }
  );

  el.btnExportarPlano.addEventListener(
    "click",
    exportarPlanoCsv
  );

  [
    el.totalProducao,
    el.nomeProjeto,
    el.codigoProjeto,
    el.urlValidacao,
  ].forEach(campo => {
    campo.addEventListener(
      "change",
      atualizarTudo
    );
  });

  [
    el.qrTamanho,
    el.qrRespiro,
    el.qrX,
    el.qrY,
    el.qrRaio,
    el.qrEspessuraBorda,
  ].forEach(campo => {
    campo.addEventListener(
      "input",
      () => {
        atualizarPreviewQr();
        salvarConfigSilencioso();
      }
    );
  });

  [
    [el.qrCorEscura, el.qrCorEscuraTexto, '#000000'],
    [el.qrCorClara, el.qrCorClaraTexto, '#FFFFFF'],
    [el.qrCorMoldura, el.qrCorMolduraTexto, '#FFFFFF'],
    [el.qrCorBorda, el.qrCorBordaTexto, '#5A8CFF'],
  ].forEach(([inputCor, inputTexto, fallback]) => {
    inputCor.addEventListener('input', () => {
      sincronizarCampoCor(inputCor, inputTexto, fallback);
      atualizarPreviewQr();
      salvarConfigSilencioso();
    });

    inputTexto.addEventListener('change', () => {
      sincronizarCampoCor(inputCor, inputTexto, fallback);
      atualizarPreviewQr();
      salvarConfigSilencioso();
    });
  });

  el.qrPresetVisual.addEventListener('change', () => {
    aplicarPresetQr(el.qrPresetVisual.value);
    atualizarPreviewQr();
    salvarConfigSilencioso();
  });

  document
    .querySelectorAll(".preset")
    .forEach(botao => {
      botao.addEventListener(
        "click",
        () => aplicarPreset(
          botao.dataset.pos
        )
      );
    });

  [
    el.formatoPapel,
    el.larguraFigurinha,
    el.alturaFigurinha,
    el.espacoFigurinhas,
    el.qualidadeImagem,
    el.marcasCorte,
  ].forEach(campo => {
    campo.addEventListener(
      "change",
      () => {
        atualizarPreviewQr();
        atualizarLayout();
        salvarConfigSilencioso();
      }
    );
  });

  [
    el.tamanhoLote,
    el.numeroLote,
  ].forEach(campo => {
    campo.addEventListener(
      "input",
      () => {
        atualizarResumoLote();
        salvarConfigSilencioso();
      }
    );
  });

  el.modoOrdem.addEventListener(
    "change",
    atualizarAvisoModo
  );

  el.btnLoteAnterior.addEventListener(
    "click",
    () => {
      el.numeroLote.value =
        Math.max(
          1,
          inteiro(el.numeroLote, 1) - 1
        );

      atualizarResumoLote();
      salvarConfigSilencioso();
    }
  );

  el.btnProximoLote.addEventListener(
    "click",
    () => {
      const intervalo =
        obterIntervaloAtual();

      el.numeroLote.value =
        Math.min(
          intervalo.totalLotes,
          intervalo.lote + 1
        );

      atualizarResumoLote();
      salvarConfigSilencioso();
    }
  );

  el.btnTestarToken.addEventListener(
    "click",
    testarPrimeiroQr
  );

  el.btnCsvLote.addEventListener(
    "click",
    baixarCsvLote
  );

  el.btnPdfTeste.addEventListener(
    "click",
    gerarPdfTeste
  );

  el.btnGerarPdf.addEventListener(
    "click",
    gerarPdfLote
  );

  el.previewQr.addEventListener(
    "pointerdown",
    iniciarArrastoQr
  );

  window.addEventListener(
    "pointermove",
    moverQr
  );

  window.addEventListener(
    "pointerup",
    fimArrastoQr
  );

  el.previewArteSelect.addEventListener(
    "change",
    () => {
      previewArteId = el.previewArteSelect.value;
      if (el.arteEditarSelect && [...el.arteEditarSelect.options].some(opcao => opcao.value === previewArteId)) {
        el.arteEditarSelect.value = previewArteId;
        atualizarInfoEditorRaridade();
      }
      mostrarPrimeiraArte();
    }
  );

  el.btnPreviewAnterior.addEventListener(
    "click",
    () => navegarPreview(-1)
  );

  el.btnPreviewProxima.addEventListener(
    "click",
    () => navegarPreview(1)
  );

  async function inicializarSistema() {
    carregarConfig();
    if (el.avisoModoLocal) {
      el.avisoModoLocal.hidden = location.protocol !== "file:";
    }
    sincronizarCampoCor(el.qrCorEscura, el.qrCorEscuraTexto, '#000000');
    sincronizarCampoCor(el.qrCorClara, el.qrCorClaraTexto, '#FFFFFF');
    sincronizarCampoCor(el.qrCorMoldura, el.qrCorMolduraTexto, '#FFFFFF');
    sincronizarCampoCor(el.qrCorBorda, el.qrCorBordaTexto, '#5A8CFF');
    atualizarAvisoModo();

    try {
      el.statusPersistencia.textContent = 'Recuperando projeto salvo...';
      const recuperadas = await carregarArtesPersistentes();
      atualizarTudo();
      await atualizarStatusPersistencia('ok');
      if (recuperadas > 0) {
        mostrarToast(`${formatarNumero(recuperadas)} arte(s) recuperada(s) automaticamente.`);
      }
    } catch (erro) {
      console.error(erro);
      atualizarTudo();
      await atualizarStatusPersistencia('erro');
      mostrarToast('O sistema abriu, mas não conseguiu acessar o salvamento persistente.', true);
    }
  }

  inicializarSistema();
})();
