<template>
  <div class="home">
    <b-card>
      <b-card-title>
        {{welcomeMessage}}
      </b-card-title>
    </b-card>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { Component, Prop, Watch } from 'nuxt-property-decorator'

  @Component
  export default class extends Vue {
    public get welcomeMessage() {
      return 'welcome to webxr playground.'
    }
  }
</script>
