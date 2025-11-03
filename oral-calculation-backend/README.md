# Oral Calculation Backend (MySQL)

用途

- 基于 Express + MySQL 的口算练习后端。
- 功能：用户注册/登录（JWT）、题目生成（加/减/乘/除/混合/比较/填空，支持难度/数量）、学习进度统计与家长-孩子关系管理。
- 主要路由：/api/auth, /api/problems, /api/health。

环境要求

- Node.js 18+
- MySQL 8.0+

安装

1. 克隆或进入项目目录
2. 安装依赖
   - Windows PowerShell：`npm install`

配置

1. 在项目根目录创建 .env 文件，示例如下：

```properties
PORT=5000
NODE_ENV=development
JWT_SECRET=please_change_me
JWT_EXPIRE=7d

# MySQL 连接参数
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=oral_calc
MYSQL_USER=root
MYSQL_PASSWORD=your_password
```

1. 在 MySQL 中创建数据库（若不存在）：

```sql
CREATE DATABASE oral_calc CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

运行

- 开发模式：
  - `npx nodemon server.js`（或 `node server.js`）
- 启动成功后，健康检查：访问 [http://localhost:5000/api/health](http://localhost:5000/api/health)

首次启动会自动进行数据表同步（sequelize.sync）。

快速验证

1. 注册：POST /api/auth/register
   - { username, email, password, role: 'student'|'parent'|'teacher', profile? }
2. 登录：POST /api/auth/login → 获取 token
3. 携带 `Authorization: Bearer YOUR_TOKEN` 访问：
   - GET /api/problems?type=addition&difficulty=easy&count=10
   - POST /api/problems/submit
   - GET /api/auth/me

用 Apifox 一键验证（推荐）

1. 在 Apifox 中导入环境文件：`apifox.postman_environment.json`，启用环境 Local Dev。
2. 导入集合文件：`apifox.postman_collection.json`。
3. 调试顺序：Register → Login→ Me → Generate Problems → Submit Answers（预请求脚本自动拉取 1 道题并构造提交体）。
4. 在Me等得到错误请求，请检查请求体，确保加入Authorization，值为Bearer {{token}}

`.env` 示例对应调整：

```properties
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=oral_calc
MYSQL_USER=root
MYSQL_PASSWORD=YourStrongP@ss
```

常见问题

- 启动时报错 ER_ACCESS_DENIED_ERROR：检查 .env 中的 MYSQL_USER/MYSQL_PASSWORD。
- 表未创建：确认 .env 已配置且首次启动日志显示 MySQL connected，必要时删除数据库后重试。

许可证

- ISC
