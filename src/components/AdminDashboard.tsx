import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { Eye } from 'lucide-react';

interface AdminUser {
    id: string;
    email: string;
    created_at: string;
    score: number;
}

const AdminDashboard = () => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchAdminData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Codifica as credenciais para Basic Auth
            const credentials = btoa('admin:admin');
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Basic ${credentials}`
                }
            });

            if (response.status === 401) {
                throw new Error('Acesso não autorizado. Verifique as credenciais.');
            }
            if (!response.ok) {
                throw new Error('Falha ao buscar dados do administrador.');
            }
            const data = await response.json();
            setUsers(data);
        } catch (err: any) {
            setError(err.message);
            toast({
                title: "Erro de Autenticação",
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    const handleSimulateUser = (userId: string) => {
        // Lógica para simular usuário (ex: redirecionar ou salvar em um contexto)
        console.log(`Simulando usuário com ID: ${userId}`);
        toast({
            title: "Simulação Ativada",
            description: `Agora você está visualizando o dashboard como o usuário ${userId}.`,
        });
        // Aqui você pode adicionar a lógica para redirecionar para o dashboard do usuário
        // localStorage.setItem('simulatedUserId', userId);
        // window.location.href = '/perfil';
    };

    if (isLoading) return <p>Carregando dados do administrador...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Lista de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Data de Criação</TableHead>
                            <TableHead>Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.score}</TableCell>
                                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleSimulateUser(user.id)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default AdminDashboard; 