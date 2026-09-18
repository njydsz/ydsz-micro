---
layout: home
title: YDSZ 文档站
titleTemplate: 八大引擎架构 · API 参考 · 编码规范

hero:
  name: 'YDSZ 文档站'
  text: '云平台文档中心'
  tagline: 八大引擎架构总览 · API 参考 · 编码规范 · 拓扑可视化
  image:
    src: /logo-light.svg
    alt: YDSZ Logo
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/
    - theme: alt
      text: 架构总览
      link: /architecture/overview
    - theme: alt
      text: API 参考
      link: /api/

features:
  - icon: 🏗️
    title: 八大引擎
    details: 系统 / 身份 / 消息 / 文件 / 流程 / 任务 / 规则 / 智能 — 独立部署、独立扩展
    link: /engines/system
  - icon: 🎯
    title: DDD 分层架构
    details: api → domain → infra 三层职责清晰，ydsz-common 六层分级体系严格守卫依赖方向
    link: /architecture/ddd
  - icon: 📡
    title: RESTful API
    details: 基于 SpringDoc/OpenAPI 3.0 自动生成的交互式 API 参考文档，覆盖全部业务引擎
    link: /api/
  - icon: 📏
    title: 编码规范
    details: 总计 64 条规则（P0=39 / P1=19 / P2=3），Checkstyle + ArchUnit 强制执行
    link: /standards/
  - icon: 🌐
    title: 微前端架构
    details: Vue 3 + micro-kernel 微内核，支持多子应用 parallel 加载、热插拔切换
    link: /architecture/overview
  - icon: 🤖
    title: 智能引擎
    details: 集成 ReAct、RAG、MCP、NL2SQL、Python 沙箱能力，驱动 AI Agent 框架
    link: /engines/agent
---

<script setup>
import StatsDashboard from '../.vitepress/theme/components/StatsDashboard.vue';
import ApiStatsPanel from '../.vitepress/theme/components/ApiStatsPanel.vue';
</script>

## 🎯 平台能力总览

<ApiStatsPanel />

## 📏 编码规范状态

<StatsDashboard />
