class GoogleDriveAdapter {

  constructor() {
    // A inicialização agora será feita no backend
  }
  
  async uploadFile(file: File, userId: string): Promise<string> {
    // Esta lógica agora viverá no backend
    console.warn('Upload de arquivo deve ser tratado por uma API de backend.');
    // Simula um retorno para não quebrar a UI
    return `local-preview://${userId}/${file.name}`;
  }

  async deleteFile(fileId: string): Promise<void> {
    // Esta lógica agora viverá no backend
    console.warn('Deleção de arquivo deve ser tratado por uma API de backend.');
  }

  // Outros métodos podem ser esvaziados ou removidos se não forem
  // chamados diretamente pela UI antes da refatoração para o backend.
}

export const googleDriveAdapter = new GoogleDriveAdapter(); 