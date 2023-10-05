<script setup lang="ts">
import testImage from './assets/vue.png?format=webp&width=200'
import testJpeg from './assets/vue.png?format=jpeg&height=300&quality=5'
import testImage2 from './assets/vue.png?format=webp&width=400'
</script>

<template>
  <img alt="Vue logo" :src="testImage" />
  <img alt="vue" :src="testJpeg">
  <img alt="Vue logo" :src="testImage2" />
</template>

<style scoped>

</style>
