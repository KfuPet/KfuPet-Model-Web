<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { communityApi } from '../api'
import type { Comment, Post } from '../api/types'
import ExpandTransition from '../components/ExpandTransition.vue'

const props = defineProps<{ loggedIn: boolean }>()

const message = useMessage()
const posts = ref<Post[]>([])
const activePostId = ref<number | null>(null)
const comments = ref<Comment[]>([])
const commentForm = ref('')

/** 头像底色按用户名散列，暖调五色循环 */
const avatarPalette = ['#d2613c', '#7c9473', '#c9a227', '#4e8d8b', '#b5651d']
function avatarColor(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return avatarPalette[h % avatarPalette.length]
}

async function load() {
  const data = await communityApi.posts()
  posts.value = data.items
}

defineExpose({ reload: load })

async function toggleComments(post: Post) {
  if (activePostId.value === post.id) {
    activePostId.value = null
    return
  }
  activePostId.value = post.id
  comments.value = await communityApi.comments(post.id)
}

async function createComment(postId: number) {
  try {
    await communityApi.createComment(postId, { content: commentForm.value })
    message.success('评论成功')
    commentForm.value = ''
    comments.value = await communityApi.comments(postId)
  } catch (e) {
    message.error((e as Error).message)
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <!-- 帖子列表 -->
    <section>
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
          class="lift-card animate-card-in"
          :style="{ animationDelay: `${Math.min(i, 8) * 70}ms` }"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition-transform duration-300 hover:scale-110"
                :style="{ background: avatarColor(p.author.username) }"
              >
                {{ p.author.username.charAt(0).toUpperCase() }}
              </span>
              <div class="min-w-0">
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
            <n-button
              size="small"
              :quaternary="activePostId !== p.id"
              :tertiary="activePostId === p.id"
              round
              class="pressable shrink-0"
              @click="toggleComments(p)"
            >
              {{ activePostId === p.id ? '收起' : '评论' }} · {{ p.commentCount }}
            </n-button>
          </div>

          <ExpandTransition>
            <div v-if="activePostId === p.id">
              <div class="mt-4 border-t pt-4" style="border-color: var(--line)">
                <div v-if="comments.length" class="mb-3 space-y-2.5">
                  <div
                    v-for="(c, ci) in comments"
                    :key="c.id"
                    class="animate-card-in flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm"
                    :style="{
                      background: 'var(--surface-soft)',
                      animationDelay: `${ci * 50}ms`,
                    }"
                  >
                    <span
                      class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      :style="{ background: avatarColor(c.author.username) }"
                    >
                      {{ c.author.username.charAt(0).toUpperCase() }}
                    </span>
                    <div>
                      <span class="mr-1.5 font-medium" style="color: var(--ink)">
                        {{ c.author.username }}
                      </span>
                      <span style="color: #4a4238">{{ c.content }}</span>
                    </div>
                  </div>
                </div>
                <div v-else class="mb-3 text-sm" style="color: var(--muted)">
                  暂无评论，来抢沙发
                </div>
                <div class="flex gap-2">
                  <n-input
                    v-model:value="commentForm"
                    placeholder="发表评论"
                    size="small"
                    @keyup.enter="createComment(p.id)"
                  />
                  <n-button
                    size="small"
                    type="primary"
                    round
                    class="pressable"
                    :disabled="!props.loggedIn"
                    @click="createComment(p.id)"
                  >
                    发送
                  </n-button>
                </div>
              </div>
            </div>
          </ExpandTransition>
        </n-card>
      </div>
    </section>
  </div>
</template>
