import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bug, Upload } from "lucide-react";

export default function BugReport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, forneça uma descrição",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let screenshotUrl = null;

      if (screenshot) {
        const fileExt = screenshot.name.split(".").pop();
        const fileName = `${user!.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("bug-screenshots")
          .upload(filePath, screenshot);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("bug-screenshots")
          .getPublicUrl(filePath);

        screenshotUrl = data.publicUrl;
      }

      const { error } = await supabase
        .from("bug_reports")
        .insert({
          user_id: user!.id,
          description,
          screenshot_url: screenshotUrl,
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Relatório de bug enviado com sucesso.",
      });

      setDescription("");
      setScreenshot(null);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bug className="h-6 w-6 text-primary" />
              <CardTitle>Reportar um Bug</CardTitle>
            </div>
            <CardDescription>
              Ajude-nos a melhorar o TkSolution reportando problemas que você encontrar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o bug que você encontrou..."
                  className="min-h-[150px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="screenshot">Captura de Tela (Opcional)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="screenshot"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Label htmlFor="screenshot" className="cursor-pointer flex-1">
                    <Button type="button" variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {screenshot ? screenshot.name : "Enviar Captura de Tela"}
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Enviando..." : "Enviar Relatório de Bug"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
