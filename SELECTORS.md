# 选择器覆盖清单
本清单基准为 DSH Desktop 0.2.1-rc.2。升级 DSH 后请用第 11 节的审计脚本重新核对，不要直接套用到新版本。

作用域为 `body[data-dsh-silver-wolf]`。主题 alias 令牌挂在 `.BynINW_frame`；设置对话框、账户菜单等 portal 使用 DSH 的浅/深 token。基准 DOM：DSH Desktop **0.2.1-rc.2**（dsh-skin-manager 0.1.10）。哈希类名会随 DSH 升级变化；本清单同时列出较稳定的属性/角色选择器。

## 1. 全局圆角兜底

```css
body[data-dsh-silver-wolf] *,
body[data-dsh-silver-wolf] *::before,
body[data-dsh-silver-wolf] *::after {
  border-radius: 0 !important;
  corner-shape: square !important;
}
```

同时把 `--dsw-radius-xs/sm/md/lg/xl/panel` 设为 `0px`，`--dsw-corner-shape` 设为 `square`。这是覆盖 DSH 中硬编码 `border-radius: 50%`、`999px`、`100px` 和 `corner-shape: round` 的最终兜底。

## 2. 画布、侧栏、聊天区

| 选择器 | 目的 |
|---|---|
| `.BynINW_frame` | 蓝紫深黑画布 + 4px 细像素格栅 + 两处霓虹渐变；`prefers-reduced-motion: no-preference` 时给侧栏 280ms 缓出过渡 |
| `.BynINW_centerCol` | 透明化，让壁纸层显示在聊天区背景上 |
| `.BynINW_sidebarCol` | 侧栏深黑底、1px 蓝边 |
| `._2H3hWW_root` | 侧栏实心底 + 5px 像素点阵 |
| `.Dc7zOa_root` | 聊天根透明 |
| `.Dc7zOa_header` | 透明头部 + 1px 分段下边线 |
| `[data-conversation-content]` | `isolation: isolate`，容纳负 z-index 壁纸层 |
| `.Dc7zOa_composerSeat` | 底部实心渐隐，保证输入器文字可读 |
| `::selection` | 青色半透明选区 |

## 3. 实心面板 / 菜单 / 弹层

```css
body[data-dsh-silver-wolf] :is(
  [role="dialog"],
  [role="alertdialog"],
  [role="menu"],
  [role="listbox"],
  [data-menu-material],
  [data-radix-popper-content-wrapper] > *,
  .wCInkW_panel
)
```

- 实心底 `--sw-panel-900`，无 `backdrop-filter`。
- 1px 蓝灰边 + 硬像素投影，不是毛玻璃。
- `.wCInkW_panel` 和 `[data-slot="sidebar.settings"] [role="dialog"]` 用非对称切角：
  - 右上切 18px
  - 左下切 26px
- `[role="tooltip"]`、`[class*="bubble"][role="tooltip"]`：实黑底、蓝边、硬投影。
- `hr`、`[role="separator"]`：2px/2px 分段像素线。

## 4. Composer 与输入控件

| 选择器 | 目的 |
|---|---|
| `[data-composer-card]` | 透明化自身，避免裁切菜单；去掉矩形 outline/box-shadow |
| `[data-composer-card]::before` | 外层 1px 边框面，`z-index:-2`，沿右上 14px / 左下 22px 切角裁切 |
| `[data-composer-card]::after` | 内层网格面，`inset:1px`、`z-index:-1`；4px 点阵 + 细格栅铺满左右边缘 |
| `[data-composer-card]:focus-within::before` | 粉红边框面；沿右上/左下切角闭合，并带轻微粉红光晕 |
| `[data-composer-card] button[class*="RlGAzG_add"]` | JS `installComposerAddOffset()` 将添加文件按钮内联平移 10px；只移动按钮，不移动编辑器/模式/发送 |
| `[data-composer-card] [contenteditable="true"]` | 透明编辑区、青色光标、无圆角 |
| `[data-composer-card] textarea` | 同上 |
| `input:not([type="range"]):not([type="checkbox"]):not([type="radio"])` | 实心输入底 + 1px 边 + 内阴影 |
| `textarea`、`select` | 同上 |
| `input::placeholder`、`textarea::placeholder` | 蓝灰占位色 |

