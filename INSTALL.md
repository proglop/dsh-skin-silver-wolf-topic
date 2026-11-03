# 安装

## 前置

只安装本包即可。本包**内置多皮肤管理器**，不再依赖外部
`dsh-skin-manager`；bundle patch 只插入一个
`ui-skin-silver-wolf` loader 行。

旧版 `dsh-skin-manager` 不需要单独安装；如果之前装过，可以在本包的
“设置 → 皮肤”页面里切换皮肤，旧管理器页面不会再生效。

## Desktop 安装步骤

在 **设置 → 插件** 中只安装：

```text
github:proglop/dsh-skin-silver-wolf-topic
```

安装后**完全退出 DSH 再重新打开**，打开 **设置 → 皮肤**，选择
“银狼 · 像素骇入”。管理器随本包一起加载。

安装后的实际位置：

```text
%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-skin-silver-wolf-topic
```

“设置 → 皮肤”支持安装列表、预览、切换、恢复官方、导入本地皮肤包和
卸载皮肤；银狼皮肤还提供壁纸宽度滑杆。

切换、导入或卸载后，如果页面提示需要重启，请**完全退出 DSH 再重新打开**；
只刷新界面不一定能让插件包变更生效。

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
