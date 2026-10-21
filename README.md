# 银狼 · 像素骇入

Silver Wolf // Pixel Intrusion，面向 DSH Desktop 的深色像素皮肤。

![preview](preview/dark.png)

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

## 开发

本包无需构建。`lib/client.js` 是手写的 `window.__ModuleLoader__.load`
bundle，`skin.css` 直接随包分发。

```sh
pnpm pack --pack-destination release
```

## 许可

代码 MIT；图片素材不包含在 MIT 中，详见 [ASSETS.md](ASSETS.md)。
