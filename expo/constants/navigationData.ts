/**
 * CMS-ready navigation data.
 *
 * These arrays act as a temporary in-memory database for the header
 * navigation. They are intentionally shaped like a future Supabase / CMS
 * payload so that swapping in a real backend fetch later is a one-line
 * change.
 */

export type DepartmentKey = 'men' | 'women' | 'kids';

export interface DepartmentItem {
  id: DepartmentKey;
  label: string;
  labelKey: string;
  url: string;
}

export interface NavCategoryItem {
  id: string;
  label: string;
  labelKey: string;
  url: string;
}

export const departmentsData: DepartmentItem[] = [
  { id: 'men', label: 'ERKAKLAR', labelKey: 'deptMen', url: '/showroom/men' },
  { id: 'women', label: 'AYOLLAR', labelKey: 'deptWomen', url: '/showroom/women' },
  { id: 'kids', label: 'BOLALAR', labelKey: 'deptKids', url: '/showroom/kids' },
];

export const categoriesData: Record<DepartmentKey, NavCategoryItem[]> = {
  men: [
    { id: 'pants', label: 'SHIM', labelKey: 'navPants', url: '/catalog/men/pants' },
    { id: 'tshirt', label: 'FUTBOLKA', labelKey: 'navTshirt', url: '/catalog/men/tshirt' },
    { id: 'pajama', label: 'PIJAMA', labelKey: 'navPajama', url: '/catalog/men/pajama' },
  ],
  women: [
    { id: 'robe', label: 'XALAT', labelKey: 'navRobe', url: '/catalog/women/robe' },
    { id: 'tunika', label: 'TUNIKA', labelKey: 'navTunika', url: '/catalog/women/tunika' },
    { id: 'ishton', label: 'ISHTON', labelKey: 'navIshton', url: '/catalog/women/ishton' },
    { id: 'pajama', label: 'PIJAMA', labelKey: 'navPajama', url: '/catalog/women/pajama' },
    { id: 'tshirt', label: 'FUTBOLKA', labelKey: 'navTshirt', url: '/catalog/women/tshirt' },
    { id: 'sarochka', label: 'SAROCHKA', labelKey: 'navSarochka', url: '/catalog/women/sarochka' },
  ],
  kids: [
    { id: 'tshirt', label: 'FUTBOLKA', labelKey: 'navTshirt', url: '/catalog/kids/tshirt' },
    { id: 'pajama', label: 'PIJAMA', labelKey: 'navPajama', url: '/catalog/kids/pajama' },
  ],
};

/**
 * Mega menu CMS payload. Keyed by department, then by the category `id`
 * (matching `categoriesData` ids), so a future CMS row can resolve the
 * correct dropdown without depending on the (translatable) label.
 */
export interface MegaMenuLinkItem {
  label: string;
  url: string;
}

export interface MegaMenuColumn {
  title: string;
  links: MegaMenuLinkItem[];
}

export interface MegaMenuPromo {
  imageUrl: string;
  title: string;
  alt: string;
  url: string;
}

export interface MegaMenuEntry {
  columns: MegaMenuColumn[];
  promo: MegaMenuPromo;
}

export type MegaMenuData = Record<DepartmentKey, Record<string, MegaMenuEntry>>;

