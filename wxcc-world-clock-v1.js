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
          .root { box-sizing:border-box; width:100%; padding:14px; }
          .heading { margin:0 0 12px; font-size:16px; font-weight:600; }
          .grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
          .card { min-width:0; box-sizing:border-box; padding:14px; border:1px solid var(--wxcc-clock-border,#d1d5db); border-radius:10px; background:var(--wxcc-clock-bg,rgba(127,127,127,.07)); }
          .city { font-size:13px; font-weight:600; opacity:.82; }
          .time { margin:7px 0 3px; font-size:clamp(22px,3vw,30px); line-height:1.15; font-weight:700; font-variant-numeric:tabular-nums; letter-spacing:-.5px; }
          .date { font-size:12px; opacity:.75; }
          .zone { margin-top:7px; font-size:11px; opacity:.65; }
          @media(max-width:600px) { .grid { grid-template-columns:1fr; } }
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