## 5. 按钮状态

### 发送

```css
button[aria-label="发送消息"],
button[aria-label="排队发送"],
button[aria-label="插话发送"],
button[aria-label="Send message"],
button[aria-label="Queue message"],
button[aria-label="Steer message"]
```

- 可发送：34×34 正方形；`--sw-blue-600` 实底；白色箭头；只有 inset 高光/暗边，**没有外发光**。
- `:disabled`：`#141821` 黑灰实底；箭头 `opacity: .3`；无粉红、无发光。
- `:hover:not(:disabled)`：主蓝提亮。

### 停止

```css
button[aria-label="停止生成"],
button[aria-label="Stop generating"]
```

- 粉红 `--sw-pink-500` 实底，白色方块；`svg rect { rx:0; ry:0 }` 把宿主 3px 圆角方块改成直角。

### 通用 primary / outline

| 选择器 | 目的 |
|---|---|
| `button[class*="_primary_"]` | 确认类按钮：蓝实底、白字、直角 |
| `button[class*="_primary_"]:disabled` | 黑灰实底 |
| `button[class*="_outline_"]` | 透明底、1px 蓝灰边 |
| `button[class*="_outline_"]:hover` | 深蓝面板底 |
| `[class*="j_8BDW_actionRow"] > button:first-child` | 批准面板「不允许/拒绝」：黑灰实底 |
| `[class*="j_8BDW_actionRow"] > button:last-child` | 批准面板「允许一次」：蓝色实底 |
| `[data-question-key] button[class*="_outline_"]` | 用户问题面板的拒绝项：黑灰实底 |

### 焦点

```css
button, a, input, textarea, select, [contenteditable="true"],
[role="button"], [role="menuitem"], [role="option"], [role="tab"]
:focus-visible
```

- 1px 粉红 outline + 1px 粉红阴影。
- 同时把 `--dsw-focus-ring-color` 设为粉红，让宿主已有的 `box-shadow` 焦点环跟随。

## 6. 聊天气泡、工具卡、设置卡

| 选择器 | 目的 |
|---|---|
| `[data-chat-flow-kind="user"] [class*="_bubble"]` | 用户气泡实心面板、右下 8px 切角 |
| `[data-chat-flow-kind="steering"] [class*="_bubble"]` | 插话气泡同上 |
| `[class*="_userStack"] [class*="_bubble"]` | 兜底用户/队列气泡 |
| `[class*="_flowItem"] [class*="_card"]` | 工具/流程卡实心底 + 硬投影 |
| `[data-tool] > [class*="_card"]` | 工具卡实心底 |
| `[class*="_settingsCard"]` | 设置卡实心底 |
| `[data-chat-flow-kind="turn-process"] [class*="_callRow"]` | 工具调用行：1px 边 + 半透明深底 |
| `[data-chat-flow-kind="tool-call"] [class*="_callRow"]` | 工具调用行 |
| `.j_8BDW_card` | 批准卡片实心 + 非对称切角 |
| `.P2izSq_card` | 问题卡片实心 + 非对称切角 |
| `.mAtvLq_card` | 计划/问题卡片实心 + 非对称切角 |

## 7. 银狼元素

| 选择器 | 目的 |
|---|---|
| `[class*="_brandName"]::after` | `SW // VIP` 活动徽章，绝对定位在 `deepseek HARNESS` 右侧 7px；切角、青蓝描边、微光，不参与品牌行布局 |
| `[class*="_avatar"]` | 24px 账户头像框基座，隐藏圆角、加蓝色像素边；**没有**兔耳/角伪元素 |
| `.sw-avatar-pin` | JS 追加的小像素徽章；14×16，`image-rendering: pixelated` |

