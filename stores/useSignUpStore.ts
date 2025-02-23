// stores/useSignUpStore.ts
import { create } from 'zustand';

type SignUpState = {
  step: number;
  formData: {
    email: string;
    password: string;
    name: string;
    organizationName: string;
    subdomain: string;
    vas: string[]; // Emails of VAs to invite
    leads: File | null; // Uploaded lead list
  };
  setFormData: (data: Partial<SignUpState['formData']>) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
};

export const useSignUpStore = create<SignUpState>((set) => ({
  step: 1,
  formData: {
    email: '',
    password: '',
    name: '',
    organizationName: '',
    subdomain: '',
    vas: [],
    leads: null,
  },
  setFormData: (data) =>
    set((state) => ({ formData: { ...state.formData, ...data } })),
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: state.step - 1 })),
  reset: () =>
    set({
      step: 1,
      formData: {
        email: '',
        password: '',
        name: '',
        organizationName: '',
        subdomain: '',
        vas: [],
        leads: null,
      },
    }),
}));