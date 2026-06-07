// src/pages/nutricion/components/BadgesNutricion.jsx
import { Ban, AlertTriangle, CheckCircle2, Clock, FolderArchive } from 'lucide-react'

export function BadgeSeveridad({ severidad }) {
  const obligatorio = severidad === 'obligatorio'
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border
      ${obligatorio
        ? 'bg-danger-100 text-danger-600 border-danger-600/20'
        : 'bg-alert-100 text-alert-600 border-alert-600/20'}`}>
      {obligatorio ? <Ban size={12} /> : <AlertTriangle size={12} />}
      {obligatorio ? 'Obligatorio' : 'Recomendado'}
    </span>
  )
}

export function BadgeEstadoAlimento({ estado }) {
  const cfg = {
    activo:    { cls: 'bg-health-100 text-health-600 border-health-600/20', Icon: CheckCircle2,  label: 'Activo' },
    pendiente: { cls: 'bg-alert-100 text-alert-600 border-alert-600/20',    Icon: Clock,         label: 'Pendiente' },
    archivado: { cls: 'bg-gray-100 text-gray-500 border-gray-300',          Icon: FolderArchive, label: 'Archivado' },
  }
  const { cls, Icon, label } = cfg[estado] || cfg.archivado
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      <Icon size={12} /> {label}
    </span>
  )
}

export function BadgeEstadoPlantilla({ estado }) {
  const cfg = {
    pendiente: { cls: 'bg-alert-100 text-alert-600 border-alert-600/20',    Icon: Clock,        label: 'Pendiente' },
    aprobado:  { cls: 'bg-health-100 text-health-600 border-health-600/20', Icon: CheckCircle2, label: 'Aprobado' },
    rechazado: { cls: 'bg-danger-100 text-danger-600 border-danger-600/20', Icon: Ban,          label: 'Rechazado' },
  }
  const { cls, Icon, label } = cfg[estado] || cfg.pendiente
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      <Icon size={12} /> {label}
    </span>
  )
}

export function BadgeEstadoRestriccion({ estado }) {
  const cfg = {
    activo:    { cls: 'bg-health-100 text-health-600 border-health-600/20', Icon: CheckCircle2,  label: 'Activa' },
    archivado: { cls: 'bg-gray-100 text-gray-500 border-gray-300',          Icon: FolderArchive, label: 'Archivada' },
  }
  const { cls, Icon, label } = cfg[estado] || cfg.archivado
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      <Icon size={12} /> {label}
    </span>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-10 h-10 rounded-full border-[3px] border-cream-400 border-t-warm-500 animate-spin" />
    </div>
  )
}

export function Empty({ icon, texto }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3">
      <span className="text-4xl">{icon}</span>
      <p className="text-warm-400 text-sm">{texto}</p>
    </div>
  )
}
