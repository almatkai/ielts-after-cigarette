import type { TranslationMap } from './i18n-types'

// Tariffs, paywall, payment and admin billing screens.
export const billingTranslations: TranslationMap = {
  Тарифы: { kk: 'Тарифтер', en: 'Plans' },
  Оплата: { kk: 'Төлем', en: 'Payment' },
  'У сотрудников платформы полный доступ без тарифа.': {
    kk: 'Платформа қызметкерлеріне тарифсіз толық қолжетімділік берілген.',
    en: 'Platform staff have full access without a plan.',
  },
  'Доступ действует до': {
    kk: 'Қолжетімділік мерзімі:',
    en: 'Access valid until',
  },
  'осталось дней:': { kk: 'қалған күндер:', en: 'days left:' },
  'Следующий оплаченный период продлит доступ до': {
    kk: 'Келесі төленген кезең қолжетімділікті мына күнге дейін ұзартады:',
    en: 'The next paid period will extend access until',
  },
  'Встреч с преподавателем осталось:': {
    kk: 'Оқытушымен қалған кездесулер:',
    en: 'Sessions with instructor left:',
  },
  'Сейчас все тесты доступны без оплаты.': {
    kk: 'Қазір барлық тесттер төлемсіз қолжетімді.',
    en: 'All tests are currently available for free.',
  },
  'Тарифа нет. Бесплатные тесты по навыкам — Full Mock засчитывается как один тест каждого навыка:':
    {
      kk: 'Тариф жоқ. Дағдылар бойынша тегін тесттер — Full Mock әр дағдының бір тесті ретінде есептеледі:',
      en: 'No active plan. Free tests by skill — Full Mock counts as one test for each skill:',
    },
  Тариф: { kk: 'Тариф', en: 'Plan' },
  'Доступ до': { kk: 'Қолжетімділік мерзімі:', en: 'Access until' },
  'Продлить доступ': { kk: 'Қолжетімділікті ұзарту', en: 'Extend access' },
  'Бесплатные тесты': { kk: 'Тегін тесттер', en: 'Free tests' },
  'Выбрать тариф': { kk: 'Тариф таңдау', en: 'Choose a plan' },
  'Бесплатные тесты Listening закончились': {
    kk: 'Listening бойынша тегін тесттер аяқталды',
    en: 'Free Listening tests have ended',
  },
  'Бесплатные тесты Reading закончились': {
    kk: 'Reading бойынша тегін тесттер аяқталды',
    en: 'Free Reading tests have ended',
  },
  'Бесплатные тесты Writing закончились': {
    kk: 'Writing бойынша тегін тесттер аяқталды',
    en: 'Free Writing tests have ended',
  },
  'Бесплатные тесты Speaking закончились': {
    kk: 'Speaking бойынша тегін тесттер аяқталды',
    en: 'Free Speaking tests have ended',
  },
  'Бесплатные сообщения Юки на сегодня закончились': {
    kk: 'Юкидің бүгінгі тегін хабарламалары аяқталды',
    en: 'Free Yuki messages for today have ended',
  },
  'С тарифом лимит сообщений выше. Или вернитесь завтра — бесплатные сообщения обновятся.':
    {
      kk: 'Тарифпен хабарлама лимиті жоғарырақ болады. Немесе ертең қайта келіңіз — тегін хабарламалар жаңарады.',
      en: 'With a plan, the message limit is higher. Or come back tomorrow — free messages will refresh.',
    },
  'Для нового Full Mock не хватает бесплатных тестов': {
    kk: 'Жаңа Full Mock үшін тегін тесттер жеткіліксіз',
    en: 'Not enough free tests for a new Full Mock',
  },
  'Полный пробный экзамен засчитывается как один тест каждого навыка. Выберите тариф, чтобы проходить экзамены без ограничений.':
    {
      kk: 'Толық сынақ емтиханы әр дағдының бір тесті ретінде есептеледі. Емтихандарды шектеусіз тапсыру үшін тариф таңдаңыз.',
      en: 'A full mock exam counts as one test for each skill. Choose a plan to take exams without limits.',
    },
  'Выберите тариф, чтобы продолжить: все тесты, полные пробные экзамены и AI-разборы без ограничений по количеству.':
    {
      kk: 'Жалғастыру үшін тариф таңдаңыз: барлық тесттер, толық сынақ емтихандары және шектеусіз AI-талдаулары.',
      en: 'Choose a plan to continue: all tests, full mock exams, and unlimited AI analyses.',
    },
  'Выберите тариф': { kk: 'Тариф таңдаңыз', en: 'Choose a plan' },
  'Все тесты, полные пробные экзамены и AI-разборы без ограничений по количеству.':
    {
      kk: 'Барлық тесттер, толық сынақ емтихандары және шектеусіз AI-талдаулары.',
      en: 'All tests, full mock exams, and unlimited AI analyses.',
    },
  'Бесплатно ещё доступно:': {
    kk: 'Тегін әлі қолжетімді:',
    en: 'Still available for free:',
  },
  'Подробнее о тарифах': {
    kk: 'Тарифтер туралы толығырақ',
    en: 'More about plans',
  },
  'Вернуться к практике': { kk: 'Практикаға оралу', en: 'Back to practice' },
  'Все тесты, полные пробные экзамены и AI-разборы.': {
    kk: 'Барлық тесттер, толық сынақ емтихандары және AI-талдаулары.',
    en: 'All tests, full mock exams, and AI analyses.',
  },
  'Платформа и 4 онлайн-занятия с преподавателем в мини-группе.': {
    kk: 'Платформа және шағын топта оқытушымен 4 онлайн-сабақ.',
    en: 'Platform and 4 online sessions with an instructor in a mini-group.',
  },
  'Платформа и 4 индивидуальные встречи с преподавателем по 30 минут.': {
    kk: 'Платформа және оқытушымен 30 минуттан 4 жеке кездесу.',
    en: 'Platform and 4 one-on-one 30-minute sessions with an instructor.',
  },
  'Загружаем тарифы…': { kk: 'Тарифтер жүктелуде…', en: 'Loading plans…' },
  'Не удалось загрузить тарифы.': {
    kk: 'Тарифтерді жүктеу мүмкін болмады.',
    en: 'Could not load plans.',
  },
  'Тарифы временно недоступны.': {
    kk: 'Тарифтер уақытша қолжетімсіз.',
    en: 'Plans are temporarily unavailable.',
  },
  'Доступ на': { kk: 'Қолжетімділік мерзімі —', en: 'Access for' },
  'календарных дней с момента предоставления доступа.': {
    kk: 'күнтізбелік күн (қолжетімділік берілген сәттен бастап).',
    en: 'calendar days from the date access is granted.',
  },
  'Разовая оплата, без автопродления и скрытых комиссий.': {
    kk: 'Бір реттік төлем, автоұзартусыз және жасырын комиссияларсыз.',
    en: 'One-time payment, no auto-renewal or hidden fees.',
  },
  'Я ознакомлен(а) с': {
    kk: 'Мен мыналармен таныстым:',
    en: 'I have read and agree to the',
  },
  'публичной офертой': { kk: 'жария офертамен', en: 'public offer' },
  'условиями оплаты и возврата': {
    kk: 'төлем және қайтару шарттарымен',
    en: 'payment and refund terms',
  },
  'Онлайн-оплата картой скоро заработает. Чтобы оформить доступ сейчас, напишите нам:':
    {
      kk: 'Картамен онлайн-төлем жақында іске қосылады. Қолжетімділікті қазір алу үшін бізге жазыңыз:',
      en: 'Online card payment will be available soon. To get access now, write to us:',
    },
  'Переходим к оплате…': {
    kk: 'Төлемге өтудеміз…',
    en: 'Redirecting to payment…',
  },
  Оплатить: { kk: 'Төлеу', en: 'Pay' },
  'Данные карты вводятся на защищённой странице банка.': {
    kk: 'Карта деректері банктің қорғалған бетінде енгізіледі.',
    en: 'Card details are entered on a secure bank page.',
  },
  'официальная цена': { kk: 'ресми бағасы', en: 'official price' },
  'Продолжите подготовку без ограничений': {
    kk: 'Дайындықты шектеусіз жалғастырыңыз',
    en: 'Continue your preparation without limits',
  },
  'Бесплатных тестов осталось:': {
    kk: 'Қалған тегін тесттер:',
    en: 'Free tests remaining:',
  },
  'Бесплатные тесты закончились. Выберите тариф, чтобы продолжить.': {
    kk: 'Тегін тесттер аяқталды. Жалғастыру үшін тариф таңдаңыз.',
    en: 'Free tests have ended. Choose a plan to continue.',
  },
  'Онлайн-оплата временно недоступна. Попробуйте позже или напишите в поддержку.':
    {
      kk: 'Онлайн-төлем уақытша қолжетімсіз. Кейінірек көріңіз немесе қолдау қызметіне жазыңыз.',
      en: 'Online payment is temporarily unavailable. Please try again later or contact support.',
    },
  'Выдан вручную': { kk: 'Қолмен берілген', en: 'Granted manually' },
  Бонус: { kk: 'Бонус', en: 'Bonus' },
  'Ожидает оплаты': { kk: 'Төлем күтілуде', en: 'Pending payment' },
  Оплачен: { kk: 'Төленді', en: 'Paid' },
  'Ошибка оплаты': { kk: 'Төлем қатесі', en: 'Payment error' },
  Возврат: { kk: 'Қайтарым', en: 'Refunded' },
  'Текущий доступ': { kk: 'Ағымдағы қолжетімділік', en: 'Current access' },
  'Периоды доступа': { kk: 'Қолжетімділік кезеңдері', en: 'Access periods' },
  'Доступ ещё не выдавался.': {
    kk: 'Қолжетімділік әлі берілмеген.',
    en: 'Access has not been granted yet.',
  },
  Заказы: { kk: 'Тапсырыстар', en: 'Orders' },
  'Заказов нет.': { kk: 'Тапсырыстар жоқ.', en: 'No orders.' },
  Сумма: { kk: 'Сомасы', en: 'Amount' },
  'Номер в банке': { kk: 'Банктегі нөмір', en: 'Bank reference' },
  'Выдать доступ': { kk: 'Қолжетімділік беру', en: 'Grant access' },
  'Для оплаты по счёту, компенсаций и бонусов. Если доступ уже активен, новый период начнётся после текущего.':
    {
      kk: 'Шот бойынша төлем, өтемақылар және бонустар үшін. Егер қолжетімділік белсенді болса, жаңа кезең ағымдағы мерзімнен кейін басталады.',
      en: 'For invoice payments, compensations, and bonuses. If access is already active, the new period will start after the current one.',
    },
  'Дней (по умолчанию — срок тарифа)': {
    kk: 'Күндер саны (әдепкі бойынша — тариф мерзімі)',
    en: 'Days (default — plan duration)',
  },
  Основание: { kk: 'Негіздеме', en: 'Reason' },
  'Комментарий (например, номер счёта)': {
    kk: 'Түсініктеме (мысалы, шот нөмірі)',
    en: 'Comment (e.g. invoice number)',
  },
  отозван: { kk: 'қайтарып алынды:', en: 'revoked on' },
  истёк: { kk: 'мерзімі аяқталды', en: 'expired' },
  'Проведено встреч:': { kk: 'Өткізілген кездесулер:', en: 'Sessions held:' },
  Уменьшить: { kk: 'Азайту', en: 'Decrease' },
  Увеличить: { kk: 'Көбейту', en: 'Increase' },
  'Причина отзыва (например, возврат по заявлению):': {
    kk: 'Қайтарып алу себебі (мысалы, өтініш бойынша қайтару):',
    en: 'Reason for revocation (e.g. refund upon request):',
  },
  'Отозвать доступ': {
    kk: 'Қолжетімділікті қайтарып алу',
    en: 'Revoke access',
  },
  'Без тарифа Full Mock засчитывается как один бесплатный тест каждого навыка.':
    {
      kk: 'Тарифсіз Full Mock әр дағдының бір тегін тесті ретінде есептеледі.',
      en: 'Without a plan, Full Mock counts as one free test for each skill.',
    },
  'Бесплатные тесты закончились — нужен тариф': {
    kk: 'Тегін тесттер аяқталды — тариф қажет',
    en: 'Free tests have ended — a plan is required',
  },
  'Заказ не найден': { kk: 'Тапсырыс табылмады', en: 'Order not found' },
  'В ссылке нет номера заказа. Откройте тарифы и попробуйте снова.': {
    kk: 'Сілтемеде тапсырыс нөмірі жоқ. Тарифтер бетін ашып, қайталап көріңіз.',
    en: 'There is no order number in the link. Open the plans page and try again.',
  },
  'Не удалось проверить оплату': {
    kk: 'Төлемді тексеру мүмкін болмады',
    en: 'Could not verify payment',
  },
  'Проверить ещё раз': { kk: 'Қайта тексеру', en: 'Check again' },
  'Ждём подтверждение от банка': {
    kk: 'Банктен растау күтілуде',
    en: 'Waiting for bank confirmation',
  },
  'Проверяем оплату…': { kk: 'Төлем тексерілуде…', en: 'Verifying payment…' },
  'Банк ещё не подтвердил платёж. Обычно это занимает пару минут. Если доступ не появится в течение 15 минут, напишите нам на':
    {
      kk: 'Банк төлемді әлі растаған жоқ. Әдетте бұл бірнеше минут алады. Егер 15 минут ішінде қолжетімділік ашылмаса, бізге келесі поштаға жазыңыз:',
      en: 'The bank has not yet confirmed the payment. This usually takes a couple of minutes. If access does not appear within 15 minutes, email us at',
    },
  'и укажите номер заказа:': {
    kk: 'және тапсырыс нөмірін көрсетіңіз:',
    en: 'and specify the order number:',
  },
  'Не закрывайте страницу, это займёт несколько секунд.': {
    kk: 'Бетті жаппаңыз, бұл бірнеше секунд алады.',
    en: 'Do not close the page, this will take a few seconds.',
  },
  'Оплата прошла': { kk: 'Төлем сәтті өтті', en: 'Payment successful' },
  Списано: { kk: 'Есептен шығарылды:', en: 'Charged:' },
  'Доступ открыт до': {
    kk: 'Қолжетімділік мына күнге дейін ашық:',
    en: 'Access granted until',
  },
  'Доступ открыт.': { kk: 'Қолжетімділік ашылды.', en: 'Access granted.' },
  'Мы свяжемся с вами в WhatsApp, чтобы согласовать расписание встреч.': {
    kk: 'Кездесулер кестесін келісу үшін сізбен WhatsApp арқылы байланысамыз.',
    en: 'We will contact you on WhatsApp to arrange the session schedule.',
  },
  'Оплата не прошла': { kk: 'Төлем өтпеді', en: 'Payment failed' },
  'Деньги не списаны или будут возвращены банком. Попробуйте ещё раз или выберите другую карту.':
    {
      kk: 'Ақша есептен шығарылмады немесе банк арқылы қайтарылады. Қайталап көріңіз немесе басқа картаны таңдаңыз.',
      en: 'Money was not charged or will be refunded by the bank. Please try again or choose another card.',
    },
  'К тарифам': { kk: 'Тарифтерге', en: 'Back to plans' },
  'Listening, Reading, Writing и Speaking без ограничений по количеству тестов':
    {
      kk: 'Listening, Reading, Writing және Speaking тесттер саны бойынша шектеусіз',
      en: 'Listening, Reading, Writing, and Speaking with no test limits',
    },
  'Полные пробные экзамены с итоговым Band Score': {
    kk: 'Қорытынды Band Score бар толық сынақ емтихандары',
    en: 'Full mock exams with an overall Band Score',
  },
  'AI-оценка Writing и Speaking по критериям IELTS': {
    kk: 'IELTS критерийлері бойынша Writing және Speaking бөлімдерін AI-бағалау',
    en: 'AI assessment of Writing and Speaking based on IELTS criteria',
  },
  'Разбор ошибок и история попыток': {
    kk: 'Қателерді талдау және әрекеттер тарихы',
    en: 'Error review and attempt history',
  },
  'Оплата разовая, доступ на 30 дней. Тарифы со встречами добавляют занятия с преподавателем.':
    {
      kk: 'Бір реттік төлем, 30 күнге қолжетімділік. Кездесулері бар тарифтер оқытушымен өтетін сабақтарды қамтиды.',
      en: 'One-time payment, 30 days of access. Plans with sessions include lessons with an instructor.',
    },
  'Выбор тарифа': { kk: 'Тариф таңдау', en: 'Plan selection' },
  'Ваш доступ': { kk: 'Сіздің қолжетімділігіңіз', en: 'Your access' },
  'Что входит в каждый тариф': {
    kk: 'Әр тарифке не кіреді',
    en: 'What each plan includes',
  },
  'Если передумаете, вернём деньги за неиспользованные дни доступа.': {
    kk: 'Егер айнып қалсаңыз, пайдаланылмаған қолжетімділік күндері үшін ақшаңызды қайтарамыз.',
    en: 'If you change your mind, we will refund the money for unused days of access.',
  },
  'Оплата и возврат': { kk: 'Төлем және қайтару', en: 'Payment and refund' },
  'Для школ и учебных центров — отдельные условия. Пишите:': {
    kk: 'Мектептер мен оқу орталықтары үшін бөлек шарттар қарастырылған. Мынаған жазыңыз:',
    en: 'Special terms are available for schools and study centers. Contact us:',
  },
  'Доступ привязывается к аккаунту. Войдите, чтобы выбрать тариф и оплатить. После регистрации доступно по 3 бесплатных теста каждого навыка.':
    {
      kk: 'Қолжетімділік аккаунтқа байланыстырылады. Тариф таңдап, төлем жасау үшін аккаунтқа кіріңіз. Тіркелгеннен кейін әр дағды бойынша 3 тегін тест қолжетімді болады.',
      en: 'Access is tied to your account. Sign in to choose a plan and pay. After registration, 3 free tests for each skill are available.',
    },
  'Тариф и доступ': { kk: 'Тариф және қолжетімділік', en: 'Plan and access' },
  'Оплата — Yrys Academy': {
    kk: 'Төлем — Yrys Academy',
    en: 'Payment — Yrys Academy',
  },
  'Тарифы — Yrys Academy': {
    kk: 'Тарифтер — Yrys Academy',
    en: 'Plans — Yrys Academy',
  },
  'Платформа самостоятельно': {
    kk: 'Платформа өз бетінше',
    en: 'Platform on your own',
  },
  'Платформа + 4 встречи в мини-группе': {
    kk: 'Платформа + шағын топта 4 кездесу',
    en: 'Platform + 4 mini-group sessions',
  },
  'Платформа + 4 личные встречи по 30 минут': {
    kk: 'Платформа + 30 минуттан 4 жеке кездесу',
    en: 'Platform + 4 one-on-one 30-minute sessions',
  },
}
