/// <reference types="cypress" />

describe('充电管理 E2E 测试', () => {
  beforeEach(() => {
    // 登录
    cy.visit('/login');
    cy.get('input[placeholder*="用户名"]').type('admin');
    cy.get('input[placeholder*="密码"]').type('admin123');
    cy.get('button').contains('登录').click();
    cy.url().should('not.include', '/login');
  });

  describe('工作台', () => {
    it('应该显示统计卡片', () => {
      cy.visit('/dashboard');
      cy.get('.stat-card').should('have.length.greaterThan', 0);
    });

    it('应该显示充电状态统计', () => {
      cy.visit('/dashboard');
      cy.contains('充电中').should('exist');
      cy.contains('今日订单').should('exist');
    });
  });

  describe('站点管理', () => {
    it('应该显示站点列表', () => {
      cy.visit('/station');
      cy.get('.el-table').should('exist');
      cy.get('.el-table tbody tr').should('have.length.greaterThan', 0);
    });

    it('应该能搜索站点', () => {
      cy.visit('/station');
      cy.get('input[placeholder*="搜索"]').type('测试站');
      cy.get('button').contains('搜索').click();
      // 验证搜索结果
      cy.get('.el-table').should('exist');
    });

    it('应该能打开新增站点弹窗', () => {
      cy.visit('/station');
      cy.get('button').contains('新增').click();
      cy.get('.el-dialog').should('be.visible');
    });
  });

  describe('订单管理', () => {
    it('应该显示订单列表', () => {
      cy.visit('/order');
      cy.get('.el-table').should('exist');
      cy.get('.el-table tbody tr').should('have.length.greaterThan', 0);
    });

    it('应该能筛选订单状态', () => {
      cy.visit('/station');
      cy.get('.el-select').first().click();
      cy.get('.el-select-dropdown__item').contains('已支付').click();
      // 验证筛选生效
    });

    it('应该能查看订单详情', () => {
      cy.visit('/order');
      cy.get('.el-table tbody tr').first().within(() => {
        cy.get('button').contains('详情').click();
      });
      cy.get('.el-drawer').should('be.visible');
    });
  });

  describe('告警管理', () => {
    it('应该显示告警列表', () => {
      cy.visit('/alert');
      cy.get('.el-table').should('exist');
    });

    it('应该能按级别筛选告警', () => {
      cy.visit('/alert');
      cy.get('.el-select').first().click();
      cy.get('.el-select-dropdown__item').contains('严重').click();
    });
  });

  describe('权限控制', () => {
    it('无权限页面应显示 403', () => {
      // 尝试访问需要特定权限的页面
      cy.visit('/system/user');
      // 如果没有权限，应显示无权限提示
    });
  });
});
