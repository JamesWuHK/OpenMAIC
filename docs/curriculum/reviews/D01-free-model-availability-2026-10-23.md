# D01 线上免费模型可用性复核（2026-10-23）

结论：**当前线上 PBL 评测无法取得模型结果，保持 BLOCK；本轮没有修改线上配置或部署镜像。**

- 现有学生端容器的 `DEFAULT_MODEL` 仍为 `openrouter:minimax/minimax-m3.1-flash:free`，OpenRouter Key 存在于容器环境但本轮没有读取、输出或保存明文。
- 对线上既有无状态 `/api/pbl/v2/evaluate` 提交一份明确标注为 QA 合成、未执行 Blender 的 D01-01 驱动问题文本：HTTP 200、SSE `done`，但同时有 `LLM_ERROR`，无 evaluation patch；提供方错误指出该 MiniMax `:free` 变体已于 2026-10-22 退役。机器证据：`output/d01-first-task-api-smoke.json`。HTTP 200／done 因此不算评测成功。
- [OpenRouter 官方实时模型目录](https://openrouter.ai/api/v1/models)仍列出多种零价固定 ID。选取具工具调用或结构化输出声明的 `nvidia/nemotron-3-super-120b-a12b:free` 与 `google/gemma-4-31b-it:free`，仅用合成教学问题分别探测；两个请求均返回 `429 free-models-per-day`，未取得任何可核实的回答质量／功能证据，故**没有贸然切换线上模型**。
- [OpenRouter 官方定价说明](https://openrouter.ai/pricing)记载免费账户上限为每日 50 次、每分钟 20 次，失败尝试也占用日额。即使更换现存免费 ID，单个 PBL 项目的九阶段可能产生多次教练与评测调用，不能把该免费额度称作可支撑普通学校班级的长期生产方案。没有购买积分、启用付费回退、注册额外账户或让学生选择模型／输入密钥。

下一步：在可用额度恢复或取得独立、适合学校使用的模型额度后，先以固定免费候选完成结构化评测和教练工具调用的合成 QA，再核对儿童语言和反馈质量；通过后才考虑有受限回滚的服务端配置变更。播放器镜像仍需单独完成课程质量门，不因模型配置可用而自动发布。
