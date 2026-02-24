/**
 * Converte string ou número para número, retorna 0 se inválido
 */
export const toNumber = (valor: any): number => {
  if (typeof valor === "number") return valor;
  if (typeof valor === "string") {
    let limpo = valor.trim();
    if (limpo.includes(",")) {
      limpo = limpo.replace(/\./g, "").replace(",", ".");
    }
    const num = Number(limpo.replace(/[^\d.-]/g, ""));
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

export const formatarCodigoFrete = (
  value?: string | number | null,
  dataFrete?: string | Date | null,
  fallbackSeq?: number
): string => {
  const raw = String(value ?? "").trim();
  const parsedDate = dataFrete ? new Date(dataFrete) : new Date();
  const year = Number.isNaN(parsedDate.getTime()) ? new Date().getFullYear() : parsedDate.getFullYear();

  if (raw) {
    const matchFrete = raw.match(/^FRETE-(\d{4})-(\d{1,})$/i);
    if (matchFrete) {
      return `FRETE-${matchFrete[1]}-${matchFrete[2].padStart(3, "0")}`;
    }

    const numericId = raw.match(/^\d+$/);
    if (numericId) {
      return `FRETE-${year}-${raw.padStart(3, "0")}`;
    }

    return raw.toUpperCase();
  }

  if (typeof fallbackSeq === "number") {
    return `FRETE-${year}-${String(fallbackSeq).padStart(3, "0")}`;
  }

  return "";
};
// --- FORMATAÇÕES ---

export const formatarCPF = (valor: string): string => {
  if (!valor) return '';
  const limpo = valor.replace(/\D/g, '');
  return limpo
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .substring(0, 14);
};

export const formatarCNPJ = (valor: string): string => {
  if (!valor) return '';
  const limpo = valor.replace(/\D/g, '');
  return limpo
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    .substring(0, 18);
};

/**
 * Formata documento (CPF ou CNPJ) dependendo do tamanho dos dígitos.
 * Se tiver até 11 dígitos -> CPF, senão CNPJ.
 */
export const formatarDocumento = (valor: string | undefined | null): string => {
  if (!valor) return '';
  const limpo = String(valor).replace(/\D/g, '');
  if (limpo.length <= 11) return formatarCPF(limpo);
  return formatarCNPJ(limpo);
};

export const formatarTelefone = (valor: string): string => {
  const limpo = valor.replace(/\D/g, '');
  if (limpo.length <= 10) {
    // Formato: (00) 0000-0000
    return limpo
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 14);
  } else {
    // Formato: (00) 00000-0000
    return limpo
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  }
};

export const formatarCEP = (valor: string): string => {
  const limpo = valor.replace(/\D/g, '');
  return limpo
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 9);
};

export const apenasNumeros = (valor: string): string => {
  return valor.replace(/\D/g, '');
};

export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

/**
 * Formata input de moeda em tempo real (enquanto digita)
 * @param valor String digitada pelo usuário
 * @returns String formatada como moeda brasileira
 */
export const formatarInputMoeda = (valor: string): string => {
  // Remove tudo que não é número
  const apenasNumeros = valor.replace(/\D/g, '');

  if (!apenasNumeros) return '';

  // Converte para número considerando centavos
  const valorNumerico = Number(apenasNumeros) / 100;

  // Formata como moeda brasileira
  return valorNumerico.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Converte string formatada como moeda para número
 * @param valorFormatado String formatada (ex: "1.234,56")
 * @returns Número (ex: 1234.56)
 */
export const desformatarMoeda = (valorFormatado: string): number => {
  if (!valorFormatado) return 0;

  // Remove pontos de milhar e substitui vírgula por ponto
  const valorLimpo = valorFormatado
    .replace(/\./g, '')
    .replace(',', '.');

  return Number(valorLimpo) || 0;
};

export const formatarData = (data: string): string => {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
};

// --- VALIDAÇÕES ---

export const validarEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validarCPF = (cpf: string): boolean => {
  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11 || /^(\d)\1+$/.test(limpo)) return false;

  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(limpo.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(limpo.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.substring(10, 11))) return false;

  return true;
};

