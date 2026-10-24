import { registerContentTranslations } from '@/lib/i18n'

import batch01 from './batch-01.json'
import batch02 from './batch-02.json'
import batch03 from './batch-03.json'
import batch04 from './batch-04.json'
import batch05 from './batch-05.json'
import batch06 from './batch-06.json'
import batch07 from './batch-07.json'
import batch08 from './batch-08.json'

// Database-saved hints and explanations are stored in Russian; these batches
// carry their Kazakh and English translations. Importing this module registers
// them for tr() — keep it out of shared chunks so only review routes load it.
registerContentTranslations(batch01)
registerContentTranslations(batch02)
registerContentTranslations(batch03)
registerContentTranslations(batch04)
registerContentTranslations(batch05)
registerContentTranslations(batch06)
registerContentTranslations(batch07)
registerContentTranslations(batch08)

export {}
