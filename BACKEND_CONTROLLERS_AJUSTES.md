# 🔧 Ajustes Necessários nos Controllers do Backend

---

## ✅ Integridade Relacional — Deletes Transacionais (4 pontos críticos)

Esses 4 casos são clássicos de integridade relacional: ao remover um registro pai sem tratar vínculos/filhos, o sistema mantém dados inválidos e agregados inconsistentes.

### 1) `FreteController.deletar`

**Problema**
- Excluir frete sem excluir custos por `frete_id` gera custos órfãos.
- Não reverter `fazendas.total_toneladas` e `fazendas.faturamento_total` mantém acumulados incorretos.

**Impacto**
- Relatórios inflados de custos e operação.
- Fazenda mantém volume/receita de frete já removido.

**Fluxo correto (transação atômica)**
1. Buscar frete
2. Excluir custos filhos (`custos.frete_id = frete.id`)
3. Excluir frete
4. Reverter acumulados da fazenda
5. `commit` (ou `rollback` em erro)

### 2) `PagamentoController.deletar`

**Problema**
- Deletar pagamento sem limpar `fretes.pagamento_id`.

**Impacto**
- Fretes ficam “presos” a pagamento inexistente.
- Não voltam para a fila de pendentes (bloqueio operacional).

**Fluxo correto (transação)**
1. Atualizar fretes vinculados: `pagamento_id = NULL`
2. Excluir pagamento
3. `commit` (ou `rollback` em erro)

### 3) `MotoristaController.deletar`

**Problema**
- Excluir motorista sem limpar `frota.motorista_fixo_id`.

**Impacto**
- Veículos apontam para motorista inexistente.
- Listagens e regras de vínculo/disponibilidade ficam inconsistentes.

**Fluxo correto (transação)**
1. Desvincular veículos: `motorista_fixo_id = NULL`
2. Excluir motorista
3. `commit` (ou `rollback` em erro)

### 4) `FrotaController.deletar`

**Problema**
- Excluir caminhão sem limpar `fretes.caminhao_id`/`fretes.caminhao_placa`.

**Impacto**
- Fretes referenciam caminhão inexistente.
- Quebra de rastreabilidade, inconsistência em telas e consultas com `JOIN`.

**Fluxo correto (transação)**
1. Desassociar fretes do caminhão removido
2. Excluir caminhão
3. `commit` (ou `rollback` em erro)

### Padrão obrigatório para os 4 deletes

1. Verificar existência do registro
2. Limpar dependências relacionais
3. Excluir registro principal
4. `commit`
5. Em erro: `rollback`
6. `release` da conexão no `finally`

---

## 🚨 BUG ATIVO — DELETE/POST/PUT `/custos` não atualiza `fretes.custos`

### Problema
O campo `fretes.custos` armazena a soma de todos os custos vinculados a um frete. Porém, ao **criar**, **editar** ou **excluir** um custo, o backend não atualiza esse campo na tabela `fretes`. Resultado: o saldo de custos do frete fica desatualizado.

O frontend possui workaround que busca o frete e recalcula via `PUT /fretes/:id`, mas a correção ideal é no backend para garantir atomicidade.

---

### ✅ Correção no Controller `custosController.js`

#### DELETE `/custos/:id` — subtrair da frete ao excluir

```javascript
async deletarCusto(req, res) {
  try {
    const { id } = req.params;

    // 1. Busca o custo para saber o valor e o frete vinculado
    const [rows] = await db.query(`SELECT frete_id, valor FROM custos WHERE id = ?`, [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: "Custo não encontrado" });
    }
    const { frete_id, valor } = rows[0];

    // 2. Deleta o custo
    await db.query(`DELETE FROM custos WHERE id = ?`, [id]);

    // 3. Atualiza custos e resultado do frete
    await db.query(
      `UPDATE fretes
       SET
         custos    = GREATEST(0, custos - ?),
         resultado = receita - GREATEST(0, custos - ?),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [valor, valor, frete_id]
    );

    return res.json({ success: true, message: "Custo removido com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar custo:", error);
    return res.status(500).json({ success: false, message: "Erro ao deletar custo" });
  }
}
```

#### POST `/custos` — somar à frete ao criar

```javascript
// Após inserir o custo na tabela custos:
await db.query(
  `UPDATE fretes
   SET
     custos    = custos + ?,
     resultado = receita - (custos + ?),
     updated_at = CURRENT_TIMESTAMP
   WHERE id = ?`,
  [valor, valor, frete_id]
);
```

#### PUT `/custos/:id` — ajustar diferença ao editar

```javascript
// Antes: buscar valor antigo do custo
const [old] = await db.query(`SELECT valor FROM custos WHERE id = ?`, [id]);
const diferenca = novoValor - old[0].valor;

