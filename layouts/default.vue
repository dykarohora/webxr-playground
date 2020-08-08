<template>
  <div class="app">
    <app-header/>
    <div class="app-body">
      <side-bar :nav-items="navItems"/>
        <main class="main">
          <div class="container-fluid">
            <nuxt/>
          </div>
        </main>
    </div>
  </div>
</template>


<script lang="ts">
  import Vue from 'vue'
  import { Component, Prop, Watch } from 'nuxt-property-decorator'
  import AppHeader from '../components/layout/AppHeader.vue'
  import { SideBarItem } from '../components/layout/SideBarItem'
  import SideBar from '../components/layout/SideBar.vue'

  @Component({
    components: {
      SideBar,
      AppHeader

    }
  })
  export default class extends Vue {
    private navItems: (SideBarItem)[] = [
      {name: 'Top', url: '/', icon: 'icon-speedometer', type: 'link'},
      {name: 'WebGL2', type: 'title'},
      {name: 'Wall Light', url: '/webgl2/wall-light', type: 'link'},
      {name: 'VR', type: 'title'},
      {name: 'BareBones', url: '/vr/bare-bones', type: 'link'},
      {name: 'AR', type: 'title'},
    ]
  }
</script>
