import React, { useState } from "react";

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  priority?: boolean;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  sizes?: string;
  onError?: () => void;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className = "",
  width,
  height,
  loading = "lazy",
  priority = false,
  objectFit = "cover",
  sizes,
  onError,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Gerar srcset para diferentes tamanhos de tela
  const generateSrcSet = (baseSrc: string) => {
    if (!baseSrc.endsWith(".webp") && !baseSrc.endsWith(".jpg") && !baseSrc.endsWith(".png")) {
      return undefined;
    }

    const extension = baseSrc.split(".").pop();
    const baseWithoutExt = baseSrc.replace(`.${extension}`, "");

    // Tamanhos comuns de breakpoint
    const breakpoints = [640, 768, 1024, 1280, 1920];

    return breakpoints.map((size) => `${baseWithoutExt}-${size}w.${extension} ${size}w`).join(", ");
  };

  // Sizes padrão otimizado para performance
  const defaultSizes =
    sizes ||
    `
    (max-width: 640px) 100vw,
    (max-width: 768px) 90vw,
    (max-width: 1024px) 80vw,
    (max-width: 1280px) 70vw,
    60vw
  `
      .replace(/\s+/g, " ")
      .trim();

  if (imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 ${className}`}
        style={{ width, height }}
      >
        <div className="text-center p-4">
          <div className="mb-2 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
            <svg
              className="h-8 w-8 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Imagem indisponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 animate-pulse">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      )}
      <img
        src={src}
        srcSet={generateSrcSet(src)}
        sizes={defaultSizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : loading}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        style={{ objectFit }}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
};
