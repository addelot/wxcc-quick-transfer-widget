(function () {
  "use strict";

  const TAG = "wxcc-world-clock-v1";
  if (customElements.get(TAG)) return;

  class WorldClockV1 extends HTMLElement {
    constructor() {
      super();
      this.timer = null;
      this.shadow = this.attachShadow({ mode: "open" });
      this.shadow.innerHTML = `
        <style>
          :host { display:block; width:100%; box-sizing:border-box; font-family:inherit; color:var(--wxcc-clock-text, inherit); }
          :host { width:auto; max-width:100%; }
          .root { box-sizing:border-box; width:auto; padding:0 10px; }
          .heading { display:none; }
          .grid { display:flex; flex-direction:row; align-items:center; gap:16px; white-space:nowrap; }
          .card { display:flex; align-items:baseline; gap:6px; min-width:0; box-sizing:border-box; padding:0; border:0; border-radius:0; background:transparent; }
          .city { font-size:11px; font-weight:600; opacity:.78; }
          .time { margin:0; font-size:14px; line-height:1.2; font-weight:700; font-variant-numeric:tabular-nums; letter-spacing:0; }
          .date, .zone { display:none; }
          @media(max-width:760px) { .grid { gap:8px; } .city { font-size:10px; } .time { font-size:12px; } }
        </style>
        <section class="root" aria-label="World clock">
          <div class="heading">World Clock</div>
          <div class="grid" id="clocks"></div>
        </section>`;
    }

    connectedCallback() {
      this.renderClocks();
      this.timer = setInterval(() => this.renderClocks(), 1000);
    }

    disconnectedCallback() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }

    renderClocks() {
      const container = this.shadow.getElementById("clocks");
      const now = new Date();
      const locations = [
        { city:"Lund", country:"Sweden", zone:"Europe/Stockholm" },
        { city:"Chelmsford", country:"United Kingdom", zone:"Europe/London" },
        { city:"Tokyo", country:"Japan", zone:"Asia/Tokyo" }
      ];
      const fmt = (zone, options) => new Intl.DateTimeFormat("en-GB", { timeZone:zone, ...options });
      const stockholmOffset = this.utcOffsetMinutes("Europe/Stockholm", now);
      container.replaceChildren();

      locations.forEach(location => {
        const card = document.createElement("article");
        card.className = "card";

        const city = document.createElement("div");
        city.className = "city";
        city.textContent = location.city + " · " + location.country;

        const time = document.createElement("div");
        time.className = "time";
        time.textContent = fmt(location.zone, {
          hour:"2-digit", minute:"2-digit", second:"2-digit", hourCycle:"h23"
        }).format(now);

        const date = document.createElement("div");
        date.className = "date";
        date.textContent = fmt(location.zone, {
          weekday:"long", day:"2-digit", month:"short", year:"numeric"
        }).format(now);

        const zone = document.createElement("div");
        zone.className = "zone";
        const zoneName = fmt(location.zone, { timeZoneName:"short" })
          .formatToParts(now).find(part => part.type === "timeZoneName")?.value || location.zone;
        const difference = (this.utcOffsetMinutes(location.zone, now) - stockholmOffset) / 60;
        const diffText = difference === 0 ? "Same time as Lund" :
          (difference > 0 ? "+" : "") + difference + "h vs Lund";
        zone.textContent = zoneName + " · " + diffText;

        card.append(city, time, date, zone);
        container.appendChild(card);
      });
    }

    utcOffsetMinutes(timeZone, date) {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone, hourCycle:"h23",
        year:"numeric", month:"2-digit", day:"2-digit",
        hour:"2-digit", minute:"2-digit", second:"2-digit"
      }).formatToParts(date);
      const values = {};
      parts.forEach(part => {
        if (part.type !== "literal") values[part.type] = Number(part.value);
      });
      const asUtc = Date.UTC(values.year, values.month - 1, values.day,
        values.hour, values.minute, values.second);
      return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
    }
  }

  customElements.define(TAG, WorldClockV1);
})();