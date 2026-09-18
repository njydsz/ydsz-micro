# 架构文档总览

YDSZ 后端采用「八大引擎」矩阵式微服务架构，前端采用 micro-kernel 微内核 + 多子应用架构，共享统一的编码规范和基础设施层。

## 核心设计原则

1. **引擎独立部署**：每个引擎可独立编译、独立部署、独立扩缩容
2. **DDD 分层**：严格遵循 api → domain → infra 三层职责
3. **公共模块分级**：ydsz-common 按 L1-L6 六级严格守卫依赖方向
4. **契约优先**：API 通过 OpenAPI 规范定义，前后端通过 FQN+import 引用

## 文档索引

- [架构总览](./overview) — 八大引擎拓扑图、网关路由、调用链路
- [DDD 分层设计](./ddd) — 领域驱动设计分层、Entity/Converter 归属
- [公共模块分级](./common-layers) — ydzs-common 六层 28 子模块详细分级
- [多租户与字典](./multi-tenant) — 三种多租户策略、字典联动机制
