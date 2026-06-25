# 磐宏清洗设备官网原型

这是一个面向台州磐宏机电有限公司的高压清洗设备官网原型。结构参考了同类官网的首屏大图、顶部菜单、产品中心、企业实力和新闻动态，同时内置 Cloudflare Pages Functions + D1 的内容更新接口。

## 结构

- `public/`：前台官网、产品页、新闻页、后台管理页和静态资源。
- `public/subpage.html` + `public/subpage-data.js`：公司简介、企业实力、产品型号、服务支持、下载专区和联系咨询等菜单子页面。
- `functions/api/`：Cloudflare Pages Functions 接口。
- `migrations/0001_init.sql`：D1 数据库初始化和演示数据。
- `wrangler.toml`：Cloudflare Pages 和 D1 配置。

## 本地预览

静态预览：

```bash
npm run preview:static
```

包含 Cloudflare Functions 的预览：

```bash
npm install
npm run db:init:local
npm run dev
```

`preview:static` 会使用前端内置演示数据和浏览器本地存储，适合看设计。`npm run dev` 会通过 Wrangler 启动 Pages Functions，适合测试 D1 后台更新。

## 部署到 Cloudflare

1. 创建 D1 数据库：

```bash
npx wrangler d1 create cleaning_site
```

2. 把返回的 `database_id` 写入 `wrangler.toml`。

3. 初始化远程数据库：

```bash
npm run db:init:remote
```

4. 设置后台 token：

```bash
npx wrangler pages secret put ADMIN_TOKEN --project-name panhiro-cleaning-site
```

5. 部署：

```bash
npm run deploy
```

上线后访问 `/admin.html`，输入 `ADMIN_TOKEN` 就可以添加产品和公司动态。
