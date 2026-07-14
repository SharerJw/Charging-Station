# Contributing to EV Charging Platform

感谢你对本项目的关注！我们欢迎任何形式的贡献。

## 如何贡献

### 报告Bug
1. 在 [Issues](https://github.com/SharerJw/Charging-Station/issues) 页面创建新Issue
2. 使用 **Bug Report** 模板
3. 提供详细的复现步骤、期望行为、实际行为
4. 附上截图或日志（如有）

### 提交功能建议
1. 创建新Issue，使用 **Feature Request** 模板
2. 说明使用场景和期望的API设计

### 提交代码

#### 1. Fork & Clone
```bash
# Fork 仓库后
git clone https://github.com/YOUR-USERNAME/Charging-Station.git
cd Charging-Station
git remote add upstream https://github.com/SharerJw/Charging-Station.git
```

#### 2. 创建分支
```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

#### 3. 开发规范

**后端 (Java)**
- Java 21 + Spring Boot 3.3
- 遵循 Google Java Style Guide
- 所有金额使用 `BigDecimal` 或 `Long`（分）
- 所有时间使用 `java.time`
- 新API必须有Swagger注解
- 写单元测试

**前端 (Vue 3 / UniApp)**
- TypeScript + Composition API
- 组件使用 PascalCase 命名
- API调用统一走 `src/api/index.ts`
- 新页面需要适配移动端

**提交信息格式**
```
<type>(<scope>): <subject>

类型:
- feat:     新功能
- fix:      Bug修复
- docs:     文档
- style:    格式（不影响代码运行）
- refactor: 重构
- test:     测试
- chore:    构建/工具

示例:
feat(charging): add SOC-based auto-stop
fix(station): prevent duplicate station code
docs(readme): update quick start guide
```

#### 4. 提交PR
```bash
git add .
git commit -m "feat(scope): description"
git push origin feature/your-feature-name
```

然后在GitHub上创建 Pull Request，使用 **PR Template**。

## 分支策略

```
main        ← 稳定版本，受保护
├── develop ← 开发分支
│   ├── feature/xxx  ← 新功能
│   └── fix/xxx      ← Bug修复
```

## 代码审查

所有PR需要至少1人审查。审查重点：
- 代码风格一致性
- 是否有安全问题
- 是否有性能问题
- 测试覆盖

## 开发环境

```bash
# 1. 启动基础设施
.\start.ps1

# 2. 或手动启动
cd docker && docker compose up -d
cd backend && .\gradlew.bat build -x test
.\gradlew.bat :ev-gateway:bootRun  # 各服务分别启动

# 3. 前端
cd apps/admin-web && npm install && npm run dev
```

## 行为准则

参与本项目即表示你同意遵守 [Code of Conduct](CODE_OF_CONDUCT.md)。