// Após atualizar o custo:
await db.query(
  `UPDATE fretes
   SET
     custos    = GREATEST(0, custos + ?),
     resultado = receita - GREATEST(0, custos + ?),
     updated_at = CURRENT_TIMESTAMP
   WHERE id = ?`,
  [diferenca, diferenca, frete_id]
);
```

#### PUT `/fretes/:id` — endpoint necessário para o workaround frontend

O frontend precisa desse endpoint para atualizar `custos` e `resultado` manualmente. Certifique-se de que existe:

```javascript
async atualizarFrete(req, res) {
  try {
    const { id } = req.params;
    const { custos, resultado, ...outrosCampos } = req.body;

    const campos = [];
    const valores = [];

    if (custos !== undefined)    { campos.push("custos = ?");    valores.push(Number(custos)); }
    if (resultado !== undefined) { campos.push("resultado = ?"); valores.push(Number(resultado)); }
    // Adicione outros campos editáveis conforme necessário

    if (campos.length === 0) {
      return res.status(400).json({ success: false, message: "Nenhum campo para atualizar" });
    }

    campos.push("updated_at = CURRENT_TIMESTAMP");
    valores.push(id);

    await db.query(`UPDATE fretes SET ${campos.join(", ")} WHERE id = ?`, valores);

    const [freteAtualizado] = await db.query(`SELECT * FROM fretes WHERE id = ?`, [id]);

    return res.json({
      success: true,
      message: "Frete atualizado com sucesso",
      data: freteAtualizado[0] ?? freteAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar frete:", error);
    return res.status(500).json({ success: false, message: "Erro ao atualizar frete" });
  }
}
```

---

## 🚨 BUG ATIVO — POST `/fazendas/:id/incrementar-volume`

### Problema
O frontend envia `{ toneladas, sacas, faturamento }` mas o backend só está incrementando `total_toneladas`.  
Resultado: `total_sacas_carregadas` e `faturamento_total` nunca sobem nos cards da fazenda.

### Payload recebido pelo backend (o que o frontend ENVIA)
```json
{
  "toneladas": 20.0,
  "sacas": 800,
  "faturamento": 4000.00
}
```

### ❌ SQL atual (incorreto)
```sql
UPDATE fazendas
SET total_toneladas = total_toneladas + ?
WHERE id = ?
```

### ✅ SQL correto (aplicar agora)
```sql
UPDATE fazendas
SET
  total_toneladas        = total_toneladas        + ?,
  total_sacas_carregadas = total_sacas_carregadas + ?,
  faturamento_total      = faturamento_total      + ?,
  ultimo_frete           = CURDATE(),
  updated_at             = CURRENT_TIMESTAMP
WHERE id = ?
-- params: [toneladas, sacas, faturamento, id]
```

### ✅ Controller correto — `fazendasController.js`
```javascript
async incrementarVolume(req, res) {
  try {
    const { id } = req.params;
    const { toneladas, sacas = 0, faturamento = 0 } = req.body;

    if (!toneladas || isNaN(Number(toneladas))) {
      return res.status(400).json({ success: false, message: "Campo 'toneladas' é obrigatório" });
    }

    await db.query(
      `UPDATE fazendas
       SET
         total_toneladas        = total_toneladas        + ?,
         total_sacas_carregadas = total_sacas_carregadas + ?,
         faturamento_total      = faturamento_total      + ?,
         ultimo_frete           = CURDATE(),
         updated_at             = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [Number(toneladas), Number(sacas), Number(faturamento), id]
    );

    const [fazenda] = await db.query(`SELECT * FROM fazendas WHERE id = ?`, [id]);

    return res.json({
      success: true,
      message: "Volume incrementado com sucesso",
      data: fazenda[0] ?? fazenda
    });
  } catch (error) {
    console.error("Erro ao incrementar volume:", error);
    return res.status(500).json({ success: false, message: "Erro ao incrementar volume" });
  }
}
```

### ✅ Validação Zod/Joi (se usar schema validation)
```javascript
// Zod
const incrementarSchema = z.object({
  toneladas:  z.number().positive(),
  sacas:      z.number().int().min(0).optional().default(0),
  faturamento: z.number().min(0).optional().default(0),
});

// Joi
const incrementarSchema = Joi.object({
  toneladas:   Joi.number().positive().required(),
  sacas:       Joi.number().integer().min(0).default(0),
  faturamento: Joi.number().min(0).default(0),
});
```

---

## 📊 Controller de Fazendas - CRÍTICO

### ✅ O que adicionar no GET `/fazendas`

**Arquivo:** `backend/controllers/fazendasController.js` (ou similar)

```javascript
// Exemplo de implementação
async listarFazendas(req, res) {
  try {
    const query = `
      SELECT 
        f.*,
        COALESCE(SUM(p.quantidade_sacas), 0) as total_sacas_carregadas,
        COALESCE(SUM(p.quantidade_sacas * 25 / 1000), 0) as total_toneladas,
        COALESCE(SUM(p.faturamento_total), 0) as faturamento_total,
        COUNT(p.id) as total_producoes
      FROM fazendas f
      LEFT JOIN producoes p ON p.fazenda_id = f.id
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `;
    
    const fazendas = await db.query(query);
    
    return res.json({
      success: true,
      message: "Fazendas listadas com sucesso",
      data: fazendas
    });
  } catch (error) {
    console.error("Erro ao listar fazendas:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao listar fazendas"
    });
  }
}
```

### 📋 Campos obrigatórios que devem retornar:

```javascript
{
  id: number,
  nome: string,
  localizacao: string,
  total_sacas_carregadas: number,  // ⚠️ CAMPO CRÍTICO (soma das produções)
  total_toneladas: number,          // Opcional: (total_sacas * 25) / 1000
  faturamento_total: number,        // Opcional: soma dos faturamentos
  total_producoes: number,          // Opcional: quantidade de produções
  created_at: string,
  updated_at: string
}
```

---

## 🚚 Controller de Fretes - OPCIONAL (mas recomendado)

### ✅ O que adicionar no GET `/fretes`

**Arquivo:** `backend/controllers/fretesController.js`

```javascript
async listarFretes(req, res) {
  try {
    const query = `
      SELECT 
        f.*,
        m.nome as motorista_nome,
        c.placa as caminhao_placa
      FROM fretes f
      LEFT JOIN motoristas m ON m.id = f.motorista_id
      LEFT JOIN caminhoes c ON c.id = f.caminhao_id
      ORDER BY f.data_frete DESC
    `;
    
    const fretes = await db.query(query);
    
    return res.json({
      success: true,
      message: "Fretes listados com sucesso",
      data: fretes
    });
  } catch (error) {
    console.error("Erro ao listar fretes:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao listar fretes"
    });
  }
}
```

### 📋 Campos obrigatórios que devem retornar:

```javascript
{
  id: number,
  data_frete: string,           // ISO 8601: "2025-01-15T10:30:00Z"
  quantidade_sacas: number,
  toneladas: number,
  receita: number,
  custos: number,
  resultado: number,            // ou calcula: receita - custos
  motorista_id: number,
  motorista_nome: string,       // JOIN com tabela motoristas
  caminhao_id: number,
  caminhao_placa: string,       // JOIN com tabela caminhoes
  origem: string,
  destino: string,
  created_at: string,
  updated_at: string
}
```

---

## 🔄 Melhorias Opcionais no Backend

### 1. Adicionar campo `status` nos fretes (OPCIONAL)

```sql
-- Adicionar coluna status à tabela fretes
ALTER TABLE fretes 
ADD COLUMN status VARCHAR(20) DEFAULT 'concluido'
CHECK (status IN ('em_transito', 'concluido', 'pendente', 'cancelado'));

-- Atualizar fretes recentes para 'em_transito'
UPDATE fretes 
SET status = 'em_transito' 
WHERE data_frete >= CURRENT_DATE - INTERVAL '7 days'
  AND data_frete <= CURRENT_DATE;
```

### 2. Endpoint de Estatísticas Dashboard (RECOMENDADO)

Criar um endpoint específico para estatísticas:

```javascript
// GET /api/dashboard/stats
async getDashboardStats(req, res) {
  try {
    const stats = await db.query(`
      SELECT 
        -- Fretes do mês atual
        (SELECT COUNT(*) FROM fretes 
         WHERE EXTRACT(MONTH FROM data_frete) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(YEAR FROM data_frete) = EXTRACT(YEAR FROM CURRENT_DATE)) as fretes_mes_atual,
        
        (SELECT COALESCE(SUM(quantidade_sacas), 0) FROM fretes 
         WHERE EXTRACT(MONTH FROM data_frete) = EXTRACT(MONTH FROM CURRENT_DATE)) as sacas_mes_atual,
        
        (SELECT COALESCE(SUM(receita), 0) FROM fretes 
         WHERE EXTRACT(MONTH FROM data_frete) = EXTRACT(MONTH FROM CURRENT_DATE)) as receita_mes_atual,
        
        (SELECT COALESCE(SUM(custos), 0) FROM fretes 
         WHERE EXTRACT(MONTH FROM data_frete) = EXTRACT(MONTH FROM CURRENT_DATE)) as custos_mes_atual,
        
        -- Fretes do mês anterior
        (SELECT COALESCE(SUM(quantidade_sacas), 0) FROM fretes 
         WHERE EXTRACT(MONTH FROM data_frete) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')) as sacas_mes_anterior,
        
        -- Total de fazendas
        (SELECT COUNT(*) FROM fazendas) as total_fazendas,
        
        -- Total de sacas em estoque
        (SELECT COALESCE(SUM(quantidade_sacas), 0) FROM producoes) as total_sacas_estoque
    `);
    
    return res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar estatísticas"
    });
  }
}
```

---

## 📋 Checklist de Implementação

### ✅ Prioridade ALTA (Necessário para dashboard funcionar):
- [ ] **Fazendas Controller**: Adicionar campo `total_sacas_carregadas` (agregado de produções)
- [ ] **Fazendas Controller**: Retornar JOIN com tabela `producoes` para calcular totais
- [ ] **Fretes Controller**: Garantir que `data_frete` seja retornada em formato ISO

### ⚙️ Prioridade MÉDIA (Recomendado):
- [ ] **Fretes Controller**: Adicionar JOIN com `motoristas` para retornar `motorista_nome`
- [ ] **Fretes Controller**: Adicionar JOIN com `caminhoes` para retornar `caminhao_placa`
- [ ] **Fretes Controller**: Campo `resultado` calculado (se não existir na tabela)

### 🎯 Prioridade BAIXA (Opcional):
- [ ] Adicionar coluna `status` na tabela `fretes`
- [ ] Criar endpoint `/api/dashboard/stats` para estatísticas agregadas
- [ ] Adicionar cache/otimização de queries com índices

---

## 🧪 Teste dos Endpoints

### Teste Fazendas:
```bash
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://192.168.0.174:3000/fazendas
```

**Esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "Fazenda São João",
      "total_sacas_carregadas": 150000,  // ⚠️ Deve existir
      "total_toneladas": 3750,
      "faturamento_total": 4500000
    }
  ]
}
```

### Teste Fretes:
```bash
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://192.168.0.174:3000/fretes
```

**Esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "data_frete": "2025-01-15T10:00:00Z",  // ⚠️ ISO format
      "quantidade_sacas": 500,
      "receita": 7500,
      "custos": 1800,
      "resultado": 5700,
      "motorista_nome": "Carlos Silva"
    }
  ]
}
```

---

## 📌 Resumo Executivo

**O que é OBRIGATÓRIO implementar agora:**
1. ✅ Controller de Fazendas: agregar `total_sacas_carregadas` das produções
2. ✅ Garantir que `data_frete` retorna em formato ISO String

**O que é OPCIONAL mas melhora muito:**
- Adicionar campo `status` nos fretes
- Criar endpoint de estatísticas agregadas
- Retornar nomes de motoristas e placas nos fretes (JOINs)

---

## 💡 Dúvidas ou Problemas?

Se após implementar ainda não funcionar, verifique:
1. Os nomes dos campos retornados pelo backend (case sensitive!)
2. O formato da data: deve ser string ISO, não timestamp
3. Os valores numéricos não devem ser strings
4. Console do navegador (`F12` → Console) para ver erros
