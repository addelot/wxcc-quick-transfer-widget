
/* Atea Webex Contact Center Wallboard embed widget */
class WxccAteaWallboardV1 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;

    const url = this.getAttribute('dashboard-url') || '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 800px;
          box-sizing: border-box;
        }

        .frame-wrap {
          width: 100%;
          height: 100%;
          min-height: 800px;
          overflow: hidden;
          background: #fff;
          border-radius: 8px;
        }

        iframe {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 800px;
          border: 0;
          background: #fff;
        }
      </style>

      <div class="frame-wrap">
        <iframe
          title="Atea Webex Contact Center Wallboard"
          src="${this.escapeAttribute(url)}"
          loading="eager"
          allow="fullscreen">
        </iframe>
      </div>
    `;
  }

  escapeAttribute(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

if (!customElements.get('wxcc-atea-wallboard-v1')) {
  customElements.define(
    'wxcc-atea-wallboard-v1',
    WxccAteaWallboardV1
  );
}
