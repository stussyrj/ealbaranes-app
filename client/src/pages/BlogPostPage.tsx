import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/Spinner";
import { Calendar, Clock, ArrowLeft, BookOpen, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BlogPost } from "@shared/schema";
import { useEffect } from "react";

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

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { toast } = useToast();

  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: ["/api/blog", slug],
    enabled: !!slug,
  });

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | Blog de eAlbarán`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription && post.metaDescription) {
        metaDescription.setAttribute("content", post.metaDescription);
      }
    }
    return () => {
      document.title = "eAlbarán - Gestión Digital de Albaranes de Transporte";
    };
  }, [post]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt || post?.metaDescription,
          url,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Enlace copiado",
        description: "El enlace ha sido copiado al portapapeles",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="border-destructive">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Artículo no encontrado</h2>
              <p className="text-muted-foreground mb-6">
                El artículo que buscas no existe o ha sido eliminado.
              </p>
              <Link href="/blog">
                <Button data-testid="button-back-to-blog">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al blog
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.metaDescription || post.excerpt,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt,
            author: {
              "@type": "Organization",
              name: "eAlbarán",
              url: "https://ealbaranes.replit.app",
            },
            publisher: {
              "@type": "Organization",
              name: "eAlbarán",
              logo: {
                "@type": "ImageObject",
                url: "https://ealbaranes.replit.app/app-icon-512.png",
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://ealbaranes.replit.app/blog/${post.slug}`,
            },
          }),
        }}
      />

      <header className="bg-gradient-to-r from-orange-600 to-purple-700 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/blog">
            <span className="inline-flex items-center gap-2 text-orange-100 hover:text-white mb-4 cursor-pointer" data-testid="link-back-to-blog">
              <ArrowLeft className="h-4 w-4" />
              Volver al blog
            </span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-post-title">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-orange-100">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{estimateReadTime(post.content)} min de lectura</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <article 
          className="prose prose-lg dark:prose-invert max-w-none"
          data-testid="article-content"
        >
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        <div className="mt-12 pt-8 border-t flex flex-wrap items-center justify-between gap-4">
          <Link href="/blog">
            <Button variant="outline" data-testid="button-back-to-blog-bottom">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al blog
            </Button>
          </Link>
          <Button variant="outline" onClick={handleShare} data-testid="button-share">
            <Share2 className="h-4 w-4 mr-2" />
            Compartir
          </Button>
        </div>

        <Card className="mt-12 bg-gradient-to-r from-orange-50 to-purple-50 dark:from-orange-950/20 dark:to-purple-950/20 border-orange-200 dark:border-orange-800">
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-semibold mb-2">¿Quieres digitalizar tus albaranes?</h3>
            <p className="text-muted-foreground mb-4">
              Prueba eAlbarán gratis y empieza a gestionar tus albaranes de transporte de forma digital.
            </p>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700" data-testid="button-cta-register">
                Empezar gratis
              </Button>
            </Link>
          </CardContent>
        </Card>
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
