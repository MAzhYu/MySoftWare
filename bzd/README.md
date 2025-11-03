# bzd

基于 uni-app + Vue（默认 Vue3，兼容 Vue2 条件编译）的多端前端项目，提供首页、AI 助手、口算 PK、我的与考试页面，支持 H5 / App(uni-app) / 各类小程序。

## 功能概览
- TabBar：首页、AI 助手、口算 PK、我的（自定义导航栏 navigationStyle: custom）
- 业务页面：考试（pages/exam/exam）
- 统一样式变量：uni.scss（官方变量，便于主题与组件风格统一）
- Promise 适配：uni.promisify.adaptor.js 拦截器将 uni API 返回规范化为 Promise 形式

## 技术栈
- uni-app（DCloud）
- Vue 3（main.js 使用 #ifdef/#ifndef 兼容 Vue2/3）
- SCSS 全局变量（uni.scss）

## 目录结构
```
├─ App.vue                 # 应用生命周期(onLaunch/onShow/onHide)与全局样式
├─ main.js                 # 入口（Vue3 createSSRApp；条件编译兼容 Vue2）
├─ index.html              # H5 入口（注入 viewport-fit=cover）
├─ pages.json              # 路由与 TabBar 配置
├─ manifest.json           # 平台与打包配置（app-plus / 小程序 / 统计 / vueVersion=3）
├─ uni.scss                # 官方统一样式变量
├─ uni.promisify.adaptor.js# Promise 化拦截器
├─ pages/                  # 业务页面（tabbar、exam）
├─ static/                 # 静态资源（tabbar 图标、logo 等）
└─ unpackage/              # 构建产物（例如 dist）
```

## 路由与 TabBar
- 启动页：pages/tabbar/index/index
- 其他页面：
  - pages/tabbar/ai/ai（AI 助手）
  - pages/tabbar/pk/pk（口算 PK）
  - pages/tabbar/me/me（我的）
  - pages/exam/exam（考试）
- TabBar 图标位于 /static：ai.png/ai_u.png、index.png/index_u.png、pk.png/pk_u.png、mine.png/mine_u.png

## 开发与运行
推荐使用 HBuilderX 导入本项目进行运行与调试：
1) 打开 HBuilderX -> 文件 -> 导入 -> 从本地目录导入 -> 选择本项目根目录
2) 运行到：H5、各小程序平台或 App（Android/iOS）
3) 发行打包：HBuilderX -> 发行 -> 选择目标平台

说明：本仓库未包含 package.json 与 npm 脚本，命令行构建请优先使用 HBuilderX 或按 uni-app 官方 CLI 初始化后迁移。

## 关键配置
- pages.json：页面路由、全局样式、TabBar（高度、选中颜色、图标等）
- manifest.json：app-plus、小程序平台配置，splashscreen、权限、统计、vueVersion 等
- index.html：H5 入口，动态写入 viewport（兼容安全区）

## 开发约定
- 全局样式变量统一在 uni.scss 中维护
- 页面级样式建议按需使用 SCSS 并复用官方变量
- 导航栏为自定义（navigationStyle: custom），如需原生导航栏请在 pages.json 修改

## 许可证
未声明（如需开源请补充 LICENSE）。
