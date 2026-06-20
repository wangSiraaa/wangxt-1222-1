# 水库闸门调度系统

## 项目简介

本系统实现水库闸门调度的全流程管理，兼顾防洪、供水和生态流量三大目标。

## 技术栈

### 后端
- Go 1.21
- Fiber v2 (Web 框架)
- GORM (ORM)
- PostgreSQL

### 前端
- React 18
- TypeScript
- Vite
- Recharts (图表库)
- React Router v6

## 功能模块

1. **调度总览** - 实时监控水位、流量、预警统计和调度曲线
2. **水位录入** - 调度员录入上游来水、下游水位等水文数据
3. **闸门调度** - 制定闸门调度计划，支持审批流程
4. **实际开度** - 记录实际开度，偏差超阈值需追踪原因
5. **生态流量** - 生态专员确认最小下泄流量，不足需补偿说明
6. **供水影响** - 供水单位查看调度计划对取水的影响
7. **审批记录** - 查看所有业务的审批历史
8. **预警中心** - 管理和处理系统预警

## 核心业务规则

1. **防洪约束**: 下游水位超警戒水位时，禁止执行加大下泄调度
2. **生态流量**: 确认下泄流量低于最小生态流量时，必须填写补偿说明
3. **开度追踪**: 闸门实际开度与计划偏差超过阈值（默认 5%）时，必须填写偏差原因

## 目录结构

```
.
├── backend/                 # 后端项目
│   ├── config/              # 配置文件
│   ├── models/              # 数据模型
│   ├── routes/              # 路由定义
│   ├── handlers/            # 请求处理器
│   ├── middleware/          # 中间件
│   ├── services/            # 业务服务
│   ├── utils/               # 工具函数
│   ├── main.go              # 入口文件
│   └── go.mod
└── frontend/                # 前端项目
    ├── src/
    │   ├── components/      # 公共组件
    │   ├── pages/           # 页面组件
    │   ├── services/        # API 服务
    │   ├── types/           # TypeScript 类型定义
    │   ├── utils/           # 工具函数
    │   ├── styles/          # 样式文件
    │   ├── App.tsx
    │   └── main.tsx
    └── package.json
```

## 快速启动

### 后端
```bash
cd backend
go mod download
cp .env.example .env  # 配置数据库连接
go run main.go
```
后端服务运行在 http://localhost:3001

### 前端
```bash
cd frontend
npm install
npm run dev
```
前端服务运行在 http://localhost:3000

## 数据库

项目使用 PostgreSQL，主要数据表：

- `water_level_records` - 水位记录
- `gate_schedules` - 闸门调度计划
- `gate_actual_openings` - 闸门实际开度
- `ecological_flow_confirmations` - 生态流量确认
- `water_supply_impacts` - 供水影响
- `approval_records` - 审批记录
- `warning_records` - 预警记录
