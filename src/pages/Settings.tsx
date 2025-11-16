import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências e configurações da plataforma</p>
      </div>

      <Card className="dark:bg-[#09090b] dark:border-zinc-800">
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>Personalize a aparência da plataforma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="theme-toggle">Modo Escuro</Label>
              <p className="text-sm text-muted-foreground">
                Alternar entre tema claro e escuro
              </p>
            </div>
            <Switch
              id="theme-toggle"
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
              className="data-[state=checked]:bg-gray-600"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-[#09090b] dark:border-zinc-800">
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>Configure suas preferências de notificação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações de Email</Label>
              <p className="text-sm text-muted-foreground">
                Receber atualizações por email
              </p>
            </div>
            <Switch className="data-[state=checked]:bg-gray-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
