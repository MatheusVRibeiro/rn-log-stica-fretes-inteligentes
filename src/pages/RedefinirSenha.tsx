import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { resetPassword } from "@/services/auth";
import { cn } from "@/lib/utils";

const resetPasswordSchema = z
  .object({
    novaSenha: z
      .string()
      .min(8, "Senha deve ter no mínimo 8 caracteres")
      .regex(/[A-Z]/, "Senha deve conter letra maiúscula")
      .regex(/[a-z]/, "Senha deve conter letra minúscula")
      .regex(/[0-9]/, "Senha deve conter número"),
    confirmaSenha: z.string(),
  })
  .refine((data) => data.novaSenha === data.confirmaSenha, {
    message: "As senhas não conferem",
    path: ["confirmaSenha"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const novaSenha = watch("novaSenha");

  // Validações de senha
  const passwordStrength = {
    length: novaSenha?.length >= 8,
    uppercase: /[A-Z]/.test(novaSenha || ""),
    lowercase: /[a-z]/.test(novaSenha || ""),
    number: /[0-9]/.test(novaSenha || ""),
  };

  const isFull = Object.values(passwordStrength).every((v) => v);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast.error("Token inválido ou expirado");
      navigate("/recuperar-senha");
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetPassword(
        token,
        data.novaSenha,
        data.confirmaSenha
      );

      if (response.success) {
        setResetSuccess(true);
        toast.success("Senha redefinida com sucesso!");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        toast.error(response.message || "Erro ao redefinir senha");
      }
    } catch (error: any) {
      toast.error(error?.message || "Erro ao redefinir senha");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <div className="p-8">
            <Alert className="border-destructive bg-destructive/10 mb-4">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                Token inválido ou expirado
              </AlertDescription>
            </Alert>

            <Button onClick={() => navigate("/recuperar-senha")} className="w-full">
              Solicitar novo link
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Redefinir Senha
            </h1>
            <p className="text-muted-foreground text-sm">
              Crie uma senha forte para sua conta
            </p>
          </div>

          {!resetSuccess ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Nova Senha */}
              <div className="space-y-2">
                <Label htmlFor="novaSenha">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="novaSenha"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("novaSenha")}
                    disabled={isLoading}
                    className={cn("h-10 pr-10", errors.novaSenha && "border-destructive")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.novaSenha && (
                  <p className="text-sm text-destructive">{errors.novaSenha.message}</p>
                )}
              </div>

              {/* Força da Senha */}
              {novaSenha && (
                <div className="space-y-2 p-3 bg-muted rounded-lg">
                  <p className="text-xs font-semibold text-muted-foreground">Força da senha:</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          passwordStrength.length ? "bg-green-500" : "bg-muted"
                        )}
                      />
                      <span className="text-xs">Mínimo 8 caracteres</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          passwordStrength.uppercase ? "bg-green-500" : "bg-muted"
                        )}
                      />
                      <span className="text-xs">Uma letra maiúscula</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          passwordStrength.lowercase ? "bg-green-500" : "bg-muted"
                        )}
                      />
                      <span className="text-xs">Uma letra minúscula</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          passwordStrength.number ? "bg-green-500" : "bg-muted"
                        )}
                      />
                      <span className="text-xs">Um número</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <Label htmlFor="confirmaSenha">Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmaSenha"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("confirmaSenha")}
                    disabled={isLoading}
                    className={cn("h-10 pr-10", errors.confirmaSenha && "border-destructive")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmaSenha && (
                  <p className="text-sm text-destructive">{errors.confirmaSenha.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !isFull}
                className="w-full h-10 gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Redefinir Senha
                  </>
                )}
              </Button>

              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
                  Sua senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula e número.
                </AlertDescription>
              </Alert>
            </form>
          ) : (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-950/30 p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">Sucesso!</h2>
                <p className="text-muted-foreground text-sm">
                  Sua senha foi redefinida com sucesso. Você será redirecionado para o login em breve.
                </p>
              </div>

              <Button onClick={() => navigate("/login")} className="w-full h-10">
                Ir para Login
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
