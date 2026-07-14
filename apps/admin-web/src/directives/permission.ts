import type { App, Directive, DirectiveBinding } from 'vue'
import { usePermissionStore } from '@/store/permission'

/**
 * 按钮级权限指令
 * 用法：
 *   v-permission="'station:create'"        — 单个权限
 *   v-permission="['station:create','station:edit']"  — 多个权限（任一即可）
 */
const permissionDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const permissionStore = usePermissionStore()
    const value = binding.value

    if (!value) return

    const permissions = Array.isArray(value) ? value : [value]
    const hasPermission = permissions.some(p => permissionStore.hasPermission(p))

    if (!hasPermission) {
      el.parentNode?.removeChild(el)
    }
  },
}

/**
 * 角色指令
 * 用法：v-role="'admin'" 或 v-role="['admin','ops']"
 */
const roleDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const permissionStore = usePermissionStore()
    const value = binding.value

    if (!value) return

    const roles = Array.isArray(value) ? value : [value]
    const hasRole = roles.some(r => permissionStore.hasRole(r))

    if (!hasRole) {
      el.parentNode?.removeChild(el)
    }
  },
}

export function setupPermissionDirectives(app: App) {
  app.directive('permission', permissionDirective)
  app.directive('role', roleDirective)
}
