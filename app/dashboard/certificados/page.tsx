import { db } from "@/backend/database/prisma-client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/backend/auth/nextauth-config"
import { redirect } from "next/navigation"
import { Award } from "lucide-react"

export default async function CertificadosPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")

  const certificados = await db.certificado.findMany({
    include: {
      aluno: { select: { nome: true, email: true } },
      empCurso: { select: { nome: true, empresa: { select: { nome: true } } } },
    },
    orderBy: { dataEmissao: "desc" },
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-slate-900">Certificados</h1>
        <p className="text-sm text-slate-400 mt-0.5">Certificados emitidos pela plataforma</p>
      </div>

      {certificados.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-10 flex flex-col items-center text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4">
            <Award size={24} className="text-amber-500" />
          </div>
          <h2 className="font-serif text-lg font-bold text-slate-800 mb-2">Nenhum certificado emitido ainda.</h2>
          <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
            Os certificados aparecerão aqui assim que forem emitidos para os alunos.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Aluno
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Curso
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                    Código
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Data de Emissão
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {certificados.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Aluno */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{cert.aluno.nome}</p>
                      <p className="text-xs text-slate-400">{cert.aluno.email}</p>
                    </td>

                    {/* Curso */}
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{cert.empCurso.nome}</p>
                      <p className="text-xs text-slate-400">{cert.empCurso.empresa.nome}</p>
                    </td>

                    {/* Código */}
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="font-mono text-xs text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded">
                        {cert.codigo.slice(0, 20)}…
                      </span>
                    </td>

                    {/* Data de Emissão */}
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(cert.dataEmissao).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Emitido
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rodapé */}
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-400">
              {certificados.length} certificado{certificados.length !== 1 ? "s" : ""} emitido
              {certificados.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
