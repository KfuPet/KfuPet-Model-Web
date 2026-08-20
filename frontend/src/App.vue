<script setup lang="ts">
import { computed, ref } from 'vue'
import { NConfigProvider, NMessageProvider } from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'
import CommunityView from './views/CommunityView.vue'
import ModelsView from './views/ModelsView.vue'
import AuthModal from './components/AuthModal.vue'
import PublishModal from './components/PublishModal.vue'
import { clearToken, getToken, setToken } from './api/http'
import type { User } from './api/types'

type Section = 'community' | 'models'

const token = ref<string | null>(getToken())
const currentUser = ref<User | null>(null)
const activeSection = ref<Section>('community')
const showAuth = ref(false)
const showPublish = ref(false)

const communityRef = ref<{ reload: () => void } | null>(null)
const modelsRef = ref<{ reload: () => void } | null>(null)

function onPublished(board: Section) {
  // 当前未挂载的板块无需手动刷新，切换回去时 onMounted 会加载
  if (board === 'community') communityRef.value?.reload()
  else modelsRef.value?.reload()
}

const loggedIn = computed(() => !!token.value)

const menuItems: { key: Section; label: string }[] = [
  { key: 'community', label: '社区' },
  { key: 'models', label: '模型' },
]

/** Naive UI 主题覆盖：赤陶主色 + 大圆角，与整体暖调纸质风格统一 */
const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#d2613c',
    primaryColorHover: '#e07a52',
    primaryColorPressed: '#b44e2c',
    primaryColorSuppl: '#d2613c',
    successColor: '#7c9473',
    borderRadius: '10px',
    borderRadiusSmall: '8px',
    fontFamily:
      "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', system-ui, sans-serif",
  },
  Card: {
    borderRadius: '16px',
    borderColor: '#eadfc9',
    color: '#fffdf7',
    titleFontSizeMedium: '16px',
  },
  Button: {
    borderRadiusMedium: '10px',
    borderRadiusSmall: '9px',
    borderRadiusTiny: '8px',
  },
  Input: {
    borderRadius: '10px',
    color: '#fffdf7',
    colorFocus: '#ffffff',
    borderHover: '#d2613c',
    borderFocus: '#d2613c',
    boxShadowFocus: '0 0 0 2px rgba(210, 97, 60, 0.18)',
  },
  Select: {
    peers: {
      InternalSelection: {
        borderRadius: '10px',
        borderHover: '#d2613c',
        borderFocus: '#d2613c',
        boxShadowFocus: '0 0 0 2px rgba(210, 97, 60, 0.18)',
      },
    },
  },
  Modal: {
    borderRadius: '18px',
  },
}

function onAuthSuccess(payload: { token: string; user: User }) {
  token.value = payload.token
  setToken(payload.token)
  currentUser.value = payload.user
}

