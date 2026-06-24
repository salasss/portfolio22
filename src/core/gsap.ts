// Point d'entrée GSAP centralisé : enregistre les plugins une seule fois.
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Easing maître du projet (≈ expo.out).
gsap.defaults({ ease: 'expo.out', duration: 0.9 })

export { gsap, ScrollTrigger }
