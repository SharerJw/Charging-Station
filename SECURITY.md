# Security Policy

## 支持的版本

| 版本 | 支持状态 |
|------|----------|
| 1.0.x | ✅ 支持 |
| < 1.0 | ❌ 不支持 |

## 报告安全漏洞

**请不要在公开Issue中报告安全漏洞。**

如果你发现安全漏洞，请通过以下方式私密报告：

1. **GitHub Security Advisories**（推荐）
   - 前往仓库 → Security → Report a vulnerability
   - 填写漏洞详情

2. **邮件**
   - 发送至 **[Sharer.Jw@Gmail.com]**
   - 标题格式: `[SECURITY] 简要描述`

### 报告内容应包括

- 漏洞类型（SQL注入、XSS、认证绕过等）
- 复现步骤
- 影响范围
- 建议的修复方案（如有）

### 响应时间

- **确认收到**: 48小时内
- **初步评估**: 7天内
- **修复发布**: 30天内（严重漏洞7天内）

## 已知安全措施

### 认证
- JWT Token认证（Sa-Token）
- Token过期时间: 2小时
- 登录接口限流

### 数据
- SQL参数化查询（MyBatis-Plus）
- 多租户数据隔离（tenant_id）
- 敏感操作审计日志

### 网络
- CORS白名单限制
- API Gateway统一鉴权
- 请求大小限制

### 输入验证
- Bean Validation（@NotBlank, @Size等）
- 参数化查询防SQL注入
- 输出转义防XSS

## 安全更新

安全修复会通过以下方式通知：
- GitHub Security Advisories
- Release Notes中标注 `[SECURITY]`
