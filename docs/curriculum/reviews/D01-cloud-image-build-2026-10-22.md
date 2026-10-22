# D01 学生端云端镜像候选构建

日期：2026-10-22。状态：第二轮精确候选的程序回归及镜像构建已通过；未包含随后评分链修复或 D01 r03 作品桥，未部署，六课完整验收未通过。

## 终态复核（2026-10-22，优先于下方历史过程）

- 现场重新查询原 run `39745583310`，已于 `2026-10-22T08:14:39Z` 完成，结论 `success`；没有新启 Actions 任务。
- 精确源码 `b5b7f02eaeba3f088ee576cfeb4b26b21e93817c`；15 个文件、87 项单元测试通过，TypeScript 通过。
- linux/amd64 learner 镜像构建成功，ID `sha256:a9b2d44a19675e134fa3e40feb48241fc4951552a49802e7d26c81c9e2a4089d`。合成 task 级不计分 API 检查通过。
- 桌面／手机共 10 项浏览器测试通过。已阅读该提交的测试源码：实际覆盖首页、课程筛选、系列说明、来源／语言政策及教师投稿入口；不含课堂声音、PBL 全程提交恢复或六课作品链。CI 设置下禁用了本地图片拦截替身，但不能据此推断所有课件媒体通过。
- 镜像制品 ID `12411756216`，260773374 bytes，平台保存至 `2026-10-23T08:14:20Z`；QA 制品 ID `12410739380`，21468181 bytes，保存至 `2026-10-29T08:14:26Z`。已开始取回，以免现有构建制品过期后被迫重建。
- 原始状态记录：`output/d01-cloud-build-39745583310-status.json`。构建日志及当前状态是本轮证据；下文此前“尚未知终态”仅保留历史经过。
- 此版本相对 main 只有 7 个构建／测试／缺失模块文件，不包含之后新增的 milestone／final 不计分链修复、D01 portfolio bridge 或 r03 六课候选。不得直接把它当作六课最终发布镜像。
- Dot 回执已明确 Docker 权限不足，暂不能承担镜像构建。无 Docker 的针对性测试包已准备，尚无 Dot 执行结果。
- 制品取回已完成：`output/d01-cloud-build-39745583310/` 包含镜像和 QA 文件。`shasum -a 256 -c image.tar.gz.sha256` 实测 OK，源码 SHA／image-id 与上述一致。真实 compiled task API 证据只有一个 `done` 事件、耗时 18 ms（这是不调用模型的边界测试时间，不是讨论／语音延迟）。本机没有加载镜像或启动 Docker。

## 原因与授权

线上旧镜像在不计分准备度任务中仍返回分数；主分支已有 evaluator 防护，需要精确新镜像验收，不能把环境配置修改当成程序发布。

用户明确允许启用 `JamesWuHK/OpenMAIC` GitHub Actions，仅用于云端构建和测试。现场读取 Actions 为 disabled 后才启用，复核 `enabled=true`。不启用付费／大型运行器，不传 AWS 或模型密钥，不自动部署。

## 精确范围

- 基线：已合并 main `06e1472b66147b57a2a3aabf2511aba1e6d09fdd`。
- 专用分支：`codex/learner-cloud-build`。
- 候选提交：`7671bec3ab0d1c286eea137b2dcbb5ca4fcc1007`。
- GitHub 任务：<https://github.com/JamesWuHK/OpenMAIC/actions/runs/39745159480>。
- 仅追加五个构建／测试文件：workflow、镜像 API 边界测试、learner Playwright 配置、现有网页测试的实镜像媒体路径、evaluator 不计分回归测试。
- 使用独立临时 Git index，从 main 建树；没有切换当前分支、改变主工作区 index，或夹带其他脏文件。
- 不包含六课未发布候选、工作区桥接修正、环境范例改动、素材删除或 package.json 修改。生产 `learner.env` 继续独立保留。

## 测试门

1. 依赖锁定安装；相关 PBL／learner／安全测试；TypeScript。
2. GitHub 标准 `ubuntu-24.04` 上构建 `linux/amd64` learner 镜像，保留禁用作者功能的构建参数。
3. 启动该精确镜像。模型配置仅使用明显的合成占位 Key，endpoint 指向容器本地不可用端口；不使用供应商服务。
4. 合成不计分反思调用真实 compiled `/api/pbl/v2/evaluate`，必须只有一个 done 事件；任何 token、tool、evaluation 或错误均失败。
5. 同一镜像运行既有桌面／390px learner 网页测试，不再拦截媒体请求用本地文件伪造成功，也不另起 next dev。
6. 全部通过才导出 image、镜像 ID、源码 SHA、压缩包 SHA256；制品保存一天，测试证据七天。没有生产发布步骤。

Actions 均固定为官方仓库现场解析的 commit SHA；运行 token 仅 `contents:read`，checkout 不保留凭证。

本地只执行语法、YAML 解析、格式和 diff 检查，均通过。初次尝试使用未安装的 `yaml` 包解析失败，改用项目已有 `js-yaml` 后通过，没有安装额外依赖。未在本地跑测试、构建、浏览器或服务。

## 本机清理

- `.next` 3049 MB，Git 忽略的 Next 构建产物；现场没有 next/dev/build 进程、3000 监听或该目录打开文件。按授权用 `trash` 精确回收。
- 本任务未清空废纸篓；协调清理随后报告已精确删除该缓存。本任务再次 `df -h /` 实测可用约 22 GiB。不把其他线程执行的删除记成本任务操作。
- `.Trash/openmaic-tts-release-Bu4xYk` 与 `...-eLmvVC` 各约 155 MB，递归 diff 没有差异，无 `.git`，但包含约 12 MB data 与 docs。只证明两份彼此重复，未证明其资料全部可由现行仓库重建，故未删除。

## 未通过项保持不变

首轮 `39745159480` 已结束：14 个文件、86 项相关测试通过，TypeScript 失败。确切错误为 `instrumentation.ts(107,18): TS2307 Cannot find module '@/lib/server/install-process-shutdown-handlers'`。

该文件现场存在于工作区但未被 Git 跟踪；主分支已导入它，因此干净云端 checkout 暴露了本地文件掩盖的依赖缺失。已核对现有实现仅在 Node runtime 安装一次性 SIGTERM/SIGINT 回调，补入候选分支并增加不发送真实进程信号的回归测试，保持类型门不变。没有拷入其他 untracked 源码。

修复提交 `b5b7f02eaeba3f088ee576cfeb4b26b21e93817c` 已推送；新 run <https://github.com/JamesWuHK/OpenMAIC/actions/runs/39745583310> 现场确认为 `in_progress`。后续应跟踪这个句柄，不能复用首轮结果作为该提交的通过证据。

一次 GitHub 状态读取发生 EOF，重新查询同一 run 后取得上述已失败终态，才提交修复重跑；没有因观测中断重复运行旧任务。

未生成或验收镜像，未提交 PR／合并主分支，未替换生产容器，未重启 Caddy，未发布六课。

此流程只能提供程序边界和现有网站的回归证据，不是 D01 六课的 PBL 全程、真实音频、作品链、语言、移动／键盘或教学质量验收。课程继续保持 BLOCK；构建成功后仍须审阅精确制品与相应证据，再执行符合发布门的部署与线上复验。
