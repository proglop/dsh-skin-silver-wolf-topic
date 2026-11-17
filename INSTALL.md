# 安装指南

## 前置条件

- **DSH Desktop 0.2.2-rc.3**（选择器同时兼容 0.2.1-rc.2/rc.3/rc.5、0.2.2-rc.1）
- 只安装本包即可。本包**内置多皮肤管理器**，不再依赖外部
  `dsh-skin-manager`；bundle patch 只插入一个 `ui-skin-silver-wolf` loader 行。
- 如果之前装过旧的 `dsh-skin-manager`，不要按旧文档再安装；在新管理器的
  “设置 → 皮肤”页面切换即可。

## 方式 A：npm 安装

本包发布到 npm 后，在 DSH 中打开：

**设置 → 插件 → 安装第三方插件**

填写包名：

```text
dsh-skin-silver-wolf-topic
```

如果当前插件管理器要求显式指定 npm 源，请按它的提示填写（部分版本接受
`npm:` 前缀，具体以管理器支持为准）。

安装完成后**完全退出 DSH，再重新打开**，然后进入 **设置 → 皮肤**。

## 方式 B：GitHub 安装

插件安装框填写：

```text
github:proglop/dsh-skin-silver-wolf-topic
```

GitHub 源的安装依赖 pnpm 的 git 依赖策略。如果安装失败，查看
`%USERPROFILE%\.dsh\profiles\desktop\pnpm-workspace.yaml`，必要时临时加入：

```text
blockExoticSubdeps: false
```

安装完成后建议改回，以重新开启 pnpm 的安全策略。

## 方式 C：本地 `.tgz` / 包目录安装

适合开发和离线测试：

1. 使用仓库 `dist/` 下最新的 `.tgz`；
2. 在插件安装入口选择该 tgz；
3. 或解包后把包含 `package.json` 的目录作为本地插件安装；
4. 安装完成后**完全退出 DSH，再重新打开**。

## 验证安装位置

实际加载位置为当前 profile 的 `node_modules`：

```text
%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-skin-silver-wolf-topic
```

可以用以下命令确认包版本：

```sh
node -p "require(process.env.USERPROFILE + '/.dsh/profiles/desktop/node_modules/dsh-skin-silver-wolf-topic/package.json').version"
```

预期输出：`1.1.3`。

## 不要使用

```sh
dsh plugin --profile desktop add ...
```

Desktop 是 Electron 保留 profile，这条命令会被 DSH 拒绝。请使用设置里的
**插件**安装入口。

## 安装后

1. 完全退出 DSH 并重新打开；
2. 打开 **设置 → 皮肤**；
3. 选择“银狼 · 像素骇入”；
4. 点击“预览”确认效果；
5. 在列表下方调整“壁纸宽度”（640–920 px，默认 760 px）。

壁纸宽度保存在浏览器 `localStorage`（键 `dsh.skin-settings.v1`），不会写入
`cordis.patch.yml`。

## 切换、导入、卸载与升级

- **切换皮肤**：在“设置 → 皮肤”点击目标皮肤的“使用”。切换后若提示需要重启，
  请完全退出 DSH 再打开。
- **恢复官方**：点击“恢复官方”；管理器页面会保留，方便再次开启皮肤。
- **导入本地皮肤**：点击“导入本地皮肤”，选择包含 `skin.json` 的本地皮肤包。
- **卸载皮肤**：在列表中选择皮肤并卸载。管理器不能卸载自身所属的包。
- **升级本包**：在插件管理器里安装新版本，然后完全退出并重新打开 DSH。

## 故障排查

| 现象 | 处理 |
|---|---|
| 安装后设置里没有“皮肤” | 完全退出 DSH 再打开；确认本包已启用，且没有同时安装旧 `dsh-skin-manager` |
| 皮肤生效但设置页仍是官方灰底 | 确认本包版本 ≥ 1.1.2；旧版设置页 token 未覆盖 |
| 选择模型等菜单仍半透明 | 使用 1.1.3+，并完全退出 DSH 再打开；1.1.3 将菜单面板改为 body 级实色 |
| 左上角“应用”菜单仍是圆角 | 这是 Electron 原生系统菜单，皮肤 CSS 无法修改；需 DSH 外壳层处理 |
| 切换皮肤后界面没变 | 插件包切换通常需要完全退出 DSH 再打开 |
| GitHub 安装失败 | 检查 pnpm `blockExoticSubdeps` 策略，或改用 npm/本地 tgz |

## 发布（维护者）

```sh
npm pack --dry-run
npm pack
npm publish --access public
```

发布前请确认 `README.md`、`preview/dark.png` 和 `LICENSE` 已进入 tarball；
素材授权说明见 [README 的“许可与素材权利”](README.md#许可与素材权利)。
