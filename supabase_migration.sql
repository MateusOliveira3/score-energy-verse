-- Criação da tabela invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    consumption DECIMAL(10,2) NOT NULL,
    total_value DECIMAL(10,2) NOT NULL,
    tax_percentage DECIMAL(5,2) NOT NULL,
    peak_hours TEXT NOT NULL,
    month TEXT NOT NULL,
    file_url TEXT,
    file_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_month ON public.invoices(month);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Política para SELECT - usuário só pode ver suas próprias faturas
CREATE POLICY "Users can view own invoices" ON public.invoices
    FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT - usuário só pode inserir faturas para si mesmo
CREATE POLICY "Users can insert own invoices" ON public.invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE - usuário só pode atualizar suas próprias faturas
CREATE POLICY "Users can update own invoices" ON public.invoices
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE - usuário só pode deletar suas próprias faturas
CREATE POLICY "Users can delete own invoices" ON public.invoices
    FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON public.invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários na tabela
COMMENT ON TABLE public.invoices IS 'Tabela para armazenar faturas de energia dos usuários';
COMMENT ON COLUMN public.invoices.consumption IS 'Consumo em kWh';
COMMENT ON COLUMN public.invoices.total_value IS 'Valor total da fatura em reais';
COMMENT ON COLUMN public.invoices.tax_percentage IS 'Percentual de impostos';
COMMENT ON COLUMN public.invoices.peak_hours IS 'Horário de pico (ex: 18:00-22:00)';
COMMENT ON COLUMN public.invoices.month IS 'Mês/ano da fatura (ex: Janeiro 2024)';
COMMENT ON COLUMN public.invoices.file_url IS 'URL do arquivo PDF no storage (opcional)';
COMMENT ON COLUMN public.invoices.file_name IS 'Nome original do arquivo (opcional)'; 