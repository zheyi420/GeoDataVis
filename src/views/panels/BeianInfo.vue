<template>
  <div class="beian-info">
    <img src="/备案图标.png" alt="备案图标" height="16" />
    <a href="https://beian.mps.gov.cn/#/query/webSearch?code=44060402003172" rel="noreferrer" target="_blank">粤公网安备44060402003172号</a>
    <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">粤ICP备2026031216号-1</a>
  </div>
</template>

<style scoped lang="scss">
.beian-info {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.35rem 0.5rem;
  white-space: nowrap;

  a {
    color: rgb(255, 255, 255);
    font-size: 12px;
    font-family: Avenir, Helvetica, Arial, sans-serif;
  }

  a {
    text-decoration: none;

    &:hover {
      // text-decoration: underline;
      color: #6dabe4;
    }
  }
}
</style>