export const validarCNH = (cnh: string): boolean => {
  const limpo = cnh.replace(/\D/g, '');
  return limpo.length === 11; // Validação básica de comprimento
};

export const validarTelefone = (telefone: string): boolean => {
  const limpo = telefone.replace(/\D/g, '');
  return limpo.length === 10 || limpo.length === 11;
};

export const validarCEP = (cep: string): boolean => {
  const limpo = cep.replace(/\D/g, '');
  return limpo.length === 8;
};

/**
 * Converte data de formato ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss) 
 * para formato brasileiro (DD/MM/YYYY)
 * @param dataISO Data em formato ISO
 * @returns Data em formato DD/MM/YYYY
 */
export const formatarDataBrasileira = (dataISO: string | undefined): string => {
  if (!dataISO) return '';

  // Remove a hora se existir (YYYY-MM-DDTHH:mm:ss → YYYY-MM-DD)
  const dataLimpa = dataISO.split('T')[0];

  // Divide em partes: YYYY-MM-DD
  const [ano, mes, dia] = dataLimpa.split('-');

  // Retorna em formato DD/MM/YYYY
  return `${dia}/${mes}/${ano}`;
};

/**
 * Converta data de formato brasileiro (DD/MM/YYYY) 
 * para formato ISO (YYYY-MM-DD)
 * @param dataBrasileira Data em formato DD/MM/YYYY
 * @returns Data em formato YYYY-MM-DD
 */
export const converterDataBrasileira = (dataBrasileira: string): string => {
  if (!dataBrasileira) return '';

  // Remove caracteres especiais
  const limpa = dataBrasileira.replace(/\D/g, '');

  if (limpa.length !== 8) return '';

  // Divide: DD MM YYYY (posições 0-1, 2-3, 4-7)
  const dia = limpa.substring(0, 2);
  const mes = limpa.substring(2, 4);
  const ano = limpa.substring(4, 8);

  // Retorna em formato YYYY-MM-DD
  return `${ano}-${mes}-${dia}`;
};

/**
 * Formata toneladas em tempo real (enquanto digita)
 * Ex: "48200" vira "48.200 kg" (exibição para referência, mas mantém valor numérico)
 * @param valor String digitada pelo usuário (apenas números)
 * @returns String formatada com separador de milhar e "kg"
 */
export const formatarToneladas = (valor: string): string => {
  const apenasNumeros = valor.replace(/\D/g, '');
  if (!apenasNumeros) return '';

  // Formata como número com separador de milhar
  return Number(apenasNumeros).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

/**
 * Formata valor da tonelada com vírgula decimal
 * Ex: "150" vira "150,00"
 * @param valor String digitada pelo usuário
 * @returns String formatada com vírgula decimal
 */
export const formatarValorPorTonelada = (valor: string): string => {
  const apenasNumeros = valor.replace(/\D/g, '');
  if (!apenasNumeros) return '';

  // Converte para número considerando centavos se houver
  const valorNumerico = Number(apenasNumeros) / 100;

  // Formata com 2 casas decimais
  return valorNumerico.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// --- LOGÍSTICA E PAGAMENTOS ---

export const formatDateBR = (value: string | undefined | null): string => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  // Fallback simple format avoiding date-fns dependency if possible, or assume simple logic:
  const day = String(parsed.getDate() + 1).padStart(2, "0"); // +1 timezone compensation if needed, better to use the lib, but let's keep it simple here or just use standard formatting.
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatPeriodoFretes = (periodo: string): string => {
  if (!periodo) return "";
  const match = periodo.match(/^(\d{2})-(\d{2})\/(\d{2}\/\d{4})$/);
  if (match && match[1] === match[2]) {
    return `${match[2]}/${match[3]}`;
  }
  const match2 = periodo.match(/^(\d{2}) a (\d{2}) de (.+)$/);
  if (match2 && match2[1] === match2[2]) {
    return `${match2[2]} de ${match2[3]}`;
  }
  return periodo;
};

export const toApiDate = (value: string): string => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parts = value.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return value;
};

export const parseBRDateToLocalDate = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const [day, month, year] = String(value).split("/").map(Number);
  if (!day || !month || !year) return undefined;
  const localDate = new Date(year, month - 1, day);
  return Number.isNaN(localDate.getTime()) ? undefined : localDate;
};

