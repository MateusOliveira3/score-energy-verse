import React from 'react';
import { AlertTriangle, Award, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Invoice } from '@/lib/data-layer';

interface InvoiceAlertsProps {
    latestInvoice: Invoice | null;
}

const InvoiceAlerts: React.FC<InvoiceAlertsProps> = ({ latestInvoice }) => {
    const alerts = [];

    // Alerta de Energia Reativa
    if (latestInvoice?.reactive_energy_kvarh === 'Sim') {
        alerts.push({
            type: 'warning',
            icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
            message: 'Detectamos energia reativa excedente na sua última fatura. Isso pode indicar problemas na sua instalação e gerar custos extras.'
        });
    }

    // Alerta de Multa
    if (latestInvoice?.has_fine === 'Sim') {
        alerts.push({
            type: 'error',
            icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
            message: 'Sua última fatura continha multas ou juros. Pague suas contas em dia para evitar cobranças adicionais.'
        });
    }

    // Notificação de Bônus
    const BONUS_POINTS_THRESHOLD = 100;
    if (latestInvoice && latestInvoice.points_earned > BONUS_POINTS_THRESHOLD) {
        alerts.push({
            type: 'success',
            icon: <Award className="h-5 w-5 text-green-500" />,
            message: `Parabéns! Você enviou sua fatura no prazo e ganhou ${latestInvoice.points_earned - BONUS_POINTS_THRESHOLD} pontos extras.`
        });
    }

    // Mensagem de incentivo se não houver fatura no mês atual
    const now = new Date();
    const lastInvoiceDate = latestInvoice ? new Date(latestInvoice.created_at) : null;
    if (!lastInvoiceDate || lastInvoiceDate.getMonth() !== now.getMonth() || lastInvoiceDate.getFullYear() !== now.getFullYear()) {
        alerts.push({
            type: 'info',
            icon: <Info className="h-5 w-5 text-blue-500" />,
            message: 'Lembre-se: envie sua fatura até o dia 15 para ganhar +50 pontos de bônus!'
        });
    }
    
    if (alerts.length === 0) return null;

    return (
        <div className="space-y-4">
            {alerts.map((alert, index) => (
                <Card key={index} className={`border-l-4 ${
                    alert.type === 'success' ? 'border-green-500' : 
                    alert.type === 'warning' ? 'border-yellow-500' :
                    alert.type === 'error' ? 'border-red-500' : 'border-blue-500'
                }`}>
                    <CardContent className="p-4 flex items-center space-x-4">
                        {alert.icon}
                        <p className="text-sm text-gray-700">{alert.message}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default InvoiceAlerts; 