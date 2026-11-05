// BLACKVAULT - Supabase Auth
const SUPABASE_URL = "https://icauoqqguknutvxlssqd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_XY9Yl4jQY4K3bmkebtYyYw_hsWp3uJ1";

document.addEventListener("DOMContentLoaded", async () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  document.querySelectorAll("[data-like]").forEach(button => {
    button.addEventListener("click", () => {
      const liked = button.classList.toggle("liked");
      const icon = button.querySelector("b");
      if (icon) icon.textContent = liked ? "♥" : "♡";
      button.setAttribute("aria-pressed", String(liked));
    });
  });

  document.querySelectorAll("[data-share]").forEach(button => {
    button.addEventListener("click", async () => {
      const card = button.closest(".reel-card");
      const title = card?.querySelector("h2")?.textContent || "DIGITAL FACTORY";
      const shareData = { title: title + " | DIGITAL FACTORY", text: "Mira este reel de DIGITAL FACTORY", url: window.location.href };
      try {
        if (navigator.share) await navigator.share(shareData);
        else if (navigator.clipboard) {
          await navigator.clipboard.writeText(window.location.href);
          button.querySelector("span").textContent = "COPIADO";
        }
      } catch (error) { /* El usuario canceló compartir. */ }
    });
  });

  const clock = document.getElementById("system-clock");
  const updateClock = () => { if (clock) clock.textContent = new Date().toLocaleTimeString("es-CL", { hour12: false }); };
  updateClock();
  if (clock) setInterval(updateClock, 1000);

  const header = document.querySelector(".factory-topbar, .topbar");
  const toggle = document.querySelector(".menu-toggle");
  if (header && toggle) {
    toggle.addEventListener("click", () => {
      const open = header.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });
  }

  if (!window.supabase) {
    document.querySelectorAll("[data-form-message]").forEach(el => {
      el.textContent = "No se pudo cargar el servicio de autenticación. Recarga la página e inténtalo otra vez.";
    });
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  window.blackvaultSupabase = client;

  const loginForm = document.querySelector("[data-login-form]");
  if (loginForm) {
    loginForm.addEventListener("submit", async event => {
      event.preventDefault();
      const message = loginForm.querySelector("[data-form-message]");
      const button = loginForm.querySelector('button[type="submit"]');
      const email = loginForm.querySelector('[name="email"]').value.trim();
      const password = loginForm.querySelector('[name="password"]').value;
      button.disabled = true;
      message.textContent = "Verificando credenciales...";
      const { error } = await client.auth.signInWithPassword({ email, password });
      button.disabled = false;
      if (error) {
        message.textContent = error.message;
        return;
      }
      message.textContent = "Acceso correcto. Entrando...";
      window.location.href = "dashboard.html";
    });
  }

  const registerForm = document.querySelector("[data-register-form]");
  if (registerForm) {
    registerForm.addEventListener("submit", async event => {
      event.preventDefault();
      const message = registerForm.querySelector("[data-form-message]");
      const button = registerForm.querySelector('button[type="submit"]');
      const name = registerForm.querySelector('[name="name"]').value.trim();
      const email = registerForm.querySelector('[name="email"]').value.trim();
      const password = registerForm.querySelector('[name="password"]').value;
      button.disabled = true;
      message.textContent = "Creando tu cuenta...";
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });
      button.disabled = false;
      if (error) {
        message.textContent = error.message;
        return;
      }
      if (data.session) {
        message.textContent = "Cuenta creada. Entrando...";
        window.location.href = "dashboard.html";
      } else {
        message.textContent = "Cuenta creada. Revisa tu correo y confirma el registro antes de iniciar sesión.";
        registerForm.reset();
      }
    });
  }

  if (document.body.hasAttribute("data-member-page")) {
    const { data: { session }, error } = await client.auth.getSession();
    if (error || !session) {
      window.location.replace("login.html");
      return;
    }
    const emailNode = document.querySelector("[data-member-email]");
    if (emailNode) emailNode.textContent = session.user.email || "Mi cuenta";
    const logout = document.querySelector("[data-logout]");
    if (logout) {
      logout.addEventListener("click", async event => {
        event.preventDefault();
        await client.auth.signOut();
        window.location.replace("login.html");
      });
    }
  }
});