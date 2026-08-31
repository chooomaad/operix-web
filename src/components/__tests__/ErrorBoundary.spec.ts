import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import ErrorBoundary from '@/components/ErrorBoundary.vue'

// vue-router est utilise par le boundary (useRoute) : on le stub.
vi.mock('vue-router', () => ({
  useRoute: () => ({ fullPath: '/x' }),
}))

// Un enfant qui explose au rendu, comme une vue routee defaillante.
const Boom = defineComponent({
  render(): any {
    throw new Error('boom')
  },
})

const Ok = defineComponent({
  render() {
    return h('div', { class: 'ok' }, 'contenu normal')
  },
})

describe('ErrorBoundary — filet anti page blanche', () => {
  it('affiche l ecran de recuperation (EN par defaut) au lieu de propager l erreur', async () => {
    // On tait l erreur attendue dans la console pour un run propre.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.removeItem('operix_locale') // pas de langue => defaut anglais

    const wrapper = mount(ErrorBoundary, { slots: { default: () => h(Boom) } })
    await flushPromises()

    // L application n est PAS blanche : l ecran de recuperation est rendu.
    expect(wrapper.text()).toContain('Something went wrong')
    expect(wrapper.find('button').exists()).toBe(true)

    spy.mockRestore()
  })

  it('affiche le texte francais quand operix_locale = fr', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem('operix_locale', 'fr')

    const wrapper = mount(ErrorBoundary, { slots: { default: () => h(Boom) } })
    await flushPromises()

    expect(wrapper.text()).toContain('Une erreur est survenue')
    localStorage.removeItem('operix_locale')
    spy.mockRestore()
  })

  it('rend normalement le contenu quand tout va bien', () => {
    const wrapper = mount(ErrorBoundary, { slots: { default: () => h(Ok) } })
    expect(wrapper.find('.ok').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Something went wrong')
  })
})
