<template>
  <div id="world" />
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop, Watch } from 'nuxt-property-decorator'
import { Aviator } from '../../scripts/aviator/Aviator'

@Component
export default class extends Vue {
  mounted() {
    const div = document.getElementById('world') as HTMLDivElement
    const aviator = new Aviator(div)
  }
}
</script>
