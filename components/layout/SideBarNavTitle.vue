<template>
  <li :class="classList">
    {{name}}
  </li>
</template>

<script lang="ts">
    import { Component, Vue, Prop } from 'nuxt-property-decorator'

    @Component
    export default class extends Vue {
        @Prop({
            type: String,
            required: true,
            default: ''
        })
        private name!: string

        @Prop({
            type: String,
            default: '',
            required: false
        })
        private classes!: string

        private get classList() {
            return [
                'nav-title',
                ...this.itemClasses
            ]
        }

        private get itemClasses(): string[] {
            return this.classes ? this.classes.split(' ') : []
        }
    }
</script>

