
(function () {
  "use strict";

  const TAG = "wxcc-mini-browser-v2";
  const LOG = "[WXCC Mini Browser]";

  if (customElements.get(TAG)) {
    console.log(LOG, "Already registered.");
    return;
  }

  class WxccMiniBrowser extends HTMLElement {
    constructor() {
      super();

      this.homeUrl = "https://www.google.com";
      this.currentUrl = this.homeUrl;
      this.storageKey = "wxcc-mini-browser-v2";
      this.favorites = [];
      this.savedLastUrl = "";
      this.history = [];
      this.historyIndex = -1;

      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100%;
            height: 100%;
            min-height: 420px;
            box-sizing: border-box;
            font-family: inherit;
            color: var(--wxc-theme-text-primary, #172033);
          }

          * { box-sizing: border-box; }

          .browser {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            min-height: 420px;
            overflow: hidden;
            background: #fff;
            border: 1px solid #d9e0e8;
            border-radius: 10px;
          }

          .toolbar {
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 9px;
            background: #f5f7fa;
            border-bottom: 1px solid #d9e0e8;
          }

          button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            min-width: 34px;
            height: 34px;
            padding: 0 10px;
            border: 1px solid #d1d9e2;
            border-radius: 7px;
            background: #fff;
            color: #253247;
            font-size: 13px;
            cursor: pointer;
          }

          button:hover { background: #eaf0f6; }
          button:disabled { opacity: .4; cursor: default; }

          .addressForm {
            display: flex;
            align-items: center;
            flex: 1 1 auto;
            min-width: 80px;
            gap: 6px;
          }

          .address {
            width: 100%;
            min-width: 0;
            height: 36px;
            padding: 0 12px;
            border: 1px solid #cbd5e1;
            border-radius: 18px;
            outline: none;
            background: #fff;
            color: #172033;
            font-size: 13px;
          }

          .address:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 2px rgba(37,99,235,.12);
          }

          .favoritesBar {
            display: flex;
            align-items: center;
            gap: 7px;
            flex-wrap: wrap;
            padding: 7px 9px;
            background: #fff;
            border-bottom: 1px solid #e2e8f0;
          }

          .favoritesLabel {
            color: #64748b;
            font-size: 11px;
            font-weight: 600;
            margin-right: 2px;
          }

          .favoriteList {
            display: flex;
            align-items: center;
            flex: 1 1 180px;
            gap: 6px;
            flex-wrap: wrap;
          }

          .favoriteItem {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            min-width: 0;
          }

          .favoriteOpen {
            max-width: 180px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .favoriteRemove {
            min-width: 22px;
            width: 22px;
            height: 26px;
            padding: 0;
            color: #64748b;
          }

          .status {
            min-height: 28px;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 12px;
            color: #64748b;
            background: #fff;
            border-bottom: 1px solid #e2e8f0;
            font-size: 11px;
          }

          .statusText {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .openLink {
            margin-left: auto;
            color: #1d4ed8;
            font-weight: 600;
            white-space: nowrap;
            cursor: pointer;
          }

          iframe {
            display: block;
            flex: 1 1 auto;
            width: 100%;
            min-height: 300px;
            border: 0;
            background: #fff;
          }

          .hint {
            padding: 7px 12px;
            color: #64748b;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
          }

          @media (max-width: 600px) {
            .toolbar { gap: 4px; padding: 6px; }
            button { min-width: 30px; padding: 0 7px; }
            .hint { display: none; }
          }
        </style>

        <div class="browser">
          <div class="toolbar">
            <button id="back" type="button" title="Back">←</button>
            <button id="forward" type="button" title="Forward">→</button>
            <button id="reload" type="button" title="Reload">↻</button>
            <button id="home" type="button" title="Home">⌂</button>

            <form class="addressForm" id="addressForm">
              <input
                class="address"
                id="address"
                type="text"
                spellcheck="false"
                autocomplete="off"
                placeholder="Enter a website address or search Google"
                aria-label="Website address"
              />
              <button type="submit">Go</button>
            </form>

            <button id="openTab" type="button"
              title="Open current page in a new tab">↗</button>
          </div>

          <div class="favoritesBar">
            <span class="favoritesLabel">FAVORITES</span>
            <div id="favoriteList" class="favoriteList"></div>
            <button id="addFavorite" type="button">
              ☆ Save page
            </button>
          </div>

          <div class="status">
            <span id="statusText" class="statusText">Ready</span>
            <span id="openLink" class="openLink"
              role="button" tabindex="0">Open in new tab</span>
          </div>

          <iframe
            id="frame"
            title="Mini Browser"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="clipboard-read; clipboard-write; fullscreen"
          ></iframe>

          <div class="hint">
            Some websites block embedded browsing.
            Use ↗ or "Open in new tab" if a site refuses to load.
          </div>
        </div>
      `;
    }

    connectedCallback() {
      this.readProperties();
      this.loadSavedData();

      this.frame = this.shadowRoot.getElementById("frame");
      this.address = this.shadowRoot.getElementById("address");
      this.statusText = this.shadowRoot.getElementById("statusText");

      this.shadowRoot.getElementById("addressForm")
        .addEventListener("submit", (event) => {
          event.preventDefault();
          this.navigateFromInput(this.address.value);
        });

      this.shadowRoot.getElementById("back")
        .addEventListener("click", () => this.goBack());

      this.shadowRoot.getElementById("forward")
        .addEventListener("click", () => this.goForward());

      this.shadowRoot.getElementById("reload")
        .addEventListener("click", () => this.reload());

      this.shadowRoot.getElementById("home")
        .addEventListener("click", () => this.navigate(this.homeUrl));

      this.shadowRoot.getElementById("openTab")
        .addEventListener("click", () => this.openCurrentInNewTab());

      this.shadowRoot.getElementById("addFavorite")
        .addEventListener("click", () => this.addFavorite());

      const openLink = this.shadowRoot.getElementById("openLink");

      openLink.addEventListener("click", () => this.openCurrentInNewTab());

      openLink.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.openCurrentInNewTab();
        }
      });

      this.frame.addEventListener("load", () => {
        this.statusText.textContent =
          "Page loaded (if the website permits embedding)";
      });

      const startUrl = this.savedLastUrl || this.homeUrl;

      this.navigate(startUrl, true);
      this.renderFavorites();
    }

    loadSavedData() {
      try {
        const saved = JSON.parse(
          window.localStorage.getItem(this.storageKey) || "{}"
        );

        this.favorites = Array.isArray(saved.favorites)
          ? saved.favorites : [];

        this.savedLastUrl =
          typeof saved.lastUrl === "string" ? saved.lastUrl : "";

      } catch (error) {
        this.favorites = [];
        this.savedLastUrl = "";

        console.warn(
          LOG,
          "Could not read saved browser data.",
          error
        );
      }
    }

    saveSavedData() {
      try {
        window.localStorage.setItem(
          this.storageKey,
          JSON.stringify({
            favorites: this.favorites,
            lastUrl: this.currentUrl ||
              this.savedLastUrl ||
              this.homeUrl
          })
        );

      } catch (error) {
        if (this.statusText) {
          this.statusText.textContent =
            "Browser storage unavailable; saved pages may not persist";
        }

        console.warn(
          LOG,
          "Could not save browser data.",
          error
        );
      }
    }

    addFavorite() {
      if (!this.currentUrl) return;

      const existing = this.favorites.find(
        item => item.url === this.currentUrl
      );

      if (existing) {
        this.statusText.textContent =
          "This page is already in Favorites";
        return;
      }

      const suggestedName = (() => {
        try {
          return new URL(this.currentUrl).hostname;
        } catch (_) {
          return this.currentUrl;
        }
      })();

      const name = window.prompt(
        "Name this favorite:",
        suggestedName
      );

      if (name === null) return;

      const cleanName = name.trim();

      if (!cleanName) {
        this.statusText.textContent =
          "Favorite was not saved: enter a name";
        return;
      }

      this.favorites.push({
        name: cleanName,
        url: this.currentUrl
      });

      this.saveSavedData();
      this.renderFavorites();

      this.statusText.textContent = "Saved to Favorites";
    }

    removeFavorite(url) {
      this.favorites = this.favorites.filter(
        item => item.url !== url
      );

      this.saveSavedData();
      this.renderFavorites();
    }

    renderFavorites() {
      const list = this.shadowRoot.getElementById("favoriteList");

      if (!list) return;

      list.replaceChildren();

      if (!this.favorites.length) {
        const empty = document.createElement("span");
        empty.textContent = "No saved pages yet";
        empty.style.cssText =
          "color:#94a3b8;font-size:11px;";

        list.appendChild(empty);
        return;
      }

      this.favorites.forEach(item => {
        const group = document.createElement("span");
        group.className = "favoriteItem";

        const open = document.createElement("button");
        open.type = "button";
        open.className = "favoriteOpen";
        open.textContent = item.name;
        open.title = item.url;

        open.addEventListener("click", () => {
          this.navigate(item.url);
        });

        group.appendChild(open);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "favoriteRemove";
        remove.textContent = "×";
        remove.title = "Remove " + item.name;
        remove.setAttribute(
          "aria-label",
          "Remove " + item.name
        );

        remove.addEventListener("click", () => {
          this.removeFavorite(item.url);
        });

        group.appendChild(remove);
        list.appendChild(group);
      });
    }

    readProperties() {
      const propHome = this.homeUrl ||
        this.getAttribute("homeUrl");

      if (propHome && typeof propHome === "string") {
        this.homeUrl = propHome;
      }

      const title = this.title ||
        this.getAttribute("title");

      if (title) {
        this.setAttribute("aria-label", title);
      }
    }

    normalizeInput(value) {
      const input = String(value || "").trim();

      if (!input) return null;

      if (/^https?:\/\//i.test(input)) {
        return input;
      }

      if (/^(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?(\/.*)?$/i.test(input)) {
        return "https://" + input;
      }

      return "https://www.google.com/search?q=" +
        encodeURIComponent(input);
    }

    navigateFromInput(value) {
      const url = this.normalizeInput(value);

      if (!url) return;

      this.navigate(url);
    }

    navigate(url, replace) {
      let safeUrl;

      try {
        safeUrl = new URL(url);
      } catch (error) {
        this.statusText.textContent = "Invalid address";
        return;
      }

      if (!["http:", "https:"].includes(safeUrl.protocol)) {
        this.statusText.textContent =
          "Only HTTP and HTTPS websites are supported";
        return;
      }

      const finalUrl = safeUrl.href;

      if (replace && this.historyIndex >= 0) {
        this.history[this.historyIndex] = finalUrl;
      } else {
        this.history = this.history.slice(
          0,
          this.historyIndex + 1
        );

        this.history.push(finalUrl);
        this.historyIndex = this.history.length - 1;
      }

      this.currentUrl = finalUrl;
      this.savedLastUrl = finalUrl;
      this.address.value = finalUrl;

      this.saveSavedData();

      this.statusText.textContent =
        "Loading " + safeUrl.hostname + "…";

      this.frame.src = finalUrl;

      this.updateButtons();
    }

    goBack() {
      if (this.historyIndex <= 0) return;

      this.historyIndex -= 1;
      this.loadHistoryEntry();
    }

    goForward() {
      if (this.historyIndex >= this.history.length - 1) return;

      this.historyIndex += 1;
      this.loadHistoryEntry();
    }

    loadHistoryEntry() {
      this.currentUrl = this.history[this.historyIndex];
      this.savedLastUrl = this.currentUrl;
      this.address.value = this.currentUrl;

      this.saveSavedData();

      this.statusText.textContent = "Loading…";
      this.frame.src = this.currentUrl;

      this.updateButtons();
    }

    reload() {
      if (!this.currentUrl) return;

      this.statusText.textContent = "Reloading…";

      try {
        this.frame.contentWindow.location.reload();
      } catch (error) {
        this.frame.src = this.currentUrl;
      }
    }

    openCurrentInNewTab() {
      if (!this.currentUrl) return;

      window.open(
        this.currentUrl,
        "_blank",
        "noopener,noreferrer"
      );
    }

    updateButtons() {
      this.shadowRoot.getElementById("back").disabled =
        this.historyIndex <= 0;

      this.shadowRoot.getElementById("forward").disabled =
        this.historyIndex >= this.history.length - 1;
    }
  }

  customElements.define(TAG, WxccMiniBrowser);

  console.log(LOG, "Custom element registered.");
})();
