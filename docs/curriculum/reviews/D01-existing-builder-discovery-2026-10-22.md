# D01 已有云端构建机现场发现

2026-10-22 香港时间。本轮只读检查；没有创建、重启、停止、删除实例，没有注册 runner 或改变服务。

## 已证实

- AWS default 现场身份属于账号 598120810641。
- ap-east-1 存在 `openmaic-build-20261022-06e1472`：running，2 vCPU、8 GB RAM，Ubuntu 24.04、x86_64。创建时间为 2026-10-22 16:18:14 +08:00。
- 标签：Temporary=true、Purpose=openmaic-release-build、ReleaseSHA=06e1472b66147b57a2a3aabf2511aba1e6d09fdd。
- 使用 Lightsail 短期 SSH 连接成功，临时认证文件在 finally 中移除；没有读取远端环境变量或生产密钥。
- 远端采样：7816 MiB 总内存、6900 MiB available，根卷 146 GiB available，load average 0.00/0.15/0.58；这些是采样，不是未来资源保证。
- Docker daemon 正常，`docker ps` 没有运行容器。已有镜像 `openmaic-learner-openmaic:release-f33f318b59f6`（短 ID b7eedabb4d63、865 MB）。
- 已有 `/opt/openmaic-releases/20261022-main-06e1472/source` 和 58469-byte build.log。没有更改或删除这些文件。未读取日志全文，未验收该镜像。

## 尚不能推断

- 这台机器不是本轮创建的；尚未确认其当前操作归属、是否已安排后续工作、允许使用的时段及清理安排。
- 空闲采样、标签和已有镜像不等于本任务获得占用、覆盖、删除或长期运行许可。
- Dot 当前环境的 Docker 权限不足与此实例是两件事，不能互相替代证据。

## 下一步的明确选择

请用户确认是否允许本任务复用这台已有临时构建机，在独立新目录执行最新 D01 补丁的单元／类型检查，之后按质量门进行精确镜像与课堂验收。不触碰原发布目录、镜像和生产站点，不注册公网 PR runner，不新建实例。确认后先重查正在运行的工作，避免并发冲突。

此前“没有可用云端执行主机”的判断被此新发现部分更新为“找到可连通主机，待确认占用”；不是已经执行测试。目标仍未完成。

## 用户确认后执行（2026-10-22）

用户已明确回复“允许复用，按上述范围执行”。再次检查主机空闲、没有运行容器后，创建独立目录 `/home/ubuntu/d01-qa-20261022-624da014`；未修改 `/opt/openmaic-releases`。

- AWS MCP 已检查，当前只提供文档工具，无 run_script；没有通过 Bash 运行 AWS CLI。使用官方 Lightsail SDK 和既有 default 登录凭证核对账号／实例，再取得短期 SSH，认证临时文件自动清理。
- 基线 b5b7f02eaeba3f088ee576cfeb4b26b21e93817c，加 11 个明确 D01 源码／测试文件；用临时 Git index 冻结树 `624da014d0e7a1b090343b5c062e216ae7d5a034`。不包含并行课程对 InteractiveIframeHost 或 package.json 的改动，不修改当前分支或真实 index。
- 源码包 SHA256 `67d8530d811c7fb5ddc15a52b36042d82304c146bea1893e380072cc99196f5d`，远端解包前校验通过。
- 隔离依赖／测试镜像采用 `wanli-d01-deps:624da014`、`wanli-d01-qa:624da014`，测试容器限制 1.5 CPU、5 GB RAM、关闭额外 capabilities，不带模型／AWS 生产密钥。
- 后台流水线 PID 3630，真实观察为运行中、正在锁定依赖安装。单测、桥接测试和类型门全部通过后才继续构建 `wanli-d01-candidate:624da014`。日志、退出码和镜像 ID 留在独立任务目录。
- 本机仅准备源码快照和连接脚本；没有本机 next／Docker／浏览器运行。没有注册 runner、推送 GitHub、启动 hosted CI 或部署生产。

上述为启动记录，不是通过结论；后续以同一 PID、退出码和日志核对终态，不能因 SSH 观察超时重复启动。

### 第一轮实际结果及修正

- `624da014` 的 19 个 Vitest 文件／131 项测试、7 项 Node bridge 测试全部通过；随后 TypeScript 失败，容器 ExitCode=2、OOMKilled=false。最终镜像未构建。
- 精确错误：`tests/pbl/v2/evaluator.test.ts(150,37) TS2339`，断言读取未收窄 union 的 evaluation 属性。已改成检查完整 `{kind: evaluation, evaluation: {kind: milestone}}` 对象形状，没有删除断言或放宽类型门。
- 第一轮日志取回到 `output/d01-cloud-624da014-evidence/pipeline.log`。流水线原退出码相对路径落在 source/exit.status；第二轮改用独立任务目录的绝对路径，避免观测误判。
- 第二轮冻结树 `0298b3d6fb5bfa0a35d852537b2c6dec925c6f8c`；源码包 SHA256 `955937da7f97e08f70efee47c98cb296b62333ae7ebedc84cbced7ff5954a328`。新目录 `/home/ubuntu/d01-qa-20261022-0298b3d6`，首轮目录／镜像及原发布目录全部保留。
- 六份 r03 候选附属数据包另行上传，仅在构建机挂载，不进公开目录。SHA256 `080f69ab8d2f45607f0f6ce921434cde433486aa911aec60bbf4713f8ce96435`。静态确认 6 × 9 旁白路径和非空文件，尚非听感或真实浏览器播放通过。
