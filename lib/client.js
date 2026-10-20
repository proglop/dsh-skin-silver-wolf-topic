window.__ModuleLoader__.load({
  id: 'dsh-client-ui-skin-silver-wolf',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    const VERSION = '1.0.10';
    const ATTR = 'data-dsh-silver-wolf';
    const CSS_URL = new URL(`skin-assets/silver-wolf/skin.css?v=${VERSION}`, document.baseURI).href;
    const ASSET_BASE = new URL('skin-assets/silver-wolf/', document.baseURI).href;
    const SETTING_KEY = 'wallpaperWidth';
    const DEFAULT_WIDTH = 760;
    const MIN_WIDTH = 640;
    const MAX_WIDTH = 920;
    const MANAGER_SETTINGS_KEY = 'dsh.skin-settings.v1';
    const MANAGER_SETTINGS_EVENT = 'dsh:skin-setting-change';
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
        if (detail.skinId !== 'silver-wolf' && detail.skinId !== 'dsh-client-ui-skin-silver-wolf') return;
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

    function apply(ctx) {
      let disposed = false;
      let removeStyles = null;
      const cleanups = [];

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
          document.body.removeAttribute(ATTR);
          delete document.body.dataset.swTheme;
          delete window.__DSH_SILVER_WOLF__;
        };
      }, 'ui-skin-silver-wolf: stylesheet, ornament, avatar frame, flicker and settings');
    }

    exports.apply = apply;
    return module.exports;
  },
});
