<template>
  <header class="app-header navbar">
    <button class="navbar-toggler sidebar-toggler d-md-down-none" type="button" @click="sidebarToggle">
      <span class="navbar-toggler-icon"></span>
    </button>
  </header>
</template>

<script lang="ts">
  import {Component, Vue} from 'nuxt-property-decorator'

  @Component({})
  export default class extends Vue {
    private sidebarToggle(e: Event) {
      e.preventDefault()
      document.body.classList.toggle('sidebar-hidden')
    }
  }
</script>
