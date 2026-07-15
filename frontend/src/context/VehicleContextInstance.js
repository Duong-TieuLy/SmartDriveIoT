import { createContext, useContext } from 'react'

export const VehicleContext = createContext(null)

export function useVehicles() {
  const ctx = useContext(VehicleContext)
  if (!ctx) {
    throw new Error('useVehicles phải được dùng bên trong <VehicleProvider>')
  }
  return ctx
}