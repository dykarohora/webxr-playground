<template>
  <div></div>
</template>

<script lang="ts">
  import Vue from 'vue'

  import { Component } from 'nuxt-property-decorator'
  import { Cornes } from '../components/ar/Cornes'

  @Component
  export default class extends Vue {
    mounted() {
      const cornes = new Cornes()
    }
  }
</script>
