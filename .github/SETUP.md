# GitHub仓库配置指南

## 1. 分支保护 (Branch Protection)

在 GitHub 网页上操作：

**Settings → Branches → Add branch protection rule**

```
Branch name pattern: main

勾选以下选项:
☑ Require a pull request before merging
  ☑ Require approvals (1)
  ☑ Require review from Code Owners
☑ Require status checks to pass before merging
  ☑ Require branches to be up to date
☐ Require conversation resolution before merging
☑ Require linear history
☐ Include administrators
☐ Allow force pushes
☐ Allow deletions
```

## 2. 仓库设置

**Settings → General**

```
Features:
☑ Issues
☑ Discussions (可选)
☑ Projects (可选)

Pull Requests:
☑ Allow merge commits
☑ Allow squash merging (推荐)
☑ Allow rebase merging
☑ Automatically delete head branches
```

## 3. Collaborators

**Settings → Collaborators → Add people**

- 核心开发者添加为 `Write` 权限
- 外部贡献者通过 Fork + PR 贡献

## 4. Secrets (CI/CD用)

**Settings → Secrets and variables → Actions**

```
需要时添加:
- DOCKER_USERNAME
- DOCKER_PASSWORD
- DEPLOY_KEY
```
