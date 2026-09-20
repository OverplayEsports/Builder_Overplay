import { useState, useRef } from "react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  Plus,
  Trash2,
  Edit3,
  Image as ImageIcon,
  Link as LinkIcon,
  Check,
  X,
  Sparkles,
  Cloud,
  CloudUpload,
  Key,
  HelpCircle,
  Eye,
  FileText,
  Clock,
  User,
  Calendar,
  Search,
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Minus,
  Copy,
  ExternalLink,
  Layers,
  ArrowRight,
  Globe,
  RefreshCw,
} from "lucide-react";
import { useBuilder } from "../../context/BuilderContext";
import type { NewsArticle, NewsCategory } from "../../types/builder";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

const CATEGORY_OPTIONS: { id: NewsCategory; label: string; chip: string }[] = [
  {
    id: "overwatch",
    label: "Overwatch",
    chip: "bg-orange-500/15 text-orange-300 ring-orange-400/30",
  },
  {
    id: "fortnite",
    label: "Fortnite",
    chip: "bg-violet-500/15 text-violet-300 ring-violet-400/30",
  },
  {
    id: "valorant",
    label: "VALORANT",
    chip: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  },
  {
    id: "marvel-rivals",
    label: "Marvel Rivals",
    chip: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  },
];

export function NewsEditor() {
  const {
    state,
    addNewsArticle,
    updateNewsArticle,
    removeNewsArticle,
    setNewsList,
    updateCloudflareConfig,
    updateWordpressUrl,
  } = useBuilder();

  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [showCloudflareModal, setShowCloudflareModal] = useState(false);
  const [showWordpressModal, setShowWordpressModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncingWp, setIsSyncingWp] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // WordPress URL local form state
  const [wpUrlInput, setWpUrlInput] = useState(
    state.wordpressUrl ||
      (typeof window !== "undefined" &&
        localStorage.getItem("overplay_wordpress_url")) ||
      "https://overplay5.wordpress.com"
  );

  // Cloudflare R2 local form state
  const [cfAccountId, setCfAccountId] = useState(
    state.cloudflareConfig?.accountId || "a7d64e57350dbbddcc2b65f7d8ede3a0"
  );
  const [cfBucketName, setCfBucketName] = useState(
    state.cloudflareConfig?.bucketName || "imagenesoverplay"
  );
  const [cfAccessKeyId, setCfAccessKeyId] = useState(
    state.cloudflareConfig?.accessKeyId || "cbce2ec53f08bc186b64d463df8325f0"
  );
  const [cfSecretAccessKey, setCfSecretAccessKey] = useState(
    state.cloudflareConfig?.secretAccessKey || "aaf8802d017d1da21588dc44e4bb886e5ed1cfddad234900faa874fe1ff0e780"
  );
  const [cfPublicUrl, setCfPublicUrl] = useState(
    state.cloudflareConfig?.publicUrl || "https://pub-def6d9ceb4ef4e8f84ee8a391d2b0b27.r2.dev"
  );

  const headerFileInputRef = useRef<HTMLInputElement>(null);
  const bodyFileInputRef = useRef<HTMLInputElement>(null);
  const attachedFileInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const isCloudflareConfigured =
    Boolean(state.cloudflareConfig?.accountId?.trim()) &&
    Boolean(state.cloudflareConfig?.bucketName?.trim()) &&
    Boolean(state.cloudflareConfig?.accessKeyId?.trim()) &&
    Boolean(state.cloudflareConfig?.secretAccessKey?.trim()) &&
    Boolean(state.cloudflareConfig?.publicUrl?.trim());

  // Filter articles
  const filteredArticles = state.news.filter((item) => {
    const matchesCategory =
      selectedCategory === "todas" || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle Cloudflare R2 direct upload via S3 API
  const uploadToCloudflare = async (file: File): Promise<string> => {
    if (!isCloudflareConfigured) {
      // Fallback to local Data URL for preview if credentials not provided
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    }

    const { accountId, bucketName, accessKeyId, secretAccessKey, publicUrl } =
      state.cloudflareConfig;

    const cleanBaseName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .toLowerCase();
    const ext = (file.name.split(".").pop() || "webp").toLowerCase();
    const fileKey = `news/${Date.now()}-${cleanBaseName}.${ext}`;

    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const fileBytes = new Uint8Array(await file.arrayBuffer());

    const uploadCmd = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: fileBytes,
      ContentType: file.type || "image/jpeg",
      ContentLength: fileBytes.byteLength,
    });

    try {
      await s3Client.send(uploadCmd);
      return `${publicUrl.replace(/\/+$/, "")}/${fileKey}`;
    } catch (err: any) {
      console.error("Error al subir a Cloudflare R2:", err);
      throw new Error(
        err.message ||
          "Error al subir imagen a Cloudflare R2. Verifica las credenciales o reglas CORS del bucket."
      );
    }
  };

  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingArticle) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const imageUrl = await uploadToCloudflare(file);
      setEditingArticle({ ...editingArticle, image: imageUrl });
      setUploadSuccess(
        isCloudflareConfigured
          ? "¡Imagen subida a Cloudflare Images con éxito!"
          : "Imagen cargada localmente (configura Cloudflare para hosting CDN)."
      );
    } catch (err: any) {
      setUploadError(err.message || "Error al subir la imagen");
    } finally {
      setIsUploading(false);
      if (headerFileInputRef.current) headerFileInputRef.current.value = "";
    }
  };

  const handleBodyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingArticle) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const imageUrl = await uploadToCloudflare(file);
      insertMarkdownAtCursor(`\n\n![${file.name.replace(/\.[^/.]+$/, "")}](${imageUrl})\n\n`);
      setUploadSuccess(
        isCloudflareConfigured
          ? "¡Imagen subida e insertada en el texto!"
          : "Imagen insertada con preview local."
      );
    } catch (err: any) {
      setUploadError(err.message || "Error al subir la imagen al cuerpo");
    } finally {
      setIsUploading(false);
      if (bodyFileInputRef.current) bodyFileInputRef.current.value = "";
    }
  };

  const handleAttachedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingArticle) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadToCloudflare(files[i]);
        newUrls.push(url);
      }
      setEditingArticle({
        ...editingArticle,
        attachedImages: [...(editingArticle.attachedImages || []), ...newUrls],
      });
      setUploadSuccess("¡Imágenes adjuntas subidas correctamente!");
    } catch (err: any) {
      setUploadError(err.message || "Error al subir imágenes adjuntas");
    } finally {
      setIsUploading(false);
      if (attachedFileInputRef.current) attachedFileInputRef.current.value = "";
    }
  };

  const insertMarkdownAtCursor = (insertion: string) => {
    if (!contentTextareaRef.current || !editingArticle) return;
    const textarea = contentTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editingArticle.content;
    const newText = text.substring(0, start) + insertion + text.substring(end);
    setEditingArticle({ ...editingArticle, content: newText });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + insertion.length,
        start + insertion.length
      );
    }, 50);
  };

  const wrapSelectionWith = (prefix: string, suffix: string = prefix, placeholder: string = "texto") => {
    if (!contentTextareaRef.current || !editingArticle) return;
    const textarea = contentTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editingArticle.content;
    const selectedText = text.substring(start, end) || placeholder;
    const wrapped = `${prefix}${selectedText}${suffix}`;
    const newText = text.substring(0, start) + wrapped + text.substring(end);
    setEditingArticle({ ...editingArticle, content: newText });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 50);
  };

  const handleSaveArticle = () => {
    if (!editingArticle) return;
    if (state.news.some((item) => item.id === editingArticle.id)) {
      updateNewsArticle(editingArticle.id, editingArticle);
    } else {
      addNewsArticle(editingArticle);
    }
    setEditingArticle(null);
  };

  const handleCreateNew = () => {
    const newId = `news-${Date.now()}`;
    setEditingArticle({
      id: newId,
      category: "overwatch",
      title: "Nuevo Título de Noticia",
      subtitle:
        "Subtítulo explicativo con los aspectos más destacados de esta publicación.",
      excerpt:
        "Extracto conciso para el banner principal y tarjetas del portal.",
      author: "Staff Overplay",
      date: new Date().toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      image: "/images/tourney-banner.jpg",
      readTime: "3 min",
      content: `## Título de la Sección Principal

Escribe aquí los párrafos explicativos con la información completa.

### Subtítulo de Información Detallada

- Punto clave número 1
- Punto clave número 2
- Punto clave número 3

> "Cita o declaración relevante para la comunidad de Overplay."`,
      attachedImages: [],
    });
  };

  const handleSaveCloudflareConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateCloudflareConfig({
      accountId: cfAccountId.trim(),
      bucketName: cfBucketName.trim(),
      accessKeyId: cfAccessKeyId.trim(),
      secretAccessKey: cfSecretAccessKey.trim(),
      publicUrl: cfPublicUrl.trim(),
    });
    setShowCloudflareModal(false);
    setUploadSuccess("¡Configuración de Cloudflare R2 guardada correctamente!");
  };

  const handleSaveWordpressUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = wpUrlInput.trim().replace(/\/+$/, "");
    updateWordpressUrl(cleanUrl);
    setShowWordpressModal(false);
    if (cleanUrl) {
      handleSyncFromWordpress(cleanUrl);
    }
  };

  const handleSyncFromWordpress = async (customUrl?: string) => {
    const targetUrl = (customUrl || wpUrlInput || state.wordpressUrl || "").trim().replace(/\/+$/, "");
    if (!targetUrl) {
      setShowWordpressModal(true);
      return;
    }

    setIsSyncingWp(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const clean = targetUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
      const endpoints: string[] = [];

      if (clean.includes("wordpress.com")) {
        const siteSlug = clean.split("/")[0];
        endpoints.push(
          `https://public-api.wordpress.com/wp/v2/sites/${siteSlug}/posts?_embed=1&per_page=20`
        );
      }
      endpoints.push(`${targetUrl}/wp-json/wp/v2/posts?_embed=1&per_page=20&status=publish`);
      endpoints.push(`${targetUrl}/?rest_route=/wp/v2/posts&_embed=1&per_page=20&status=publish`);

      let posts: any[] | null = null;
      let lastErr: any = null;

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            headers: { Accept: "application/json" },
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              posts = data;
              break;
            }
          }
        } catch (e) {
          lastErr = e;
        }
      }

      if (!posts) {
        throw new Error(
          lastErr?.message ||
            `No se pudo conectar con WordPress en '${targetUrl}'. Verifica que el sitio esté publicado.`
        );
      }

      if (posts.length === 0) {
        setUploadSuccess("WordPress conectado correctamente, pero no hay entradas publicadas.");
        return;
      }

      // Helper function to decode entities
      const decodeHtml = (str: string) => {
        const doc = new DOMParser().parseFromString(str || "", "text/html");
        return doc.body.textContent || str;
      };

      const cleanHtmlTags = (str: string) => (str || "").replace(/<[^>]*>?/gm, "").trim();

      const syncedArticles: NewsArticle[] = posts.map((post: any) => {
        const title = decodeHtml(post.title?.rendered || "Sin título");
        const rawContent = post.content?.rendered || "";
        const rawExcerpt = post.excerpt?.rendered || "";

        const featuredMedia =
          post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
          post._embedded?.["wp:featuredmedia"]?.[0]?.media_details?.sizes?.large?.source_url ||
          post.featured_media_src_url ||
          "/images/tourney-banner.jpg";

        // Category deduction
        let cat: NewsCategory = "overwatch";
        const terms = post._embedded?.["wp:term"]?.flat() || [];
        const termStrings = terms
          .map((t: any) => `${t.slug || ""} ${t.name || ""}`.toLowerCase())
          .join(" ");
        const postSlug = (post.slug || "").toLowerCase();
        const postTitle = (post.title?.rendered || "").toLowerCase();
        const fullText = `${termStrings} ${postSlug} ${postTitle}`;

        if (
          fullText.includes("fortnite") ||
          fullText.includes("fornite") ||
          fullText.includes("battle royale")
        ) {
          cat = "fortnite";
        } else if (
          fullText.includes("marvel") ||
          fullText.includes("rivals") ||
          fullText.includes("netease")
        ) {
          cat = "marvel-rivals";
        } else if (
          fullText.includes("valorant") ||
          fullText.includes("val ") ||
          fullText.includes("vct")
        ) {
          cat = "valorant";
        } else if (
          fullText.includes("overwatch") ||
          fullText.includes("ow2") ||
          fullText.includes("blizzard")
        ) {
          cat = "overwatch";
        }

        const authorName = post._embedded?.author?.[0]?.name || "Staff Overplay";
        const dateFormatted = post.date
          ? new Date(post.date).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "Reciente";

        // Extracción inteligente de subtítulo y separación del desarrollo
        let cleanSubtitle = "";
        let cleanContent = rawContent;

        if (post.acf?.subtitle || post.acf?.subtitulo || post.meta?.subtitle) {
          cleanSubtitle = decodeHtml(
            post.acf?.subtitle || post.acf?.subtitulo || post.meta?.subtitle
          );
        } else {
          const headingMatch =
            rawContent.match(
              /^\s*<(h[1-4]|p\s+class="[^"]*(?:subtitle|lead|has-large-font-size|wp-block-heading)[^"]*")[^>]*>([\s\S]*?)<\/\1>/i
            ) || rawContent.match(/^\s*<(h[1-4])[^>]*>([\s\S]*?)<\/\1>/i);

          if (headingMatch) {
            const extractedHeadingText = cleanHtmlTags(headingMatch[2]);
            if (extractedHeadingText) {
              cleanSubtitle = decodeHtml(extractedHeadingText);
              cleanContent = rawContent.replace(headingMatch[0], "").trim();
            }
          } else {
            const isAutoExcerpt =
              /\[(?:&hellip;|\.\.\.)\]/.test(rawExcerpt) ||
              /&hellip;$/.test(rawExcerpt.trim());

            if (rawExcerpt && !isAutoExcerpt) {
              cleanSubtitle = decodeHtml(cleanHtmlTags(rawExcerpt));
            } else if (rawExcerpt) {
              const textWithoutEllipsis = cleanHtmlTags(rawExcerpt)
                .replace(/\[(?:&hellip;|\.\.\.)\]/g, "")
                .trim();
              const firstSentenceMatch = textWithoutEllipsis.match(/^([^.!?]+[.!?])/);
              cleanSubtitle = decodeHtml(
                firstSentenceMatch ? firstSentenceMatch[1].trim() : textWithoutEllipsis
              );
            }
          }
        }

        const wordsCount = cleanHtmlTags(cleanContent || rawContent).split(/\s+/).filter(Boolean).length;
        const readTime = `${Math.max(1, Math.ceil(wordsCount / 180))} min`;
        const shortExcerpt =
          cleanSubtitle ||
          decodeHtml(cleanHtmlTags(cleanContent).slice(0, 150) + "...");

        return {
          id: String(post.id || post.slug),
          category: cat,
          title,
          subtitle: cleanSubtitle,
          excerpt: shortExcerpt,
          author: authorName,
          date: dateFormatted,
          image: featuredMedia,
          readTime,
          content: cleanContent,
          attachedImages: [featuredMedia],
        };
      });

      setNewsList(syncedArticles);
      setUploadSuccess(`¡Éxito! Se sincronizaron ${syncedArticles.length} noticias desde WordPress.`);
    } catch (err: any) {
      setUploadError(err.message || "No se pudo sincronizar con WordPress.");
    } finally {
      setIsSyncingWp(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Top Banner */}
      <div className="card-surface relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-purple-300">
              <Sparkles className="h-3 w-3" />
              Noticias & Anuncios
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold uppercase italic text-white sm:text-3xl">
              Integración WordPress & Cloudflare CDN
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-white/60 sm:text-sm max-w-2xl">
              Las noticias se consumen directamente desde la API REST de WordPress. Estructura: Imagen de cabecera, Título, Subtítulo y Texto enriquecido con imágenes.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowWordpressModal(true)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer",
                state.wordpressUrl || wpUrlInput
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20"
                  : "border-white/15 bg-white/[0.04] text-white/70 hover:bg-white/10"
              )}
            >
              <Globe className="h-4 w-4 text-blue-400" />
              <span>
                {state.wordpressUrl || wpUrlInput
                  ? "WordPress Conectado"
                  : "Conectar WordPress"}
              </span>
            </button>

            {(state.wordpressUrl || wpUrlInput) && (
              <button
                disabled={isSyncingWp}
                onClick={() => handleSyncFromWordpress()}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50"
                title="Sincronizar posts desde WordPress"
              >
                <RefreshCw className={cn("h-4 w-4 text-orange-400", isSyncingWp && "animate-spin")} />
                <span>{isSyncingWp ? "Sincronizando..." : "Sincronizar"}</span>
              </button>
            )}

            <button
              onClick={() => {
                setCfAccountId(state.cloudflareConfig?.accountId || "");
                setCfApiToken(state.cloudflareConfig?.apiToken || "");
                setCfAccountHash(state.cloudflareConfig?.accountHash || "");
                setShowCloudflareModal(true);
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer",
                isCloudflareConfigured
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
              )}
            >
              <Cloud className="h-4 w-4" />
              <span>
                {isCloudflareConfigured
                  ? "Cloudflare CDN"
                  : "Configurar Cloudflare"}
              </span>
            </button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateNew}
              className="gap-2 shadow-lg shadow-orange-600/30"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Noticia</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategory("todas")}
            className={cn(
              "rounded-xl border px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
              selectedCategory === "todas"
                ? "border-orange-500 bg-orange-500/20 text-orange-300"
                : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white"
            )}
          >
            Todas ({state.news.length})
          </button>
          {CATEGORY_OPTIONS.map((cat) => {
            const count = state.news.filter((n) => n.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "rounded-xl border px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                  isSelected
                    ? "border-orange-500 bg-orange-500/20 text-orange-300 shadow-sm"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white"
                )}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Buscar noticias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 py-1.5 pl-8 pr-3 text-xs text-white placeholder-white/40 transition-colors focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Article Cards Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredArticles.map((article) => {
          const catInfo =
            CATEGORY_OPTIONS.find((c) => c.id === article.category) ||
            CATEGORY_OPTIONS[0];

          return (
            <article
              key={article.id}
              className="card-surface group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl"
            >
              <div>
                {/* Header Image */}
                <div className="relative aspect-video w-full overflow-hidden bg-white/5">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/600x340/151515/orange?text=Overplay+News";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d10] via-transparent to-transparent" />

                  {/* Badges */}
                  <div className="absolute left-3 top-3 flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-wider ring-1 backdrop-blur-md",
                        catInfo.chip
                      )}
                    >
                      {catInfo.label}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5 text-[10px] font-medium text-white/70">
                    <Clock className="h-3 w-3 text-orange-400" />
                    <span>{article.readTime}</span>
                  </div>
                </div>

                {/* Article Info */}
                <div className="p-5">
                  <div className="flex items-center gap-2 text-[10px] text-white/50">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-orange-400/80" />
                      {article.author}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-orange-400/80" />
                      {article.date}
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-display text-base font-bold leading-snug text-white group-hover:text-orange-300 transition-colors line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="mt-1.5 text-xs leading-relaxed text-white/60 line-clamp-2">
                    {article.subtitle}
                  </p>

                  {article.attachedImages && article.attachedImages.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-purple-300 font-semibold">
                      <ImageIcon className="h-3 w-3" />
                      <span>{article.attachedImages.length} imagen(es) adjunta(s)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] p-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingArticle({ ...article })}
                  className="gap-1.5 text-xs text-orange-400 hover:text-white"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Editar Artículo</span>
                </Button>

                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `¿Eliminar la noticia "${article.title}"?`
                      )
                    ) {
                      removeNewsArticle(article.id);
                    }
                  }}
                  className="rounded-lg p-2 text-white/40 transition-colors hover:bg-rose-500/20 hover:text-rose-400 cursor-pointer"
                  title="Eliminar Noticia"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {filteredArticles.length === 0 && (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <FileText className="h-12 w-12 text-white/30" />
          <h3 className="mt-4 font-display text-lg font-bold uppercase text-white">
            No se encontraron noticias
          </h3>
          <p className="mt-1 text-xs text-white/50">
            Intenta cambiar el filtro de categoría o tu búsqueda.
          </p>
          <Button
            size="sm"
            variant="primary"
            onClick={handleCreateNew}
            className="mt-4 gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Crear Primera Noticia</span>
          </Button>
        </div>
      )}

      {/* Full Article Editor Modal */}
      {editingArticle && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
          <div className="card-surface relative my-auto flex max-h-[calc(100vh-6rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0e0e12] shadow-2xl">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-white/[0.02] px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <Edit3 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold uppercase tracking-wider text-white">
                    Editor de Noticia
                  </h2>
                  <p className="text-[11px] text-white/50">
                    Estructura: Cabecera → Título → Subtítulo → Cuerpo con Cloudflare Images
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/[0.08] cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5 text-orange-400" />
                  <span>Previsualizar</span>
                </button>
                <button
                  onClick={() => setEditingArticle(null)}
                  className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Notification Bar */}
            {uploadSuccess && (
              <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-6 py-2.5 text-xs text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
                <button
                  onClick={() => setUploadSuccess(null)}
                  className="text-emerald-300 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {uploadError && (
              <div className="bg-rose-500/15 border-b border-rose-500/30 px-6 py-2.5 text-xs text-rose-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
                <button
                  onClick={() => setUploadError(null)}
                  className="text-rose-300 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 1. Header Image */}
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <label className="block font-display text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">
                  1. Imagen de Cabecera (Cover)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] text-white/50 block mb-1">
                        URL de la Imagen o Enlace Cloudflare:
                      </span>
                      <input
                        type="text"
                        value={editingArticle.image}
                        onChange={(e) =>
                          setEditingArticle({
                            ...editingArticle,
                            image: e.target.value,
                          })
                        }
                        placeholder="https://imagedelivery.net/... o /images/banner.jpg"
                        className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={headerFileInputRef}
                        onChange={handleHeaderImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => headerFileInputRef.current?.click()}
                        className="flex items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-xs font-semibold text-orange-300 hover:bg-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <CloudUpload className="h-4 w-4" />
                        <span>
                          {isUploading
                            ? "Subiendo a Cloudflare..."
                            : "Subir a Cloudflare Images"}
                        </span>
                      </button>
                      {!isCloudflareConfigured && (
                        <span className="text-[10px] text-amber-400 italic">
                          (Modo local sin API key)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/50">
                    <img
                      src={editingArticle.image}
                      alt="Header Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/600x340/151515/orange?text=Sin+Imagen";
                      }}
                    />
                    <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-[9px] text-white/80">
                      Vista previa cabecera
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Metadata: Title, Subtitle, Category, Author, Date, ReadTime */}
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-4">
                <label className="block font-display text-xs font-bold uppercase tracking-wider text-orange-400">
                  2. Título, Subtítulo & Metadatos
                </label>

                <div>
                  <span className="text-[11px] text-white/60 block mb-1 font-semibold">
                    Título Principal:
                  </span>
                  <input
                    type="text"
                    value={editingArticle.title}
                    onChange={(e) =>
                      setEditingArticle({
                        ...editingArticle,
                        title: e.target.value,
                      })
                    }
                    placeholder="Ej. Overplay Tourney 4 abre inscripciones"
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 font-display text-sm font-bold text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-white/60 block mb-1 font-semibold">
                    Subtítulo (Resumen introductorio):
                  </span>
                  <textarea
                    rows={2}
                    value={editingArticle.subtitle}
                    onChange={(e) =>
                      setEditingArticle({
                        ...editingArticle,
                        subtitle: e.target.value,
                      })
                    }
                    placeholder="Breve explicación de la noticia..."
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white/90 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[11px] text-white/60 block mb-1 font-semibold">
                      Categoría:
                    </span>
                    <select
                      value={editingArticle.category}
                      onChange={(e) =>
                        setEditingArticle({
                          ...editingArticle,
                          category: e.target.value as NewsCategory,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none cursor-pointer"
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] text-white/60 block mb-1 font-semibold">
                      Autor:
                    </span>
                    <input
                      type="text"
                      value={editingArticle.author}
                      onChange={(e) =>
                        setEditingArticle({
                          ...editingArticle,
                          author: e.target.value,
                        })
                      }
                      placeholder="Staff Overplay"
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-white/60 block mb-1 font-semibold">
                      Fecha:
                    </span>
                    <input
                      type="text"
                      value={editingArticle.date}
                      onChange={(e) =>
                        setEditingArticle({
                          ...editingArticle,
                          date: e.target.value,
                        })
                      }
                      placeholder="12 Mar 2026"
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-white/60 block mb-1 font-semibold">
                      Tiempo de Lectura:
                    </span>
                    <input
                      type="text"
                      value={editingArticle.readTime}
                      onChange={(e) =>
                        setEditingArticle({
                          ...editingArticle,
                          readTime: e.target.value,
                        })
                      }
                      placeholder="3 min"
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. General Text & Formatting Toolbar */}
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <label className="block font-display text-xs font-bold uppercase tracking-wider text-orange-400">
                    3. Texto General & Herramientas de Edición
                  </label>
                  <span className="text-[10px] text-white/40">
                    Soporta Markdown: encabezados, listas, citas e imágenes embebidas.
                  </span>
                </div>

                {/* Rich text Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-1.5">
                  <button
                    type="button"
                    onClick={() => wrapSelectionWith("**", "**", "texto en negrita")}
                    title="Negrita"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent hover:border-white/10 hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                  >
                    <Bold className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => wrapSelectionWith("*", "*", "texto en cursiva")}
                    title="Cursiva"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent hover:border-white/10 hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                  >
                    <Italic className="h-4 w-4" />
                  </button>

                  <div className="h-4 w-px bg-white/10 mx-0.5" />

                  <button
                    type="button"
                    onClick={() => insertMarkdownAtCursor("\n\n## Título de Sección\n\n")}
                    title="Encabezado H2"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent hover:border-white/10 hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                  >
                    <Heading2 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertMarkdownAtCursor("\n\n### Subtítulo\n\n")}
                    title="Subencabezado H3"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent hover:border-white/10 hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                  >
                    <Heading3 className="h-4 w-4" />
                  </button>

                  <div className="h-4 w-px bg-white/10 mx-0.5" />

                  <button
                    type="button"
                    onClick={() => insertMarkdownAtCursor("\n\n> Cita o declaración importante.\n\n")}
                    title="Cita"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent hover:border-white/10 hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                  >
                    <Quote className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertMarkdownAtCursor("\n- Elemento de lista\n- Elemento de lista\n")}
                    title="Lista con viñetas"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent hover:border-white/10 hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                  >
                    <List className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertMarkdownAtCursor("\n1. Primer paso\n2. Segundo paso\n")}
                    title="Lista numerada"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent hover:border-white/10 hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => wrapSelectionWith("[", "](https://overplay.gg)", "Texto del enlace")}
                    title="Enlace"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent hover:border-white/10 hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertMarkdownAtCursor("\n\n---\n\n")}
                    title="Separador horizontal"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent hover:border-white/10 hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <div className="h-4 w-px bg-white/10 mx-0.5" />

                  {/* Cloudflare Upload inside text */}
                  <input
                    type="file"
                    ref={bodyFileInputRef}
                    onChange={handleBodyImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => bodyFileInputRef.current?.click()}
                    title="Subir imagen a Cloudflare e insertar en el texto"
                    className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <CloudUpload className="h-3.5 w-3.5" />
                    <span>Insertar Imagen Cloudflare</span>
                  </button>
                </div>

                <textarea
                  ref={contentTextareaRef}
                  rows={10}
                  value={editingArticle.content}
                  onChange={(e) =>
                    setEditingArticle({
                      ...editingArticle,
                      content: e.target.value,
                    })
                  }
                  placeholder="Escribe el contenido de la noticia..."
                  className="w-full rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs leading-relaxed text-white/90 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* 4. Attached Images Gallery */}
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-display text-xs font-bold uppercase tracking-wider text-orange-400">
                      4. Galería de Imágenes Adjuntas
                    </label>
                    <span className="text-[11px] text-white/50">
                      Imágenes adicionales disponibles para el artículo o la galería inferior.
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={attachedFileInputRef}
                    onChange={handleAttachedImageUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => attachedFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/[0.08] cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5 text-orange-400" />
                    <span>Adjuntar Imágenes</span>
                  </button>
                </div>

                {editingArticle.attachedImages &&
                editingArticle.attachedImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {editingArticle.attachedImages.map((url, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/40"
                      >
                        <img
                          src={url}
                          alt={`Adjunta ${idx + 1}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/300x200/222/white?text=Preview";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              insertMarkdownAtCursor(`\n\n![Imagen](${url})\n\n`);
                            }}
                            title="Insertar en texto"
                            className="p-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 cursor-pointer"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(url);
                              alert("¡Enlace copiado al portapapeles!");
                            }}
                            title="Copiar URL"
                            className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 cursor-pointer"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingArticle({
                                ...editingArticle,
                                attachedImages:
                                  editingArticle.attachedImages?.filter(
                                    (_, i) => i !== idx
                                  ),
                              });
                            }}
                            title="Eliminar"
                            className="p-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/40">
                    No hay imágenes adjuntas adicionales. Haz clic en "Adjuntar Imágenes" para subir archivos a Cloudflare.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-white/10 bg-white/[0.02] px-6 py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingArticle(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveArticle}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                <span>Guardar Cambios</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cloudflare Configuration Modal */}
      {showCloudflareModal && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
          <div className="card-surface relative my-auto flex max-h-[calc(100vh-6rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0e0e12] p-6 shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <Cloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold uppercase tracking-wider text-white">
                    Cloudflare R2 Storage
                  </h3>
                  <p className="text-[11px] text-white/50">
                    Subida y alojamiento CDN de imágenes en tu bucket R2
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCloudflareModal(false)}
                className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCloudflareConfig} className="mt-5 space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  URL Pública del Bucket (Public URL):
                </label>
                <input
                  type="text"
                  value={cfPublicUrl}
                  onChange={(e) => setCfPublicUrl(e.target.value)}
                  placeholder="https://pub-def6d9ceb4ef4e8f84ee8a391d2b0b27.r2.dev"
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs font-mono text-white focus:border-orange-500 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-white/40 block mt-1">
                  Subdominio público R2.dev o dominio personalizado asociado.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Nombre del Bucket (Bucket Name):
                </label>
                <input
                  type="text"
                  value={cfBucketName}
                  onChange={(e) => setCfBucketName(e.target.value)}
                  placeholder="imagenesoverplay"
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs font-mono text-white focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Cloudflare Account ID:
                </label>
                <input
                  type="text"
                  value={cfAccountId}
                  onChange={(e) => setCfAccountId(e.target.value)}
                  placeholder="a7d64e57350dbbddcc2b65f7d8ede3a0"
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs font-mono text-white focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  R2 Access Key ID:
                </label>
                <input
                  type="text"
                  value={cfAccessKeyId}
                  onChange={(e) => setCfAccessKeyId(e.target.value)}
                  placeholder="cbce2ec53f08bc186b64d463df8325f0"
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs font-mono text-white focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  R2 Secret Access Key:
                </label>
                <input
                  type="password"
                  value={cfSecretAccessKey}
                  onChange={(e) => setCfSecretAccessKey(e.target.value)}
                  placeholder="aaf8802d017d1da21588dc44e4bb886e5ed1cfddad234900faa874fe1ff0e780"
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs font-mono text-white focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 text-[11px] leading-relaxed text-orange-200">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                  <span>Subida directa a Cloudflare R2 activa</span>
                </div>
                <p className="text-[10px] text-white/70">
                  Las imágenes de cabecera y fotos insertadas en el contenido se subirán directamente al bucket <strong>{cfBucketName || "R2"}</strong> y se generará su enlace público CDN de inmediato.
                </p>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-3 pt-3 border-t border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCloudflareModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm" className="gap-2">
                  <Check className="h-4 w-4" />
                  <span>Guardar Credenciales R2</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WordPress Configuration Modal */}
      {showWordpressModal && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
          <div className="card-surface relative my-auto flex max-h-[calc(100vh-6rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0e0e12] p-6 shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold uppercase tracking-wider text-white">
                    Conectar WordPress
                  </h3>
                  <p className="text-[11px] text-white/50">
                    Sincronización directa vía REST API
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWordpressModal(false)}
                className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWordpressUrl} className="mt-5 space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  URL de tu sitio WordPress:
                </label>
                <input
                  type="text"
                  value={wpUrlInput}
                  onChange={(e) => setWpUrlInput(e.target.value)}
                  placeholder="https://overplay5.wordpress.com"
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs font-mono text-white focus:border-orange-500 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-white/40 block mt-1">
                  Soporta tanto WordPress.com (ej. <code>overplay5.wordpress.com</code>) como WordPress autoalojado.
                </span>
              </div>

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-[11px] leading-relaxed text-blue-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-blue-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Estructura sincronizada desde WordPress:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[10px] text-white/75">
                  <li><strong>Imagen de cabecera:</strong> Asigna una <em>Imagen destacada (Featured Image)</em>.</li>
                  <li><strong>Título:</strong> Campo de título estándar de la entrada.</li>
                  <li><strong>Subtítulo:</strong> Campo de extracto (Excerpt) o encabezado H2 inicial.</li>
                  <li><strong>Texto e Imágenes:</strong> Todo el cuerpo del editor de bloques con imágenes.</li>
                  <li><strong>Categorías:</strong> Etiquetas o categorías (<em>Overwatch, Fortnite, VALORANT, Marvel Rivals</em>).</li>
                </ul>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-3 pt-3 border-t border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWordpressModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm" className="gap-2">
                  <Check className="h-4 w-4" />
                  <span>Guardar y Sincronizar</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {showPreviewModal && editingArticle && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/90 backdrop-blur-md">
          <div className="card-surface relative my-auto flex max-h-[calc(100vh-6rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0b0b0e] shadow-2xl">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-orange-400" />
                <span className="font-display text-xs font-bold uppercase text-white">
                  Vista Previa de la Noticia (Como en la Web)
                </span>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Rendered Web News Viewer */}
            <div className="max-h-[75vh] overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* Cover */}
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black/50">
                <img
                  src={editingArticle.image}
                  alt={editingArticle.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0e] via-transparent to-transparent" />
                <div className="absolute left-4 bottom-4 flex items-center gap-2">
                  <span className="rounded-full bg-orange-500/20 px-3 py-1 font-display text-xs font-bold uppercase text-orange-300 ring-1 ring-orange-500/40 backdrop-blur-md">
                    {editingArticle.category}
                  </span>
                  <span className="text-xs text-white/80 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-md">
                    {editingArticle.readTime}
                  </span>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div>
                <div className="flex items-center gap-2 text-xs text-orange-400 font-semibold mb-2">
                  <span>{editingArticle.author}</span>
                  <span>•</span>
                  <span>{editingArticle.date}</span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase italic text-white">
                  {editingArticle.title}
                </h1>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-white/70 italic border-l-2 border-orange-500/60 pl-4 py-1">
                  {editingArticle.subtitle}
                </p>
              </div>

              {/* Body Content */}
              <div className="border-t border-white/10 pt-6 space-y-4 text-xs sm:text-sm leading-relaxed text-white/80 whitespace-pre-line">
                {editingArticle.content}
              </div>

              {/* Attached Images Gallery if any */}
              {editingArticle.attachedImages &&
                editingArticle.attachedImages.length > 0 && (
                  <div className="border-t border-white/10 pt-6 space-y-3">
                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-orange-400">
                      Imágenes Adjuntas
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {editingArticle.attachedImages.map((url, i) => (
                        <div
                          key={i}
                          className="aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/50"
                        >
                          <img
                            src={url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
