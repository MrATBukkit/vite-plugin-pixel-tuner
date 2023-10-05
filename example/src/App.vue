<script setup lang="ts">
import testImage from './assets/vue.png?format=webp&width=200'
import testImage2 from './assets/vue.png?format=webp&width=400'
//const testImage = 'test.png'
</script>

<template>
  test
  <img alt="Vue logo" :src="testImage" />
  <img alt="Vue logo" :src="testImage2" />
</template>

<style scoped>

</style>
