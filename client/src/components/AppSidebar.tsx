import { Link, useLocation } from "wouter";
import {
  Calculator,
  History,
  Settings,
  DollarSign,
  Truck as TruckIcon,
  Phone,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@/contexts/AuthContext";

const adminNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Reglas de Precios", url: "/admin/pricing", icon: DollarSign },
  { title: "Tipos de Vehículo", url: "/admin/vehicles", icon: TruckIcon },
];

const customerNavItems = [
  { title: "Calcular Presupuesto", url: "/", icon: Calculator },
  { title: "Historial", url: "/history", icon: History },
  { title: "Contacto", url: "/contact", icon: Phone },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, setUser } = useAuth();

  if (!user) {
    return null;
  }

  const isAdmin = user.role === "admin";
  const navItems = isAdmin ? adminNavItems : customerNavItems;
  const username = user.username || "Usuario";
  const email = user.email || "";
  const initials = String(username || "U").slice(0, 2).toUpperCase();

  const switchRole = () => {
    if (user) {
      const newRole: "customer" | "admin" = isAdmin ? "customer" : "admin";
      const newUser: User = {
        id: user.id,
        username: newRole === "admin" ? "Carlos Admin" : "Cliente Demo",
        email: newRole === "admin" ? "carlos@transporte.com" : "cliente@demo.com",
        role: newRole,
      };
      setUser(newUser);
      // Reload page after state update to avoid HMR conflicts
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <TruckIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">TransQuote</h1>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "Administración" : "Área de Cliente"}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{isAdmin ? "Administración" : "Principal"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{username}</p>
            <p className="text-xs text-muted-foreground truncate">
              {isAdmin ? "Administrador" : "Cliente"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={switchRole}
          className="w-full justify-start"
          data-testid="button-switch-role"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cambiar a {isAdmin ? "Cliente" : "Admin"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
