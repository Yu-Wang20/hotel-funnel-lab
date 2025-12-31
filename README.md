# Hotel Funnel Lab｜国际酒店预订全链路漏斗优化与 AI 赋能实验平台

一个面向 **Trip.com（携程海外版）国际酒店交易链路**的端到端产品/数据/实验一体化项目：从「搜索 → 列表 → 详情 → 下单 → 支付」全链路漏斗建模，提供 **全价透明（Total Price）**、**AI 政策摘要**、**埋点与漏斗分析**、**A/B 实验配置与分析**、以及**产品文档中心**。

**Live Demo:** https://hotelfunnel-fiurddsy.manus.space

---

## Why this project

国际酒店预订中，用户常因以下因素在详情页/下单页流失：
- 税费/服务费不透明，价格心智混乱（Base Price vs Total Price）
- 取消/早餐/押金等政策文本冗长，决策成本高
- 缺少端到端漏斗埋点与实验系统，优化只能“凭感觉”

本项目目标：构建可运行的业务闭环，并将“策略 → 实验 → 数据复盘”落地为一套可复用平台。

---

## Key Features

### 1) 搜索与列表（Search & List）
- 目的地、日期等基础搜索能力
- **Total Price（全价模式）切换**：Base Price + Tax + Fees 的透明展示
- 列表排序/筛选（可扩展）

### 2) 详情页 AI 政策助手（AI Policy Assistant）
- 将冗长政策文本（取消、早餐、税费、入住规则等）**压缩为结构化摘要/标签**
- 支持“关键条款优先展示”（降低认知负担、提升转化）

### 3) 数据看板（Analytics Dashboard）
- **漏斗转化**：按关键步骤统计转化率/流失率
- **关键指标追踪**：点击、停留、下单、支付等核心行为（项目内置 15+ 关键埋点事件）
- 支持按实验分组/时间维度切片

### 4) A/B 实验中心（Experiment Center）
- 实验配置：假设、指标、分组、触发条件
- 分流（A/B assignment）与实验结果汇总（可扩展统计分析）
- 为“产品迭代”提供统一闭环

### 5) 文档中心（Docs Hub）
- PRD / 埋点字典 / KPI 指标树 / 项目路线图
- 让项目在面试/简历展示中具备“可讲清楚的产品化沉淀”

---

## Tech Stack (as implemented in repo)

- **TypeScript** (primary)
- **pnpm**（仓库包含 `pnpm-lock.yaml`）
- Monorepo-style structure: `client / server / shared`
- **Drizzle**（仓库包含 `drizzle/` & `drizzle.config.ts`）
- UI 工程化：Prettier（`.prettierrc` / `.prettierignore`）等

> 说明：数据库/运行脚本以仓库内实际 `package.json` 为准；本 README 提供“稳妥的两种启动方式”。

---

## Project Structure

```txt
.
├── client/        # 前端（页面、组件、路由）
├── server/        # 后端（API、业务逻辑、埋点/实验服务）
├── shared/        # 前后端共享类型/常量
├── drizzle/       # 数据库 schema / migrations
├── patches/       # 依赖补丁（如有）
└── ...
