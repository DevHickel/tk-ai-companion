import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, User as UserIcon } from "lucide-react";
import { format } from "date-fns";

interface BugReport {
  id: string;
  user_id: string;
  description: string;
  screenshot_url: string | null;
  created_at: string;
}

interface BugReportWithUser extends BugReport {
  user_email: string | null;
  user_name: string | null;
}

export function BugManagement() {
  const [bugs, setBugs] = useState<BugReportWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBugs();
  }, []);

  const loadBugs = async () => {
    try {
      // Fetch bug reports
      const { data: bugsData, error: bugsError } = await supabase
        .from("bug_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (bugsError) throw bugsError;

      if (!bugsData || bugsData.length === 0) {
        setBugs([]);
        setLoading(false);
        return;
      }

      // Fetch user profiles for all bug reporters
      const userIds = [...new Set(bugsData.map(bug => bug.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Merge bug reports with user data
      const bugsWithUsers = bugsData.map(bug => {
        const profile = profilesData?.find(p => p.id === bug.user_id);
        return {
          ...bug,
          user_email: profile?.email || null,
          user_name: profile?.full_name || null,
        };
      });

      setBugs(bugsWithUsers);
    } catch (error) {
      console.error("Error loading bugs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (bugs.length === 0) {
    return (
      <Card className="dark:bg-[#09090b] dark:border-zinc-800">
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Nenhum bug reportado ainda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bugs.map((bug) => (
        <Card key={bug.id} className="dark:bg-[#09090b] dark:border-zinc-800">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">
                  {bug.user_name || bug.user_email || "Usuário Desconhecido"}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Aberto</Badge>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(bug.created_at), "dd/MM/yyyy")}
                </span>
              </div>
            </div>
            {bug.user_email && bug.user_name && (
              <CardDescription className="text-xs">
                {bug.user_email}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm whitespace-pre-wrap">{bug.description}</p>
            {bug.screenshot_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(bug.screenshot_url!, "_blank")}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Ver Captura de Tela
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
