(function () {
  "use strict";

  // -------------------------------------------------------
  // Supabase client
  // -------------------------------------------------------
  var sb = null;
  var configOk = window.SUPABASE_URL && window.SUPABASE_ANON_KEY &&
    window.SUPABASE_URL.indexOf("TU-PROYECTO") === -1 &&
    window.SUPABASE_ANON_KEY.indexOf("TU-ANON-KEY") === -1;

  if (configOk && window.supabase) {
    sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  } else {
    console.warn(
      "[Movimiento Multisectorial] Supabase no está configurado todavía. " +
      "Completá config.js con tu Project URL y tu anon key para activar el formulario, " +
      "el contador y el listado de adhesiones."
    );
  }

  // -------------------------------------------------------
  // Mobile nav
  // -------------------------------------------------------
  var header = document.getElementById("site-header");
  var menuToggle = document.getElementById("menu-toggle");

  menuToggle.addEventListener("click", function () {
    var isOpen = header.classList.toggle("nav-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.querySelectorAll(".main-nav a").forEach(function (link) {
    link.addEventListener("click", function () {
      header.classList.remove("nav-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });

  // -------------------------------------------------------
  // Floating CTA: hide once the signature form is in view
  // -------------------------------------------------------
  var floatingCta = document.getElementById("floating-cta");
  var adherirSection = document.getElementById("adherir");

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          floatingCta.style.display = entry.isIntersecting ? "none" : "block";
        });
      },
      { threshold: 0.15 }
    );
    io.observe(adherirSection);
  }

  // -------------------------------------------------------
  // Counter (hero + adherir section) — real count from Supabase
  // -------------------------------------------------------
  var heroCounterEl = document.getElementById("hero-counter");
  var counterEl = document.getElementById("counter-number");

  function renderCounter(value) {
    var text = typeof value === "number" ? String(value) : "—";
    heroCounterEl.textContent = text;
    counterEl.textContent = text;
  }

  function fetchCounter() {
    if (!sb) return;
    sb.rpc("contar_adhesiones").then(function (res) {
      if (res.error) {
        console.error("Error al obtener el contador:", res.error);
        return;
      }
      renderCounter(Number(res.data));
    });
  }

  fetchCounter();

  // -------------------------------------------------------
  // Public signers list
  // -------------------------------------------------------
  var signersList = document.getElementById("signers-list");
  var signersEmpty = document.getElementById("signers-empty");
  var loadMoreBtn = document.getElementById("load-more-signers");
  var PAGE_SIZE = 20;
  var signersOffset = 0;

  function renderSigners(rows, append) {
    if (!append) signersList.innerHTML = "";

    if (rows.length === 0 && signersOffset === 0) {
      signersEmpty.textContent = "Todavía no hay adhesiones públicas para mostrar.";
      signersList.appendChild(signersEmpty);
      loadMoreBtn.hidden = true;
      return;
    }

    if (signersEmpty.parentNode) signersEmpty.remove();

    rows.forEach(function (row) {
      var li = document.createElement("li");

      var nameEl = document.createElement("span");
      nameEl.className = "signer-name";
      nameEl.textContent = [row.nombre, row.apellido].filter(Boolean).join(" ");

      var metaEl = document.createElement("span");
      metaEl.className = "signer-meta";
      metaEl.textContent = [row.profesion, row.localidad].filter(Boolean).join(" · ");

      li.appendChild(nameEl);
      li.appendChild(metaEl);
      signersList.appendChild(li);
    });

    loadMoreBtn.hidden = rows.length < PAGE_SIZE;
  }

  function fetchSigners(append) {
    if (!sb) {
      signersEmpty.textContent =
        "Configurá Supabase en config.js para mostrar acá las adhesiones públicas.";
      return;
    }

    sb.from("adhesiones_publicas")
      .select("id, nombre, apellido, profesion, localidad")
      .order("created_at", { ascending: false })
      .range(signersOffset, signersOffset + PAGE_SIZE - 1)
      .then(function (res) {
        if (res.error) {
          console.error("Error al obtener adhesiones públicas:", res.error);
          signersEmpty.textContent = "No se pudo cargar el listado de adhesiones.";
          return;
        }
        renderSigners(res.data, append);
        signersOffset += res.data.length;
      });
  }

  fetchSigners(false);

  loadMoreBtn.addEventListener("click", function () {
    fetchSigners(true);
  });

  // -------------------------------------------------------
  // Form validation + submit
  // -------------------------------------------------------
  var form = document.getElementById("signature-form");
  var submitBtn = document.getElementById("form-submit");
  var formMessage = document.getElementById("form-message");

  var fields = {
    nombre: document.getElementById("f-nombre"),
    dni: document.getElementById("f-dni"),
    profesion: document.getElementById("f-profesion"),
    localidad: document.getElementById("f-localidad"),
    email: document.getElementById("f-email"),
    telefono: document.getElementById("f-telefono"),
    adherir: document.getElementById("f-adherir"),
    publica: document.getElementById("f-publica")
  };

  function setFieldError(name, message) {
    var input = fields[name];
    var errorEl = form.querySelector('[data-error-for="f-' + name + '"]');
    if (input) input.classList.toggle("invalid", Boolean(message));
    if (errorEl) errorEl.textContent = message || "";
  }

  function clearAllErrors() {
    Object.keys(fields).forEach(function (name) {
      setFieldError(name, "");
    });
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isValidDni(value) {
    var digits = value.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 9;
  }

  function validateForm() {
    var valid = true;
    clearAllErrors();

    if (!fields.nombre.value.trim()) {
      setFieldError("nombre", "Ingresá tu nombre y apellido.");
      valid = false;
    }

    if (!fields.dni.value.trim()) {
      setFieldError("dni", "Ingresá tu DNI.");
      valid = false;
    } else if (!isValidDni(fields.dni.value)) {
      setFieldError("dni", "Ingresá un DNI válido, sin puntos ni espacios.");
      valid = false;
    }

    if (!fields.profesion.value.trim()) {
      setFieldError("profesion", "Ingresá tu profesión.");
      valid = false;
    }

    if (!fields.localidad.value.trim()) {
      setFieldError("localidad", "Ingresá tu localidad.");
      valid = false;
    }

    if (!fields.email.value.trim()) {
      setFieldError("email", "Ingresá tu email.");
      valid = false;
    } else if (!isValidEmail(fields.email.value.trim())) {
      setFieldError("email", "Ingresá un email válido.");
      valid = false;
    }

    if (!fields.adherir.checked) {
      formMessage.textContent = "Tenés que marcar \u201cQuiero adherir al petitorio\u201d para continuar.";
      formMessage.className = "form-message is-error";
      valid = false;
    }

    return valid;
  }

  function showModal() {
    document.getElementById("modal-backdrop").hidden = false;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    formMessage.textContent = "";
    formMessage.className = "form-message";

    if (!validateForm()) return;

    if (!sb) {
      formMessage.textContent =
        "La página todavía no está conectada a la base de datos (falta configurar Supabase en config.js).";
      formMessage.className = "form-message is-error";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.querySelector(".btn-label").textContent = "Enviando…";

    var payload = {
      nombre: fields.nombre.value.trim(),
      dni: fields.dni.value.replace(/\D/g, ""),
      profesion: fields.profesion.value.trim(),
      localidad: fields.localidad.value.trim(),
      email: fields.email.value.trim(),
      telefono: fields.telefono.value.trim() || null,
      publica_nombre: fields.publica.checked
    };

    sb.from("adhesiones")
      .insert(payload)
      .then(function (res) {
        submitBtn.disabled = false;
        submitBtn.querySelector(".btn-label").textContent = "Firmar petitorio";

        if (res.error) {
          // Postgres unique_violation on the dni column
          if (res.error.code === "23505") {
            formMessage.textContent = "Ya registramos una adhesión con este DNI.";
          } else {
            console.error("Error al registrar la adhesión:", res.error);
            formMessage.textContent =
              "No pudimos registrar tu adhesión. Probá nuevamente en un momento.";
          }
          formMessage.className = "form-message is-error";
          return;
        }

        form.reset();
        clearAllErrors();
        formMessage.textContent = "";
        showModal();
        fetchCounter();
        signersOffset = 0;
        fetchSigners(false);
      });
  });

  // -------------------------------------------------------
  // Modal
  // -------------------------------------------------------
  var modalBackdrop = document.getElementById("modal-backdrop");
  var modalClose = document.getElementById("modal-close");
  var modalBack = document.getElementById("modal-back");
  var modalShare = document.getElementById("modal-share");

  function hideModal() {
    modalBackdrop.hidden = true;
  }

  modalClose.addEventListener("click", hideModal);
  modalBack.addEventListener("click", function () {
    hideModal();
    document.getElementById("que-pedimos").scrollIntoView({ behavior: "smooth" });
  });

  modalBackdrop.addEventListener("click", function (event) {
    if (event.target === modalBackdrop) hideModal();
  });

  var SHARE_TEXT =
    "Estoy adhiriendo al petitorio por una elección presencial y transparente en la Caja del Arte de Curar. Sumate vos también.";

  modalShare.addEventListener("click", function () {
    var url = window.location.href;
    if (navigator.share) {
      navigator.share({ text: SHARE_TEXT, url: url }).catch(function () {});
    } else {
      var whatsappUrl =
        "https://wa.me/?text=" + encodeURIComponent(SHARE_TEXT + " " + url);
      window.open(whatsappUrl, "_blank", "noopener");
    }
  });
})();
