# 银狼 · 像素骇入 (Silver Wolf // Pixel Intrusion)

> 面向 DSH Desktop 0.2.1-rc.2 的银狼主题皮肤包 · 深色 · 像素风 · 含壁纸装饰滑杆

## 运行时依赖

本皮肤通过 [dsh-skin-manager](https://github.com/xiaoyangcheng84-svg/dsh-skin-manager) 发现、安装和切换。皮肤本身（`skin.css`、`lib/client.js`、`skin.json`、素材）为本包原创；manager 是独立安装的运行时框架，不随本包分发。

## 特征

- 蓝紫底深黑画布，实心面板，无毛玻璃。
- 全局直角：设计令牌设为 0，同时用作用域通配规则压平 DSH 里硬编码的 `border-radius: 50% / 999px` 和 `corner-shape: round`。
- 聊天区中央的银狼位图装饰，随左侧栏收展平移；位于 `[data-conversation-content]` 内，`z-index: -1`，不盖聊天文字。
- 可发送的发送按钮：蓝色实底 + 白色箭头，无额外边框发光。
- 不可发送：黑灰实底，箭头变暗。停止：粉红实底 + 白色方块。
- 粉红只用于停止按钮、键盘焦点环和活动标记。
- 每个按钮独立的 5–60 秒随机闪烁；状态按钮额外有像素扫描线；遵守 `prefers-reduced-motion`。
- 银狼低密度元素：方形头像框 + 像素徽章、`deepseek HARNESS` 右侧的 `SW // VIP` 活动徽章、非对称切角面板。用户头像不带兔耳或角。
- 添加文件按钮右移 10px，避开 composer 左边缘；不移动编辑器、模式控件或发送/停止按钮。
- composer 用双层裁切结构：外层 1px 边框、内层 4px 点阵格栅都沿右上 / 左下切角闭合。聚焦时粉红边框也沿切角走，不再是矩形外框。
- 侧栏收起保留 280ms 的缓出过渡；`SW // VIP` 绝对定位在品牌文字右侧，不参与布局，因此不推挤侧栏开关或造成品牌行宽度跳动。
- 设置 → 皮肤内的「壁纸装饰宽度」滑杆，640–920 px。

## 安装（本地目录）

见 [INSTALL.md](INSTALL.md)。本地交付场景的路线是左侧栏「插件」→ 安装第三方插件 → 填写解包后的皮肤目录绝对路径。不要手动编辑 profile 的 dsh.profile.bundles 或两层 cordis.patch.yml 的 managed 区段。

## 外观模式

仅提供深色配色（appearance: "dark"），不跟随 DSH 的 light 主题生成第二套配色——DSH 的 light 主题目前为实验性。聊天区、侧栏和 composer 始终深色；设置对话框和账户菜单跟随 DSH「外观」设置，浅色模式下这两处显示为浅色。实现细节见 [SELECTORS.md](SELECTORS.md)。

## 壁纸滑杆

设置 → 皮肤内提供「壁纸装饰宽度」滑杆（640–920 px，默认 760 px）。它只改变壁纸装饰宽度，不影响聊天列宽、消息宽度或字号。值存在浏览器本地，清除数据会回默认值。

## 字体

- 不引入任何外部字体，只继承宿主字体栈。

## 已知范围

- 兼容性：DSH Desktop 0.2.1-rc.2 + dsh-skin-manager 0.1.10。哈希类名可能随 DSH 升级变化。
- 选择器针对 DSH 0.2.1-rc.2 的实际 DOM；哈希类名可能在 DSH 升级后变化。作用域通配圆角规则不依赖哈希类名，能继续覆盖硬编码圆角。
- Windows 原生窗口圆角、原生标题栏、内嵌浏览器 / iframe / canvas 终端内容不属于 DOM 皮肤作用域。
- 第三方插件不被本皮肤改写；预览截图已裁掉它。
- 预览图 preview/dark.png 是真实桌面窗口截图（为隐私裁掉底部无关组件），不是占位图。

## 素材权利

角色与原始插画版权归其权利方（HoYoverse / miHoYo 及原作者）。本包是本地非商业外观定制，不授予原图版权。代码使用 UNLICENSED 标记，见 LICENSE。

## 文件结构

<details>
<summary>点击展开</summary>

```text
dsh-skin-silver-wolf-topic/
├─ package.json
├─ cordis.patch.yml        # 包自身的 ui-skin-silver-wolf 行
├─ skin.json               # manager 发现的清单；preview 字段已填
├─ skin.css                # 真实加载的样式资产
├─ lib/
│  ├─ index.js             # 同源 /skin-assets/silver-wolf/ 路由
│  └─ client.js            # 注入 CSS、壁纸、头像框、闪烁、滑杆注册
├─ assets/
│  ├─ silver-wolf-chat.png
│  ├─ silver-wolf-badge.png
│  ├─ icons/silver-wolf.png
│  └─ original/             # 用户提供的两张原始 PNG，未修改
├─ preview/dark.png
├─ SELECTORS.md
├─ README.md
├─ LICENSE
└─ INSTALL.md
```

</details>