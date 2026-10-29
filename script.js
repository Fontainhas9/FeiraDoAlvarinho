(function () {
  "use strict";

  // =========================================================
  // CONFIGURAÇÃO
  // =========================================================
  const TARGET_DATE = new Date("2027-07-01T18:00:00+01:00");

  const EVENT = {
    title: "Feira do Alvarinho de Monção 2027",
    start: TARGET_DATE,
    end: new Date("2027-07-04T23:59:00+01:00"),
    location: "Parque das Caldas, Monção, Portugal",
    description:
      "A maior Wine Party de Portugal. 1 a 4 de julho de 2027, no Parque das Caldas em Monção. " +
      "Música, gastronomia, Alvarinho e muita festa. Mais informações em feiradoalvarinho.cm-moncao.pt",
    url: "https://feiradoalvarinho.cm-moncao.pt",
  };

  const SELECTORS = {
    weeks: "weeks",
    days: "days",
    hours: "hours",
    minutes: "minutes",
    seconds: "seconds",
    message: "message",
    srStatus: "sr-status",
  };

  const UNITS = {
    WK: 7 * 24 * 60 * 60,
    DAY: 24 * 60 * 60,
    HR: 60 * 60,
    MIN: 60,
  };

  // =========================================================
  // DETEÇÃO DE SISTEMA OPERATIVO
  // =========================================================
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(navigator.userAgent);

  // =========================================================
  // HELPERS
  // =========================================================
  function pad(value) {
    return String(Math.max(0, value)).padStart(2, "0");
  }

  // =========================================================
  // CALENDAR (gera .ics no desktop)
  // =========================================================
  const Calendar = {
    toICSDate(date) {
      const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return (
        d.getUTCFullYear() +
        pad(d.getUTCMonth() + 1) +
        pad(d.getUTCDate()) +
        "T" +
        pad(d.getUTCHours()) +
        pad(d.getUTCMinutes()) +
        pad(d.getUTCSeconds()) +
        "Z"
      );
    },

    escape(text) {
      return String(text)
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\r?\n/g, "\\n");
    },

    fold(line) {
      if (line.length <= 75) return line;
      const chunks = [line.slice(0, 75)];
      let rest = line.slice(75);
      while (rest.length > 0) {
        chunks.push(" " + rest.slice(0, 74));
        rest = rest.slice(74);
      }
      return chunks.join("\r\n");
    },

    build() {
      const uid = "feira-alvarinho-2027-" + EVENT.start.getTime() + "@cm-moncao.pt";
      const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Feira do Alvarinho//Countdown//PT",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        "UID:" + uid,
        "DTSTAMP:" + this.toICSDate(new Date()),
        "DTSTART:" + this.toICSDate(EVENT.start),
        "DTEND:" + this.toICSDate(EVENT.end),
        "SUMMARY:" + this.escape(EVENT.title),
        "LOCATION:" + this.escape(EVENT.location),
        "DESCRIPTION:" + this.escape(EVENT.description),
        "URL:" + this.escape(EVENT.url),
        "STATUS:CONFIRMED",
        "END:VEVENT",
        "END:VCALENDAR",
      ];
      return lines.map(this.fold.bind(this)).join("\r\n");
    },

    download() {
      try {
        const content = this.build();
        const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "feira-alvarinho-moncao-2027.ics";
        link.rel = "noopener";
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return true;
      } catch (err) {
        console.error("[Calendar] Erro ao descarregar .ics:", err);
        return false;
      }
    },
  };

  // =========================================================
  // GOOGLE CALENDAR LINK
  // =========================================================
  function buildGoogleCalendarUrl() {
    const start = EVENT.start.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const end = EVENT.end.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: EVENT.title,
      dates: `${start}/${end}`,
      details: EVENT.description,
      location: EVENT.location,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  // =========================================================
  // WEEK NOTIFIER (popup semanal)
  // =========================================================
  const WeekNotifier = {
    STORAGE_KEY: "alvarinho_2027_last_week_notified",
    els: {},
    lastFocus: null,

    init() {
      this.els.modal = document.getElementById("week-modal");
      this.els.close = document.getElementById("week-modal-close");
      this.els.dismiss = document.getElementById("week-modal-dismiss");
      this.els.add = document.getElementById("week-modal-add");
      this.els.count = document.getElementById("week-modal-count");

      if (!this.els.modal) return;

      this.els.close?.addEventListener("click", () => this.close());
      this.els.dismiss?.addEventListener("click", () => this.close());

      this.els.add?.addEventListener("click", () => {
        // Lógica inteligente baseada no sistema operativo
        if (isIOS) {
          window.location.href = "feira-alvarinho-2027.ics";
        } else if (isAndroid) {
          window.open(buildGoogleCalendarUrl(), "_blank", "noopener");
        } else {
          Calendar.download(); // Fallback desktop
        }
        this.close();
      });

      this.els.modal.addEventListener("click", (e) => {
        if (e.target === this.els.modal) this.close();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.isOpen()) this.close();
      });
    },

    isOpen() {
      return this.els.modal?.classList.contains("is-open");
    },

    open(weeksLeft) {
      if (!this.els.modal || !this.els.count) return;
      this.els.count.textContent = String(weeksLeft);
      this.lastFocus = document.activeElement;
      this.els.modal.classList.add("is-open");
      this.els.modal.setAttribute("aria-hidden", "false");
      setTimeout(() => this.els.add?.focus(), 100);
    },

    close() {
      if (!this.els.modal) return;
      this.els.modal.classList.remove("is-open");
      this.els.modal.setAttribute("aria-hidden", "true");
      if (this.lastFocus && typeof this.lastFocus.focus === "function") {
        this.lastFocus.focus();
        this.lastFocus = null;
      }
    },

    getLastNotified() {
      try {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        return raw === null ? null : parseInt(raw, 10);
      } catch (_) {
        return null;
      }
    },

    setLastNotified(weeks) {
      try {
        localStorage.setItem(this.STORAGE_KEY, String(weeks));
      } catch (_) {}
    },

    maybeNotify(weeksLeft) {
      if (weeksLeft <= 0) return;
      const last = this.getLastNotified();

      if (last === null) {
        this.setLastNotified(weeksLeft);
        return;
      }

      if (weeksLeft < last) {
        this.setLastNotified(weeksLeft);
        this.open(weeksLeft);
      }
    },
  };

  // =========================================================
  // COUNTDOWN
  // =========================================================
  const Countdown = {
    els: {},
    timeoutId: null,
    lastSrMinute: -1,
    finished: false,

    init() {
      Object.entries(SELECTORS).forEach(([key, id]) => {
        this.els[key] = document.getElementById(id);
      });

      if (!this.els.weeks || !this.els.days) {
        console.warn("[Countdown] Elementos essenciais não encontrados.");
        return;
      }

      this.tick();

      if (!this.finished) {
        this.scheduleTick();
        this.bindVisibility();
      }
    },

    scheduleTick() {
      const now = Date.now();
      const msToNextSecond = 1000 - (now % 1000);
      this.timeoutId = setTimeout(() => {
        this.tick();
        if (!this.finished) this.scheduleTick();
      }, msToNextSecond);
    },

    bindVisibility() {
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.stop();
        } else {
          this.tick();
          if (!this.finished && !this.timeoutId) {
            this.scheduleTick();
          }
        }
      });
      window.addEventListener("pagehide", () => this.stop());
    },

    stop() {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
    },

    tick() {
      const now = Date.now();
      const remaining = TARGET_DATE.getTime() - now;
      this.render(remaining);
    },

    render(remainingMs) {
      if (remainingMs <= 0) {
        this.finished = true;
        this.stop();
        this.setNumber(this.els.weeks, 0);
        this.setNumber(this.els.days, 0);
        this.setNumber(this.els.hours, 0);
        this.setNumber(this.els.minutes, 0);
        this.setNumber(this.els.seconds, 0);
        if (this.els.message) {
          this.els.message.textContent = "É hoje! Bem-vindo à Feira do Alvarinho 🍷";
        }
        if (this.els.srStatus) {
          this.els.srStatus.textContent = "A Feira do Alvarinho começou.";
        }
        return;
      }

      const totalSeconds = Math.floor(remainingMs / 1000);
      const weeks   = Math.floor(totalSeconds / UNITS.WK);
      const days    = Math.floor((totalSeconds % UNITS.WK) / UNITS.DAY);
      const hours   = Math.floor((totalSeconds % UNITS.DAY) / UNITS.HR);
      const minutes = Math.floor((totalSeconds % UNITS.HR) / UNITS.MIN);
      const seconds = totalSeconds % UNITS.MIN;

      this.setNumber(this.els.weeks, weeks);
      this.setNumber(this.els.days, days);
      this.setNumber(this.els.hours, hours);
      this.setNumber(this.els.minutes, minutes);
      this.setNumber(this.els.seconds, seconds);

      this.updateSrStatus(totalSeconds);
      WeekNotifier.maybeNotify(weeks);
    },

    setNumber(el, value) {
      if (!el) return;
      const formatted = pad(value);
      if (el.textContent === formatted) return;
      el.textContent = formatted;
      el.classList.remove("changed");
      void el.offsetWidth;
      el.classList.add("changed");
    },

    updateSrStatus(totalSeconds) {
      if (!this.els.srStatus) return;
      const totalMinutes = Math.floor(totalSeconds / 60);
      if (totalMinutes === this.lastSrMinute) return;
      this.lastSrMinute = totalMinutes;

      const weeks = Math.floor(totalSeconds / UNITS.WK);
      const days  = Math.floor((totalSeconds % UNITS.WK) / UNITS.DAY);

      const parts = [];
      if (weeks > 0) parts.push(`${weeks} ${weeks === 1 ? "semana" : "semanas"}`);
      if (days > 0)  parts.push(`${days} ${days === 1 ? "dia" : "dias"}`);

      const texto = parts.length
        ? `Faltam ${parts.join(" e ")} para a Feira do Alvarinho de Monção.`
        : "Falta menos de um dia para a Feira do Alvarinho de Monção.";

      this.els.srStatus.textContent = texto;
    },
  };

  // =========================================================
  // BOTÕES DE CALENDÁRIO (Fora do popup)
  // =========================================================
  function bindCalendarButtons() {
    const urlGoogle = buildGoogleCalendarUrl();

    // Desktop (download)
    const desktopBtn = document.getElementById("add-calendar-desktop");
    if (desktopBtn) {
      desktopBtn.addEventListener("click", () => {
        const ok = Calendar.download();
        if (!ok) return;
        const label = desktopBtn.querySelector("span");
        if (!label) return;
        const original = label.textContent;
        desktopBtn.classList.add("is-confirmed");
        label.textContent = "Descarregado!";
        setTimeout(() => {
          desktopBtn.classList.remove("is-confirmed");
          label.textContent = original;
        }, 2200);
      });
    }

    // Mobile (Google)
    const googleBtn = document.getElementById("add-google-calendar");
    if (googleBtn) {
      googleBtn.addEventListener("click", () => {
        window.open(urlGoogle, "_blank", "noopener");
      });
    }

    // Mobile (Apple)
    const appleBtn = document.getElementById("add-apple-calendar");
    if (appleBtn) {
      appleBtn.addEventListener("click", () => {
        window.location.href = "feira-alvarinho-2027.ics";
      });
    }
  }

  // =========================================================
  // ARRANQUE
  // =========================================================
  function boot() {
    Countdown.init();
    WeekNotifier.init();
    bindCalendarButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();