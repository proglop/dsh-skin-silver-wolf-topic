# 安装

## 前置

必须同时安装：

- `dsh-skin-manager`（同仓库 `packages/manager`）
- `dsh-skin-silver-wolf-topic`（本包）

只安装皮肤包时，DSH 不会出现“皮肤”设置页；管理器负责发现和切换皮肤。

## Desktop 安装步骤

1. 从 Releases 下载：
   - `dsh-skin-manager-0.1.10.tgz`
   - `dsh-skin-silver-wolf-topic-1.0.11.tgz`
2. 打开 DSH：**设置 → 插件**。
3. 先安装管理器，再安装皮肤包。
4. **完全退出 DSH 后重新打开**。
5. 打开 **设置 → 皮肤**，选择“银狼 · 像素骇入”。

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
