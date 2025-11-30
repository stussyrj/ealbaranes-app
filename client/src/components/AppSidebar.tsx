import { Link, useLocation } from "wouter";
import {
  Calculator,
  History,
  Settings,
  DollarSign,
  Truck as TruckIcon,
  MapPin,
  Users,
  LayoutDashboard,
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
import { useAuth } from "@/contexts/AuthContext";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Nuevo Presupuesto", url: "/quote", icon: Calculator },
  { title: "Historial", url: "/history", icon: History },
];

const adminNavItems = [
  { title: "Reglas de Precios", url: "/admin/pricing", icon: DollarSign },
  { title: "Tipos de Vehículo", url: "/admin/vehicles", icon: TruckIcon },
  { title: "Zonas", url: "/admin/zones", icon: MapPin },
  { title: "Usuarios", url: "/admin/users", icon: Users },
];

export function AppSidebar() {
  const [location] = useLocation();
  const authContext = useAuth();
  const user = authContext?.user || null;
  const isAdmin = !!(user && user.isAdmin === true);
  
  const username = user && typeof user.username === "string" ? String(user.username) : "";
  const email = user && typeof user.email === "string" ? String(user.email) : "";
  const userInitials = username ? username.slice(0, 2).toUpperCase() : "U";

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <TruckIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">TransQuote</h1>
            <p className="text-xs text-muted-foreground">Presupuestos de Transporte</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const itemTitle = item?.title || "";
                const testId = `nav-${String(itemTitle).toLowerCase().replace(/\s/g, "-")}`;
                return (
                  <SidebarMenuItem key={itemTitle}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={testId}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administración</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => {
                  const itemTitle = item?.title || "";
                  const testId = `nav-admin-${String(itemTitle).toLowerCase().replace(/\s/g, "-")}`;
                  return (
                    <SidebarMenuItem key={itemTitle}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                        data-testid={testId}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{username || "Usuario"}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
          <SidebarMenuButton asChild className="h-9 w-9 p-0">
            <Link href="/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
