import { useState } from "react";
import { useLocation } from "wouter";
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
import { Plus, Key, Trash2, Users, Shield, User, AlertTriangle } from "lucide-react";

interface UserData {
  id: string;
  username: string;
  displayName: string | null;
  isAdmin: boolean;
  workerId: string | null;
  createdAt: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteCompanyDialogOpen, setIsDeleteCompanyDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changePassword, setChangePassword] = useState("");
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<UserData[]>({
    queryKey: ["/api/admin/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string; displayName: string; password: string }) => {
      const res = await apiRequest("POST", "/api/admin/create-user", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al crear usuario");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsCreateDialogOpen(false);
      setNewDisplayName("");
      setNewUsername("");
      setNewPassword("");
      toast({
        title: "Trabajador creado",
        description: "El trabajador se ha creado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el trabajador",
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
        title: "Trabajador eliminado",
        description: "El trabajador se ha eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el trabajador",
        variant: "destructive",
      });
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async ({ password, confirmText }: { password: string; confirmText: string }) => {
      const res = await apiRequest("DELETE", "/api/admin/company", { password, confirmText });
      const data = await res.json() as { 
        success: boolean; 
        message?: string; 
        sessionCleared: boolean;
        dataDeleted?: boolean;
        error?: string;
      };
      
      if (!res.ok) {
        throw new Error(data.error || "Error al eliminar la empresa");
      }
      return data;
    },
    onSuccess: (data) => {
      resetDeleteCompanyForm();
      queryClient.clear();
      
      toast({
        title: "Empresa eliminada",
        description: data.message || "Tu empresa y todos sus datos han sido eliminados permanentemente",
      });
      
      if (!data.sessionCleared) {
        window.location.href = "/login";
      } else {
        setLocation("/login");
      }
    },
    onError: (error: Error) => {
      setDeleteConfirmPassword("");
      setDeleteConfirmText("");
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la empresa",
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
      displayName: newDisplayName.trim() || newUsername,
      password: newPassword,
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
        description: "No puedes eliminar la cuenta de empresa",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm(`¿Estas seguro de eliminar al trabajador "${user.displayName || user.username}"?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleDeleteCompany = () => {
    if (!deleteConfirmPassword.trim()) {
      toast({
        title: "Error",
        description: "Debes introducir tu contraseña",
        variant: "destructive",
      });
      return;
    }
    if (deleteConfirmText !== "ELIMINAR") {
      toast({
        title: "Error",
        description: "Debes escribir ELIMINAR para confirmar",
        variant: "destructive",
      });
      return;
    }
    deleteCompanyMutation.mutate({ 
      password: deleteConfirmPassword, 
      confirmText: deleteConfirmText 
    });
  };

  const resetDeleteCompanyForm = () => {
    setDeleteConfirmPassword("");
    setDeleteConfirmText("");
    setIsDeleteCompanyDialogOpen(false);
  };

  const nonAdminUsers = users.filter(u => !u.isAdmin);
  const adminUsers = users.filter(u => u.isAdmin);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gestion de Usuarios
          </h1>
          <p className="text-muted-foreground">
            Crear y administrar cuentas de trabajadores
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-user">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Trabajador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Trabajador</DialogTitle>
              <DialogDescription>
                Crea una cuenta de acceso para un trabajador
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Nombre del trabajador</Label>
                <Input
                  id="displayName"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="ej: Juan Garcia"
                  data-testid="input-new-displayname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Nombre de usuario (para login)</Label>
                <Input
                  id="username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="ej: juan.garcia"
                  data-testid="input-new-username"
                />
                <p className="text-xs text-muted-foreground">
                  Debe ser unico, sera usado para iniciar sesion
                </p>
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
                {createUserMutation.isPending ? "Creando..." : "Crear Trabajador"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingUsers ? (
        <div className="text-center py-8 text-muted-foreground">
          Cargando...
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Cuenta de Empresa
              </CardTitle>
              <CardDescription>
                Usuario con acceso completo al sistema
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
                        <p className="font-medium">{user.displayName || user.username}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Empresa</Badge>
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
                Usuarios con acceso limitado para gestionar sus albaranes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nonAdminUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay trabajadores</p>
                  <p className="text-sm">Crea uno usando el boton "Nuevo Trabajador"</p>
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
                          <p className="font-medium">{user.displayName || user.username}</p>
                          <p className="text-xs text-muted-foreground">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
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

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Zona de Peligro
              </CardTitle>
              <CardDescription>
                Acciones irreversibles que afectan a toda la empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <h4 className="font-medium text-destructive mb-2">Eliminar Empresa</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Esta accion eliminara permanentemente tu empresa y todos los datos asociados: 
                  albaranes, trabajadores, usuarios y cualquier otra informacion. 
                  Esta accion no se puede deshacer.
                </p>
                <Dialog open={isDeleteCompanyDialogOpen} onOpenChange={(open) => {
                  if (!open) resetDeleteCompanyForm();
                  setIsDeleteCompanyDialogOpen(open);
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="destructive"
                      data-testid="button-delete-company"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar Empresa
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Confirmar Eliminacion de Empresa
                      </DialogTitle>
                      <DialogDescription>
                        Esta accion es irreversible. Se eliminaran permanentemente:
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
                        <li>Todos los albaranes y sus fotos/firmas</li>
                        <li>Todos los trabajadores</li>
                        <li>Todo el historial y registros</li>
                        <li>La cuenta de empresa</li>
                      </ul>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="delete-password">Tu contraseña</Label>
                          <Input
                            id="delete-password"
                            type="password"
                            value={deleteConfirmPassword}
                            onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                            placeholder="Introduce tu contraseña"
                            data-testid="input-delete-password"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="delete-confirm">
                            Escribe <span className="font-bold text-destructive">ELIMINAR</span> para confirmar
                          </Label>
                          <Input
                            id="delete-confirm"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                            placeholder="ELIMINAR"
                            data-testid="input-delete-confirm"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={resetDeleteCompanyForm}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteCompany}
                        disabled={deleteCompanyMutation.isPending || deleteConfirmText !== "ELIMINAR"}
                        data-testid="button-confirm-delete-company"
                      >
                        {deleteCompanyMutation.isPending ? "Eliminando..." : "Eliminar Permanentemente"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Nueva contraseña para {selectedUser?.displayName || selectedUser?.username}
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
