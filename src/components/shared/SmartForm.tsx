import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type DefaultValues, type FieldValues, type Path, type SubmitHandler } from "react-hook-form";
import { z, type ZodTypeAny } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InputMascarado } from "@/components/InputMascarado";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SmartFormOption {
  label: string;
  value: string;
}

type SmartFieldType = "text" | "email" | "number" | "select" | "mask";

export interface SmartField<TValues extends FieldValues> {
  name: Path<TValues>;
  label: string;
  type?: SmartFieldType;
  placeholder?: string;
  options?: SmartFormOption[];
  maskType?: "cpf" | "documento" | "telefone" | "cep" | "numero";
}

interface SmartFormProps<TSchema extends ZodTypeAny> {
  schema: TSchema;
  fields: SmartField<z.infer<TSchema>>[];
  defaultValues: DefaultValues<z.infer<TSchema>>;
  submitLabel?: string;
  onSubmit: (values: z.infer<TSchema>) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function SmartForm<TSchema extends ZodTypeAny>({
  schema,
  fields,
  defaultValues,
  submitLabel = "Salvar",
  onSubmit,
  isSubmitting,
}: SmartFormProps<TSchema>) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const submitHandler: SubmitHandler<z.infer<TSchema>> = async (values) => {
    await onSubmit(values);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submitHandler)}>
      {fields.map((field) => {
        const currentValue = watch(field.name);
        const errorMessage = errors[field.name]?.message as string | undefined;

        if (field.type === "select") {
          return (
            <div key={field.name} className="space-y-2">
              <Label>{field.label}</Label>
              <Select
                value={String(currentValue ?? "")}
                onValueChange={(value) => setValue(field.name, value as never, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder ?? "Selecione"} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
            </div>
          );
        }

        if (field.type === "mask") {
          return (
            <InputMascarado
              key={field.name}
              label={field.label}
              tipoMascara={field.maskType}
              placeholder={field.placeholder}
              erro={errorMessage}
              value={String(currentValue ?? "")}
              {...register(field.name)}
            />
          );
        }

        return (
          <div key={field.name} className="space-y-2">
            <Label>{field.label}</Label>
            <Input
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              value={String(currentValue ?? "")}
              {...register(field.name)}
            />
            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          </div>
        );
      })}

      <Button className="w-full" type="submit" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
