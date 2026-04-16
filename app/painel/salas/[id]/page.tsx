import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { db } from "@/servidor/banco/cliente"
import { VideoRoom } from "@/componentes/video/sala-video-webrtc"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export default async function SalaVideoPage({ params }: Props) {
  const session = await getServerSession(opcoesAuth)
  if (!session?.user) redirect("/login")

  const { id } = await params

  const sala = await db.sala.findUnique({
    where: { id },
    select: {
      id:    true,
      nome:  true,
      codigo: true,
      ativa: true,
      empresaId: true,
    },
  })

  if (!sala || !sala.ativa) notFound()

  // Isolamento de tenant: superAdmin acessa qualquer sala;
  // demais só acessam salas da própria empresa
  const pertenceEmpresa =
    session.user.superAdmin ||
    !sala.empresaId ||
    sala.empresaId === session.user.empresaId

  if (!pertenceEmpresa) redirect("/painel/salas")

  return (
    <VideoRoom
      salaId={sala.id}
      salaCodigo={sala.codigo}
      nomeSala={sala.nome}
      userName={session.user.name ?? "Usuário"}
    />
  )
}
