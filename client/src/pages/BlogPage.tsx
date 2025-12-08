import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/Spinner";
import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";
import type { BlogPost } from "@shared/schema";

function formatDate(dateString: string | Date | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function estimateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export default function BlogPage() {
  const { data: posts, isLoading, error } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-orange-600 to-purple-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8" />
            <h1 className="text-4xl font-bold" data-testid="text-blog-title">
              Blog de eAlbarán
            </h1>
          </div>
          <p className="text-xl text-orange-100 max-w-2xl mx-auto">
            Artículos sobre transporte, logística y gestión de albaranes digitales
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="py-8 text-center text-destructive">
              Error al cargar los artículos. Por favor, intenta de nuevo.
            </CardContent>
          </Card>
        )}

        {posts && posts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Próximamente</h2>
              <p className="text-muted-foreground">
                Estamos preparando contenido interesante sobre transporte y logística.
              </p>
            </CardContent>
          </Card>
        )}

        {posts && posts.length > 0 && (
          <div className="space-y-8">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card 
                  className="hover-elevate cursor-pointer transition-all"
                  data-testid={`card-blog-post-${post.id}`}
                >
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(post.publishedAt)}</span>
                      <span className="mx-2">•</span>
                      <Clock className="h-4 w-4" />
                      <span>{estimateReadTime(post.content)} min de lectura</span>
                    </div>
                    <CardTitle className="text-2xl hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {post.excerpt && (
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <span>Leer artículo</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 pt-8 border-t">
          <div className="text-center">
            <Link href="/">
              <span className="text-primary hover:underline cursor-pointer" data-testid="link-back-home">
                ← Volver a eAlbarán
              </span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-muted py-8 px-4 mt-12">
        <div className="max-w-4xl mx-auto text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} eAlbarán - Gestión Digital de Albaranes de Transporte</p>
          <p className="mt-2">
            <a href="mailto:info@ealbaranes.es" className="hover:text-foreground">
              info@ealbaranes.es
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
