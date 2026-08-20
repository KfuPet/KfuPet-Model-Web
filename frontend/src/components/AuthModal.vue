<script setup lang="ts">
import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { authApi } from '../api'
import type { User } from '../api/types'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{
  (e: 'update:show', v: boolean): void
  (e: 'success', payload: { token: string; user: User }): void
}>()

const message = useMessage()
const mode = ref<'login' | 'register'>('login')
const loading = ref(false)
const loginForm = ref({ identifier: '', password: '' })
const registerForm = ref({ username: '', email: '', password: '' })

function close() {
  emit('update:show', false)
}

function switchMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
}

async function submit() {
  loading.value = true
  try {
    const res =
      mode.value === 'login'
        ? await authApi.login(loginForm.value)
        : await authApi.register(registerForm.value)
    message.success(mode.value === 'login' ? '登录成功' : '注册成功')
    emit('success', res)
    close()
  } catch (e) {
    message.error((e as Error).message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <n-modal :show="props.show" @update:show="emit('update:show', $event)">
    <n-card
      class="w-full max-w-md overflow-hidden"
      :bordered="false"
      role="dialog"
      aria-modal="true"
      style="border-radius: 20px; background: var(--surface)"
      content-style="padding-top: 0"
    >
      <!-- 顶部暖色装饰带 + 爪印 -->
      <div class="-mx-5 mb-5 flex flex-col items-center pt-7 pb-5" style="background: linear-gradient(150deg, #fbe5d9 0%, #f7e8cf 60%, #eef0dd 100%)">
        <span
          class="float-slow mb-2 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg"
          style="background: linear-gradient(135deg, #d2613c, #e8935c)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="7.2" cy="8.2" r="1.9" />
            <circle cx="12" cy="6.6" r="2" />
            <circle cx="16.8" cy="8.2" r="1.9" />
            <ellipse cx="12" cy="14.6" rx="4.4" ry="3.6" />
          </svg>
        </span>
        <span class="text-lg font-bold" style="color: var(--ink)">
          {{ mode === 'login' ? '欢迎回来' : '加入我们' }}
        </span>
        <span class="text-xs" style="color: var(--muted)">
          {{ mode === 'login' ? '登录后继续探索社区与模型' : '注册一个账号，畅玩两大板块' }}
        </span>
      </div>

      <!-- 分段切换：滑动指示块 -->
      <div
        class="relative mx-auto mb-5 grid w-56 grid-cols-2 rounded-full p-1"
        style="background: var(--surface-soft)"
      >
        <span
          class="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full shadow-sm transition-transform duration-300"
          style="
            left: 4px;
            background: var(--accent);
            transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
          "
          :style="{ transform: mode === 'login' ? 'translateX(0)' : 'translateX(100%)' }"
        />
        <button
          class="relative z-10 rounded-full py-1.5 text-sm transition-colors duration-300"
          :style="{ color: mode === 'login' ? '#fff' : 'var(--muted)' }"
          @click="mode = 'login'"
        >
          登录
        </button>
        <button
          class="relative z-10 rounded-full py-1.5 text-sm transition-colors duration-300"
          :style="{ color: mode === 'register' ? '#fff' : 'var(--muted)' }"
          @click="mode = 'register'"
        >
          注册
        </button>
      </div>

      <!-- 表单区域：模式切换时淡入 -->
      <Transition name="fade" mode="out-in">
        <div v-if="mode === 'login'" key="login" class="space-y-3">
          <n-input
            v-model:value="loginForm.identifier"
            placeholder="用户名或邮箱"
            size="large"
          />
          <n-input
            v-model:value="loginForm.password"
            type="password"
            placeholder="密码"
            size="large"
            show-password-on="click"
            @keyup.enter="submit"
          />
        </div>
        <div v-else key="register" class="space-y-3">
          <n-input
            v-model:value="registerForm.username"
            placeholder="用户名"
            size="large"
          />
          <n-input
            v-model:value="registerForm.email"
            placeholder="邮箱"
            size="large"
          />
          <n-input
            v-model:value="registerForm.password"
            type="password"
            placeholder="密码"
            size="large"
            show-password-on="click"
            @keyup.enter="submit"
          />
        </div>
      </Transition>

      <n-button
        type="primary"
        block
        round
        size="large"
        class="pressable mt-5"
        :loading="loading"
        @click="submit"
      >
        {{ mode === 'login' ? '登录' : '注册' }}
      </n-button>

      <div class="mt-4 text-center text-sm" style="color: var(--muted)">
        <button
          class="transition-colors hover:underline"
          style="color: var(--accent)"
          @click="switchMode"
        >
          {{ mode === 'login' ? '没有账号？去注册' : '已有账号？去登录' }}
        </button>
      </div>
    </n-card>
  </n-modal>
</template>
