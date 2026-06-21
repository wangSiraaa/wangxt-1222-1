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
- Vite (配置 `@/` 路径别名)
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
│   ├── scripts/             # 数据库初始化脚本
│   │   ├── init.sql         # 建库建表+种子数据
│   │   └── init.sh          # 一键初始化脚本
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
    ├── vite.config.ts       # Vite 配置（含 @/ 别名）
    └── package.json
```

## 快速启动

### 一、初始化 PostgreSQL 数据库（必做）

#### 方式一：使用一键脚本（推荐）

```bash
cd backend/scripts
chmod +x init.sh
./init.sh
```

脚本会自动创建 `reservoir_scheduling` 数据库、所有业务表，并插入演示数据。
如需自定义连接参数，可通过环境变量传入：

```bash
PGUSER=postgres PGPASSWORD=yourpass PGHOST=localhost PGPORT=5432 ./init.sh
```

#### 方式二：手动执行 SQL

```bash
# 使用 postgres 超级用户执行初始化脚本
psql -U postgres -f backend/scripts/init.sql
```

该脚本会：
1. 创建 `reservoir_scheduling` 数据库
2. 创建 7 张业务表及索引
3. 插入演示种子数据（水位记录、调度计划、实际开度、生态流量确认等）
4. 输出各表记录数用于验证

#### 数据表说明

| 表名 | 说明 |
|------|------|
| `water_level_records` | 水位记录（上游来水、下游水位、库水位） |
| `gate_schedules` | 闸门调度计划（计划开度、下泄流量、审批状态） |
| `gate_actual_openings` | 闸门实际开度（实际开度、偏差、偏差原因） |
| `ecological_flow_confirmations` | 生态流量确认（最小流量、确认流量、补偿说明） |
| `water_supply_impacts` | 供水影响（取水量、影响等级、查看状态） |
| `approval_records` | 审批记录（业务类型、审批结果、意见） |
| `warning_records` | 预警记录（预警类型、等级、处理状态） |

### 二、启动后端服务

```bash
cd backend
cp .env.example .env  # 按实际数据库配置修改 .env
go mod download
go run main.go
```

后端启动后会自动通过 GORM `AutoMigrate` 同步表结构。服务运行在 http://localhost:3001

`.env` 关键配置项：
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=reservoir_scheduling

# 业务规则阈值
WARNING_WATER_LEVEL=35.0      # 警戒水位
MIN_ECOLOGICAL_FLOW=10.0      # 最小生态流量
GATE_DEVIATION_THRESHOLD=5.0  # 开度偏差阈值
```

健康检查：访问 http://localhost:3001/api/health 应返回 `{"status":"ok"}`

### 三、启动前端应用

```bash
cd frontend
npm install
npm run dev
```

前端服务运行在 http://localhost:3000

Vite 已配置 `@/` 路径别名指向 `src/` 目录，同时配置了 `/api` 代理到后端 3001 端口，
启动后可直接在浏览器访问 http://localhost:3000 进入调度总览首页。

### 四、业务联调验证

完成上述三步后，可按以下顺序验证完整业务链路：

1. **水位录入** - 访问 http://localhost:3000/water-level ，录入一条下游水位 ≥35m 的记录，
   预警中心应自动生成"下游水位超警戒"高预警
2. **闸门调度** - 访问 http://localhost:3000/gate-schedule ，新增调度计划；
   若当前水位已超警戒，加大下泄会被拦截
3. **生态流量** - 访问 http://localhost:3000/ecological ，新建确认单；
   确认流量 < 10 m³/s 时必须填写补偿说明
4. **实际开度** - 访问 http://localhost:3000/gate-actual ，记录实际开度；
   偏差 > 5% 时必须填写偏差原因，否则拦截
5. **供水影响** - 访问 http://localhost:3000/water-supply ，使用"智能评估影响"生成影响记录
6. **预警中心** - 访问 http://localhost:3000/warning ，处理各类预警
