import type { TranslationMap } from './i18n-types'

export const authTranslations: TranslationMap = {
  // Google complete-registration form
  'Давайте создадим вам аккаунт': {
    kk: 'Сізге аккаунт жасайық',
    en: "Let's create your account",
  },
  'Вход через Google выполнен:': {
    kk: 'Google арқылы кіру аяқталды:',
    en: 'Signed in with Google:',
  },
  'Заполните данные ниже, чтобы завершить регистрацию.': {
    kk: 'Тіркеуді аяқтау үшін төмендегі деректерді толтырыңыз.',
    en: 'Fill in the details below to finish your registration.',
  },
  'Имя должно содержать не менее 2 символов': {
    kk: 'Аты кемінде 2 таңбадан тұруы керек',
    en: 'Name must be at least 2 characters',
  },
  'Имя должно содержать не более 100 символов': {
    kk: 'Аты 100 таңбадан аспауы керек',
    en: 'Name must be at most 100 characters',
  },
  'Номер WhatsApp': {
    kk: 'WhatsApp нөмірі',
    en: 'WhatsApp number',
  },
  'Подтвердите согласие, чтобы продолжить': {
    kk: 'Жалғастыру үшін келісіміңізді растаңыз',
    en: 'Confirm your consent to continue',
  },
  Принимаю: {
    kk: 'Мен мыналарды қабылдаймын:',
    en: 'I agree to the',
  },
  'политику конфиденциальности': {
    kk: 'Құпиялылық саясаты',
    en: 'Privacy Policy',
  },
  'Создаём аккаунт…': {
    kk: 'Аккаунт жасалуда…',
    en: 'Creating account…',
  },
  'Создать аккаунт': {
    kk: 'Аккаунт жасау',
    en: 'Create account',
  },
  'Вернуться ко входу': {
    kk: 'Кіруге оралу',
    en: 'Back to sign in',
  },
  'Уже есть аккаунт?': {
    kk: 'Аккаунтыңыз бар ма?',
    en: 'Already have an account?',
  },
  'Сессия регистрации истекла. Войдите через Google ещё раз.': {
    kk: 'Тіркеу сессиясының мерзімі өтті. Google арқылы қайта кіріңіз.',
    en: 'Your registration session has expired. Sign in with Google again.',
  },

  // Auth input
  'Скрыть пароль': {
    kk: 'Құпиясөзді жасыру',
    en: 'Hide password',
  },
  'Показать пароль': {
    kk: 'Құпиясөзді көрсету',
    en: 'Show password',
  },

  // Phone validation
  'Введите номер WhatsApp': {
    kk: 'WhatsApp нөмірін енгізіңіз',
    en: 'Enter your WhatsApp number',
  },
  'Введите номер полностью, например +7 700 123 45 67': {
    kk: 'Нөмірді толық енгізіңіз, мысалы: +7 700 123 45 67',
    en: 'Enter the full number, for example +7 700 123 45 67',
  },

  'Срок гостевого доступа истёк. Войдите для продолжения подготовки': {
    kk: 'Қонақ рұқсатының мерзімі аяқталды. Дайындықты жалғастыру үшін кіріңіз.',
    en: 'Guest access has expired. Sign in to continue preparing.',
  },

  // Turnstile
  'Не удалось загрузить проверку безопасности. Обновите страницу.': {
    kk: 'Қауіпсіздік тексерімін жүктеу мүмкін болмады. Бетті жаңартыңыз.',
    en: 'Could not load the security check. Refresh the page.',
  },

  // API error messages (getErrorMessage)
  'Адрес API не настроен': {
    kk: 'API мекенжайы бапталмаған',
    en: 'The API address is not configured',
  },
  'Не удалось связаться с сервером': {
    kk: 'Сервермен байланысу мүмкін болмады',
    en: 'Could not reach the server',
  },
  'Подтверждение через WhatsApp скоро будет доступно.': {
    kk: 'WhatsApp арқылы растау жақында қолжетімді болады.',
    en: 'Verification via WhatsApp will be available soon.',
  },
  'Достигнут дневной лимит использования. Лимит обновится в полночь.': {
    kk: 'Күндік пайдалану лимитіне жеттіңіз. Лимит түнде жаңарады.',
    en: 'You have reached the daily usage limit. The limit resets at midnight.',
  },
  'Не настроен VITE_API_BASE_URL.': {
    kk: 'VITE_API_BASE_URL бапталмаған.',
    en: 'VITE_API_BASE_URL is not configured.',
  },
  'Хранилище файлов временно недоступно. Повторите загрузку немного позже.': {
    kk: 'Файл қоймасы уақытша қолжетімсіз. Жүктеуді сәлден соң қайталаңыз.',
    en: 'File storage is temporarily unavailable. Try the upload again a little later.',
  },
  'Запись слишком большая. Сократите её и попробуйте снова.': {
    kk: 'Жазба тым үлкен. Оны қысқартып, қайталап көріңіз.',
    en: 'The recording is too large. Shorten it and try again.',
  },
  'Автоматическая проверка пока не настроена. Обратитесь к администратору.': {
    kk: 'Автоматты тексеру әзірше бапталмаған. Әкімшіге хабарласыңыз.',
    en: 'Automatic assessment is not set up yet. Please contact the administrator.',
  },
  'Сервис проверки временно недоступен. Черновики сохранены — попробуйте отправить работу ещё раз.':
    {
      kk: 'Тексеру қызметі уақытша қолжетімсіз. Нобайлар сақталды — жұмысты қайта жіберіп көріңіз.',
      en: 'The assessment service is temporarily unavailable. Your drafts are saved — try submitting your work again.',
    },
}
