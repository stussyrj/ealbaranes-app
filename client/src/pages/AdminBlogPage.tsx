import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/Spinner";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Edit, Trash2, Eye, EyeOff, Save, X, LogOut, 
  BookOpen, Calendar, Lock 
} from "lucide-react";
import type { BlogPost } from "@shared/schema";

function formatDate(dateString: string | Date | null): string {
  if (!dateString) return "No publicado";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminBlogPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    metaDescription: "",
    coverImage: "",
    isPublished: false,
  });

  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/admin-blog/posts"],
    enabled: isLoggedIn,
    queryFn: async () => {
      const res = await fetch("/api/admin-blog/posts", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error("Error fetching posts");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/admin-blog/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error creating post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin-blog/posts"] });
      toast({ title: "Artículo creado" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Error al crear artículo", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const res = await fetch(`/api/admin-blog/posts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error updating post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin-blog/posts"] });
      toast({ title: "Artículo actualizado" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Error al actualizar artículo", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin-blog/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error("Error deleting post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin-blog/posts"] });
      toast({ title: "Artículo eliminado" });
    },
    onError: () => {
      toast({ title: "Error al eliminar artículo", variant: "destructive" });
    },
  });

  const handleLogin = async () => {
    try {
      const res = await fetch("/api/admin-blog/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsLoggedIn(true);
        setAuthToken(password);
        toast({ title: "Acceso concedido" });
      } else {
        toast({ title: "Contraseña incorrecta", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error de conexión", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthToken("");
    setPassword("");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      metaDescription: "",
      coverImage: "",
      isPublished: false,
    });
    setEditingPost(null);
    setIsCreating(false);
  };

  const startEditing = (post: BlogPost) => {
    setEditingPost(post);
    setIsCreating(false);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || "",
      metaDescription: post.metaDescription || "",
      coverImage: post.coverImage || "",
      isPublished: post.isPublished || false,
    });
  };

  const startCreating = () => {
    setIsCreating(true);
    setEditingPost(null);
    resetForm();
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.slug || !formData.content) {
      toast({ title: "Completa todos los campos requeridos", variant: "destructive" });
      return;
    }

    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle>Administración del Blog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Contraseña de acceso</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Introduce la contraseña"
                data-testid="input-admin-password"
              />
            </div>
            <Button onClick={handleLogin} className="w-full" data-testid="button-login">
              Acceder
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-orange-600" />
            <h1 className="text-xl font-semibold">Blog Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={startCreating} data-testid="button-new-post">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo artículo
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {(isCreating || editingPost) && (
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingPost ? "Editar artículo" : "Nuevo artículo"}</CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4 text-red-600 dark:text-red-400" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Título del artículo"
                    data-testid="input-post-title"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="url-del-articulo"
                    data-testid="input-post-slug"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="excerpt">Extracto</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Breve resumen del artículo (aparece en listados)"
                  rows={2}
                  data-testid="input-post-excerpt"
                />
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description (SEO)</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
                  placeholder="Descripción para buscadores (máx. 160 caracteres)"
                  rows={2}
                  data-testid="input-post-meta"
                />
              </div>

              <div>
                <Label htmlFor="content">Contenido (HTML) *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="<h2>Subtítulo</h2><p>Contenido del artículo...</p>"
                  rows={12}
                  className="font-mono text-sm"
                  data-testid="input-post-content"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isPublished}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isPublished: checked }))
                    }
                    data-testid="switch-published"
                  />
                  <Label>Publicar artículo</Label>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-post"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Spinner className="h-4 w-4 mr-2" />
                    )}
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        )}

        {posts && posts.length === 0 && !isCreating && (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Sin artículos</h2>
              <p className="text-muted-foreground mb-4">
                Crea tu primer artículo para el blog.
              </p>
              <Button onClick={startCreating}>
                <Plus className="h-4 w-4 mr-2" />
                Crear artículo
              </Button>
            </CardContent>
          </Card>
        )}

        {posts && posts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Artículos ({posts.length})</h2>
            {posts.map((post) => (
              <Card key={post.id} data-testid={`card-admin-post-${post.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{post.title}</h3>
                        {post.isPublished ? (
                          <Badge variant="default" className="bg-green-600">
                            <Eye className="h-3 w-3 mr-1" />
                            Publicado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Borrador
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        /{post.slug}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {post.isPublished && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                          data-testid={`button-view-${post.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing(post)}
                        data-testid={`button-edit-${post.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("¿Eliminar este artículo?")) {
                            deleteMutation.mutate(post.id);
                          }
                        }}
                        data-testid={`button-delete-${post.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
