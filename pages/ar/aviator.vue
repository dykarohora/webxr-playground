<template>
  <div id="world"/>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop, Watch } from 'nuxt-property-decorator'
import { AviatorAR } from '../../components/ar/AviatorAR'

@Component
export default class extends Vue {
  mounted() {
    const div = document.getElementById('world') as HTMLDivElement
    const aviator = new AviatorAR(div)
  }
}
</script>
