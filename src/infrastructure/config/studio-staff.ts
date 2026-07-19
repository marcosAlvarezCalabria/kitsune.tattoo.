export interface StudioStaffMember {
  readonly name: string;
  readonly handle: string;
  readonly fullName: string;
  readonly role: string;
  readonly intro: string;
  readonly style: string;
  readonly theme: "rodri" | "viktor" | "lala";
  readonly profileUrl: string;
  readonly secondaryProfile?: {
    readonly handle: string;
    readonly url: string;
    readonly label: string;
  };
  readonly portfolioImages?: readonly string[];
  readonly profileVideo?: {
    readonly videoPath: string;
    readonly posterPath: string;
  };
  readonly profileImage?: {
    readonly imagePath: string;
    readonly alt: string;
  };
}

// Supplied and confirmed by the studio. Lala's tattoo style remains intentionally unspecified.
export const STUDIO_STAFF: readonly StudioStaffMember[] = [
  {
    name: "Rodri",
    handle: "caradecuero",
    fullName: "Rodrigo Lopez",
    role: "Gerente y tatuador principal",
    intro: "Para el esto no es un trabajo, es un modo de vida, y se nota en cada pieza.",
    style: "Rey del New School y el cartoon a color: cultura pop, anime y guinos japoneses con un color que no pasa desapercibido.",
    theme: "rodri",
    profileUrl: "https://www.instagram.com/caradecuero/",
    portfolioImages: Array.from(
      { length: 25 },
      (_, index) => `assets/artists/rodri_caradecuero/rodri_caradecuero_${String(index + 1).padStart(2, "0")}.jpg`
    ),
    profileVideo: {
      videoPath: "assets/artists/rodri_caradecuero/rodri-process.mp4",
      posterPath: "assets/artists/rodri_caradecuero/rodri-process-poster.jpg"
    },
    profileImage: {
      imagePath: "assets/artists/rodri_caradecuero/rodri-profile.jpg",
      alt: "Rodri, tatuador de Kitsune Tattoo"
    }
  },
  {
    name: "Viktor",
    handle: "vkonantattoo",
    fullName: "Viktor Konan",
    role: "Tatuador",
    intro: "Artista todoterreno de retratos, personajes y universo geek.",
    style: "Realismo a color en su cuenta principal y blackwork puro en @viktorvlack. Su especialidad: dar una segunda vida a coberturas imposibles y clavar el freehand.",
    theme: "viktor",
    profileUrl: "https://www.instagram.com/vkonantattoo/",
    secondaryProfile: {
      handle: "viktorvlack",
      url: "https://www.instagram.com/viktorvlack/",
      label: "Blackwork y black & grey"
    },
    portfolioImages: [
      "assets/artists/viktor/viktor_vkonantattoo_03.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_04.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_05.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_06.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_07.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_08.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_09.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_10.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_11.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_12.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_13.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_14.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_15.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_16.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_17.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_18.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_19.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_20.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_21.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_22.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_23.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_24.jpg",
      "assets/artists/viktor/viktor_vkonantattoo_25.jpg"
    ],
    profileImage: {
      imagePath: "assets/artists/viktor/viktor-profile.jpg",
      alt: "Viktor, tatuador de Kitsune Tattoo"
    },
    profileVideo: {
      videoPath: "assets/artists/viktor/viktor-process.mp4",
      posterPath: "assets/artists/viktor/viktor-process-poster.jpg"
    }
  },
  {
    name: "Lalatxu",
    handle: "lalatxu",
    fullName: "Lala Gil Gonzalez",
    role: "Tatuadora y gerente",
    intro: "Gerente, tatuadora y el alma que mantiene la guarida en marcha.",
    style: "Su estilo de tatuaje esta pendiente de confirmar. Tambien crea bisuteria artesanal de piezas unicas en @malamente_creaciones.",
    theme: "lala",
    profileUrl: "https://www.instagram.com/lalatxu/",
    secondaryProfile: {
      handle: "malamente_creaciones",
      url: "https://www.instagram.com/malamente_creaciones/",
      label: "Bisuteria artesanal"
    },
    profileImage: {
      imagePath: "assets/artists/lala/lala-profile.jpg",
      alt: "Lala, tatuadora y gerente de Kitsune Tattoo"
    }
  }
];
