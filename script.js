(function () {
  "use strict";

  // Data alvo: 1 de julho de 2027, às 18h00 (hora local)
  const TARGET_DATE = new Date(2027, 6, 1, 18, 0, 0); // mês 6 = julho

  const elements = {
    weeks: document.getElementById("weeks"),
    days: document.getElementById("days"),
    hours: document.getElementById("hours"),
    minutes: document.getElementById("minutes"),
    seconds: document.getElementById("seconds"),
    message: document.getElementById("message"),
  };

  function pad(value) {
    return String(Math.max(0, value)).padStart(2, "0");
  }

  function render(remainingMs) {
    if (remainingMs <= 0) {
      elements.weeks.textContent = "00";
      elements.days.textContent = "00";
      elements.hours.textContent = "00";
      elements.minutes.textContent = "00";
      elements.seconds.textContent = "00";
      elements.message.textContent = "É hoje! Bem-vindo à Feira do Alvarinho 🍷";
      return;
    }

    const totalSeconds = Math.floor(remainingMs / 1000);

    const WK = 7 * 24 * 60 * 60;
    const DAY = 24 * 60 * 60;
    const HR = 60 * 60;
    const MIN = 60;

    const weeks = Math.floor(totalSeconds / WK);
    const days = Math.floor((totalSeconds % WK) / DAY);
    const hours = Math.floor((totalSeconds % DAY) / HR);
    const minutes = Math.floor((totalSeconds % HR) / MIN);
    const seconds = totalSeconds % MIN;

    elements.weeks.textContent = pad(weeks);
    elements.days.textContent = pad(days);
    elements.hours.textContent = pad(hours);
    elements.minutes.textContent = pad(minutes);
    elements.seconds.textContent = pad(seconds);
  }

  function tick() {
    const now = new Date();
    const remaining = TARGET_DATE - now;
    render(remaining);

    if (remaining <= 0) {
      clearInterval(timerId);
    }
  }

  tick();
  const timerId = setInterval(tick, 1000);
})();