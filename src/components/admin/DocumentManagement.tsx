import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, Loader2, FileText } from "lucide-react";

interface GroupedDocument {
  source: string;
  totalChunks: number;
}

export function DocumentManagement() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<GroupedDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<GroupedDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDocuments(documents);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredDocuments(
        documents.filter((doc) =>
          doc.source.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, documents]);

  async function loadDocuments() {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("id, metadata");

      if (error) throw error;

      // Group by metadata.source
      const grouped = new Map<string, number>();
      
      data?.forEach((doc) => {
        const metadata = doc.metadata as { source?: string } | null;
        const source = metadata?.source || "Unknown";
        grouped.set(source, (grouped.get(source) || 0) + 1);
      });

      const groupedArray: GroupedDocument[] = Array.from(grouped.entries()).map(
        ([source, totalChunks]) => ({ source, totalChunks })
      );

      setDocuments(groupedArray);
      setFilteredDocuments(groupedArray);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os documentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast({
        title: "Atenção",
        description: "Selecione um arquivo PDF primeiro",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("data", selectedFile);

      const response = await fetch(
        "https://n8n.vetorix.com.br/form/7fe68a76-3359-4fb9-8e63-4909d487f04e",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");

      toast({
        title: "Sucesso",
        description: "Arquivo enviado para processamento",
      });

      setSelectedFile(null);
      // Reload documents after a delay to allow processing
      setTimeout(() => loadDocuments(), 2000);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o arquivo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(source: string) {
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .filter("metadata->>source", "eq", source);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Documento excluído com sucesso",
      });

      loadDocuments();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o documento",
        variant: "destructive",
      });
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de Documento</CardTitle>
          <CardDescription>
            Envie arquivos PDF para processamento e indexação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                disabled={uploading}
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar
                </>
              )}
            </Button>
          </div>
          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              Arquivo selecionado: {selectedFile.name}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Documents List Section */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos Processados</CardTitle>
          <CardDescription>
            Gerencie e exclua documentos indexados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar por nome do arquivo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum documento encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Arquivo</TableHead>
                  <TableHead className="text-right">Total de Páginas/Chunks</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.source}>
                    <TableCell className="font-medium">{doc.source}</TableCell>
                    <TableCell className="text-right">{doc.totalChunks}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(doc.source)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso excluirá todas as páginas referenciadas a este arquivo. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
