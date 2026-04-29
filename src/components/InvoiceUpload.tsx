import React, { useCallback, useState } from 'react';
import { Upload, FileText, Zap, Eye, CheckCircle, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { InvoiceData, UserProfileData } from '@/types/mvp';

interface InvoiceUploadProps {
  profile: UserProfileData;
  onUploadStarted: () => void;
  onInvoiceProcessed: (file: File) => Promise<InvoiceData | void>;
  onUploadCompleted?: (invoice?: InvoiceData) => void;
  variant?: 'default' | 'embedded';
  showJourneyAnchors?: boolean;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const InvoiceUpload = ({
  profile,
  onUploadStarted,
  onInvoiceProcessed,
  onUploadCompleted,
  variant = 'default',
  showJourneyAnchors = false,
}: InvoiceUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [savedInJourney, setSavedInJourney] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = useCallback(
    async (file: File) => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      void profile;

      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Formato invalido',
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
        const extractedInvoice = await onInvoiceProcessed(file);
        setSavedInJourney(true);
        onUploadCompleted?.(extractedInvoice);

        const extractedMonth = extractedInvoice?.month ?? 'referencia nao identificada';
        const extractedConsumption =
          typeof extractedInvoice?.consumption === 'number'
            ? `${extractedInvoice.consumption} kWh`
            : 'consumo nao identificado';

        toast({
          title: 'Fatura adicionada ao historico!',
          description: `Leitura concluida para ${extractedMonth}, com ${extractedConsumption} quando disponivel na conta.`,
        });
      } catch (error) {
        console.error('Erro no processamento:', error);
        toast({
          title: 'Erro no processamento',
          description: 'Nao foi possivel processar a fatura. Tente novamente.',
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
        void handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      void handleFileUpload(files[0]);
    }
  };

  const stepAnchors = [
    {
      title: 'MVP',
      description: 'Parser deterministico',
      containerClassName: 'bg-emerald-50',
      titleClassName: 'text-emerald-600',
      descriptionClassName: 'text-emerald-700',
      sectionId: 'section-mvp',
    },
    {
      title: 'Perfil',
      description: 'Contexto aplicado',
      containerClassName: 'bg-blue-50',
      titleClassName: 'text-blue-600',
      descriptionClassName: 'text-blue-700',
      sectionId: 'section-profile',
    },
    {
      title: 'Resumo',
      description: 'Leitura segura',
      containerClassName: 'bg-purple-50',
      titleClassName: 'text-purple-600',
      descriptionClassName: 'text-purple-700',
      sectionId: 'section-summary',
    },
    {
      title: 'Mascote',
      description: 'Resume o proximo passo',
      containerClassName: 'bg-orange-50',
      titleClassName: 'text-orange-600',
      descriptionClassName: 'text-orange-700',
      sectionId: 'section-mascot',
    },
    {
      title: 'Score',
      description: 'Eventos explicitos',
      containerClassName: 'bg-indigo-50',
      titleClassName: 'text-indigo-600',
      descriptionClassName: 'text-indigo-700',
      sectionId: 'section-score',
    },
  ] as const;
  const isEmbedded = variant === 'embedded';

  return (
    <Card
      className={cn(
        'transition-all duration-300',
        isEmbedded
          ? 'border border-[#365f58] bg-[#0f342f] text-white shadow-none'
          : 'border-2 border-emerald-100 shadow-md hover:shadow-lg'
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle
          className={cn(
            'flex items-center space-x-2',
            isEmbedded ? 'text-[#f5f8f3]' : 'text-emerald-700'
          )}
        >
          <FileText className="h-5 w-5" />
          <span>Adicionar fatura ao historico</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className={cn(
            'relative rounded-lg border-2 border-dashed px-5 py-5 text-center transition-all duration-300 md:px-6 md:py-6',
            isDragActive
              ? isEmbedded
                ? 'border-[#7eb77b] bg-[#17443d]'
                : 'border-emerald-500 bg-emerald-50'
              : uploadedFile
                ? isEmbedded
                  ? 'border-[#6ea96d] bg-[#123933]'
                  : 'border-emerald-300 bg-emerald-25'
                : isEmbedded
                  ? 'border-[#365f58] bg-[#133d37] hover:border-[#5d8e72] hover:bg-[#184741]'
                  : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-25'
          )}
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin">
                <Zap className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-base font-medium text-emerald-700">
                  Lendo a fatura e montando o resumo...
                </p>
                <p className={cn('text-sm', isEmbedded ? 'text-[#c5d8c8]' : 'text-gray-600')}>
                  A proxima etapa sera uma analise simples com score e resumo do momento.
                </p>
              </div>
            </div>
          ) : uploadedFile ? (
            <div className="flex flex-col items-center space-y-3">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
              <div>
                <p className="text-base font-medium text-emerald-700">
                  Fatura recebida e adicionada a jornada
                </p>
                <p className={cn('text-sm', isEmbedded ? 'text-[#c5d8c8]' : 'text-gray-600')}>
                  {uploadedFile.name}
                </p>
                <div className="mt-1.5 flex items-center justify-center text-xs text-emerald-600">
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
            <div className="flex flex-col items-center space-y-3">
              <Upload className="h-9 w-9 text-gray-400" />
              <div>
                <p className="mb-1.5 text-base font-medium text-gray-700">
                  Arraste sua fatura aqui ou clique para adicionar ao historico
                </p>
                <p className={cn('text-sm', isEmbedded ? 'text-[#c5d8c8]' : 'text-gray-500')}>
                  Suporta PDF, JPG e PNG. A adicao atualiza a analise, o score e os proximos passos.
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
                size="sm"
                className={cn(
                  isEmbedded
                    ? 'bg-[#5f925c] text-white hover:bg-[#517d4f]'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                )}
              >
                <Eye className="h-4 w-4 mr-2" />
                Selecionar fatura
              </Button>
            </div>
          )}
        </div>

        {showJourneyAnchors && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-center md:grid-cols-5 md:gap-3">
            {stepAnchors.map((step) => (
              <div
                key={step.title}
                className={`rounded-lg px-2.5 py-2 ${step.containerClassName}`}
              >
                <div className={`text-base font-bold ${step.titleClassName}`}>{step.title}</div>
                <div className={`text-xs ${step.descriptionClassName}`}>{step.description}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceUpload;
