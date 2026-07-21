import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CreatorProfile, PortfolioPost } from "../../domain/profile.js";
import { DRAWING_PROCESS_MEDIA, STYLE_SHOWCASE_VIDEO } from "../config/studio-media.js";
import { STUDIO_STAFF } from "../config/studio-staff.js";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const fixMojibake = (value: string): string => {
  if (!/[ÃÂâð]/.test(value)) {
    return value;
  }

  try {
    return Buffer.from(value, "latin1").toString("utf8");
  } catch {
    return value;
  }
};

const cleanText = (value: string): string => escapeHtml(fixMojibake(value).trim());

const compactText = (value: string): string =>
  cleanText(
    fixMojibake(value)
      .replace(/\s+/g, " ")
      .replace(/[#@][^\s]+/g, "")
      .replace(/\.+/g, ".")
      .trim()
  );

const normalizeProfile = (profile: CreatorProfile): CreatorProfile => ({
  ...profile,
  displayName: fixMojibake(profile.displayName),
  category: fixMojibake(profile.category),
  location: fixMojibake(profile.location),
  bioLines: profile.bioLines.map(fixMojibake),
  highlights: profile.highlights.map((highlight) => ({
    ...highlight,
    name: fixMojibake(highlight.name)
  })),
  styles: profile.styles.map(fixMojibake),
  profileImage: {
    ...profile.profileImage,
    alt: fixMojibake(profile.profileImage.alt)
  },
  portfolioPosts: profile.portfolioPosts.map((post) => ({
    ...post,
    caption: fixMojibake(post.caption)
  }))
});

const getMetricValue = (profile: CreatorProfile, label: string): string =>
  profile.metrics.find((metric) => metric.label === label)?.value ?? "";

const instagramMiniGridMarkup = (posts: readonly PortfolioPost[]): string =>
  posts
    .slice(0, 6)
    .map((post) => `<img src="${escapeHtml(post.localPath)}" alt="${cleanText(post.caption)}" loading="lazy">`)
    .join("");

const pillsMarkup = (profile: CreatorProfile): string =>
  [
    profile.category,
    profile.location,
    `${profile.styles.slice(0, 3).join(" · ")}`
  ]
    .filter(Boolean)
    .map((item) => `<span class="pill">${cleanText(item)}</span>`)
    .join("");

const styleCardsMarkup = (): string =>
  [
    "New School & Cartoon a color",
    "Realismo a color",
    "Blackwork & Black'n'Grey",
    "Japonés",
    "Coberturas y arreglos",
    "Freehand"
  ]
    .map((style, index) => {
      const styleImages: Record<string, { readonly path: string; readonly alt: string; readonly artist: string }> = {
        Anime: { path: "assets/artists/viktor/viktor_vkonantattoo_23.jpg", alt: "Tatuaje de personaje anime realizado por Viktor en Kitsune Tattoo", artist: "Viktor Konan" },
        "Japonés": { path: "assets/artists/rodri_caradecuero/rodri-japanese-koi.jpg", alt: "Tatuaje japones de koi, olas y flores realizado por Rodri en Kitsune Tattoo", artist: "Rodri" },
        Blackwork: { path: "assets/artists/viktor/viktor_vkonantattoo_06.jpg", alt: "Tatuaje blackwork realizado por Viktor en Kitsune Tattoo", artist: "Viktor Konan" },
        Terror: { path: "assets/artists/viktor/viktor_vkonantattoo_19.jpg", alt: "Tatuaje de terror realizado por Viktor en Kitsune Tattoo", artist: "Viktor Konan" },
        Color: { path: "assets/artists/viktor/viktor_vkonantattoo_18.jpg", alt: "Tatuaje a color realizado por Viktor en Kitsune Tattoo", artist: "Viktor Konan" },
        Realismo: { path: "assets/artists/viktor/viktor_vkonantattoo_11.jpg", alt: "Retrato realista a color realizado por Viktor en Kitsune Tattoo", artist: "Viktor Konan" }
        ,"New School & Cartoon a color": { path: "assets/artists/viktor/viktor_vkonantattoo_18.jpg", alt: "Tatuaje New School a color realizado en Kitsune Tattoo", artist: "Kitsune Tattoo" }
        ,"Realismo a color": { path: "assets/artists/viktor/viktor_vkonantattoo_11.jpg", alt: "Retrato realista a color realizado por Viktor en Kitsune Tattoo", artist: "Viktor Konan" }
        ,"Blackwork & Black'n'Grey": { path: "assets/artists/viktor/viktor_vkonantattoo_06.jpg", alt: "Tatuaje blackwork realizado por Viktor en Kitsune Tattoo", artist: "Viktor Konan" }
        ,"Coberturas y arreglos": { path: "assets/artists/viktor/viktor_vkonantattoo_12.jpg", alt: "Trabajo de cobertura y retrato realizado por Viktor en Kitsune Tattoo", artist: "Viktor Konan" }
        ,Freehand: { path: "assets/artists/viktor/viktor_vkonantattoo_22.jpg", alt: "Tatuaje disenado a mano alzada por Viktor en Kitsune Tattoo", artist: "Viktor Konan" }
      };
      const descriptions: Record<string, string> = {
        Anime: "Piezas con lenguaje pop, lectura rapida y mucho potencial para atraer encargos memorables.",
        "Japonés": "Composiciones con peso visual y narrativa, muy eficaces para una marca con identidad fuerte.",
        Blackwork: "Contraste, presencia y una estetica limpia que funciona muy bien en portfolio premium.",
        Terror: "Trabajo con atmosfera y referencias de culto que diferencia al estudio del feed promedio.",
        Color: "Uso del color como reclamo visual y como firma reconocible a primer golpe de vista.",
        Realismo: "Lectura tecnica que transmite nivel y abre la puerta a piezas de mayor valor."
        ,"New School & Cartoon a color": "Colores saturados, linea potente y cultura pop sin miedo. Tu personaje favorito, tatuado como merece."
        ,"Realismo a color": "Retratos y escenas que parecen respirar bajo la piel."
        ,"Blackwork & Black'n'Grey": "Cuando el negro basta para decirlo todo."
        ,"Coberturas y arreglos": "Ese tatuaje que ya no te representa tiene arreglo. Le damos la vuelta."
        ,Freehand: "Disenado a mano alzada, directo sobre tu piel. Unico e irrepetible."
      };

      return `
        <article class="brew-card ${index % 2 === 0 ? "coffee" : "matcha"}">
          ${styleImages[style] ? `<img class="style-card-image" src="${styleImages[style].path}" alt="${styleImages[style].alt}" loading="lazy">` : ""}
          <span class="style-card-eyebrow">${styleImages[style]?.artist ?? "Kitsune Tattoo"}</span>
          <span class="big-emoji">${index % 2 === 0 ? "⛩" : "✦"}</span>
          <h3>${cleanText(style)}</h3>
          <p>${descriptions[style] ?? "Linea creativa detectada en el portfolio real del estudio."}</p>
          <div class="brew-tags">
            <span class="brew-tag">Portfolio real</span>
            <span class="brew-tag">Alta demanda visual</span>
            <span class="brew-tag">Identidad propia</span>
          </div>
          <div class="swirl"></div>
        </article>
      `;
    })
    .join("");

const galleryMarkup = (posts: readonly PortfolioPost[]): string =>
  posts
    .slice(0, 9)
    .map((post) => {
      const summary = compactText(post.caption).slice(0, 110);

      return `
        <figure class="gallery-item">
          <img src="${escapeHtml(post.localPath)}" alt="${cleanText(post.caption)}" loading="lazy">
          <figcaption>${summary}</figcaption>
        </figure>
      `;
    })
    .join("");

const highlightMarkup = (profile: CreatorProfile): string =>
  profile.highlights
    .slice(0, 5)
    .map((highlight) => `<span class="team-tune">${cleanText(highlight.name)}</span>`)
    .join("");

const staffMarkup = (): string =>
  STUDIO_STAFF.map(
    (member, index) => {
      const images = member.portfolioImages ?? [];
      const dialogId = `${member.handle}-portfolio-dialog`;
      const profileMedia = member.profileImage
        ? `<div class="artist-identity-media"><img src="${escapeHtml(member.profileImage.imagePath)}" alt="${cleanText(member.profileImage.alt)}" loading="lazy">${member.profileVideo ? `<div class="artist-video artist-video-float" data-hover-video><video muted loop playsinline preload="metadata" poster="${escapeHtml(member.profileVideo.posterPath)}"><source src="${escapeHtml(member.profileVideo.videoPath)}" type="video/mp4"></video><span>Ver proceso</span></div>` : ""}</div>`
        : member.profileVideo
          ? `<div class="artist-video" data-hover-video><video muted loop playsinline preload="metadata" poster="${escapeHtml(member.profileVideo.posterPath)}"><source src="${escapeHtml(member.profileVideo.videoPath)}" type="video/mp4"></video><span>Hover para ver proceso</span></div>`
          : `<div class="artist-mark" aria-hidden="true">${cleanText(member.name.slice(0, 1))}</div>`;
      const portfolioPreview = images.length
        ? `
          <div class="artist-card-portfolio">
            <span class="artist-card-portfolio-label">Universo de ${cleanText(member.name)}</span>
            <div class="artist-carousel" data-artist-carousel aria-label="Carrusel de trabajos de ${cleanText(member.name)}">
              <button class="artist-carousel-control artist-carousel-prev" type="button" aria-label="Ver trabajo anterior">←</button>
              <div class="artist-carousel-track" tabindex="0">
                ${images.slice(0, 6).map((imagePath, imageIndex) => `<button class="artist-work" type="button" data-lightbox-image="${escapeHtml(imagePath)}" data-lightbox-alt="Trabajo de ${cleanText(member.name)} ${imageIndex + 1}" aria-label="Abrir trabajo ${imageIndex + 1} de ${cleanText(member.name)}"><img src="${escapeHtml(imagePath)}" alt="Trabajo de ${cleanText(member.name)} ${imageIndex + 1}" loading="lazy"><span class="artist-work-expand">Ver pieza</span></button>`).join("")}
              </div>
              <button class="artist-carousel-control artist-carousel-next" type="button" aria-label="Ver siguiente trabajo">→</button>
              <div class="artist-carousel-status" aria-live="polite"><span>01</span> / ${String(Math.min(images.length, 6)).padStart(2, "0")}</div>
            </div>
            <div class="artist-portfolio-action"><button class="portfolio-open" type="button" data-portfolio-open="${dialogId}">Ver universo completo <span>${images.length} piezas</span></button></div>
          </div>
          <dialog class="portfolio-dialog" id="${dialogId}" aria-label="Portfolio completo de ${cleanText(member.name)}">
            <div class="portfolio-dialog-shell">
              <div class="portfolio-dialog-head"><div><span>Portfolio completo</span><h2>${cleanText(member.name)}</h2></div><button class="portfolio-close" type="button" data-portfolio-close aria-label="Cerrar portfolio">Cerrar</button></div>
              <div class="portfolio-dialog-grid">${images.map((imagePath, imageIndex) => `<figure><img src="${escapeHtml(imagePath)}" alt="Trabajo de ${cleanText(member.name)} ${imageIndex + 1}" loading="lazy"></figure>`).join("")}</div>
            </div>
          </dialog>`
        : "";

      return `
      <article class="artist-card artist-${member.theme}">
        <div class="artist-topline"><span>0${index + 1}</span><span>Kitsune Tattoo</span></div>
        ${profileMedia}
        <p class="artist-role">${cleanText(member.role)}</p>
        <h3>${cleanText(member.name)}</h3>
        <p class="artist-fullname">${cleanText(member.fullName)}</p>
        ${portfolioPreview}
        <p class="artist-intro">${cleanText(member.intro)}</p>
        <div class="artist-style"><span>Especialidad</span><p>${cleanText(member.style)}</p></div>
        <div class="artist-links">
          <a href="${escapeHtml(member.profileUrl)}" target="_blank" rel="noreferrer">@${cleanText(member.handle)}</a>
          ${member.secondaryProfile ? `<a href="${escapeHtml(member.secondaryProfile.url)}" target="_blank" rel="noreferrer">@${cleanText(member.secondaryProfile.handle)} <small>${cleanText(member.secondaryProfile.label)}</small></a>` : ""}
        </div>
      </article>`;
    }
  ).join("");

const aboutParallaxMarkup = (): string =>
  `<div class="about-parallax-stack">
    <figure class="about-parallax-frame about-parallax-front" data-about-parallax data-parallax-depth="1">
      <img src="assets/about/kitsune-studio-front.png" alt="Fachada de Kitsune Tattoo en Leganes" loading="lazy" data-about-parallax-image>
      <figcaption class="about-parallax-label">Kitsune Tattoo · Leganes</figcaption>
    </figure>
    <figure class="about-parallax-frame about-parallax-corner" data-about-parallax data-parallax-depth=".62">
      <img src="assets/about/kitsune-studio-corner.png" alt="Entrada de Kitsune Tattoo" loading="lazy" data-about-parallax-image>
    </figure>
  </div>`;

const template = (inputProfile: CreatorProfile): string => {
  const profile = normalizeProfile(inputProfile);
  const followers = getMetricValue(profile, "Seguidores");
  const posts = getMetricValue(profile, "Posts");
  const following = getMetricValue(profile, "Siguiendo");
  const heroPoster = profile.heroVideo.posterPath;
  const aboutLead = compactText(profile.portfolioPosts[0]?.caption ?? "Tattoo portfolio");
  const aboutSupport = compactText(profile.portfolioPosts[2]?.caption ?? "Japanese and color tattoo work.");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" type="image/jpeg" href="${escapeHtml(profile.profileImage.localPath)}">
<link rel="apple-touch-icon" href="${escapeHtml(profile.profileImage.localPath)}">
<title>${cleanText(profile.displayName)} — Tattoo with Character · ${cleanText(profile.location)}</title>
<meta name="description" content="${cleanText(profile.displayName)}. Hero en secuencia de frames, portfolio real y pagina de marca para convertir Instagram en reservas.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Righteous&family=Outfit:wght@300;400;500;600;700&family=Caveat:wght@600&display=swap" rel="stylesheet">
<style>
  :root{
    --green:#101513;
    --green-deep:#0a0d0c;
    --cream:#f1e5d7;
    --cream-soft:#ddc9b7;
    --terra:#c86d3a;
    --terra-light:#ea9157;
    --brown:#4a2f1d;
    --ink:#171511;
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{
    font-family:'Outfit',sans-serif;
    background:var(--green);
    color:var(--cream);
    overflow-x:hidden;
    line-height:1.6;
  }
  body.is-loading{overflow:hidden}
  .site-loader{
    position:fixed;inset:0;z-index:1000;display:grid;place-items:center;
    overflow:hidden;background:#000;
    transition:opacity .55s ease,visibility .55s ease;
  }
  .site-loader::before,.site-loader::after{
    content:'';position:absolute;width:min(72vw,640px);aspect-ratio:1;border:1px solid rgba(234,145,87,.22);border-radius:50%;
  }
  .site-loader::before{animation:loader-orbit 3.2s linear infinite}
  .site-loader::after{width:min(53vw,460px);border-style:dashed;border-color:rgba(241,229,215,.2);animation:loader-orbit 5s linear infinite reverse}
  .site-loader-inner{position:relative;z-index:1;display:grid;justify-items:center;gap:18px}
  .site-loader-mask{
    width:auto;height:clamp(250px,34vw,390px);object-fit:contain;object-position:center;
    background:transparent;filter:drop-shadow(0 18px 26px rgba(0,0,0,.72));
    animation:loader-mask-spin 2.8s cubic-bezier(.45,.05,.55,.95) infinite;
  }
  .site-loader-label{font-size:.7rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--cream-soft)}
  .site-loader.is-leaving{opacity:0;visibility:hidden;pointer-events:none}
  @keyframes loader-orbit{to{transform:rotate(360deg)}}
  @keyframes loader-mask-spin{from{transform:rotate(0deg) scale(.94)}50%{transform:rotate(180deg) scale(1)}to{transform:rotate(360deg) scale(.94)}}
  @media(prefers-reduced-motion:reduce){.site-loader::before,.site-loader::after,.site-loader-mask{animation:none}}
  ::selection{background:var(--terra);color:var(--cream)}
  ::-webkit-scrollbar{width:11px}
  ::-webkit-scrollbar-track{background:var(--green-deep)}
  ::-webkit-scrollbar-thumb{background:var(--terra);border-radius:6px;border:2px solid var(--green-deep)}
  h1,h2,h3,.display{font-family:'Righteous',cursive;letter-spacing:.02em}

  nav{
    position:fixed;top:0;left:0;right:0;z-index:100;
    display:flex;align-items:center;justify-content:space-between;
    padding:18px 5vw;transition:all .35s ease;
  }
  nav.scrolled{
    background:rgba(10,13,12,.84);
    backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
    padding:12px 5vw;border-bottom:1px solid rgba(241,229,215,.1);
  }
  .nav-logo{font-family:'Righteous',cursive;font-size:1.1rem;color:var(--cream);text-decoration:none;letter-spacing:.06em}
  .nav-logo span{color:var(--terra-light)}
  .nav-links{display:flex;gap:26px;list-style:none;align-items:center}
  .nav-links a{color:var(--cream);text-decoration:none;font-size:.92rem;font-weight:500;opacity:.85;transition:.25s}
  .nav-links a:hover{opacity:1;color:var(--terra-light)}
  .nav-cta{
    background:var(--terra);color:var(--cream)!important;opacity:1!important;
    padding:8px 18px;border-radius:999px;font-weight:600;
  }
  .nav-cta:hover{background:var(--terra-light)}
  .nav-toggle{display:none;background:none;border:none;cursor:pointer;width:30px;height:22px;position:relative;padding:0;z-index:120}
  .nav-toggle span{position:absolute;left:0;width:100%;height:2.5px;background:var(--cream);border-radius:2px;transition:.3s}
  .nav-toggle span:nth-child(1){top:0}
  .nav-toggle span:nth-child(2){top:50%;transform:translateY(-50%)}
  .nav-toggle span:nth-child(3){bottom:0}
  nav.menu-open .nav-toggle span:nth-child(1){top:50%;transform:translateY(-50%) rotate(45deg)}
  nav.menu-open .nav-toggle span:nth-child(2){opacity:0}
  nav.menu-open .nav-toggle span:nth-child(3){bottom:auto;top:50%;transform:translateY(-50%) rotate(-45deg)}
  @media(max-width:760px){
    .nav-toggle{display:flex}
    .nav-links{
      position:absolute;top:100%;left:0;right:0;flex-direction:column;align-items:flex-start;gap:0;
      background:rgba(10,13,12,.97);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
      max-height:0;overflow:hidden;padding:0 5vw;
      transition:max-height .38s ease,padding .38s ease;
      border-bottom:1px solid rgba(241,229,215,0);
    }
    nav.menu-open .nav-links{max-height:85vh;padding:8px 5vw 22px;border-bottom-color:rgba(241,229,215,.14)}
    .nav-links li{width:100%}
    .nav-links a{display:block;width:100%;padding:14px 0;font-size:1.05rem;opacity:1;border-bottom:1px solid rgba(241,229,215,.1)}
    .nav-links .nav-cta{display:inline-block;width:auto;margin-top:6px}
  }

  .hero{position:relative;height:400vh}
  .hero-sticky{
    position:sticky;top:0;height:100svh;min-height:640px;overflow:hidden;
    display:flex;flex-direction:column;
  }
  .hero-media{position:absolute;top:86px;right:0;bottom:54px;left:0;display:flex;align-items:flex-end;z-index:1;background:#050505}
  .hero-video-poster,.hero-scroll-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .hero-video-poster{display:block}
  .hero-scroll-video{display:block;opacity:0;background:#050505;transition:opacity .22s ease}
  .hero-scroll-video.is-ready{opacity:1}
  .hero-media::after{
    content:"";position:absolute;inset:0;
    background:linear-gradient(180deg,rgba(16,21,19,.16) 0%,rgba(16,21,19,0) 32%);
  }
  .hero-content{position:relative;z-index:2;width:100%;padding:0 5vw 24vh;text-align:center;transition:opacity .1s linear}
  .hero-marquee{position:absolute;left:0;right:0;z-index:3;overflow:hidden;pointer-events:none;white-space:nowrap;color:rgba(241,229,215,.9);font-size:.72rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;text-shadow:0 2px 8px rgba(0,0,0,.55)}
  .hero-marquee-top{top:30px}.hero-marquee-bottom{bottom:18px}
  .hero-marquee-track{display:inline-flex;align-items:center;gap:22px;min-width:max-content;animation:hero-marquee 24s linear infinite}
  .hero-marquee:hover .hero-marquee-track{animation-play-state:paused}
  .hero-marquee-bottom .hero-marquee-track{animation-direction:reverse;animation-duration:28s}
  .hero-marquee-jp{color:var(--terra-light);font-size:1rem;letter-spacing:0}
  .hero-marquee a{pointer-events:auto;color:inherit;text-decoration:none;transition:color .2s ease}
  .hero-marquee a:hover{color:var(--terra-light)}
  @keyframes hero-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  @media(prefers-reduced-motion:reduce){.hero-marquee-track{animation:none}}
  .hero-progress{
    position:absolute;bottom:0;left:0;height:3px;z-index:4;width:0;
    background:linear-gradient(90deg,var(--terra),var(--terra-light));
  }
  .hero-kicker{
    font-family:'Caveat',cursive;font-size:clamp(1.4rem,3vw,2rem);
    color:var(--cream);text-shadow:0 2px 14px rgba(0,0,0,.5);transform:rotate(-2deg);display:inline-block;
  }
  .hero h1{
    font-size:clamp(2.9rem,7.5vw,6rem);line-height:1.02;margin:.2em 0 .35em;
    color:var(--cream);text-shadow:0 4px 30px rgba(0,0,0,.45);
  }
  .hero h1 em{font-style:normal;color:var(--terra-light)}
  .hero-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
  .btn{
    display:inline-flex;align-items:center;gap:8px;text-decoration:none;font-weight:600;font-size:1rem;
    padding:14px 30px;border-radius:999px;transition:.28s;border:2px solid transparent;
  }
  .btn-primary{background:var(--terra);color:var(--cream)}
  .btn-primary:hover{background:var(--terra-light);transform:translateY(-2px);box-shadow:0 10px 26px rgba(0,0,0,.35)}
  .btn-ghost{border-color:var(--cream);color:var(--cream)}
  .btn-ghost:hover{background:var(--cream);color:var(--green)}
  .scroll-cue{
    position:absolute;bottom:18px;left:50%;transform:translateX(-50%);z-index:3;
    display:flex;flex-direction:column;align-items:center;gap:6px;
    transition:opacity .1s linear;pointer-events:none;
  }
  .scroll-cue-text{
    font-family:'Caveat',cursive;font-size:1.35rem;color:var(--cream);
    text-shadow:0 2px 12px rgba(0,0,0,.55);transform:rotate(-2deg);
  }
  .scroll-cue-arrow{width:26px;height:26px;animation:cueBounce 1.6s infinite}
  @keyframes cueBounce{0%,100%{transform:translateY(0);opacity:.9}50%{transform:translateY(9px);opacity:.5}}
  .scroll-hint{
    position:relative;
    width:24px;height:38px;border:2px solid rgba(241,229,215,.6);border-radius:14px;
  }
  .scroll-hint::before{
    content:"";position:absolute;top:6px;left:50%;width:4px;height:8px;margin-left:-2px;
    background:var(--terra-light);border-radius:3px;animation:wheel 1.8s infinite;
  }
  @keyframes wheel{0%{opacity:1;transform:translateY(0)}70%{opacity:0;transform:translateY(14px)}100%{opacity:0}}

  @media(max-width:760px){
    .hero{height:400vh}
    .hero-sticky{position:sticky;top:0;height:100svh;min-height:0;overflow:hidden;background:#050505;padding-top:0}
    .hero-media{position:absolute;inset:0;display:block;z-index:1;background:#050505}
    .hero-video-poster,.hero-scroll-video{object-fit:contain;object-position:center center}
    .hero-content{position:absolute;z-index:2;left:0;right:0;top:50%;bottom:auto;transform:translateY(-50%);padding:0 8vw;text-align:center}
    .hero-marquee-top{top:82px}.hero-marquee-bottom{bottom:18px}
    .hero h1{font-size:clamp(2rem,8vw,3rem);margin:.15em 0 0}
    .scroll-cue{display:none}
    .hero-progress{display:none}
  }

  section{padding:96px 5vw}
  .wrap{max-width:1100px;margin:0 auto}
  .sec-kicker{
    font-family:'Caveat',cursive;font-size:1.5rem;color:var(--terra-light);transform:rotate(-1.5deg);display:inline-block;
  }
  .sec-title{font-size:clamp(1.9rem,4vw,2.9rem);margin:.15em 0 .8em}
  .reveal{opacity:0;transform:translateY(34px);transition:opacity .7s ease,transform .7s ease}
  .reveal.visible{opacity:1;transform:none}
  .stagger>*{opacity:0;transform:translateY(26px);transition:opacity .6s ease,transform .6s ease}
  .stagger.visible>*{opacity:1;transform:none}

  .ig-section{padding-top:40px}
  .ig-card{
    max-width:680px;margin:0 auto;background:var(--cream);color:var(--ink);
    border-radius:26px;padding:34px 34px 26px;position:relative;
    box-shadow:0 30px 70px rgba(0,0,0,.4);
  }
  .ig-card::before{
    content:"";position:absolute;top:0;left:26px;right:26px;height:4px;
    background:linear-gradient(90deg,var(--terra),#e0a458,var(--terra));border-radius:0 0 6px 6px;
  }
  .ig-head{display:flex;gap:26px;align-items:center;flex-wrap:wrap}
  .ig-avatar-ring{
    width:104px;height:104px;border-radius:50%;padding:4px;flex-shrink:0;
    background:conic-gradient(from var(--a,0deg),var(--terra),#e0a458,var(--green),var(--terra));
    animation:spin 6s linear infinite;
  }
  @property --a{syntax:'<angle>';initial-value:0deg;inherits:false}
  @keyframes spin{to{--a:360deg}}
  .ig-avatar-ring img{width:100%;height:100%;border-radius:50%;border:4px solid var(--cream);object-fit:cover;display:block}
  .ig-stats{display:flex;gap:28px;flex:1;min-width:220px;justify-content:center}
  .ig-stat{text-align:center}
  .ig-stat b{display:block;font-size:1.45rem;font-family:'Righteous',cursive;color:var(--green)}
  .ig-stat span{font-size:.85rem;color:#5b5b4f}
  .ig-name{display:flex;align-items:center;gap:8px;margin-top:20px;flex-wrap:wrap}
  .ig-name h3{font-size:1.25rem;color:var(--green)}
  .verified{
    width:20px;height:20px;border-radius:50%;flex-shrink:0;
    background:radial-gradient(circle at 30% 30%,#4db5ff,#0095f6);
    display:inline-flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,149,246,.45);
  }
  .verified svg{width:11px;height:11px}
  .ig-handle{color:var(--terra);text-decoration:none;font-weight:600;font-size:.95rem}
  .ig-handle:hover{text-decoration:underline}
  .ig-cat{font-size:.85rem;color:#77776a;margin-top:2px}
  .ig-bio{margin-top:10px;font-size:.98rem;white-space:pre-line;color:#33332b}
  .ig-actions{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}
  .ig-btn{
    flex:1;min-width:110px;text-align:center;text-decoration:none;font-weight:600;font-size:.92rem;
    padding:10px 14px;border-radius:10px;transition:.25s;
  }
  .ig-btn.follow{background:var(--terra);color:var(--cream)}
  .ig-btn.follow:hover{background:var(--terra-light)}
  .ig-btn.soft{background:#e3dcc4;color:var(--green)}
  .ig-btn.soft:hover{background:#d8d0b4}
  .ig-mini{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin-top:22px;border-radius:14px;overflow:hidden}
  .ig-mini img{width:100%;aspect-ratio:1;object-fit:cover;display:block;transform:translate3d(0,var(--parallax-y,0px),0) scale(1.04);transition:transform .35s}
  .ig-mini img:hover{transform:translate3d(0,var(--parallax-y,0px),0) scale(1.09)}
  .ig-below{text-align:center;margin-top:56px}
  .ig-below h2{font-size:clamp(1.8rem,4vw,2.8rem);max-width:760px;margin:0 auto}
  .ig-below h2 em{font-style:normal;color:var(--terra-light)}
  .ig-below p{margin-top:14px;opacity:.8}

  .about-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:56px;align-items:center}
  @media(max-width:860px){.about-grid{grid-template-columns:1fr}}
  .about-text p{margin-bottom:16px;font-size:1.05rem;opacity:.92}
  .section-cta{display:inline-flex;align-items:center;gap:8px;margin-top:10px;color:var(--terra-light);font-weight:700;text-decoration:none;transition:gap .2s ease,color .2s ease}
  .section-cta:hover{gap:13px;color:var(--cream)}
  .pills{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
  .pill{
    background:rgba(241,229,215,.1);border:1px solid rgba(241,229,215,.25);
    padding:8px 18px;border-radius:999px;font-size:.88rem;font-weight:500;
  }
  .about-parallax-stack{position:relative;min-height:570px}
  .about-parallax-frame{
    position:absolute;overflow:hidden;border-radius:22px;
    background:var(--green-deep);box-shadow:0 20px 48px rgba(0,0,0,.36);
  }
  .about-parallax-front{top:0;right:0;width:90%;height:468px}
  .about-parallax-corner{bottom:0;left:0;z-index:2;width:55%;height:275px;border:5px solid var(--green)}
  .about-parallax-frame::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,13,12,.05),rgba(10,13,12,.48))}
  .about-parallax-frame img{
    position:absolute;top:-9%;left:0;width:100%;height:118%;object-fit:cover;
    transform:translate3d(0,var(--parallax-y,0px),0) scale(1.04);will-change:transform;
  }
  .about-parallax-label{
    position:absolute;right:18px;bottom:14px;z-index:1;color:var(--cream);font-size:.67rem;
    font-weight:700;letter-spacing:.16em;text-transform:uppercase;text-shadow:0 2px 10px rgba(0,0,0,.7);
  }
  @media(max-width:860px){
    .about-parallax-stack{min-height:500px;max-width:560px}
    .about-parallax-front{width:100%;height:405px}
    .about-parallax-corner{width:58%;height:220px}
  }
  @media(prefers-reduced-motion:reduce){.about-parallax-frame img{transform:scale(1.04)!important}}

  .brew{background:var(--green-deep);position:relative;overflow:hidden}
  .style-showcase{height:350svh;background:#111;overflow:visible}
  .styles-sticky{position:sticky;top:0;height:100svh;min-height:700px;overflow:hidden}
  .styles-media,.styles-video-poster,.styles-scroll-video,.styles-scrim{position:absolute;inset:0;width:100%;height:100%}
  .styles-video-poster{object-fit:cover;display:block}
  .styles-scroll-video{z-index:1;object-fit:cover;display:block;background:#111;opacity:0;transition:opacity .22s ease}
  .styles-scroll-video.is-ready{opacity:1}
  .styles-scrim{background:linear-gradient(180deg,rgba(5,8,7,.44),rgba(5,8,7,.64));z-index:1}
  .styles-video-copy{position:absolute;z-index:2;left:5vw;top:50%;transform:translateY(-50%);max-width:560px;color:var(--cream);pointer-events:none}
  .styles-video-copy span{display:block;font-size:.72rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#f1c39d;margin-bottom:11px}
  .styles-video-copy h2{font-size:clamp(2.5rem,5vw,5rem);line-height:.9;text-shadow:0 5px 28px rgba(0,0,0,.55)}
  .styles-video-copy p{max-width:410px;margin-top:16px;font-size:1rem;line-height:1.45;text-shadow:0 3px 14px rgba(0,0,0,.7)}
  .styles-content{position:sticky;top:0;z-index:2;min-height:100svh;margin-top:-100svh;padding-top:72px;padding-bottom:42px;display:grid;align-content:center}
  .style-showcase .brew-head{margin-bottom:30px}
  .style-showcase .sec-kicker{color:#f3ba91}
  .style-showcase .sec-title{color:var(--cream);text-shadow:0 4px 24px rgba(0,0,0,.55)}
  .style-showcase .brew-grid{grid-template-columns:repeat(6,minmax(0,1fr));max-width:1240px;gap:10px}
  .style-showcase .brew-card{padding:16px 14px;min-height:0;backdrop-filter:blur(9px);box-shadow:0 16px 38px rgba(0,0,0,.28)}
  .style-showcase .brew-card{animation:style-card-float 4.2s ease-in-out infinite}
  .style-showcase .brew-card:nth-child(2){animation-delay:-.7s}.style-showcase .brew-card:nth-child(3){animation-delay:-1.4s}.style-showcase .brew-card:nth-child(4){animation-delay:-2.1s}.style-showcase .brew-card:nth-child(5){animation-delay:-2.8s}.style-showcase .brew-card:nth-child(6){animation-delay:-3.5s}
  @keyframes style-card-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
  .style-showcase .brew-card.coffee{background:rgba(36,22,16,.84)}
  .style-showcase .brew-card.matcha{background:rgba(241,229,215,.88)}
  .style-showcase .big-emoji{font-size:1.7rem;margin-bottom:7px}
  .style-showcase .brew-card h3{font-size:1.08rem;margin-bottom:7px}
  .style-showcase .brew-card p{font-size:.78rem;line-height:1.35;margin-bottom:10px}
  .style-showcase .brew-tags{gap:5px}.style-showcase .brew-tag{font-size:.66rem;padding:5px 8px}
  .styles-cards{background:var(--green-deep);padding:16px 5vw 96px}
  .styles-cards .brew-head{text-align:center;margin-bottom:48px}
  .styles-cards .brew-grid{grid-template-columns:repeat(3,1fr);max-width:1100px}
  .styles-cards .brew-card{min-height:350px;padding:0;isolation:isolate;border:1px solid rgba(241,229,215,.2);background:#18251c;box-shadow:0 18px 42px rgba(0,0,0,.28)}
  .styles-cards .brew-card::before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(7,13,9,.05) 12%,rgba(7,13,9,.2) 42%,rgba(7,13,9,.9) 100%);pointer-events:none;transition:opacity .45s ease}
  .styles-cards .style-card-image{position:absolute;inset:0;z-index:0;width:100%;height:100%;object-fit:cover;transform:translate3d(0,var(--parallax-y,0px),0) scale(1.04);filter:saturate(1.07) contrast(1.04);transition:transform .7s cubic-bezier(.2,.7,.2,1),filter .7s ease}
  .styles-cards .brew-card:hover .style-card-image{transform:translate3d(0,var(--parallax-y,0px),0) scale(1.095);filter:saturate(1.16) contrast(1.08)}
  .styles-cards .style-card-content{position:absolute;inset:auto 0 0;padding:26px 26px 24px;color:var(--cream)}
  .styles-cards .style-card-eyebrow{position:absolute;z-index:2;left:26px;bottom:141px;color:#f1c39d;font-size:.68rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;transition:opacity .32s ease}
  .styles-cards .brew-card h3{position:absolute;z-index:2;left:18px;right:18px;bottom:91px;margin-bottom:8px;padding:10px 12px;font-size:clamp(1.6rem,2.1vw,2rem);line-height:.95;color:var(--cream);background:rgba(7,13,9,.68);border:1px solid rgba(241,229,215,.16);border-radius:12px;backdrop-filter:blur(10px);text-shadow:0 2px 12px rgba(0,0,0,.7);transition:opacity .32s ease}
  .styles-cards .brew-card p{position:absolute;z-index:2;left:26px;right:26px;bottom:24px;max-width:32ch;margin-bottom:0;font-size:.88rem;line-height:1.42;color:var(--cream);text-shadow:0 2px 12px rgba(0,0,0,.55);transition:opacity .32s ease}
  .styles-cards .brew-card:hover::before,.styles-cards .brew-card:hover .style-card-eyebrow,.styles-cards .brew-card:hover h3,.styles-cards .brew-card:hover p{opacity:0}
  .styles-cards .big-emoji,.styles-cards .swirl{display:none}
  .styles-cards .brew-tags{display:none}
  @media(max-width:820px){.styles-cards .brew-grid{grid-template-columns:1fr}}
  @media(max-width:820px){.styles-cards .brew-card{min-height:390px}.styles-cards .style-card-content{padding:28px}.styles-cards .brew-card h3{font-size:2rem}}
  @media(max-width:820px){.style-showcase{height:300svh;min-height:0}.styles-sticky{position:sticky;top:0;height:100svh;min-height:0}.styles-video-copy{left:5vw;right:5vw;top:50%;bottom:auto}.styles-video-copy h2{font-size:clamp(2.2rem,10vw,3.4rem)}.styles-content{position:relative;top:auto;min-height:0;margin-top:-100svh;padding-top:78px;padding-bottom:78px;display:block}.style-showcase .brew-head{margin-bottom:28px}.style-showcase .brew-grid{grid-template-columns:1fr;position:relative;gap:14px}.style-showcase .brew-card{padding:24px;backdrop-filter:blur(7px);animation:none}.style-showcase .big-emoji{font-size:2.1rem}.style-showcase .brew-card h3{font-size:1.35rem}.style-showcase .brew-card p{font-size:.92rem}}
  .brew-head{text-align:center;margin-bottom:54px}
  .brew-grid{display:grid;grid-template-columns:1fr 1fr;gap:26px;max-width:1000px;margin:0 auto}
  @media(max-width:820px){.brew-grid{grid-template-columns:1fr}}
  .brew-card{
    border-radius:26px;padding:40px 36px;position:relative;overflow:hidden;
    transition:transform .35s ease,box-shadow .35s ease;
  }
  .brew-card:hover{transform:translateY(-8px);box-shadow:0 26px 60px rgba(0,0,0,.45)}
  .brew-card.coffee{background:linear-gradient(150deg,#3a2417,#241610);border:1px solid rgba(200,109,58,.35)}
  .brew-card.matcha{background:linear-gradient(150deg,var(--cream),#e8ddce);border:1px solid rgba(200,109,58,.2)}
  .brew-card .big-emoji{
    font-size:3rem;display:inline-block;margin-bottom:14px;
    filter:drop-shadow(0 6px 14px rgba(0,0,0,.4));
  }
  .brew-card h3{font-size:1.6rem;margin-bottom:12px}
  .brew-card.coffee h3{color:var(--terra-light)}
  .brew-card.matcha h3{color:var(--brown)}
  .brew-card.matcha p{color:#3d3129}
  .brew-card p{opacity:.88;font-size:1rem;margin-bottom:18px}
  .brew-tags{display:flex;flex-wrap:wrap;gap:8px}
  .brew-tag{
    font-size:.82rem;font-weight:600;padding:6px 14px;border-radius:999px;
  }
  .coffee .brew-tag{background:rgba(200,109,58,.18);border:1px solid rgba(200,109,58,.4);color:#e8b394}
  .matcha .brew-tag{background:rgba(74,47,29,.08);border:1px solid rgba(74,47,29,.35);color:var(--brown)}
  .brew-card .swirl{
    position:absolute;right:-40px;bottom:-40px;width:190px;height:190px;border-radius:50%;
    opacity:.12;pointer-events:none;
  }
  .coffee .swirl{background:radial-gradient(circle,var(--terra) 0%,transparent 70%)}
  .matcha .swirl{background:radial-gradient(circle,var(--brown) 0%,transparent 70%)}

  .team{background:var(--green);position:relative;overflow:hidden}
  .team-head{text-align:center;margin-bottom:44px}
  .team-track{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;align-items:stretch}
  @media(max-width:900px){.team-track{grid-template-columns:1fr}}
  .artist-card{position:relative;overflow:hidden;border-radius:26px;padding:24px;min-height:590px;display:flex;flex-direction:column;border:1px solid rgba(241,229,215,.2);box-shadow:0 20px 46px rgba(0,0,0,.25)}
  .artist-rodri{background:linear-gradient(155deg,var(--terra),var(--brown) 55%,var(--green))}
  .artist-viktor{background:linear-gradient(155deg,#34433a,var(--green) 55%,var(--green-deep))}
  .artist-lala{background:linear-gradient(155deg,#76543d,var(--brown) 55%,var(--green-deep))}
  .artist-topline{display:flex;justify-content:space-between;gap:10px;font-size:.68rem;text-transform:uppercase;letter-spacing:.13em;opacity:.75}
  .artist-mark{font-family:'Righteous',cursive;font-size:clamp(7rem,14vw,11rem);line-height:.8;margin:58px 0 34px;color:rgba(241,229,215,.95);text-shadow:0 14px 34px rgba(0,0,0,.28)}
  .artist-video{position:relative;overflow:hidden;aspect-ratio:16/9;border-radius:16px;margin:26px 0 22px;background:#0e0e0e;border:1px solid rgba(241,229,215,.18);cursor:pointer}
  .artist-video video{width:100%;height:100%;display:block;object-fit:cover;transition:transform .4s ease}
  .artist-video:hover video{transform:scale(1.03)}
  .artist-video span{position:absolute;left:11px;bottom:10px;padding:5px 8px;border-radius:999px;background:rgba(0,0,0,.65);font-size:.64rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.86;transition:opacity .2s ease}
  .artist-video:hover span{opacity:0}
  .artist-identity-media{position:relative;overflow:visible;margin:26px 0 22px;height:238px;border-radius:16px}
  .artist-identity-media>img{width:100%;height:100%;object-fit:cover;object-position:center 40%;border-radius:16px;clip-path:inset(0 round 16px);display:block;transform:translate3d(0,var(--parallax-y,0px),0) scale(1.04);will-change:transform;filter:saturate(.92) contrast(1.04)}
  .artist-video-float{position:absolute;z-index:3;right:14px;bottom:-18px;width:64px;height:64px;aspect-ratio:auto;margin:0;border-radius:50%;box-shadow:0 10px 22px rgba(0,0,0,.45);transition:width .45s cubic-bezier(.2,.8,.2,1),height .45s cubic-bezier(.2,.8,.2,1),border-radius .35s ease,box-shadow .35s ease}
  .artist-video-float:hover{width:176px;height:234px;border-radius:14px;box-shadow:0 22px 42px rgba(0,0,0,.5)}
  .artist-video-float video{transition:transform .45s ease}
  .artist-video-float:hover video{transform:scale(1.04)}
  .artist-video-float span{left:50%;bottom:auto;top:50%;transform:translate(-50%,-50%);white-space:nowrap;font-size:.5rem;padding:4px 6px;text-align:center}
  .artist-role{font-size:.76rem;letter-spacing:.12em;text-transform:uppercase;color:#f1c39d;font-weight:700}
  .artist-card h3{font-size:clamp(2.5rem,4vw,3.4rem);line-height:.9;margin:8px 0 6px}
  .artist-fullname{font-size:.9rem;opacity:.72}
  .artist-intro{font-size:1.05rem;line-height:1.45;margin:25px 0 22px;min-height:74px}
  .artist-style{border-top:1px solid rgba(241,229,215,.25);padding-top:16px}
  .artist-style span{font-size:.68rem;text-transform:uppercase;letter-spacing:.13em;color:#f1c39d;font-weight:700}
  .artist-style p{font-size:.92rem;line-height:1.45;margin-top:7px;opacity:.9}
  .artist-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
  .artist-links a{color:var(--cream);text-decoration:none;border:1px solid rgba(241,229,215,.36);border-radius:999px;padding:7px 10px;font-size:.78rem;font-weight:600}
  .artist-links a:hover{background:rgba(241,229,215,.12)}
  .artist-links small{display:block;font-size:.64rem;opacity:.7;font-weight:400;margin-top:2px}
  .artist-card-portfolio{margin:23px 0 4px;padding:17px 0 3px;border-top:1px solid rgba(241,229,215,.25);border-bottom:1px solid rgba(241,229,215,.16)}
  .artist-card-portfolio-label{display:block;margin-bottom:11px;color:#f1c39d;font-size:.67rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase}
  [data-brush-write] .brush-letter{display:inline-block;opacity:0;transform:translate(-5px,6px) rotate(-3deg);filter:blur(3px)}
  [data-brush-write].is-writing .brush-letter{animation:brush-letter .42s cubic-bezier(.2,.75,.2,1) forwards;animation-delay:calc(var(--brush-index) * 35ms)}
  @keyframes brush-letter{0%{opacity:0;transform:translate(-5px,6px) rotate(-3deg);filter:blur(3px)}60%{opacity:1;transform:translate(2px,-1px) rotate(1deg);filter:blur(0)}100%{opacity:1;transform:none;filter:none}}
  @media(prefers-reduced-motion:reduce){[data-brush-write] .brush-letter{opacity:1;transform:none;filter:none}[data-brush-write].is-writing .brush-letter{animation:none}}
  .artist-carousel{position:relative;padding:0 48px 34px}
  .artist-carousel-track{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:none;padding:2px 0 18px}
  .artist-carousel-track::-webkit-scrollbar{display:none}
  .artist-work{position:relative;flex:0 0:min(42vw,430px);aspect-ratio:4/5;margin:0;padding:0;overflow:hidden;scroll-snap-align:start;border:1px solid rgba(241,229,215,.14);border-radius:20px;background:#1c1f22;cursor:zoom-in;isolation:isolate}
  .artist-work::after{content:'';position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,transparent 48%,rgba(0,0,0,.68) 100%);pointer-events:none;transition:opacity .3s ease}
  .artist-work img{width:100%;height:100%;object-fit:cover;display:block;transform:translate3d(0,var(--parallax-y,0px),0) scale(1.04);transition:transform .55s cubic-bezier(.2,.75,.2,1),filter .35s ease}
  .artist-work-expand{position:absolute;z-index:2;bottom:16px;left:18px;color:var(--cream);font-size:.68rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:0;transform:translateY(8px);transition:opacity .25s ease,transform .25s ease}
  .artist-work:hover img,.artist-work:focus-visible img{transform:translate3d(0,var(--parallax-y,0px),0) scale(1.075);filter:saturate(1.08)}
  .artist-work:hover .artist-work-expand,.artist-work:focus-visible .artist-work-expand{opacity:1;transform:translateY(0)}
  .artist-work:focus-visible{outline:2px solid var(--terra-light);outline-offset:3px}
  .artist-carousel-control{position:absolute;z-index:3;top:calc(50% - 30px);width:48px;height:48px;border:1px solid rgba(241,229,215,.28);border-radius:50%;background:rgba(10,13,12,.72);backdrop-filter:blur(10px);color:var(--cream);font-size:1.5rem;line-height:1;cursor:pointer;transition:background .2s ease,transform .2s ease}
  .artist-carousel-control:hover{background:var(--terra);transform:scale(1.08)}
  .artist-carousel-prev{left:0}.artist-carousel-next{right:0}
  .artist-carousel-status{position:absolute;bottom:0;left:50%;transform:translateX(-50%);font-size:.7rem;font-weight:700;letter-spacing:.13em;color:rgba(241,229,215,.62)}
  .artist-carousel-status span{color:var(--terra-light)}
  .artist-card .artist-carousel{padding:0 27px 28px}
  .artist-card .artist-carousel-track{gap:12px;padding:0 0 14px}
  .artist-card .artist-work{flex:0 0 88%;min-width:88%;aspect-ratio:16/10;border-radius:15px}
  .artist-card .artist-work-expand{left:12px;bottom:11px;font-size:.58rem}
  .artist-card .artist-carousel-control{top:calc(50% - 23px);width:36px;height:36px;font-size:1.1rem}
  .artist-card .artist-carousel-prev{left:-2px}.artist-card .artist-carousel-next{right:-2px}
  .artist-card .artist-carousel-status{font-size:.62rem}
  .artist-portfolio-action{text-align:center;margin-top:10px}
  .portfolio-open{cursor:pointer;border:1px solid rgba(241,229,215,.45);color:var(--cream);background:transparent;border-radius:999px;padding:13px 20px;font:600 .92rem 'Outfit',sans-serif;transition:background .25s ease,transform .25s ease}
  .portfolio-open span{color:#f1c39d;margin-left:7px;font-size:.78rem}
  .portfolio-open:hover{background:rgba(241,229,215,.12);transform:translateY(-2px)}
  .portfolio-dialog{width:min(1180px,calc(100vw - 28px));max-height:calc(100svh - 28px);border:1px solid rgba(241,229,215,.18);border-radius:24px;padding:0;background:#111315;color:var(--cream);box-shadow:0 30px 100px rgba(0,0,0,.7)}
  .portfolio-dialog::backdrop{background:rgba(0,0,0,.78);backdrop-filter:blur(8px)}
  .portfolio-dialog-shell{padding:24px;overflow:auto;max-height:calc(100svh - 28px)}
  .portfolio-dialog-head{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:24px}
  .portfolio-dialog-head span{font-size:.7rem;letter-spacing:.13em;text-transform:uppercase;color:#f1c39d;font-weight:700}
  .portfolio-dialog-head h2{font-size:clamp(2rem,5vw,3.6rem);line-height:.95;margin-top:5px}
  .portfolio-close{cursor:pointer;background:transparent;border:1px solid rgba(241,229,215,.4);border-radius:999px;color:var(--cream);padding:9px 13px;font:600 .8rem 'Outfit',sans-serif}
  .portfolio-dialog-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  .portfolio-dialog-grid figure{margin:0;border-radius:12px;overflow:hidden;background:#222}
  .portfolio-dialog-grid img{width:100%;aspect-ratio:1;object-fit:cover;display:block}
  .artwork-lightbox{width:min(920px,calc(100vw - 28px));max-height:calc(100svh - 28px);padding:0;border:1px solid rgba(241,229,215,.2);border-radius:22px;overflow:hidden;background:#090a09;box-shadow:0 30px 100px rgba(0,0,0,.8)}
  .artwork-lightbox::backdrop{background:rgba(0,0,0,.86);backdrop-filter:blur(9px)}
  .artwork-lightbox img{display:block;width:100%;max-height:calc(100svh - 28px);object-fit:contain}
  .artwork-lightbox-close{position:absolute;z-index:1;top:15px;right:15px;border:1px solid rgba(241,229,215,.38);border-radius:999px;padding:9px 13px;background:rgba(10,13,12,.76);color:var(--cream);font:inherit;font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
  @media(max-width:700px){.portfolio-dialog-shell{padding:16px}.portfolio-dialog-grid{grid-template-columns:repeat(2,1fr);gap:7px}.portfolio-dialog-head h2{font-size:2rem}}
  @media(max-width:760px){.artist-card .artist-carousel{padding:0 0 28px}.artist-card .artist-carousel-track{gap:12px;padding:0}.artist-card .artist-work{flex:0 0 88%;min-width:88%;border-radius:15px}.artist-card .artist-carousel-control{display:none}.artist-work-expand{opacity:1;transform:none}.artist-carousel-status{bottom:0}.artwork-lightbox{border-radius:16px}}

  .process{background:var(--cream);color:var(--ink);padding:110px 0}
  .process-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.62fr);gap:70px;align-items:center;max-width:1020px;margin:0 auto}
  .process .sec-kicker{color:var(--terra)}
  .process .sec-title{color:var(--green);max-width:580px}
  .process-copy p{max-width:540px;margin-top:20px;color:#554b42;font-size:1.05rem;line-height:1.55}
  .process-copy > p:not(.process-intro){display:none}
  .process-points{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:26px}
  .process-points span{border:1px solid rgba(23,21,17,.15);border-radius:12px;padding:11px 12px;font-size:.78rem;line-height:1.35;color:#554b42}
  .process-points strong{display:block;margin-bottom:3px;color:var(--green);font-size:.84rem}
  .process .section-cta{color:var(--terra);margin-top:22px}
  .process .section-cta:hover{color:var(--brown)}
  .process-video{position:relative;aspect-ratio:608/1080;max-height:650px;justify-self:center;overflow:hidden;border-radius:22px;background:#161616;box-shadow:0 26px 60px rgba(33,25,19,.24)}
  .process-video video{width:100%;height:100%;display:block;object-fit:cover}
  .process-play{position:absolute;inset:0;border:0;cursor:pointer;background:linear-gradient(180deg,rgba(0,0,0,.02),rgba(0,0,0,.42));display:grid;place-items:center;color:white;transition:opacity .25s ease}
  .process-play span{width:76px;height:76px;border-radius:50%;display:grid;place-items:center;background:var(--terra);box-shadow:0 14px 30px rgba(0,0,0,.35);transition:transform .25s ease}
  .process-play:hover span{transform:scale(1.08)}
  .process-play svg{width:26px;height:26px;margin-left:4px}
  .process-video.playing .process-play{opacity:0;pointer-events:none}
  .process-caption{position:absolute;left:16px;bottom:15px;color:#fff;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;text-shadow:0 2px 8px rgba(0,0,0,.8)}
  .process-video.playing .process-caption{opacity:0}
  @media(max-width:780px){.process{padding:78px 0}.process-grid{grid-template-columns:1fr;gap:38px}.process-video{max-height:570px}.process-points{grid-template-columns:1fr}}
  .team-card{
    position:relative;background:var(--green-deep);border:1px solid rgba(241,229,215,.12);
    border-radius:22px;padding:14px 14px 22px;
    transition:transform .3s ease,box-shadow .3s ease;
  }
  .team-card:hover{transform:translateY(-6px);box-shadow:0 20px 44px rgba(0,0,0,.4)}
  .team-card .ph{aspect-ratio:4/5;border-radius:16px;overflow:hidden;margin-bottom:14px;background:#141d17}
  .team-card .ph img{width:100%;height:100%;object-fit:cover;display:block;transform:translate3d(0,var(--parallax-y,0px),0) scale(1.04);will-change:transform}
  .team-card h3{font-size:1.25rem;margin-bottom:2px}
  .team-role{font-size:.85rem;opacity:.75}
  .team-tune{
    display:inline-flex;align-items:center;gap:7px;margin-top:12px;
    font-size:.76rem;font-weight:600;padding:6px 12px;border-radius:999px;
    background:rgba(200,109,58,.15);border:1px solid rgba(200,109,58,.4);color:#e8b394;
  }
  .owner-badge{
    position:absolute;top:24px;left:24px;z-index:2;
    background:var(--terra);color:var(--cream);
    font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
    padding:5px 12px;border-radius:999px;box-shadow:0 6px 16px rgba(0,0,0,.35);
  }
  .staff-mark{
    aspect-ratio:4/5;border-radius:16px;display:grid;place-items:center;margin-bottom:14px;
    background:radial-gradient(circle at 35% 25%,var(--terra-light),var(--brown) 58%,#17110c);
    color:var(--cream);font-family:'Righteous',cursive;font-size:clamp(4.5rem,11vw,7rem);
  }
  .team-note{text-align:center;margin-top:30px;opacity:.75;font-size:.95rem}

  .gallery{background:var(--cream);color:var(--ink);border-radius:40px 40px 0 0}
  .gallery .sec-kicker{color:var(--terra)}
  .gallery .sec-title{color:var(--green)}
  .gallery-head{text-align:center;margin-bottom:44px}
  .gallery-head p,.styles-cards .brew-head p,.team-head p{max-width:680px;margin:16px auto 0;line-height:1.5;opacity:.82}
  .gallery-action{text-align:center;margin-top:32px}
  .gallery .section-cta{color:var(--terra)}
  .gallery .section-cta:hover{color:var(--brown)}
  .gallery-grid{
    display:grid;grid-template-columns:repeat(3,1fr);gap:18px;max-width:1120px;margin:0 auto;
  }
  @media(max-width:900px){.gallery-grid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:620px){.gallery-grid{grid-template-columns:1fr}}
  .gallery-item{
    background:#fdfbf4;border-radius:22px;overflow:hidden;
    border:1px solid rgba(23,21,17,.08);box-shadow:0 18px 40px rgba(38,55,44,.16);
  }
  .gallery-item img{width:100%;aspect-ratio:1;object-fit:cover;display:block;transform:translate3d(0,var(--parallax-y,0px),0) scale(1.04);will-change:transform}
  .gallery-item figcaption{padding:16px 16px 18px;color:#4b4036;font-size:.92rem}

  .contact{background:linear-gradient(180deg,var(--green) 0%,var(--green-deep) 100%)}
  .contact-grid{display:grid;grid-template-columns:1fr .9fr;gap:30px;align-items:start}
  @media(max-width:820px){.contact-grid{grid-template-columns:1fr}}
  .contact-card,.contact-proof{
    background:rgba(241,229,215,.05);border:1px solid rgba(241,229,215,.12);
    border-radius:24px;padding:28px;
  }
  .contact-card p,.contact-proof p{opacity:.84}
  .contact-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px}
  footer{
    text-align:center;padding:28px 5vw 40px;opacity:.72;font-size:.94rem
  }
  footer a{color:var(--terra-light);text-decoration:none}
</style>
</head>
<body class="is-loading">

<div class="site-loader" id="siteLoader" role="status" aria-label="Cargando Kitsune Tattoo">
  <div class="site-loader-inner">
    <img class="site-loader-mask" src="assets/brand/kitsune-loader-mask.png" alt="" aria-hidden="true">
  </div>
</div>

<nav id="nav">
  <a class="nav-logo" href="#top">${cleanText(profile.displayName)}</a>
  <button id="navToggle" class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
    <span></span><span></span><span></span>
  </button>
  <ul class="nav-links">
    <li><a href="#about">About</a></li>
    <li><a href="#styles">Styles</a></li>
    <li><a href="#team">Equipo</a></li>
    <li><a href="#process">Proceso</a></li>
    <li><a href="#gallery">Gallery</a></li>
    <li><a class="nav-cta" href="#contact">Book</a></li>
  </ul>
</nav>

<section class="hero" id="top">
  <div class="hero-sticky">
    <div class="hero-media">
      <img class="hero-video-poster" src="${escapeHtml(heroPoster)}" alt="" aria-hidden="true">
      <video class="hero-scroll-video" id="heroScrollVideo" muted playsinline webkit-playsinline preload="auto" poster="${escapeHtml(heroPoster)}" aria-label="Presentación de ${cleanText(profile.displayName)}">
        <source src="${escapeHtml(profile.heroVideo.localPath)}" type="video/mp4">
      </video>
    </div>
    <div class="hero-content">
      <span class="hero-kicker">tattoo with character</span>
      <h1>${cleanText(profile.displayName)}<br><em>${cleanText(profile.location)}</em></h1>
    </div>
    <div class="hero-marquee hero-marquee-top"><div class="hero-marquee-track"><span class="hero-marquee-jp">狐</span><a href="https://www.instagram.com/kitsune.tattoo/" target="_blank" rel="noreferrer">@kitsune.tattoo</a><span>刺青</span><a href="https://www.instagram.com/caradecuero/" target="_blank" rel="noreferrer">@caradecuero</a><span>墨</span><a href="https://www.instagram.com/vkonantattoo/" target="_blank" rel="noreferrer">@vkonantattoo</a><span>狐</span><a href="https://www.instagram.com/lalatxu/" target="_blank" rel="noreferrer">@lalatxu</a><span>刺青</span><a href="https://www.instagram.com/kitsune.tattoo/" target="_blank" rel="noreferrer">@kitsune.tattoo</a><span class="hero-marquee-jp">狐</span><a href="https://www.instagram.com/kitsune.tattoo/" target="_blank" rel="noreferrer">@kitsune.tattoo</a><span>刺青</span><a href="https://www.instagram.com/caradecuero/" target="_blank" rel="noreferrer">@caradecuero</a><span>墨</span><a href="https://www.instagram.com/vkonantattoo/" target="_blank" rel="noreferrer">@vkonantattoo</a><span>狐</span><a href="https://www.instagram.com/lalatxu/" target="_blank" rel="noreferrer">@lalatxu</a><span>刺青</span><a href="https://www.instagram.com/kitsune.tattoo/" target="_blank" rel="noreferrer">@kitsune.tattoo</a></div></div>
    <div class="hero-marquee hero-marquee-bottom"><div class="hero-marquee-track"><span>Leganes · Madrid</span><span class="hero-marquee-jp">狐</span><a href="https://www.instagram.com/caradecuero/" target="_blank" rel="noreferrer">@caradecuero</a><span>刺青</span><a href="https://www.instagram.com/vkonantattoo/" target="_blank" rel="noreferrer">@vkonantattoo</a><span>墨</span><a href="https://www.instagram.com/lalatxu/" target="_blank" rel="noreferrer">@lalatxu</a><span class="hero-marquee-jp">狐</span><span>Leganes · Madrid</span><span>刺青</span><span>Leganes · Madrid</span><span class="hero-marquee-jp">狐</span><a href="https://www.instagram.com/caradecuero/" target="_blank" rel="noreferrer">@caradecuero</a><span>刺青</span><a href="https://www.instagram.com/vkonantattoo/" target="_blank" rel="noreferrer">@vkonantattoo</a><span>墨</span><a href="https://www.instagram.com/lalatxu/" target="_blank" rel="noreferrer">@lalatxu</a><span class="hero-marquee-jp">狐</span><span>Leganes · Madrid</span><span>刺青</span></div></div>
    <div class="scroll-cue" id="scrollCue">
      <div class="scroll-cue-text">scroll to reveal</div>
      <div class="scroll-hint"></div>
    </div>
    <div class="hero-progress" id="heroProgress"></div>
  </div>
</section>

<section id="about">
  <div class="wrap about-grid">
    <div class="about-text reveal">
      <span class="sec-kicker">sobre nosotros</span>
      <h2 class="sec-title">En la guarida del zorro</h2>
      <p>Kitsune Tattoo no es solo un estudio: es un modo de vida. Aqui el tatuaje se entiende como un ritual, el que hace el kitsune, el espiritu zorro, cuando decide dejar huella.</p>
      <p>Desde Leganes, Av. de la Mancha 18, tatuamos a quienes buscan algo suyo, sin plantillas ni prisas. Color que grita, negro que susurra y una familia zorra que trata cada piel como un lienzo unico.</p>
      <a class="section-cta" href="#contact">Ven a conocer la guarida <span aria-hidden="true">→</span></a>
      <div class="pills">
        ${pillsMarkup(profile)}
      </div>
    </div>
    <div class="about-parallax reveal">
      ${aboutParallaxMarkup()}
    </div>
  </div>
</section>

<section class="brew style-showcase" id="styles">
  <div class="styles-sticky">
    <div class="styles-media"><img class="styles-video-poster" src="${escapeHtml(STYLE_SHOWCASE_VIDEO.posterPath)}" alt="Ambiente del estudio"><video class="styles-scroll-video" id="stylesScrollVideo" muted playsinline webkit-playsinline preload="auto" poster="${escapeHtml(STYLE_SHOWCASE_VIDEO.posterPath)}" aria-label="Ambiente del estudio"><source src="${escapeHtml(STYLE_SHOWCASE_VIDEO.videoPath)}" type="video/mp4"></video></div>
    <div class="styles-scrim"></div>
    <div class="styles-video-copy"><span>Kitsune Tattoo</span><h2>Un estilo para cada piel.</h2><p>No hacemos de todo: dominamos lo nuestro y lo llevamos al limite.</p></div>
  </div>
</section>

<section class="brew styles-cards">
  <div class="wrap">
    <div class="brew-head reveal">
      <span class="sec-kicker">signature styles</span>
      <h2 class="sec-title">Un estilo para cada piel</h2>
      <p>Trabajamos cada pieza con una identidad clara, desde el primer trazo hasta el ultimo detalle.</p>
    </div>
    <div class="brew-grid stagger">
      ${styleCardsMarkup()}
    </div>
  </div>
</section>

<section class="team" id="team">
  <div class="wrap">
    <div class="team-head reveal">
      <span class="sec-kicker">el estudio</span>
      <h2 class="sec-title">El equipo de Kitsune</h2>
      <p>Tres artistas, un estudio y una obsesion: que salgas por la puerta con un tatuaje que valga la pena mirar toda la vida.</p>
    </div>
    <div class="team-track reveal">
      ${staffMarkup()}
    </div>
    <p class="team-note">Kitsune Tattoo · Leganes, Av. de la Mancha 18. Cada portfolio se integrara con su propia direccion visual y fotos reales del artista.</p>
  </div>
</section>

<dialog class="artwork-lightbox" id="artworkLightbox" aria-label="Vista ampliada del tatuaje">
  <button class="artwork-lightbox-close" type="button" aria-label="Cerrar imagen">Cerrar</button>
  <img id="artworkLightboxImage" src="" alt="">
</dialog>

<section class="process" id="process">
  <div class="wrap process-grid">
    <div class="process-copy reveal">
      <span class="sec-kicker">detras de la tinta</span>
      <h2 class="sec-title">De la idea a tu piel</h2>
      <p>Del dibujo a la piel: te enseñamos una parte real del proceso creativo que hay detras de cada tatuaje en Kitsune.</p>
      <p class="process-intro">Nos cuentas tu idea, referencias y que significa para ti. Disenamos un boceto 100% personalizado y tatuamos sin prisas, en un ambiente limpio y seguro.</p>
      <div class="process-points"><span><strong>Hablamos</strong>Tu idea y referencias, sin compromiso.</span><span><strong>Disenamos</strong>Tu pieza, sin calcos repetidos.</span><span><strong>Tatuamos</strong>Tu sesion, con calma y cuidado.</span><span><strong>Cuidamos</strong>Pautas para que luzca hoy y dentro de diez anos.</span></div>
      <a class="section-cta" href="#contact">Reserva tu consulta <span aria-hidden="true">→</span></a>
    </div>
    <div class="process-video reveal" id="processVideoShell">
      <video id="processVideo" poster="${escapeHtml(DRAWING_PROCESS_MEDIA.posterPath)}" preload="metadata" playsinline>
        <source src="${escapeHtml(DRAWING_PROCESS_MEDIA.videoPath)}" type="video/mp4">
        Tu navegador no puede reproducir este video.
      </video>
      <button class="process-play" type="button" id="processPlay" aria-label="Reproducir el proceso de dibujo"><span><svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span></button>
      <span class="process-caption">Play para ver el proceso</span>
    </div>
  </div>
</section>

<section class="gallery" id="gallery">
  <div class="wrap">
    <div class="gallery-head reveal">
      <span class="sec-kicker">straight from the feed</span>
      <h2 class="sec-title">Nuestra tinta habla por nosotros</h2>
      <p>Cada tatuaje cuenta una historia. Estas son algunas de las que ya llevan puestas. El siguiente hueco es para la tuya.</p>
    </div>
    <div class="gallery-grid stagger">
      ${galleryMarkup(profile.portfolioPosts)}
    </div>
    <div class="gallery-action reveal"><a class="section-cta" href="#contact">Pide cita y sumate a la galeria <span aria-hidden="true">→</span></a></div>
  </div>
</section>

<section class="contact" id="contact">
  <div class="wrap contact-grid">
    <div class="contact-card reveal">
      <span class="sec-kicker">reservas</span>
      <h2 class="sec-title">Contacto y reserva</h2>
      <p>¿Tienes una idea rondandote la cabeza? Escribenos por Instagram y cuentanosla. Te ayudaremos a encontrar el artista y el enfoque que mejor encajen con tu pieza.</p>
      <div class="contact-actions">
        <a class="btn btn-primary" href="${escapeHtml(profile.profileUrl)}" target="_blank" rel="noreferrer">Hablar por Instagram</a>
        <a class="btn btn-ghost" href="#top">Volver arriba</a>
      </div>
    </div>
    <div class="contact-proof reveal">
      <h3>Cuentanos tu idea</h3>
      <p>Incluye una referencia si la tienes, la zona del cuerpo y el tamano aproximado. Cuantos mas detalles compartas, mejor podremos orientarte.</p>
    </div>
  </div>
</section>

<footer>
  © <span id="year"></span> ${cleanText(profile.displayName)} ·
  <a href="${escapeHtml(profile.profileUrl)}" target="_blank" rel="noreferrer">@${cleanText(profile.handle)}</a>
</footer>

<script>
  const siteLoader = document.getElementById('siteLoader');
  let loaderDismissed = false;
  const dismissLoader = () => {
    if (loaderDismissed || !siteLoader) return;
    loaderDismissed = true;
    siteLoader.classList.add('is-leaving');
    document.body.classList.remove('is-loading');
    setTimeout(() => siteLoader.remove(), 650);
  };
  // Wait for the initial render but never trap visitors on a slow connection.
  addEventListener('load', () => setTimeout(dismissLoader, 450), { once:true });
  setTimeout(dismissLoader, 4000);

  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('menu-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('.nav-links a').forEach((a) =>
      a.addEventListener('click', () => {
        nav.classList.remove('menu-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }));
  }
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 40), {passive:true});

  document.querySelectorAll('[data-brush-write]').forEach((heading) => {
    const text = heading.textContent || '';
    heading.setAttribute('aria-label', text);
    heading.textContent = '';
    [...text].forEach((character, index) => {
      const letter = document.createElement('span');
      letter.className = 'brush-letter';
      letter.style.setProperty('--brush-index', String(index));
      letter.textContent = character === ' ' ? '\u00a0' : character;
      heading.append(letter);
    });
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      if (entry.target.classList.contains('stagger')) {
        [...entry.target.children].forEach((child, index) => child.style.transitionDelay = (index * 90) + 'ms');
      }
      entry.target.querySelectorAll('[data-brush-write]').forEach((heading) => heading.classList.add('is-writing'));
      io.unobserve(entry.target);
    });
  }, {threshold:.15});
  document.querySelectorAll('.reveal,.stagger').forEach((el) => io.observe(el));

  document.querySelectorAll('[data-portfolio-open]').forEach((button) => {
    button.addEventListener('click', () => document.getElementById(button.dataset.portfolioOpen)?.showModal());
  });
  document.querySelectorAll('[data-portfolio-close]').forEach((button) => {
    button.addEventListener('click', () => button.closest('dialog')?.close());
  });
  document.querySelectorAll('.portfolio-dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  document.querySelectorAll('[data-artist-carousel]').forEach((carousel) => {
    const track = carousel.querySelector('.artist-carousel-track');
    const previous = carousel.querySelector('.artist-carousel-prev');
    const next = carousel.querySelector('.artist-carousel-next');
    const current = carousel.querySelector('.artist-carousel-status span');
    if (!(track instanceof HTMLElement)) return;

    const updatePosition = () => {
      const firstCard = track.querySelector('.artist-work');
      if (!(firstCard instanceof HTMLElement) || !(current instanceof HTMLElement)) return;
      const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
      const position = Math.round(track.scrollLeft / (firstCard.offsetWidth + gap)) + 1;
      current.textContent = String(Math.max(1, position)).padStart(2, '0');
    };
    const move = (direction) => track.scrollBy({ left: direction * track.clientWidth * .86, behavior: 'smooth' });
    let manualPauseUntil = 0;
    let autoIndex = 0;
    const pauseForInteraction = () => { manualPauseUntil = Date.now() + 6000; };
    const advance = () => {
      if (Date.now() < manualPauseUntil) return;
      const firstCard = track.querySelector('.artist-work');
      const totalCards = track.querySelectorAll('.artist-work').length;
      if (!(firstCard instanceof HTMLElement) || totalCards < 2) return;
      const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
      autoIndex = (autoIndex + 1) % totalCards;
      track.scrollTo({ left: autoIndex * (firstCard.offsetWidth + gap), behavior: 'smooth' });
    };
    previous?.addEventListener('click', () => { pauseForInteraction(); move(-1); });
    next?.addEventListener('click', () => { pauseForInteraction(); move(1); });
    track.addEventListener('scroll', updatePosition, { passive:true });
    track.addEventListener('pointerdown', pauseForInteraction, { passive:true });
    setTimeout(advance, 900);
    setInterval(advance, 1800);
    updatePosition();
  });

  const artworkLightbox = document.getElementById('artworkLightbox');
  const artworkLightboxImage = document.getElementById('artworkLightboxImage');
  document.querySelectorAll('[data-lightbox-image]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!(artworkLightbox instanceof HTMLDialogElement) || !(artworkLightboxImage instanceof HTMLImageElement)) return;
      artworkLightboxImage.src = button.dataset.lightboxImage || '';
      artworkLightboxImage.alt = button.dataset.lightboxAlt || 'Tatuaje de Kitsune Tattoo';
      artworkLightbox.showModal();
    });
  });
  if (artworkLightbox instanceof HTMLDialogElement) {
    artworkLightbox.querySelector('.artwork-lightbox-close')?.addEventListener('click', () => artworkLightbox.close());
    artworkLightbox.addEventListener('click', (event) => {
      if (event.target === artworkLightbox) artworkLightbox.close();
    });
  }

  document.querySelectorAll('[data-hover-video]').forEach((container) => {
    const video = container.querySelector('video');
    if (!(video instanceof HTMLVideoElement)) return;
    video.playbackRate = 1.5;
    container.addEventListener('mouseenter', async () => {
      try { await video.play(); } catch { /* Playback remains optional when the browser blocks it. */ }
    });
    container.addEventListener('mouseleave', () => {
      video.pause();
      video.currentTime = 0;
    });
  });

  const processVideo = document.getElementById('processVideo');
  const processPlay = document.getElementById('processPlay');
  const processVideoShell = document.getElementById('processVideoShell');
  if (processVideo instanceof HTMLVideoElement && processPlay && processVideoShell) {
    processPlay.addEventListener('click', async () => {
      processVideo.controls = true;
      processVideoShell.classList.add('playing');
      try { await processVideo.play(); } catch { processVideoShell.classList.remove('playing'); }
    });
    processVideo.addEventListener('ended', () => processVideoShell.classList.remove('playing'));
  }

  const parallaxImages = Array.from(document.querySelectorAll('.about-parallax-frame img, .styles-cards .style-card-image, .artist-identity-media > img, .artist-work img, .gallery-item img, .team-card .ph img, .ig-mini img'))
    .map((image) => {
      const frame = image.closest('[data-about-parallax], .brew-card, .artist-identity-media, .artist-work, .gallery-item, .team-card .ph, .ig-mini');
      return {
        frame,
        image,
        depth: Number.parseFloat(frame?.getAttribute('data-parallax-depth') || '.62')
      };
    })
    .filter((item) => item.frame instanceof HTMLElement && item.image instanceof HTMLImageElement);
  if (parallaxImages.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let parallaxQueued = false;
    const updateImageParallax = () => {
      parallaxImages.forEach((item) => {
        if (!(item.frame instanceof HTMLElement) || !(item.image instanceof HTMLImageElement)) return;
        const rect = item.frame.getBoundingClientRect();
        const progress = Math.min(Math.max((innerHeight - rect.top) / (innerHeight + rect.height), 0), 1);
        const offset = (progress - .5) * -76 * item.depth;
        item.image.style.setProperty('--parallax-y', offset + 'px');
      });
      parallaxQueued = false;
    };
    const queueImageParallax = () => {
      if (parallaxQueued) return;
      parallaxQueued = true;
      requestAnimationFrame(updateImageParallax);
    };
    addEventListener('scroll', queueImageParallax, { passive:true });
    addEventListener('resize', queueImageParallax, { passive:true });
    queueImageParallax();
  }

  const heroScrollVideo = document.getElementById('heroScrollVideo');
  const heroSec = document.querySelector('.hero');
  const heroContent = document.querySelector('.hero-content');
  const heroProgress = document.getElementById('heroProgress');
  if (heroScrollVideo instanceof HTMLVideoElement) {
    heroScrollVideo.addEventListener('loadeddata', () => {
      heroScrollVideo.pause();
      heroScrollVideo.classList.add('is-ready');
    }, { once:true });
    heroScrollVideo.load();
    // A muted inline play/pause primes video decoding on iPhone without autoplaying the hero.
    heroScrollVideo.play().then(() => heroScrollVideo.pause()).catch(() => undefined);
  }

  let targetP = 0;
  let currentP = 0;
  function normalizeProgress(progress) {
    if (progress <= 0.001) return 0;
    if (progress >= 0.999) return 1;
    return progress;
  }
  addEventListener('scroll', () => {
    const total = heroSec.offsetHeight - innerHeight;
    targetP = normalizeProgress(Math.min(Math.max(-heroSec.getBoundingClientRect().top / total, 0), 1));
  }, {passive:true});

  (function scrubLoop() {
    currentP += (targetP - currentP) * 0.06;
    if (Math.abs(targetP - currentP) <= 0.0004) {
      currentP = targetP;
    }

    currentP = normalizeProgress(currentP);

    if (heroScrollVideo instanceof HTMLVideoElement && Number.isFinite(heroScrollVideo.duration) && heroScrollVideo.duration > 0) {
      const targetTime = currentP * heroScrollVideo.duration;
      if (!heroScrollVideo.seeking && Math.abs(heroScrollVideo.currentTime - targetTime) > (1 / 30)) {
        heroScrollVideo.currentTime = targetTime;
      }
    }
    if (heroProgress && heroContent) {
      heroProgress.style.width = (currentP * 100) + '%';
      const opacity = Math.max(1 - currentP * 2.2, 0);
      heroContent.style.opacity = opacity;
      const cue = document.getElementById('scrollCue');
      if (cue) cue.style.opacity = opacity;
      heroContent.style.pointerEvents = opacity < 0.1 ? 'none' : 'auto';
    }
    requestAnimationFrame(scrubLoop);
  })();

  const stylesScrollVideo = document.getElementById('stylesScrollVideo');
  const stylesSection = document.getElementById('styles');
  if (stylesScrollVideo instanceof HTMLVideoElement) {
    const prepareStyleVideo = () => {
      stylesScrollVideo.load();
      // Muted inline playback is permitted on iPhone and forces Safari to decode a first frame.
      stylesScrollVideo.play().then(() => stylesScrollVideo.pause()).catch(() => undefined);
    };
    stylesScrollVideo.addEventListener('loadeddata', () => {
      stylesScrollVideo.pause();
      stylesScrollVideo.classList.add('is-ready');
    }, { once:true });
    if (stylesSection) {
      new IntersectionObserver((entries, observer) => {
        if (!entries[0]?.isIntersecting) return;
        prepareStyleVideo();
        observer.disconnect();
      }, { rootMargin:'150% 0px' }).observe(stylesSection);
    } else {
      prepareStyleVideo();
    }
  }
  let styleTargetProgress = 0;
  let styleCurrentProgress = 0;
  function updateStyleProgress() {
    if (!stylesSection) return;
    const distance = Math.max(stylesSection.offsetHeight - innerHeight, 1);
    styleTargetProgress = Math.min(Math.max(-stylesSection.getBoundingClientRect().top / distance, 0), 1);
  }
  addEventListener('scroll', updateStyleProgress, {passive:true});
  addEventListener('resize', updateStyleProgress, {passive:true});
  (function stylesScrubLoop() {
    styleCurrentProgress += (styleTargetProgress - styleCurrentProgress) * .06;
    if (Math.abs(styleTargetProgress - styleCurrentProgress) <= .0004) styleCurrentProgress = styleTargetProgress;
    if (stylesScrollVideo instanceof HTMLVideoElement && Number.isFinite(stylesScrollVideo.duration) && stylesScrollVideo.duration > 0) {
      const targetTime = styleCurrentProgress * stylesScrollVideo.duration;
      // The exported MP4 uses an intra-only GOP, so each scroll seek can render immediately.
      if (!stylesScrollVideo.seeking && Math.abs(stylesScrollVideo.currentTime - targetTime) > (1 / 30)) {
        stylesScrollVideo.currentTime = targetTime;
      }
    }
    requestAnimationFrame(stylesScrubLoop);
  })();
  updateStyleProgress();

  document.getElementById('year').textContent = new Date().getFullYear();
</script>
</body>
</html>`;
};

export class StaticSiteWriter {
  public async write(profile: CreatorProfile, outputDirectory: string): Promise<string> {
    await mkdir(outputDirectory, { recursive: true });
    const outputPath = path.join(outputDirectory, "index.html");
    await writeFile(outputPath, template(profile), "utf8");
    return outputPath;
  }
}
