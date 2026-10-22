# D01 最新云端候选：测试和镜像构建结果

日期：2026-10-22。范围：用户明确允许复用已有构建机、独立目录测试和构建；不部署生产。

## 精确版本

- 主机：openmaic-build-20261022-06e1472，ap-east-1，独立目录 `/home/ubuntu/d01-qa-20261022-0298b3d6`。
- 基线：b5b7f02eaeba3f088ee576cfeb4b26b21e93817c；追加 11 个 D01 评分链、保存桥及测试文件。
- Git tree：0298b3d6fb5bfa0a35d852537b2c6dec925c6f8c（源码树，不冒充已推送 commit）。
- 源码包 SHA256：955937da7f97e08f70efee47c98cb296b62333ae7ebedc84cbced7ff5954a328。
- 镜像：wanli-d01-candidate:0298b3d6。
- 精确 image ID：sha256:a4f647b241371757ccf4e468213a12963cc64d34fbb093de73362e71a99fea55。
- 六课数据包：080f69ab8d2f45607f0f6ce921434cde433486aa911aec60bbf4713f8ce96435，仅挂载于隔离候选，不公开。

## 本轮实际通过

1. 19 个 Vitest 测试文件、131 项测试通过；7 项 Node D01 portfolio bridge 测试通过，共 138 项。
2. TypeScript `--noEmit --incremental false` 通过。完整流水线退出码 0。
3. linux/amd64 学生端镜像构建通过，镜像 label 绑定上述源码树。
4. 真实 compiled `/api/pbl/v2/evaluate`：合成 task 和 milestone 不计分请求均只返回一个 done，不调用模型、不产生评分。65 ms / 19 ms 是无需模型的接口耗时，绝非讨论语音延迟。
5. 六课 r03 JSON API 全部读取成功，每课 9 场景；54 段配音全部 HTTP 206、audio 类型、返回非空字节。
6. 对六课实际 authored 项目各验证 task / milestone 不计分入口，共 12 次，只返回 done。

证据已取回：`output/d01-cloud-0298b3d6-evidence/`，包含 pipeline.log、exit.status、image-id.txt、boundary.json、media-smoke.json、runtime-state.json、runtime.log。

## 失败也保留

- 首轮树 624da014 单测通过，但测试断言访问未收窄 union，触发 TS2339，流水线退出 2、没有构建最终镜像。修正为匹配完整 evaluation 对象后才重新冻结第二轮。没有删除断言、跳过测试或放宽类型检查。
- 首次资源 smoke 使用 root 且 cap-drop=ALL，无法遍历 1000 所属的 0700 任务目录，导致脚本无法读取；这是测试挂载权限问题。改以目录所属 UID/GID 1000:1000 运行并将输出写入任务目录，没有放宽目录权限或容器 capability。随后同一精确镜像 smoke 通过。
- 原 Dot 交接包仍是第一轮前的未验收补丁，不要再用它代表本轮通过版本。

## 收尾和边界

- 测试容器和 smoke 容器退出码 0、无 OOM。候选 Web 在 smoke 后显式 docker stop，最终 exited 143、无 OOM；这是主动 SIGTERM 停止，不是测试失败。
- 现场 docker ps 没有运行容器。原镜像 release-f33f318b59f6 仍是 sha256:b7eedabb4d63dc08c1a2f67fdcbaf3138aae751c130d60213003f84c3cd02daf；原发布目录未修改。
- 构建机保持用户原有运行状态，未停止／删除实例。新建缓存及失败记录保留在本任务目录，磁盘仍约 137 GiB 可用。
- 未注册 runner、未新开机器、未跑 GitHub hosted job、未上传生产密钥、未推送／合并、未部署 class.wanli.ai。本机没有启动 Next、Docker 构建或浏览器验收。

## 仍未完成的六课质量门

本轮是程序和 API／媒体字节验证，不能证明人耳听感、完整播放、1.2 倍单层语速、390px／键盘可操作、完整 PBL 提交与刷新恢复、真实 AI 教练反馈、v01→评议→学生 v02→展示作品链。D01-06 两件不同且可重开的展品仍待完成。新镜像尚未重新跑浏览器回归，不能沿用旧镜像的 10 项测试。

下一步应在此精确候选的云端隔离环境完成真实播放器与作品链验收，再独立教学复核；本轮不得宣称六课 SHIP 或端到端完成。
