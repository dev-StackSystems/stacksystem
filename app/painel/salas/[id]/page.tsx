import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { db } from "@/servidor/banco/cliente"
import { VideoRoom } from "@/componentes/video/sala-video-webrtc"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ join?: string }>
}

export default async function SalaVideoPage({ params, searchParams }: Props) {
  const session = await getServerSession(opcoesAuth)
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
      criadoPorId: true,
    },
  })

  if (!sala || !sala.ativa) {
    notFound()
  }

  const PAPEIS_INTERNOS = ["A", "T", "I"]
  const ehInterno = session.user.superAdmin || PAPEIS_INTERNOS.includes(session.user.papel ?? "")

  // Externo sem código de convite → não pode entrar diretamente
  if (!ehInterno && !join) {
    redirect("/painel/salas")
  }

  // Dono da sala entra como caller; externos sempre como callee (via link)
  const ehDono = ehInterno && (sala.criadoPorId === session.user.id || session.user.superAdmin === true)

  return (
    <VideoRoom
      salaId={sala.id}
      salaCodigo={sala.codigo}
      nomeSala={sala.nome}
      userName={session.user.name ?? "Usuário"}
      ehDono={ehDono}
    />
  )
}
