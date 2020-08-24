<template>
  <div class="app">
    <app-header/>
    <div class="app-body">
      <side-bar :nav-items="navItems"/>
        <main class="main">
          <div class="container-fluid m-0 p-0">
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
      {name: 'Cosmic Cube', url: '/vr/immersive-vr-session', type: 'link'},
      {name: 'AR', type: 'title'},
      {name: 'Ray Marching', type: 'title'},
      {name: 'FirstRayMarching', url: '/ray-marching/', type: 'link'},
      {name: 'Sphere', url: '/ray-marching/sphere', type: 'link'},
      {name: 'Repeatition Sphere', url: '/ray-marching/repeatition-sphere', type: 'link'},
      {name: 'Box', url: '/ray-marching/box', type: 'link'},
      {name: 'Reflect', url: '/ray-marching/reflect', type: 'link'},
      {name: 'Bloom', url: '/ray-marching/bloom', type: 'link'},
      {name: 'Sphere Bloom', url: '/ray-marching/bloom2', type: 'link'},
      {name: 'Emissive Cube', url: '/ray-marching/emissive-cube', type: 'link'},
      {name: 'Emissive Light', url: '/ray-marching/emissive-light', type: 'link'},
      {name: 'Emissive Reflection', url: '/ray-marching/emissive-reflection', type: 'link'},
    ]
  }
</script>
