<template>
  <div id="canvas">
    <wxp-paint/>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'

  import { Component } from 'nuxt-property-decorator'
  import { Cornes } from '../components/ar/Cornes'
  import WxpPaint from '../components/ar/WxpPaint.vue'
  @Component({
    components: {WxpPaint}
  })
  export default class extends Vue {
    // private cornes!: Cornes
    //
    // mounted() {
    //   const divElement = document.getElementById('canvas') as HTMLDivElement
    //   this.cornes = new Cornes(divElement)
    // }
  }
</script>
