export function youtubeId(source: string): string | null {
  try {
    const url = new URL(source);
    const host = url.hostname.replace(/^www\./, '');
    if (!['youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host)) return null;
    const id = host === 'youtu.be' ? url.pathname.split('/')[1] : url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

export default function VideoPlayer({ src, poster, title }: { src: string; poster: string; title: string }) {
  const id = youtubeId(src);
  if (id) return <iframe title={title} src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} style={{width:'100%',aspectRatio:'16 / 9',border:0,maxHeight:'65dvh'}} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />;
  return <video controls playsInline autoPlay preload="metadata" poster={poster}><source src={src} type="video/mp4"/>Your browser does not support embedded video. <a href={src}>Open the film</a>.</video>;
}
