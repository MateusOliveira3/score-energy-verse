import { useState } from "react";
import { useInvoices } from '@/hooks/useInvoices';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function InvoiceUpload() {
    const [isLoading, setIsLoading] = useState(false);
    const { addInvoice, uploadFile } = useInvoices();
    const { toast } = useToast();

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);

        try {
            // 1. Fazer upload do arquivo para o Drive via API
            const uploadResult = await uploadFile(file);
            
            // Simulação de extração de dados (no futuro, isso pode vir do backend)
            const extractedData = {
                consumption: Math.round(Math.random() * 500) + 100,
                total_value: Math.round(Math.random() * 300) + 50,
                tax_percentage: 12,
                peak_hours: (Math.random() * 50).toFixed(2),
                month: new Date().toLocaleString('default', { month: 'long' }),
            };
            
            // 2. Registrar a fatura na planilha com a URL do Drive
            await addInvoice({
                ...extractedData,
                file_url: uploadResult.fileUrl,
                file_name: uploadResult.fileName
            });
            
            toast({
                title: "Upload bem-sucedido! 🚀",
                description: "Sua fatura foi enviada e registrada.",
                variant: "default",
            });

        } catch (error) {
            console.error("Erro no processo de upload de fatura:", error);
            const errorMessage = error instanceof Error ? error.message : "Tente novamente.";
            toast({
                title: "Erro no Upload",
                description: `Não foi possível enviar sua fatura. ${errorMessage}`,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-2 border-emerald-100 shadow-lg">
            <CardHeader>
                <CardTitle>Upload de Fatura</CardTitle>
                <CardDescription>
                    Envie sua fatura de energia (PDF ou imagem) para análise.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Input
                        id="invoice-file"
                        type="file"
                        onChange={handleFileUpload}
                        disabled={isLoading}
                        accept=".pdf,.png,.jpg,.jpeg"
                    />
                </div>
                {isLoading && (
                    <div className="mt-4 flex items-center justify-center">
                        <p>Enviando e processando...</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
