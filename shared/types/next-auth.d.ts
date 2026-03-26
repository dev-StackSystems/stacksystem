import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id:           string
      name:         string
      email:        string
      role:         string
      isSuperAdmin: boolean   // Acesso irrestrito a todas as empresas (apenas desenvolvedor/i3)
      empresaId:    string | null
      grupoId:      string | null
      setorId:      string | null
      grupoIsAdmin: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:           string
    role:         string
    isSuperAdmin: boolean
    empresaId:    string | null
    grupoId:      string | null
    setorId:      string | null
    grupoIsAdmin: boolean
  }
}
