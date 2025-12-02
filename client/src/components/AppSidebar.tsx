import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  DollarSign,
  Truck as TruckIcon,
  LayoutDashboard,
  LogOut,
  Users,
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const adminNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Gestión de Usuarios", url: "/admin/users", icon: Users },
  { title: "Reglas de Precios", url: "/admin/pricing", icon: DollarSign },
  { title: "Tipos de Vehículo", url: "/admin/vehicles", icon: TruckIcon },
];

const workerNavItems = [
  { title: "Mis Servicios", url: "/", icon: LayoutDashboard },
];

function NavLink({ href, icon: Icon, title }: any) {
  const [location] = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleClick = (e: React.MouseEvent) => {
    // Close sidebar only on mobile when clicking
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Link href={href} onClick={handleClick}>
      <SidebarMenuButton isActive={location === href}>
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </SidebarMenuButton>
    </Link>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout, isLogoutPending } = useAuth();
  const { setOpenMobile, isMobile } = useSidebar();

  // Close sidebar only on mobile when location changes
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [location, setOpenMobile, isMobile]);

  if (!user) {
    return null;
  }

  const isAdmin = user.role === "admin";
  const navItems = isAdmin ? adminNavItems : workerNavItems;
  const displayName = user.displayName || user.username || "Usuario";
  const initials = String(displayName || "U").slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <TruckIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">DirectTransports</h1>
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
                  <NavLink 
                    href={item.url}
                    icon={item.icon}
                    title={item.title}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {isAdmin ? "Administrador" : "Trabajador"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center text-xs"
          onClick={handleLogout}
          disabled={isLogoutPending}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLogoutPending ? "Cerrando..." : "Cerrar Sesión"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
