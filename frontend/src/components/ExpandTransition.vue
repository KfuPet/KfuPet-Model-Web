<script setup lang="ts">
/** 高度 + 透明度平滑展开/收起过渡组件 */

const TRANSITION = 'height 0.38s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease'

function onEnter(el: Element) {
  const e = el as HTMLElement
  e.style.transition = TRANSITION
  e.style.overflow = 'hidden'
  e.style.height = '0'
  e.style.opacity = '0'
  void e.offsetHeight
  e.style.height = `${e.scrollHeight}px`
  e.style.opacity = '1'
}

function onAfterEnter(el: Element) {
  const e = el as HTMLElement
  e.style.height = ''
  e.style.overflow = ''
}

function onLeave(el: Element) {
  const e = el as HTMLElement
  e.style.transition = TRANSITION
  e.style.overflow = 'hidden'
  e.style.height = `${e.scrollHeight}px`
  void e.offsetHeight
  e.style.height = '0'
  e.style.opacity = '0'
}
</script>

<template>
  <Transition :css="false" @enter="onEnter" @after-enter="onAfterEnter" @leave="onLeave">
    <slot />
  </Transition>
</template>
