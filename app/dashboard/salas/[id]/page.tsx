import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import { authOptions } from "@/backend/auth/nextauth-config"
import { db } from "@/backend/database/prisma-client"
import { VideoRoom } from "@/frontend/video/webrtc-video-room"

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
