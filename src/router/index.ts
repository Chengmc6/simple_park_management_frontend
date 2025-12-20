// 引入 Vue Router 的核心方法：createRouter 用于创建路由实例，createWebHistory 用于使用 HTML5 history 模式
import { createRouter, createWebHistory } from 'vue-router'

// 引入用户认证的 Pinia store，用于在路由守卫里判断登录状态
import { useAuthStore } from '@/stores/auth'

// 引入各个页面组件
import LoginView from '@/views/LoginView.vue'
import DashboardLayout from '@/views/DashboardLayout.vue'
import CarQueryView from '@/views/CarQueryView.vue'
import CarOperationView from '@/views/CarOperationView.vue'
import UsageHistoryView from '@/views/UsageHistoryView.vue'
import RegisterView from '@/views/RegisterView.vue'
import UserView from '@/views/UserView.vue'
// 管理员组件已移除

// 创建路由实例
const router = createRouter({
  // 使用 HTML5 history 模式，基于 import.meta.env.BASE_URL 作为基础路径
  history: createWebHistory(import.meta.env.BASE_URL), // 定义路由表

  routes: [
    {
      path: '/login', // 登录页路径
      name: 'login', // 路由名称
      component: LoginView, // 对应的组件
      meta: { requiresAuth: false }, // meta 信息：不需要登录即可访问
    },
    {
      path: '/register', // 注册页路径
      name: 'register',
      component: RegisterView,
      meta: { requiresAuth: false }, // 注册页也不需要登录
    },
    {
      path: '/', // 根路径
      name: 'dashboard',
      component: DashboardLayout, // 使用 DashboardLayout 作为布局组件
      meta: { requiresAuth: true }, // 需要登录
      children: [
        {
          path: '', // 路径为空，使其成为默认子页面 (访问 / 时显示)
          name: 'car-query',
          component: CarQueryView, // 车辆查询页面
          meta: { title: '駐車場管理' }, // 页面标题
        },
        {
          path: 'car-operation', // 车辆操作页面
          name: 'car-operation',
          component: CarOperationView,
          meta: { title: '车辆操作' }, // 补充标题
        },
        {
          path: 'usage-history', // 使用履历页面
          name: 'usage-history',
          component: UsageHistoryView,
          meta: { title: '乗車履歴' },
        },
        {
          path: 'user', // 用户个人中心页面
          name: 'user',
          component: UserView,
          meta: { title: '个人中心' },
        },
        // 管理员路由已移除
      ],
    },
    {
      path: '/:pathMatch(.*)*', // 通配符路由，匹配所有未定义的路径
      redirect: '/', // 重定向到首页
    },
  ],
})
// 全局路由守卫：在每次路由切换前执行
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // ✅ 兜底：从 localStorage 判断
  const hasToken = authStore.token || localStorage.getItem('userToken')

  if (to.meta.requiresAuth && !hasToken) {
    next('/login')
  } else if ((to.name === 'login' || to.name === 'register') && hasToken) {
    next('/')
  } else {
    next()
  }
})

// 导出路由实例，供 main.ts 使用
export default router
