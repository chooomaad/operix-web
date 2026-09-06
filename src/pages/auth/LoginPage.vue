<template>
  <div class="min-h-screen flex">

    <!-- ══ LEFT PANEL — Forms ══════════════════════════════════════════════════ -->
    <div class="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-14 xl:px-20 bg-white relative">

      <!-- Top brand -->
      <div class="absolute top-8 left-8 sm:left-14 xl:left-20 flex items-center gap-3">
        <div class="w-9 h-9 flex items-center justify-center">
          <img :src="operixLogoUrl" class="w-full h-full object-contain" alt="Operix" @error="(e) => { (e.target as HTMLImageElement).style.display='none' }" />
        </div>
        <span class="font-bold text-gray-800 text-sm tracking-tight">Operix HSSE</span>
      </div>

      <div class="max-w-sm w-full mx-auto pt-20 pb-12">

        <!-- ── LOGIN ─────────────────────────────────────────────────────────── -->
        <transition name="slide" mode="out-in">
        <div v-if="view === 'login'" key="login">
          <h2 class="text-2xl font-bold text-gray-900 mb-1">{{ t('auth.welcome') }}</h2>
          <p class="text-gray-500 text-sm mb-8">{{ t('auth.loginSubtitle') }}</p>

          <div class="space-y-4">
            <div>
              <label class="label">{{ t('auth.employeeId') }}</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                  </svg>
                </span>
                <input
                  v-model="form.matricule"
                  type="text"
                  class="input pl-9 uppercase"
                  placeholder="TCN-ADM-001"
                  autocomplete="username"
                  @keyup.enter="loginPin()"
                />
              </div>
            </div>

            <div>
              <label class="label">{{ t('auth.pin') }}</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  v-model="form.pin"
                  :type="showPin ? 'text' : 'password'"
                  class="input pl-9 pr-10"
                  placeholder="••••••"
                  autocomplete="current-password"
                  @keyup.enter="loginPin()"
                />
                <button type="button" @click="showPin = !showPin"
                  class="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                  <svg v-if="!showPin" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
            <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            {{ error }}
          </div>

          <button @click="loginPin" :disabled="loading" class="mt-6 w-full py-3 px-4 bg-[#0f2847] hover:bg-[#1a3a6b] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60">
            <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ loading ? t('auth.signingIn') : t('auth.signIn') }}
          </button>

          <div class="mt-6 flex items-center justify-between text-sm">
            <button @click="view = 'forgot'" class="text-[#0f2847] hover:underline font-medium">
              {{ t('auth.forgotPin') }}
            </button>
            <button @click="view = 'register'" class="text-gray-500 hover:text-[#0f2847] hover:underline">
              {{ t('auth.createAccount') }}
            </button>
          </div>
        </div>

        <!-- ── REGISTER ───────────────────────────────────────────────────────── -->
        <div v-else-if="view === 'register'" key="register">
          <button @click="view = 'login'; clearForm()" class="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-6 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            {{ t('auth.backToLogin') }}
          </button>

          <h2 class="text-2xl font-bold text-gray-900 mb-1">{{ t('auth.registerTitle') }}</h2>
          <p class="text-gray-500 text-sm mb-6">{{ t('auth.registerSubtitle') }}</p>

          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">{{ t('auth.firstName') }} *</label>
                <input v-model="reg.prenom" type="text" class="input" placeholder="Mohamed" />
              </div>
              <div>
                <label class="label">{{ t('auth.lastName') }} *</label>
                <input v-model="reg.nom" type="text" class="input" placeholder="Ould Ahmed" />
              </div>
            </div>
            <div>
              <label class="label">{{ t('auth.employeeId') }} *</label>
              <input v-model="reg.matricule" type="text" class="input uppercase" placeholder="TCN-XXX-000" />
            </div>
            <div>
              <label class="label">{{ t('auth.email') }} *
                <span class="text-gray-400 font-normal ml-1 text-xs">{{ t('auth.emailHint') }}</span>
              </label>
              <input v-model="reg.email" type="email" class="input" placeholder="vous@tcn.mr" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">{{ t('auth.pinField') }}</label>
                <input v-model="reg.pin" type="password" class="input" placeholder="••••••" maxlength="50" />
              </div>
              <div>
                <label class="label">{{ t('auth.confirmPin') }} *</label>
                <input v-model="reg.pin_confirmation" type="password" class="input" placeholder="••••••" maxlength="50" />
              </div>
            </div>
          </div>

          <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{{ error }}</div>
          <div v-if="success" class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-start gap-2">
            <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            {{ success }}
          </div>

          <button v-if="!success" @click="doRegister" :disabled="loading" class="mt-5 w-full py-3 px-4 bg-[#0f2847] hover:bg-[#1a3a6b] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60">
            <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ loading ? t('auth.sending') : t('auth.sendRequest') }}
          </button>
          <button v-else @click="view = 'login'; clearForm()" class="mt-5 w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors">
            {{ t('auth.goToLogin') }}
          </button>
        </div>

        <!-- ── FORGOT PIN ─────────────────────────────────────────────────────── -->
        <div v-else-if="view === 'forgot'" key="forgot">
          <button @click="view = 'login'; clearForm()" class="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-6 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            {{ t('auth.backToLogin') }}
          </button>

          <!-- Demande : ADRESSE EMAIL. Le lien de reset part vers cette meme
               adresse ; la reinitialisation se fait ensuite sur /reset-pin ouverte
               depuis le lien recu par email. -->
          <div v-if="!success">
            <h2 class="text-2xl font-bold text-gray-900 mb-1">{{ t('auth.resetPinTitle') }}</h2>
            <p class="text-gray-500 text-sm mb-6">{{ t('auth.resetPinSubtitle') }}</p>
            <div>
              <label class="label">{{ t('auth.emailAddress') }}</label>
              <input v-model="forgot.email" type="email" class="input" :placeholder="t('auth.emailPlaceholder')" autocomplete="email" @keyup.enter="sendForgot" />
            </div>
            <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{{ error }}</div>
            <button @click="sendForgot" :disabled="loading || cooldown > 0" class="mt-5 w-full py-3 bg-[#0f2847] hover:bg-[#1a3a6b] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ cooldown > 0 ? t('auth.resendIn', { s: cooldown }) : (loading ? t('auth.sending') : t('auth.sendResetLink')) }}
            </button>
          </div>

          <!-- Confirmation generique : ne revele jamais si le compte existe. -->
          <div v-else>
            <div class="mt-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{{ success }}</div>
            <button @click="view = 'login'; clearForm()" class="mt-5 w-full py-3 bg-[#0f2847] hover:bg-[#1a3a6b] text-white font-semibold rounded-xl transition-colors">
              {{ t('auth.backToLogin') }}
            </button>
          </div>
        </div>
        </transition>
      </div>

      <!-- Footer -->
      <div class="absolute bottom-6 left-0 right-0 text-center text-gray-400 text-xs">
        {{ t('auth.footer', { year: new Date().getFullYear() }) }}
      </div>
    </div>

    <!-- ══ RIGHT PANEL — TCN Brand ══════════════════════════════════════════════ -->
    <div class="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col" style="background: linear-gradient(160deg, #0f2847 0%, #0a1e38 60%, #071428 100%)">


      <!-- Decorative background circles -->
      <div class="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.06]" style="background: radial-gradient(circle, #4a90d9, transparent)"></div>
      <div class="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-[0.07]" style="background: radial-gradient(circle, #2a6ab8, transparent)"></div>

      <!-- Grid pattern overlay -->
      <div class="absolute inset-0 opacity-[0.03]"
        style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 40px 40px"></div>

      <div class="relative z-10 flex flex-col h-full p-12 pt-14">


        <!-- CENTER: Logo + Name -->
        <div class="flex flex-col items-center justify-center flex-1 text-center py-8">

          <!-- TCN Logo — grand : uploadé → TCN bundlé → « T » (jamais cassé) -->
          <div class="mb-8">
            <div class="w-40 h-40 rounded-3xl bg-white flex items-center justify-center shadow-2xl shadow-black/40 mx-auto overflow-hidden p-3">
              <img
                :src="org.logo_url ?? tcnLogoUrl"
                class="w-full h-full object-contain" alt="Logo TCN"
                @error="(e) => { const el = e.target as HTMLImageElement; if (!el.dataset.fb) { el.dataset.fb='1'; el.src=tcnLogoUrl } }"
              />
            </div>
          </div>

          <!-- Nom TCN -->
          <h1 class="text-white text-4xl font-black leading-tight mb-1 tracking-tight">
            Terminal à Conteneurs
          </h1>
          <h2 class="text-4xl font-black leading-tight mb-4 tracking-tight" style="color: #FFD700">
            de Nouakchott
          </h2>
          <p class="text-blue-200/80 text-sm font-medium mb-10 tracking-widest uppercase">
            {{ t('auth.platformTitle') }}
          </p>

          <!-- HSSE animated word -->
          <div class="mb-10 h-14 flex items-center justify-center">
            <transition name="word" mode="out-in">
              <span
                :key="currentPillar"
                class="text-4xl font-black uppercase tracking-widest"
                :style="{ color: pillarColors[currentPillar] }"
              >
                {{ pillarWords[currentPillar] }}
              </span>
            </transition>
          </div>
        </div>

        <!-- BOTTOM: Powered by Operix -->
        <div class="flex justify-center mt-auto">
          <div class="flex items-center gap-3 bg-white/[0.06] border border-white/10 rounded-2xl px-5 py-3 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <!-- Logo Operix réel -->
            <div class="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
              <img :src="operixLogoUrl" class="w-full h-full object-contain" alt="Operix" @error="(e) => (e.target as HTMLImageElement).style.display='none'" />
              <div class="w-full h-full bg-blue-600 rounded-lg items-center justify-center text-white font-black text-base hidden">O</div>
            </div>
            <div>
              <div class="text-white/40 text-[9px] uppercase tracking-widest font-semibold leading-none mb-1">{{ t('auth.poweredBy') }}</div>
              <div class="text-white font-black text-sm leading-none tracking-tight">
                Operix <span class="font-normal" style="color: #93c5fd">Workforce</span>
              </div>
            </div>
            <div class="w-px h-8 bg-white/10 mx-0.5"></div>
            <div class="text-right">
              <div class="text-white/40 text-[10px] font-semibold tracking-wide">HSSE · RH · Opérations</div>
              <div class="text-white/20 text-[9px] tracking-wide mt-0.5">operix-app.com</div>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authApi, organisationApi } from '@/api'