export const abreviarRota = (nome: string): string => {
  if (!nome) return "";
  let txt = nome.replace(/[\u200B-\u200D\uFEFF]/g, '');

  txt = txt.replace(/secagem\s*e\s*armazenagem/gi, " ");
  txt = txt.replace(/secagemearmazenagem/gi, " ");
  txt = txt.replace(/secagem/gi, " ");
  txt = txt.replace(/armazenagem/gi, " ");

  txt = txt.split('-').map(part => {
    let p = part.trim();
    let previous = "";
    while (p !== previous) {
      previous = p;
      p = p.replace(/(^|\s)([\wÀ-ÿ])\s+([\wÀ-ÿ])(?=\s|$|[.,!?;])/g, "$1$2$3");
    }
    p = p.replace(/\s+([.,!?:;\\/|])/g, "$1");
    p = p.replace(/(\.{2,})([A-Za-zÀ-ÿ0-9])/g, "$1 $2");
    return p.replace(/\s+/g, ' ').trim();
  }).join(' - ');

  txt = txt.replace(/Faz[\.\s]*\.\.+/gi, "Faz.");
  txt = txt.replace(/fazenda/gi, "Faz.");
  txt = txt.replace(/\bfaz\b/gi, "Faz.");
  txt = txt.replace(/Faz\.\s*(?=[A-Za-zÀ-ÿ0-9])/gi, "Faz. ");
  txt = txt.replace(/filial/gi, "Filial ");
  return txt;
};

export const fieldErrorClass = (hasError?: string | boolean) =>
  hasError ? "border-red-500 focus-visible:ring-red-500 bg-red-50 dark:bg-red-950/20" : "";

export const getTodayInputDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const parseLocalInputDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);
  return Number.isNaN(localDate.getTime()) ? undefined : localDate;
};

export const normalizeInputDate = (value?: string) => {
  if (!value) return getTodayInputDate();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (value.includes("/")) {
    const [dia, mes, ano] = value.split("/");
    const parsed = new Date(Number(ano), Number(mes) - 1, Number(dia));
    return Number.isNaN(parsed.getTime()) ? getTodayInputDate() : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
  }
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? parseLocalInputDate(value) || new Date("")
    : new Date(value);
  return Number.isNaN(parsed.getTime()) ? getTodayInputDate() : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
};

export const normalizeFreteRef = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const isCustoFromFrete = (
  custoFreteId: unknown,
  freteId: unknown,
  codigoFrete?: unknown
) => {
  const custoRaw = String(custoFreteId || "").trim();
  const idRaw = String(freteId || "").trim();
  const codigoRaw = String(codigoFrete || "").trim();

  if (!custoRaw || !idRaw) return false;

  const custoLower = custoRaw.toLowerCase();
  const idLower = idRaw.toLowerCase();
  const codigoLower = codigoRaw.toLowerCase();

  if (custoLower === idLower) return true;
  if (codigoLower && custoLower === codigoLower) return true;

  const custoNorm = normalizeFreteRef(custoRaw);
  const idNorm = normalizeFreteRef(idRaw);
  const codigoNorm = normalizeFreteRef(codigoRaw);

  if (custoNorm === idNorm || (Boolean(codigoNorm) && custoNorm === codigoNorm)) return true;

  // Tentativa extra: comparar anos + sequência quando formatos diferem (ex: FRT-2026-081 vs FRETE-2026-081)
  const extractYearSeq = (s: string) => {
    const m = s.match(/(\d{4})[^\d]*(\d{1,})$/);
    if (!m) return null;
    return { year: m[1], seq: m[2].padStart(3, "0") };
  };

  try {
    const c = extractYearSeq(custoRaw);
    const a = extractYearSeq(idRaw) || extractYearSeq(codigoRaw);
    if (c && a && c.year === a.year && c.seq === a.seq) return true;
  } catch (e) {
    // ignore
  }

  return false;
};

export const formatDateBRDisplay = (value: string) => {
  if (!value) return "";
  const date = parseBRDateToLocalDate(value);
  if (!date || isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const formatFreteCodigo = (frete: any) => {
  return frete.codigoFrete || frete.id?.split("-").pop() || "";
};
