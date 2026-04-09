<template>
  <div class="beian-info">
    <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
      粤ICP备2026031216号-1
    </a>
    <span class="separator">|</span>
    <span>公安备案审核中</span>
  </div>
</template>

<style scoped lang="scss">
.beian-info {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;

  a,
  span {
    color: rgb(255, 255, 255);
    font-size: 12px;
    font-family: Avenir, Helvetica, Arial, sans-serif;
  }

  a {
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .separator {
    opacity: 0.8;
  }
}
</style>
