<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'

const username = ref<string>('')
const password = ref<string>('')
const confirmPassword = ref<string>('')
const resultMsg = ref<string | null>(null)

const auth = useAuthStore()
const router = useRouter()

const onRegister = async () => {
  // 清空之前的错误 / 结果信息
  auth.errorMsg = null
  resultMsg.value = null

  // ✅ 必填检查（修正：要用 !）
  if (!username.value || !password.value || !confirmPassword.value) {
    auth.errorMsg = 'ユーザー名・パスワード・確認用パスワードをすべて入力してください。'
    return
  }

  if (password.value.length < 6) {
    auth.errorMsg = 'パスワードは6文字以上でなければなりません。'
    return
  }

  if (password.value !== confirmPassword.value) {
    auth.errorMsg = '確認用パスワードが一致しません。'
    return
  }

  const result = await auth.register({
    username: username.value,
    password: password.value,
    confirmPassword: confirmPassword.value,
  })

  if (result.success) {
    resultMsg.value = result.message
    username.value = ''
    password.value = ''
    confirmPassword.value = ''
    const res = window.confirm('登録が完了しました。ログイン画面へ移動しますか？')
    if (res) {
      router.push('/login')
    }
  } else {
    auth.errorMsg = result.message
  }
}
</script>

<template>
  <div class="register-wrapper">
    <el-card class="register-card">
      <template #header>
        <h2 class="title">新規登録</h2>
      </template>

      <el-form @submit.prevent="onRegister" label-position="top">
        <el-form-item label="ユーザー名">
          <el-input
            v-model="username"
            :prefix-icon="User"
            placeholder="ユーザー名"
            autocomplete="username"
          />
        </el-form-item>

        <el-form-item label="パスワード">
          <el-input
            v-model="password"
            type="password"
            :prefix-icon="Lock"
            placeholder="パスワード"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>

        <el-form-item label="確認用パスワード">
          <el-input
            v-model="confirmPassword"
            type="password"
            :prefix-icon="Lock"
            placeholder="確認用パスワード"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>

        <!-- 错误提示 -->
        <el-alert
          v-if="auth.errorMsg"
          :title="auth.errorMsg"
          type="error"
          show-icon
          :closable="false"
          class="mb-4"
        />

        <el-button type="primary" native-type="submit" :loading="auth.isLoading" class="w-full">
          登録
        </el-button>
      </el-form>

      <div class="footer-links">
        <span>すでにアカウントをお持ちですか？</span>
        <el-link type="primary" @click="router.push('/login')">ログイン</el-link>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.register-wrapper {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
}

.register-card {
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.title {
  margin: 0;
  text-align: center;
  font-size: 1.5rem;
  color: #303133;
}

.mb-4 {
  margin-bottom: 1rem;
}

.w-full {
  width: 100%;
}

.footer-links {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: #606266;
}
</style>