`SW // VIP` 紧邻 `deepseek HARNESS` 右侧；绝对定位使它不会推挤侧栏开关或改变品牌行宽度。宽度 ≤1500px 时隐藏，避免窄侧栏裁切。用户头像只保留方形边框和小徽章，没有耳朵/角。

## 8. 壁纸

| 选择器 | 目的 |
|---|---|
| `.sw-wallpaper-frame` | JS 插入到 `[data-conversation-content]` 第一个子节点 |
| `width: min(var(--sw-wallpaper-width,760px), 80vh*1.074, 94%)` | 只控制装饰宽度 |
| `position:absolute; left:50%; top:47%; z-index:-1` | 聊天区居中、位于所有内容之下 |
| `clip-path: polygon(...)` | 左上 28 / 右上 62 / 右下 26 / 左下 52px 非对称切角 |
| `mask-image` 双线性渐变 | 四边柔化，避免硬矩形边 |
| `[data-content-phase="hero"]` | 首屏空会话时 44% 位置、0.34 不透明度 |
| `[data-content-phase="active"]` | 对话中 47% 位置、默认 0.24 不透明度 |
| `@media (width<=720px)` | 宽度上限 88%，避免小窗溢出 |

`skin.css` 里的 `--sw-wallpaper-width` 由 dsh-skin-manager 的 range 控件发出 `dsh:skin-setting-change` 事件，再由皮肤 client 写入 `document.body.style`；没有改任何聊天宽度/字体令牌。

## 9. 加载态、滚动条、动画

| 选择器 | 目的 |
|---|---|
| `[class*="spinner"]`、`[class*="Spinner"]` | 方形化 + 8 步阶跃旋转 + 青色微光 |
| `[class*="loading"]`、`[class*="Loading"]` | 同上 |
| `[class*="_skeleton"]` | 4px 像素格栅骨架 |
| `*::-webkit-scrollbar-thumb` | 直角蓝色滚动条 |
| `*` 的 `scrollbar-color` | Firefox/标准属性 |
| 发送/停止/模式按钮 `::after` | 像素扫描线，7.5s 循环 |
| `.sw-flicker-css` | 无 Web Animations 时的 CSS 闪烁回退 |
| `@media (prefers-reduced-motion: reduce)` | 关闭扫描线、闪烁和本皮肤自定义过渡；宿主侧栏过渡仍由 DSH 自己的 reduced-motion 策略控制 |

JS 闪烁用 `Element.animate` 给每个按钮独立随机 5–60s 延迟，是真正随机；不是 CSS 固定周期。

## 10. 明确未覆盖 / 不受 CSS 控制

- **Windows 原生窗口圆角和原生标题栏**：OS 绘制，不在 DOM 内。
- **iframe、内嵌网页、canvas 终端、第三方 webview**：跨文档，全局 CSS 不穿透。
- **第三方插件自己的组件**（例如本机 `dsh-whale-widget`）：不会被本皮肤改写。
- **SVG 图标内部的圆形/圆角路径**：`border-radius` 不影响 SVG 内部 `<circle>`；需要逐个改 path 的图标不属于“按钮圆角”范围。
- **DSH 升级新增的哈希类名**：如果新增组件带自己的 `border-radius`，全局 `*` 兜底仍会压平；但它的面板/颜色可能沿用新的令牌，需要按新 DOM 补一条规则。

## 11. 审计建议

在运行中的页面控制台执行下面这段（只读，不改 DOM），可以列出当前仍带非零圆角的元素：

```js
[...document.querySelectorAll('body[data-dsh-silver-wolf] *')]
  .map(el => [el, getComputedStyle(el).borderRadius])
  .filter(([, r]) => r && !/^0(px)?( 0(px)?){0,3}$/.test(r))
  .slice(0, 50)
  .map(([el, r]) => `${el.tagName}.${el.className} => ${r}`)
```

正常情况下应为空数组。若出现条目，优先把选择器补进 `skin.css` 的组件区，而不是放宽全局兜底。
