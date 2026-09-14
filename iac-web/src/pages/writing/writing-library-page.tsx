import {
  Edit2,
} from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorState, EmptyState, LibraryCardsSkeleton } from '@/features/attempts/attempt-ui'
import { useAuth } from '@/features/auth/auth-store'
import { listPublicWritingMaterials, writingKeys } from '@/features/writing/api'
import { getErrorMessage } from '@/lib/api/client'

export function WritingLibraryPage() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: writingKeys.publicMaterials,
    queryFn: ({ signal }) => listPublicWritingMaterials(signal),
  })
  const materials = (query.data?.items ?? []).filter(
    (material) => !user?.examType || material.examType === user.examType,
  )

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.025em] text-[#111111]">
          Выберите Writing-тренировку
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#69696d]">
          Выполните Task 1 и Task 2 в экзаменационном темпе и получите разбор по
          четырём критериям IELTS.
        </p>
      </div>
      {query.isPending ? (
        <LibraryCardsSkeleton />
      ) : query.isError ? (
        <ErrorState
          title="Не удалось загрузить Writing-материалы"
          message={getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : materials.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {materials.map((material) => (
            <Card
              key={material.id}
              className="group gap-0 rounded-[16px] border border-[#e7e7e4] bg-white py-0 shadow-[0_10px_36px_rgba(17,17,17,0.035)] transition-all duration-200 hover:border-slate-300 hover:shadow-[0_14px_40px_rgba(17,17,17,0.055)]"
            >
              <CardContent className="flex h-full flex-col justify-between gap-4 p-5 sm:p-6">
                <div className="flex items-start gap-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#f4f4f1] text-[#69696d] transition-all duration-200 group-hover:bg-[#eff6ff] group-hover:text-[#3b82f6] group-hover:scale-105">
                    <Edit2 className="size-5 transition-colors" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold tracking-[-0.01em] text-[#111111] transition-colors group-hover:text-[#3b82f6]">
                        {material.title}
                      </h3>
                      <span className="shrink-0 rounded-full border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {material.examType === 'academic' ? 'Academic' : 'General'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#808084]">
                      Сложность: {material.difficulty}
                    </p>
                    {material.description ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#69696d]">
                        {material.description}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex justify-end border-t border-[#ededeb] pt-3">
                  <Button asChild className="h-10 rounded-[9px] bg-[#3b82f6] px-5 shadow-none hover:bg-[#2563eb]">
                    <Link
                      to="/exam/writing/$materialId"
                      params={{ materialId: material.id }}
                    >
                      Начать Writing
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
