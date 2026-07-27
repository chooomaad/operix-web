<template>
  <div class="p-6 space-y-6 max-w-3xl">
    <div>
      <h2 class="text-lg font-semibold text-gray-900">{{ t('settings.title') }}</h2>
      <p class="text-sm text-gray-500">{{ t('settings.organisation') }}</p>
    </div>

    <!-- Skeleton loader -->
    <template v-if="loading">
      <div class="card space-y-4 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/3"></div>
        <div class="flex gap-6">
          <div class="w-20 h-20 bg-gray-200 rounded-xl"></div>
          <div class="space-y-2 flex-1">
            <div class="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="h-10 bg-gray-200 rounded"></div>
          <div class="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </template>

    <template v-else>
      <!-- Branding -->
      <div class="card space-y-5">
        <h3 class="font-semibold text-gray-800 border-b pb-2">{{ t('settings.visualIdentity') }}</h3>

        <!-- Logo upload zone -->
        <div class="flex items-start gap-6">
          <div
            class="w-24 h-24 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-colors group relative"
            @click="logoInputRef?.click()"
            :title="t('settings.changeLogo')"
          >
            <img v-if="settings.logo_url" :src="settings.logo_url" class="w-full h-full object-contain p-1" alt="Logo" />
            <div v-else class="text-center">
              <PhotoIcon class="w-8 h-8 text-gray-300 mx-auto" />
              <span class="text-[10px] text-gray-400 mt-1 block">{{ t('settings.logo') }}</span>
            </div>
            <!-- Overlay on hover -->
            <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
              <ArrowUpTrayIcon class="w-6 h-6 text-white" />
            </div>
          </div>

          <div class="space-y-2 pt-1">
            <p class="text-sm text-gray-600">{{ t('settings.logoFormat') }}</p>
            <div class="flex gap-2">
              <button @click="logoInputRef?.click()" class="btn-secondary text-sm flex items-center gap-1.5">
                <ArrowUpTrayIcon class="w-4 h-4" />
                {{ t('settings.changeLogo') }}
              </button>
              <button v-if="settings.logo_url" @click="deleteLogo" :disabled="logoLoading" class="btn-danger text-sm">
                {{ t('settings.deleteLogo') }}
              </button>
            </div>
            <p v-if="logoLoading" class="text-xs text-blue-600 animate-pulse">{{ t('settings.uploading') }}</p>
            <p v-if="logoError" class="text-xs text-red-600">{{ logoError }}</p>
          </div>
          <input ref="logoInputRef" type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml" class="hidden" @change="uploadLogo" />
        </div>

        <!-- Name + Color -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">{{ t('settings.orgName') }} *</label>
            <input v-model="form.name" class="input" required />
          </div>
          <div>
            <label class="label">{{ t('settings.primaryColor') }}</label>
            <div class="flex items-center gap-2">
              <input v-model="form.primary_color" type="color" class="w-10 h-10 rounded cursor-pointer border border-gray-200 p-0.5" />
              <input v-model="form.primary_color" class="input flex-1 font-mono uppercase" placeholder="#0f2847" maxlength="7" />
            </div>
          </div>
        </div>
      </div>

      <!-- Regional -->
      <div class="card space-y-4">
        <h3 class="font-semibold text-gray-800 border-b pb-2">{{ t('settings.localization') }}</h3>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="label">{{ t('settings.country') }}</label>
            <select v-model="form.country" class="input">
              <option value="MR">🇲🇷 {{ t('settings.countries.MR') }}</option>
              <option value="SN">🇸🇳 {{ t('settings.countries.SN') }}</option>
              <option value="MA">🇲🇦 {{ t('settings.countries.MA') }}</option>
              <option value="FR">🇫🇷 {{ t('settings.countries.FR') }}</option>
              <option value="CI">🇨🇮 {{ t('settings.countries.CI') }}</option>
            </select>
          </div>
          <div>
            <label class="label">{{ t('settings.timezone') }}</label>
            <select v-model="form.timezone" class="input">
              <option value="Africa/Nouakchott">Africa/Nouakchott (UTC+0)</option>
              <option value="Africa/Dakar">Africa/Dakar (UTC+0)</option>
              <option value="Africa/Casablanca">Africa/Casablanca (UTC+1)</option>
              <option value="Europe/Paris">Europe/Paris (UTC+1/2)</option>
            </select>
          </div>
          <div>
            <label class="label">{{ t('settings.language') }}</label>
            <select v-model="form.locale" class="input">
              <option value="fr">🇫🇷 {{ t('settings.languages.fr') }}</option>
              <option value="en">🇬🇧 {{ t('settings.languages.en') }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <button @click="save" :disabled="saving" class="btn-primary flex items-center gap-2">
          <svg v-if="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ saving ? t('settings.saving') : t('settings.saveChanges') }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { settingsApi } from '@/api'
import { PhotoIcon, ArrowUpTrayIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const toast = useToast()

const loading    = ref(true)
const saving     = ref(false)
const logoLoading = ref(false)
const logoError  = ref('')
const logoInputRef = ref<HTMLInputElement | null>(null)
const settings   = ref<any>({})
const form       = reactive({ name: '', primary_color: '#0f2847', country: 'MR', timezone: 'Africa/Nouakchott', locale: 'fr' })

async function load() {
  loading.value = true
  try {
    const { data } = await settingsApi.get()
    settings.value = data
    Object.assign(form, {
      name:          data.name          ?? '',
      primary_color: data.primary_color ?? '#0f2847',
      country:       data.country       ?? 'MR',
      timezone:      data.timezone      ?? 'Africa/Nouakchott',
      locale:        data.locale        ?? 'fr',
    })
  } finally { loading.value = false }
}

async function save() {
  saving.value = true
  try {
    await settingsApi.update({ ...form })
    document.documentElement.style.setProperty('--brand', form.primary_color)
    toast.add({ severity: 'success', summary: t('settings.saved'), life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message ?? t('common.error'), life: 4000 })
  } finally { saving.value = false }
}

async function uploadLogo(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  logoError.value   = ''
  logoLoading.value = true

  const fd = new FormData()
  fd.append('logo', file)

  try {
    const { data } = await settingsApi.uploadLogo(fd)
    settings.value.logo_url = data.logo_url + '?t=' + Date.now()
    toast.add({ severity: 'success', summary: t('settings.logoUpdated'), life: 3000 })
  } catch (err: any) {
    const msg = err.response?.data?.message ?? err.response?.data?.errors?.logo?.[0] ?? 'Erreur upload logo'
    logoError.value = msg
    toast.add({ severity: 'error', summary: msg, life: 5000 })
  } finally {
    logoLoading.value = false
    if (logoInputRef.value) logoInputRef.value.value = ''
  }
}

async function deleteLogo() {
  if (!confirm(t('settings.confirmDeleteLogo'))) return
  logoLoading.value = true
  try {
    await settingsApi.deleteLogo()
    settings.value.logo_url = null
    toast.add({ severity: 'success', summary: t('settings.logoDeleted'), life: 3000 })
  } finally { logoLoading.value = false }
}

onMounted(load)
</script>
