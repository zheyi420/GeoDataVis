<script setup>
// import { RouterLink, RouterView } from 'vue-router'
// import HelloWorld from './components/HelloWorld.vue'
import MapContainer from './views/MapContainer.vue';
import MapIndicatorDataPanel from '@/views/panels/MapIndicatorDataPanel.vue'
</script>

<template>
  <MapContainer />
  <MapIndicatorDataPanel />
  <!-- <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView /> -->
</template>

<style scoped>

</style>
