<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const isAdmin = computed(() => authStore.role === 1)

const navLinks = [
  { name: '车辆查询', path: '/car-query', icon: '🚗' },
  { name: '使用履历', path: '/usage-history', icon: '📜' },
  { name: '个人中心', path: '/user', icon: '👤' },
]
</script>

<template>
  <div class="layout">
    <!-- 左侧侧边栏 -->
    <aside class="sidebar">
      <div class="logo">ダッシュボード</div>

      <el-menu
        router
        :default-active="$route.path"
        background-color="#1f2937"
        text-color="#fff"
        active-text-color="#ffd04b"
        class="menu"
      >
        <el-menu-item v-for="link in navLinks" :key="link.path" :index="link.path">
          <span>{{ link.icon }}</span>
          <span>{{ link.name }}</span>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <div v-if="isAdmin">身份：管理员</div>
        <div>用户ID：{{ authStore.userId || 'N/A' }}</div>
        <el-button type="danger" size="small" @click="handleLogout">登出</el-button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="main-container">
      <header class="header">
        <h2>{{ $route.meta.title || '仪表盘' }}</h2>
        <span class="welcome">欢迎您，用户 {{ authStore.userId }}</span>
      </header>

      <!-- 可滚动内容区 -->
      <main class="content">
        <RouterView :key="$route.fullPath" />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 整体布局：左右结构 */
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 左侧侧边栏 */
.sidebar {
  width: 220px;
  background-color: #1f2937;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  text-align: center;
  margin-bottom: 20px;
}

.menu {
  flex-grow: 1;
  border-right: none;
}

/* 底部信息 */
.sidebar-footer {
  border-top: 1px solid #374151;
  padding-top: 16px;
  font-size: 14px;
  color: #d1d5db;
}

/* 主区域 */
.main-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

/* 顶部导航栏 */
.header {
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.welcome {
  font-size: 14px;
  color: #909399;
}

/* 内容区：可滚动 */
.content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 24px;
}
</style>
