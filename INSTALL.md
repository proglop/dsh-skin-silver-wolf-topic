# 安装与排查

> 如果你通过 `dsh plugin add` 从 npm 安装，激活步骤与本文相同；本文的"解包 .tgz"路线是离线/本地交付场景的备用方案。
适用环境：**DeepSeek Harness Desktop 0.2.1-rc.2**，当前 profile 为 `desktop`，[dsh-skin-manager](https://github.com/xiaoyangcheng84-svg/dsh-skin-manager) 0.1.10。

> 本文只讲本地交付场景的安装路线：**解包 `.tgz`（或直接使用交付目录）→ 左侧栏「插件」→「安装第三方插件」→ 填含有 `package.json` 的目录绝对路径**。
>
> 不走「把 `.tgz` 直接填进安装框」，也不走「手动解压后自己改 patch」。后者的 profile 行和 managed 区段由 skin-manager 自己维护。

## 1. 安装前

`.tgz` 只用于传输和归档，内容保留完整目录结构；标准 npm/pnpm tarball 解包后顶层是 `package/`，这是正常的，安装时选到 `package.json` 所在那一层即可。先解包到稳定路径；如果直接使用本工作区，则源目录是：

```text
D:\dsh-skin-silver-wolf-topic\dist\dsh-skin-silver-wolf-topic
```

解包后的目录里必须直接看到：

```text
package.json
cordis.patch.yml
skin.json
lib/index.js
lib/client.js
skin.css
assets/
preview/
```

## 2. 安装（本地目录）

1. 打开 DSH 左侧栏的 **「插件」** 页面（不是设置里只读的插件清单）。
2. 选择 **「安装第三方插件」**。
3. 填入**皮肤目录的绝对路径**，也就是 `package.json` 所在的那一层。例如：
   ```text
   D:\dsh-skins\dsh-skin-silver-wolf-topic
   ```
4. 点击安装。安装器会通过 pnpm 把这个目录加入 desktop profile。
5. 结果若显示 **applied**，热加载已生效；若显示 **restart required**，重启 DSH 一次再继续。

安装后的固定落点：

```text
C:\Users\a1916\.dsh\profiles\desktop\node_modules\dsh-skin-silver-wolf-topic
```

本地目录安装会是一个指向源目录的 junction/link。`package.json` 的包名必须是 `dsh-skin-silver-wolf-topic`。

## 3. 激活

1. 打开 **设置 → 皮肤**。
2. 如果「银狼·像素骇入」已经是活动皮肤，不需要再点；如果仍是官方默认，点它的 **应用**。
3. 管理器只重写 profile 的 `cordis.patch.yml`；home patch 保持 `[]`。切换后刷新页面生效。首次安装/替换管理器后请完全退出并重开 DSH，避免宿主继续挂载旧皮肤。

不要在安装后手动把 `ui-skin-silver-wolf` 加到 profile patch 里。

## 4. manager 到底写什么（仅供核对，不要手改）

### 4.1 profile `package.json`

安装成功后会自动出现依赖和 bundle 选择。当前本机实际形态是：

```json
"dependencies": {
  "dsh-skin-silver-wolf-topic": "file:D:/.../dsh-skin-silver-wolf-topic-1.0.11.tgz"
},
"dsh": {
  "profile": {
    "bundles": [
      "...",
      "dsh-skin-silver-wolf-topic"
    ]
  }
}
```

- `dsh.profile.bundles` 由安装器追加，**不要手动编辑**。
- 本机当前依赖是 `file:D:/.../dsh-skin-silver-wolf-topic-1.0.11.tgz`（管理器从 tgz 重装以清除旧客户端缓存）；若按本说明的目录路线安装，则会是 `link:<皮肤目录>`。两种都不要手改这个 spec。
- 包的 `cordis.patch.yml` 会插入真正的加载行 `ui-skin-silver-wolf`。

### 4.2 profile `cordis.patch.yml`

- **包内置的** `cordis.patch.yml` 有 `insert: ui-skin-silver-wolf`；这是包的一部分。
- **profile 里的 `ui-skin-silver-wolf` 行由 dsh-skin-manager 写入**，出现在 `# --- dsh-skin-manager managed (auto-generated; do not edit) ---` 区段内，形如：
  ```yaml
  - id: ui-skin-silver-wolf
    disabled: true
  ```
  或没有该行（活动皮肤）。这是互斥切换状态，不是安装步骤。
- 当前皮肤是活动皮肤时，管理器可能只保留其他皮肤的 `disabled: true` 行，这是正常状态。
- home patch 由管理器初始化为 `[]`，不再写入旧管理器的 `# --- dsh-skin managed ---` 区段。
- **不要手写、不要手动删除 profile 里的 managed 行**。切换由管理器处理。

## 5. `lib/client.js` 如何注入 `skin.css`

`lib/client.js` 被 DSH 的 client module loader 执行后：

1. 创建同源 `<link rel="stylesheet" href="/skin-assets/silver-wolf/skin.css?v=1.0.11">`。
2. `lib/index.js` 在 Host 侧注册 `/skin-assets/silver-wolf` 前缀路由，只白名单提供：
   - `skin.css`
   - `assets/silver-wolf-chat.png`
   - `assets/silver-wolf-badge.png`
   - `assets/icons/silver-wolf.png`
3. **只有 `load` 事件成功后才给 `<body>` 加 `data-dsh-silver-wolf`**，再挂壁纸、头像点缀、闪烁和设置滑杆。
4. 加载失败或 10 秒超时，`<body>` 不加上皮肤属性，界面留在官方皮肤，避免“半套样式”。

因此皮肤是 **fail-closed** 的：CSS 没到，皮肤不会把界面改坏。

### 注入失败时按顺序排查

1. **先确认路由是否 200**（PowerShell）：
   ```powershell
   $r = Invoke-WebRequest 'http://127.0.0.1:13968/skin-assets/silver-wolf/skin.css' -UseBasicParsing
   $r.StatusCode
   $r.Headers['Content-Type']
   ```
   期望 `200` 和 `text/css; charset=utf-8`。
   - `404`：Host 路由没有注册。确认皮肤在「设置 → 皮肤」中是活动状态，或重启一次。
   - `200` 但样式没生效：继续第 2 步。
2. **看浏览器控制台**（Desktop 的 `developerTools` 已在本 profile 开启）：
   ```js
   document.documentElement.dataset.dshSilverWolfCss
   document.body.hasAttribute('data-dsh-silver-wolf')
   window.__DSH_SILVER_WOLF__
   ```
   - `dshSilverWolfCss` 为 `ready` 才表示 CSS 成功。
   - `error` / `timeout`：看控制台里的 `[silver-wolf]` 错误。
   - `body` 属性不存在：CSS 没有成功，或 client 没有执行。
3. **看壁纸和图片是否 404**：
   ```powershell
   (Invoke-WebRequest 'http://127.0.0.1:13968/skin-assets/silver-wolf/assets/silver-wolf-chat.png' -UseBasicParsing).StatusCode
   (Invoke-WebRequest 'http://127.0.0.1:13968/skin-assets/silver-wolf/assets/silver-wolf-badge.png' -UseBasicParsing).StatusCode
   ```
   两个都应为 `200`。
4. **强制刷新一次**，再重启 DSH。皮肤 1.0.11 的 CSS 使用 `no-cache`，图片仍有 1 小时缓存；旧页面可能缓存了 CSS 或 client module。
5. **检查是否同时激活了另一套皮肤**。manager 只允许一套活动皮肤；确认「深海女仆工坊」和「虎鲸链路」都是官方默认/禁用状态。
6. **确认没有手动改 patch**。如果 profile 的 managed 区段被手改，管理器的启动兜底可能回退官方默认。用「设置 → 皮肤」重新切换即可修复。

如果 CSS 加载成功但某些组件仍有圆角，见 [SELECTORS.md](SELECTORS.md)：这通常是 DSH 升级后新增了未覆盖的哈希类名，不是注入失败。

## 6. 浅色模式下的设置与菜单

聊天区/侧栏/composer 固定为银狼深色；设置对话框和账户菜单跟随 DSH「内置插件 → 外观」的浅色/深色选择。浅色模式下设置页和皮肤页应为浅色，这是 1.0.11 的预期行为。若设置页仍全黑，确认加载的是 1.0.11 CSS，而不是旧页面缓存。

## 7. 壁纸滑杆与 localStorage

- 位置：**设置 → 皮肤 → 银狼 · 像素骇入 → 壁纸装饰宽度**。
- 范围：640–920 px；默认 760 px；步进 10 px。
- 它只写 `--sw-wallpaper-width`，只作用于 `.sw-wallpaper-frame`：
  - **不会**改变聊天区列宽、消息宽度、composer 宽度。
  - **不会**改变任何文字字号、行高或字体。
  - **不会**改变窗口布局或侧栏宽度。
- 值由 dsh-skin-manager 持久化在浏览器 `localStorage` 的 `dsh.skin-settings.v1` 中，按 `silver-wolf` 存储；皮肤 client 监听 `dsh:skin-setting-change` 事件。**清除浏览器数据会回默认 760 px**。它不写入 `cordis.patch.yml`。
- 如果设置页没有出现滑杆：
  ```js
  window.__DSH_SILVER_WOLF__?.customization
  ```
  期望 `true`。若为 `false`，说明 client 没加载成功或 CSS 注入失败；先解决第 5 节。若为 `true` 但页面没有滑杆，确认活动皮肤是银狼，且已完整重启 DSH；当前 dsh-skin-manager 0.1.10 在活动皮肤下方渲染这个 range 控件。

## 8. 预览字段说明

`skin.json` 的 `preview.dark` 指向 `preview/dark.png`，该图是真实桌面窗口截图（已裁掉底部无关第三方组件），不是占位图。

**当前 dsh-skin-manager 0.1.10 不会在皮肤页渲染这个 preview 图。** 安装后看不到预览图是预期行为，不是安装失败；不要据此判断皮肤是否生效。

## 9. 卸载或切换

1. 在 **设置 → 皮肤** 切回官方默认。
2. 在左侧栏 **插件** 页卸载 `dsh-skin-silver-wolf-topic`。
3. 不要手动删 `node_modules` 里的目录，也不要手动清 patch；管理器会处理 bundle 选择和依赖。

## 10. 文件对照表

| 你手里的文件 | 包内路径 | 说明 |
|---|---|---|
| `images\bg.png` | `assets\original\silver-wolf-scene-original.png` | 原图副本，**未改动** |
| `images\bg.png` | `assets\silver-wolf-chat.png` | 裁切到银狼主体：从原图 `x=760..1920` 裁成 1160×1080；CSS 再叠加切角/遮罩 |
| `images\聊天区域正中间的装饰.png` | `assets\original\silver-wolf-badge-original.png` | 原图副本，**未改动** |
| `images\聊天区域正中间的装饰.png` | `assets\silver-wolf-badge.png` | 运行时像素徽章/头像点缀，176×200，显示尺寸 ≤88×100 |
| 由徽章派生 | `assets\icons\silver-wolf.png` | 256×256 插件图标，深色底、徽章居中 |
| 实际运行截图 | `preview\dark.png` | 1296×616，真实桌面窗口截图 |

### 替换素材时的建议

- 壁纸：当前 1160×1080。显示默认 760 px；若在 920 px 仍要接近 2× 清晰度，请提供 **1840×1714** 的裁切版本（保持银狼主体居中），替换 `assets/silver-wolf-chat.png`，不要靠放大旧图伪造分辨率。
- 徽章：建议保留透明通道，最长边 176–200 px；按 2× 计算，显示尺寸不要超过 88×100 CSS px。
- 壁纸 PNG 没有硬性尺寸/比例/单文件大小限制；建议单张 ≤8 MB、最长边 ≤4096。透明通道不是必需，但居中装饰建议有 alpha 或用 CSS mask。
- 不要生成占位图替换 `preview/dark.png`；如果重新截图，请从运行中的桌面窗口截取真实皮肤。

## 11. 选择器覆盖清单

见 [SELECTORS.md](SELECTORS.md)。其中包含全局兜底、面板、按钮、气泡、输入框、菜单、头像、壁纸和动画选择器，以及明确未覆盖的 OS/iframe 范围。