function logout() {
  clearToken()
  token.value = null
  currentUser.value = null
}
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <div class="relative flex h-screen overflow-hidden">
        <!-- 暖色背景光斑（缓慢漂移） -->
        <div class="pointer-events-none fixed inset-0 z-0">
          <div class="blob blob-a" />
          <div class="blob blob-b" />
          <div class="blob blob-c" />
        </div>

        <!-- 左侧栏 -->
        <aside
          class="relative z-10 flex w-60 shrink-0 flex-col border-r bg-[#fdf9f0]"
          style="border-color: var(--line)"
        >
          <div class="border-b px-5 pb-5 pt-6" style="border-color: var(--line)">
            <div class="flex items-center gap-3">
              <!-- 爪印 Logo，悬停摇摆 -->
              <span
                class="hover-wiggle flex h-11 w-11 cursor-default items-center justify-center rounded-2xl text-white shadow-md"
                style="background: linear-gradient(135deg, #d2613c, #e8935c)"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="7.2" cy="8.2" r="1.9" />
                  <circle cx="12" cy="6.6" r="2" />
                  <circle cx="16.8" cy="8.2" r="1.9" />
                  <ellipse cx="12" cy="14.6" rx="4.4" ry="3.6" />
                </svg>
              </span>
              <div>
                <h1 class="text-lg font-bold tracking-wide" style="color: var(--ink)">
                  KfuPet
                </h1>
                <p class="text-xs" style="color: var(--muted)">社区 · 模型</p>
              </div>
            </div>
          </div>

          <nav class="flex-1 space-y-1.5 p-3">
            <button
              v-for="item in menuItems"
              :key="item.key"
              class="nav-item"
              :class="{ active: activeSection === item.key }"
              @click="activeSection = item.key"
            >
              <span class="nav-inner">
                <svg
                  v-if="item.key === 'community'"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <svg
                  v-else
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                {{ item.label }}
              </span>
            </button>
          </nav>

          <div
            class="border-t p-4 text-xs leading-relaxed"
            style="border-color: var(--line); color: var(--muted)"
          >
            <svg
              class="float-slow mr-1 inline-block align-[-2px]"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="var(--accent)"
            >
              <circle cx="7.2" cy="8.2" r="1.9" />
              <circle cx="12" cy="6.6" r="2" />
              <circle cx="16.8" cy="8.2" r="1.9" />
              <ellipse cx="12" cy="14.6" rx="4.4" ry="3.6" />
            </svg>
            账号在社区与模型板块间互通
          </div>
        </aside>

        <!-- 右侧主区 -->
        <div class="relative z-10 flex min-w-0 flex-1 flex-col">
          <header
            class="flex items-center justify-between border-b bg-[#fdf9f0]/95 px-7 py-3.5"
            style="border-color: var(--line)"
          >
            <h2
              class="flex items-center gap-2.5 text-base font-semibold"
              style="color: var(--ink)"
            >
              <span
                class="inline-block h-2.5 w-2.5 rounded-full transition-colors duration-300"
                :style="{
                  background: activeSection === 'community' ? 'var(--accent)' : 'var(--sage)',
                }"
              />
              {{ activeSection === 'community' ? '社区' : '模型' }}
            </h2>
            <div class="flex items-center gap-3">
              <template v-if="loggedIn">
                <span
                  class="animate-pop-in flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
                  style="background: var(--sage-soft); color: #4d6547"
                >
                  <span
                    class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                    style="background: var(--sage)"
                  >
                    {{ (currentUser?.username ?? 'U').charAt(0).toUpperCase() }}
                  </span>
                  {{ currentUser?.username ?? '已登录' }}
                  <span v-if="currentUser" class="text-xs opacity-70">
                    · {{ currentUser.role }}
                  </span>
                </span>
                <n-button size="small" quaternary class="pressable" @click="logout">
                  退出
                </n-button>
              </template>
              <template v-else>
                <span class="text-sm" style="color: var(--muted)">未登录</span>
                <n-button
                  size="small"
                  type="primary"
                  round
                  class="pressable"
                  @click="showAuth = true"
                >
                  登录 / 注册
                </n-button>
              </template>
            </div>
          </header>

          <main class="min-w-0 flex-1 overflow-y-auto px-7 py-6">
            <Transition name="page" mode="out-in">
              <CommunityView
                v-if="activeSection === 'community'"
                key="community"
                ref="communityRef"
                :logged-in="loggedIn"
              />
              <ModelsView v-else key="models" ref="modelsRef" :logged-in="loggedIn" />
            </Transition>
          </main>
        </div>

        <!-- 右下角发布按钮（FAB） -->
        <button
          class="fab group"
          :class="{ 'fab-guest': !loggedIn }"
          aria-label="发布"
          @click="loggedIn ? (showPublish = true) : (showAuth = true)"
        >
          <span class="fab-ring" />
          <svg
            class="fab-icon"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span class="fab-label">发布</span>
        </button>

        <PublishModal
          v-model:show="showPublish"
          :logged-in="loggedIn"
          @published="onPublished"
        />
        <AuthModal v-model:show="showAuth" @success="onAuthSuccess" />
      </div>
    </n-message-provider>
  </n-config-provider>
</template>
