// DIGITAL FACTORY — Supabase Auth + Reels publishing
const SUPABASE_URL = "https://icauoqqguknutvxlssqd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_XY9Yl4jQY4K3bmkebtYyYw_hsWp3uJ1";
const MEDIA_BUCKET = "reel-media";
const MAX_MEDIA_BYTES = 100 * 1024 * 1024;

document.addEventListener("DOMContentLoaded", async () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  document.querySelectorAll("[data-like]").forEach(button => button.addEventListener("click", () => {
    const liked = button.classList.toggle("liked");
    const icon = button.querySelector("b"); if (icon) icon.textContent = liked ? "♥" : "♡";
    button.setAttribute("aria-pressed", String(liked));
  }));
  document.querySelectorAll("[data-share]").forEach(button => button.addEventListener("click", async () => {
    const title = button.closest(".reel-card")?.querySelector("h2")?.textContent || "DIGITAL FACTORY";
    try { if (navigator.share) await navigator.share({title, text:"Mira este reel de DIGITAL FACTORY", url:location.href});
      else if (navigator.clipboard) { await navigator.clipboard.writeText(location.href); button.querySelector("span").textContent="COPIADO"; }
    } catch (_) {}
  }));
  const clock=document.getElementById("system-clock");
  const tick=()=>{if(clock)clock.textContent=new Date().toLocaleTimeString("es-CL",{hour12:false});};tick();if(clock)setInterval(tick,1000);
  const header=document.querySelector(".factory-topbar,.topbar"),toggle=document.querySelector(".menu-toggle");
  if(header&&toggle)toggle.addEventListener("click",()=>{const open=header.classList.toggle("menu-open");toggle.setAttribute("aria-expanded",String(open));});

  if (!window.supabase) {
    document.querySelectorAll("[data-form-message]").forEach(el=>el.textContent="No se pudo cargar Supabase. Recarga la página.");
    return;
  }
  const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
  window.digitalFactorySupabase=client;

  const loginForm=document.querySelector("[data-login-form]");
  if(loginForm)loginForm.addEventListener("submit",async e=>{
    e.preventDefault();const msg=loginForm.querySelector("[data-form-message]"),btn=loginForm.querySelector('button[type="submit"]');
    btn.disabled=true;msg.textContent="Verificando credenciales...";
    try{const {error}=await client.auth.signInWithPassword({email:loginForm.querySelector('[name="email"]').value.trim(),password:loginForm.querySelector('[name="password"]').value});
      if(error)throw error;msg.textContent="Acceso correcto. Abriendo DIGITAL FACTORY...";
      location.href="index.html?publish=1";
    }catch(err){msg.textContent=err.message||"No se pudo iniciar sesión.";}finally{btn.disabled=false;}
  });
  const registerForm=document.querySelector("[data-register-form]");
  if(registerForm)registerForm.addEventListener("submit",async e=>{
    e.preventDefault();const msg=registerForm.querySelector("[data-form-message]"),btn=registerForm.querySelector('button[type="submit"]');
    btn.disabled=true;msg.textContent="Creando tu cuenta...";
    try{const {data,error}=await client.auth.signUp({email:registerForm.querySelector('[name="email"]').value.trim(),password:registerForm.querySelector('[name="password"]').value,options:{data:{full_name:registerForm.querySelector('[name="name"]').value.trim()}}});
      if(error)throw error;
      if(data.session){msg.textContent="Cuenta creada. Entrando...";location.href="index.html?publish=1";}
      else{msg.textContent="Cuenta creada. Revisa tu correo y confirma el registro antes de iniciar sesión.";registerForm.reset();}
    }catch(err){msg.textContent=err.message||"No se pudo crear la cuenta.";}finally{btn.disabled=false;}
  });

  const modal=document.querySelector("[data-publish-modal]"),publishForm=document.querySelector("[data-publish-form]");
  const openPublish=async()=>{
    const {data:{session}}=await client.auth.getSession();
    if(!session){location.href="login.html?next=publish";return;}
    if(modal){modal.hidden=false;document.body.classList.add("publish-open");}
  };
  document.querySelectorAll("[data-open-publish]").forEach(b=>b.addEventListener("click",openPublish));
  document.querySelector("[data-close-publish]")?.addEventListener("click",()=>{if(modal)modal.hidden=true;document.body.classList.remove("publish-open");});
  modal?.addEventListener("click",e=>{if(e.target===modal){modal.hidden=true;document.body.classList.remove("publish-open");}});
  if(modal && new URLSearchParams(location.search).get("publish")==="1") {
    const {data:{session}}=await client.auth.getSession();
    if(session) {modal.hidden=false;document.body.classList.add("publish-open");}
    history.replaceState({}, "", location.pathname);
  }

  const feed=document.querySelector(".reels-feed");
  const escapeHTML=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const renderPost=post=>{
    if(!feed)return;
    const isVideo=post.media_type==="video";
    const media=isVideo?'<video class="uploaded-media" controls playsinline preload="metadata"></video>':'<img class="uploaded-media" alt="">';
    const card=document.createElement("article");card.className="reel-card user-reel";
    card.innerHTML='<div class="reel-image user-reel-image">'+media+'<div class="reel-top-tag">DIGITAL FACTORY / COMMUNITY <span>● PUBLISHED</span></div></div>'+
      '<div class="reel-caption"><span class="reel-category">COMMUNITY // MEMBER POST</span><h2>'+escapeHTML(post.title)+'</h2><p>'+escapeHTML(post.caption||"")+'</p><div class="reel-author"><span class="avatar">DF</span><span><b>'+escapeHTML(post.author_name||"MEMBER")+'</b><small>Digital Factory Community</small></span></div></div>';
    const mediaNode=card.querySelector(".uploaded-media");mediaNode.src=post.media_url;
    feed.prepend(card);
  };
  const loadPosts=async()=>{
    if(!feed)return;
    const {data,error}=await client.from("reel_posts").select("*").order("created_at",{ascending:false}).limit(30);
    if(error){console.warn("No se pudieron cargar los reels:",error.message);return;}
    (data||[]).forEach(renderPost);
  };
  await loadPosts();

  if(publishForm)publishForm.addEventListener("submit",async e=>{
    e.preventDefault();const msg=publishForm.querySelector("[data-publish-message]"),btn=publishForm.querySelector('button[type="submit"]');
    const file=publishForm.querySelector('[name="media"]').files[0],title=publishForm.querySelector('[name="title"]').value.trim(),caption=publishForm.querySelector('[name="caption"]').value.trim();
    if(!file){msg.textContent="Selecciona una fotografía o video.";return;}
    if(file.size>MAX_MEDIA_BYTES){msg.textContent="El archivo supera el máximo de 100 MB.";return;}
    if(!(file.type.startsWith("image/")||["video/mp4","video/webm","video/quicktime"].includes(file.type))){msg.textContent="Formato no compatible. Usa una imagen, MP4, WebM o MOV.";return;}
    btn.disabled=true;msg.textContent="Subiendo archivo al nodo seguro...";
    try{
      const {data:{session},error:sessionError}=await client.auth.getSession();if(sessionError||!session)throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
      const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"-");
      const path=session.user.id+"/"+Date.now()+"-"+safeName;
      const {error:uploadError}=await client.storage.from(MEDIA_BUCKET).upload(path,file,{cacheControl:"3600",upsert:false,contentType:file.type});
      if(uploadError)throw uploadError;
      const {data:{publicUrl}}=client.storage.from(MEDIA_BUCKET).getPublicUrl(path);
      const {data:post,error:insertError}=await client.from("reel_posts").insert({user_id:session.user.id,title,caption,media_url:publicUrl,media_type:file.type.startsWith("video/")?"video":"image",author_name:session.user.user_metadata?.full_name||session.user.email?.split("@")[0]||"MEMBER"}).select().single();
      if(insertError){await client.storage.from(MEDIA_BUCKET).remove([path]);throw insertError;}
      renderPost(post);publishForm.reset();msg.textContent="¡Publicado! Tu contenido ya está en el feed.";
      setTimeout(()=>{if(modal)modal.hidden=true;document.body.classList.remove("publish-open");msg.textContent="";},1200);
    }catch(err){msg.textContent=(err.message||"Error al publicar.")+" Revisa la configuración de Supabase si es la primera publicación.";}
    finally{btn.disabled=false;}
  });

  if(document.body.hasAttribute("data-member-page")){
    const {data:{session},error}=await client.auth.getSession();
    if(error||!session){location.replace("login.html");return;}
    const emailNode=document.querySelector("[data-member-email]");if(emailNode)emailNode.textContent=session.user.email||"Mi cuenta";
    document.querySelector("[data-logout]")?.addEventListener("click",async e=>{e.preventDefault();await client.auth.signOut();location.replace("login.html");});
  }
});
