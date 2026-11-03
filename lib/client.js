window.__ModuleLoader__.load({
  id: 'dsh-skin-silver-wolf-topic',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    const React = require('react');
    const VERSION = '1.1.1';
    const ATTR = 'data-dsh-silver-wolf';
    const CSS_URL = new URL(`skin-assets/silver-wolf/skin.css?v=${VERSION}`, document.baseURI).href;
    const ASSET_BASE = new URL('skin-assets/silver-wolf/', document.baseURI).href;
    const SETTING_KEY = 'wallpaperWidth';
    const DEFAULT_WIDTH = 760;
    const MIN_WIDTH = 640;
    const MAX_WIDTH = 920;
    const MANAGER_SETTINGS_KEY = 'dsh.skin-settings.v1';
    const MANAGER_SETTINGS_EVENT = 'dsh:skin-setting-change';
    const MANAGER_ACTIVE_KEY = 'dsh.skin-manager.active.v1';
    const MANAGER_API_BASE = new URL('api/skin-manager/', document.baseURI).href;
    const MANAGER_SECTION_ID = 'skins';
    const OFFICIAL_ID = 'official';
    const CUSTOMIZATION_EVENTS = {
      register: 'dsh:skin-customization-register-v2',
      unregister: 'dsh:skin-customization-unregister-v2',
      ready: 'dsh:skin-customization-ready-v2',
    };

    const debug = {
      version: VERSION,
      cssUrl: CSS_URL,
      css: 'loading',
      wallpaper: false,
      wallpaperImage: 'loading',
      customization: false,
      flickerTargets: 0,
      errors: [],
    };
    window.__DSH_SILVER_WOLF__ = debug;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function noteError(message, error) {
      const text = error instanceof Error ? `${message}: ${error.message}` : message;
      debug.errors.push(text);
      console.error(`[silver-wolf] ${text}`);
    }

    function clampWidth(value) {
      if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_WIDTH;
      return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(value / 10) * 10));
    }

    function readActiveSkin() {
      try {
        return window.localStorage.getItem(MANAGER_ACTIVE_KEY) || 'silver-wolf';
      } catch {
        return 'silver-wolf';
      }
    }

    function writeActiveSkin(id) {
      try {
        window.localStorage.setItem(MANAGER_ACTIVE_KEY, id);
      } catch {
        /* localStorage may be disabled; the page still switches for this load. */
      }
    }

    function readWallpaperWidth() {
      try {
        const raw = window.localStorage.getItem(MANAGER_SETTINGS_KEY);
        if (!raw) return DEFAULT_WIDTH;
        const all = JSON.parse(raw);
        const value = all && all['silver-wolf'] ? all['silver-wolf'][SETTING_KEY] : undefined;
        return clampWidth(value);
      } catch {
        return DEFAULT_WIDTH;
      }
    }

    function writeWallpaperWidth(value) {
      const width = clampWidth(value);
      try {
        const raw = window.localStorage.getItem(MANAGER_SETTINGS_KEY);
        const all = raw ? JSON.parse(raw) : {};
        const previous =
          all && typeof all['silver-wolf'] === 'object' && all['silver-wolf'] !== null
            ? all['silver-wolf']
            : {};
        window.localStorage.setItem(
          MANAGER_SETTINGS_KEY,
          JSON.stringify({ ...all, 'silver-wolf': { ...previous, [SETTING_KEY]: width } }),
        );
      } catch {
        /* Keep the visual event even when storage is unavailable. */
      }
      window.dispatchEvent(
        new CustomEvent(MANAGER_SETTINGS_EVENT, {
          detail: { skinId: 'silver-wolf', key: SETTING_KEY, value: width },
        }),
      );
    }

    async function managerRequest(path, options = {}) {
      const response = await fetch(new URL(path.replace(/^\//, ''), MANAGER_API_BASE), {
        cache: 'no-store',
        credentials: 'same-origin',
        ...options,
        headers: {
          ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...(options.headers || {}),
        },
      });
      let data = null;
      try {
        data = await response.json();
      } catch {
        /* The error below is more useful than a JSON parse failure. */
      }
      if (!response.ok) {
        throw new Error((data && data.error) || `皮肤管理请求失败（HTTP ${response.status}）`);
      }
      return data;
    }

    function applyWidth(value) {
      const width = clampWidth(value);
      document.body.style.setProperty('--sw-wallpaper-width', `${width}px`);
      return width;
    }

    /** Read the width written by the original dsh-skin-manager settings page. */
    function readManagerWidth() {
      try {
        const raw = window.localStorage.getItem(MANAGER_SETTINGS_KEY);
        if (!raw) return DEFAULT_WIDTH;
        const all = JSON.parse(raw);
        const value = all && all['silver-wolf'] ? all['silver-wolf'][SETTING_KEY] : undefined;
        return typeof value === 'number' && Number.isFinite(value) ? clampWidth(value) : DEFAULT_WIDTH;
      } catch {
        return DEFAULT_WIDTH;
      }
    }

    /**
     * Inject the real stylesheet as a same-origin <link>. The skin body attr is
     * deliberately set only after load, so a failed request leaves the official
     * UI intact instead of applying half a visual language.
     */
    function installStylesheet(onReady) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = CSS_URL;
      link.dataset.dshSilverWolfCss = '';
      let settled = false;
      let timeout = 0;

      const finish = (ok) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        if (ok) {
          debug.css = 'ready';
          document.documentElement.dataset.dshSilverWolfCss = 'ready';
          onReady();
        } else {
          debug.css = 'error';
          document.documentElement.dataset.dshSilverWolfCss = 'error';
          noteError(`stylesheet failed to load from ${CSS_URL}`);
        }
      };

      link.addEventListener('load', () => finish(true), { once: true });
      link.addEventListener('error', () => finish(false), { once: true });
      document.head.appendChild(link);

      timeout = window.setTimeout(() => {
        if (!settled) {
          debug.css = 'timeout';
          document.documentElement.dataset.dshSilverWolfCss = 'timeout';
          noteError(`stylesheet load timed out for ${CSS_URL}`);
        }
      }, 10000);

      return () => {
        window.clearTimeout(timeout);
        link.remove();
        if (document.documentElement.dataset.dshSilverWolfCss !== undefined) {
          delete document.documentElement.dataset.dshSilverWolfCss;
        }
      };
    }

    function installWallpaper() {
      const frame = document.createElement('div');
      frame.className = 'sw-wallpaper-frame';
      frame.dataset.swWallpaper = '';
      frame.setAttribute('aria-hidden', 'true');

      const image = new Image();
      image.alt = '';
      image.decoding = 'async';
      image.draggable = false;
      image.src = `${ASSET_BASE}assets/silver-wolf-chat.png?v=${VERSION}`;
      image.addEventListener('load', () => {
        debug.wallpaperImage = 'ready';
      });
      image.addEventListener('error', () => {
        debug.wallpaperImage = 'error';
        noteError(`wallpaper failed to load from ${image.src}`);
      });
      frame.appendChild(image);

      let raf = 0;
      const mount = () => {
        const host = document.querySelector('[data-conversation-content]');
        if (host === null) return;
        if (frame.parentElement !== host) host.prepend(frame);
        debug.wallpaper = true;
      };
      const schedule = () => {
        if (raf !== 0) return;
        raf = window.requestAnimationFrame(() => {
          raf = 0;
          mount();
        });
      };

      const observer = new MutationObserver(schedule);
      observer.observe(document.body, { childList: true, subtree: true });
      mount();

      return () => {
        observer.disconnect();
        if (raf !== 0) window.cancelAnimationFrame(raf);
        frame.remove();
        debug.wallpaper = false;
      };
    }

    function installAvatarPins() {
      const PIN = 'sw-avatar-pin';
      let raf = 0;
      const pins = new Set();

      const eligible = (node) => {
        if (!(node instanceof HTMLElement)) return false;
        if (node.tagName === 'IMG') return false;
        if (!node.matches('[class*="_avatar"]')) return false;
        if (node.querySelector(`:scope > .${PIN}`) !== null) return false;
        const box = node.getBoundingClientRect();
        if (box.width < 16 || box.width > 36 || box.height < 16 || box.height > 36) return false;
        return node.closest('[class*="ET65mq_root"], [data-slot="sidebar.settings"], [role="dialog"]') !== null;
      };

      const scan = () => {
        for (const node of document.querySelectorAll('[class*="_avatar"]')) {
          if (!eligible(node)) continue;
          const pin = document.createElement('span');
          pin.className = PIN;
          pin.setAttribute('aria-hidden', 'true');
          node.appendChild(pin);
          pins.add(pin);
        }
      };

      const schedule = () => {
        if (raf !== 0) return;
        raf = window.requestAnimationFrame(() => {
          raf = 0;
          scan();
        });
      };

      const observer = new MutationObserver(schedule);
      observer.observe(document.body, { childList: true, subtree: true });
      scan();

      return () => {
        observer.disconnect();
        if (raf !== 0) window.cancelAnimationFrame(raf);
        for (const pin of pins) pin.remove();
        pins.clear();
      };
    }

    /**
     * Each button gets its own independent 5–60 s one-shot flash. Web Animations
     * gives true randomness; a CSS fallback exists for engines without it.
     * Reduced-motion clears every timer and animation.
     */
    function installFlicker() {
      const entries = new Map();
      let raf = 0;

      const clearEntry = (node) => {
        const entry = entries.get(node);
        if (entry === undefined) return;
        window.clearTimeout(entry.timer);
        if (entry.animation !== null) {
          try {
            entry.animation.cancel();
          } catch {
            /* already finished */
          }
        }
        node.classList.remove('sw-flicker-css');
        node.style.removeProperty('--sw-flicker-duration');
        node.style.removeProperty('--sw-flicker-delay');
        entries.delete(node);
      };

      const schedule = (node) => {
        const entry = entries.get(node);
        if (entry === undefined) return;
        window.clearTimeout(entry.timer);
        entry.timer = window.setTimeout(() => {
          if (!entries.has(node) || !node.isConnected) return;
          if (!reduceMotion.matches) flash(node);
          schedule(node);
        }, 5000 + Math.random() * 55000);
      };

      const flash = (node) => {
        const entry = entries.get(node);
        if (entry === undefined) return;
        if (typeof node.animate !== 'function') {
          const delay = 5000 + Math.random() * 55000;
          node.style.setProperty('--sw-flicker-duration', `${delay}ms`);
          node.style.setProperty('--sw-flicker-delay', '0ms');
          node.classList.add('sw-flicker-css');
          return;
        }
        try {
          entry.animation = node.animate(
            [
              { filter: 'none', offset: 0 },
              { filter: 'brightness(1.45) drop-shadow(0 0 3px rgba(98,230,255,.5))', offset: 0.28 },
              { filter: 'none', offset: 0.44 },
              { filter: 'brightness(1.62) drop-shadow(0 0 4px rgba(98,230,255,.6))', offset: 0.62 },
              { filter: 'none', offset: 1 },
            ],
            { duration: 280, easing: 'steps(1, end)', fill: 'none' },
          );
          entry.animation.addEventListener('finish', () => {
            if (entries.has(node)) entry.animation = null;
          });
        } catch (error) {
          noteError('flicker animation failed', error);
        }
      };

      const ensure = (node) => {
        if (!(node instanceof HTMLElement)) return;
        if (!node.matches('button, [role="button"]')) return;
        if (entries.has(node)) return;
        if (node.closest('.sw-wallpaper-frame') !== null) return;
        if (node.getClientRects().length === 0) return;
        const entry = { timer: 0, animation: null };
        entries.set(node, entry);
        schedule(node);
      };

      const scan = () => {
        for (const node of document.querySelectorAll('button, [role="button"]')) ensure(node);
        debug.flickerTargets = entries.size;
      };

      const queueScan = () => {
        if (raf !== 0) return;
        raf = window.requestAnimationFrame(() => {
          raf = 0;
          scan();
        });
      };

      const observer = new MutationObserver(queueScan);
      observer.observe(document.body, { childList: true, subtree: true });
      scan();

      const onMotionChange = () => {
        if (reduceMotion.matches) {
          for (const node of [...entries.keys()]) clearEntry(node);
          debug.flickerTargets = 0;
        } else {
          scan();
        }
      };
      reduceMotion.addEventListener('change', onMotionChange);

      return () => {
        observer.disconnect();
        reduceMotion.removeEventListener('change', onMotionChange);
        if (raf !== 0) window.cancelAnimationFrame(raf);
        for (const node of [...entries.keys()]) clearEntry(node);
        debug.flickerTargets = 0;
      };
    }

    function installCustomization() {
      const token = {};
      const definition = {
        protocol: 2,
        skinId: 'silver-wolf',
        title: '银狼·像素骇入',
        titleEn: 'Silver Wolf // Pixel Intrusion',
        settings: [
          {
            key: SETTING_KEY,
            type: 'range',
            label: '壁纸装饰宽度',
            labelEn: 'Wallpaper ornament width',
            description:
              '只缩放聊天区中央的银狼装饰，不改变聊天区布局、消息宽度或文字大小。',
            descriptionEn:
              'Scales only the centered Silver Wolf ornament; chat layout, message width and text size stay untouched.',
            defaultValue: DEFAULT_WIDTH,
            min: MIN_WIDTH,
            max: MAX_WIDTH,
            step: 10,
            unit: 'px',
          },
        ],
        apply(state) {
          if (state === null || state === undefined) {
            document.body.style.removeProperty('--sw-wallpaper-width');
            return;
          }
          applyWidth(state.values[SETTING_KEY]);
        },
      };

      const register = () => {
        window.dispatchEvent(
          new CustomEvent(CUSTOMIZATION_EVENTS.register, {
            detail: { token, definition },
          }),
        );
      };

      const onManagerSetting = (event) => {
        const detail = event && event.detail;
        if (!detail || detail.key !== SETTING_KEY) return;
        if (detail.skinId !== 'silver-wolf' && detail.skinId !== 'dsh-skin-silver-wolf-topic') return;
        applyWidth(detail.value);
      };
      window.addEventListener(MANAGER_SETTINGS_EVENT, onManagerSetting);
      window.addEventListener(CUSTOMIZATION_EVENTS.ready, register);
      applyWidth(readManagerWidth());
      register();
      debug.customization = true;

      return () => {
        window.removeEventListener(MANAGER_SETTINGS_EVENT, onManagerSetting);
        window.removeEventListener(CUSTOMIZATION_EVENTS.ready, register);
        window.dispatchEvent(
          new CustomEvent(CUSTOMIZATION_EVENTS.unregister, {
            detail: { token, definition },
          }),
        );
        document.body.style.removeProperty('--sw-wallpaper-width');
        debug.customization = false;
      };
    }

    /**
     * Move only the add-file affordance inside the resident composer. An inline
     * translation is used because the host's generated utility classes are
     * not stable across releases; the observer reapplies it after re-renders.
     */
    function installComposerAddOffset() {
      const SELECTOR =
        '[data-composer-card] button[class*="RlGAzG_add"], ' +
        '[data-composer-card] [class*="_tools"] > button:first-child';
      const owned = new Set();
      let raf = 0;

      const scan = () => {
        for (const button of document.querySelectorAll(SELECTOR)) {
          if (!(button instanceof HTMLElement)) continue;
          button.style.setProperty('translate', '10px 0', 'important');
          button.dataset.swAddOffset = '';
          owned.add(button);
        }
      };

      const schedule = () => {
        if (raf !== 0) return;
        raf = window.requestAnimationFrame(() => {
          raf = 0;
          scan();
        });
      };

      const observer = new MutationObserver(schedule);
      observer.observe(document.body, { childList: true, subtree: true });
      scan();

      return () => {
        observer.disconnect();
        if (raf !== 0) window.cancelAnimationFrame(raf);
        for (const button of owned) {
          if (button.dataset.swAddOffset !== undefined) {
            button.style.removeProperty('translate');
            delete button.dataset.swAddOffset;
          }
        }
        owned.clear();
      };
    }

    const MANAGER_STYLE = `
      .swm-root {
        --swm-bg: var(--dsw-alias-bg-l2, #161a22);
        --swm-bg-raised: var(--dsw-alias-bg-l1, #1d2230);
        --swm-border: var(--dsw-alias-border-l1, rgba(136, 158, 198, 0.28));
        --swm-text: var(--dsw-alias-label-primary, #e8edf7);
        --swm-muted: var(--dsw-alias-label-secondary, #9aa7bf);
        --swm-accent: #ff4fa3;
        --swm-cyan: #62e6ff;
        color: var(--swm-text);
        font-size: 13px;
        line-height: 1.55;
        padding: 2px 0 28px;
      }
      .swm-root *, .swm-root *::before, .swm-root *::after { box-sizing: border-box; }
      .swm-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin: 2px 0 16px; }
      .swm-title { margin: 0; font-size: 18px; line-height: 1.3; letter-spacing: .04em; }
      .swm-sub { margin: 5px 0 0; color: var(--swm-muted); font-size: 12px; max-width: 620px; }
      .swm-btn {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 28px;
        padding: 4px 10px;
        border: 1px solid var(--swm-border);
        border-radius: 0;
        background: var(--swm-bg-raised);
        color: var(--swm-text);
        font: inherit;
        line-height: 1.2;
        cursor: pointer;
        white-space: nowrap;
      }
      .swm-btn:hover:not(:disabled) { border-color: var(--swm-cyan); color: var(--swm-cyan); }
      .swm-btn:focus-visible { outline: 1px solid var(--swm-accent); outline-offset: 2px; }
      .swm-btn:disabled { opacity: .55; cursor: default; }
      .swm-btn--primary { border-color: var(--swm-accent); background: var(--swm-accent); color: #1a0d16; font-weight: 700; }
      .swm-btn--primary:hover:not(:disabled) { border-color: #ff7ab8; color: #1a0d16; background: #ff7ab8; }
      .swm-btn--danger { border-color: rgba(255, 107, 138, .7); color: #ff9aab; }
      .swm-btn--danger:hover:not(:disabled) { border-color: #ff6b8a; color: #ffc0ca; }
      .swm-notice, .swm-error {
        margin: 0 0 12px;
        padding: 8px 11px;
        border-left: 2px solid var(--swm-cyan);
        background: rgba(98, 230, 255, .07);
        color: var(--swm-text);
        font-size: 12px;
      }
      .swm-error { border-left-color: #ff6b8a; background: rgba(255, 107, 138, .09); }
      .swm-official {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        margin: 0 0 12px;
        padding: 12px 14px;
        border: 1px solid var(--swm-border);
        background: var(--swm-bg);
      }
      .swm-official--active { border-color: var(--swm-cyan); box-shadow: inset 0 0 0 1px rgba(98, 230, 255, .18); }
      .swm-official-copy h3 { margin: 0 0 2px; font-size: 14px; }
      .swm-official-copy p { margin: 0; color: var(--swm-muted); font-size: 12px; }
      .swm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
      .swm-card {
        display: flex;
        flex-direction: column;
        min-width: 0;
        border: 1px solid var(--swm-border);
        background: var(--swm-bg);
      }
      .swm-card--active { border-color: var(--swm-cyan); box-shadow: inset 0 0 0 1px rgba(98, 230, 255, .2); }
      .swm-thumb {
        position: relative;
        aspect-ratio: 16 / 9;
        overflow: hidden;
        border-bottom: 1px solid var(--swm-border);
        background: #0e1118;
      }
      .swm-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
      .swm-thumb-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: var(--swm-cyan);
        font-size: 34px;
        font-weight: 700;
        letter-spacing: .08em;
        background: linear-gradient(135deg, rgba(67, 92, 255, .3), rgba(255, 79, 163, .14));
      }
      .swm-card-body { display: flex; flex: 1; flex-direction: column; gap: 7px; padding: 11px 12px 12px; }
      .swm-card-head { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .swm-card-head h3 { min-width: 0; margin: 0; overflow: hidden; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
      .swm-badge {
        flex: none;
        padding: 1px 5px;
        border: 1px solid var(--swm-border);
        color: var(--swm-muted);
        font-size: 10px;
        line-height: 1.5;
      }
      .swm-desc {
        display: -webkit-box;
        min-height: 36px;
        margin: 0;
        overflow: hidden;
        color: var(--swm-muted);
        font-size: 12px;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }
      .swm-meta { color: var(--swm-muted); font-size: 11px; }
      .swm-actions { display: flex; flex-wrap: wrap; gap: 7px; margin-top: auto; padding-top: 4px; }
      .swm-width {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px 16px;
        margin-top: 22px;
        padding-top: 14px;
        border-top: 1px solid var(--swm-border);
      }
      .swm-width h3 { margin: 0; font-size: 13px; }
      .swm-width label { display: flex; align-items: center; gap: 10px; color: var(--swm-muted); font-size: 12px; }
      .swm-range { width: min(340px, 46vw); accent-color: var(--swm-cyan); }
      .swm-output { min-width: 52px; color: var(--swm-text); font-variant-numeric: tabular-nums; }
      .swm-empty { margin: 20px 0; padding: 20px; border: 1px dashed var(--swm-border); color: var(--swm-muted); text-align: center; }
      .swm-footer { margin-top: 18px; color: var(--swm-muted); font-size: 11px; }
      .swm-modal {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: rgba(4, 7, 14, .82);
      }
      .swm-modal-inner {
        width: min(960px, 94vw);
        max-height: 92vh;
        overflow: auto;
        padding: 12px;
        border: 1px solid var(--swm-border);
        background: var(--swm-bg);
      }
      .swm-modal-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
      .swm-modal-head h3 { margin: 0; font-size: 14px; }
      .swm-modal-inner img { display: block; width: 100%; height: auto; }
      @media (max-width: 620px) {
        .swm-header { flex-direction: column; }
        .swm-official { align-items: flex-start; flex-direction: column; }
        .swm-grid { grid-template-columns: 1fr; }
        .swm-range { width: 100%; }
      }
    `;

    function installManagerStyle() {
      const style = document.createElement('style');
      style.dataset.swManagerStyle = '';
      style.textContent = MANAGER_STYLE;
      document.head.appendChild(style);
      return () => style.remove();
    }

    function createManagerSection(ctx) {
      const h = React.createElement;

      function ManagerSection() {
        const [data, setData] = React.useState({ phase: 'loading', skins: [], managerPackage: '' });
        const [active, setActive] = React.useState(readActiveSkin);
        const [error, setError] = React.useState('');
        const [notice, setNotice] = React.useState('');
        const [busy, setBusy] = React.useState('');
        const [preview, setPreview] = React.useState(null);
        const [width, setWidth] = React.useState(readWallpaperWidth);
        const [confirmId, setConfirmId] = React.useState('');
        const [refresh, setRefresh] = React.useState(0);

        React.useEffect(() => {
          let cancelled = false;
          managerRequest('list')
            .then((response) => {
              if (cancelled) return;
              const skins = Array.isArray(response && response.skins) ? response.skins : [];
              setData({
                phase: 'ready',
                skins,
                managerPackage: (response && response.managerPackage) || '',
              });
              setActive((previous) => {
                if (previous === OFFICIAL_ID) return previous;
                if (skins.some((skin) => skin.id === previous)) return previous;
                const fallback = skins.some((skin) => skin.id === 'silver-wolf')
                  ? 'silver-wolf'
                  : OFFICIAL_ID;
                writeActiveSkin(fallback);
                return fallback;
              });
            })
            .catch((reason) => {
              if (cancelled) return;
              setData((previous) => ({ ...previous, phase: 'error' }));
              setError(reason instanceof Error ? reason.message : '读取皮肤列表失败');
            });
          return () => {
            cancelled = true;
          };
        }, [refresh]);

        const managerSkin = data.skins.find((skin) => skin.manager) || null;

        const switchTo = async (id) => {
          if (busy) return;
          setBusy(`activate:${id}`);
          setError('');
          setNotice('');
          try {
            const result = await managerRequest('activate', {
              method: 'POST',
              body: JSON.stringify({ active: id }),
            });
            writeActiveSkin(id);
            setActive(id);
            if (result && result.restartRequired) {
              setNotice('切换已保存；请完全退出 DSH 并重新打开后生效。');
              setBusy('');
              return;
            }
            setNotice('已切换，正在重新载入界面…');
            window.setTimeout(() => window.location.reload(), 250);
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : '切换皮肤失败');
            setBusy('');
          }
        };

        const importSkin = async () => {
          if (busy) return;
          setBusy('import');
          setError('');
          setNotice('');
          try {
            const workspace = ctx.get('uiWorkspace');
            if (workspace === undefined || typeof workspace.pickDirectory !== 'function') {
              throw new Error('当前环境不支持目录选择');
            }
            const directory = await workspace.pickDirectory();
            if (!directory) {
              setBusy('');
              return;
            }
            const result = await managerRequest('import', {
              method: 'POST',
              body: JSON.stringify({ path: directory }),
            });
            setNotice(
              result && result.restartRequired
                ? '已导入本地皮肤；请完全退出 DSH 并重新打开后再切换。'
                : '已导入本地皮肤。刷新列表后可切换使用。',
            );
            setRefresh((value) => value + 1);
            setBusy('');
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : '导入皮肤失败');
            setBusy('');
          }
        };

        const uninstall = async (skin) => {
          if (busy) return;
          if (confirmId !== skin.id) {
            setConfirmId(skin.id);
            setNotice(`再次点击「确认卸载」将卸载 ${skin.name}。`);
            return;
          }
          const wasActive = active === skin.id;
          setBusy(`uninstall:${skin.id}`);
          setError('');
          setNotice('');
          try {
            if (wasActive) {
              const activated = await managerRequest('activate', {
                method: 'POST',
                body: JSON.stringify({ active: OFFICIAL_ID }),
              });
              writeActiveSkin(OFFICIAL_ID);
              setActive(OFFICIAL_ID);
              if (activated && activated.restartRequired) {
                setNotice('已恢复官方；请完全退出 DSH 并重新打开后再卸载这个皮肤。');
                setBusy('');
                return;
              }
            }
            const removed = await managerRequest('uninstall', {
              method: 'POST',
              body: JSON.stringify({ id: skin.id }),
            });
            setConfirmId('');
            setNotice(
              removed && removed.restartRequired
                ? `已卸载 ${skin.name}；请完全退出 DSH 并重新打开以完全生效。`
                : `已卸载 ${skin.name}。`,
            );
            setRefresh((value) => value + 1);
            setBusy('');
            if (wasActive) window.setTimeout(() => window.location.reload(), 300);
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : '卸载皮肤失败');
            setBusy('');
          }
        };

        const updateWidth = (event) => {
          const next = clampWidth(Number(event.target.value));
          setWidth(next);
          writeWallpaperWidth(next);
        };

        const openPreview = (skin) => {
          if (!skin.preview) return;
          setPreview({
            title: skin.name,
            url: new URL(skin.preview, document.baseURI).href,
          });
        };

        const renderCard = (skin) => {
          const current = active === skin.id;
          const manageable = skin.manage === true;
          const activeBadge = current ? h('span', { className: 'swm-badge' }, '当前使用') : null;
          const managerBadge = skin.manager
            ? h('span', { className: 'swm-badge' }, '管理器')
            : null;
          const actionLabel = current ? '当前使用' : manageable ? '使用' : '不可切换';
          const canUninstall = !skin.manager && skin.removable !== false && manageable;
          return h(
            'article',
            { key: skin.id, className: `swm-card${current ? ' swm-card--active' : ''}` },
            h(
              'div',
              { className: 'swm-thumb' },
              skin.preview
                ? h('img', {
                    src: new URL(skin.preview, document.baseURI).href,
                    alt: `${skin.name} 预览`,
                    loading: 'lazy',
                  })
                : h('div', { className: 'swm-thumb-fallback' }, skin.name.slice(0, 1)),
            ),
            h(
              'div',
              { className: 'swm-card-body' },
              h(
                'div',
                { className: 'swm-card-head' },
                h('h3', { title: skin.name }, skin.name),
                activeBadge,
                managerBadge,
              ),
              h('p', { className: 'swm-desc', title: skin.description }, skin.description),
              h(
                'div',
                { className: 'swm-meta' },
                skin.version ? `v${skin.version}` : '',
                skin.manager ? ' · 内置管理器' : '',
                skin.manage === false ? ' · 不是可切换组合包' : '',
              ),
              h(
                'div',
                { className: 'swm-actions' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'swm-btn swm-btn--primary',
                    disabled: Boolean(busy) || current || !manageable,
                    onClick: () => switchTo(skin.id),
                  },
                  actionLabel,
                ),
                skin.preview
                  ? h(
                      'button',
                      {
                        type: 'button',
                        className: 'swm-btn',
                        onClick: () => openPreview(skin),
                      },
                      '预览',
                    )
                  : null,
                canUninstall
                  ? h(
                      'button',
                      {
                        type: 'button',
                        className: 'swm-btn swm-btn--danger',
                        disabled: Boolean(busy),
                        onClick: () => uninstall(skin),
                      },
                      confirmId === skin.id ? '确认卸载' : '卸载',
                    )
                  : null,
              ),
            ),
          );
        };

        if (data.phase === 'loading') {
          return h('div', { className: 'swm-root' }, h('p', { className: 'swm-sub' }, '正在读取皮肤列表…'));
        }

        return h(
          'div',
          { className: 'swm-root' },
          h(
            'header',
            { className: 'swm-header' },
            h(
              'div',
              null,
              h('h2', { className: 'swm-title' }, '皮肤'),
              h(
                'p',
                { className: 'swm-sub' },
                '管理已安装的皮肤。管理器内置在银狼皮肤包中；切换其他皮肤或恢复官方外观时，仍然保留这个设置页。',
              ),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'swm-btn',
                disabled: Boolean(busy),
                onClick: importSkin,
              },
              busy === 'import' ? '正在导入…' : '导入本地皮肤',
            ),
          ),
          error ? h('div', { className: 'swm-error' }, error) : null,
          notice ? h('div', { className: 'swm-notice' }, notice) : null,
          h(
            'section',
            {
              className: `swm-official${active === OFFICIAL_ID ? ' swm-official--active' : ''}`,
            },
            h(
              'div',
              { className: 'swm-official-copy' },
              h('h3', null, '官方外观'),
              h(
                'p',
                null,
                active === OFFICIAL_ID
                  ? '当前正在使用 DSH 官方外观；皮肤管理器仍然可用。'
                  : '关闭皮肤视觉层，恢复 DSH 官方外观。',
              ),
            ),
            h(
              'button',
              {
                type: 'button',
                className: `swm-btn${active === OFFICIAL_ID ? '' : ' swm-btn--primary'}`,
                disabled: Boolean(busy) || active === OFFICIAL_ID,
                onClick: () => switchTo(OFFICIAL_ID),
              },
              active === OFFICIAL_ID ? '当前使用' : '恢复官方',
            ),
          ),
          data.skins.length === 0
            ? h('div', { className: 'swm-empty' }, '没有发现已安装的皮肤包。')
            : h('div', { className: 'swm-grid' }, data.skins.map(renderCard)),
          managerSkin
            ? h(
                'section',
                { className: 'swm-width' },
                h('h3', null, '银狼壁纸宽度'),
                h(
                  'label',
                  null,
                  h('input', {
                    className: 'swm-range',
                    type: 'range',
                    min: MIN_WIDTH,
                    max: MAX_WIDTH,
                    step: 10,
                    value: width,
                    onChange: updateWidth,
                  }),
                  h('output', { className: 'swm-output' }, `${width} px`),
                ),
              )
            : null,
          h(
            'p',
            { className: 'swm-footer' },
            `管理器位于 ${data.managerPackage || '银狼皮肤包'}；皮肤切换后需要重载界面。`,
          ),
          preview
            ? h(
                'div',
                {
                  className: 'swm-modal',
                  role: 'presentation',
                  onClick: () => setPreview(null),
                },
                h(
                  'div',
                  {
                    className: 'swm-modal-inner',
                    role: 'dialog',
                    'aria-modal': 'true',
                    onClick: (event) => event.stopPropagation(),
                  },
                  h(
                    'div',
                    { className: 'swm-modal-head' },
                    h('h3', null, preview.title),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'swm-btn',
                        onClick: () => setPreview(null),
                      },
                      '关闭',
                    ),
                  ),
                  h('img', { src: preview.url, alt: `${preview.title} 预览` }),
                ),
              )
            : null,
        );
      }

      return ManagerSection;
    }

    function installManagerSection(ctx) {
      if (!ctx.slots || typeof ctx.slots.inject !== 'function') {
        noteError('settings slot service is unavailable');
        return null;
      }
      const ManagerSection = createManagerSection(ctx);
      return ctx.slots.inject('settings.section', () =>
        ctx.slots.register(
          {
            name: 'settings.section',
            id: MANAGER_SECTION_ID,
            order: 20,
            label: () => '皮肤',
          },
          ManagerSection,
        ),
      );
    }

    function apply(ctx) {
      let disposed = false;
      let removeStyles = null;
      let removeManagerStyle = null;
      let disposeManagerSection = null;
      const cleanups = [];

      try {
        removeManagerStyle = installManagerStyle();
      } catch (error) {
        noteError('manager stylesheet injection failed', error);
      }
      try {
        disposeManagerSection = installManagerSection(ctx);
      } catch (error) {
        noteError('manager settings section registration failed', error);
      }

      const disposeManager = () => {
        try {
          if (typeof disposeManagerSection === 'function') disposeManagerSection();
        } catch (error) {
          console.error('[silver-wolf] manager section cleanup failed', error);
        }
        try {
          if (typeof removeManagerStyle === 'function') removeManagerStyle();
        } catch (error) {
          console.error('[silver-wolf] manager stylesheet cleanup failed', error);
        }
        disposeManagerSection = null;
        removeManagerStyle = null;
      };

      // The manager page lives in this package. When another skin (or the
      // official UI) is active, keep the settings page but skip every skin
      // visual layer below.
      if (readActiveSkin() !== 'silver-wolf') {
        ctx.effect(
          () => () => disposeManager(),
          'ui-skin-silver-wolf: manager page while another appearance is active',
        );
        return;
      }

      const start = () => {
        if (disposed || document.body.hasAttribute(ATTR)) return;
        // Remove diagnostics left behind by an older hot-loaded build.
        document.querySelectorAll('[data-sw-debug]').forEach((node) => node.remove());
        document.body.setAttribute(ATTR, '');
        document.body.dataset.swTheme = 'dark';
        for (const install of [
          installWallpaper,
          installAvatarPins,
          installComposerAddOffset,
          installFlicker,
          installCustomization,
        ]) {
          try {
            cleanups.push(install());
          } catch (error) {
            noteError(`${install.name} failed`, error);
          }
        }
      };

      try {
        removeStyles = installStylesheet(start);
      } catch (error) {
        noteError('stylesheet injection failed', error);
      }

      ctx.effect(() => {
        return () => {
          disposed = true;
          removeStyles?.();
          for (const cleanup of cleanups.splice(0).reverse()) {
            try {
              cleanup();
            } catch (error) {
              console.error('[silver-wolf] cleanup failed', error);
            }
          }
          disposeManager();
          document.body.removeAttribute(ATTR);
          delete document.body.dataset.swTheme;
          delete window.__DSH_SILVER_WOLF__;
        };
      }, 'ui-skin-silver-wolf: stylesheet, ornament, avatar frame, flicker and settings');
    }

    exports.inject = ['slots', 'uiWorkspace'];
    exports.apply = apply;
    return module.exports;
  },
});
