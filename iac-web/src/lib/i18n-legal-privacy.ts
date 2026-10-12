import type { TranslationMap } from './i18n-types'

export const legalPrivacyTranslations: TranslationMap = {
  'Политика конфиденциальности': {
    kk: 'Құпиялық саясаты',
    en: 'Privacy Policy',
  },
  'Краткое резюме наших принципов безопасности:': {
    kk: 'Қауіпсіздік принциптеріміздің қысқаша түйіні:',
    en: 'A brief summary of our security principles:',
  },
  'Криптографическое шифрование персональных данных:': {
    kk: 'Жеке деректерді криптографиялық шифрлау:',
    en: 'Cryptographic encryption of personal data:',
  },
  'номера телефонов и чувствительные данные пользователя хранятся в базе данных в зашифрованном виде. При физической краже или утечке базы данных прочитать эти данные невозможно без секретного ключа.':
    {
      kk: 'телефон нөмірлері мен пайдаланушының сезімтал деректері дерекқорда шифрленген түрде сақталады. Дерекқордың физикалық ұрлануы немесе ағып кетуі жағдайында осы деректерді құпия кілтсіз оқу мүмкін емес.',
      en: 'phone numbers and the user’s sensitive data are stored in the database in encrypted form. Should the database be physically stolen or leaked, this data cannot be read without the secret key.',
    },
  'Изоляция секретных ключей:': {
    kk: 'Құпия кілттерді оқшаулау:',
    en: 'Isolation of secret keys:',
  },
  'ключ дешифрования не хранится в коде или репозитории, а безопасно управляется через изолированное хранилище секретов CI/CD (GitHub Actions Secrets).':
    {
      kk: 'дешифрлеу кілті кодта немесе репозиторийде сақталмайды, ол CI/CD құпияларының оқшауланған қоймасы (GitHub Actions Secrets) арқылы қауіпсіз басқарылады.',
      en: 'the decryption key is never stored in the codebase or repository; it is securely managed through an isolated CI/CD secrets store (GitHub Actions Secrets).',
    },
  'Строгий контроль доступа:': {
    kk: 'Қатаң қол жеткізу бақылауы:',
    en: 'Strict access control:',
  },
  'бэкенд расшифровывает данные динамически «на лету» строго для двух субъектов — самого авторизованного пользователя (владельца данных) и уполномоченного администратора платформы.':
    {
      kk: 'бэкенд деректердің шифрін динамикалық түрде, тек екі субъект үшін ғана — авторизациядан өткен пайдаланушының өзіне (деректер иесі) және платформаның уәкілетті әкімшісіне сұраныс сәтінде ашады.',
      en: 'the backend decrypts data dynamically “on the fly”, strictly for two parties — the authorised user themselves (the data owner) and an authorised platform administrator.',
    },
  'Локальный мониторинг ошибок:': {
    kk: 'Қателерді жергілікті бақылау:',
    en: 'Local error monitoring:',
  },
  'логирование сбоев и ошибок ведется на нашей собственной инфраструктуре через локальный GlitchTip, без экспорта ваших данных в сторонние облачные трекеры.':
    {
      kk: 'ақаулар мен қателердің жазбалары біздің өз инфрақұрылымымызда, жергілікті GlitchTip арқылы жүргізіледі, деректеріңіз бөгелімді бұлттық трекерлерге экспортталмайды.',
      en: 'failures and errors are logged on our own infrastructure via a local GlitchTip, without exporting your data to third-party cloud trackers.',
    },
  'Мы не продаем и не передаем ваши персональные данные рекламным брокерам или сторонним маркетинговым сервисам.':
    {
      kk: 'Біз жеке деректеріңізді жарнамалық брокерлерге немесе бөгелімді маркетингтік қызметтерге сатпаймыз және бермейміз.',
      en: 'We do not sell or share your personal data with advertising brokers or third-party marketing services.',
    },
  'Вы можете запросить выгрузку или полное удаление ваших данных в любой момент.':
    {
      kk: 'Сіз кез келген уақытта деректеріңізді жүктеп алуды немесе толық жойылуын сұрай аласыз.',
      en: 'You may request an export of your data or its complete deletion at any time.',
    },
  '1.1. Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок сбора, накопления, хранения, использования, распространения, обезличивания, блокирования и уничтожения персональных данных пользователей онлайн-платформы подготовки к экзамену IELTS «Daiyndyq IELTS» (далее — «Сервис», «Платформа», «мы»).':
    {
      kk: '1.1. Осы Құпиялық саясаты (бұдан әрі — «Саясат») «Daiyndyq IELTS» IELTS емтиханына дайындықтың онлайн-платформасы пайдаланушыларының жеке деректерін жинау, жинақтау, сақтау, пайдалану, тарату, анонимдеу, бұғаттау және жою тәртібін айқындайды (бұдан әрі — «Қызмет», «Платформа», «біз»).',
      en: '1.1. This Privacy Policy (the “Policy”) sets out the procedure for the collection, accumulation, storage, use, disclosure, depersonalisation, blocking, and destruction of the personal data of users of the “Daiyndyq IELTS” online IELTS preparation platform (the “Service”, the “Platform”, “we”).',
    },
  '1.2. Сервис соблюдает права и свободы граждан при обработке персональных данных, руководствуясь Конституцией Республики Казахстан, Законом Республики Казахстан от 21 мая 2013 года № 94-V «О персональных данных и их защите», а также применимыми нормами международного права в сфере защиты цифровой информации.':
    {
      kk: '1.2. Қызмет жеке деректерді өңдеу кезінде азаматтардың құқықтары мен бостандықтарын сақтайды және Қазақстан Республикасының Конституциясына, Қазақстан Республикасының 2013 жылғы 21 мамырдағы № 94-V «Дербесті деректер және оларды қорғау туралы» Заңына, сондай-ақ цифрлық ақпаратты қорғау саласындағы қолданылатын халықаралық құқық нормаларына сүйенеді.',
      en: '1.2. The Service respects the rights and freedoms of citizens when processing personal data, acting in accordance with the Constitution of the Republic of Kazakhstan, the Law of the Republic of Kazakhstan No. 94-V of 21 May 2013 “On Personal Data and Their Protection”, and the applicable norms of international law governing the protection of digital information.',
    },
  '1.3. Прохождение процедуры авторизации через аккаунт Google и подтверждение чекбокса согласия («Принимаю условия использования и политику конфиденциальности») подтверждает факт ознакомления пользователя с настоящей Политикой и является его добровольным, осознанным и информированным согласием на обработку персональных данных на указанных условиях.':
    {
      kk: '1.3. Google аккаунты арқылы авторизация процедурасынан өту және келісім чекбоксын растау («Пайдалану шарттары мен құпиялық саясатын қабылдаймын») пайдаланушының осы Саясатпен танысқанын растайды және оның жеке деректерді көрсетілген шарттар бойынша өңдеуге берген ерікті, саналы және хабардар келісімі болып табылады.',
      en: '1.3. Completing the sign-in procedure with a Google account and ticking the consent box (“I accept the Terms of Use and Privacy Policy”) confirms that the user has read this Policy and constitutes their voluntary, informed, and deliberate consent to the processing of personal data on the terms set out herein.',
    },
  '2. Оператор персональных данных и контакты': {
    kk: '2. Жеке деректерді өңдеуші және байланыс',
    en: '2. Personal data controller and contacts',
  },
  '2.1. Оператором базы персональных данных пользователей Сервиса является проект «Daiyndyq IELTS» (г. Астана, Республика Казахстан).':
    {
      kk: '2.1. Қызмет пайдаланушыларының жеке деректер базасының операторы «Daiyndyq IELTS» жобасы болып табылады (Астана қ., Қазақстан Республикасы).',
      en: '2.1. The operator of the personal-data database of the Service is the “Daiyndyq IELTS” project (Astana, Republic of Kazakhstan).',
    },
  '2.2. Контактным каналом по всем вопросам обработки, изменения, выгрузки или отзыва согласия на обработку персональных данных является электронная почта:':
    {
      kk: '2.2. Жеке деректерді өңдеу, өзгерту, жүктеп алу немесе өңдеуге келісімді кері қайтарып алуға қатысты барлық сұрақтар бойынша байланыс арнасы — электрондық пошта:',
      en: '2.2. For any questions regarding the processing, amendment, or export of your personal data, or the withdrawal of consent to its processing, the contact channel is email:',
    },
  'Служба заботы о пользователях и защиты данных:': {
    kk: 'Пайдаланушыларға қамқорлық және деректерді қорғау қызметі:',
    en: 'User care and data protection service:',
  },
  'Email:': {
    kk: 'Email:',
    en: 'Email:',
  },
  'Время ответа: до 2 рабочих дней.': {
    kk: 'Жауап беру уақыты: 2 жұмыс күніне дейін.',
    en: 'Response time: up to 2 working days.',
  },
  '3. Категории собираемых персональных данных': {
    kk: '3. Жиналатын жеке деректер санаттары',
    en: '3. Categories of personal data we collect',
  },
  'Мы собираем только те данные, которые необходимы для предоставления образовательных услуг, персонализации процесса подготовки к IELTS и связи со студентом:':
    {
      kk: 'Біз тек білім беру қызметтерін көрсету, IELTS-ке дайындық үдерісін жекелендіру және студентпен байланыс орнату үшін қажет деректерді ғана жинаймыз:',
      en: 'We collect only the data required to deliver our educational services, personalise your IELTS preparation, and stay in touch with you:',
    },
  '3.1. Данные авторизации Google (OAuth 2.0)': {
    kk: '3.1. Google авторизация деректері (OAuth 2.0)',
    en: '3.1. Google sign-in data (OAuth 2.0)',
  },
  'При входе через Google мы получаем уникальный Google ID (sub), адрес электронной почты (email), а также имя и аватар профиля, предоставляемые Google в соответствии с вашими настройками доступа.':
    {
      kk: 'Google арқылы кірген кезде біз Google-дің сіздің рұсқат баптауларыңызға сәйкес беретін бірегей Google ID (sub) идентификаторын, электрондық пошта мекенжайын (email), сондай-ақ профиль атын және аватарын аламыз.',
      en: 'When you sign in with Google, we receive your unique Google ID (sub), email address, and the profile name and avatar provided by Google in accordance with your access settings.',
    },
  '3.2. Профильные и контактные данные (защищенные шифрованием)': {
    kk: '3.2. Профильдік және байланыс деректері (шифрлеумен қорғалған)',
    en: '3.2. Profile and contact details (protected by encryption)',
  },
  'Имя пользователя, указанное при регистрации (для персонального обращения в интерфейсе), а также контактный номер телефона WhatsApp в международном формате (например, +7 700 123 45 67). Номер телефона шифруется перед записью в базу данных и используется исключительно для идентификации аккаунта и прямой связи с куратором или администратором. Внешние рекламные рассылки и сторонние спам-сервисы не используются.':
    {
      kk: 'Тіркеу кезінде көрсетілген пайдаланушы аты (интерфейсте сізге жеке қарым-қатынас жасау үшін), сондай-ақ халықаралық форматтағы WhatsApp байланыс телефон нөмірі (мысалы, +7 700 123 45 67). Телефон нөмірі дерекқорға жазылғанға дейін шифрленеді және тек аккаунтты сәйкестендіру және куратормен немесе әкімшімен тікелей байланыс орнату үшін пайдаланылады. Сыртқы жарнамалық таратулар мен бөгелімді спам-қызметтер қолданылмайды.',
      en: 'The user name provided at registration (used to address you personally in the interface), as well as your WhatsApp contact number in international format (for example, +7 700 123 45 67). The phone number is encrypted before being written to the database and is used solely to identify your account and to contact you directly with your curator or administrator. We do not use external marketing mailings or third-party spam services.',
    },
  '3.3. Образовательные данные и материалы подготовки': {
    kk: '3.3. Білім беру деректері және дайындық материалдары',
    en: '3.3. Educational data and preparation materials',
  },
  'Выбранный формат экзамена (Academic или General Training), целевой балл IELTS и дата сдачи, история выполнения практических заданий и полных симуляторов (Full Mock Exams), выбранные ответы в модулях Reading и Listening, тексты эссе в модуле Writing, аудиозаписи ответов и их расшифровки в модуле Speaking, а также диалоги с учебным AI-ассистентом («Юки»).':
    {
      kk: 'Таңдалған емтихан форматы (Academic немесе General Training), мақсатты IELTS ұпайы және тапсыру күні, практикалық тапсырмалар мен толық симуляторларды (Full Mock Exams) орындау тарихы, Reading және Listening модульдеріндегі таңдалған жауаптар, Writing модульіндегі эссе мәтіндері, Speaking модульіндегі жауаптардың дыбыс жазбалары және олардың транскрипциялары, сондай-ақ оқу AI-ассистентімен («Юки») диалогтар.',
      en: 'Your chosen exam format (Academic or General Training), target IELTS band score and test date, the history of your practice tasks and full simulations (Full Mock Exams), the answers you selected in the Reading and Listening modules, your essay texts in the Writing module, audio recordings of your responses and their transcripts in the Speaking module, as well as your conversations with the study AI assistant (“Yuki”).',
    },
  '3.4. Техническая и системная информация': {
    kk: '3.4. Техникалық және жүйелік ақпарат',
    en: '3.4. Technical and system information',
  },
  'IP-адрес пользователя, тип и версия браузера, операционная система, язык интерфейса, метки времени запросов, сессионные JWT-токены авторизации, а также технические события об ошибках приложения, собираемые локально через собственную систему мониторинга без передачи сторонним коммерческим аналитическим компаниям.':
    {
      kk: 'Пайдаланушының IP-мекенжайы, браузердің түрі мен нұсқасы, операциялық жүйе, интерфейс тілі, сұраныстардың уақыт белгілері, авторизацияның сессиялық JWT-токендері, сондай-ақ қолданба қателері туралы техникалық оқиғалар — олар өз бақылау жүйеміз арқылы жергілікті жиналады және бөгелімді коммерциялық аналитикалық компанияларға берілмейді.',
      en: 'Your IP address, browser type and version, operating system, interface language, request timestamps, session JWT authentication tokens, and technical events relating to application errors, collected locally through our own monitoring system without being shared with third-party commercial analytics companies.',
    },
  '4. Цели обработки персональных данных': {
    kk: '4. Жеке деректерді өңдеу мақсаттары',
    en: '4. Purposes of personal data processing',
  },
  'Персональные данные собираются и обрабатываются исключительно в целях:': {
    kk: 'Жеке деректер тек мына мақсаттарда жиналады және өңделеді:',
    en: 'Personal data is collected and processed solely for the following purposes:',
  },
  'Создания и администрирования учетной записи пользователя в личном кабинете;':
    {
      kk: 'Жеке кабинетте пайдаланушының есептік жазбасын құру және әкімшілендіру;',
      en: 'Creating and administering your user account in your personal dashboard;',
    },
  'Безопасной идентификации и аутентификации пользователя при каждом входе через Google;':
    {
      kk: 'Google арқылы әр кіргенде пайдаланушыны қауіпсіз сәйкестендіру және аутентификациялау;',
      en: 'Securely identifying and authenticating you each time you sign in with Google;',
    },
  'Обеспечения доступа к банку практических заданий, текстам, аудиозаписям и симуляторам тестов;':
    {
      kk: 'Практикалық тапсырмалар банкіне, мәтіндерге, дыбыс жазбаларына және тест симуляторларына қол жеткізуді қамтамасыз ету;',
      en: 'Granting access to our bank of practice tasks, texts, audio recordings, and test simulators;',
    },
  'Автоматической проверки ответов, анализа допущенных ошибок и формирования персонального плана обучения;':
    {
      kk: 'Жауаптарды автоматты тексеру, жіберілген қателерді талдау және жеке оқу жоспарын қалыптастыру;',
      en: 'Automatically marking answers, analysing mistakes, and building a personal study plan;',
    },
  'Прямой связи по учебным вопросам и ответам на обращения пользователя;': {
    kk: 'Оқу мәселелері бойынша тікелей байланыс орнату және пайдаланушының өтінімдеріне жауап беру;',
    en: 'Communicating with you directly about your studies and responding to your enquiries;',
  },
  'Предоставления оперативной технической поддержки и помощи при возникновении трудностей;':
    {
      kk: 'Қиындықтар туындаған кезде жедел техникалық қолдау көрсету және көмек беру;',
      en: 'Providing prompt technical support and assistance when difficulties arise;',
    },
  'Предотвращения несанкционированного доступа, защиты Сервиса от кибератак, мошенничества и злоупотреблений;':
    {
      kk: 'Рұқсатсыз кірудің алдын алу, Қызметті кибершабуылдардан, алаяқтықтан және теріс пайдаланудан қорғау;',
      en: 'Preventing unauthorised access and protecting the Service against cyberattacks, fraud, and abuse;',
    },
  'Аналитики и улучшения качества образовательного контента и удобства интерфейса платформы.':
    {
      kk: 'Білім беру контентінің сапасын және платформа интерфейсінің ыңғайлылығын талдау және жақсарту.',
      en: 'Analysing and improving the quality of our educational content and the usability of the platform.',
    },
  '5. Использование искусственного интеллекта и анализ ответов': {
    kk: '5. Жасанды интеллектті қолдану және жауаптарды талдау',
    en: '5. Use of artificial intelligence and answer analysis',
  },
  '5.1. Для обеспечения качественной обратной связи по продуктивным навыкам IELTS (Writing и Speaking), а также для работы виртуального ассистента «Юки», Сервис применяет современные технологии искусственного интеллекта и языковые модели.':
    {
      kk: '5.1. IELTS өнімді дағдылары (Writing және Speaking) бойынша сапалы кері байланыс қамтамасыз ету, сондай-ақ «Юки» виртуалды ассистентінің жұмысы үшін Қызмет заманауи жасанды интеллект технологияларын және тілдік модельдерді қолданады.',
      en: '5.1. To deliver high-quality feedback on the productive IELTS skills (Writing and Speaking) and to power the virtual assistant “Yuki”, the Service employs modern artificial-intelligence technologies and language models.',
    },
  '5.2. При отправке эссе или аудиоответов на проверку текст задания и ответ студента направляются через защищенный закрытый API доверенным провайдерам искусственного интеллекта (включая Anthropic, OpenAI, Google Cloud AI) исключительно в целях семантического анализа, выявления грамматических и лексических ошибок, оценки по критериям IELTS (Task Achievement, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy) и формирования рекомендаций.':
    {
      kk: '5.2. Эссе немесе дыбыс жауаптарын тексеруге жіберген кезде тапсырма мәтіні мен студенттің жауабы қорғалған жабық API арқылы сенімді жасанды интеллект провайдерлеріне (Anthropic, OpenAI, Google Cloud AI қоса алғанда) жіберіледі және тек семантикалық талдау, грамматикалық және лексикалық қателерді анықтау, IELTS критерийлері бойынша бағалау (Task Achievement, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy) және ұсыныстар қалыптастыру мақсатында ғана пайдаланылады.',
      en: '5.2. When you submit an essay or audio responses for marking, the task text and your response are transmitted through a secure, closed API to trusted artificial-intelligence providers (including Anthropic, OpenAI, and Google Cloud AI) solely for semantic analysis, the identification of grammatical and lexical errors, assessment against the IELTS criteria (Task Achievement, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy), and the generation of recommendations.',
    },
  '5.3. Передаваемые тексты ответов обрабатываются в обезличенном виде: мы не передаем провайдерам AI ваши фамилию, email или номер телефона. Передаваемые данные не используются поставщиками AI для публичного обучения базовых моделей без специального согласия.':
    {
      kk: '5.3. Берілетін жауап мәтіндері анонимді түрде өңделеді: біз AI провайдерлеріне тегіңізді, email-іңізді немесе телефон нөміріңізді бермейміз. Берілетін деректер AI жеткізушілерімен арнайы келісімсіз негізгі модельдерді жария оқытуға пайдаланылмайды.',
      en: '5.3. The response texts we transmit are processed in anonymised form: we do not share your surname, email address, or phone number with AI providers. Without your specific consent, the data we transmit is not used by AI providers to publicly train their base models.',
    },
  '6. Правовые основания обработки данных': {
    kk: '6. Деректерді өңдеудің құқықтық негіздері',
    en: '6. Legal grounds for data processing',
  },
  '6.1. Правовым основанием обработки персональных данных является ст. 7, 8 и 9 Закона РК «О персональных данных и их защите», а именно:':
    {
      kk: '6.1. Жеке деректерді өңдеудің құқықтық негізі — ҚР «Дербесті деректер және оларды қорғау туралы» Заңының 7, 8 және 9-баптары, атап айтқанда:',
      en: '6.1. The legal grounds for processing personal data are Articles 7, 8, and 9 of the Law of the Republic of Kazakhstan “On Personal Data and Their Protection”, namely:',
    },
  'Согласие субъекта персональных данных:': {
    kk: 'Жеке деректер субъектісінің келісімі:',
    en: 'Consent of the data subject:',
  },
  'выражается пользователем путем проставления электронной отметки согласия при завершении регистрации;':
    {
      kk: 'пайдаланушы тіркеуді аяқтаған кезде электрондық келісім белгісін қою арқылы білдіріледі;',
      en: 'given by the user by placing an electronic tick of consent upon completing registration;',
    },
  'Исполнение пользовательского соглашения:': {
    kk: 'Пайдаланушы келісімшартын орындау:',
    en: 'Performance of the user agreement:',
  },
  'обработка данных необходима для надлежащего оказания образовательных услуг в соответствии с Условиями использования;':
    {
      kk: 'деректерді өңдеу Пайдалану шарттарына сәйкес білім беру қызметтерін тиісті көрсету үшін қажет;',
      en: 'processing is necessary to provide the educational services properly, in accordance with the Terms of Use;',
    },
  'Законный интерес оператора:': {
    kk: 'Оператордың заңды мүддесі:',
    en: 'Legitimate interests of the operator:',
  },
  'поддержание безопасности инфраструктуры, защита от несанкционированного доступа и обеспечение непрерывной работы Сервиса.':
    {
      kk: 'инфрақұрылым қауіпсіздігін қолдау, рұқсатсыз кіруден қорғау және Қызметтің үздіксіз жұмысын қамтамасыз ету.',
      en: 'maintaining the security of our infrastructure, protecting against unauthorised access, and ensuring the continuous operation of the Service.',
    },
  '7. Передача данных третьим лицам и трансграничная передача': {
    kk: '7. Деректерді үшінші тұлғаларға беру және трансшекаралық беру',
    en: '7. Sharing data with third parties and cross-border transfers',
  },
  '7.1. Сервис не продает, не сдает в аренду и не раскрывает ваши персональные данные третьим лицам в маркетинговых или рекламных целях.':
    {
      kk: '7.1. Қызмет жеке деректеріңізді маркетингтік немесе жарнамалық мақсаттарда үшінші тұлғаларға сатпайды, жалға бермейді және ашпайды.',
      en: '7.1. The Service does not sell, rent, or disclose your personal data to third parties for marketing or advertising purposes.',
    },
  '7.2. Передача персональных данных допускается исключительно проверенным техническим партнерам, обеспечивающим функционирование инфраструктуры Сервиса:':
    {
      kk: '7.2. Жеке деректер тек Қызмет инфрақұрылымының жұмысын қамтамасыз ететін тексерілген техникалық серіктестерге ғана берілуі мүмкін:',
      en: '7.2. Personal data may be shared only with vetted technical partners that help operate the Service’s infrastructure:',
    },
  'Google LLC (США):': {
    kk: 'Google LLC (АҚШ):',
    en: 'Google LLC (USA):',
  },
  'провайдер сервиса безопасной аутентификации Google Identity Services;': {
    kk: 'Google Identity Services қауіпсіз аутентификация қызметінің провайдері;',
    en: 'the provider of the secure Google Identity Services authentication service;',
  },
  'Облачные провайдеры хостинга и баз данных:': {
    kk: 'Хостинг пен дерекқорлардың бұлттық провайдерлері:',
    en: 'Cloud hosting and database providers:',
  },
  'защищенные серверы, где развернута база данных пользователей (с криптографическим шифрованием данных at rest) и изолированное хранилище файлов (MinIO/S3);':
    {
      kk: 'пайдаланушылар дерекқоры орналастырылған қорғалған серверлер (деректерді at rest криптографиялық шифрлеуімен) және оқшауланған файл қоймасы (MinIO/S3);',
      en: 'the secure servers that host the user database (with cryptographic encryption of data at rest) and the isolated file store (MinIO/S3);',
    },
  'Провайдеры AI-аналитики:': {
    kk: 'AI-аналитика провайдерлері:',
    en: 'AI analytics providers:',
  },
  'закрытые API для автоматической оценки письменных и устных работ в обезличенном виде;':
    {
      kk: 'жазбаша және ауызша жұмыстарды анонимді түрде автоматты бағалауға арналған жабық API;',
      en: 'closed APIs used to assess written and spoken work automatically and in anonymised form;',
    },
  'Локальный мониторинг стабильности:': {
    kk: 'Тұрақтылықты жергілікті бақылау:',
    en: 'Local stability monitoring:',
  },
  'технические журналы ошибок обрабатываются с помощью open-source решения GlitchTip, развернутого на наших собственных серверах, без передачи персональных данных третьим лицам.':
    {
      kk: 'қателердің техникалық журналдары біздің өз серверлерімізде орналастырылған GlitchTip open-source шешімінің көмегімен өңделеді, жеке деректер үшінші тұлғаларға берілмейді.',
      en: 'technical error logs are processed using the open-source GlitchTip solution deployed on our own servers, with no personal data being shared with third parties.',
    },
  '7.3. Трансграничная передача данных на территорию иностранных государств осуществляется в случаях, когда это необходимо для предоставления услуг Сервиса (например, аутентификация через Google), и только при условии обеспечения защиты передаваемых данных в соответствии с применимым законодательством.':
    {
      kk: '7.3. Деректерді шет мемлекеттер аумағына трансшекаралық беру Қызмет қызметтерін көрсету үшін қажет жағдайларда ғана (мысалы, Google арқылы аутентификация) жүзеге асырылады және берілетін деректерді қолданылатын заңнамаға сәйкес қорғау қамтамасыз етілген жағдайда ғана жүзеге асырылады.',
      en: '7.3. Transfers of data to the territory of foreign states are carried out only where this is necessary to provide the services of the Service (for example, authentication via Google) and only on condition that the protection of the transferred data is ensured in accordance with applicable law.',
    },
  '8. Шифрование, хранение и безопасность персональных данных': {
    kk: '8. Жеке деректерді шифрлау, сақтау және қауіпсіздік',
    en: '8. Encryption, storage, and security of personal data',
  },
  'Безопасность ваших персональных данных является нашим ключевым приоритетом. Архитектура Сервиса спроектирована по принципу максимальной защиты от несанкционированного доступа:':
    {
      kk: 'Жеке деректеріңіздің қауіпсіздігі біздің басты басымдығымыз болып табылады. Қызмет архитектурасы рұқсатсыз кіруден максималды қорғау қағидаты бойынша жасалған:',
      en: 'The security of your personal data is our top priority. The Service is architected for maximum protection against unauthorised access:',
    },
  '8.1. Криптографическое шифрование данных при хранении (Encryption at Rest)':
    {
      kk: '8.1. Сақтау кезінде деректерді криптографиялық шифрлау (Encryption at Rest)',
      en: '8.1. Cryptographic encryption of data at rest (Encryption at Rest)',
    },
  'Все конфиденциальные поля профиля пользователя (включая контактный номер телефона WhatsApp) подвергаются симметричному криптографическому шифрованию перед записью в базу данных. В случае несанкционированного доступа к базе данных или ее физического хищения злоумышленник получает исключительно нечитаемый зашифрованный массив байтов (ciphertext), из которого невозможно восстановить персональные данные без мастер-ключа.':
    {
      kk: 'Пайдаланушы профилінің барлық құпия өрістері (WhatsApp байланыс телефон нөмірін қоса алғанда) дерекқорға жазылғанға дейін симметриялық криптографиялық шифрлеуден өткізіледі. Дерекқорға рұқсатсыз кіру немесе оның физикалық ұрлануы жағдайында қаскүнем тек оқуға келмейтін шифрленген байттар жиынтығын (ciphertext) алады, одан мастер-кілтсіз жеке деректерді қалпына келтіру мүмкін емес.',
      en: 'All confidential fields of your user profile (including your WhatsApp contact number) are subject to symmetric cryptographic encryption before being written to the database. In the event of unauthorised access to the database or its physical theft, an attacker obtains nothing but an unreadable encrypted byte array (ciphertext) from which personal data cannot be recovered without the master key.',
    },
  '8.2. Безопасное хранение и изоляция ключей дешифрования': {
    kk: '8.2. Дешифрлеу кілттерін қауіпсіз сақтау және оқшаулау',
    en: '8.2. Secure storage and isolation of decryption keys',
  },
  'Ключ шифрования и дешифрования никогда не сохраняется в открытом виде в исходном коде или репозитории приложения. Ключ хранится в защищенном хранилище секретов CI/CD платформы (GitHub Actions Secrets) и передается в изолированное рантайм-окружение бэкенд-сервера только в момент деплоя через защищенные переменные окружения.':
    {
      kk: 'Шифрлеу және дешифрлеу кілті ешқашан қолданба бастапқы кодында немесе репозиторийінде ашық түрде сақталмайды. Кілт CI/CD платформасының қорғалған құпиялар қоймасында (GitHub Actions Secrets) сақталады және бэкенд-сервердің оқшауланған рантайм-ортасына тек деплой сәтінде қорғалған орта айнымалылары арқылы беріледі.',
      en: 'The encryption and decryption key is never stored in plain form in the application’s source code or repository. The key is held in the protected secrets store of the CI/CD platform (GitHub Actions Secrets) and is passed to the isolated runtime environment of the backend server only at the moment of deployment, via protected environment variables.',
    },
  '8.3. Динамическое дешифрование и строгий ролевой доступ': {
    kk: '8.3. Динамикалық дешифрлеу және қатаң рөлдік қол жеткізу',
    en: '8.3. Dynamic decryption and strict role-based access',
  },
  'Бэкенд расшифровывает данные исключительно в оперативной памяти (in-memory) «на лету» строго при обработке аутентифицированного запроса. Расшифрованные данные доступны строго двум сторонам:':
    {
      kk: 'Бэкенд деректердің шифрін тек жедел жадыда (in-memory), аутентификацияланған сұранысты өңдеу кезінде ғана ашады. Шифрі ашылған деректерге тек екі тарап қана қол жеткізе алады:',
      en: 'The backend decrypts data exclusively in memory (in-memory), strictly while processing an authenticated request. Decrypted data is available to two parties only:',
    },
  'Самому пользователю:': {
    kk: 'Пайдаланушының өзіне:',
    en: 'The user themselves:',
  },
  'прошедшему успешную аутентификацию в системе под своей учетной записью;': {
    kk: 'өз есептік жазбасымен жүйеде сәтті аутентификациядан өткен;',
    en: 'who has successfully authenticated in the system under their own account;',
  },
  'Уполномоченным администраторам платформы:': {
    kk: 'Платформаның уәкілетті әкімшілеріне:',
    en: 'Authorised platform administrators:',
  },
  'исключительно в рамках служебных обязанностей по технической поддержке и модерации через защищенную административную панель.':
    {
      kk: 'тек қорғалған әкімшілік панель арқылы техникалық қолдау және модерация бойынша қызметтік міндеттері шеңберінде ғана.',
      en: 'solely within the scope of their official duties for technical support and moderation, through the protected admin panel.',
    },
  'Никакой другой пользователь платформы или неавторизованное лицо не имеет технической возможности получить доступ к чужим персональным данным.':
    {
      kk: 'Платформаның басқа ешбір пайдаланушысы немесе авторизацияланбаған тұлға бөтен жеке деректерге қол жеткізуге техникалық мүмкіндікке ие емес.',
      en: 'No other user of the platform, and no unauthorised person, has the technical means to access another person’s personal data.',
    },
  '8.4. Дополнительные меры защиты инфраструктуры': {
    kk: '8.4. Инфрақұрылымды қорғаудың қосымша шаралары',
    en: '8.4. Additional infrastructure protection measures',
  },
  'Использование криптографических протоколов TLS/HTTPS для шифрования всего сетевого трафика между браузером и сервером;':
    {
      kk: 'Браузер мен сервер арасындағы барлық желі трафигін шифрлау үшін TLS/HTTPS криптографиялық протоколдарын қолдану;',
      en: 'Using the TLS/HTTPS cryptographic protocols to encrypt all network traffic between the browser and the server;',
    },
  'Хранение сессионных токенов в защищенных cookies с атрибутами HttpOnly, Secure и SameSite;':
    {
      kk: 'Сессиялық токендерді HttpOnly, Secure және SameSite атрибуттары бар қорғалған cookies-те сақтау;',
      en: 'Storing session tokens in protected cookies with the HttpOnly, Secure, and SameSite attributes;',
    },
  'Регулярное резервное копирование и изоляция базы данных;': {
    kk: 'Дерекқордың тұрақты резервтік көшірмесін жасау және оны оқшаулау;',
    en: 'Regularly backing up and isolating the database;',
  },
  'Автоматический мониторинг сетевой активности и защита от атак перебора паролей и токенов.':
    {
      kk: 'Желі белсенділігін автоматты бақылау және құпиясөздер мен токендерді бруталық түрде таңдау шабуылдарынан қорғау.',
      en: 'Automatically monitoring network activity and protecting against brute-force attacks on passwords and tokens.',
    },
  '8.5. Персональные данные хранятся в течение всего периода активности учетной записи пользователя в Сервисе либо до момента получения требования об их уничтожении от пользователя.':
    {
      kk: '8.5. Жеке деректер пайдаланушының есептік жазбасы Қызметте белсенді болған барлық кезеңде немесе пайдаланушыдан оларды жою туралы талап түскенге дейін сақталады.',
      en: '8.5. Personal data is stored for as long as your account remains active with the Service, or until we receive a request from you to destroy it.',
    },
  'В соответствии с Законом РК «О персональных данных и их защите» вы имеете право:':
    {
      kk: 'ҚР «Дербесті деректер және оларды қорғау туралы» Заңына сәйкес сізде мына құқықтар бар:',
      en: 'Under the Law of the Republic of Kazakhstan “On Personal Data and Their Protection”, you have the right to:',
    },
  'Получать подтверждение факта обработки ваших персональных данных и информацию о способах их обработки;':
    {
      kk: 'Жеке деректеріңіздің өңделген фактісін растауды және оларды өңдеу тәсілдері туралы ақпарат алуға;',
      en: 'Receive confirmation that your personal data is being processed, together with information about the ways in which it is processed;',
    },
  'Требовать уточнения, блокирования или уничтожения неполных, устаревших или неточных данных;':
    {
      kk: 'Толық емес, ескірген немесе дұрыс емес деректерді нақтылауды, бұғаттауды немесе жойуды талап етуге;',
      en: 'Demand the clarification, blocking, or destruction of incomplete, outdated, or inaccurate data;',
    },
  'Отозвать свое согласие на обработку персональных данных в любой момент, направив обращение на':
    {
      kk: 'Кез келген уақытта жеке деректерді өңдеуге келісіміңізді кері қайтарып алуға, бұл үшін мына мекенжайға жүгіну арқылы',
      en: 'Withdraw your consent to the processing of personal data at any time by contacting',
    },
  'Требовать полного удаления аккаунта («право на забвение») и всех связанных с ним попыток прохождения тестов и эссе;':
    {
      kk: 'Аккаунтты толық жоюды («ұмытылу құқығы») және оған байланысты барлық тест тапсыру мен эссе жазу әрекеттерін жоюды талап етуге;',
      en: 'Demand the complete deletion of your account (the “right to be forgotten”) and of all associated test attempts and essays;',
    },
  'Обжаловать неправомерные действия или бездействие оператора в уполномоченном органе по защите персональных данных РК или в судебном порядке.':
    {
      kk: 'Оператордың заңсыз әрекеттерін немесе әрекетсіздігін ҚР жеке деректерді қорғау жөніндегі уәкілетті органына немесе сот тәртібінде шағымдануға;',
      en: 'Challenge any unlawful action or inaction of the operator before the authorised personal-data protection body of the Republic of Kazakhstan or through the courts;',
    },
  'Обратите внимание: при отзыве согласия или удалении персональных данных дальнейшее предоставление доступа к личному кабинету и истории результатов становится невозможным.':
    {
      kk: 'Назар аударыңыз: келісімді кері қайтарып алғанда немесе жеке деректерді жойғанда жеке кабинетке және нәтижелер тарихына одан әрі қол жеткізу мүмкін болмайды.',
      en: 'Please note: once consent is withdrawn or personal data is deleted, further access to your personal dashboard and results history becomes impossible.',
    },
  '10. Файлы cookie и технические данные': {
    kk: '10. Cookie файлдары және техникалық деректер',
    en: '10. Cookies and technical data',
  },
  '10.1. Сервис использует файлы cookie (куки) и локальное хранилище браузера (localStorage, sessionStorage) для обеспечения корректной работы платформы:':
    {
      kk: '10.1. Қызмет платформаның дұрыс жұмысын қамтамасыз ету үшін cookie (куки) файлдарын және браузердің жергілікті жадын (localStorage, sessionStorage) пайдаланады:',
      en: '10.1. The Service uses cookies and browser local storage (localStorage, sessionStorage) to ensure the platform works correctly:',
    },
  'Обязательные сессионные cookie:': {
    kk: 'Міндетті сессиялық cookie:',
    en: 'Essential session cookies:',
  },
  'необходимы для поддержания авторизации пользователя и защиты от межсайтовой подделки запросов (CSRF);':
    {
      kk: 'пайдаланушы авторизациясын ұстап тұру және сайттар арасындағы сұраныстарды жалған жасаудан (CSRF) қорғау үшін қажет;',
      en: 'required to keep you signed in and to protect against cross-site request forgery (CSRF);',
    },
  'Функциональные параметры:': {
    kk: 'Функционалдық баптаулар:',
    en: 'Functional settings:',
  },
  'сохранение выбранного языка интерфейса, масштаба и темы отображения, состояния таймера теста;':
    {
      kk: 'таңдалған интерфейс тілін, масштабты және көрініс тақырыбын, тест таймерінің күйін сақтау;',
      en: 'storing your chosen interface language, zoom level, and display theme, and the state of the test timer;',
    },
  'Локальные диагностические метрики:': {
    kk: 'Жергілікті диагностикалық метрикалар:',
    en: 'Local diagnostic metrics:',
  },
  'отслеживание стабильности работы приложения через локальный GlitchTip.': {
    kk: 'қолданбаның жұмыс тұрақтылығын жергілікті GlitchTip арқылы бақылау.',
    en: 'tracking the stability of the application through the local GlitchTip.',
  },
  '10.2. Вы можете в любой момент удалить файлы cookie или заблокировать их сохранение через настройки своего интернет-браузера. При отключении обязательных cookie авторизация в Сервисе может стать недоступной.':
    {
      kk: '10.2. Сіз кез келген уақытта cookie файлдарын жоя аласыз немесе интернет-браузеріңіздің баптаулары арқылы олардың сақталуын бұғаттай аласыз. Міндетті cookie-лерді өшіргенде Қызметке кіру мүмкін болмай қалуы мүмкін.',
      en: '10.2. You may delete cookies or block their storage at any time through your browser settings. If you disable essential cookies, signing in to the Service may become unavailable.',
    },
  '11. Изменение политики конфиденциальности': {
    kk: '11. Құпиялық саясатын өзгерту',
    en: '11. Changes to this privacy policy',
  },
  '11.1. Мы оставляем за собой право вносить изменения и дополнения в настоящую Политику в связи с обновлением функционала платформы, изменением требований законодательства Республики Казахстан или внедрением новых мер защиты.':
    {
      kk: '11.1. Біз платформа функционалын жаңартуға, Қазақстан Республикасы заңнамасының талаптары өзгеруге немесе жаңа қорғау шараларын енгізуге байланысты осы Саясатқа өзгерістер мен толықтырулар енгізу құқығын өзімізде қалдырамыз.',
      en: '11.1. We reserve the right to make changes and additions to this Policy in connection with updates to the platform’s functionality, changes in the requirements of the legislation of the Republic of Kazakhstan, or the introduction of new protection measures.',
    },
  '11.2. Новая редакция Политики вступает в силу с момента ее размещения на сайте Сервиса, если иное не предусмотрено новой редакцией. Дата актуальной редакции всегда указывается в начале документа.':
    {
      kk: '11.2. Саясаттың жаңа редакциясы жаңа редакцияда өзгеше көзделмесе, оны Қызмет сайтында жариялаған сәттен бастап күшіне енеді. Қолданыстағы редакцияның күні әрқашан құжаттың басында көрсетіледі.',
      en: '11.2. The new version of the Policy takes effect from the moment it is published on the Service’s website, unless the new version provides otherwise. The date of the current version is always stated at the beginning of the document.',
    },
  '11.3. При внесении существенных изменений мы уведомим пользователей сообщением в личном кабинете или через указанные каналы связи. Продолжение использования Сервиса после вступления изменений в силу означает полное согласие с обновленной редакцией.':
    {
      kk: '11.3. Маңызды өзгерістер енгізген кезде біз пайдаланушыларды жеке кабинетте хабарлама арқылы немесе көрсетілген байланыс арналары арқылы хабардар етеміз. Өзгерістер күшіне енгеннен кейін Қызметті пайдалануды жалғастыру жаңартылған редакциямен толық келісетіндігіңізді білдіреді.',
      en: '11.3. When making material changes, we will notify users by a message in their personal dashboard or through the stated contact channels. Continued use of the Service after the changes take effect means full acceptance of the updated version.',
    },
}
