<template>
  <div class="home">
    <wxp-paint/>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { Component, Prop, Watch } from 'nuxt-property-decorator'
  import WxpPaint from '../components/ar/WxpPaint.vue'


  @Component({
    components: {WxpPaint}
  })
  export default class extends Vue {
    public get welcomeMessage() {
      return 'welcome to webxr playground.'
    }
  }
</script>
