<template>
  <div class="home">
    <b-card>
      <b-card-title>
        {{welcomeMessage}}
      </b-card-title>
      <paint/>
    </b-card>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { Component, Prop, Watch } from 'nuxt-property-decorator'
  import Paint from '../components/ar/paint.vue'
  @Component({
    components: {Paint}
  })
  export default class extends Vue {
    public get welcomeMessage() {
      return 'welcome to webxr playground.'
    }
  }
</script>
