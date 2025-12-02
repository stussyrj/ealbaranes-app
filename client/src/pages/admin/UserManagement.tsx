import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Key, Trash2, Users, Shield, User } from "lucide-react";

interface UserData {
  id: string;
  username: string;
  isAdmin: boolean;
  workerId: string | null;
  createdAt: string;
}

interface WorkerData {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export default function UserManagement() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [changePassword, setChangePassword] = useState("");

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<UserData[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: workers = [] } = useQuery<WorkerData[]>({
    queryKey: ["/api/workers"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; workerId: string | null }) => {
      const res = await apiRequest("POST", "/api/admin/create-user", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsCreateDialogOpen(false);
      setNewUsername("");
      setNewPassword("");
      setSelectedWorkerId("");
      toast({
        title: "Usuario creado",
        description: "El usuario se ha creado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}/password`, { password });
      return res.json();
    },
    onSuccess: () => {
      setIsPasswordDialogOpen(false);
      setChangePassword("");
      setSelectedUser(null);
      toast({
        title: "Contraseña actualizada",
        description: "La contraseña se ha cambiado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar la contraseña",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Usuario eliminado",
        description: "El usuario se ha eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      toast({
        title: "Error",
        description: "Usuario y contraseña son requeridos",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate({
      username: newUsername,
      password: newPassword,
      workerId: selectedWorkerId || null,
    });
  };

  const handleChangePassword = () => {
    if (!selectedUser || !changePassword.trim()) return;
    changePasswordMutation.mutate({ id: selectedUser.id, password: changePassword });
  };

  const handleDeleteUser = (user: UserData) => {
    if (user.isAdmin) {
      toast({
        title: "Error",
        description: "No puedes eliminar un usuario administrador",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm(`¿Estás seguro de eliminar al usuario "${user.username}"?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const getWorkerName = (workerId: string | null) => {
    if (!workerId) return "Sin asignar";
    const worker = workers.find(w => w.id === workerId);
    return worker?.name || workerId;
  };

  const nonAdminUsers = users.filter(u => !u.isAdmin);
  const adminUsers = users.filter(u => u.isAdmin);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground">
            Crear y administrar cuentas de trabajadores
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-user">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Crea una cuenta de acceso para un trabajador
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nombre de usuario</Label>
                <Input
                  id="username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="ej: jose.garcia"
                  data-testid="input-new-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Contraseña segura"
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="worker">Trabajador asignado (opcional)</Label>
                <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                  <SelectTrigger data-testid="select-worker">
                    <SelectValue placeholder="Seleccionar trabajador..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {workers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Vincula este usuario a un perfil de trabajador existente
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateUser}
                disabled={createUserMutation.isPending}
                data-testid="button-confirm-create-user"
              >
                {createUserMutation.isPending ? "Creando..." : "Crear Usuario"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingUsers ? (
        <div className="text-center py-8 text-muted-foreground">
          Cargando usuarios...
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Administradores
              </CardTitle>
              <CardDescription>
                Usuarios con acceso completo al sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {adminUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    data-testid={`user-row-${user.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
                        <Shield className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-xs text-muted-foreground">Administrador</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Admin</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Trabajadores
              </CardTitle>
              <CardDescription>
                Usuarios con acceso limitado para gestionar sus servicios
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nonAdminUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay usuarios trabajadores</p>
                  <p className="text-sm">Crea uno usando el botón "Nuevo Usuario"</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {nonAdminUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      data-testid={`user-row-${user.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {getWorkerName(user.workerId)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsPasswordDialogOpen(true);
                          }}
                          data-testid={`button-change-password-${user.id}`}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user)}
                          data-testid={`button-delete-user-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Nueva contraseña para {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                value={changePassword}
                onChange={(e) => setChangePassword(e.target.value)}
                placeholder="Nueva contraseña"
                data-testid="input-change-password"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
              data-testid="button-confirm-change-password"
            >
              {changePasswordMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
