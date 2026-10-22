# 银狼 · 像素骇入

Silver Wolf // Pixel Intrusion，面向 DSH Desktop 的深色像素皮肤。

![preview](preview/dark.png)

*界面效果预览（包含角色素材，仅作演示，不随 MIT 授权）*

本包依赖
[dsh-skin-manager](https://github.com/proglop/dsh-skin-manager)。
**只安装本包即可**：pnpm 会自动安装管理器，本包的 bundle patch 会自动插入
管理器的 loader 行，“设置 → 皮肤”页面随之出现。不要单独安装管理器。

## 特征

- 蓝紫底深黑画布、实心面板、直角与像素网格
- 聊天区中央银狼装饰，随侧栏收展平移
- 壁纸宽度滑杆 640–920 px
- 浅色模式下设置页/账户菜单使用柔和中性色；聊天区保持深色
- 头像方块、添加文件按钮偏移、随机按钮闪烁均遵守 `prefers-reduced-motion`

## 安装

在 DSH 打开 **设置 → 插件**，只安装：

```text
github:proglop/dsh-skin-silver-wolf-topic
```

管理器会作为依赖自动安装，并由本包的 bundle patch 自动加载。安装后
**完全退出 DSH 再重新打开**，打开 **设置 → 皮肤**，选择
“银狼 · 像素骇入”。

实际加载位置为 profile 的 `node_modules`：

```text
%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-skin-manager
%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-skin-silver-wolf-topic
```

Desktop 是 Electron 保留 profile，**不要用
`dsh plugin --profile desktop add`**；该命令会被拒绝。

如果显示安装失败，请打开 `%USERPROFILE%\.dsh\profiles\desktop\pnpm-workspace.yaml`，添加以下内容以关闭 pnpm 安全策略（安装完成后建议改回，以重新开启安全策略）：

```text
blockExoticSubdeps: false
```

## 外观模式

仅提供深色配色（appearance: "dark"），不跟随 DSH 的 light 主题生成第二套配色——DSH 的 light 主题目前为实验性。聊天区、侧栏和 composer 始终深色；设置对话框和账户菜单跟随 DSH「外观」设置，浅色模式下这两处显示为浅色。实现细节见 [SELECTORS.md](SELECTORS.md)。

## 字体

- 不引入任何外部字体，只继承宿主字体栈。

## 已知范围

- 兼容性：DSH Desktop 0.2.1-rc.2 + [dsh-skin-manager](https://github.com/proglop/dsh-skin-manager) 0.1.11。哈希类名可能随 DSH 升级变化。
- 选择器针对 DSH 0.2.1-rc.2 的实际 DOM；哈希类名可能在 DSH 升级后变化。作用域通配圆角规则不依赖哈希类名，能继续覆盖硬编码圆角。
- Windows 原生窗口圆角、原生标题栏、内嵌浏览器 / iframe / canvas 终端内容不属于 DOM 皮肤作用域。
- 第三方插件不被本皮肤改写。
- 预览图 preview/dark.png 是真实桌面窗口截图（为隐私裁掉底部无关组件），仅作皮肤效果展示，其版权状态见下方「许可与素材权利」。

## 许可与素材权利

本仓库的**代码与文档**（`package.json`、`cordis.patch.yml`、`skin.json`、
`skin.css`、`lib/`、`*.md`）采用 **MIT** 许可，详见 [LICENSE](LICENSE)。

`assets/` 目录下的银狼主题图片文件（`silver-wolf-chat.png`、
`silver-wolf-badge.png`、`assets/icons/silver-wolf.png` 及
`assets/original/` 下的文件）**以及展示界面效果的 `preview/dark.png`
截图**，**不包含在 MIT 许可中，亦不授予任何其他许可**，保留所有权利。
这些文件来源于对官方素材的提取、裁剪或描改，不构成本仓库可再许可的原创
作品，不应被复制、分发或改编。

银狼（Silver Wolf）的角色名称、形象及相关知识产权归
**HoYoverse / miHoYo** 所有。本仓库不对任何底层角色 IP 授予许可。

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
├─ assets/                 # 角色素材，不适用 MIT，保留所有权利
│  ├─ silver-wolf-chat.png
│  ├─ silver-wolf-badge.png
│  ├─ icons/silver-wolf.png
│  └─ original/             # 来源存档，不随 MIT 分发
├─ preview/dark.png         # 皮肤效果预览图（包含角色素材）
├─ SELECTORS.md
├─ README.md
├─ LICENSE
└─ INSTALL.md
</details>
```