// BLACKVAULT - Supabase Auth
const SUPABASE_URL = "https://icauoqqguknutvxlssqd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_XY9Yl4jQY4K3bmkebtYyYw_hsWp3uJ1";

document.addEventListener("DOMContentLoaded", async () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const header = document.querySelector(".topbar");
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