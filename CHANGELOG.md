# Changelog

本项目版本号遵循语义化版本；`dshCompatibility` 表示已验证的 DSH Desktop 版本。

## 1.1.5 — 2026-11-19

- 银狼壁纸改为随聊天区/窗口宽度自适应放大，移除固定 760 px 宽度和 640–920 px 上限。
- 移除内置管理器里的“壁纸宽度”滑杆，以及 `dsh:skin-customization-*` 宽度设置、
  `dsh.skin-settings.v1` 读写和 `--sw-wallpaper-width` 变量。
- 管理器页仍保留皮肤列表、预览、切换、恢复官方、导入和卸载。

## 1.1.4 — 2026-11-19

- 适配 **DSH Desktop 0.2.2-rc.5**：`skin.json` 兼容性更新为 `0.2.2rc5`。
- 修复浅色外观下外部插件（如 `dsh-context`/上下文）侧栏仍使用浅色 token 的问题：
  皮肤激活时在 `body` 上强制保留 `data-ds-dark-theme`，DSH 移除时自动补回；
  皮肤停用时恢复进入前的状态；另为 `.lc-root`/`.lc-card` 等上下文面板类加了
  深色兜底规则，避免第三方样式覆盖或插件延迟加载时闪白。
- 文档补充已知限制：顶部“应用/编辑”的原生菜单弹层、启动登录/欢迎窗口不在
  皮肤插件作用域内；未做宿主级侵入修改。

## 1.1.3 — 2026-11-16

- 适配 **DSH Desktop 0.2.2-rc.3**：`skin.json` 兼容性更新为 `0.2.2rc3`。
- 浅色外观强制使用与深色外观相同的蓝紫深色皮肤；移除旧版浅色中性色覆盖，
  并设置 `color-scheme: dark`。
- 修复选择模型等弹出菜单的半透明问题：在 body 级覆盖
  `--dsw-menu-surface-fill`，并将菜单/对话框实色规则移出旧 frame 作用域；
  同时移除 backdrop blur。
- 左上角“应用”菜单仍是 Electron 原生系统菜单，圆角由 Windows 绘制，皮肤 CSS
  无法修改。

## 1.1.2 — 2026-11-16

- 适配 **DSH Desktop 0.2.2-rc.1**：`skin.json` 兼容性更新为 `0.2.2rc1`。
- 设置页/portal 改用 `body[data-dsh-silver-wolf]` 作用域的皮肤 token，并补充
  `[data-shortcut-modal="settings"]` / `AnXs9G_*` 直角化样式；设置页不再保持
  官方灰底和圆角。
- 新增 npm 发布文档、README 徽章/安装方式/素材授权说明。
- 明确记录：左上角“应用”菜单是 Electron 原生菜单，皮肤 CSS 无法修改其系统圆角。

## 1.1.1 — 2026-11-03

- 修复 `dsh.client.inject` 清单：移除不存在的包引用，改为空数组；客户端所需服务
  通过 `exports.inject = ['slots', 'uiWorkspace']` 获取。
- 修复客户端 import 失败导致整个 web boot 失败、设置入口不出现的问题。
- 保留内置多皮肤管理器页面和 1.1.0 的功能。

## 1.1.0 — 2026-11-03

- 内置多皮肤管理器：设置 → 皮肤 支持列表、预览、切换、恢复官方、导入本地皮肤、
  卸载，以及银狼壁纸宽度 640–920 px。
- 移除对外部 `dsh-skin-manager` 的依赖；bundle patch 只保留
  `ui-skin-silver-wolf` 一行。
- 皮肤视觉层与管理器页面解耦：切到官方或其他皮肤时，管理器页面仍然保留。
- 新增 host 端 `/api/skin-manager/*` 路由、同源校验和 PluginManager 变更结果映射。
