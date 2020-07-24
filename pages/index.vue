<template>
  <div id="canvas"></div>
</template>

<script lang="ts">
  import Vue from 'vue'

  import { Component } from 'nuxt-property-decorator'
  import { Cornes } from '../components/ar/Cornes'

  @Component
  export default class extends Vue {
    private cornes!: Cornes

    mounted() {
      const divElement = document.getElementById('canvas') as HTMLDivElement
      this.cornes = new Cornes(divElement)
    }
  }
</script>
