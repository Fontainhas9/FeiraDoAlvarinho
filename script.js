(function () {
  "use strict";

  // =========================================================
  // CONFIGURAÇÃO
  // =========================================================

  /**
   * Data alvo fixa em Lisboa (UTC+1 no verão).
   * Assim, o countdown termina à mesma hora para todos,
   * independentemente do fuso horário do visitante.
   */
  const TARGET_DATE = new Date("2027-07-01T18:00:00+01:00");

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
  // HELPERS
  // =========================================================
  function pad(value) {
    return String(Math.max(0, value)).padStart(2, "0");
  }

  // =========================================================
  // COUNTDOWN
  // =========================================================
  const Countdown = {
    els: {},
    timerId: null,
    timeoutId: null,
    lastSrMinute: -1,
    finished: false,

    init() {
      // Cache de elementos
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

    /**
     * Agenda o próximo tick sincronizado com o próximo segundo real.
     * Evita "saltos" quando o browser suspende a aba.
     */
    scheduleTick() {
      const now = Date.now();
      const msToNextSecond = 1000 - (now % 1000);

      this.timeoutId = setTimeout(() => {
        this.tick();
        if (!this.finished) this.scheduleTick();
      }, msToNextSecond);
    },

    /**
     * Pausa quando a aba está em segundo plano;
     * retoma (e recalcula imediatamente) quando volta a primeiro plano.
     */
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

      // Garante paragem limpa ao fechar a página
      window.addEventListener("pagehide", () => this.stop());
    },

    stop() {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
    },

    /**
     * Calcula o tempo restante e delega o render.
     */
    tick() {
      const now = Date.now();
      const remaining = TARGET_DATE.getTime() - now;
      this.render(remaining);
    },

    /**
     * Atualiza todos os valores no DOM.
     */
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
    },

    /**
     * Atualiza o número e dispara a animação "changed" apenas quando muda.
     */
    setNumber(el, value) {
      if (!el) return;

      const formatted = pad(value);
      if (el.textContent === formatted) return;

      el.textContent = formatted;

      // Reinicia a animação
      el.classList.remove("changed");
      void el.offsetWidth; // força reflow
      el.classList.add("changed");
    },

    /**
     * Atualiza o texto para leitores de ecrã apenas a cada minuto,
     * para não ser intrusivo.
     */
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
  // ARRANQUE
  // =========================================================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => Countdown.init());
  } else {
    Countdown.init();
  }
})();