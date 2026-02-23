import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { abreviarRota } from "../formatters";

export interface PagamentoPDFParams {
    pagamentoId: string;
    motoristaNome: string;
    tipoRelatorio?: "GUIA_INTERNA" | "PAGAMENTO_TERCEIRO";
    fretes: {
        id: string;
        codigo: string;
        dataFrete: string;
        rota: string;
        toneladas: number;
        valorGerado: number;
        valorLiquido: number;
        custosTotal: number;
        custos: { descricao: string; valor: number }[];
    }[];
    totalToneladas: number;
    valorGeradoBruto: number;
    totalCustos: number;
    valorAPagar: number;
    dadosPagamento: {
        metodoLabel: string;
        dadosLabel?: string;
    };
}

export const exportarGuiaPagamentoIndividual = (params: PagamentoPDFParams) => {
    const doc = new jsPDF();
    const isGuiaInterna = params.tipoRelatorio === "GUIA_INTERNA";
    const { dadosPagamento, fretes } = params;

    // Modern header inspired by Fretes PDF (Original Blue version)
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 50, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Transportadora Contelli", 105, 18, { align: "center" });

    doc.setFontSize(16);
    doc.text("GUIA DE PAGAMENTO", 105, 28, { align: "center" });

    // Encontrar o período de fretes
    let periodo = "N/A";
    if (fretes.length > 0) {
        const datasText = fretes.map(f => f.dataFrete).filter(Boolean);
        if (datasText.length > 0) {
            try {
                const datasParseadas = datasText.map(d => {
                    const [ano, mes, dia] = d.split('-');
                    if (ano && mes && dia && ano.length === 4) return new Date(Number(ano), Number(mes) - 1, Number(dia));
                    const [d2, m2, a2] = d.split('/');
                    if (a2 && m2 && d2) return new Date(Number(a2), Number(m2) - 1, Number(d2));
                    return new Date(d);
                }).filter(d => !isNaN(d.getTime()));

                if (datasParseadas.length > 0) {
                    datasParseadas.sort((a, b) => a.getTime() - b.getTime());
                    const min = format(datasParseadas[0], "dd/MM/yyyy");
                    const max = format(datasParseadas[datasParseadas.length - 1], "dd/MM/yyyy");
                    periodo = min === max ? min : `${min} até ${max}`;
                }
            } catch (e) { /* ignore */ }
        }
    }

    const nomesMotorista = params.motoristaNome.split(" ").filter(Boolean);
    const nomeMotoristaHeader = nomesMotorista.slice(0, 2).join(" ");

    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`Pagamento: ${nomeMotoristaHeader.toUpperCase()} | ${periodo}`, 105, 38, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(191, 219, 254);
    doc.text(`Emitido em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 105, 45, { align: "center" });

    doc.setTextColor(0, 0, 0);
    let yPosition = 56;

    // ==== DADOS DO FAVORECIDO ====
    doc.setFillColor(241, 245, 249);
    doc.rect(15, yPosition, 180, 8, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("DADOS DO FAVORECIDO", 20, yPosition + 5.5);
    yPosition += 12;

    // Caixa de dados do favorecido
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(15, yPosition, 180, 24, 2, 2, "S");
    doc.setTextColor(0, 0, 0);
    let dadosY = yPosition + 7;
    const printField = (label: string, value: string, xPos: number, yPos: number) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(label, xPos, yPos);
        const labelWidth = doc.getTextWidth(label) + 1;
        doc.setFont("helvetica", "normal");
        doc.text(value, xPos + labelWidth, yPos);
        return xPos + labelWidth + doc.getTextWidth(value) + 5;
    };

    printField("Nome:", params.motoristaNome, 20, dadosY);
    dadosY += 6;
    printField("Método:", isGuiaInterna ? "Fechamento Interno" : dadosPagamento.metodoLabel, 20, dadosY);

    if (!isGuiaInterna && dadosPagamento && dadosPagamento.dadosLabel) {
        dadosY += 6;
        let nextX = 20;
        const parts = dadosPagamento.dadosLabel.split("|") || [];
        parts.forEach((p) => {
            const idx = p.indexOf(":");
            if (idx > -1) {
                const l = p.substring(0, idx);
                const v = p.substring(idx + 1);
                if (l && v) nextX = printField(`${l.trim()}:`, v.trim(), nextX, dadosY);
            }
        });
    } else if (isGuiaInterna) {
        dadosY += 6;
        printField("Classificação:", "Custo interno operacional", 20, dadosY);
    }
    yPosition += Math.max(24, dadosY - yPosition + 3);
    yPosition += 4; // spacing before next section (reduced)

    // ==== RESUMO DE PAGAMENTOS ====
    let yResumo = yPosition;

    // Header for Summary
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yResumo, 180, 8, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);

    // Extrair periodo de referencia das datas
    let periodoRef = "";
    if (fretes.length > 0) {
        const datas = fretes
            .map(f => f.dataFrete)
            .filter(d => Boolean(d) && d.length >= 8)
            .map(d => {
                const parts = d.split('/');
                if (parts.length === 3) {
                    // converte dd/MM/yyyy pra yyyy-MM-dd para sorting
                    return { raw: d, dt: new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime() };
                }
                return { raw: d, dt: 0 };
            })
            .filter(d => d.dt > 0)
            .sort((a, b) => a.dt - b.dt);

        if (datas.length > 0) {
            const dMin = datas[0].raw;
            const dMax = datas[datas.length - 1].raw;
            periodoRef = dMin === dMax ? ` (Ref. a ${dMin})` : ` (Ref. a ${dMin} a ${dMax})`;
        }
    }

    doc.text(`RESUMO DE PAGAMENTOS${periodoRef}`, 20, yResumo + 5.5);
    yResumo += 12;

    const totalFretes = fretes.length;

    const drawCard = (x: number, y: number, w: number, h: number, title: string, value: string, bgColor: number[], borderColor: number[], titleColor: number[], valueColor: number[]) => {
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.roundedRect(x, y, w, h, 2, 2, "F");
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.setLineWidth(0.4);
        doc.roundedRect(x, y, w, h, 2, 2, "S");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
        doc.text(title, x + 3, y + 6);
        doc.setFontSize(11);
        doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
        doc.text(value, x + 3, y + 14);
    };

    const cardTotalWidth = 180;
    const gap = 3;
    const cardWidth = (cardTotalWidth - (gap * 4)) / 5;
    const cardH = 20;
    let cX = 15;

    drawCard(cX, yResumo, cardWidth, cardH, "Qtd. Fretes", `${totalFretes} Fretes`, [255, 247, 237], [249, 115, 22], [71, 85, 105], [234, 88, 12]);
    cX += cardWidth + gap;
    drawCard(cX, yResumo, cardWidth, cardH, "Toneladas", `${params.totalToneladas.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).replace(",", ".")} t`, [250, 245, 255], [168, 85, 247], [71, 85, 105], [147, 51, 234]);
    cX += cardWidth + gap;
    drawCard(cX, yResumo, cardWidth, cardH, "Valor Bruto", `R$ ${params.valorGeradoBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, [239, 246, 255], [59, 130, 246], [71, 85, 105], [37, 99, 235]);
    cX += cardWidth + gap;
    const descText = params.totalCustos > 0 ? `-R$ ${params.totalCustos.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `R$ 0,00`;
    drawCard(cX, yResumo, cardWidth, cardH, "Total Descontos", descText, [254, 242, 242], [239, 68, 68], [71, 85, 105], [220, 38, 38]);
    cX += cardWidth + gap;
    drawCard(cX, yResumo, cardWidth, cardH, "Líquido a Pagar", `R$ ${params.valorAPagar.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, [240, 253, 244], [34, 197, 94], [71, 85, 105], [22, 163, 74]);

    // ==================== LISTA DE FRETES ====================
    yPosition = yResumo + cardH + 6;

    const linhasFrete = fretes.map((frete) => {
        let rotaFormatada = frete.rota || "";
        const origemSegura = frete.rota?.split("→")[0]?.trim() || "";
        const destinoSeguro = frete.rota?.split("→")[1]?.trim() || "";
        if (origemSegura && destinoSeguro && origemSegura !== destinoSeguro) {
            rotaFormatada = `${abreviarRota(origemSegura)} - ${abreviarRota(destinoSeguro)}`;
        } else {
            rotaFormatada = abreviarRota(rotaFormatada);
            rotaFormatada = rotaFormatada.replace(/[→!]/g, '-');
        }

        let dataFreteCurta = frete.dataFrete || "";
        if (dataFreteCurta.length === 10) {
            dataFreteCurta = dataFreteCurta.substring(0, 6) + dataFreteCurta.substring(8);
        }

        return [
            frete.codigo,
            dataFreteCurta,
            rotaFormatada,
            `${frete.toneladas.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).replace(",", ".")} t`,
            `R$ ${frete.valorGerado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            frete.custosTotal > 0 ? `-R$ ${frete.custosTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `R$ 0,00`,
            `R$ ${frete.valorLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        ];
    });

    autoTable(doc, {
        startY: yPosition,
        head: [["Frete", "Data", "Origem / Destino", "Toneladas", "Bruto", "Descontos", "Líquido"]],
        body: linhasFrete,
        theme: "grid",
        columnStyles: {
            0: { cellWidth: 20, fontStyle: "bold", halign: "center", textColor: [15, 23, 42] },
            1: { cellWidth: 20, halign: "center" },
            2: { cellWidth: 46, halign: "left" },
            3: { cellWidth: 18, halign: "right", fontStyle: "bold" },
            4: { cellWidth: 26, halign: "right", fontStyle: "bold" },
            5: { cellWidth: 24, halign: "right", fontStyle: "bold", textColor: [220, 38, 38] },
            6: { cellWidth: 26, halign: "right", fontStyle: "bold", textColor: [21, 128, 61] },
        },
        headStyles: {
            fillColor: [37, 99, 235],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9.5,
            halign: "center",
        },
        bodyStyles: {
            fontSize: 8.5,
            cellPadding: 3,
            textColor: [51, 65, 85],
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 15, right: 15 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 8;

    // ==================== DETALHAMENTO DE CUSTOS ====================
    const custosEmitidos: { descricao: string; valor: number }[] = [];
    fretes.forEach((frete) => {
        frete.custos.forEach((c) => custosEmitidos.push({ descricao: c.descricao, valor: c.valor }));
    });

    if (custosEmitidos.length > 0) {
        const custosAgrupados = custosEmitidos.reduce((acc, custo) => {
            const desc = custo.descricao.trim().toUpperCase() || "OUTRO";
            if (!acc[desc]) acc[desc] = 0;
            acc[desc] += Number(custo.valor);
            return acc;
        }, {} as Record<string, number>);

        const linhasCustos = Object.entries(custosAgrupados).map(([descricao, valorTotal]) => [
            descricao,
            `R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]);

        doc.setFillColor(241, 245, 249);
        doc.rect(15, yPosition, 180, 8, "F");
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("RESUMO DE DESCONTOS", 20, yPosition + 5.5);
        yPosition += 10;

        autoTable(doc, {
            startY: yPosition,
            head: [["Categoria / Descrição", "Total Gasto"]],
            body: linhasCustos,
            theme: "grid",
            headStyles: {
                fillColor: [37, 99, 235],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 9.5,
                halign: "left",
            },
            bodyStyles: {
                fontSize: 8.5,
                cellPadding: 3,
                textColor: [51, 65, 85],
            },
            columnStyles: {
                0: { cellWidth: 100, halign: "left" },
                1: { cellWidth: 80, halign: "right", fontStyle: "bold", textColor: [220, 38, 38] },
            },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 15, right: 15 },
        });
    }

    // Modern split footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.5);
        doc.line(15, 280, 195, 280);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("Sistema de Gestão de Fretes", 20, 285);
        doc.text(`Pagina ${i} de ${pageCount}`, 105, 285, { align: "center" });
        doc.text("Relatorio Confidencial", 190, 285, { align: "right" });
        doc.setFontSize(6);
        doc.setTextColor(148, 163, 184);
        doc.text("Este documento foi gerado automaticamente e contem informacoes confidenciais", 105, 290, { align: "center" });
    }

    const nomeArquivo = `Guia_Pagamento_${params.motoristaNome.replace(/\s+/g, "_")}_${params.pagamentoId}.pdf`;
    doc.save(nomeArquivo);
};
