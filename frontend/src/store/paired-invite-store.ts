import { create } from 'zustand'
import type { PairedInvitePayload } from '@/lib/pairing-api'

type PairedInviteState = {
	invite: PairedInvitePayload | null
	setInvite: (invite: PairedInvitePayload | null) => void
}

export const usePairedInviteStore = create<PairedInviteState>((set) => ({
	invite: null,
	setInvite: (invite) => set({ invite }),
}))
