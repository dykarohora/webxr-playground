<template>
  <div v-if="isExternalLink">
    <a :href="url" :class="classList">
      <i :class="icon"></i> {{name}}
    </a>
  </div>
  <div v-else>
    <router-link :to="url" :class="classList">
      <i :class="icon"></i> {{name}}
    </router-link>
  </div>
</template>

<script lang="ts">
    import { Component, Vue, Prop } from 'nuxt-property-decorator'

    @Component
    export default class extends Vue {
        @Prop({
            type: String,
            default: '',
            required: false
        })
        private name!: string

        @Prop({
            type: String,
            default: '',
            required: false
        })
        private url!: string

        @Prop({
            type: String,
            default: '',
            required: false
        })
        private icon!: string

        @Prop({
            type: String,
            default: '',
            required: false
        })
        private classes!: string

        private get classList() {
            return [
                'nav-link',
                ...this.itemClasses
            ]
        }

        private get itemClasses() {
            return this.classes ? this.classes.split(' ') : []
        }

        private get isExternalLink(): boolean {
            return this.url.substring(0, 4) === 'http'
        }
    }
</script>

<style scoped>

</style>
