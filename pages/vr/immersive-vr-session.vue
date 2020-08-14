<template>
  <div>
    <button id="vr" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop, Watch } from 'nuxt-property-decorator'
import { ImmersiveVR } from '../../components/vr/ImmersiveVR'

@Component
export default class extends Vue {
  mounted() {
    const button = document.getElementById('vr') as HTMLButtonElement
    const app = new ImmersiveVR(button)
    app.initXR()
  }
}
</script>

