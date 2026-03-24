import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { VideoRoom } from "@/components/dashboard/VideoRoom"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ join?: string }>
}

export default async function SalaVideoPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  const { id } = await params
  const { join } = await searchParams

  const sala = await db.sala.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      codigo: true,
      ativa: true,
    },
  })

  if (!sala || !sala.ativa) {
    notFound()
  }

  return (
    <VideoRoom
      salaId={sala.id}
      salaCodigo={sala.codigo}
      nomeSala={sala.nome}
      userName={session.user.name ?? "Usuário"}
    />
  )
}
