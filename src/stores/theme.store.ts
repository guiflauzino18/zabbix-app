import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand"
import { persist, createJSONStorage } from 'zustand/middleware';

const STORAGE_KEY = 'zabbix-app/theme'

interface ThemeState {
    mode: 'dark' | 'light'
    toggleTheme(): void
}

export const useThemeStore = create<ThemeState>()(
        persist((set, get) => ({
            mode: 'light',
            toggleTheme: ()=> {
                set({mode: get().mode === 'light' ? 'dark' : 'light'})
                
            }
       }),
       {
        name: STORAGE_KEY,
        storage: createJSONStorage(() => AsyncStorage),
       }
    
    )
    
)