<script setup lang="ts">
import { useUserStore } from '@/stores/userStore'
import { reactive, onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatDateTime } from '@/utils/dateFormatter'

const router = useRouter()
const userStore = useUserStore()

// 控制密码表单显示
const showPasswordForm = ref(false)

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 密码强度检测
const passwordStrength = computed(() => {
  const pwd = passwordForm.newPassword || ''
  let level = 0
  if (pwd.length >= 6) level++
  if (/[A-Z]/.test(pwd)) level++
  if (/[0-9]/.test(pwd)) level++
  if (/[^A-Za-z0-9]/.test(pwd)) level++

  const textMap = ['弱', '一般', '中等', '强']
  const colorMap = ['#f56c6c', '#e6a23c', '#409eff', '#67c23a']

  return {
    level: Math.min(level, 3), // 最大 3
    text: textMap[level] || '弱',
    color: colorMap[level] || '#f56c6c',
  }
})

onMounted(async () => {
  await userStore.fetchUserInfo()
})

const submitPasswordChange = async () => {
  // 表单验证
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    userStore.errorMsg = '新密码和确认密码不匹配。'
    return
  }

  if (passwordForm.newPassword === passwordForm.currentPassword) {
    userStore.errorMsg = '新密码不能与当前密码相同。'
    return
  }

  if (passwordForm.newPassword.length < 6) {
    userStore.errorMsg = '新密码长度至少为6位。'
    return
  }

  const success = await userStore.changePassword({
    oldPassword: passwordForm.currentPassword,
    newPassword: passwordForm.newPassword,
  })

  if (success) {
    // 重置表单
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    showPasswordForm.value = false

    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  }
}

const cancelPasswordChange = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  showPasswordForm.value = false
  userStore.errorMsg = null
}
</script>

<template>
  <div class="profile-page">
    <!-- 页面标题 -->
    <h1 class="page-title">个人中心</h1>

    <!-- 提示信息 -->
    <el-alert
      v-if="userStore.isLoading"
      title="正在加载用户信息..."
      type="info"
      show-icon
      :closable="false"
      class="mb-4"
    />
    <el-alert
      v-if="userStore.errorMsg"
      :title="userStore.errorMsg"
      type="error"
      show-icon
      :closable="false"
      class="mb-4"
    />
    <el-alert
      v-if="userStore.successMsg"
      :title="userStore.successMsg"
      type="success"
      show-icon
      :closable="false"
      class="mb-4"
    />

    <!-- 基本信息 -->
    <section class="info-section mb-6">
      <h2 class="section-title">基本信息</h2>
      <el-descriptions border :column="2">
        <el-descriptions-item label="用户ID">
          {{ userStore.currentUser?.id || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="用户名">
          {{ userStore.currentUser?.username || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建日期">
          {{ formatDateTime(userStore.currentUser?.createdAt) }}
        </el-descriptions-item>
      </el-descriptions>
    </section>

    <!-- 安全设置 -->
    <section class="security-section">
      <div class="section-header">
        <h2 class="section-title">安全设置</h2>
        <el-button
          v-if="!showPasswordForm"
          type="primary"
          size="default"
          icon="el-icon-lock"
          @click="showPasswordForm = true"
        >
          修改密码
        </el-button>
      </div>

      <div v-if="!showPasswordForm" class="text-gray-600 mt-2">定期修改密码可以提高账户安全性</div>

      <el-form
        v-else
        :model="passwordForm"
        label-position="top"
        @submit.prevent="submitPasswordChange"
        class="mt-4"
      >
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            v-model="passwordForm.currentPassword"
            type="password"
            placeholder="请输入当前密码"
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码（至少6位）"
          />
        </el-form-item>

        <!-- 密码强度指示器 -->
        <el-form-item v-if="passwordForm.newPassword">
          <el-progress
            :percentage="passwordStrength.level * 33.33"
            :color="passwordStrength.color"
            :stroke-width="14"
            status="active"
          />
          <span :style="{ color: passwordStrength.color }">强度：{{ passwordStrength.text }}</span>
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="再次输入新密码"
          />
          <p
            v-if="
              passwordForm.confirmPassword &&
              passwordForm.newPassword !== passwordForm.confirmPassword
            "
            class="text-red-500 text-sm mt-1"
          >
            两次输入的密码不一致
          </p>
        </el-form-item>

        <div class="button-group">
          <el-button @click="cancelPasswordChange">取消</el-button>
          <el-button type="primary" native-type="submit" :loading="userStore.isLoading">
            {{ userStore.isLoading ? '更新中...' : '更新密码' }}
          </el-button>
        </div>
      </el-form>
    </section>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 40px 20px;
  max-width: 900px;
  margin: 0 auto;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 24px;
  text-align: center;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}
</style>
