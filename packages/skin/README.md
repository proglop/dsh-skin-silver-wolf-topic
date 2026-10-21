# 银狼 · 像素骇入

Silver Wolf // Pixel Intrusion，面向 DSH Desktop 的深色像素皮肤。

![preview](preview/dark.png)

本包是 [dsh-silver-wolf](../../) 仓库中的皮肤包，必须和同仓库的
`dsh-skin-manager` 一起安装：管理器负责“设置 → 皮肤”页面，本包负责皮肤
本身。

## 特征

- 蓝紫底深黑画布、实心面板、直角与像素网格
- 聊天区中央银狼装饰，随侧栏收展平移
- 壁纸宽度滑杆 640–920 px
- 浅色模式下设置页/账户菜单使用柔和中性色；聊天区保持深色
- 头像方块、添加文件按钮偏移、随机按钮闪烁均遵守 `prefers-reduced-motion`

## 安装

1. 从仓库 Releases 下载 `dsh-skin-manager-0.1.10.tgz` 和
   `dsh-skin-silver-wolf-topic-1.0.11.tgz`
2. 在 DSH 打开 **设置 → 插件**，先安装管理器，再安装皮肤
3. **完全退出 DSH 后重新打开**
4. 打开 **设置 → 皮肤**，选择“银狼 · 像素骇入”

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
pnpm --dir packages/skin pack --pack-destination release
```

## 许可

代码 MIT；图片素材不包含在 MIT 中，详见 [ASSETS.md](ASSETS.md)。