const { t }  = useI18n()
const auth   = useAuthStore()
const router = useRouter()

type View = 'login' | 'register' | 'forgot'
const view      = ref<View>('login')
const loading   = ref(false)
const error     = ref('')
const success   = ref('')
const showPin   = ref(false)

const form = reactive({ matricule: '', pin: '' })
const reg  = reactive({ prenom: '', nom: '', matricule: '', email: '', pin: '', pin_confirmation: '' })
// Le reset demande l'ADRESSE EMAIL ; le lien part vers cette adresse et la
// definition du nouveau PIN se fait sur /reset-pin via le lien recu.
const forgot = reactive({ email: '' })

// Cooldown anti-spam : apres un envoi (ou un 429 serveur), on empeche un renvoi
// immediat et on affiche le decompte. Aligne sur la fenetre serveur (60 s).
const cooldown = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | undefined
function startCooldown(seconds: number) {
  cooldown.value = Math.max(0, Math.floor(seconds))
  clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0) clearInterval(cooldownTimer)
  }, 1000)
}

const pillarWords  = ['Health', 'Safety', 'Security', 'Environment']
const pillarColors = ['#34d399', '#fbbf24', '#60a5fa', '#4ade80']
const currentPillar = ref(0)

setInterval(() => {
  currentPillar.value = (currentPillar.value + 1) % pillarWords.length
}, 2000)

