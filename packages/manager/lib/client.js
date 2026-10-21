// dsh-skin-manager — browser half (client plugin bundle).
//
// Loaded by dsh-client-modules at /plugins/dsh-skin-manager/client.js
// and executed through the vendored cordis Loader's lazy-CJS module table
// (window.__ModuleLoader__.load). The factory body is plain CJS with
// require() resolved against the shell's module table — the same shape the
// shipped ui-* packages' tsdown bundles emit.
//
// It registers its own Settings section (settings.section, id "skins"):
// a dedicated 皮肤 / Skins page in the settings sidebar that lists every
// installed skin (discovered at runtime via the host /api/skin-manager/list
// route) plus 官方默认 / Default. Applying a skin rewrites the profile patch
// through the host API; DSH's config watcher hot-reloads it, then the page
// refresh activates the new boot graph.

window.__ModuleLoader__.load({
	id: "dsh-skin-manager",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let _react = require("react");

		//#region dsh-skin-manager: definitions
		/** The settings section's locale namespace. */
		const NS = "settings.skin-manager";
		/** Host API prefix. */
		const API = "/api/skin-manager";
		/** Sentinel meaning "no skin — stock look". */
		const OFFICIAL = "official";
		/** Shared browser-side key for per-skin settings. */
		const SETTINGS_STORAGE_KEY = "dsh.skin-settings.v1";
		/** Event the active skin listens to for live setting changes. */
		const SETTINGS_EVENT = "dsh:skin-setting-change";
		/** The skin that currently exposes a width setting. */
		const SILVER_WOLF_ID = "silver-wolf";
		const SILVER_WOLF_PACKAGE = "dsh-client-ui-skin-silver-wolf";
		const WALLPAPER_KEY = "wallpaperWidth";
		const WALLPAPER_DEFAULT = 760;
		const WALLPAPER_MIN = 640;
		const WALLPAPER_MAX = 920;
		const WALLPAPER_STEP = 10;

		/** zh / en dictionaries. */
		const zh = {
			nav: "皮肤",
			title: "皮肤",
			description: "选择已安装的皮肤（互斥，应用后刷新页面生效）",
			defaultOption: "官方默认",
			defaultTagline: "恢复 DeepSeek Harness 原生外观",
			apply: "应用",
			applying: "应用中…",
			applied: "已应用，刷新页面生效",
			failed: "应用失败",
			none: "未发现已安装的皮肤",
			refresh: "刷新",
			active: "使用中",
			skinSettings: "皮肤设置",
			wallpaperWidth: "壁纸装饰宽度",
			wallpaperHint: "只缩放聊天区中央的银狼装饰，不改变布局或字号。",
			pixels: "px",
		};
		const en = {
			nav: "Skins",
			title: "Skins",
			description: "Pick an installed skin (mutually exclusive; refresh after applying)",
			defaultOption: "Default",
			defaultTagline: "Restore the stock DeepSeek Harness appearance",
			apply: "Apply",
			applying: "Applying…",
			applied: "Applied — refresh the page to activate",
			failed: "Apply failed",
			none: "No skins installed",
			refresh: "Refresh",
			active: "Active",
			skinSettings: "Skin settings",
			wallpaperWidth: "Wallpaper ornament width",
			wallpaperHint: "Scales only the centered Silver Wolf ornament; layout and text size stay unchanged.",
			pixels: "px",
		};

		/** Resolve a locale key through the injected `t` or fall back to zh. */
		function tt(props, key) {
			if (props && typeof props.t === "function") {
				const v = props.t(key);
				if (typeof v === "string" && v !== key) return v;
			}
			return zh[key] ?? en[key] ?? key;
		}

		function isSilverWolf(active) {
			return active === SILVER_WOLF_ID || active === SILVER_WOLF_PACKAGE;
		}

		function normalizeWidth(value) {
			const n = Number(value);
			if (!Number.isFinite(n)) return WALLPAPER_DEFAULT;
			return Math.min(WALLPAPER_MAX, Math.max(WALLPAPER_MIN, Math.round(n / WALLPAPER_STEP) * WALLPAPER_STEP));
		}

		/** Read a setting from the shared browser-side JSON store. */
		function readStoredSetting(skinId, key, fallback) {
			try {
				const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
				if (!raw) return fallback;
				const all = JSON.parse(raw);
				const value = all && all[skinId] ? all[skinId][key] : undefined;
				return typeof value === "number" && Number.isFinite(value) ? value : fallback;
			} catch {
				return fallback;
			}
		}

		/** Persist a setting without discarding other skins/keys. */
		function writeStoredSetting(skinId, key, value) {
			try {
				const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
				const all = raw ? JSON.parse(raw) : {};
				if (!all || typeof all !== "object") return;
				const bucket = all[skinId] && typeof all[skinId] === "object" ? all[skinId] : {};
				all[skinId] = { ...bucket, [key]: value };
				window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(all));
			} catch {
				/* storage can be unavailable in hardened contexts */
			}
		}

		/** Tell the active skin to re-apply a setting without a page reload. */
		function emitSetting(skinId, key, value) {
			try {
				window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, {
					detail: { skinId, key, value },
				}));
			} catch {
				/* custom events are best-effort */
			}
		}

		/**
		 * The Settings surface is its own light page in the shell, so the skin's
		 * frame-scoped tokens do not reach its pure-white presets. Apply one
		 * restrained optical tint to the settings document and to the modal when
		 * it is hosted inside the main frame; dark mode is untouched.
		 */
		function installLightChromeStyle() {
			if (typeof document === "undefined") return () => {};
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-skin-manager";
			tag.dataset.pluginCss = "light-chrome";
			tag.textContent = `
body:not([data-ds-dark-theme]):not(:has(.BynINW_frame)) {
  background-color: #edf0f5 !important;
  filter: brightness(0.9) saturate(0.93) sepia(0.04);
}
body:not([data-ds-dark-theme]):has(.BynINW_frame) [role="dialog"],
body:not([data-ds-dark-theme]):has(.BynINW_frame) .wCInkW_panel {
  filter: brightness(0.9) saturate(0.93) sepia(0.04);
}
`;
			document.head.appendChild(tag);
			return () => tag.remove();
		}

		/** The dedicated Skins settings section (a full settings page). */
		function SkinManagerSection(props) {
			const _jsx = react_jsx_runtime.jsx;
			const _jsxs = react_jsx_runtime.jsxs;
			const { useEffect, useState, useCallback } = _react;
			const [skins, setSkins] = useState(null);
			const [active, setActive] = useState(null);
			const [busy, setBusy] = useState(false);
			const [status, setStatus] = useState("");
			const [wallpaperWidth, setWallpaperWidth] = useState(() =>
				normalizeWidth(readStoredSetting(SILVER_WOLF_ID, WALLPAPER_KEY, WALLPAPER_DEFAULT)),
			);

			const load = useCallback(() => {
				fetch(`${API}/list`)
					.then((r) => r.json())
					.then((data) => {
						setSkins(Array.isArray(data.skins) ? data.skins : []);
						setActive(data.active ?? null);
						setStatus("");
					})
					.catch(() => {
						setSkins([]);
						setStatus("failed");
					});
			}, []);

			useEffect(() => { load(); }, [load]);

			useEffect(() => {
				if (!isSilverWolf(active)) return;
				const width = normalizeWidth(readStoredSetting(SILVER_WOLF_ID, WALLPAPER_KEY, WALLPAPER_DEFAULT));
				setWallpaperWidth(width);
				emitSetting(SILVER_WOLF_ID, WALLPAPER_KEY, width);
			}, [active]);

			const changeWallpaper = useCallback((value) => {
				const width = normalizeWidth(value);
				setWallpaperWidth(width);
				writeStoredSetting(SILVER_WOLF_ID, WALLPAPER_KEY, width);
				emitSetting(SILVER_WOLF_ID, WALLPAPER_KEY, width);
			}, []);

			const apply = useCallback((id) => {
				setBusy(true);
				setStatus("");
				fetch(`${API}/apply`, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ id }),
				})
					.then((r) => r.json())
					.then((data) => {
						setBusy(false);
						if (data.ok === true) {
							setActive(data.active ?? null);
							setStatus("applied");
						} else {
							setStatus("failed");
						}
					})
					.catch(() => {
						setBusy(false);
						setStatus("failed");
					});
			}, []);

			const t = (key) => tt(props, key);

			if (skins === null) {
				return _jsx("div", { style: { padding: "24px 0" }, children: "…" });
			}

			const rows = [];
			// 官方默认 / Default option.
			rows.push(_jsxs("div", {
				style: skinCardStyle(active === null),
				children: [
					_jsx("div", { style: { width: 10, height: 10, borderRadius: 5, background: "var(--dsw-alias-brand-primary, #4d86f8)", marginRight: 10, flexShrink: 0 } }),
					_jsxs("div", { style: { flex: 1 }, children: [
						_jsx("div", { style: { fontWeight: 600 }, children: t("defaultOption") }),
						_jsx("div", { style: { color: "var(--dsw-alias-label-tertiary)", fontSize: 12 }, children: t("defaultTagline") }),
					] }),
					active === null
						? _jsx("span", { style: activeBadge(), children: t("active") })
						: _jsx("button", { style: applyBtn(), disabled: busy, onClick: () => apply(OFFICIAL), children: busy ? t("applying") : t("apply") }),
				],
			}));

			for (const skin of skins) {
				const isActive = active !== null && (skin.id === active || skin.package === active);
				rows.push(_jsxs("div", {
					key: skin.package,
					style: skinCardStyle(isActive),
					children: [
						_jsx("div", { style: { width: 10, height: 10, borderRadius: 5, background: skin.accent || "#888", marginRight: 10, flexShrink: 0 } }),
						_jsxs("div", { style: { flex: 1 }, children: [
							_jsx("div", { style: { fontWeight: 600 }, children: skin.name }),
							_jsx("div", { style: { color: "var(--dsw-alias-label-tertiary)", fontSize: 12 }, children: skin.tagline || skin.package }),
						] }),
						isActive
							? _jsx("span", { style: activeBadge(), children: t("active") })
							: _jsx("button", { style: applyBtn(), disabled: busy, onClick: () => apply(skin.id), children: busy ? t("applying") : t("apply") }),
					],
				}));
			}

			if (skins.length === 0) {
				rows.push(_jsx("div", { key: "none", style: { color: "var(--dsw-alias-label-tertiary)", padding: "8px 0" }, children: t("none") }));
			}

			const settingsBlock = isSilverWolf(active)
				? _jsxs("div", { style: settingsCardStyle(), children: [
					_jsx("div", { style: { fontWeight: 600, marginBottom: 2 }, children: t("skinSettings") }),
					_jsx("div", { style: { color: "var(--dsw-alias-label-tertiary)", fontSize: 12, marginBottom: 10 }, children: t("wallpaperHint") }),
					_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
						_jsx("label", { style: { fontSize: 13, minWidth: 96 }, children: t("wallpaperWidth") }),
						_jsx("input", {
							type: "range",
							min: WALLPAPER_MIN,
							max: WALLPAPER_MAX,
							step: WALLPAPER_STEP,
							value: wallpaperWidth,
							onChange: (event) => changeWallpaper(event.target.value),
							style: { flex: 1, accentColor: "#ff4f86" },
						}),
						_jsx("span", { style: { color: "var(--dsw-alias-label-secondary)", fontSize: 12, minWidth: 44, textAlign: "right" }, children: `${wallpaperWidth}${t("pixels")}` }),
					] }),
				] })
				: null;

			const statusLine = status === "applied"
				? _jsxs("div", { style: statusStyle("var(--dsw-alias-state-business-primary)"), children: [t("applied"), "  ", _jsx("button", { style: linkBtn(), onClick: () => location.reload(), children: t("refresh") })] })
				: status === "failed"
					? _jsx("div", { style: statusStyle("var(--dsw-alias-state-danger-primary, #e5484d)"), children: t("failed") })
					: null;

			return _jsxs("div", { style: { padding: "4px 0" }, children: [
				_jsx("h2", { style: { fontSize: 16, fontWeight: 600, margin: "0 0 4px" }, children: t("title") }),
				_jsx("div", { style: { fontSize: 12, color: "var(--dsw-alias-label-tertiary)", marginBottom: 12 }, children: t("description") }),
				...rows,
				settingsBlock,
				statusLine,
			] });
		}

		function settingsCardStyle() {
			return {
				marginTop: 10,
				padding: "12px",
				borderRadius: 8,
				border: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.2))",
				background: "var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.06))",
			};
		}

		function skinCardStyle(active) {
			return {
				display: "flex",
				alignItems: "center",
				gap: 6,
				padding: "10px 12px",
				borderRadius: 8,
				marginBottom: 6,
				border: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.2))",
				background: active ? "var(--dsw-alias-interactive-bg-active, rgba(128,128,128,0.15))" : "transparent",
			};
		}
		function activeBadge() {
			return {
				color: "var(--dsw-alias-state-business-primary, #4d86f8)",
				fontSize: 12,
				fontWeight: 600,
			};
		}
		function applyBtn() {
			return {
				padding: "4px 14px",
				borderRadius: 6,
				border: "1px solid var(--dsw-alias-border-l2, #555)",
				background: "var(--dsw-alias-interactive-bg-hover, transparent)",
				color: "var(--dsw-alias-label-primary, #eee)",
				cursor: "pointer",
				fontSize: 13,
			};
		}
		function statusStyle(color) {
			return { padding: "8px 0", fontSize: 13, color };
		}
		function linkBtn() {
			return { background: "none", border: "none", color: "var(--dsw-alias-state-business-primary, #4d86f8)", cursor: "pointer", fontSize: 13, textDecoration: "underline", padding: 0 };
		}

		/** Only the slots service is required by the browser half. */
		const inject = ["slots"];

		/** Register the dedicated Skins settings section. */
		function apply(ctx) {
			ctx.effect(() => installLightChromeStyle(), "ui-skin-manager: light chrome tint");

			const sectionInjected = () => ({
				t: (key) => zh[key] ?? en[key] ?? key,
			});

			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "skins",
				order: 20,
				label: () => "皮肤",
				inject: sectionInjected,
			}, SkinManagerSection));
		}
		//#endregion

		exports.SkinManagerSection = SkinManagerSection;
		exports.apply = apply;
		exports.inject = inject;
		exports.name = "ui-skin-manager";
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
