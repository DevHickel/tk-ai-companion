import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Trash2, Shield, UserX } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  user_roles?: Array<{ role: string }>;
  last_sign_in_at?: string | null;
}

export function UserManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      // First get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("email");

      if (profilesError) throw profilesError;

      // Get user metadata from auth.users (last sign in)
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) {
        console.error("Error fetching auth users:", authError);
      }

      const authUsers = authData?.users || [];

      // Then get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine the data
      const combinedData = (profilesData || []).map((profile) => {
        const authUser = authUsers.find((u) => u.id === profile.id);
        return {
          ...profile,
          last_sign_in_at: authUser?.last_sign_in_at || null,
          user_roles: (rolesData || [])
            .filter((role) => role.user_id === profile.id)
            .map((role) => ({ role: role.role })),
        };
      });

      setUsers(combinedData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleInviteUser() {
    if (!inviteEmail) {
      toast({
        title: "Erro",
        description: "Digite um email válido",
        variant: "destructive",
      });
      return;
    }

    setInviting(true);
    try {
      // Obter sessão atual para incluir token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Sessão não encontrada. Faça login novamente.");
      }

      console.log('Sending invite with auth token');
      
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email: inviteEmail },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Sucesso",
        description: `Convite enviado para ${inviteEmail}`,
      });
      setInviteEmail("");
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar convite",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  }

  async function handleDeleteUser(userId: string, email: string) {
    try {
      // Obter sessão atual para incluir token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Sessão não encontrada. Faça login novamente.");
      }

      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Sucesso",
        description: `Usuário ${email} removido`,
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao remover usuário",
        variant: "destructive",
      });
    }
  }

  async function handleToggleAdmin(userId: string, currentlyAdmin: boolean) {
    try {
      // Verificar se o usuário atual tem permissão TK Master
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("Sessão não encontrada");
      }

      const { data: currentUserRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const isTkMaster = currentUserRoles?.some(r => r.role === "tk_master");

      if (!isTkMaster) {
        toast({
          title: "Erro",
          description: "Apenas usuários com permissão TK Master podem gerenciar administradores",
          variant: "destructive",
        });
        return;
      }

      if (currentlyAdmin) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: currentlyAdmin
          ? "Permissões de admin removidas"
          : "Usuário promovido a admin",
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar permissões",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="dark:bg-[#09090b] dark:border-zinc-800">
      <CardHeader>
        <CardTitle>Gerenciar Usuários</CardTitle>
        <CardDescription>
          Convide novos usuários e gerencie permissões
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="invite-email">Convidar Novo Usuário</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="email@exemplo.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInviteUser()}
              className="bg-white text-slate-900 border-slate-200 placeholder:text-slate-400 dark:bg-zinc-900 dark:text-slate-50 dark:border-zinc-800"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleInviteUser} disabled={inviting} className="text-white">
              {inviting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Convite
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Permissões</TableHead>
                <TableHead className="text-right">Ações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const isAdmin = user.user_roles?.some(
                    (role) => role.role === "admin"
                  );
                  const isPending = !user.last_sign_in_at;
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.full_name || "—"}</TableCell>
                      <TableCell>
                        {isPending ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30">
                            Pendente
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 border border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30">
                            Ativo
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30">
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30">
                            Usuário
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAdmin(user.id, isAdmin)}
                          className="border-slate-200 hover:bg-slate-100 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                          {isAdmin ? (
                            <>
                              <UserX className="h-4 w-4 mr-1" />
                              Remover Admin
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-1" />
                              Tornar Admin
                            </>
                          )}
                        </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="border-slate-200 hover:bg-slate-100 text-slate-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remover
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover {isPending ? 'o convite de' : 'o usuário'} {user.email}?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
