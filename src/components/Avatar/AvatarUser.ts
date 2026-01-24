import type { Gender } from '../input/Gender/FieldGender.vue';
import { generaColoreDarkenHex } from '../testUtility/generaColore'
const svgRaw = import.meta.glob('/public/img/avatar/*.svg', { as: 'raw', eager: true }) as Record<string, string>


// helper: carica SVG e ritorna stringa (inline)
// NB: qui uso import.meta.glob per prendere gli svg come raw string (Vite)
// const svgRaw = import.meta.glob('/public/img/avatar/*.svg', { as: 'raw', eager: true }) as Record<string, string>

export type AvatarSvgName = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
export const AvatarSvgMale: AvatarSvgName[] = ['1', '2', '3', '4', '5', '6'] as const;
export const AvatarSvgFemale: AvatarSvgName[] = ['7', '8', '9', '10', '11', '12'] as const;
export const AvatarSvgName = [...AvatarSvgMale, ...AvatarSvgFemale] as const;

export interface AvatarColors {
  bg: string
  skin: string
  skinD: string
  hair: string
  shirt: string
};

export const AVATAR_BG_COLORS = '#dfdbcc'
export const AVATAR_SKIN_COLORS = [
  '#fbd5c0',
  '#f79b68',
  '#ba5c21',
]

export const AVATAR_HAIR_COLORS = [
  '#1C1C1C',
  '#fac565',
  '#331520',
  '#ed451d',
  '#23255d',
]

export const AVATAR_SHIRT_COLORS = [
  '#1E88E5', // blue
  '#D32F2F', // red
  '#388E3C', // green
  '#FBC02D', // yellow
  '#7B1FA2', // purple
  '#F57C00', // orange
  '#00838F', // teal
  '#5D4037', // brown
  '#455A64', // blue grey
  '#C2185B', // pink
  '#512DA8', // deep purple
  '#1976D2', // royal blue
  '#AFB42B', // lime
  '#00796B', // dark teal
  '#E64A19', // deep orange
  '#2E7D32', // dark green
  '#6A1B9A', // violet
  '#283593', // indigo
  '#9E9D24', // olive
  '#BF360C', // burnt orange
  '#00695C', // petrol
  '#4E342E', // dark brown
  '#37474F', // charcoal
  '#8E24AA', // magenta
  '#C62828', // crimson
  '#1565C0', // strong blue
  '#558B2F', // moss green
  '#F9A825', // mustard
  '#AD1457', // wine
  '#263238', // almost black
]


export type AvatarUserInit = {
  name: AvatarSvgName
  bg: string
  skin: string
  skinD?: string
  hair: string
  shirt: string
}

export class AvatarUser {
  name: AvatarSvgName
  bg: string
  skin: string
  skinD: string
  hair: string
  shirt: string

  constructor(init: AvatarUserInit) {
    this.name = init.name
    this.bg = init.bg
    this.skin = init.skin
    this.skinD = init.skinD ?? generaColoreDarkenHex(init.skin)
    this.hair = init.hair
    this.shirt = init.shirt
  }

  get html(): string {
    return svgRaw[`/public/img/avatar/${this.name}.svg`] ?? ''
  }

  get style(): Record<string, string> {
    return {
      '--av-bg': this.bg,
      '--av-skin': this.skin,
      '--av-skinD': this.skinD,
      '--av-hair': this.hair,
      '--av-shirt': this.shirt,
    }
  }

  private static randomFrom<T>(arr: readonly T[]): T {
    if (arr.length === 0) {
      throw new Error('Array vuoto');
    }
    return arr[Math.floor(Math.random() * arr.length)]!;
  }

  static randomSvg(gender?: Gender): AvatarSvgName {
    switch (gender) {
      case 'm':
        return this.randomFrom(AvatarSvgMale)
      case 'f':
        return this.randomFrom(AvatarSvgFemale)
      default:
        return this.randomFrom(AvatarSvgName)
    }
  }

  static randomSkin() {
    return this.randomFrom(AVATAR_SKIN_COLORS)
  }

  static getSkinD(skin: string): string {
    return generaColoreDarkenHex(skin)
  }

  static randomHair(): string {
    return this.randomFrom(AVATAR_HAIR_COLORS)
  }

  static randomShirt(): string {
    return this.randomFrom(AVATAR_SHIRT_COLORS)
  }

  static randomColors(bg: string = AVATAR_BG_COLORS): AvatarColors {
    const skin = this.randomSkin()
    return {
      bg,
      skin,
      skinD: this.getSkinD(skin),
      hair: this.randomHair(),
      shirt: this.randomShirt(),
    }
  }

  static createRandom(
    opts?: { bg?: string; name?: AvatarSvgName, gender?: Gender },
  ): AvatarUser {
    const name =
      opts?.name ??
      this.randomSvg(opts?.gender);
    const colors = this.randomColors(opts?.bg ?? AVATAR_BG_COLORS)
    return new AvatarUser({ name, ...colors })
  }

  static getAll(bg: string = AVATAR_BG_COLORS): AvatarUser[] {
    return AvatarSvgName.map((name) => this.createRandom({ name, bg }))
  }

  static defaultColor(bg: string = AVATAR_BG_COLORS): AvatarColors {
    return {
      bg,
      skin: '#cfcfcf',
      skinD: '#b5b5b5',
      hair: '#8a8a8a',
      shirt: '#9e9e9e',
    }
  }

  setRandomColors(bg: string = AVATAR_BG_COLORS): AvatarColors {
    const newColors = AvatarUser.randomColors(bg)
    this.bg = newColors.bg
    this.skin = newColors.skin
    this.skinD = newColors.skinD
    this.hair = newColors.hair
    this.shirt = newColors.shirt
    return newColors
  }
}

export const defaultAvatar = new AvatarUser({
  name: '1',
  ...AvatarUser.defaultColor()
})
