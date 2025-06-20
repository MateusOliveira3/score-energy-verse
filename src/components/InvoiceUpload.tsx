import React, { useState, useCallback } from 'react';
import { Upload, FileText, Zap, Eye, CheckCircle, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useInvoices } from '@/hooks/useInvoices';
import { useAuth } from '@/contexts/AuthContext';

interface InvoiceData {
  consumption: number;
  totalValue: number;
  taxPercentage: number;
  peakHours: string;
  month: string;
}

interface InvoiceUploadProps {
  onInvoiceProcessed: (data: InvoiceData) => void;
}

const InvoiceUpload = ({ onInvoiceProcessed }: InvoiceUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { addInvoice, uploadFile } = useInvoices();
  const { user } = useAuth();

  // Simulação de OCR - em produção seria uma chamada real para API de OCR
  const simulateOCR = useCallback(async (file: File): Promise<InvoiceData> => {
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simula processamento
    
    // Dados simulados extraídos do OCR
    return {
      consumption: Math.floor(Math.random() * 300) + 150,
      totalValue: Math.floor(Math.random() * 200) + 180,
      taxPercentage: Math.floor(Math.random() * 30) + 25,
      peakHours: '18:00-22:00',
      month: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    };
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Por favor, envie apenas arquivos PDF, JPG ou PNG.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Usuário não autenticado",
        description: "Faça login para enviar faturas.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadedFile(file);

    try {
      // Processar OCR
      const ocrData = await simulateOCR(file);
      
      // Upload do arquivo para storage (opcional)
      let fileUrl = null;
      try {
        fileUrl = await uploadFile(file);
      } catch (error) {
        console.warn('Erro no upload do arquivo, continuando sem salvar o arquivo:', error);
      }

      // Salvar dados no Supabase
      const savedInvoice = await addInvoice({
        consumption: ocrData.consumption,
        total_value: ocrData.totalValue,
        tax_percentage: ocrData.taxPercentage,
        peak_hours: ocrData.peakHours,
        month: ocrData.month,
        file_url: fileUrl,
        file_name: file.name
      });

      if (savedInvoice) {
        onInvoiceProcessed(ocrData);
        
        toast({
          title: "Fatura processada e salva! ⚡",
          description: `Consumo de ${ocrData.consumption} kWh detectado. Dados salvos no banco!`,
        });
      }
    } catch (error) {
      console.error('Erro no processamento:', error);
      toast({
        title: "Erro no processamento",
        description: "Não foi possível processar a fatura. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [simulateOCR, onInvoiceProcessed, toast, user, addInvoice, uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <Card className="border-2 border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-emerald-700">
          <FileText className="h-5 w-5" />
          <span>Upload da Fatura de Energia</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
            isDragActive 
              ? 'border-emerald-500 bg-emerald-50' 
              : uploadedFile 
                ? 'border-emerald-300 bg-emerald-25'
                : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-25'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin">
                <Zap className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-lg font-medium text-emerald-700">Processando com OCR...</p>
                <p className="text-sm text-gray-600">Extraindo dados e salvando no banco</p>
              </div>
            </div>
          ) : uploadedFile ? (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-lg font-medium text-emerald-700">Fatura processada e salva!</p>
                <p className="text-sm text-gray-600">{uploadedFile.name}</p>
                <div className="flex items-center justify-center mt-2 text-xs text-emerald-600">
                  <Database className="h-3 w-3 mr-1" />
                  Dados salvos no Supabase
                </div>
              </div>
              <Button 
                onClick={() => {
                  setUploadedFile(null);
                  const input = document.getElementById('file-upload') as HTMLInputElement;
                  if (input) input.value = '';
                }}
                variant="outline"
                size="sm"
              >
                Enviar nova fatura
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <Upload className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Arraste sua fatura aqui ou clique para selecionar
                </p>
                <p className="text-sm text-gray-500">
                  Suporta PDF, JPG e PNG • Máximo 10MB • Dados salvos automaticamente
                </p>
              </div>
              
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button 
                onClick={() => document.getElementById('file-upload')?.click()}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              >
                <Eye className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div className="p-3 bg-emerald-50 rounded-lg">
            <div className="text-lg font-bold text-emerald-600">OCR</div>
            <div className="text-xs text-emerald-700">Leitura Automática</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">kWh</div>
            <div className="text-xs text-blue-700">Consumo Detectado</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">Score</div>
            <div className="text-xs text-purple-700">Cálculo Automático</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-600">Dicas</div>
            <div className="text-xs text-orange-700">Recomendações IA</div>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg">
            <div className="text-lg font-bold text-indigo-600">DB</div>
            <div className="text-xs text-indigo-700">Salvo no Supabase</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceUpload;
