import { Link, useLocation } from "wouter";
import { Package, LayoutDashboard, History, Store } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider } from "@/components/ui/sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Products", href: "/products", icon: Package },
    { name: "Movements", href: "/movements", icon: History },
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden w-full bg-background">
        <Sidebar className="border-r border-border bg-sidebar h-full hidden md:flex">
          <SidebarHeader className="p-4 border-b border-border/50">
            <div className="flex items-center gap-2 px-2 text-primary font-serif font-bold text-xl">
              <Store className="h-6 w-6" />
              <span>StockSmart</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => {
                    const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="font-medium"
                        >
                          <Link href={item.href} className="flex items-center gap-3">
                            <item.icon className="h-5 w-5" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        
        <main className="flex-1 overflow-y-auto">
          <div className="md:hidden flex items-center p-4 border-b bg-sidebar">
             <div className="flex items-center gap-2 text-primary font-serif font-bold text-lg">
              <Store className="h-5 w-5" />
              <span>StockSmart</span>
            </div>
            <div className="ml-auto flex gap-4">
              {navigation.map(item => (
                <Link key={item.name} href={item.href} className={`text-sm font-medium ${location === item.href || (item.href !== "/" && location.startsWith(item.href)) ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