export const megaMenuData: MegaMenuData = {
  men: {
    pants: {
      columns: [
        {
          title: 'TURLARI',
          links: [
            { label: 'Klassik shimlar', url: '/catalog/men/pants?type=classic' },
            { label: 'Sport shimlar', url: '/catalog/men/pants?type=sport' },
            { label: 'Uy shimlari', url: '/catalog/men/pants?type=home' },
            { label: 'Pijama shimlari', url: '/catalog/men/pants?type=pajama' },
          ],
        },
      ],
      promo: {
        imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80',
        title: 'YANGI ERKAKLAR KOLLEKSIYASI',
        alt: 'Milana Premium yangi erkaklar shim kolleksiyasi',
        url: '/catalog/men/pants?promo=new',
      },
    },
    tshirt: {
      columns: [
        {
          title: 'TURLARI',
          links: [
            { label: 'Polo futbolkalar', url: '/catalog/men/tshirt?type=polo' },
            { label: 'Klassik futbolkalar', url: '/catalog/men/tshirt?type=classic' },
            { label: 'Oversize futbolkalar', url: '/catalog/men/tshirt?type=oversize' },
            { label: 'Sport futbolkalar', url: '/catalog/men/tshirt?type=sport' },
          ],
        },
      ],
      promo: {
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
        title: 'PREMIUM FUTBOLKALAR',
        alt: 'Milana Premium erkaklar futbolkalar kolleksiyasi',
        url: '/catalog/men/tshirt?promo=premium',
      },
    },
    pajama: {
      columns: [
        {
          title: 'TURLARI',
          links: [
            { label: "To'plam pijamalar", url: '/catalog/men/pajama?type=set' },
            { label: "Pijama ko'ylagi", url: '/catalog/men/pajama?type=shirt' },
            { label: 'Pijama shimi', url: '/catalog/men/pajama?type=pants' },
            { label: 'Qisqa pijamalar', url: '/catalog/men/pajama?type=short' },
          ],
        },
      ],
      promo: {
        imageUrl: 'https://images.unsplash.com/photo-1616627577385-5c0c4dab983c?w=600&q=80',
        title: 'QULAY UYQU KIYIMI',
        alt: 'Milana Premium qulay erkaklar pijama kolleksiyasi',
        url: '/catalog/men/pajama?promo=comfort',
      },
    },
  },
  women: {
    robe: {
      columns: [
        {
          title: 'TURLARI',
          links: [
            { label: 'Qisqa xalatlar', url: '/catalog/women/robe?type=short' },
            { label: 'Uzun xalatlar', url: '/catalog/women/robe?type=long' },
            { label: 'Tugmachali xalatlar', url: '/catalog/women/robe?type=button' },
            { label: 'Kapishonli xalatlar', url: '/catalog/women/robe?type=hooded' },
          ],
        },
      ],
      promo: {
        imageUrl: 'https://images.unsplash.com/photo-1631049552240-59c37f38802b?w=600&q=80',
        title: 'YANGI BAHORGI KOLLEKSIYA',
        alt: 'Milana Premium yangi bahorgi ayollar xalat kolleksiyasi',
        url: '/catalog/women/robe?promo=spring',
      },
    },
    tunika: {
      columns: [
        {
          title: 'TURLARI',
          links: [
            { label: 'Uzun tunikalar', url: '/catalog/women/tunika?type=long' },
            { label: 'Qisqa tunikalar', url: '/catalog/women/tunika?type=short' },
            { label: 'Yengil tunikalar', url: '/catalog/women/tunika?type=light' },
            { label: 'Bezakli tunikalar', url: '/catalog/women/tunika?type=embellished' },
          ],
        },
      ],
      promo: {
        imageUrl: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=600&q=80',
        title: 'ELEGANT TUNIKALAR',
        alt: 'Milana Premium elegant ayollar tunika kolleksiyasi',
        url: '/catalog/women/tunika?promo=elegant',
      },
    },
    ishton: {
      columns: [
        {
          title: 'TURLARI',
          links: [
            { label: 'Klassik ishtonlar', url: '/catalog/women/ishton?type=classic' },
            { label: 'Sport ishtonlar', url: '/catalog/women/ishton?type=sport' },
            { label: 'Uy ishtonlari', url: '/catalog/women/ishton?type=home' },
            { label: 'Yozgi ishtonlar', url: '/catalog/women/ishton?type=summer' },
          ],
        },
      ],
      promo: {
        imageUrl: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?w=600&q=80',
        title: 'ZAMONAVIY ISHTONLAR',
        alt: 'Milana Premium zamonaviy ayollar ishton kolleksiyasi',
        url: '/catalog/women/ishton?promo=modern',
      },
    },
    pajama: {
      columns: [
        {
          title: 'TURLARI',
          links: [
            { label: "To'plam pijamalar", url: '/catalog/women/pajama?type=set' },
            { label: "Pijama ko'ylagi", url: '/catalog/women/pajama?type=shirt' },
            { label: 'Shorts pijama', url: '/catalog/women/pajama?type=shorts' },
            { label: 'Ipak pijamalar', url: '/catalog/women/pajama?type=silk' },
          ],
        },
      ],
      promo: {
        imageUrl: 'https://images.unsplash.com/photo-1573612664822-d7d347da7b80?w=600&q=80',
        title: 'PREMIUM PIJAMALAR',
        alt: 'Milana Premium ayollar pijama kolleksiyasi',
        url: '/catalog/women/pajama?promo=premium',
      },
    },
    tshirt: {
      columns: [
        {
          title: 'TURLARI',
          links: [
            { label: 'Klassik futbolkalar', url: '/catalog/women/tshirt?type=classic' },
            { label: 'Oversize futbolkalar', url: '/catalog/women/tshirt?type=oversize' },
            { label: 'Crop futbolkalar', url: '/catalog/women/tshirt?type=crop' },
            { label: 'Bezakli futbolkalar', url: '/catalog/women/tshirt?type=embellished' },
          ],
        },
      ],
      promo: {
        imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80',
        title: 'AYOLLAR FUTBOLKALARI',
        alt: 'Milana Premium ayollar futbolka kolleksiyasi',
        url: '/catalog/women/tshirt?promo=women',
      },
    },
    sarochka: {
      columns: [
        {
          title: 'TURLARI',
          links: [
            { label: 'Klassik sarochkalar', url: '/catalog/women/sarochka?type=classic' },
            { label: 'Oversize sarochkalar', url: '/catalog/women/sarochka?type=oversize' },
            { label: 'Uzun yengli', url: '/catalog/women/sarochka?type=long-sleeve' },
            { label: 'Qisqa yengli', url: '/catalog/women/sarochka?type=short-sleeve' },
          ],
        },
      ],
      promo: {
        imageUrl: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=600&q=80',
        title: 'ZAMONAVIY SAROCHKALAR',
        alt: 'Milana Premium zamonaviy ayollar sarochka kolleksiyasi',
        url: '/catalog/women/sarochka?promo=modern',
      },
    },
  },
  kids: {
    tshirt: {
      columns: [
        {
          title: 'TURLARI',
          links: [
            { label: 'Bolalar futbolkalari', url: '/catalog/kids/tshirt?type=basic' },
            { label: 'Rasmli futbolkalar', url: '/catalog/kids/tshirt?type=printed' },
            { label: 'Sport futbolkalar', url: '/catalog/kids/tshirt?type=sport' },
          ],
        },
        {
          title: 'YOSH',
          links: [
            { label: '2-4 yosh', url: '/catalog/kids/tshirt?age=2-4' },
            { label: '5-8 yosh', url: '/catalog/kids/tshirt?age=5-8' },
            { label: '9-14 yosh', url: '/catalog/kids/tshirt?age=9-14' },
          ],
        },
      ],
      promo: {
        imageUrl: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&q=80',
        title: 'BOLALAR KOLLEKSIYASI',
        alt: 'Milana Premium bolalar futbolka kolleksiyasi',
        url: '/catalog/kids/tshirt?promo=kids',
      },
    },
    pajama: {
      columns: [
        {
          title: 'TURLARI',
          links: [
            { label: "To'plam pijamalar", url: '/catalog/kids/pajama?type=set' },
            { label: 'Rasmli pijamalar', url: '/catalog/kids/pajama?type=printed' },
            { label: 'Flanel pijamalar', url: '/catalog/kids/pajama?type=flannel' },
          ],
        },
        {
          title: 'YOSH',
          links: [
            { label: '2-4 yosh', url: '/catalog/kids/pajama?age=2-4' },
            { label: '5-8 yosh', url: '/catalog/kids/pajama?age=5-8' },
            { label: '9-14 yosh', url: '/catalog/kids/pajama?age=9-14' },
          ],
        },
      ],
      promo: {
        imageUrl: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&q=80',
        title: 'BOLALAR PIJAMALARI',
        alt: 'Milana Premium bolalar pijama kolleksiyasi',
        url: '/catalog/kids/pajama?promo=kids',
      },
    },
  },
};
