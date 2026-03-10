<template>
  <div class="home">
    <ScrollImages />
    <section class="content">
      <h1>Welcome to UPM-Event</h1>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    </section>
  </div>
</template>

<script setup>
import ScrollImages from '@/components/ScrollImages.vue'
</script>

<style scoped>
.home {
  width: 100%;
}
.content {
  padding: 4rem 2rem;
  text-align: center;
  background: #f9f9f9;
}
</style>