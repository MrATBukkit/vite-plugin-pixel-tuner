<script setup lang="ts">
import testImage from './assets/vue.png?format=webp&width=200'
import testJpeg from './assets/vue.png?format=jpeg&height=300&w=80&quality=1'
import testImage2 from './assets/vue.png?format=webp&width=400'
</script>

<template>
  <img alt="Vue logo" :src="testImage" />
  <img alt="vue" :src="testJpeg">
  <img alt="Vue logo" :src="testImage2" />
</template>
