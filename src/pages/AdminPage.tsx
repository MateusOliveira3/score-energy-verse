import AdminDashboard from "@/components/AdminDashboard";
import Header from "@/components/Header";

const AdminPage = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">
                    Painel do Administrador
                </h1>
                <AdminDashboard />
            </main>
        </div>
    );
};

export default AdminPage; 