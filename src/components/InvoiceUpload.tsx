import { useState } from "react";
import { useInvoices } from '@/hooks/useInvoices';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Zap, DollarSign, Calendar } from "lucide-react";

// Tipo para os dados do formulário de confirmação
type FormData = {
    totalConsumptionKwh: string | number;
    totalValueBrl: string | number;
    dueDate: string;
    // Adicione outros campos que você deseja que sejam editáveis
};

// Props para receber a função mutate do useDiagnosis
type InvoiceUploadProps = {
    onDiagnosisUpdate?: () => Promise<void>;
};

export function InvoiceUpload({ onDiagnosisUpdate }: InvoiceUploadProps) {
    const [isLoading, setIsLoading] = useState(false);
    // Novo estado para controlar o modal de confirmação
    const [showConfirmation, setShowConfirmation] = useState(false);
    // Novo estado para armazenar dados extraídos e do formulário
    const [formData, setFormData] = useState<FormData | null>(null);
    // Novo estado para armazenar dados que não são do formulário mas precisam ser passados adiante
    const [invoiceMetaData, setInvoiceMetaData] = useState<any>(null);

    const { extractInvoiceData } = useInvoices();
    const { toast } = useToast();

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);

        try {
            // 1. Extrair dados do arquivo via API
            const extractResult = await extractInvoiceData(file);
            console.log("Resultado da extração:", extractResult);

            // 2. Se recebeu diagnosis na resposta, revalida o SWR
            if (extractResult?.diagnosis && onDiagnosisUpdate) {
                try {
                    await onDiagnosisUpdate();
                    console.log('[InvoiceUpload] Diagnosis revalidado com sucesso');
                } catch (error) {
                    console.warn('[InvoiceUpload] Erro ao revalidar diagnosis:', error);
                }
            }

            // 3. Prepara os dados para o formulário de confirmação
            setFormData({
                totalConsumptionKwh: extractResult.extractedData.totalConsumptionKwh,
                totalValueBrl: extractResult.extractedData.totalValueBrl,
                dueDate: extractResult.extractedData.dueDate,
            });

            // 4. Guarda os metadados restantes para o envio final
            setInvoiceMetaData({
                tax_percentage: extractResult.extractedData.taxValueBrl,
                peak_hours: extractResult.extractedData.peakConsumptionKwh,
                month: new Date().toLocaleString('default', { month: 'long' }),
                file_name: extractResult.fileName,
                reactive_energy_kvarh: extractResult.extractedData.reactiveEnergyKvarh,
                has_fine: extractResult.extractedData.hasFine,
            });
            
            // 5. Mostra o modal de confirmação em vez de salvar diretamente
            setShowConfirmation(true);

        } catch (error) {
            console.error("Erro no processo de extração de dados:", error);
            const errorMessage = error instanceof Error ? error.message : "Tente novamente.";
            toast({
                title: "Erro na Extração",
                description: `Não foi possível extrair os dados da fatura. ${errorMessage}`,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!formData) return;
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleConfirmationSubmit = async () => {
        if (!formData || !invoiceMetaData) return;

        setIsLoading(true);
        try {
            // Os dados já foram salvos automaticamente no upload
            // Apenas confirmamos que o usuário está satisfeito com os dados extraídos
            
            toast({
                title: "Dados Processados! 🚀",
                description: "Seus dados foram extraídos e salvos na planilha com sucesso.",
                variant: "default",
            });

        } catch (error) {
            console.error("Erro ao confirmar a fatura:", error);
            const errorMessage = error instanceof Error ? error.message : "Tente novamente.";
            toast({
                title: "Erro ao Confirmar",
                description: `Não foi possível confirmar a fatura. ${errorMessage}`,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
            setShowConfirmation(false);
            setFormData(null);
            setInvoiceMetaData(null);
        }
    };

    return (
        <>
            <Card className="border-2 border-emerald-100 shadow-lg">
                <CardHeader>
                    <CardTitle>Upload de Fatura</CardTitle>
                    <CardDescription>
                        Envie sua fatura de energia (PDF) para extração e análise dos dados.
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
                             <p>Extraindo dados e salvando...</p>
                         </div>
                     )}
                </CardContent>
            </Card>

            {/* Modal de Confirmação */}
            <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <DialogContent className="sm:max-w-[425px] bg-white">
                    <DialogHeader>
                                                 <DialogTitle>Confirme os Dados Extraídos</DialogTitle>
                         <DialogDescription>
                             Verifique os dados extraídos do seu PDF. Os dados já foram salvos na planilha.
                         </DialogDescription>
                    </DialogHeader>
                    {formData && (
                        <div className="space-y-6 py-4">
                            {/* Consumo */}
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                                    <Zap className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div className="flex-1">
                                    <Label htmlFor="totalConsumptionKwh" className="text-sm font-medium text-gray-700">
                                        Consumo (kWh)
                                    </Label>
                                    <Input
                                        id="totalConsumptionKwh"
                                        name="totalConsumptionKwh"
                                        value={formData.totalConsumptionKwh}
                                        onChange={handleFormChange}
                                        className="mt-1 text-lg font-bold"
                                    />
                                </div>
                            </div>
                            {/* Valor Total */}
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                                    <DollarSign className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <Label htmlFor="totalValueBrl" className="text-sm font-medium text-gray-700">
                                        Valor Total (R$)
                                    </Label>
                                    <Input
                                        id="totalValueBrl"
                                        name="totalValueBrl"
                                        value={formData.totalValueBrl}
                                        onChange={handleFormChange}
                                        className="mt-1 text-lg font-bold"
                                    />
                                </div>
                            </div>
                            {/* Vencimento */}
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                    <Calendar className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700">
                                        Vencimento
                                    </Label>
                                    <Input
                                        id="dueDate"
                                        name="dueDate"
                                        value={formData.dueDate}
                                        onChange={handleFormChange}
                                        className="mt-1 text-lg font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancelar
                            </Button>
                        </DialogClose>
                                                 <Button
                           type="button"
                           onClick={handleConfirmationSubmit}
                           disabled={isLoading}
                           className="bg-emerald-600 hover:bg-emerald-700"
                         >
                           {isLoading ? "Confirmando..." : "Confirmar Dados"}
                         </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
