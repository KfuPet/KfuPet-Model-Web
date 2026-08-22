<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { communityApi } from '../api'
import type { Comment, Post } from '../api/types'

const props = defineProps<{ loggedIn: boolean }>()

const message = useMessage()
const posts = ref<Post[]>([])
const activePost = ref<Post | null>(null)
const detailLoading = ref(false)
const comments = ref<Comment[]>([])
const commentForm = ref('')

/** 头像底色按用户名散列，暖调五色循环 */
const avatarPalette = ['#d2613c', '#7c9473', '#c9a227', '#4e8d8b', '#b5651d']
function avatarColor(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return avatarPalette[h % avatarPalette.length]
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function load() {
  const data = await communityApi.posts()
  posts.value = data.items
}

defineExpose({ reload: load })

/** 进入帖子详情 */
async function openPost(post: Post) {
  detailLoading.value = true
  activePost.value = post
  commentForm.value = ''
  comments.value = []
  try {
    const [detail, list] = await Promise.all([
      communityApi.post(post.id),
      communityApi.comments(post.id),
    ])
    activePost.value = detail
    comments.value = list
  } catch (e) {
    message.error((e as Error).message)
    activePost.value = null
  } finally {
    detailLoading.value = false
  }
}

function backToList() {
  activePost.value = null
  load()
}

async function createComment() {
  if (!activePost.value) return
  try {
    await communityApi.createComment(activePost.value.id, { content: commentForm.value })
    message.success('评论成功')
    commentForm.value = ''
    comments.value = await communityApi.comments(activePost.value.id)
    activePost.value = {
      ...activePost.value,
      commentCount: activePost.value.commentCount + 1,
    }
  } catch (e) {
    message.error((e as Error).message)
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <!-- 帖子详情 -->
    <section v-if="activePost" class="animate-card-in">
      <n-button quaternary round size="small" class="pressable mb-4" @click="backToList">
        ← 返回列表
      </n-button>

      <n-card class="lift-card" style="cursor: default">
        <h2 class="text-xl font-bold leading-snug" style="color: var(--ink)">
          {{ activePost.title }}
        </h2>
        <div class="mt-3 flex flex-wrap items-center gap-3 text-xs" style="color: var(--muted)">
          <span class="flex items-center gap-2">
            <span
              class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
              :style="{ background: avatarColor(activePost.author.username) }"
            >
              {{ activePost.author.username.charAt(0).toUpperCase() }}
            </span>
            {{ activePost.author.username }}
          </span>
          <span
            class="rounded-full px-2 py-px"
            style="background: var(--sage-soft); color: #4d6547"
          >
            {{ activePost.category.name }}
          </span>
          <span>{{ formatTime(activePost.createdAt) }}</span>
          <span>浏览 {{ activePost.viewCount }}</span>
        </div>
        <div
          v-if="activePost.tags?.length"
          class="mt-2 flex flex-wrap gap-1.5"
        >
          <span
            v-for="t in activePost.tags"
            :key="t.id"
            class="rounded-full px-2 py-px text-xs"
            style="background: var(--accent-soft); color: var(--accent-pressed)"
          >
            # {{ t.name }}
          </span>
        </div>
        <p
          class="mt-4 whitespace-pre-wrap border-t pt-4 text-sm leading-relaxed"
          style="border-color: var(--line); color: #4a4238"
        >
          {{ activePost.content }}
        </p>
      </n-card>

      <!-- 评论区 -->
      <n-card class="lift-card mt-4" style="cursor: default">
        <h3 class="mb-3 flex items-center gap-2 text-base font-semibold" style="color: var(--ink)">
          评论
          <span
            class="rounded-full px-2 py-0.5 text-xs font-medium"
            style="background: var(--accent-soft); color: var(--accent-pressed)"
          >
            {{ comments.length }}
          </span>
        </h3>

        <div v-if="detailLoading" class="py-6 text-center text-sm" style="color: var(--muted)">
          加载中…
        </div>
        <template v-else>
          <div v-if="comments.length" class="mb-4 space-y-2.5">
            <div
              v-for="(c, ci) in comments"
              :key="c.id"
              class="animate-card-in flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm"
              :style="{
                background: 'var(--surface-soft)',
                animationDelay: `${Math.min(ci, 10) * 50}ms`,
              }"
            >
              <span
                class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                :style="{ background: avatarColor(c.author.username) }"
              >
                {{ c.author.username.charAt(0).toUpperCase() }}
              </span>
              <div class="min-w-0">
                <div class="flex items-baseline gap-2">
                  <span class="font-medium" style="color: var(--ink)">
                    {{ c.author.username }}
                  </span>
                  <span class="text-xs" style="color: var(--muted)">
                    {{ formatTime(c.createdAt) }}
                  </span>
                </div>
                <p class="mt-0.5 whitespace-pre-wrap" style="color: #4a4238">{{ c.content }}</p>
              </div>
            </div>
          </div>
          <div v-else class="mb-4 text-sm" style="color: var(--muted)">
            暂无评论，来抢沙发
          </div>
        </template>

        <div class="flex gap-2">
          <n-input
            v-model:value="commentForm"
            placeholder="发表评论"
            @keyup.enter="createComment"
          />
          <n-button
            type="primary"
            round
            class="pressable"
            :disabled="!props.loggedIn || !commentForm.trim()"
            @click="createComment"
          >
            发送
          </n-button>
        </div>
        <p v-if="!props.loggedIn" class="mt-2 text-xs" style="color: var(--muted)">
          登录后可发表评论
        </p>
      </n-card>
    </section>

    <!-- 帖子列表 -->
    <section v-else>
      <h2 class="mb-3 flex items-center gap-2 text-lg font-semibold" style="color: var(--ink)">
        帖子列表
        <span
          class="rounded-full px-2 py-0.5 text-xs font-medium"
          style="background: var(--accent-soft); color: var(--accent-pressed)"
        >
          {{ posts.length }}
        </span>
      </h2>
      <n-empty v-if="!posts.length" description="暂无帖子，点击右下角发布第一篇吧" class="py-10" />
      <div v-else class="space-y-3.5">
        <n-card
          v-for="(p, i) in posts"
          :key="p.id"
          size="small"
          class="lift-card animate-card-in cursor-pointer"
          :style="{ animationDelay: `${Math.min(i, 8) * 70}ms` }"
          @click="openPost(p)"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition-transform duration-300 hover:scale-110"
              :style="{ background: avatarColor(p.author.username) }"
            >
              {{ p.author.username.charAt(0).toUpperCase() }}
            </span>
            <div class="min-w-0 flex-1">
              <div class="truncate font-medium" style="color: var(--ink)">
                {{ p.title }}
              </div>
              <div class="mt-0.5 flex items-center gap-2 text-xs" style="color: var(--muted)">
                {{ p.author.username }}
                <span
                  class="rounded-full px-2 py-px"
                  style="background: var(--sage-soft); color: #4d6547"
                >
                  {{ p.category.name }}
                </span>
              </div>
            </div>
          </div>
          <p
            class="post-excerpt mt-2.5 text-sm"
            style="color: #4a4238"
          >
            {{ p.content }}
          </p>
          <div class="mt-2.5 flex items-center gap-4 text-xs" style="color: var(--muted)">
            <span>浏览 {{ p.viewCount }}</span>
            <span>评论 {{ p.commentCount }}</span>
            <span>{{ formatTime(p.createdAt) }}</span>
          </div>
        </n-card>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 列表卡片正文摘要：最多两行，超出省略 */
.post-excerpt {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
