import React, { useState, useCallback } from 'react';
import { Upload, FileText, Zap, Eye, CheckCircle, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { interpretInvoiceFile } from '@/lib/mvpCoreFlow';
import { UserProfileData } from '@/types/mvp';

interface InvoiceUploadProps {
  profile: UserProfileData;
  onUploadStarted: () => void;
  onInvoiceProcessed: (file: File) => void;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const InvoiceUpload = ({ profile, onUploadStarted, onInvoiceProcessed }: InvoiceUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [savedInJourney, setSavedInJourney] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = useCallback(
    async (file: File) => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Formato inválido',
          description: 'Por favor, envie apenas arquivos PDF, JPG ou PNG.',
          variant: 'destructive',
        });
        return;
      }

      setIsUploading(true);
      setUploadedFile(file);
      setSavedInJourney(false);
      onUploadStarted();

      try {
        await wait(1200);
        const extractedInvoice = interpretInvoiceFile(file, profile);
        onInvoiceProcessed(file);
        setSavedInJourney(true);

        toast({
          title: 'Fatura adicionada ao histórico!',
          description: `Resumo gerado para ${extractedInvoice.month} com ${extractedInvoice.consumption} kWh estimados.`,
        });
      } catch (error) {
        console.error('Erro no processamento:', error);
        toast({
          title: 'Erro no processamento',
          description: 'Não foi possível processar a fatura. Tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
    },
    [onInvoiceProcessed, onUploadStarted, profile, toast]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragActive(false);

      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <Card className="border-2 border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-emerald-700">
          <FileText className="h-5 w-5" />
          <span>Adicionar fatura ao histórico</span>
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
          onDragOver={(event) => {
            event.preventDefault();
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
                <p className="text-lg font-medium text-emerald-700">
                  Lendo a fatura e montando o resumo...
                </p>
                <p className="text-sm text-gray-600">
                  A próxima etapa será uma análise simples com score e resumo do momento.
                </p>
              </div>
            </div>
          ) : uploadedFile ? (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-lg font-medium text-emerald-700">
                  Fatura recebida e adicionada à jornada
                </p>
                <p className="text-sm text-gray-600">{uploadedFile.name}</p>
                <div className="flex items-center justify-center mt-2 text-xs text-emerald-600">
                  <Database className="h-3 w-3 mr-1" />
                  {savedInJourney
                    ? 'Dados vinculados ao estado da jornada MVP'
                    : 'Fluxo mantido na jornada atual'}
                </div>
              </div>
              <Button
                onClick={() => {
                  setUploadedFile(null);
                  setSavedInJourney(false);
                  const input = document.getElementById('file-upload') as HTMLInputElement;
                  if (input) {
                    input.value = '';
                  }
                }}
                variant="outline"
                size="sm"
              >
                Adicionar outra fatura
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <Upload className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Arraste sua fatura aqui ou clique para adicionar ao histórico
                </p>
                <p className="text-sm text-gray-500">
                  Suporta PDF, JPG e PNG. A adição atualiza a análise, o score e os próximos passos.
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
            <div className="text-lg font-bold text-emerald-600">MVP</div>
            <div className="text-xs text-emerald-700">Interpretação determinística</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">Perfil</div>
            <div className="text-xs text-blue-700">Contexto aplicado</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">Resumo</div>
            <div className="text-xs text-purple-700">Leitura simples</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-600">Mascote</div>
            <div className="text-xs text-orange-700">Resume o próximo passo</div>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg">
            <div className="text-lg font-bold text-indigo-600">Score</div>
            <div className="text-xs text-indigo-700">Eventos explícitos</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceUpload;
