const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const revealElements = document.querySelectorAll(".reveal");
const faqButtons = document.querySelectorAll(".faq-trigger");
const contactForm = document.querySelector("#contact-form");
const formNote = document.querySelector("#form-note");
const contactEmail = "z0agency.contact@gmail.com";
const mediaTabs = document.querySelectorAll(".media-tab");
const mediaPanels = document.querySelectorAll(".media-panel");
const interactiveMountain = document.querySelector(".interactive-mountain");
const mountainModel = document.querySelector(".mountain-model");
const climbers = interactiveMountain
  ? interactiveMountain.querySelectorAll(".climber")
  : [];
const tooltip = document.querySelector("#mountain-tooltip");
const sections = document.querySelectorAll("main .section");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    siteNav.classList.toggle("is-open");
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");
    });
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  {
    threshold: 0.18
  }
);

revealElements.forEach((element) => {
  revealObserver.observe(element);
});

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-active", entry.isIntersecting);
    });
  },
  {
    threshold: 0.3
  }
);

sections.forEach((section) => {
  sectionObserver.observe(section);
});

faqButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const panel = button.nextElementSibling;
    const expanded = button.getAttribute("aria-expanded") === "true";

    faqButtons.forEach((otherButton) => {
      const otherPanel = otherButton.nextElementSibling;
      otherButton.setAttribute("aria-expanded", "false");

      if (otherPanel) {
        otherPanel.style.maxHeight = null;
      }
    });

    if (expanded || !panel) {
      return;
    }

    button.setAttribute("aria-expanded", "true");
    panel.style.maxHeight = `${panel.scrollHeight}px`;
  });
});

mediaTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const targetId = tab.dataset.target;

    mediaTabs.forEach((item) => {
      item.classList.remove("is-active");
    });

    mediaPanels.forEach((panel) => {
      panel.hidden = true;
      panel.classList.remove("is-active");
    });

    tab.classList.add("is-active");

    const nextPanel = document.getElementById(targetId);

    if (nextPanel) {
      nextPanel.hidden = false;
      nextPanel.classList.add("is-active");
    }
  });
});

if (interactiveMountain && climbers.length) {
  interactiveMountain.addEventListener("pointerleave", () => {
    if (tooltip) {
      tooltip.classList.remove("is-visible");
    }
  });

  climbers.forEach((climber) => {
    climber.addEventListener("pointerenter", () => {
      if (tooltip) {
        tooltip.textContent = climber.dataset.label || "Votre ascension";
        tooltip.classList.add("is-visible");
      }
    });

    climber.addEventListener("pointerleave", () => {
      if (tooltip) {
        tooltip.classList.remove("is-visible");
      }
    });
  });
}


if (contactForm && formNote) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(contactForm);
    const fullName = data.get("fullName")?.toString().trim() || "";
    const birthDate = data.get("birthDate")?.toString().trim() || "";
    const username = data.get("username")?.toString().trim() || "";
    const email = data.get("email")?.toString().trim() || "";
    const company = data.get("company")?.toString().trim() || "";
    const country = data.get("country")?.toString().trim() || "";
    const language = data.get("language")?.toString().trim() || "";
    const request = data.get("request")?.toString().trim() || "";
    const message = data.get("message")?.toString().trim() || "";
    const newsletter = data.get("newsletter") ? "Oui" : "Non";
    const files = data.getAll("files").filter(Boolean);

    const subject = encodeURIComponent(
      `Inscription Zero Limit Agency - ${fullName}`.trim()
    );

    const body = encodeURIComponent(
      [
        "Bonjour Zero Limit Agency,",
        "",
        `Nom et pr\u00E9nom : ${fullName}`,
        `Date de naissance : ${birthDate}`,
        `Pseudo : ${username}`,
        `Email : ${email}`,
        `Soci\u00E9t\u00E9 : ${company}`,
        `Pays : ${country}`,
        `Langue principale : ${language}`,
        `Demande : ${request}`,
        `Newsletter : ${newsletter}`,
        "",
        "Message :",
        message,
        "",
        files.length
          ? "Des fichiers ont \u00E9t\u00E9 s\u00E9lectionn\u00E9s dans le formulaire, mais ils doivent \u00EAtre ajout\u00E9s manuellement \u00E0 l'email."
          : "Aucun fichier ajout\u00E9."
      ].join("\n")
    );

    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    formNote.textContent =
      "Votre application mail devrait s'ouvrir avec un message pr\u00E9-rempli. Les fichiers devront \u00EAtre ajout\u00E9s manuellement.";
  });
}
