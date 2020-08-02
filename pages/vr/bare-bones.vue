<template>
  <div>
    <button id="vr" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop, Watch } from 'nuxt-property-decorator'
import { VrBareBones } from '../../components/vr/VrBareBones'

@Component
export default class extends Vue {
  mounted() {
    const button = document.getElementById('vr') as HTMLButtonElement
    const app = new VrBareBones(button)
    app.initXR()
  }
}
</script>

