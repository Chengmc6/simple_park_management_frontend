<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')

const onLogin = async () => {
  if (!username.value || !password.value) {
    auth.errorMsg = 'ユーザー名とパスワードを入力してください'
    return
  }

  const success = await auth.login({
    username: username.value,
    password: password.value,
  })

  if (success) {
    router.push('/')
  }
}
</script>

<template>
  <div class="login-wrapper">
    <el-card class="login-card">
      <template #header>
        <h2 class="title">ログイン</h2>
      </template>

      <el-form @submit.prevent="onLogin" label-position="top">
        <el-form-item label="ユーザー名">
          <el-input v-model="username" :prefix-icon="User" placeholder="ユーザー名" />
        </el-form-item>

        <el-form-item label="パスワード">
          <el-input
            v-model="password"
            type="password"
            :prefix-icon="Lock"
            placeholder="パスワード"
            show-password
          />
        </el-form-item>

        <el-alert
          v-if="auth.errorMsg"
          :title="auth.errorMsg"
          type="error"
          show-icon
          :closable="false"
          class="mb-4"
        />

        <el-button type="primary" native-type="submit" :loading="auth.isLoading" class="w-full">
          ログイン
        </el-button>
      </el-form>

      <div class="footer-links">
        <span>アカウントをお持ちではありませんか？</span>
        <el-link type="primary" @click="router.push('/register')">新規登録</el-link>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.login-wrapper {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
}

.login-card {
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
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
