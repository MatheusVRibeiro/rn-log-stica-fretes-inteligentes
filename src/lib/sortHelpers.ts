/**
 * Ordena motoristas alfabeticamente por nome
 */
export const sortMotoristasPorNome = (motoristas: any[]): any[] => {
  if (!Array.isArray(motoristas)) return [];
  return [...motoristas].sort((a, b) => {
    const nomeA = (a.nome || "").toLowerCase().trim();
    const nomeB = (b.nome || "").toLowerCase().trim();
    return nomeA.localeCompare(nomeB, "pt-BR");
  });
};

/**
 * Ordena fazendas alfabeticamente por nome
 */
export const sortFazendasPorNome = (fazendas: any[]): any[] => {
  if (!Array.isArray(fazendas)) return [];
  return [...fazendas].sort((a, b) => {
    const nomeA = (a.nome || a.fazenda || "").toLowerCase().trim();
    const nomeB = (b.nome || b.fazenda || "").toLowerCase().trim();
    return nomeA.localeCompare(nomeB, "pt-BR");
  });
};

/**
 * Ordena caminhões alfabeticamente por placa
 */
export const sortCaminhoesporPlaca = (caminhoes: any[]): any[] => {
  if (!Array.isArray(caminhoes)) return [];
  return [...caminhoes].sort((a, b) => {
    const placaA = (a.placa || "").toLowerCase().trim();
    const placaB = (b.placa || "").toLowerCase().trim();
    return placaA.localeCompare(placaB, "pt-BR");
  });
};