const org = reactive({ name: 'Terminal à Conteneurs de Nouakchott', short_name: 'TCN', logo_url: null as string | null })
const operixLogoUrl = '/logos/logo-operix.png'
const tcnLogoUrl = '/logos/logo-tcn.png'

onMounted(async () => {
  try {
    const { data } = await organisationApi.public()
    Object.assign(org, data)
  } catch { /* fallback values above */ }
})

function clearForm() {
  error.value   = ''
  success.value = ''
  Object.assign(form,   { matricule: '', pin: '' })
  Object.assign(reg,    { prenom: '', nom: '', matricule: '', email: '', pin: '', pin_confirmation: '' })
  Object.assign(forgot, { email: '' })
}

async function loginPin() {
  if (loading.value) return
  if (!form.matricule || !form.pin) { error.value = t('auth.errors.credentialsRequired'); return }
  loading.value = true; error.value = ''
  try {
    await auth.loginMatricule(form.matricule.trim().toUpperCase(), form.pin.trim())
    router.push('/')
  } catch (e: any) {
    error.value = e.response?.data?.message ?? t('auth.errors.invalidCredentials')
  } finally { loading.value = false }
}

async function doRegister() {
  const { prenom, nom, matricule, email, pin, pin_confirmation } = reg
  if (!prenom || !nom || !matricule || !email || !pin) { error.value = t('auth.errors.allFieldsRequired'); return }
  if (pin !== pin_confirmation) { error.value = t('auth.errors.pinMismatch'); return }
  loading.value = true; error.value = ''
  try {
    const { data } = await authApi.register({ prenom, nom, matricule, email, pin, pin_confirmation })
    success.value = data.message
  } catch (e: any) {
    const errs = e.response?.data?.errors
    error.value = errs ? Object.values(errs).flat().join(' ') : (e.response?.data?.message ?? t('auth.errors.registrationError'))
  } finally { loading.value = false }
}

async function sendForgot() {
  if (cooldown.value > 0) return
  if (!forgot.email) { error.value = t('auth.errors.emailRequired'); return }
  loading.value = true; error.value = ''
  try {
    // La reponse du serveur est deja GENERIQUE (anti-enumeration) : on l'affiche
    // telle quelle. La reinitialisation se poursuit sur /reset-pin via le lien recu.
    const { data } = await authApi.forgotPin(forgot.email.trim().toLowerCase())
    success.value = data.message
    startCooldown(60) // empeche un renvoi immediat (aligne sur le serveur)
  } catch (e: any) {
    // 429 : trop de demandes. On respecte le delai indique par le serveur.
    if (e.response?.status === 429) {
      startCooldown(Number(e.response?.data?.retry_after ?? 60))
      error.value = t('auth.tooManyResets')
    } else {
      error.value = e.response?.data?.message ?? t('common.error')
    }
  } finally { loading.value = false }
}
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.22s ease; }
.slide-enter-from { opacity: 0; transform: translateX(16px); }
.slide-leave-to   { opacity: 0; transform: translateX(-16px); }

.word-enter-active, .word-leave-active { transition: all 0.4s ease; }
.word-enter-from { opacity: 0; transform: translateY(20px); }
.word-leave-to   { opacity: 0; transform: translateY(-20px); }
</style>
