<template>
  <div class="sidebar">
    <nav class="sidebar-nav">
      <ul class="nav">
        <template v-for="(item) in navItems">
          <template v-if="item.type === 'link'">
            <li>
              <SideBarNavLink :name="item.name" :url="item.url" :icon="item.icon"/>
            </li>
          </template>
          <template v-else-if="item.type === 'title'">
            <SideBarNavTitle :name="item.name"/>
          </template>
        </template>
      </ul>
      <slot></slot>
    </nav>
  </div>
</template>

<script lang="ts">
    import { Component, Vue, Prop } from 'nuxt-property-decorator'
    import { SideBarItem } from './SideBarItem'
    import SideBarNavLink from './SideBarNavLink.vue'
    import SideBarNavTitle from './SideBarNavTitle.vue'

    @Component({
        components: {SideBarNavLink, SideBarNavTitle}
    })
    export default class extends Vue {
        @Prop({
            type: Array,
            required: true,
            default: () => []
        })
        private navItems!: SideBarItem[]
    }
</script>

<style lang="css">
  .nav-link {
    cursor: pointer;
  }
</style>
