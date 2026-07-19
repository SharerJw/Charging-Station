/// <reference types="cypress" />

// 全局配置
Cypress.on('uncaught:exception', (err, runnable) => {
  // 忽略 Vue 路由相关的非致命错误
  if (err.message.includes('ResizeObserver loop')) {
    return false;
  }
  return true;
});

// 自定义命令
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * 登录管理后台
       */
      login(username?: string, password?: string): Chainable<void>;

      /**
       * 等待 API 请求完成
       */
      waitForApi(alias: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (username = 'admin', password = 'admin123') => {
  cy.visit('/login');
  cy.get('input[placeholder*="用户名"]').type(username);
  cy.get('input[placeholder*="密码"]').type(password);
  cy.get('button').contains('登录').click();
  cy.url().should('not.include', '/login');
});

Cypress.Commands.add('waitForApi', (alias: string) => {
  cy.wait(`@${alias}`);
});

export {};
