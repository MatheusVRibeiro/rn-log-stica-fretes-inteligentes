import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CreditCard } from "lucide-react";
import { InputMascarado } from "@/components/InputMascarado";
import { FieldError, fieldErrorClass } from "@/components/shared/FieldError";
import { ModalSubmitFooter } from "@/components/shared/ModalSubmitFooter";
import { Motorista } from "@/types";
import { useLocation, useNavigate } from "react-router-dom";

interface MotoristaFormModalProps {
    isModalOpen: boolean;
    isEditing: boolean;
    isSaving: boolean;
    isShaking: boolean;
    editedMotorista: Partial<Motorista>;
    setEditedMotorista: (m: Partial<Motorista>) => void;
    errosCampos: Record<string, string>;
    setErrosCampos: (e: Record<string, string>) => void;
    setDocumentoTipo: (t: string) => void;
    handleSave: () => void;
    onClose: () => void;
    onOpenChange: (open: boolean) => void;
    editRouteHandledRef?: React.MutableRefObject<string | null>;
}

export function MotoristaFormModal({
    isModalOpen,
    isEditing,
    isSaving,
    isShaking,
    editedMotorista,
    setEditedMotorista,
    errosCampos,
    setErrosCampos,
    setDocumentoTipo,
    handleSave,
    onClose,
    onOpenChange,
    editRouteHandledRef,
}: MotoristaFormModalProps) {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <Dialog
            open={isModalOpen}
            onOpenChange={(open) => {
                if (isSaving) return;
                onOpenChange(open);
                setErrosCampos({});
                if (!open && location.pathname.startsWith("/motoristas/editar")) {
                    if (editRouteHandledRef) editRouteHandledRef.current = null;
                    navigate("/motoristas", { replace: true });
                }
            }}
        >
            <DialogContent className={`max-w-2xl ${isShaking ? "animate-shake" : ""}`}>
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Motorista" : "Novo Motorista"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Atualize os dados do motorista." : "Cadastre um novo motorista na frota."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto px-1">
                    {/* Linha 1: Nome e Documento */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="nome">Nome Completo <span className="text-red-500">*</span></Label>
                            <Input
                                id="nome"
                                placeholder="João Silva"
                                value={editedMotorista.nome || ""}
                                onChange={(e) => {
                                    setEditedMotorista({ ...editedMotorista, nome: e.target.value });
                                    setErrosCampos({ ...errosCampos, nome: "" });
                                }}
                                onFocus={() => setErrosCampos({ ...errosCampos, nome: "" })}
                                className={fieldErrorClass(errosCampos.nome)}
                            />
                            <FieldError message={errosCampos.nome} />
                        </div>

                        <InputMascarado
                            label="CPF ou CNPJ"
                            id="documento"
                            tipoMascara="documento"
                            placeholder="000.000.000-00 ou 00.000.000/0000-00"
                            value={editedMotorista.documento || ""}
                            onChange={(e) => {
                                setEditedMotorista({ ...editedMotorista, documento: e.target.value });
                                setErrosCampos({ ...errosCampos, documento: "" });
                            }}
                            onDetectTipoDocumento={(tipo) => setDocumentoTipo(tipo)}
                            erro={errosCampos.documento}
                        />
                    </div>

                    {/* Linha 2: Telefone e E-mail */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputMascarado
                            label="Telefone *"
                            id="telefone"
                            tipoMascara="telefone"
                            placeholder="(11) 98765-4321"
                            value={editedMotorista.telefone || ""}
                            onChange={(e) => {
                                setEditedMotorista({ ...editedMotorista, telefone: e.target.value });
                                setErrosCampos({ ...errosCampos, telefone: "" });
                            }}
                            erro={errosCampos.telefone}
                        />

                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="motorista@email.com"
                                value={editedMotorista.email || ""}
                                onChange={(e) => {
                                    setEditedMotorista({ ...editedMotorista, email: e.target.value });
                                    setErrosCampos({ ...errosCampos, email: "" });
                                }}
                                onFocus={() => setErrosCampos({ ...errosCampos, email: "" })}
                                className={fieldErrorClass(errosCampos.email)}
                            />
                            <FieldError message={errosCampos.email} />
                        </div>
                    </div>

                    {/* Linha 3: Tipo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tipo">Tipo <span className="text-red-500">*</span></Label>
                            <Select
                                value={editedMotorista.tipo || "proprio"}
                                onValueChange={(value: "proprio" | "terceirizado" | "agregado") => {
                                    setEditedMotorista({
                                        ...editedMotorista,
                                        tipo: value,
                                    });
                                    setErrosCampos({ ...errosCampos, tipo: "" });
                                }}
                                onOpenChange={(open) => {
                                    if (open) setErrosCampos({ ...errosCampos, tipo: "" });
                                }}
                            >
                                <SelectTrigger className={fieldErrorClass(errosCampos.tipo)}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="proprio">Próprio</SelectItem>
                                    <SelectItem value="terceirizado">Terceirizado</SelectItem>
                                    <SelectItem value="agregado">Agregado</SelectItem>
                                </SelectContent>
                            </Select>
                            <FieldError message={errosCampos.tipo} />
                        </div>
                    </div>

                    {/* Linha 4: Endereço e Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="endereco">Endereço</Label>
                            <Input
                                id="endereco"
                                placeholder="Cidade, Estado"
                                value={editedMotorista.endereco || ""}
                                onChange={(e) => setEditedMotorista({ ...editedMotorista, endereco: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                            <Select
                                value={editedMotorista.status || "ativo"}
                                onValueChange={(value: "ativo" | "inativo" | "ferias") => {
                                    setEditedMotorista({ ...editedMotorista, status: value });
                                    setErrosCampos({ ...errosCampos, status: "" });
                                }}
                                onOpenChange={(open) => {
                                    if (open) setErrosCampos({ ...errosCampos, status: "" });
                                }}
                            >
                                <SelectTrigger className={fieldErrorClass(errosCampos.status)}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ativo">Ativo</SelectItem>
                                    <SelectItem value="inativo">Inativo</SelectItem>
                                    <SelectItem value="ferias">Férias</SelectItem>
                                </SelectContent>
                            </Select>
                            <FieldError message={errosCampos.status} />
                        </div>
                    </div>

                    <Separator />

                    {/* Payment Method */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Dados Bancários / PIX
                        </h3>

                        <div className="space-y-2">
                            <Label htmlFor="tipoPagamento">Método de Pagamento *</Label>
                            <Select
                                value={editedMotorista.tipo_pagamento || "pix"}
                                onValueChange={(value: "pix" | "transferencia_bancaria") =>
                                    setEditedMotorista({ ...editedMotorista, tipo_pagamento: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pix">PIX</SelectItem>
                                    <SelectItem value="transferencia_bancaria">Transferência Bancária</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* PIX Fields */}
                        {editedMotorista.tipo_pagamento === "pix" && (
                            <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                                <div className="space-y-2">
                                    <Label htmlFor="chavePixTipo">Tipo de Chave PIX *</Label>
                                    <Select
                                        value={editedMotorista.chave_pix_tipo || "cpf"}
                                        onValueChange={(value: "cpf" | "cnpj" | "email" | "telefone" | "aleatoria") =>
                                            setEditedMotorista({ ...editedMotorista, chave_pix_tipo: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cpf">CPF</SelectItem>
                                            <SelectItem value="cnpj">CNPJ</SelectItem>
                                            <SelectItem value="email">E-mail</SelectItem>
                                            <SelectItem value="telefone">Telefone</SelectItem>
                                            <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {(editedMotorista.chave_pix_tipo === "cpf" || editedMotorista.chave_pix_tipo === "cnpj" || editedMotorista.chave_pix_tipo === "telefone") ? (
                                    <InputMascarado
                                        label="Chave PIX *"
                                        id="chave_pix"
                                        tipoMascara={(editedMotorista.chave_pix_tipo as string) === "telefone" ? "telefone" : "documento"}
                                        placeholder={
                                            editedMotorista.chave_pix_tipo === "cpf"
                                                ? "000.000.000-00"
                                                : editedMotorista.chave_pix_tipo === "cnpj"
                                                    ? "00.000.000/0000-00"
                                                    : "(11) 98765-4321"
                                        }
                                        value={editedMotorista.chave_pix || ""}
                                        onChange={(e) => {
                                            setEditedMotorista({ ...editedMotorista, chave_pix: e.target.value });
                                            setErrosCampos({ ...errosCampos, chave_pix: "" });
                                        }}
                                        erro={errosCampos.chave_pix}
                                    />
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="chave_pix">Chave PIX *</Label>
                                        <Input
                                            id="chave_pix"
                                            placeholder={
                                                (editedMotorista.chave_pix_tipo as string) === "email"
                                                    ? "email@example.com"
                                                    : "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                                            }
                                            value={editedMotorista.chave_pix || ""}
                                            onChange={(e) => {
                                                setEditedMotorista({ ...editedMotorista, chave_pix: e.target.value });
                                                setErrosCampos({ ...errosCampos, chave_pix: "" });
                                            }}
                                            onFocus={() => setErrosCampos({ ...errosCampos, chave_pix: "" })}
                                            className={fieldErrorClass(errosCampos.chave_pix)}
                                        />
                                        <FieldError message={errosCampos.chave_pix} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Bank Transfer Fields */}
                        {(editedMotorista.tipo_pagamento as string) === "transferencia_bancaria" && (
                            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                                <div className="space-y-2">
                                    <Label htmlFor="banco">Banco *</Label>
                                    <Input
                                        id="banco"
                                        placeholder="Banco do Brasil"
                                        value={editedMotorista.banco || ""}
                                        onChange={(e) => {
                                            setEditedMotorista({ ...editedMotorista, banco: e.target.value });
                                            setErrosCampos({ ...errosCampos, banco: "" });
                                        }}
                                        onFocus={() => setErrosCampos({ ...errosCampos, banco: "" })}
                                        className={fieldErrorClass(errosCampos.banco)}
                                    />
                                    <FieldError message={errosCampos.banco} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="agencia">Agência *</Label>
                                        <Input
                                            id="agencia"
                                            placeholder="1234"
                                            value={editedMotorista.agencia || ""}
                                            onChange={(e) => {
                                                setEditedMotorista({ ...editedMotorista, agencia: e.target.value });
                                                setErrosCampos({ ...errosCampos, agencia: "" });
                                            }}
                                            onFocus={() => setErrosCampos({ ...errosCampos, agencia: "" })}
                                            className={fieldErrorClass(errosCampos.agencia)}
                                        />
                                        <FieldError message={errosCampos.agencia} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="conta">Conta *</Label>
                                        <Input
                                            id="conta"
                                            placeholder="567890-1"
                                            value={editedMotorista.conta || ""}
                                            onChange={(e) => {
                                                setEditedMotorista({ ...editedMotorista, conta: e.target.value });
                                                setErrosCampos({ ...errosCampos, conta: "" });
                                            }}
                                            onFocus={() => setErrosCampos({ ...errosCampos, conta: "" })}
                                            className={fieldErrorClass(errosCampos.conta)}
                                        />
                                        <FieldError message={errosCampos.conta} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tipoConta">Tipo de Conta *</Label>
                                    <Select
                                        value={editedMotorista.tipo_conta || "corrente"}
                                        onValueChange={(value: "corrente" | "poupanca") =>
                                            setEditedMotorista({ ...editedMotorista, tipo_conta: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="corrente">Corrente</SelectItem>
                                            <SelectItem value="poupanca">Poupança</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <ModalSubmitFooter
                        onCancel={() => {
                            onClose();
                            setErrosCampos({});
                        }}
                        onSubmit={handleSave}
                        isSubmitting={isSaving}
                        submitLabel={isEditing ? "Salvar Alterações" : "Cadastrar Motorista"}
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
