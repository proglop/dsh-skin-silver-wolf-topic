# 安装

## 前置

只安装本包即可。`dsh-skin-manager` 是本包的 **dependencies**，安装时由 pnpm
自动拉取；本包的 bundle patch 会自动插入 `ui-skin-manager` 和
`ui-skin-silver-wolf` 两个 loader 行。

**不要单独安装管理器**，否则可能出现重复 loader 行。旧版本地管理器请先
删除，再安装本包。

## Desktop 安装步骤

在 **设置 → 插件** 中只安装：

```text
github:proglop/dsh-skin-silver-wolf-topic
```

安装后**完全退出 DSH 再重新打开**，打开 **设置 → 皮肤**，选择
“银狼 · 像素骇入”。管理器会随本包自动安装并加载。

安装后的实际位置：

```text
%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-skin-manager
%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-skin-silver-wolf-topic
```

## 不要使用

```sh
dsh plugin --profile desktop add ...
```

Desktop 是 Electron 保留 profile，这条命令会被 DSH 拒绝。请使用设置里的
插件安装入口。

## 壁纸宽度

选中银狼后，在 **设置 → 皮肤** 的皮肤列表下方会出现“壁纸装饰宽度”滑杆，
范围 640–920 px，默认 760 px。该值保存在浏览器 localStorage，不写入
`cordis.patch.yml`。
