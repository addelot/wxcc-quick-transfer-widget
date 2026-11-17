(function () {
  "use strict";

  const TAG = "wxcc-agent-home-v1";
  if (customElements.get(TAG)) return;

  class AgentHomeV1 extends HTMLElement {
    constructor() {
      super();
      this.timer = null;
      this.shadow = this.attachShadow({ mode: "open" });
      this.shadow.innerHTML = `
        <style>
          :host { display:block; width:100%; color:var(--wxcc-home-text, #172033); font-family:inherit; }
          * { box-sizing:border-box; }
          .page { padding:20px 24px 28px; max-width:1440px; margin:0 auto; }
          .welcome { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; margin-bottom:22px; }
          h1 { font-size:24px; line-height:1.25; margin:0 0 6px; font-weight:700; }
          .subtitle { color:var(--wxcc-home-muted, #64748b); font-size:14px; margin:0; }
          .today { color:var(--wxcc-home-muted, #64748b); font-size:13px; white-space:nowrap; padding-top:6px; }
          .section-title { font-size:15px; font-weight:700; margin:0 0 12px; }
          .clocks { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:24px; }
          .clock { background:var(--wxcc-home-card, #fff); border:1px solid var(--wxcc-home-border, #dbe2ea); border-radius:12px; padding:17px 18px; min-width:0; }
          .city { font-size:13px; color:var(--wxcc-home-muted, #64748b); font-weight:600; margin-bottom:8px; }
          .time { font-size:27px; font-weight:700; letter-spacing:.02em; font-variant-numeric:tabular-nums; }
          .zone { font-size:12px; color:var(--wxcc-home-muted, #64748b); margin-top:5px; }
          .columns { display:grid; grid-template-columns:minmax(0,1.4fr) minmax(280px,1fr); gap:16px; }
          .panel { background:var(--wxcc-home-card, #fff); border:1px solid var(--wxcc-home-border, #dbe2ea); border-radius:12px; padding:18px; }
          .item { padding:12px 0; border-top:1px solid var(--wxcc-home-border, #e5eaf0); }
          .item:first-of-type { border-top:0; padding-top:2px; }
          .item strong { display:block; font-size:13px; margin-bottom:4px; }
          .item p { margin:0; font-size:13px; line-height:1.5; color:var(--wxcc-home-muted, #64748b); }
          .note { border-left:3px solid #64748b; padding:10px 12px; background:var(--wxcc-home-soft, #f3f6fa); border-radius:0 8px 8px 0; font-size:13px; line-height:1.5; color:var(--wxcc-home-muted, #475569); }
          .footer { color:var(--wxcc-home-muted, #94a3b8); font-size:11px; margin-top:18px; }
          @media(max-width:850px) { .clocks { grid-template-columns:1fr; } .columns { grid-template-columns:1fr; } .welcome { display:block; } .today { margin-top:10px; } }
        </style>
        <main class="page">
          <header class="welcome">
            <div>
              <h1>Welcome to Axis Contact Center</h1>
              <p class="subtitle">Your workspace for the day. Keep the essentials close and stay connected.</p>
            </div>
            <div class="today" id="today" aria-live="off"></div>
          </header>

          <section aria-label="World clocks">
            <h2 class="section-title">Team time zones</h2>
            <div class="clocks" id="clocks">
              <article class="clock"><div class="city">Lund · Sweden</div><div class="time">--:--:--</div></article>
              <article class="clock"><div class="city">Chelmsford · Massachusetts, USA</div><div class="time">--:--:--</div></article>
              <article class="clock"><div class="city">Tokyo · Japan</div><div class="time">--:--:--</div></article>
            </div>
          </section>

          <div class="columns">
            <section class="panel">
              <h2 class="section-title">Start-of-shift checklist</h2>
              <div class="item"><strong>1. Check your workspace</strong><p>Confirm your headset, microphone and network connection are working before handling interactions.</p></div>
              <div class="item"><strong>2. Review team updates</strong><p>Check the latest announcements and any operational guidance from your supervisor.</p></div>
              <div class="item"><strong>3. Know your escalation route</strong><p>Keep the current escalation and handover procedures available when you need support.</p></div>
            </section>

            <section class="panel">
              <h2 class="section-title">Operational information</h2>
              <div class="note">Use your approved team channel or knowledge base for current business hours, holiday coverage, service notices and procedure updates.</div>
              <div class="item"><strong>Need assistance?</strong><p>Contact your team leader or the designated support channel if you experience a desktop, telephony or customer interaction issue.</p></div>
              <div class="item"><strong>Quick Transfer</strong><p>Your Quick Transfer tools remain available in the Quick Transfer tab below the interaction workspace.</p></div>
            </section>
          </div>
          <div class="footer">Times update automatically and follow daylight-saving changes for each location.</div>
        </main>`;
    }

    connectedCallback() {
      this.updateClocks();
      this.timer = setInterval(() => this.updateClocks(), 1000);
    }

    disconnectedCallback() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }

    updateClocks() {
      const now = new Date();
      const date = new Intl.DateTimeFormat("en-GB", {
        weekday:"long", day:"numeric", month:"long", year:"numeric"
      }).format(now);
      this.shadow.getElementById("today").textContent = date;

      const locations = [
        { city:"Lund · Sweden", zone:"Europe/Stockholm" },
        { city:"Chelmsford · Massachusetts, USA", zone:"America/New_York" },
        { city:"Tokyo · Japan", zone:"Asia/Tokyo" }
      ];
      const container = this.shadow.getElementById("clocks");
      container.replaceChildren();
      locations.forEach(location => {
        const card = document.createElement("article");
        card.className = "clock";
        const city = document.createElement("div");
        city.className = "city";
        city.textContent = location.city;
        const time = document.createElement("div");
        time.className = "time";
        time.textContent = new Intl.DateTimeFormat("en-GB", {
          timeZone:location.zone, hour:"2-digit", minute:"2-digit",
          second:"2-digit", hourCycle:"h23"
        }).format(now);
        const zone = document.createElement("div");
        zone.className = "zone";
        zone.textContent = new Intl.DateTimeFormat("en-US", {
          timeZone:location.zone, timeZoneName:"long"
        }).formatToParts(now).find(part => part.type === "timeZoneName")?.value || location.zone;
        card.append(city, time, zone);
        container.appendChild(card);
      });
    }
  }

  customElements.define(TAG, AgentHomeV1);
})();